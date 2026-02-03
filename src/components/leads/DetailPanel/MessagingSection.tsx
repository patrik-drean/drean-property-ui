import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button, Stack, CircularProgress } from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';
import { QueueLead } from '../../../types/queue';
import { SectionCard } from './SectionCard';
import { MessageBubble } from './MessageBubble';
import { TemplateChip } from './TemplateChip';
import { smsService } from '../../../services/smsService';
import { SmsMessage, SmsTemplate, TemplateVariables } from '../../../types/sms';
import { CallLeadButton } from '../../voice/CallLeadButton';

interface MessagingSectionProps {
  lead: QueueLead;
  onSendMessage?: (message: string) => void;
}

/**
 * Calculate discounted price (listing price × 0.735) and format in compact "k" format
 */
const calculateDiscountedPrice = (price?: number): string | undefined => {
  if (!price) return undefined;
  const discounted = price * 0.735;
  const roundedThousands = Math.round(discounted / 1000);
  return `$${roundedThousands}k`;
};

/**
 * Extract short address (street address only, no city/state)
 */
const extractShortAddress = (fullAddress?: string): string | undefined => {
  if (!fullAddress) return undefined;
  const parts = fullAddress.split(',');
  return parts[0].trim();
};

/**
 * Get day of the week in MST timezone
 */
const getDayOfWeek = (): string => {
  const now = new Date();
  const mstDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/Denver' }));
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[mstDate.getDay()];
};

/**
 * Substitute template variables in a string
 */
const substituteVariables = (body: string, variables: TemplateVariables): string => {
  let result = body;
  Object.entries(variables).forEach(([key, value]) => {
    if (value) {
      result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    }
  });
  return result;
};

/**
 * MessagingSection - Bottom-left quadrant of the Lead Detail Panel
 *
 * Features:
 * - Real message history from SMS conversations
 * - Quick compose input
 * - Template suggestions with variable substitution
 * - Send button
 */
export const MessagingSection: React.FC<MessagingSectionProps> = ({ lead, onSendMessage }) => {
  const [message, setMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [messages, setMessages] = useState<SmsMessage[]>([]);
  const [templates, setTemplates] = useState<SmsTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  // Build template variables from lead data
  const templateVariables: TemplateVariables = {
    name: undefined, // We don't have seller name in QueueLead
    address: lead.address,
    price: lead.listingPrice ? `$${lead.listingPrice.toLocaleString()}` : undefined,
    phone: lead.sellerPhone,
    discounted_price: calculateDiscountedPrice(lead.listingPrice),
    address_short: extractShortAddress(lead.address),
    day_of_the_week: getDayOfWeek(),
  };

  // Fetch real messages when lead changes
  useEffect(() => {
    const fetchMessages = async () => {
      if (!lead.sellerPhone) {
        setMessages([]);
        setConversationId(null);
        return;
      }

      setLoading(true);
      try {
        const conversation = await smsService.getConversationByPhone(lead.sellerPhone);
        if (conversation) {
          setMessages(conversation.messages || []);
          setConversationId(conversation.conversation.id);
        } else {
          setMessages([]);
          setConversationId(null);
        }
      } catch (error) {
        console.error('Failed to fetch messages:', error);
        setMessages([]);
        setConversationId(null);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [lead.sellerPhone, lead.id]);

  // Fetch templates on mount
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const fetchedTemplates = await smsService.getTemplates();
        setTemplates(fetchedTemplates);
      } catch (error) {
        console.error('Failed to fetch templates:', error);
      }
    };
    fetchTemplates();
  }, []);

  const handleTemplateSelect = (template: SmsTemplate) => {
    const substitutedBody = substituteVariables(template.body, templateVariables);
    setMessage(substitutedBody);
    setSelectedTemplate(template.id);
  };

  const handleSend = () => {
    if (message.trim() && onSendMessage) {
      onSendMessage(message.trim());
      setMessage('');
      setSelectedTemplate(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <SectionCard title="MESSAGING">
      {/* Contact Info with Call Button */}
      {lead.sellerPhone && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Typography variant="caption" sx={{ color: '#8b949e' }}>
            Phone: {lead.sellerPhone}
          </Typography>
          <CallLeadButton lead={lead} iconOnly size="small" />
        </Box>
      )}

      {/* Message History */}
      <Box
        sx={{
          maxHeight: 280,
          overflowY: 'auto',
          mb: 2,
          px: 1,
          '&::-webkit-scrollbar': { width: 4 },
          '&::-webkit-scrollbar-thumb': { bgcolor: '#30363d', borderRadius: 2 },
        }}
      >
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress size={20} sx={{ color: '#8b949e' }} />
          </Box>
        ) : messages.length > 0 ? (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg.body}
              isOutbound={msg.direction === 'outbound'}
              timestamp={msg.createdAt}
              status={msg.status as 'sending' | 'sent' | 'delivered' | 'failed' | undefined}
            />
          ))
        ) : (
          <Typography sx={{ color: '#8b949e', textAlign: 'center', py: 3, fontSize: '0.85rem' }}>
            No messages yet
          </Typography>
        )}
      </Box>

      {/* Quick Compose */}
      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          size="small"
          multiline
          rows={4}
          id="message-input"
          sx={{
            mb: 1,
            '& .MuiOutlinedInput-root': {
              bgcolor: '#21262d',
              fontSize: '0.85rem',
              '& fieldset': { borderColor: '#30363d' },
              '&:hover fieldset': { borderColor: '#4ade80' },
              '&.Mui-focused fieldset': { borderColor: '#4ade80' },
            },
            '& .MuiInputBase-input': { color: '#f0f6fc' },
            '& .MuiInputBase-input::placeholder': { color: '#8b949e' },
          }}
        />
        <Button
          fullWidth
          variant="contained"
          onClick={handleSend}
          disabled={!message.trim()}
          startIcon={<SendIcon />}
          sx={{
            bgcolor: '#4ade80',
            color: '#0d1117',
            textTransform: 'none',
            fontWeight: 600,
            '&:hover': { bgcolor: '#86efac' },
            '&.Mui-disabled': { bgcolor: '#21262d', color: '#484f58' },
          }}
        >
          Send Message
        </Button>
      </Box>

      {/* Template Suggestions - Show all templates */}
      {templates.length > 0 && (
        <Box>
          <Typography
            variant="caption"
            sx={{ color: '#8b949e', mb: 1, display: 'block', fontSize: '0.7rem' }}
          >
            Quick Templates:
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ gap: 0.5 }}>
            {templates.map((template) => (
              <TemplateChip
                key={template.id}
                label={template.name}
                onClick={() => handleTemplateSelect(template)}
                selected={selectedTemplate === template.id}
              />
            ))}
          </Stack>
        </Box>
      )}
    </SectionCard>
  );
};

export default MessagingSection;

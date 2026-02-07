import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, TextField, Button, Stack, CircularProgress, IconButton } from '@mui/material';
import {
  Send as SendIcon,
  Edit as EditIcon,
  Check as CheckIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { QueueLead } from '../../../types/queue';
import { SectionCard } from './SectionCard';
import { MessageBubble } from './MessageBubble';
import { TemplateChip } from './TemplateChip';
import { smsService } from '../../../services/smsService';
import { SmsMessage, SmsTemplate, TemplateVariables } from '../../../types/sms';
import { CallLeadButton } from '../../voice/CallLeadButton';
import { formatPhoneForDisplay } from '../../../utils/phoneUtils';

interface MessagingSectionProps {
  lead: QueueLead;
  onSendMessage?: (message: string) => Promise<boolean>;
  onSellerPhoneChange?: (phone: string) => void;
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
export const MessagingSection: React.FC<MessagingSectionProps> = ({ lead, onSendMessage, onSellerPhoneChange }) => {
  const [message, setMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [messages, setMessages] = useState<SmsMessage[]>([]);
  const [templates, setTemplates] = useState<SmsTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Phone editing state
  const [editingPhone, setEditingPhone] = useState(false);
  const [phoneValue, setPhoneValue] = useState(lead.sellerPhone || '');
  const phoneInputRef = useRef<HTMLInputElement>(null);

  // Reset phone value when lead changes
  useEffect(() => {
    setPhoneValue(lead.sellerPhone || '');
    setEditingPhone(false);
  }, [lead.id, lead.sellerPhone]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (editingPhone && phoneInputRef.current) {
      phoneInputRef.current.focus();
      phoneInputRef.current.select();
    }
  }, [editingPhone]);

  const handlePhoneSave = () => {
    const trimmedPhone = phoneValue.trim();
    onSellerPhoneChange?.(trimmedPhone);
    setEditingPhone(false);
  };

  const handlePhoneCancel = () => {
    setPhoneValue(lead.sellerPhone || '');
    setEditingPhone(false);
  };

  const handlePhoneKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handlePhoneSave();
    } else if (e.key === 'Escape') {
      handlePhoneCancel();
    }
  };

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

  // Fetch messages function (reusable)
  const fetchMessages = async (showLoadingState = true) => {
    if (!lead.sellerPhone) {
      setMessages([]);
      setConversationId(null);
      return;
    }

    if (showLoadingState) setLoading(true);
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
      if (showLoadingState) setLoading(false);
    }
  };

  // Fetch real messages when lead changes
  useEffect(() => {
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

  // Scroll to bottom when messages load
  useEffect(() => {
    if (!loading && messages.length > 0 && messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [loading, messages]);

  const handleTemplateSelect = (template: SmsTemplate) => {
    const substitutedBody = substituteVariables(template.body, templateVariables);
    setMessage(substitutedBody);
    setSelectedTemplate(template.id);
  };

  const handleSend = async () => {
    if (message.trim() && onSendMessage) {
      const success = await onSendMessage(message.trim());
      if (success) {
        setMessage('');
        setSelectedTemplate(null);
        // Refetch messages to show the newly sent message
        await fetchMessages(false);
      }
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
      {/* Contact Info with Call Button and Editable Phone */}
      <Box sx={{ mb: 2 }}>
        {lead.agentName && (
          <Typography variant="caption" sx={{ color: '#f0f6fc', display: 'block', mb: 0.5 }}>
            {lead.agentName}
          </Typography>
        )}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {editingPhone ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flex: 1 }}>
              <TextField
                inputRef={phoneInputRef}
                value={phoneValue}
                onChange={(e) => setPhoneValue(e.target.value)}
                onKeyDown={handlePhoneKeyDown}
                size="small"
                placeholder="Enter phone number"
                sx={{
                  flex: 1,
                  '& .MuiOutlinedInput-root': {
                    height: 32,
                    bgcolor: '#161b22',
                    '& fieldset': { borderColor: '#30363d' },
                    '&:hover fieldset': { borderColor: '#4ade80' },
                    '&.Mui-focused fieldset': { borderColor: '#4ade80' },
                  },
                  '& .MuiInputBase-input': {
                    color: '#f0f6fc',
                    fontSize: '0.85rem',
                    p: '6px 10px',
                  },
                }}
              />
              <IconButton
                size="small"
                onClick={handlePhoneSave}
                sx={{ color: '#4ade80', p: 0.5 }}
              >
                <CheckIcon sx={{ fontSize: 18 }} />
              </IconButton>
              <IconButton
                size="small"
                onClick={handlePhoneCancel}
                sx={{ color: '#8b949e', p: 0.5 }}
              >
                <CloseIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Box>
          ) : (
            <>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  cursor: onSellerPhoneChange ? 'pointer' : 'default',
                  '&:hover .edit-icon': { opacity: 1 },
                }}
                onClick={() => onSellerPhoneChange && setEditingPhone(true)}
              >
                <Typography variant="body2" sx={{ color: lead.sellerPhone ? '#f0f6fc' : '#8b949e', fontWeight: 500 }}>
                  {formatPhoneForDisplay(lead.sellerPhone) || 'No phone number'}
                </Typography>
                {onSellerPhoneChange && (
                  <EditIcon
                    className="edit-icon"
                    sx={{
                      fontSize: 14,
                      color: '#8b949e',
                      opacity: 0,
                      transition: 'opacity 0.2s',
                      '&:hover': { color: '#4ade80' },
                    }}
                  />
                )}
              </Box>
              {lead.sellerPhone && (
                <CallLeadButton lead={lead} iconOnly size="small" />
              )}
            </>
          )}
        </Box>
      </Box>

      {/* Message History */}
      <Box
        ref={messagesContainerRef}
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

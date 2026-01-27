import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Stack } from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';
import { QueueLead } from '../../../types/queue';
import { SectionCard } from './SectionCard';
import { MessageBubble } from './MessageBubble';
import { TemplateChip } from './TemplateChip';

// Message templates for quick selection
const TEMPLATES = {
  initial:
    "Hi! I noticed your property at {address}. I'm an investor looking to buy properties in the area. Would you be open to discussing a quick cash sale?",
  followUp:
    "Following up on my previous message about your property. I'm still interested and can close quickly. Would you have a few minutes to chat?",
  price:
    "Thank you for responding. Based on my analysis, I'm looking at an offer around {mao}. This accounts for needed repairs and market conditions. Would this work for you?",
};

// Mock message interface
interface Message {
  id: string;
  body: string;
  direction: 'inbound' | 'outbound';
  timestamp: string;
  status?: 'sending' | 'sent' | 'delivered' | 'failed';
}

interface MessagingSectionProps {
  lead: QueueLead;
  onSendMessage?: (message: string) => void;
}

/**
 * MessagingSection - Bottom-left quadrant of the Lead Detail Panel
 *
 * Features:
 * - Message history preview (last 3 messages)
 * - Quick compose input
 * - Template suggestions
 * - Send button
 */
export const MessagingSection: React.FC<MessagingSectionProps> = ({ lead, onSendMessage }) => {
  const [message, setMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  // Mock recent messages for demo
  const mockMessages: Message[] =
    lead.status !== 'New'
      ? [
          {
            id: '1',
            body: TEMPLATES.initial.replace('{address}', lead.address.split(',')[0]),
            direction: 'outbound',
            timestamp: lead.lastContactDate || new Date().toISOString(),
            status: 'delivered',
          },
          ...(lead.status === 'Responding' || lead.status === 'Negotiating'
            ? [
                {
                  id: '2',
                  body: "Thanks for reaching out. I'd be interested in hearing more about your offer.",
                  direction: 'inbound' as const,
                  timestamp: lead.respondedDate || new Date().toISOString(),
                },
              ]
            : []),
        ]
      : [];

  const handleTemplateSelect = (templateKey: keyof typeof TEMPLATES) => {
    let templateText = TEMPLATES[templateKey];
    // Replace placeholders
    templateText = templateText.replace('{address}', lead.address.split(',')[0]);
    templateText = templateText.replace('{mao}', `$${(lead.mao ?? 0).toLocaleString()}`);
    setMessage(templateText);
    setSelectedTemplate(templateKey);
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
      {/* Contact Info */}
      {lead.sellerPhone && (
        <Typography variant="caption" sx={{ color: '#8b949e', mb: 2, display: 'block' }}>
          Phone: {lead.sellerPhone}
        </Typography>
      )}

      {/* Message History Preview */}
      <Box
        sx={{
          maxHeight: 180,
          overflowY: 'auto',
          mb: 2,
          px: 1,
          '&::-webkit-scrollbar': { width: 4 },
          '&::-webkit-scrollbar-thumb': { bgcolor: '#30363d', borderRadius: 2 },
        }}
      >
        {mockMessages.length > 0 ? (
          mockMessages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg.body}
              isOutbound={msg.direction === 'outbound'}
              timestamp={msg.timestamp}
              status={msg.status}
            />
          ))
        ) : (
          <Typography sx={{ color: '#8b949e', textAlign: 'center', py: 3, fontSize: '0.85rem' }}>
            No messages yet
          </Typography>
        )}
      </Box>

      {/* Quick Compose */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <TextField
          fullWidth
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          size="small"
          multiline
          maxRows={3}
          id="message-input"
          sx={{
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
          variant="contained"
          onClick={handleSend}
          disabled={!message.trim()}
          sx={{
            bgcolor: '#4ade80',
            color: '#0d1117',
            minWidth: 48,
            px: 1.5,
            '&:hover': { bgcolor: '#86efac' },
            '&.Mui-disabled': { bgcolor: '#21262d', color: '#484f58' },
          }}
        >
          <SendIcon fontSize="small" />
        </Button>
      </Box>

      {/* Template Suggestions */}
      <Box>
        <Typography
          variant="caption"
          sx={{ color: '#8b949e', mb: 1, display: 'block', fontSize: '0.7rem' }}
        >
          Quick Templates:
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <TemplateChip
            label="Initial Outreach"
            onClick={() => handleTemplateSelect('initial')}
            selected={selectedTemplate === 'initial'}
          />
          <TemplateChip
            label="Follow-Up"
            onClick={() => handleTemplateSelect('followUp')}
            selected={selectedTemplate === 'followUp'}
          />
          <TemplateChip
            label="Price Discussion"
            onClick={() => handleTemplateSelect('price')}
            selected={selectedTemplate === 'price'}
          />
        </Stack>
      </Box>
    </SectionCard>
  );
};

export default MessagingSection;

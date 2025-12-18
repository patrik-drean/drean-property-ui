import React, { useEffect, useRef } from 'react';
import { Box, Typography, Chip, Tooltip, IconButton } from '@mui/material';
import {
  Phone as PhoneIcon,
  OpenInNew as OpenInNewIcon,
  MarkAsUnread as MarkAsUnreadIcon,
} from '@mui/icons-material';
import { MessageBubble } from './MessageBubble';
import { MessageComposer } from './MessageComposer';
import { ConversationWithMessages } from '../../types/sms';
import { smsService } from '../../services/smsService';

interface ConversationViewProps {
  conversation: ConversationWithMessages;
  onMessageSent: () => void;
  onMarkAsUnread?: () => void;
  leadName?: string;
  leadAddress?: string;
  leadPrice?: string;
  zillowLink?: string;
}

export const ConversationView: React.FC<ConversationViewProps> = ({
  conversation,
  onMessageSent,
  onMarkAsUnread,
  leadName,
  leadAddress,
  leadPrice,
  zillowLink,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { conversation: conv, messages } = conversation;

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleOpenLead = () => {
    if (conv.propertyLeadId) {
      window.open(`/#/leads?id=${conv.propertyLeadId}`, '_blank');
    }
  };

  const handleOpenContact = () => {
    if (conv.contactId) {
      window.open(`/#/team?contact=${conv.contactId}`, '_blank');
    }
  };

  const handleMarkAsUnread = async () => {
    if (!conv.id) return;

    try {
      await smsService.markConversationUnread(conv.id);
      onMarkAsUnread?.();
    } catch (error) {
      console.error('Failed to mark conversation as unread:', error);
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: '1px solid #e0e0e0',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
        }}
      >
        {zillowLink && (
          <Tooltip title="Open Zillow" arrow>
            <IconButton
              href={zillowLink}
              target="_blank"
              rel="noopener noreferrer"
              size="small"
              sx={{
                backgroundColor: 'rgba(25, 118, 210, 0.08)',
                '&:hover': {
                  backgroundColor: 'rgba(25, 118, 210, 0.15)'
                }
              }}
            >
              <OpenInNewIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6">
            {conv.displayName || conv.phoneNumber}
          </Typography>
          <Box display="flex" alignItems="center" gap={1}>
            <PhoneIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              {conv.phoneNumber}
            </Typography>
            {conv.contactId && (
              <Tooltip title="View Contact">
                <Chip
                  label="Contact"
                  size="small"
                  color="secondary"
                  variant="outlined"
                  onClick={handleOpenContact}
                  icon={<OpenInNewIcon fontSize="small" />}
                  sx={{ cursor: 'pointer' }}
                />
              </Tooltip>
            )}
          </Box>
        </Box>
        {conv.id && onMarkAsUnread && (
          <Tooltip title="Mark as unread" arrow>
            <IconButton
              onClick={handleMarkAsUnread}
              size="small"
              sx={{
                backgroundColor: 'rgba(25, 118, 210, 0.08)',
                '&:hover': {
                  backgroundColor: 'rgba(25, 118, 210, 0.15)'
                }
              }}
              aria-label="Mark conversation as unread"
            >
              <MarkAsUnreadIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* Messages */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 2,
          backgroundColor: '#f5f5f5',
        }}
      >
        {messages.length === 0 ? (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            height="100%"
            color="text.secondary"
          >
            <Typography>No messages yet. Send the first message!</Typography>
          </Box>
        ) : (
          messages.map((message) => (
            <MessageBubble key={message.id} message={message} onRetry={onMessageSent} />
          ))
        )}
        <div ref={messagesEndRef} />
      </Box>

      {/* Composer */}
      <MessageComposer
        phoneNumber={conv.phoneNumber}
        propertyLeadId={conv.propertyLeadId}
        contactId={conv.contactId}
        onMessageSent={onMessageSent}
        leadName={leadName}
        leadAddress={leadAddress}
        leadPrice={leadPrice}
      />
    </Box>
  );
};

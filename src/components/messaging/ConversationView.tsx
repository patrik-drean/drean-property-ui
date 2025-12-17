import React, { useEffect, useRef } from 'react';
import { Box, Typography, Chip, Tooltip, IconButton } from '@mui/material';
import {
  Phone as PhoneIcon,
  OpenInNew as OpenInNewIcon,
} from '@mui/icons-material';
import { MessageBubble } from './MessageBubble';
import { MessageComposer } from './MessageComposer';
import { ConversationWithMessages } from '../../types/sms';

interface ConversationViewProps {
  conversation: ConversationWithMessages;
  onMessageSent: () => void;
  leadName?: string;
  leadAddress?: string;
  leadPrice?: string;
  zillowLink?: string;
}

export const ConversationView: React.FC<ConversationViewProps> = ({
  conversation,
  onMessageSent,
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
        <Box>
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

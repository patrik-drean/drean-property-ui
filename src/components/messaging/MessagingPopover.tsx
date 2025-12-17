import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Close as CloseIcon,
  Minimize as MinimizeIcon,
  OpenInNew as OpenInNewIcon,
} from '@mui/icons-material';
import { useMessagingPopover } from '../../contexts/MessagingPopoverContext';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { smsService } from '../../services/smsService';
import { ConversationWithMessages } from '../../types/sms';
import { MessageBubble } from './MessageBubble';
import { MessageComposer } from './MessageComposer';
import { MessagingPopoverMinimized } from './MessagingPopoverMinimized';
import { MessagingPopoverMobile } from './MessagingPopoverMobile';

/**
 * Main messaging popover component - Gmail-style floating conversation window
 *
 * Desktop: 400×600px floating Paper in bottom-right corner
 * Mobile: Full-screen Dialog (handled by MessagingPopoverMobile)
 * Minimized: 40px bottom bar (handled by MessagingPopoverMinimized)
 */
export const MessagingPopover: React.FC = () => {
  const {
    isOpen,
    isMinimized,
    conversationId,
    phoneNumber,
    leadId,
    leadName,
    leadAddress,
    leadPrice,
    closePopover,
    minimizePopover,
  } = useMessagingPopover();

  const { isMobile } = useResponsiveLayout();

  const [conversation, setConversation] = useState<ConversationWithMessages | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch conversation data when popover opens or conversation changes
   */
  const fetchConversation = useCallback(async () => {
    if (!conversationId && !phoneNumber) {
      setError('No conversation ID or phone number provided');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let conv: ConversationWithMessages | null = null;

      if (conversationId) {
        // Fetch existing conversation by ID
        conv = await smsService.getConversation(conversationId);
      } else if (phoneNumber) {
        // Try to fetch conversation by phone number
        conv = await smsService.getConversationByPhone(phoneNumber);

        // If no conversation exists, create a placeholder
        if (!conv) {
          conv = {
            conversation: {
              id: '', // Will be created when first message is sent
              phoneNumber,
              displayName: phoneNumber,
              propertyLeadId: leadId || undefined,
              contactId: undefined,
              lastMessageAt: undefined,
              lastMessagePreview: undefined,
              unreadCount: 0,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            messages: [],
          };
        }
      }

      setConversation(conv);
    } catch (err: any) {
      console.error('Failed to fetch conversation:', err);
      setError(err.message || 'Failed to load conversation');
    } finally {
      setLoading(false);
    }
  }, [conversationId, phoneNumber, leadId]);

  /**
   * Fetch conversation on mount and when conversation changes
   */
  useEffect(() => {
    if (isOpen && !isMinimized) {
      fetchConversation();
    }
  }, [isOpen, isMinimized, fetchConversation]);

  /**
   * Open full messaging page in new tab
   */
  const handleViewFullConversation = () => {
    if (conversation?.conversation.id) {
      // Use hash router format for new tab
      const url = `${window.location.origin}/#/messaging?conversation=${conversation.conversation.id}`;
      window.open(url, '_blank');
    }
  };

  // Don't render if not open
  if (!isOpen) return null;

  // Render minimized state
  if (isMinimized) {
    return <MessagingPopoverMinimized conversation={conversation} />;
  }

  // Render mobile full-screen modal
  if (isMobile) {
    return (
      <MessagingPopoverMobile
        conversation={conversation}
        loading={loading}
        error={error}
        onClose={closePopover}
        onRefresh={fetchConversation}
        leadName={leadName}
        leadAddress={leadAddress}
        leadPrice={leadPrice}
      />
    );
  }

  // Desktop: Render floating popover
  return (
    <Paper
      elevation={8}
      sx={{
        position: 'fixed',
        bottom: 0,
        right: 16,
        width: 400,
        height: 600,
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1300, // Above most UI elements
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 1.5,
          borderBottom: 1,
          borderColor: 'divider',
          backgroundColor: 'primary.main',
          color: 'primary.contrastText',
        }}
      >
        <Typography variant="subtitle1" noWrap sx={{ flex: 1, fontWeight: 600 }}>
          {conversation?.conversation.displayName || conversation?.conversation.phoneNumber || 'Loading...'}
        </Typography>
        <IconButton
          size="small"
          onClick={minimizePopover}
          sx={{ color: 'inherit' }}
          aria-label="Minimize conversation"
        >
          <MinimizeIcon />
        </IconButton>
        <IconButton
          size="small"
          onClick={closePopover}
          sx={{ color: 'inherit' }}
          aria-label="Close conversation"
        >
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Messages (scrollable, last 8 messages) */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={fetchConversation}>
                Retry
              </Button>
            }
          >
            {error}
          </Alert>
        ) : conversation ? (
          <>
            {/* "View full conversation" link at top */}
            {conversation.conversation.id && (
              <Button
                size="small"
                startIcon={<OpenInNewIcon />}
                onClick={handleViewFullConversation}
                sx={{ mb: 2 }}
              >
                View full conversation
              </Button>
            )}

            {/* Display last 8 messages */}
            {conversation.messages && conversation.messages.length > 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {conversation.messages.slice(-8).map((message) => (
                  <MessageBubble key={message.id} message={message} onRetry={fetchConversation} />
                ))}
              </Box>
            ) : (
              <Alert severity="info">No messages yet. Start the conversation below.</Alert>
            )}
          </>
        ) : (
          <Alert severity="warning">Failed to load conversation</Alert>
        )}
      </Box>

      {/* Composer */}
      {conversation && (
        <Box sx={{ borderTop: 1, borderColor: 'divider' }}>
          <MessageComposer
            phoneNumber={conversation.conversation.phoneNumber}
            propertyLeadId={conversation.conversation.propertyLeadId || leadId || undefined}
            contactId={conversation.conversation.contactId || undefined}
            onMessageSent={fetchConversation}
            leadName={leadName}
            leadAddress={leadAddress}
            leadPrice={leadPrice}
          />
        </Box>
      )}
    </Paper>
  );
};

import React from 'react';
import { Box, Paper, Typography, IconButton } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useMessagingPopover } from '../../contexts/MessagingPopoverContext';
import { ConversationWithMessages } from '../../types/sms';

interface MessagingPopoverMinimizedProps {
  conversation: ConversationWithMessages | null;
}

/**
 * Minimized state of the messaging popover - 40px bottom bar
 *
 * Displays contact name and last message preview
 * Click anywhere on the bar to restore to full popover
 * Close button stops propagation to allow closing without restoring
 */
export const MessagingPopoverMinimized: React.FC<MessagingPopoverMinimizedProps> = ({
  conversation,
}) => {
  const { restorePopover, closePopover } = useMessagingPopover();

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering restore
    closePopover();
  };

  return (
    <Paper
      elevation={4}
      onClick={restorePopover}
      sx={{
        position: 'fixed',
        bottom: 0,
        right: 16,
        width: 400,
        height: 48,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 2,
        cursor: 'pointer',
        zIndex: 1300,
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        backgroundColor: 'primary.main',
        color: 'primary.contrastText',
        transition: 'background-color 0.2s ease-in-out',
        '&:hover': {
          backgroundColor: 'primary.dark',
        },
      }}
      role="button"
      aria-label="Restore conversation window"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          restorePopover();
        }
      }}
    >
      <Box sx={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>
        <Typography variant="body2" noWrap fontWeight={600}>
          {conversation?.conversation.displayName || conversation?.conversation.phoneNumber || 'Conversation'}
        </Typography>
        {conversation?.conversation.lastMessagePreview && (
          <Typography variant="caption" noWrap sx={{ opacity: 0.8 }}>
            {conversation.conversation.lastMessagePreview}
          </Typography>
        )}
      </Box>
      <IconButton
        size="small"
        onClick={handleClose}
        sx={{ color: 'inherit', ml: 1 }}
        aria-label="Close conversation"
      >
        <CloseIcon fontSize="small" />
      </IconButton>
    </Paper>
  );
};

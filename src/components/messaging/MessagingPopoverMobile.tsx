import React from 'react';
import {
  Dialog,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Button,
  Slide,
} from '@mui/material';
import { Close as CloseIcon, OpenInNew as OpenInNewIcon } from '@mui/icons-material';
import { TransitionProps } from '@mui/material/transitions';
import { ConversationWithMessages } from '../../types/sms';
import { MessageBubble } from './MessageBubble';
import { MessageComposer } from './MessageComposer';

interface MessagingPopoverMobileProps {
  conversation: ConversationWithMessages | null;
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onRefresh: () => void;
  leadName?: string;
  leadAddress?: string;
  leadPrice?: string;
}

/**
 * Slide transition for mobile dialog
 */
const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement;
  },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

/**
 * Mobile full-screen modal for messaging popover
 *
 * On mobile devices (<900px), the popover becomes a full-screen dialog
 * with slide-up animation for a native mobile app feel
 */
export const MessagingPopoverMobile: React.FC<MessagingPopoverMobileProps> = ({
  conversation,
  loading,
  error,
  onClose,
  onRefresh,
  leadName,
  leadAddress,
  leadPrice,
}) => {
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

  return (
    <Dialog
      fullScreen
      open={true}
      onClose={onClose}
      TransitionComponent={Transition}
    >
      <AppBar sx={{ position: 'relative' }}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={onClose}
            aria-label="Close"
          >
            <CloseIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flex: 1, ml: 2 }} noWrap>
            {conversation?.conversation.displayName || conversation?.conversation.phoneNumber || 'Message'}
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Messages */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {loading ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
            }}
          >
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={onRefresh}>
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
                sx={{ mb: 2, alignSelf: 'flex-start' }}
              >
                View full conversation
              </Button>
            )}

            {/* Display last 8 messages */}
            {conversation.messages && conversation.messages.length > 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {conversation.messages.slice(-8).map((message) => (
                  <MessageBubble key={message.id} message={message} onRetry={onRefresh} />
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
        <Box sx={{ borderTop: 1, borderColor: 'divider', backgroundColor: 'background.paper' }}>
          <MessageComposer
            phoneNumber={conversation.conversation.phoneNumber}
            propertyLeadId={conversation.conversation.propertyLeadId || undefined}
            contactId={conversation.conversation.contactId || undefined}
            onMessageSent={onRefresh}
            leadName={leadName}
            leadAddress={leadAddress}
            leadPrice={leadPrice}
          />
        </Box>
      )}
    </Dialog>
  );
};

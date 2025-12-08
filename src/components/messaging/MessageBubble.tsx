import React, { useState } from 'react';
import { Box, Typography, Tooltip, Button, CircularProgress } from '@mui/material';
import {
  Check as CheckIcon,
  DoneAll as DoneAllIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
  Refresh as RetryIcon,
} from '@mui/icons-material';
import { SmsMessage } from '../../types/sms';
import { smsService } from '../../services/smsService';
import { format } from 'date-fns';

interface MessageBubbleProps {
  message: SmsMessage;
  onRetry?: () => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onRetry }) => {
  const [retrying, setRetrying] = useState(false);
  const isOutbound = message.direction === 'outbound';

  const handleRetry = async () => {
    setRetrying(true);
    try {
      await smsService.retryMessage(message.id);
      onRetry?.();
    } catch (err) {
      console.error('Retry failed:', err);
    } finally {
      setRetrying(false);
    }
  };

  const getStatusIcon = () => {
    switch (message.status) {
      case 'pending':
        return <ScheduleIcon fontSize="inherit" />;
      case 'sent':
        return <CheckIcon fontSize="inherit" />;
      case 'delivered':
        return <DoneAllIcon fontSize="inherit" color="primary" />;
      case 'failed':
        return <ErrorIcon fontSize="inherit" color="error" />;
      default:
        return null;
    }
  };

  const getStatusTooltip = () => {
    switch (message.status) {
      case 'pending':
        return 'Sending...';
      case 'sent':
        return 'Sent';
      case 'delivered':
        return message.deliveredAt
          ? `Delivered ${format(new Date(message.deliveredAt), 'MMM d, h:mm a')}`
          : 'Delivered';
      case 'failed':
        return message.errorMessage || 'Failed to send';
      default:
        return '';
    }
  };

  const formatMessageTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'h:mm a');
    } catch {
      return '';
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isOutbound ? 'flex-end' : 'flex-start',
        mb: 1.5,
      }}
    >
      <Box
        sx={{
          maxWidth: '70%',
          backgroundColor: isOutbound ? 'primary.main' : 'white',
          color: isOutbound ? 'white' : 'text.primary',
          borderRadius: 2,
          px: 2,
          py: 1,
          boxShadow: 1,
        }}
      >
        <Typography
          variant="body1"
          sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
        >
          {message.body}
        </Typography>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: 0.5,
            mt: 0.5,
          }}
        >
          <Typography
            variant="caption"
            sx={{
              opacity: 0.7,
              color: isOutbound ? 'inherit' : 'text.secondary',
            }}
          >
            {formatMessageTime(message.createdAt)}
          </Typography>
          {isOutbound && (
            <Tooltip title={getStatusTooltip()}>
              <Box
                component="span"
                sx={{
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  opacity: 0.7,
                }}
              >
                {getStatusIcon()}
              </Box>
            </Tooltip>
          )}
        </Box>
        {message.status === 'failed' && isOutbound && (
          <Box sx={{ mt: 0.5, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              size="small"
              color="error"
              startIcon={retrying ? <CircularProgress size={14} color="inherit" /> : <RetryIcon />}
              onClick={handleRetry}
              disabled={retrying}
              sx={{
                textTransform: 'none',
                fontSize: '0.75rem',
                py: 0.25,
                px: 1,
                minHeight: 'auto',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.1)',
                },
              }}
            >
              {retrying ? 'Retrying...' : 'Retry'}
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
};

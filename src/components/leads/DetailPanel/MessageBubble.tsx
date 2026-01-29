import React from 'react';
import { Box, Typography } from '@mui/material';

interface MessageBubbleProps {
  message: string;
  isOutbound: boolean;
  timestamp: string;
  status?: 'sending' | 'sent' | 'delivered' | 'failed';
}

/**
 * MessageBubble - Displays a single message in conversation style
 *
 * - Outbound (from user): Aligned right, green background
 * - Inbound (from lead): Aligned left, dark background
 */
export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOutbound,
  timestamp,
  status,
}) => {
  // Format timestamp in Mountain Time
  const formatTimestamp = (ts: string): string => {
    try {
      // Ensure the timestamp is treated as UTC by appending 'Z' if not present
      const utcString = ts.endsWith('Z') ? ts : `${ts}Z`;
      const date = new Date(utcString);

      // Validate date
      if (isNaN(date.getTime())) {
        console.warn('Invalid timestamp:', ts);
        return ts;
      }

      // Format time in Mountain Time
      return new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Denver',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }).format(date);
    } catch (error) {
      console.error('Error formatting timestamp:', error);
      return ts;
    }
  };

  const getStatusIndicator = () => {
    switch (status) {
      case 'sending':
        return '...';
      case 'sent':
        return '✓';
      case 'delivered':
        return '✓✓';
      case 'failed':
        return '!';
      default:
        return null;
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isOutbound ? 'flex-end' : 'flex-start',
        mb: 1,
      }}
    >
      <Box
        sx={{
          maxWidth: '80%',
          p: 1.5,
          borderRadius: 2,
          bgcolor: isOutbound ? 'rgba(74, 222, 128, 0.15)' : '#21262d',
          borderBottomRightRadius: isOutbound ? 0 : 2,
          borderBottomLeftRadius: isOutbound ? 2 : 0,
        }}
      >
        <Typography
          variant="body2"
          sx={{
            color: '#f0f6fc',
            fontSize: '0.85rem',
            lineHeight: 1.4,
          }}
        >
          {message}
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
          <Typography variant="caption" sx={{ color: '#8b949e', fontSize: '0.65rem' }}>
            {formatTimestamp(timestamp)}
          </Typography>
          {status && (
            <Typography
              variant="caption"
              sx={{
                color: status === 'failed' ? '#f87171' : '#4ade80',
                fontSize: '0.65rem',
              }}
            >
              {getStatusIndicator()}
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default MessageBubble;

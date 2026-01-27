import React from 'react';
import { Box, Tooltip, Typography } from '@mui/material';
import { useWebSocket } from '../../contexts/WebSocketContext';

const statusConfig = {
  connecting: { color: '#fbbf24', label: 'Connecting...' },
  connected: { color: '#4ade80', label: 'Live' },
  disconnected: { color: '#f87171', label: 'Offline' },
  reconnecting: { color: '#fbbf24', label: 'Reconnecting...' },
};

export const ConnectionIndicator: React.FC = () => {
  const { connectionStatus } = useWebSocket();
  const { color, label } = statusConfig[connectionStatus];

  return (
    <Tooltip title={`Connection: ${label}`}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            bgcolor: color,
            animation: connectionStatus === 'connected' ? 'none' : 'pulse 1.5s infinite',
            '@keyframes pulse': {
              '0%, 100%': { opacity: 1 },
              '50%': { opacity: 0.5 },
            },
          }}
        />
        <Typography variant="caption" sx={{ color: '#8b949e' }}>
          {label}
        </Typography>
      </Box>
    </Tooltip>
  );
};

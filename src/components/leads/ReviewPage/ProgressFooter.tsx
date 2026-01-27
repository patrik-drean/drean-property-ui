import React from 'react';
import { Box, Typography, LinearProgress } from '@mui/material';
import { Circle as ConnectionIcon } from '@mui/icons-material';
import { TodayProgress } from '../../../types/queue';

interface ProgressBarProps {
  label: string;
  current: number;
  total: number;
  color: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ label, current, total, color }) => {
  const progress = total > 0 ? (current / total) * 100 : 0;
  const isComplete = current >= total && total > 0;

  return (
    <Box sx={{ flex: 1, minWidth: 150 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="caption" sx={{ color: '#8b949e', fontSize: '0.7rem' }}>
          {label}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: isComplete ? '#4ade80' : '#f0f6fc',
            fontWeight: 600,
            fontSize: '0.7rem',
          }}
        >
          {current}/{total}
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={progress}
        sx={{
          height: 6,
          borderRadius: 3,
          bgcolor: 'rgba(255, 255, 255, 0.1)',
          '& .MuiLinearProgress-bar': {
            bgcolor: isComplete ? '#4ade80' : color,
            borderRadius: 3,
          },
        }}
      />
    </Box>
  );
};

interface ProgressFooterProps {
  progress: TodayProgress;
  isConnected?: boolean;
}

/**
 * ProgressFooter - displays daily progress bars and connection status
 */
export const ProgressFooter: React.FC<ProgressFooterProps> = ({
  progress,
  isConnected = true,
}) => {
  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        bgcolor: '#161b22',
        borderTop: '1px solid #30363d',
        px: 3,
        py: 1.5,
        zIndex: 100,
      }}
    >
      <Box
        sx={{
          maxWidth: 1200,
          mx: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          flexWrap: 'wrap',
        }}
      >
        {/* Progress bars */}
        <ProgressBar
          label="Contacted Today"
          current={progress.contacted.current}
          total={progress.contacted.total}
          color="#60a5fa"
        />
        <ProgressBar
          label="Follow-Ups Completed"
          current={progress.followUps.current}
          total={progress.followUps.total}
          color="#fbbf24"
        />

        {/* Connection status */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
            ml: 'auto',
          }}
        >
          <ConnectionIcon
            sx={{
              fontSize: 8,
              color: isConnected ? '#4ade80' : '#f87171',
            }}
          />
          <Typography
            variant="caption"
            sx={{
              color: isConnected ? '#4ade80' : '#f87171',
              fontSize: '0.7rem',
            }}
          >
            {isConnected ? 'Connected' : 'Reconnecting...'}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default ProgressFooter;

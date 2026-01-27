import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { TodayProgress } from '../../../types/queue';

interface PageHeaderProps {
  todayProgress: TodayProgress;
}

/**
 * PageHeader - displays "Your Daily Queue" title with today's completion chip
 */
export const PageHeader: React.FC<PageHeaderProps> = ({ todayProgress }) => {
  const totalCompleted = todayProgress.contacted.current + todayProgress.followUps.current;
  const totalTarget = todayProgress.contacted.total + todayProgress.followUps.total;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        mb: 3,
        flexWrap: 'wrap',
        gap: 2,
      }}
    >
      <Box>
        <Typography
          variant="h4"
          component="h1"
          sx={{
            color: '#f0f6fc',
            fontWeight: 700,
            fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
          }}
        >
          Your Daily Queue
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: '#8b949e',
            mt: 0.5,
          }}
        >
          Focus on high-priority leads first
        </Typography>
      </Box>

      <Chip
        label={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {totalCompleted}
            </Typography>
            <Typography variant="body2" sx={{ color: '#8b949e' }}>
              /
            </Typography>
            <Typography variant="body2" sx={{ color: '#8b949e' }}>
              {totalTarget} today
            </Typography>
          </Box>
        }
        sx={{
          bgcolor: totalCompleted >= totalTarget ? 'rgba(74, 222, 128, 0.15)' : 'rgba(255, 255, 255, 0.05)',
          color: totalCompleted >= totalTarget ? '#4ade80' : '#f0f6fc',
          border: '1px solid',
          borderColor: totalCompleted >= totalTarget ? 'rgba(74, 222, 128, 0.3)' : '#30363d',
          borderRadius: '16px',
          height: 32,
          '& .MuiChip-label': {
            px: 1.5,
          },
        }}
      />
    </Box>
  );
};

export default PageHeader;

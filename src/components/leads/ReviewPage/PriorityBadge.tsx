import React from 'react';
import { Box, Typography } from '@mui/material';
import { Priority, getPriorityStyles } from '../../../types/queue';

interface PriorityBadgeProps {
  priority: Priority;
  timeSince?: string;
}

/**
 * PriorityBadge - displays the priority level (URGENT/HIGH/MEDIUM/NORMAL) with time since created
 */
export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, timeSince }) => {
  const styles = getPriorityStyles(priority);

  const priorityLabel = priority.toUpperCase();

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 1,
        px: 1.5,
        py: 0.5,
        borderRadius: 1,
        backgroundColor: styles.bg,
        border: `1px solid ${styles.border}`,
      }}
    >
      <Typography
        variant="caption"
        sx={{
          color: styles.color,
          fontWeight: 600,
          fontSize: '0.7rem',
          letterSpacing: '0.05em',
        }}
      >
        {priorityLabel}
      </Typography>
      {timeSince && (
        <>
          <Box
            sx={{
              width: 4,
              height: 4,
              borderRadius: '50%',
              backgroundColor: styles.color,
              opacity: 0.5,
            }}
          />
          <Typography
            variant="caption"
            sx={{
              color: styles.color,
              opacity: 0.8,
              fontSize: '0.7rem',
            }}
          >
            {timeSince}
          </Typography>
        </>
      )}
    </Box>
  );
};

export default PriorityBadge;

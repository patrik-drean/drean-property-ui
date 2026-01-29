import React from 'react';
import { Box, Typography } from '@mui/material';

interface GradeBadgeProps {
  grade: string;
  showLabel?: boolean;
}

/**
 * GradeBadge - Displays neighborhood grade with color coding
 *
 * Grades A-F with appropriate colors:
 * - A: Green (#4ade80)
 * - B: Blue (#60a5fa)
 * - C: Yellow (#fbbf24)
 * - D: Red (#f87171)
 * - F: Dark Red (#ef4444)
 */
export const GradeBadge: React.FC<GradeBadgeProps> = ({ grade, showLabel = true }) => {
  const getGradeColor = (grade: string): string => {
    switch (grade?.toUpperCase()) {
      case 'A':
        return '#4ade80';
      case 'B':
        return '#60a5fa';
      case 'C':
        return '#fbbf24';
      case 'D':
        return '#f87171';
      case 'F':
        return '#ef4444';
      default:
        return '#8b949e';
    }
  };

  const getGradeLabel = (grade: string): string => {
    switch (grade?.toUpperCase()) {
      case 'A':
        return 'Excellent';
      case 'B':
        return 'Good';
      case 'C':
        return 'Average';
      case 'D':
        return 'Below Avg';
      case 'F':
        return 'Poor';
      default:
        return 'Unknown';
    }
  };

  const color = getGradeColor(grade);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Box
        sx={{
          width: 32,
          height: 32,
          borderRadius: '8px',
          bgcolor: `${color}20`,
          border: `2px solid ${color}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography
          sx={{
            color,
            fontWeight: 700,
            fontSize: '1rem',
          }}
        >
          {grade?.toUpperCase() || '-'}
        </Typography>
      </Box>
      {showLabel && (
        <Typography variant="body2" sx={{ color: '#8b949e' }}>
          {getGradeLabel(grade)}-grade neighborhood
        </Typography>
      )}
    </Box>
  );
};

export default GradeBadge;

import React from 'react';
import { Box, Typography } from '@mui/material';

interface SectionCardProps {
  title: string;
  children: React.ReactNode;
}

/**
 * SectionCard - A reusable card wrapper for the Lead Detail Panel sections
 *
 * Provides consistent styling with PropGuide dark theme:
 * - Dark background (#161b22)
 * - Border (#30363d)
 * - Title in muted color (#8b949e)
 */
export const SectionCard: React.FC<SectionCardProps> = ({ title, children }) => {
  return (
    <Box
      sx={{
        p: 2,
        bgcolor: '#161b22',
        border: '1px solid #30363d',
        borderRadius: 2,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Typography
        variant="subtitle2"
        sx={{
          color: '#8b949e',
          mb: 2,
          fontWeight: 600,
          letterSpacing: '0.05em',
          fontSize: '0.75rem',
        }}
      >
        {title}
      </Typography>
      <Box sx={{ flex: 1 }}>{children}</Box>
    </Box>
  );
};

export default SectionCard;

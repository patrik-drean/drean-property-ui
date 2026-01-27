import React from 'react';
import { Box, Typography } from '@mui/material';

/**
 * PageHeader - displays "Review Leads" title
 */
export const PageHeader: React.FC = () => {
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
          Review Leads
        </Typography>
      </Box>
    </Box>
  );
};

export default PageHeader;

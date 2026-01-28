import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

interface PageHeaderProps {
  onAddLead?: () => void;
}

/**
 * PageHeader - displays "Review Leads" title and Add Lead button
 */
export const PageHeader: React.FC<PageHeaderProps> = ({ onAddLead }) => {
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
      {onAddLead && (
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onAddLead}
          sx={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: '#ffffff',
            fontWeight: 600,
            textTransform: 'none',
            px: 3,
            py: 1,
            borderRadius: '8px',
            '&:hover': {
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
            },
          }}
        >
          Add Lead
        </Button>
      )}
    </Box>
  );
};

export default PageHeader;

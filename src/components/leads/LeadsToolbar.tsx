import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import * as Icons from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';

interface LeadsToolbarProps {
  selectedLeads: string[];
  onAddLead: () => void;
  onBulkDelete: () => void;
}

export const LeadsToolbar: React.FC<LeadsToolbarProps> = ({
  selectedLeads,
  onAddLead,
  onBulkDelete,
}) => {
  return (
    <Box sx={{
      mb: 3,
      display: 'flex',
      flexDirection: { xs: 'column', sm: 'row' },
      justifyContent: 'space-between',
      alignItems: { xs: 'stretch', sm: 'center' },
      gap: { xs: 2, sm: 0 }
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h4" component="h1">Property Leads</Typography>
      </Box>
      <Box sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'stretch', sm: 'center' },
        gap: { xs: 1, sm: 1 },
        justifyContent: { xs: 'stretch', sm: 'flex-end' },
        width: { xs: '100%', sm: 'auto' }
      }}>
        <Button
          variant="outlined"
          component={RouterLink}
          to="/reports?tab=3"
          startIcon={<Icons.Assessment />}
          sx={{
            borderRadius: 2,
            width: { xs: '100%', sm: 'auto' }
          }}
        >
          View Sales Report
        </Button>
        {selectedLeads.length > 0 && (
          <Button
            variant="contained"
            color="error"
            startIcon={<Icons.Delete />}
            onClick={onBulkDelete}
            sx={{
              width: { xs: '100%', sm: 'auto' }
            }}
          >
            Delete Selected ({selectedLeads.length})
          </Button>
        )}
        <Button
          variant="contained"
          color="primary"
          startIcon={<Icons.Add />}
          onClick={onAddLead}
          sx={{
            width: { xs: '100%', sm: 'auto' }
          }}
        >
          Add Lead
        </Button>
      </Box>
    </Box>
  );
};

export default LeadsToolbar;

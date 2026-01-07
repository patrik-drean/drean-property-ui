import React from 'react';
import { Box, Typography, Button, Tooltip, TextField, InputAdornment } from '@mui/material';
import * as Icons from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { PropertyLead } from '../../types/property';

interface LeadsToolbarProps {
  propertyLeads: PropertyLead[];
  selectedLeads: string[];
  showArchived: boolean;
  locallyConvertedLeads: Set<string>;
  searchQuery: string;
  onSearchChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onAddLead: () => void;
  onToggleShowArchived: () => void;
  onBulkDelete: () => void;
}

// Modify the countConvertedLeads function to include locally tracked conversions
const countConvertedLeads = (leads: PropertyLead[], locallyConvertedLeads: Set<string>) => {
  return leads.filter(lead => lead.convertedToProperty || locallyConvertedLeads.has(lead.id)).length;
};

export const LeadsToolbar: React.FC<LeadsToolbarProps> = ({
  propertyLeads,
  selectedLeads,
  showArchived,
  locallyConvertedLeads,
  searchQuery,
  onSearchChange,
  onAddLead,
  onToggleShowArchived,
  onBulkDelete,
}) => {
  const convertedCount = countConvertedLeads(propertyLeads, locallyConvertedLeads);

  return (
    <Box sx={{
      mb: 4,
      display: 'flex',
      flexDirection: 'column',
      gap: 2
    }}>
      {/* Top row: Title and action buttons */}
      <Box sx={{
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
        <Button
          variant="outlined"
          color="primary"
          onClick={onToggleShowArchived}
          startIcon={<Icons.Archive />}
          sx={{
            borderRadius: 2,
            width: { xs: '100%', sm: 'auto' }
          }}
        >
          {showArchived ? 'Hide Archived' : 'Archived Leads'}
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

      {/* Search row */}
      <TextField
        placeholder="Search by address..."
        value={searchQuery}
        onChange={onSearchChange}
        size="small"
        sx={{
          maxWidth: { xs: '100%', sm: 400 },
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
          }
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Icons.Search color="action" />
            </InputAdornment>
          ),
          endAdornment: searchQuery && (
            <InputAdornment position="end">
              <Icons.Close
                sx={{ cursor: 'pointer', fontSize: 20 }}
                onClick={() => onSearchChange({ target: { value: '' } } as React.ChangeEvent<HTMLInputElement>)}
              />
            </InputAdornment>
          ),
        }}
      />
    </Box>
  );
};

export default LeadsToolbar;

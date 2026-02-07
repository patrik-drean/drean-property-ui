import React from 'react';
import { Box, Typography, Button, TextField, IconButton, InputAdornment, CircularProgress } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import BarChartIcon from '@mui/icons-material/BarChart';

interface PageHeaderProps {
  onAddLead?: () => void;
  /** Callback to promote top listings to leads */
  onPromoteListings?: () => void;
  /** Whether promote listings action is in progress */
  promoteLoading?: boolean;
  /** Callback to navigate to sales funnel report */
  onNavigateToSalesFunnel?: () => void;
  /** Whether to show the search input (only for All Leads and Archived tabs) */
  showSearch?: boolean;
  /** Current search query value */
  searchQuery?: string;
  /** Callback when search query changes */
  onSearchChange?: (query: string) => void;
  /** Callback to clear search */
  onClearSearch?: () => void;
}

/**
 * PageHeader - displays "Review Leads" title, search input, and Add Lead button
 */
export const PageHeader: React.FC<PageHeaderProps> = ({
  onAddLead,
  onPromoteListings,
  promoteLoading = false,
  onNavigateToSalesFunnel,
  showSearch = false,
  searchQuery = '',
  onSearchChange,
  onClearSearch,
}) => {
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
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
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

        {/* Search input - only visible for All Leads and Archived tabs */}
        {showSearch && (
          <TextField
            size="small"
            placeholder="Search by address, phone, or email..."
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#8b949e', fontSize: '1.2rem' }} />
                </InputAdornment>
              ),
              endAdornment: searchQuery && (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={onClearSearch}
                    sx={{ color: '#8b949e', '&:hover': { color: '#f0f6fc' } }}
                  >
                    <ClearIcon sx={{ fontSize: '1rem' }} />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              width: { xs: '100%', sm: 280, md: 320 },
              '& .MuiOutlinedInput-root': {
                bgcolor: '#161b22',
                borderRadius: '8px',
                '& fieldset': {
                  borderColor: '#30363d',
                },
                '&:hover fieldset': {
                  borderColor: '#484f58',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#58a6ff',
                },
              },
              '& .MuiInputBase-input': {
                color: '#f0f6fc',
                fontSize: '0.875rem',
                '&::placeholder': {
                  color: '#8b949e',
                  opacity: 1,
                },
              },
            }}
          />
        )}
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {onPromoteListings && (
          <Button
            variant="outlined"
            size="small"
            color="secondary"
            startIcon={promoteLoading ? <CircularProgress size={16} color="inherit" /> : <TrendingUpIcon />}
            onClick={onPromoteListings}
            disabled={promoteLoading}
            sx={{
              textTransform: 'none',
            }}
          >
            {promoteLoading ? 'Promoting...' : 'Promote Listings'}
          </Button>
        )}
        {onNavigateToSalesFunnel && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<BarChartIcon />}
            onClick={onNavigateToSalesFunnel}
            sx={{
              textTransform: 'none',
              borderColor: '#30363d',
              color: '#8b949e',
              '&:hover': {
                borderColor: '#58a6ff',
                color: '#58a6ff',
                bgcolor: 'rgba(88, 166, 255, 0.1)',
              },
            }}
          >
            Sales Funnel
          </Button>
        )}
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
    </Box>
  );
};

export default PageHeader;

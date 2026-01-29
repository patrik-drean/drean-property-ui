import React from 'react';
import { Box, Typography, IconButton, Tooltip, Stack } from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

interface PanelHeaderProps {
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
}

/**
 * PanelHeader - Navigation header for the Lead Detail Panel
 *
 * Features:
 * - Address display with city/state/zip
 * - Navigation buttons with keyboard shortcut hints
 * - Close button
 */
export const PanelHeader: React.FC<PanelHeaderProps> = ({
  address,
  city,
  state,
  zipCode,
  onClose,
  onPrev,
  onNext,
  isFirst,
  isLast,
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        p: 2,
        borderBottom: '1px solid #30363d',
        bgcolor: '#161b22',
      }}
    >
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            color: '#f0f6fc',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {address || 'Loading...'}
        </Typography>
        {(city || state || zipCode) && (
          <Typography variant="body2" sx={{ color: '#8b949e' }}>
            {[city, state, zipCode].filter(Boolean).join(', ')}
          </Typography>
        )}
      </Box>

      <Stack direction="row" spacing={0.5}>
        <Tooltip title="Previous Lead (k)">
          <span>
            <IconButton
              onClick={onPrev}
              disabled={isFirst || !onPrev}
              aria-label="Previous lead"
              sx={{
                color: '#8b949e',
                '&:hover': { color: '#f0f6fc', bgcolor: '#21262d' },
                '&.Mui-disabled': { color: '#484f58' },
              }}
            >
              <ChevronLeftIcon />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Next Lead (j)">
          <span>
            <IconButton
              onClick={onNext}
              disabled={isLast || !onNext}
              aria-label="Next lead"
              sx={{
                color: '#8b949e',
                '&:hover': { color: '#f0f6fc', bgcolor: '#21262d' },
                '&.Mui-disabled': { color: '#484f58' },
              }}
            >
              <ChevronRightIcon />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Close (ESC)">
          <IconButton
            onClick={onClose}
            aria-label="Close panel"
            sx={{
              color: '#8b949e',
              '&:hover': { color: '#f87171', bgcolor: 'rgba(248, 113, 113, 0.1)' },
            }}
          >
            <CloseIcon />
          </IconButton>
        </Tooltip>
      </Stack>
    </Box>
  );
};

export default PanelHeader;

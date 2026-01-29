import React, { useState } from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Stack,
  TextField,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Archive as ArchiveIcon,
  DeleteForever as DeleteForeverIcon,
} from '@mui/icons-material';
import { QueueLead, LeadQueueStatus } from '../../../types/queue';
import { SectionCard } from './SectionCard';
import { DeleteConfirmationDialog } from '../shared';

interface ActionsSectionProps {
  lead: QueueLead;
  onStatusChange?: (status: LeadQueueStatus) => void;
  onAction?: (action: string) => void;
  onNotesChange?: (notes: string) => void;
  onDeletePermanently?: () => Promise<void>;
  deleteLoading?: boolean;
}

// Status options for the dropdown
const STATUS_OPTIONS: { value: LeadQueueStatus; label: string }[] = [
  { value: 'New', label: 'New' },
  { value: 'Contacted', label: 'Contacted' },
  { value: 'Responding', label: 'Responding' },
  { value: 'Negotiating', label: 'Negotiating' },
  { value: 'UnderContract', label: 'Under Contract' },
  { value: 'Closed', label: 'Closed' },
  { value: 'Lost', label: 'Lost' },
];

/**
 * ActionsSection - Bottom-right quadrant of the Lead Detail Panel
 *
 * Features:
 * - Status dropdown
 * - Quick action buttons (Mark Contacted, Schedule Follow-Up, Archive, Promote)
 * - Notes section
 */
export const ActionsSection: React.FC<ActionsSectionProps> = ({
  lead,
  onStatusChange,
  onAction,
  onNotesChange,
  onDeletePermanently,
  deleteLoading = false,
}) => {
  const [notes, setNotes] = useState(lead.notes || '');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleDeleteConfirm = async () => {
    if (onDeletePermanently) {
      await onDeletePermanently();
      setDeleteDialogOpen(false);
    }
  };

  const handleNotesBlur = () => {
    if (notes !== lead.notes && onNotesChange) {
      onNotesChange(notes);
    }
  };

  return (
    <SectionCard title="ACTIONS">
      {/* Status Dropdown */}
      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
        <InputLabel
          sx={{
            color: '#8b949e',
            '&.Mui-focused': { color: '#4ade80' },
          }}
        >
          Status
        </InputLabel>
        <Select
          value={lead.status}
          onChange={(e) => onStatusChange?.(e.target.value as LeadQueueStatus)}
          label="Status"
          sx={{
            bgcolor: '#21262d',
            color: '#f0f6fc',
            '& .MuiOutlinedInput-notchedOutline': { borderColor: '#30363d' },
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#4ade80' },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#4ade80' },
            '& .MuiSvgIcon-root': { color: '#8b949e' },
          }}
          MenuProps={{
            PaperProps: {
              sx: {
                bgcolor: '#21262d',
                border: '1px solid #30363d',
                '& .MuiMenuItem-root': {
                  color: '#f0f6fc',
                  '&:hover': { bgcolor: '#30363d' },
                  '&.Mui-selected': { bgcolor: 'rgba(74, 222, 128, 0.15)' },
                },
              },
            },
          }}
        >
          {STATUS_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Quick Action Buttons */}
      <Stack spacing={1} sx={{ mb: 2 }}>
        {lead.status === 'New' && (
          <Button
            fullWidth
            variant="contained"
            startIcon={<CheckCircleIcon />}
            onClick={() => onAction?.('markContacted')}
            sx={{
              bgcolor: '#4ade80',
              color: '#0d1117',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.85rem',
              '&:hover': { bgcolor: '#86efac' },
            }}
          >
            Mark Contacted
          </Button>
        )}
        <Button
          fullWidth
          variant="outlined"
          startIcon={<ScheduleIcon />}
          onClick={() => onAction?.('scheduleFollowUp')}
          sx={{
            borderColor: '#30363d',
            color: '#f0f6fc',
            textTransform: 'none',
            fontWeight: 500,
            fontSize: '0.85rem',
            '&:hover': {
              borderColor: '#4ade80',
              bgcolor: 'rgba(74, 222, 128, 0.1)',
            },
          }}
        >
          Schedule Follow-Up
        </Button>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<ArchiveIcon />}
            onClick={() => onAction?.('archive')}
            sx={{
              borderColor: '#30363d',
              color: '#8b949e',
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '0.85rem',
              '&:hover': {
                borderColor: '#8b949e',
                bgcolor: 'rgba(139, 148, 158, 0.1)',
              },
            }}
          >
            Archive Lead
          </Button>
          <Tooltip title="Delete Permanently" arrow>
            <IconButton
              onClick={() => setDeleteDialogOpen(true)}
              size="small"
              sx={{
                color: '#6e7681',
                '&:hover': {
                  color: '#f87171',
                  bgcolor: 'rgba(248, 113, 113, 0.1)',
                },
              }}
            >
              <DeleteForeverIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Stack>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        leadAddress={lead.address}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteDialogOpen(false)}
        loading={deleteLoading}
      />

      {/* Notes Section */}
      <Box>
        <Typography
          variant="caption"
          sx={{ color: '#8b949e', mb: 1, display: 'block', fontSize: '0.7rem' }}
        >
          Notes:
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={handleNotesBlur}
          placeholder="Add notes about this lead..."
          sx={{
            '& .MuiOutlinedInput-root': {
              bgcolor: '#21262d',
              fontSize: '0.85rem',
              '& fieldset': { borderColor: '#30363d' },
              '&:hover fieldset': { borderColor: '#4ade80' },
              '&.Mui-focused fieldset': { borderColor: '#4ade80' },
            },
            '& .MuiInputBase-input': { color: '#f0f6fc' },
            '& .MuiInputBase-input::placeholder': { color: '#8b949e' },
          }}
        />
      </Box>
    </SectionCard>
  );
};

export default ActionsSection;

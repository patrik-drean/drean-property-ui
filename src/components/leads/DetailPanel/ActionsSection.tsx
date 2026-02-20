import React, { useState, useEffect } from 'react';
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
  Unarchive as UnarchiveIcon,
  DeleteForever as DeleteForeverIcon,
  Event as EventIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { QueueLead, LeadQueueStatus } from '../../../types/queue';
import { SectionCard } from './SectionCard';
import { DeleteConfirmationDialog } from '../shared';

interface ActionsSectionProps {
  lead: QueueLead;
  onStatusChange?: (status: LeadQueueStatus) => void;
  onAction?: (action: string, data?: any) => void;
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

  // Only sync notes when switching to a different lead (not on every lead.notes change)
  // This prevents overwriting user's typing when refetch/WebSocket updates arrive
  useEffect(() => {
    setNotes(lead.notes || '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lead.id]);
  const [showFollowUpPicker, setShowFollowUpPicker] = useState(false);
  const [followUpDate, setFollowUpDate] = useState(() => {
    // Default to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });

  const handleDeleteConfirm = async () => {
    if (onDeletePermanently) {
      await onDeletePermanently();
      setDeleteDialogOpen(false);
    }
  };

  const formatFollowUpDate = (dateStr: string | undefined) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);

    if (dateOnly.getTime() === today.getTime()) return 'Today';
    if (dateOnly.getTime() === tomorrow.getTime()) return 'Tomorrow';

    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const handleCancelFollowUp = () => {
    // Cancel follow-up by scheduling with no date (or a past action)
    onAction?.('cancelFollowUp');
  };

  const handleNotesBlur = () => {
    if (notes !== lead.notes && onNotesChange) {
      onNotesChange(notes);
    }
  };

  return (
    <SectionCard title="ACTIONS">
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
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
        {/* Current Follow-up Indicator */}
        {lead.followUpDate && !showFollowUpPicker && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              p: 1.5,
              borderRadius: 1,
              backgroundColor: 'rgba(251, 191, 36, 0.1)',
              border: '1px solid rgba(251, 191, 36, 0.3)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <EventIcon sx={{ fontSize: '1rem', color: '#fbbf24' }} />
              <Box>
                <Typography
                  variant="caption"
                  sx={{ color: '#8b949e', fontSize: '0.7rem', display: 'block' }}
                >
                  Follow-up scheduled
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: '#fbbf24', fontWeight: 600, fontSize: '0.85rem' }}
                >
                  {formatFollowUpDate(lead.followUpDate)}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <Tooltip title="Reschedule">
                <IconButton
                  size="small"
                  onClick={() => setShowFollowUpPicker(true)}
                  sx={{
                    color: '#8b949e',
                    '&:hover': { color: '#fbbf24', bgcolor: 'rgba(251, 191, 36, 0.1)' },
                  }}
                >
                  <ScheduleIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Cancel follow-up">
                <IconButton
                  size="small"
                  onClick={handleCancelFollowUp}
                  sx={{
                    color: '#8b949e',
                    '&:hover': { color: '#f87171', bgcolor: 'rgba(248, 113, 113, 0.1)' },
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        )}
        {!lead.followUpDate && !showFollowUpPicker ? (
          <Button
            fullWidth
            variant="outlined"
            startIcon={<ScheduleIcon />}
            onClick={() => setShowFollowUpPicker(true)}
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
        ) : showFollowUpPicker ? (
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <TextField
              type="date"
              size="small"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              sx={{
                flex: 1,
                '& .MuiOutlinedInput-root': {
                  bgcolor: '#21262d',
                  '& fieldset': { borderColor: '#30363d' },
                  '&:hover fieldset': { borderColor: '#4ade80' },
                  '&.Mui-focused fieldset': { borderColor: '#4ade80' },
                },
                '& .MuiInputBase-input': {
                  color: '#f0f6fc',
                  fontSize: '0.85rem',
                },
              }}
              inputProps={{
                min: new Date().toISOString().split('T')[0],
              }}
            />
            <Button
              variant="contained"
              size="small"
              onClick={() => {
                onAction?.('scheduleFollowUp', { followUpDate });
                setShowFollowUpPicker(false);
              }}
              sx={{
                bgcolor: '#4ade80',
                color: '#0d1117',
                textTransform: 'none',
                fontWeight: 600,
                minWidth: 'auto',
                px: 2,
                '&:hover': { bgcolor: '#86efac' },
              }}
            >
              Set
            </Button>
            <Button
              variant="text"
              size="small"
              onClick={() => setShowFollowUpPicker(false)}
              sx={{
                color: '#8b949e',
                textTransform: 'none',
                minWidth: 'auto',
                px: 1,
              }}
            >
              Cancel
            </Button>
          </Box>
        ) : null}
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {lead.archived ? (
            <Button
              fullWidth
              variant="outlined"
              startIcon={<UnarchiveIcon />}
              onClick={() => onAction?.('unarchive')}
              sx={{
                borderColor: '#30363d',
                color: '#4ade80',
                textTransform: 'none',
                fontWeight: 500,
                fontSize: '0.85rem',
                '&:hover': {
                  borderColor: '#4ade80',
                  bgcolor: 'rgba(74, 222, 128, 0.1)',
                },
              }}
            >
              Restore Lead
            </Button>
          ) : (
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
          )}
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
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <Typography
          variant="caption"
          sx={{ color: '#8b949e', mb: 1, display: 'block', fontSize: '0.7rem' }}
        >
          Notes:
        </Typography>
        <TextField
          fullWidth
          multiline
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={handleNotesBlur}
          placeholder="Add notes about this lead..."
          sx={{
            flex: 1,
            display: 'flex',
            '& .MuiOutlinedInput-root': {
              bgcolor: '#21262d',
              fontSize: '0.85rem',
              height: '100%',
              alignItems: 'flex-start',
              '& fieldset': { borderColor: '#30363d' },
              '&:hover fieldset': { borderColor: '#4ade80' },
              '&.Mui-focused fieldset': { borderColor: '#4ade80' },
            },
            '& .MuiInputBase-input': { color: '#f0f6fc', height: '100% !important', overflow: 'auto !important' },
            '& .MuiInputBase-input::placeholder': { color: '#8b949e' },
          }}
        />
      </Box>
      </Box>
    </SectionCard>
  );
};

export default ActionsSection;

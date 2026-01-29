import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';

interface DeleteConfirmationDialogProps {
  open: boolean;
  leadAddress: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

/**
 * Confirmation dialog for permanently deleting a lead.
 * Displays a warning message and requires explicit confirmation.
 */
export const DeleteConfirmationDialog: React.FC<DeleteConfirmationDialogProps> = ({
  open,
  leadAddress,
  onConfirm,
  onCancel,
  loading = false,
}) => {
  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onCancel}
      PaperProps={{
        sx: {
          bgcolor: '#161b22',
          border: '1px solid #30363d',
          borderRadius: 2,
          maxWidth: 400,
        },
      }}
    >
      <DialogTitle
        sx={{
          color: '#f0f6fc',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          pb: 1,
        }}
      >
        <WarningIcon sx={{ color: '#f87171' }} />
        Delete Lead Permanently
      </DialogTitle>

      <DialogContent>
        <Typography sx={{ color: '#8b949e', mb: 2 }}>
          Are you sure you want to permanently delete this lead?
        </Typography>

        <Box
          sx={{
            p: 2,
            bgcolor: '#21262d',
            borderRadius: 1,
            border: '1px solid #30363d',
            mb: 2,
          }}
        >
          <Typography sx={{ color: '#f0f6fc', fontWeight: 600 }}>
            {leadAddress}
          </Typography>
        </Box>

        <Alert
          severity="warning"
          icon={false}
          sx={{
            bgcolor: 'rgba(248, 113, 113, 0.1)',
            border: '1px solid rgba(248, 113, 113, 0.3)',
            '& .MuiAlert-message': { color: '#f87171' },
          }}
        >
          This action is permanent and cannot be undone. All messages, notes, and
          history will be deleted.
        </Alert>
      </DialogContent>

      <DialogActions sx={{ p: 2, pt: 0, gap: 1 }}>
        <Button
          onClick={onCancel}
          disabled={loading}
          sx={{
            color: '#8b949e',
            '&:hover': { bgcolor: 'rgba(139, 148, 158, 0.1)' },
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          disabled={loading}
          variant="contained"
          sx={{
            bgcolor: '#f87171',
            color: '#fff',
            minWidth: 140,
            '&:hover': { bgcolor: '#ef4444' },
            '&.Mui-disabled': {
              bgcolor: 'rgba(248, 113, 113, 0.5)',
              color: 'rgba(255, 255, 255, 0.7)',
            },
          }}
        >
          {loading ? (
            <CircularProgress size={20} sx={{ color: '#fff' }} />
          ) : (
            'Delete Permanently'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteConfirmationDialog;

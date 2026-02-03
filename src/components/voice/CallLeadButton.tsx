import React, { useState } from 'react';
import { Button, Tooltip, IconButton, CircularProgress, Snackbar, Alert } from '@mui/material';
import { Phone as PhoneIcon } from '@mui/icons-material';
import { voiceService } from '../../services/voiceService';

// Generic interface that works with both PropertyLead and QueueLead
interface CallableLead {
  id: string;
  sellerPhone?: string | null;
}

interface CallLeadButtonProps {
  lead: CallableLead;
  variant?: 'text' | 'outlined' | 'contained';
  size?: 'small' | 'medium' | 'large';
  iconOnly?: boolean;
  onCallInitiated?: () => void;
}

export const CallLeadButton: React.FC<CallLeadButtonProps> = ({
  lead,
  variant = 'outlined',
  size = 'small',
  iconOnly = false,
  onCallInitiated,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!lead.sellerPhone) return;

    setIsLoading(true);
    try {
      const result = await voiceService.initiateCall({
        toPhoneNumber: lead.sellerPhone,
        propertyLeadId: lead.id,
      });

      if (result.success) {
        showSnackbar('Call initiated! Your phone will ring shortly.', 'success');
        onCallInitiated?.();
      } else {
        showSnackbar(result.errorMessage || 'Failed to initiate call', 'error');
      }
    } catch (error: any) {
      console.error('Failed to initiate call:', error);
      showSnackbar(
        error.response?.data?.message || 'Failed to initiate call',
        'error'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const snackbarComponent = (
    <Snackbar
      open={snackbar.open}
      autoHideDuration={6000}
      onClose={() => setSnackbar({ ...snackbar, open: false })}
    >
      <Alert
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        severity={snackbar.severity}
      >
        {snackbar.message}
      </Alert>
    </Snackbar>
  );

  const hasPhone = lead.sellerPhone && lead.sellerPhone.trim() !== '';

  if (!hasPhone) {
    return iconOnly ? (
      <Tooltip title="No phone number available">
        <span>
          <IconButton size={size} disabled>
            <PhoneIcon fontSize={size} />
          </IconButton>
        </span>
      </Tooltip>
    ) : (
      <Tooltip title="No phone number available">
        <span>
          <Button
            variant={variant}
            size={size}
            startIcon={<PhoneIcon />}
            disabled
          >
            Call
          </Button>
        </span>
      </Tooltip>
    );
  }

  return (
    <>
      {iconOnly ? (
        <Tooltip title="Click to Call">
          <IconButton
            size={size}
            onClick={handleClick}
            color="success"
            disabled={isLoading}
          >
            {isLoading ? (
              <CircularProgress size={size === 'small' ? 18 : 24} />
            ) : (
              <PhoneIcon fontSize={size} />
            )}
          </IconButton>
        </Tooltip>
      ) : (
        <Button
          variant={variant}
          size={size}
          startIcon={
            isLoading ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <PhoneIcon />
            )
          }
          onClick={handleClick}
          disabled={isLoading}
          color="success"
        >
          {isLoading ? 'Calling...' : 'Call'}
        </Button>
      )}
      {snackbarComponent}
    </>
  );
};

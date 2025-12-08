import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  CircularProgress,
  Typography,
  Box,
} from '@mui/material';
import { Phone as PhoneIcon } from '@mui/icons-material';

interface NewMessageDialogProps {
  open: boolean;
  onClose: () => void;
  onStartConversation: (phoneNumber: string) => Promise<void>;
}

// Format phone number as user types (US format)
const formatPhoneNumber = (value: string): string => {
  // Remove all non-digits
  const digits = value.replace(/\D/g, '');

  // Limit to 11 digits (1 + 10 digit US number)
  const limited = digits.slice(0, 11);

  // Format based on length
  if (limited.length === 0) return '';
  if (limited.length <= 3) return `(${limited}`;
  if (limited.length <= 6) return `(${limited.slice(0, 3)}) ${limited.slice(3)}`;
  if (limited.length <= 10) return `(${limited.slice(0, 3)}) ${limited.slice(3, 6)}-${limited.slice(6)}`;
  // 11 digits with country code
  return `+${limited.slice(0, 1)} (${limited.slice(1, 4)}) ${limited.slice(4, 7)}-${limited.slice(7)}`;
};

// Extract raw digits from formatted phone
const extractDigits = (value: string): string => {
  return value.replace(/\D/g, '');
};

// Validate phone number (must have at least 10 digits)
const isValidPhone = (value: string): boolean => {
  const digits = extractDigits(value);
  return digits.length >= 10;
};

// Normalize to E.164 format for API
const normalizeToE164 = (value: string): string => {
  const digits = extractDigits(value);
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }
  return `+${digits}`;
};

export const NewMessageDialog: React.FC<NewMessageDialogProps> = ({
  open,
  onClose,
  onStartConversation,
}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!isValidPhone(phoneNumber)) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const normalized = normalizeToE164(phoneNumber);
      await onStartConversation(normalized);
      handleClose();
    } catch (err: any) {
      setError(err.message || 'Failed to start conversation');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPhoneNumber('');
    setError(null);
    setLoading(false);
    onClose();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading && isValidPhone(phoneNumber)) {
      handleSubmit();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>New Message</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Enter a phone number to start a new conversation or continue an existing one.
          </Typography>
          <TextField
            autoFocus
            fullWidth
            label="Phone Number"
            placeholder="(555) 123-4567"
            value={phoneNumber}
            onChange={handlePhoneChange}
            onKeyPress={handleKeyPress}
            error={!!error}
            helperText={error}
            disabled={loading}
            InputProps={{
              startAdornment: (
                <PhoneIcon sx={{ mr: 1, color: 'action.active' }} />
              ),
            }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !isValidPhone(phoneNumber)}
          startIcon={loading ? <CircularProgress size={16} /> : null}
        >
          {loading ? 'Starting...' : 'Start Conversation'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

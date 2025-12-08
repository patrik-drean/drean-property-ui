import React, { useState } from 'react';
import {
  Box,
  TextField,
  IconButton,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';
import { smsService } from '../../services/smsService';
import { TemplatePicker } from './TemplatePicker';
import { TemplateVariables } from '../../types/sms';

interface MessageComposerProps {
  phoneNumber: string;
  propertyLeadId?: string;
  contactId?: string;
  onMessageSent: () => void;
  leadName?: string;
  leadAddress?: string;
  leadPrice?: string;
}

const MAX_SMS_LENGTH = 160;
const MAX_TOTAL_LENGTH = 1600; // ~10 segments

export const MessageComposer: React.FC<MessageComposerProps> = ({
  phoneNumber,
  propertyLeadId,
  contactId,
  onMessageSent,
  leadName,
  leadAddress,
  leadPrice,
}) => {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const templateVariables: TemplateVariables = {
    name: leadName,
    address: leadAddress,
    price: leadPrice,
    phone: phoneNumber,
  };

  const handleTemplateSelect = (body: string) => {
    setMessage(body);
  };

  const segments = Math.ceil(message.length / MAX_SMS_LENGTH);
  const isOverLimit = message.length > MAX_TOTAL_LENGTH;

  const handleSend = async () => {
    if (!message.trim() || sending || isOverLimit) return;

    setSending(true);

    try {
      const response = await smsService.sendMessage({
        toPhoneNumber: phoneNumber,
        body: message.trim(),
        propertyLeadId,
        contactId,
      });

      if (!response.success) {
        setSnackbar({
          open: true,
          message: response.errorMessage || 'Failed to send message. You can retry from the message.',
          severity: 'error',
        });
      } else {
        setMessage('');
        onMessageSent();
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data ||
        err.message ||
        'Network error. Please check your connection and try again.';
      setSnackbar({
        open: true,
        message: typeof errorMessage === 'string' ? errorMessage : 'Failed to send message',
        severity: 'error',
      });
    } finally {
      setSending(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Box sx={{ p: 2, borderTop: '1px solid #e0e0e0', backgroundColor: 'white' }}>
      <Box sx={{ mb: 1 }}>
        <TemplatePicker
          variables={templateVariables}
          onSelect={handleTemplateSelect}
          disabled={sending}
        />
      </Box>

      <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
        <TextField
          fullWidth
          multiline
          maxRows={4}
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={sending}
          error={isOverLimit}
          helperText={
            message.length > 0 ? (
              <Box component="span" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{message.length} / {MAX_TOTAL_LENGTH}</span>
                {segments > 1 && <span>({segments} segments)</span>}
              </Box>
            ) : null
          }
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
            },
          }}
        />
        <IconButton
          color="primary"
          onClick={handleSend}
          disabled={!message.trim() || sending || isOverLimit}
          sx={{
            backgroundColor: 'primary.main',
            color: 'white',
            '&:hover': { backgroundColor: 'primary.dark' },
            '&.Mui-disabled': { backgroundColor: 'action.disabledBackground' },
          }}
        >
          {sending ? <CircularProgress size={24} color="inherit" /> : <SendIcon />}
        </IconButton>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={handleCloseSnackbar}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

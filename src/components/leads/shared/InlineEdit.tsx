import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Stack,
} from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';
import { ConfidenceBadge, ConfidenceSource, ConfidenceLevel } from './ConfidenceBadge';
import { InfoAlert } from './InfoAlert';
import { RawJsonTooltip } from './RawJsonTooltip';

interface InlineEditProps {
  /** Label displayed above the value */
  label: string;
  /** Current value */
  value: number | string;
  /** Confidence level or percentage (0-100) for legacy support */
  confidence?: ConfidenceLevel | number;
  /** Source of the value: ai, manual, or rentcast */
  source?: ConfidenceSource;
  /** Optional note explaining the value */
  note?: string;
  /** Callback when value is saved */
  onSave: (newValue: number | string, note?: string) => void;
  /** Format value for display (e.g., currency formatting) */
  formatValue?: (value: number | string) => string;
  /** Parse input string to value type */
  parseValue?: (input: string) => number | string;
  /** Validate the value, return error message or null */
  validate?: (value: number | string) => string | null;
  /** Disable editing */
  disabled?: boolean;
  /** Optional info message shown during editing */
  infoMessage?: string;
  /** Format value with commas during editing (for currency inputs) */
  formatWithCommas?: boolean;
  /** Raw data object for JSON tooltip display */
  rawData?: object | null;
  /** Label for raw data tooltip */
  rawDataLabel?: string;
}

/**
 * InlineEdit - Inline editing component for evaluation metrics
 *
 * Features:
 * - View mode: displays formatted value with confidence badge and optional note
 * - Edit mode: text input, note field, save/cancel buttons
 * - Keyboard shortcuts: Enter to save, Escape to cancel
 * - Validation support with error display
 * - PropGuide dark theme styling
 */
export const InlineEdit: React.FC<InlineEditProps> = ({
  label,
  value,
  confidence,
  source,
  note,
  onSave,
  formatValue = (v) => String(v),
  parseValue = (v) => v,
  validate,
  disabled = false,
  infoMessage = 'MAO will recalculate automatically',
  formatWithCommas = false,
  rawData,
  rawDataLabel,
}) => {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(value));
  const [editNote, setEditNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Helper to format number with commas
  const formatNumberWithCommas = (val: string | number): string => {
    const numStr = String(val).replace(/[^0-9.-]/g, '');
    const num = parseFloat(numStr);
    if (isNaN(num)) return String(val);
    return num.toLocaleString('en-US', { maximumFractionDigits: 0 });
  };

  // Helper to strip commas from formatted value
  const stripCommas = (val: string): string => {
    return val.replace(/,/g, '');
  };

  // Reset edit value when external value changes
  useEffect(() => {
    if (!editing) {
      setEditValue(formatWithCommas ? formatNumberWithCommas(value) : String(value));
    }
  }, [value, editing, formatWithCommas]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const handleSave = () => {
    // Strip commas before parsing if formatWithCommas is enabled
    const valueToparse = formatWithCommas ? stripCommas(editValue) : editValue;
    const parsedValue = parseValue(valueToparse);
    if (validate) {
      const validationError = validate(parsedValue);
      if (validationError) {
        setError(validationError);
        return;
      }
    }
    onSave(parsedValue, editNote || undefined);
    setEditing(false);
    setError(null);
    setEditNote('');
  };

  const handleCancel = () => {
    setEditing(false);
    setEditValue(formatWithCommas ? formatNumberWithCommas(value) : String(value));
    setEditNote('');
    setError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const handleStartEdit = () => {
    if (!disabled) {
      setEditing(true);
      const initialValue = formatWithCommas ? formatNumberWithCommas(value) : String(value);
      setEditValue(initialValue);
    }
  };

  // Edit mode
  if (editing) {
    return (
      <Box
        sx={{
          p: 2,
          bgcolor: '#21262d',
          border: '1px solid #4ade80',
          borderRadius: 2,
        }}
      >
        <Typography variant="caption" sx={{ color: '#8b949e', mb: 1, display: 'block' }}>
          {label}
        </Typography>

        <TextField
          fullWidth
          inputRef={inputRef}
          value={editValue}
          onChange={(e) => {
            const newValue = e.target.value;
            if (formatWithCommas) {
              // Strip non-numeric chars (except commas for display), then reformat
              const stripped = newValue.replace(/[^0-9]/g, '');
              if (stripped === '') {
                setEditValue('');
              } else {
                setEditValue(parseInt(stripped, 10).toLocaleString('en-US'));
              }
            } else {
              setEditValue(newValue);
            }
            setError(null);
          }}
          onKeyDown={handleKeyDown}
          error={!!error}
          helperText={error}
          size="small"
          placeholder="Enter value"
          sx={{
            mb: 1.5,
            '& .MuiOutlinedInput-root': {
              bgcolor: '#161b22',
              '& fieldset': { borderColor: '#30363d' },
              '&:hover fieldset': { borderColor: '#4ade80' },
              '&.Mui-focused fieldset': { borderColor: '#4ade80' },
              '&.Mui-error fieldset': { borderColor: '#f87171' },
            },
            '& .MuiInputBase-input': { color: '#f0f6fc' },
            '& .MuiFormHelperText-root': { color: '#f87171' },
          }}
        />

        <TextField
          fullWidth
          placeholder="Reason for change (optional)"
          value={editNote}
          onChange={(e) => setEditNote(e.target.value)}
          onKeyDown={handleKeyDown}
          size="small"
          multiline
          rows={2}
          sx={{
            mb: 1.5,
            '& .MuiOutlinedInput-root': {
              bgcolor: '#161b22',
              '& fieldset': { borderColor: '#30363d' },
              '&:hover fieldset': { borderColor: '#4ade80' },
              '&.Mui-focused fieldset': { borderColor: '#4ade80' },
            },
            '& .MuiInputBase-input': { color: '#f0f6fc' },
            '& .MuiInputBase-input::placeholder': { color: '#8b949e', opacity: 1 },
          }}
        />

        <InfoAlert message={infoMessage} />

        <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
          <Button
            size="small"
            onClick={handleSave}
            sx={{
              bgcolor: '#4ade80',
              color: '#0d1117',
              fontWeight: 600,
              textTransform: 'none',
              '&:hover': { bgcolor: '#86efac' },
            }}
          >
            Save
          </Button>
          <Button
            size="small"
            onClick={handleCancel}
            variant="outlined"
            sx={{
              borderColor: '#30363d',
              color: '#8b949e',
              textTransform: 'none',
              '&:hover': { borderColor: '#8b949e', bgcolor: 'rgba(139, 148, 158, 0.1)' },
            }}
          >
            Cancel
          </Button>
        </Stack>
      </Box>
    );
  }

  // View mode
  const valueElement = (
    <Typography
      variant="h6"
      sx={{ fontWeight: 600, color: '#f0f6fc', cursor: rawData ? 'help' : 'default' }}
    >
      {formatValue(value)}
    </Typography>
  );

  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="caption" sx={{ color: '#8b949e' }}>
          {label}
        </Typography>
        {!disabled && (
          <IconButton
            size="small"
            onClick={handleStartEdit}
            aria-label={`Edit ${label}`}
            sx={{
              color: '#8b949e',
              '&:hover': { color: '#4ade80', bgcolor: 'rgba(74, 222, 128, 0.1)' },
            }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        )}
      </Box>

      {rawData ? (
        <RawJsonTooltip data={rawData} label={rawDataLabel || label}>
          {valueElement}
        </RawJsonTooltip>
      ) : (
        valueElement
      )}

      <ConfidenceBadge confidence={confidence} source={source} note={note} />
    </Box>
  );
};

export default InlineEdit;

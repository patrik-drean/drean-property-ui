import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Divider,
  Typography,
  IconButton,
  InputAdornment,
  Tooltip,
  CircularProgress,
  Alert
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { scorePropertyLead } from '../services/api';

interface PropertyLeadDialogProps {
  open: boolean;
  isEditing: boolean;
  initialFormData: any;
  onSave: (formData: any) => void;
  onClose: () => void;
  handleCurrencyInput: (value: string) => number;
  formatInputCurrency: (value: number) => string;
}

const PropertyLeadDialog: React.FC<PropertyLeadDialogProps> = ({
  open,
  isEditing,
  initialFormData,
  onSave,
  onClose,
  handleCurrencyInput,
  formatInputCurrency
}) => {
  const [formData, setFormData] = useState(initialFormData);
  const [loadingScore, setLoadingScore] = useState(false);
  const [scoreError, setScoreError] = useState<string | null>(null);

  // Handle scoring a property from Zillow URL
  const handleScoreProperty = async () => {
    if (!formData.zillowLink) {
      setScoreError('Please enter a Zillow URL first');
      return;
    }

    if (!formData.zillowLink.includes('zillow.com')) {
      setScoreError('Please enter a valid Zillow URL');
      return;
    }

    try {
      setLoadingScore(true);
      setScoreError(null);

      const data = await scorePropertyLead(formData.zillowLink);

      // Populate form fields with scored data
      setFormData((prev: any) => ({
        ...prev,
        address: data.address || prev.address,
        listingPrice: data.listingPrice || prev.listingPrice,
        zillowLink: data.zillowLink || prev.zillowLink,
        squareFootage: data.sqft || prev.squareFootage,
        units: data.units || prev.units,
        sellerPhone: data.agentInfo?.phone || prev.sellerPhone,
        sellerEmail: data.agentInfo?.email || prev.sellerEmail,
        notes: data.note || prev.notes,
        leadScore: data.leadScore || prev.leadScore,
        metadata: data.metadata ? JSON.stringify(data.metadata) : prev.metadata,
      }));

    } catch (err: any) {
      console.error('Error scoring property:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to score property';
      setScoreError(errorMessage);
    } finally {
      setLoadingScore(false);
    }
  };

  // Helper function to check if a metadata key represents a financial value
  const isFinancialKey = (key: string): boolean => {
    const lowerKey = key.toLowerCase();
    return lowerKey.includes('price') ||
           lowerKey.includes('estimate') ||
           lowerKey.includes('value') ||
           lowerKey.includes('arv') ||
           lowerKey.includes('zestimate') ||
           lowerKey.includes('rent') ||
           lowerKey.includes('cost');
  };

  // Helper function to check if a metadata key represents a ratio/percentage
  const isRatioKey = (key: string): boolean => {
    const lowerKey = key.toLowerCase();
    return lowerKey.includes('ratio') ||
           lowerKey.includes('percent') ||
           lowerKey.includes('rate');
  };

  // Helper function to format currency
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Helper function to format metadata value based on its key and type
  const formatMetadataValue = (key: string, value: any): string => {
    // Check if it's a number
    if (typeof value === 'number') {
      // Format as percentage if it's a ratio field
      if (isRatioKey(key)) {
        return `${(value * 100).toFixed(1)}%`;
      }
      // Format as currency if it's a financial field
      if (isFinancialKey(key)) {
        return formatCurrency(value);
      }
    }
    return String(value);
  };

  useEffect(() => {
    if (open) {
      setFormData(initialFormData);
    }
  }, [open, initialFormData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleZillowLinkBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Optionally, add Zillow parsing logic here if needed
  };

  const handleCopyId = () => {
    if (formData.id) {
      navigator.clipboard.writeText(formData.id);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>
        {isEditing ? 'Edit Property Lead' : 'Add Property Lead'}
      </DialogTitle>
      <DialogContent>
        <Box component="form" sx={{ mt: 2 }}>
          {isEditing && formData.id && (
            <TextField
              label="Lead ID"
              value={formData.id}
              fullWidth
              margin="normal"
              InputProps={{
                readOnly: true,
                endAdornment: (
                  <InputAdornment position="end">
                    <Tooltip title="Copy Lead ID">
                      <IconButton
                        onClick={handleCopyId}
                        edge="end"
                        size="small"
                      >
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </InputAdornment>
                ),
              }}
              sx={{
                mb: 2,
                '& .MuiInputBase-input': {
                  color: 'text.secondary',
                  fontFamily: 'monospace'
                }
              }}
            />
          )}
          <TextField
            label="Zillow Link"
            name="zillowLink"
            value={formData.zillowLink}
            onChange={handleInputChange}
            onBlur={handleZillowLinkBlur}
            fullWidth
            margin="normal"
            placeholder="Paste Zillow link to auto-fill address and price"
          />

          {/* Score Property Button */}
          <Button
            variant="outlined"
            color="primary"
            onClick={handleScoreProperty}
            disabled={!formData.zillowLink || loadingScore}
            startIcon={loadingScore ? <CircularProgress size={20} /> : <AutoFixHighIcon />}
            sx={{ mb: 2, mt: 1 }}
          >
            {loadingScore ? 'Scoring...' : 'Score Property'}
          </Button>

          {/* Score Error Alert */}
          {scoreError && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setScoreError(null)}>
              {scoreError}
            </Alert>
          )}

          <TextField
            label="Address"
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            fullWidth
            margin="normal"
            required
          />
          <TextField
            label="Listing Price"
            name="listingPrice"
            value={formatInputCurrency(Number(formData.listingPrice))}
            onChange={(e) => {
              setFormData((prev: any) => ({
                ...prev,
                listingPrice: handleCurrencyInput(e.target.value)
              }));
            }}
            fullWidth
            margin="normal"
            required
            InputProps={{
              startAdornment: <span style={{ marginRight: '8px' }}>$</span>,
            }}
          />
          <TextField
            label="Seller Phone"
            name="sellerPhone"
            value={formData.sellerPhone}
            onChange={handleInputChange}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Seller Email"
            name="sellerEmail"
            value={formData.sellerEmail}
            onChange={handleInputChange}
            fullWidth
            margin="normal"
            type="email"
          />
          <TextField
            label="Square Footage"
            name="squareFootage"
            value={formData.squareFootage !== null ? formData.squareFootage : ''}
            onChange={(e) => {
              const value = e.target.value.trim() === '' ? null : parseInt(e.target.value, 10);
              setFormData((prev: any) => ({ ...prev, squareFootage: value }));
            }}
            fullWidth
            margin="normal"
            type="number"
          />
          <TextField
            label="Units"
            name="units"
            value={formData.units !== null ? formData.units : ''}
            onChange={(e) => {
              const value = e.target.value.trim() === '' ? null : parseInt(e.target.value, 10);
              setFormData((prev: any) => ({ ...prev, units: value }));
            }}
            fullWidth
            margin="normal"
            type="number"
            inputProps={{ min: 1 }}
          />
          <TextField
            label="Notes"
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            fullWidth
            margin="normal"
            multiline
            rows={3}
            placeholder="Add any notes about this property lead..."
          />

          {/* Metadata Display (Read-only) */}
          {isEditing && formData.metadata && (() => {
            try {
              const parsed = JSON.parse(formData.metadata);
              return Object.keys(parsed).length > 0;
            } catch {
              return false;
            }
          })() && (
            <>
              <Divider sx={{ my: 3 }} />
              <Typography variant="h6" gutterBottom>
                Metadata
              </Typography>
              <Box
                sx={{
                  backgroundColor: 'grey.50',
                  border: '1px solid',
                  borderColor: 'grey.300',
                  borderRadius: 1,
                  p: 2,
                  mt: 1
                }}
              >
                {(() => {
                  try {
                    const parsed = JSON.parse(formData.metadata!);
                    return Object.entries(parsed).map(([key, value], index) => (
                      <Typography
                        key={index}
                        variant="body2"
                        sx={{
                          mb: 0.5,
                          color: 'text.secondary'
                        }}
                      >
                        <strong>{key}:</strong> {formatMetadataValue(key, value)}
                      </Typography>
                    ));
                  } catch {
                    return null;
                  }
                })()}
              </Box>
              <Typography variant="caption" sx={{ mt: 1, display: 'block', color: 'text.secondary' }}>
                Metadata can be populated by clients or backend integrations.
              </Typography>
            </>
          )}

          {/* Stage Tracking Section */}
          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" gutterBottom>
            Stage Tracking
          </Typography>

          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <DatePicker
                label="Contacted Date"
                value={formData.lastContactDate ? new Date(formData.lastContactDate) : null}
                onChange={(newValue) => setFormData({ ...formData, lastContactDate: newValue ? newValue.toISOString() : null })}
                slotProps={{
                  textField: {
                    fullWidth: true,
                  },
                }}
              />

              <DatePicker
                label="Responded Date"
                value={formData.respondedDate ? new Date(formData.respondedDate) : null}
                onChange={(newValue) => setFormData({ ...formData, respondedDate: newValue ? newValue.toISOString() : null })}
                slotProps={{
                  textField: {
                    fullWidth: true,
                  },
                }}
              />

              <DatePicker
                label="Converted Date"
                value={formData.convertedDate ? new Date(formData.convertedDate) : null}
                onChange={(newValue) => setFormData({ ...formData, convertedDate: newValue ? newValue.toISOString() : null })}
                slotProps={{
                  textField: {
                    fullWidth: true,
                  },
                }}
              />

              <DatePicker
                label="Under Contract Date"
                value={formData.underContractDate ? new Date(formData.underContractDate) : null}
                onChange={(newValue) => setFormData({ ...formData, underContractDate: newValue ? newValue.toISOString() : null })}
                slotProps={{
                  textField: {
                    fullWidth: true,
                  },
                }}
              />

              <DatePicker
                label="Sold Date"
                value={formData.soldDate ? new Date(formData.soldDate) : null}
                onChange={(newValue) => setFormData({ ...formData, soldDate: newValue ? newValue.toISOString() : null })}
                slotProps={{
                  textField: {
                    fullWidth: true,
                  },
                }}
              />
            </Box>
          </LocalizationProvider>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={() => onSave(formData)} variant="contained" color="primary">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PropertyLeadDialog; 
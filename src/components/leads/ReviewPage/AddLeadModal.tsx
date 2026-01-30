import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  InputAdornment,
  CircularProgress,
  Collapse,
  Alert,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { leadQueueService, IngestLeadRequest, IngestLeadResponse } from '../../../services/leadQueueService';
import { parseListingUrl, UrlParseResult } from '../../../utils/urlParser';

type SubmitState = 'idle' | 'submitting' | 'success' | 'error';

interface FormData {
  zillowLink: string;
  address: string;
  listingPrice: number;
  city: string;
  state: string;
  zipCode: string;
  squareFootage: number | null;
  yearBuilt: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  units: number | null;
  sellerPhone: string;
  sellerEmail: string;
  agentName: string;
  agentPhone: string;
}

const initialFormData: FormData = {
  zillowLink: '',
  address: '',
  listingPrice: 0,
  city: '',
  state: '',
  zipCode: '',
  squareFootage: null,
  yearBuilt: null,
  bedrooms: null,
  bathrooms: null,
  units: null,
  sellerPhone: '',
  sellerEmail: '',
  agentName: '',
  agentPhone: '',
};

interface AddLeadModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (response: IngestLeadResponse) => void;
}

// Format currency for display
const formatInputCurrency = (value: number): string => {
  if (!value) return '';
  return value.toLocaleString('en-US');
};

// Parse currency input
const handleCurrencyInput = (value: string): number => {
  const cleaned = value.replace(/[^0-9]/g, '');
  return parseInt(cleaned, 10) || 0;
};

export const AddLeadModal: React.FC<AddLeadModalProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [formExpanded, setFormExpanded] = useState(false);
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [parseResult, setParseResult] = useState<UrlParseResult | null>(null);

  // Check if URL looks valid (for any supported site)
  const hasValidUrl = useCallback(() => {
    const url = formData.zillowLink?.trim() || '';
    return url.length > 10 && (
      url.includes('zillow.com') ||
      url.includes('redfin.com') ||
      url.includes('realtor.com') ||
      url.includes('trulia.com') ||
      url.includes('har.com')
    );
  }, [formData.zillowLink]);

  // Handle URL parsing when user leaves the URL field
  const handleUrlBlur = useCallback(() => {
    const url = formData.zillowLink?.trim();
    if (!url) {
      setParseResult(null);
      return;
    }

    const result = parseListingUrl(url);
    setParseResult(result);

    if (result.success && result.address) {
      // Auto-fill address fields from parsed URL
      setFormData(prev => ({
        ...prev,
        address: result.address!.fullAddress,
        city: result.address!.city,
        state: result.address!.state,
        zipCode: result.address!.zip,
      }));
      // Expand form to show auto-filled data and allow price entry
      setFormExpanded(true);
    } else if (!result.success) {
      // Expand form for manual entry when parsing fails
      setFormExpanded(true);
    }
  }, [formData.zillowLink]);

  // Handle form submission
  const handleSubmit = async () => {
    if (!formData.address || !formData.listingPrice) {
      setSubmitError('Address and listing price are required');
      return;
    }

    try {
      setSubmitState('submitting');
      setSubmitError(null);

      const request: IngestLeadRequest = {
        address: formData.address,
        listingPrice: formData.listingPrice,
        city: formData.city || undefined,
        state: formData.state || undefined,
        zipCode: formData.zipCode || undefined,
        squareFootage: formData.squareFootage || undefined,
        yearBuilt: formData.yearBuilt || undefined,
        bedrooms: formData.bedrooms || undefined,
        bathrooms: formData.bathrooms || undefined,
        units: formData.units || undefined,
        zillowLink: formData.zillowLink || undefined,
        sellerPhone: formData.sellerPhone || undefined,
        sellerEmail: formData.sellerEmail || undefined,
        agentName: formData.agentName || undefined,
        agentPhone: formData.agentPhone || undefined,
        source: 'manual',
        sendFirstMessage: false,
      };

      const response = await leadQueueService.ingestLead(request);
      setSubmitState('success');
      onSuccess(response);
      handleClose();
    } catch (err: any) {
      console.error('Error ingesting lead:', err);
      setSubmitError(err.response?.data?.detail || err.message || 'Failed to add lead');
      setSubmitState('error');
    }
  };

  // Reset state when dialog closes
  const handleClose = () => {
    setFormData(initialFormData);
    setFormExpanded(false);
    setSubmitState('idle');
    setSubmitError(null);
    setParseResult(null);
    onClose();
  };

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setFormData(initialFormData);
      setFormExpanded(false);
      setSubmitState('idle');
      setSubmitError(null);
      setParseResult(null);
    }
  }, [open]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear parse result when URL changes
    if (name === 'zillowLink') {
      setParseResult(null);
    }
  };

  // Common input styles
  const inputSx = {
    '& .MuiInputLabel-root': {
      color: 'rgba(255,255,255,0.9)',
      '&.Mui-focused': { color: '#10b981' },
    },
    '& .MuiInputBase-input': {
      color: '#ffffff !important',
      WebkitTextFillColor: '#ffffff !important',
      '&:-webkit-autofill': {
        WebkitBoxShadow: '0 0 0 100px #1a1d26 inset !important',
        WebkitTextFillColor: '#ffffff !important',
      },
    },
    '& .MuiInputBase-input::placeholder': { color: 'rgba(255,255,255,0.5)', opacity: 1 },
    '& .MuiOutlinedInput-root': {
      '& fieldset': { borderColor: 'rgba(255,255,255,0.4)' },
      '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.6)' },
      '&.Mui-focused fieldset': { borderColor: '#10b981' },
    },
    '& .MuiInputAdornment-root': { color: 'rgba(255,255,255,0.7)' },
  };

  const canSubmit = formData.address && formData.listingPrice > 0 && submitState !== 'submitting';

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          backgroundColor: '#1a1d26',
          backgroundImage: 'none',
        },
      }}
    >
      <DialogTitle sx={{ color: '#ffffff', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        Add New Lead
      </DialogTitle>
      <DialogContent sx={{ backgroundColor: '#1a1d26' }}>
        <Box component="form" sx={{ mt: 2 }}>
          {/* Listing URL Input */}
          <TextField
            label="Listing URL"
            name="zillowLink"
            value={formData.zillowLink}
            onChange={handleInputChange}
            onBlur={handleUrlBlur}
            fullWidth
            margin="normal"
            placeholder="Paste any Zillow, Redfin, Realtor.com, HAR, or Trulia link..."
            sx={inputSx}
          />

          {/* URL Parse Feedback */}
          {parseResult && (
            <Box sx={{ mt: 1, mb: 2 }}>
              {parseResult.success && parseResult.address ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircleOutlineIcon sx={{ color: '#10b981', fontSize: '1.2rem' }} />
                  <Typography variant="body2" sx={{ color: '#10b981' }}>
                    Address extracted: {parseResult.address.fullAddress}
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  <WarningAmberIcon sx={{ color: '#f59e0b', fontSize: '1.2rem', mt: 0.25 }} />
                  <Typography variant="body2" sx={{ color: '#f59e0b' }}>
                    {parseResult.error || 'Could not extract address from URL. Please enter details below.'}
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          {/* Hint text when URL is entered but not yet parsed */}
          {hasValidUrl() && !parseResult && (
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                color: 'rgba(255,255,255,0.5)',
                mt: 0.5,
                mb: 1,
              }}
            >
              Click outside the field to extract address from URL
            </Typography>
          )}

          {/* Listing Price - Always visible since it's required */}
          <TextField
            label="Listing Price"
            name="listingPrice"
            value={formatInputCurrency(formData.listingPrice)}
            onChange={(e) => {
              setFormData((prev) => ({
                ...prev,
                listingPrice: handleCurrencyInput(e.target.value),
              }));
            }}
            fullWidth
            margin="normal"
            required
            placeholder="Enter the listing price"
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
            sx={inputSx}
          />

          {/* Collapsible Form Section Header */}
          <Box
            onClick={() => setFormExpanded(!formExpanded)}
            role="button"
            tabIndex={0}
            aria-expanded={formExpanded}
            aria-controls="property-details-form"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setFormExpanded(!formExpanded);
              }
            }}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              py: 1.5,
              px: 1.5,
              mt: 2,
              mx: -1.5,
              cursor: 'pointer',
              userSelect: 'none',
              borderRadius: '8px',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.05)',
                '& .MuiTypography-root': { color: '#10b981' },
                '& .MuiSvgIcon-root': { color: '#10b981' },
              },
              '&:focus-visible': {
                outline: '2px solid #10b981',
                outlineOffset: '2px',
              },
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600, transition: 'color 0.2s' }}
            >
              {formExpanded ? 'Hide' : 'Show'} Property Details
              {parseResult?.success && ' (auto-filled)'}
            </Typography>
            {formExpanded ? (
              <ExpandLessIcon sx={{ color: 'rgba(255,255,255,0.7)', transition: 'color 0.2s' }} />
            ) : (
              <ExpandMoreIcon sx={{ color: 'rgba(255,255,255,0.7)', transition: 'color 0.2s' }} />
            )}
          </Box>

          {/* Form Fields */}
          <Collapse in={formExpanded} id="property-details-form">
            <TextField
              label="Address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              fullWidth
              margin="normal"
              required
              sx={inputSx}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="City"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                margin="normal"
                sx={{ ...inputSx, flex: 2 }}
              />
              <TextField
                label="State"
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                margin="normal"
                sx={{ ...inputSx, flex: 1 }}
              />
              <TextField
                label="Zip"
                name="zipCode"
                value={formData.zipCode}
                onChange={handleInputChange}
                margin="normal"
                sx={{ ...inputSx, flex: 1 }}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Sqft"
                name="squareFootage"
                value={formData.squareFootage ?? ''}
                onChange={(e) => {
                  const value = e.target.value.trim() === '' ? null : parseInt(e.target.value, 10);
                  setFormData((prev) => ({ ...prev, squareFootage: value }));
                }}
                margin="normal"
                type="number"
                sx={{ ...inputSx, flex: 1 }}
              />
              <TextField
                label="Beds"
                name="bedrooms"
                value={formData.bedrooms ?? ''}
                onChange={(e) => {
                  const value = e.target.value.trim() === '' ? null : parseInt(e.target.value, 10);
                  setFormData((prev) => ({ ...prev, bedrooms: value }));
                }}
                margin="normal"
                type="number"
                sx={{ ...inputSx, flex: 1 }}
              />
              <TextField
                label="Baths"
                name="bathrooms"
                value={formData.bathrooms ?? ''}
                onChange={(e) => {
                  const value = e.target.value.trim() === '' ? null : parseInt(e.target.value, 10);
                  setFormData((prev) => ({ ...prev, bathrooms: value }));
                }}
                margin="normal"
                type="number"
                sx={{ ...inputSx, flex: 1 }}
              />
              <TextField
                label="Units"
                name="units"
                value={formData.units ?? ''}
                onChange={(e) => {
                  const value = e.target.value.trim() === '' ? null : parseInt(e.target.value, 10);
                  setFormData((prev) => ({ ...prev, units: value }));
                }}
                margin="normal"
                type="number"
                inputProps={{ min: 1 }}
                sx={{ ...inputSx, flex: 1 }}
              />
            </Box>
            <TextField
              label="Year Built"
              name="yearBuilt"
              value={formData.yearBuilt ?? ''}
              onChange={(e) => {
                const value = e.target.value.trim() === '' ? null : parseInt(e.target.value, 10);
                setFormData((prev) => ({ ...prev, yearBuilt: value }));
              }}
              fullWidth
              margin="normal"
              type="number"
              sx={inputSx}
            />
            <TextField
              label="Agent/Seller Phone"
              name="agentPhone"
              value={formData.agentPhone}
              onChange={handleInputChange}
              fullWidth
              margin="normal"
              sx={inputSx}
            />
            <TextField
              label="Agent/Seller Email"
              name="sellerEmail"
              value={formData.sellerEmail}
              onChange={handleInputChange}
              fullWidth
              margin="normal"
              type="email"
              sx={inputSx}
            />
            <TextField
              label="Agent Name"
              name="agentName"
              value={formData.agentName}
              onChange={handleInputChange}
              fullWidth
              margin="normal"
              sx={inputSx}
            />
          </Collapse>

          {/* Submit Error */}
          {submitError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {submitError}
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ borderTop: '1px solid rgba(255,255,255,0.1)', px: 3, py: 2 }}>
        <Button
          onClick={handleClose}
          disabled={submitState === 'submitting'}
          sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: '#ffffff' } }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!canSubmit}
          startIcon={submitState === 'submitting' ? <CircularProgress size={16} color="inherit" /> : undefined}
          sx={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
            },
            '&.Mui-disabled': {
              background: 'rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.4)',
            },
          }}
        >
          {submitState === 'submitting' ? 'Adding...' : 'Add Lead'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddLeadModal;

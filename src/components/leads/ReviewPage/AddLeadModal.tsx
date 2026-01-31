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
  Divider,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { leadQueueService, IngestLeadRequest, IngestLeadResponse, EnrichedListingData } from '../../../services/leadQueueService';

type SubmitState = 'idle' | 'submitting' | 'success' | 'error';
type EnrichState = 'idle' | 'enriching' | 'success' | 'error';

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
  photoUrls: string[];
  zestimate: number | null;
  rentZestimate: number | null;
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
  photoUrls: [],
  zestimate: null,
  rentZestimate: null,
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

// Check if URL looks like a Zillow URL
const isZillowUrl = (url: string): boolean => {
  if (!url) return false;
  return url.toLowerCase().includes('zillow.com');
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
  const [enrichState, setEnrichState] = useState<EnrichState>('idle');
  const [enrichError, setEnrichError] = useState<string | null>(null);
  const [hasEnrichedData, setHasEnrichedData] = useState(false);

  // Check if URL looks valid for enrichment
  const canEnrich = useCallback(() => {
    const url = formData.zillowLink?.trim() || '';
    return url.length > 10 && isZillowUrl(url);
  }, [formData.zillowLink]);

  // Handle fetching details from URL
  const handleFetchDetails = async () => {
    const url = formData.zillowLink?.trim();
    if (!url || !isZillowUrl(url)) {
      setEnrichError('Please enter a valid Zillow URL');
      return;
    }

    setEnrichState('enriching');
    setEnrichError(null);

    try {
      const result = await leadQueueService.enrichListing(url);

      if (result.success && result.data) {
        // Auto-fill all fields from enriched data
        populateFormFromEnrichedData(result.data);
        setHasEnrichedData(true);
        setEnrichState('success');
        // Expand form to show filled data
        setFormExpanded(true);
      } else {
        // Handle partial data
        if (result.partialData) {
          populateFormFromEnrichedData(result.partialData);
          setFormExpanded(true);
        }
        setEnrichError(result.error || 'Failed to fetch listing details');
        setEnrichState('error');
      }
    } catch (err: any) {
      console.error('Error enriching listing:', err);
      setEnrichError(err.response?.data?.error || err.message || 'Network error. You can enter details manually.');
      setEnrichState('error');
      // Expand form for manual entry
      setFormExpanded(true);
    }
  };

  // Populate form from enriched data
  const populateFormFromEnrichedData = (data: EnrichedListingData) => {
    setFormData(prev => ({
      ...prev,
      address: data.address || prev.address,
      city: data.city || prev.city,
      state: data.state || prev.state,
      zipCode: data.zipCode || prev.zipCode,
      listingPrice: data.listingPrice || prev.listingPrice,
      squareFootage: data.squareFootage ?? prev.squareFootage,
      yearBuilt: data.yearBuilt ?? prev.yearBuilt,
      bedrooms: data.bedrooms ?? prev.bedrooms,
      bathrooms: data.bathrooms ?? prev.bathrooms,
      units: data.units ?? prev.units,
      agentName: data.agent?.name || prev.agentName,
      agentPhone: data.agent?.phone || prev.agentPhone,
      sellerEmail: data.agent?.email || prev.sellerEmail,
      photoUrls: data.photoUrls?.length ? data.photoUrls : prev.photoUrls,
      zestimate: data.zestimate ?? prev.zestimate,
      rentZestimate: data.rentZestimate ?? prev.rentZestimate,
    }));
  };

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
        photoUrls: formData.photoUrls.length > 0 ? formData.photoUrls : undefined,
        zestimate: formData.zestimate || undefined,
        rentZestimate: formData.rentZestimate || undefined,
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
    setEnrichState('idle');
    setEnrichError(null);
    setHasEnrichedData(false);
    onClose();
  };

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setFormData(initialFormData);
      setFormExpanded(false);
      setSubmitState('idle');
      setSubmitError(null);
      setEnrichState('idle');
      setEnrichError(null);
      setHasEnrichedData(false);
    }
  }, [open]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Reset enrich state when URL changes
    if (name === 'zillowLink') {
      setEnrichState('idle');
      setEnrichError(null);
      setHasEnrichedData(false);
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
          {/* Zillow URL Input with Fetch Button */}
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
            <TextField
              label="Zillow URL"
              name="zillowLink"
              value={formData.zillowLink}
              onChange={handleInputChange}
              fullWidth
              margin="normal"
              placeholder="Paste a Zillow listing URL..."
              sx={{ ...inputSx, flex: 1, mt: 0 }}
              disabled={enrichState === 'enriching'}
            />
            <Button
              variant="contained"
              onClick={handleFetchDetails}
              disabled={!canEnrich() || enrichState === 'enriching'}
              startIcon={
                enrichState === 'enriching' ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <AutoAwesomeIcon />
                )
              }
              sx={{
                mt: 0,
                height: 56,
                minWidth: 140,
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
              {enrichState === 'enriching' ? 'Fetching...' : 'Fetch Details'}
            </Button>
          </Box>

          {/* Enrichment Status Feedback */}
          {enrichState === 'success' && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1, mb: 2 }}>
              <CheckCircleOutlineIcon sx={{ color: '#10b981', fontSize: '1.2rem' }} />
              <Typography variant="body2" sx={{ color: '#10b981' }}>
                Property details fetched successfully! Review and edit below.
              </Typography>
            </Box>
          )}

          {enrichError && (
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mt: 1, mb: 2 }}>
              <WarningAmberIcon sx={{ color: '#f59e0b', fontSize: '1.2rem', mt: 0.25 }} />
              <Typography variant="body2" sx={{ color: '#f59e0b' }}>
                {enrichError}
              </Typography>
            </Box>
          )}

          {/* Hint text */}
          {canEnrich() && enrichState === 'idle' && (
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                color: 'rgba(255,255,255,0.5)',
                mt: 0.5,
                mb: 1,
              }}
            >
              Click "Fetch Details" to auto-fill property information from Zillow
            </Typography>
          )}

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
              {hasEnrichedData && ' (auto-filled)'}
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

            {/* Photo count indicator when photos are fetched */}
            {formData.photoUrls.length > 0 && (
              <Alert severity="info" sx={{ mt: 2, bgcolor: 'rgba(99, 102, 241, 0.1)', color: '#a5b4fc' }}>
                {formData.photoUrls.length} photos will be saved with this lead
              </Alert>
            )}

            <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 2 }} />

            <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 1 }}>
              Contact Information
            </Typography>

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

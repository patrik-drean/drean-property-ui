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
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import SearchIcon from '@mui/icons-material/Search';
import BarChartIcon from '@mui/icons-material/BarChart';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { scorePropertyLead, ScoredPropertyData } from '../../../services/api';
import { leadQueueService, IngestLeadRequest, IngestLeadResponse } from '../../../services/leadQueueService';
import { ScoreResultsCard } from '../ScoreResultsCard';
import {
  ScorePropertyButton,
  ScoreErrorCard,
  LoadingStepsContainer,
  LoadingStep,
} from '../leadsStyles';

type ScoringState = 'idle' | 'scoring' | 'scored' | 'error';
type SubmitState = 'idle' | 'submitting' | 'success' | 'error';

interface ScoreResults {
  score: number;
  grade?: string;
  aiSummary?: string;
  metadata?: {
    zestimate?: number;
    rentZestimate?: number;
    arv?: number;
    arvRatio?: number;
    daysOnMarket?: number;
    rehabRange?: string;
    rehabEstimate?: number;
  };
}

interface ErrorDetails {
  title: string;
  details: string[];
}

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

// Error message parsing utility
const getErrorMessage = (error: any): ErrorDetails => {
  const errorMessage = error.response?.data?.error || error.message || '';

  if (errorMessage.includes('Could not fetch property details') ||
      errorMessage.includes('Failed to extract') ||
      errorMessage.includes('not recognized')) {
    return {
      title: 'Could not score property',
      details: [
        'URL format not recognized',
        'Property listing may no longer be active',
        'Temporary service issue',
      ],
    };
  }

  if (errorMessage.includes('timeout') || errorMessage.includes('504') ||
      errorMessage.includes('ETIMEDOUT')) {
    return {
      title: 'Scoring timed out',
      details: [
        'The property lookup took too long',
        'Please try again in a moment',
      ],
    };
  }

  if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
    return {
      title: 'Rate limit reached',
      details: [
        'Too many requests in a short time',
        'Please wait a moment and try again',
      ],
    };
  }

  if (errorMessage.includes('network') || errorMessage.includes('ECONNREFUSED')) {
    return {
      title: 'Connection error',
      details: [
        'Could not connect to the scoring service',
        'Please check your internet connection',
      ],
    };
  }

  return {
    title: 'Scoring failed',
    details: ['An unexpected error occurred', 'Please try again or enter details manually'],
  };
};

// Extract score results from API response
const extractScoreResults = (data: ScoredPropertyData): ScoreResults => {
  const metadata = data.metadata || {};

  return {
    score: data.leadScore || 0,
    grade: metadata.propertyGrade || metadata.grade,
    aiSummary: data.note || metadata.aiEvaluation || metadata.aiSummary,
    metadata: {
      zestimate: metadata.zestimate,
      rentZestimate: metadata.rentZestimate || metadata.rentEstimate,
      arv: metadata.arv || metadata.afterRepairValue,
      arvRatio: metadata.arvRatio || metadata.priceToArvRatio,
      daysOnMarket: metadata.daysOnMarket || metadata.daysOnZillow,
      rehabRange: metadata.rehabRange,
      rehabEstimate: metadata.rehabEstimate || metadata.estimatedRehabCost,
    },
  };
};

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
  const [scoringState, setScoringState] = useState<ScoringState>('idle');
  const [scoreResults, setScoreResults] = useState<ScoreResults | null>(null);
  const [scoreError, setScoreError] = useState<ErrorDetails | null>(null);
  const [formExpanded, setFormExpanded] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Check if URL looks valid
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

  // Handle scoring a property from URL
  const handleScoreProperty = async () => {
    if (!formData.zillowLink) {
      setScoreError({
        title: 'No URL provided',
        details: ['Please enter a listing URL first'],
      });
      return;
    }

    try {
      setScoringState('scoring');
      setScoreError(null);
      setLoadingStep(0);

      // Animate through loading steps
      const stepInterval = setInterval(() => {
        setLoadingStep((prev) => (prev < 2 ? prev + 1 : prev));
      }, 800);

      const data = await scorePropertyLead(formData.zillowLink);

      clearInterval(stepInterval);

      // Extract score results
      const results = extractScoreResults(data);
      setScoreResults(results);

      // Populate form fields with scored data
      setFormData((prev) => ({
        ...prev,
        address: data.address || prev.address,
        listingPrice: data.listingPrice || prev.listingPrice,
        zillowLink: data.zillowLink || prev.zillowLink,
        squareFootage: data.sqft || prev.squareFootage,
        units: data.units || prev.units,
        agentPhone: data.agentInfo?.phone || prev.agentPhone,
        agentName: data.agentInfo?.name || prev.agentName,
        sellerEmail: data.agentInfo?.email || prev.sellerEmail,
      }));

      setScoringState('scored');
      setFormExpanded(false);

    } catch (err: any) {
      console.error('Error scoring property:', err);
      const errorDetails = getErrorMessage(err);
      setScoreError(errorDetails);
      setScoringState('error');
    }
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
    setScoringState('idle');
    setScoreResults(null);
    setScoreError(null);
    setFormExpanded(false);
    setLoadingStep(0);
    setSubmitState('idle');
    setSubmitError(null);
    onClose();
  };

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setFormData(initialFormData);
      setScoringState('idle');
      setScoreResults(null);
      setScoreError(null);
      setFormExpanded(false);
      setLoadingStep(0);
      setSubmitState('idle');
      setSubmitError(null);
    }
  }, [open]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const loadingSteps = [
    { icon: <SearchIcon />, text: 'Fetching property details...' },
    { icon: <BarChartIcon />, text: 'Calculating ARV & rehab...' },
    { icon: <SmartToyIcon />, text: 'AI analyzing deal & area quality...' },
  ];

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
            fullWidth
            margin="normal"
            placeholder="Paste any Zillow, Redfin, or Realtor.com link..."
            disabled={scoringState === 'scoring'}
            sx={inputSx}
          />

          {/* Score Property Button */}
          {scoringState !== 'scored' && (
            <ScorePropertyButton
              variant={hasValidUrl() ? 'contained' : 'outlined'}
              onClick={handleScoreProperty}
              disabled={!formData.zillowLink || scoringState === 'scoring'}
              hasUrl={hasValidUrl()}
              isScoring={scoringState === 'scoring'}
              startIcon={scoringState !== 'scoring' ? <AutoFixHighIcon /> : undefined}
              fullWidth
              aria-label={scoringState === 'scoring' ? 'Analyzing property' : 'Score this property with AI'}
            >
              {scoringState === 'scoring' ? 'Analyzing property...' : 'Score Property'}
            </ScorePropertyButton>
          )}

          {/* Hint text when URL is entered but not yet scored */}
          {hasValidUrl() && scoringState === 'idle' && (
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                textAlign: 'center',
                color: 'rgba(255,255,255,0.5)',
                mt: -1,
                mb: 2,
              }}
            >
              We will analyze &amp; score this property automatically
            </Typography>
          )}

          {/* Loading Steps */}
          {scoringState === 'scoring' && (
            <LoadingStepsContainer role="status" aria-live="polite">
              {loadingSteps.map((step, index) => (
                <LoadingStep key={index} active={index <= loadingStep}>
                  {index <= loadingStep ? step.icon : <Box sx={{ width: '1.25rem' }} />}
                  <Typography variant="body2">{step.text}</Typography>
                  {index === loadingStep && (
                    <CircularProgress size={14} sx={{ ml: 'auto', color: '#10b981' }} />
                  )}
                </LoadingStep>
              ))}
            </LoadingStepsContainer>
          )}

          {/* Score Results Card */}
          {scoringState === 'scored' && scoreResults && (
            <ScoreResultsCard
              score={scoreResults.score}
              grade={scoreResults.grade}
              aiSummary={scoreResults.aiSummary}
              metadata={scoreResults.metadata}
            />
          )}

          {/* Error Card */}
          {scoringState === 'error' && scoreError && (
            <ScoreErrorCard role="alert">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <WarningAmberIcon sx={{ color: '#f59e0b' }} />
                <Typography variant="subtitle1" sx={{ color: '#f59e0b', fontWeight: 600 }}>
                  {scoreError.title}
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 1.5 }}>
                We couldn&apos;t extract property details from this URL. This may be due to:
              </Typography>
              <Box component="ul" sx={{ m: 0, pl: 3, color: 'rgba(255,255,255,0.6)' }}>
                {scoreError.details.map((detail, index) => (
                  <li key={index}>
                    <Typography variant="body2">{detail}</Typography>
                  </li>
                ))}
              </Box>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mt: 2 }}>
                You can still add this lead manually using the form below.
              </Typography>
              <Button
                size="small"
                onClick={() => {
                  setScoringState('idle');
                  setScoreError(null);
                  setFormExpanded(true);
                }}
                sx={{ mt: 1, color: '#10b981' }}
              >
                Dismiss &amp; Enter Manually
              </Button>
            </ScoreErrorCard>
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
              {scoringState === 'scored' && ' (auto-filled)'}
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
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
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

import React, { useState, useEffect, useCallback } from 'react';
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
  Collapse,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import SearchIcon from '@mui/icons-material/Search';
import BarChartIcon from '@mui/icons-material/BarChart';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import RefreshIcon from '@mui/icons-material/Refresh';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { scorePropertyLead, ScoredPropertyData } from '../services/api';
import { ScoreResultsCard } from './leads/ScoreResultsCard';
import {
  ScorePropertyButton,
  ScoreErrorCard,
  LoadingStepsContainer,
  LoadingStep,
} from './leads/leadsStyles';

// Types
type ScoringState = 'idle' | 'scoring' | 'scored' | 'error';

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

interface PropertyLeadDialogProps {
  open: boolean;
  isEditing: boolean;
  initialFormData: any;
  onSave: (formData: any) => void;
  onClose: () => void;
  handleCurrencyInput: (value: string) => number;
  formatInputCurrency: (value: number) => string;
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

// Helper functions for metadata formatting
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

const isRatioKey = (key: string): boolean => {
  const lowerKey = key.toLowerCase();
  return lowerKey.includes('ratio') ||
         lowerKey.includes('percent') ||
         lowerKey.includes('rate');
};

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatMetadataValue = (key: string, value: any): string => {
  if (typeof value === 'number') {
    if (isRatioKey(key)) {
      return `${(value * 100).toFixed(1)}%`;
    }
    if (isFinancialKey(key)) {
      return formatCurrency(value);
    }
  }
  return String(value);
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
  const [scoringState, setScoringState] = useState<ScoringState>('idle');
  const [scoreResults, setScoreResults] = useState<ScoreResults | null>(null);
  const [scoreError, setScoreError] = useState<ErrorDetails | null>(null);
  const [formExpanded, setFormExpanded] = useState(false); // Collapsed by default
  const [loadingStep, setLoadingStep] = useState(0);

  // Check if URL looks valid (supports all URL sources from urlParserService)
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

      setScoringState('scored');
      setFormExpanded(false); // Collapse form after successful scoring

    } catch (err: any) {
      console.error('Error scoring property:', err);
      const errorDetails = getErrorMessage(err);
      setScoreError(errorDetails);
      setScoringState('error');
    }
  };

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setFormData(initialFormData);
      // If editing and there's a lead score, show as scored
      if (isEditing && initialFormData.leadScore) {
        setScoringState('scored');
        // Try to reconstruct score results from existing data
        const existingMetadata = initialFormData.metadata ?
          JSON.parse(initialFormData.metadata) : {};
        setScoreResults({
          score: initialFormData.leadScore,
          grade: existingMetadata.propertyGrade,
          aiSummary: initialFormData.notes || existingMetadata.aiEvaluation,
          metadata: existingMetadata,
        });
        setFormExpanded(true); // Expand form when editing
      } else if (isEditing) {
        // Editing but no score - expand form
        setScoringState('idle');
        setScoreResults(null);
        setFormExpanded(true);
      } else {
        // New lead - collapse form by default to focus on scoring
        setScoringState('idle');
        setScoreResults(null);
        setFormExpanded(false);
      }
      setScoreError(null);
    }
  }, [open, initialFormData, isEditing]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleCopyId = () => {
    if (formData.id) {
      navigator.clipboard.writeText(formData.id);
    }
  };

  const handleReScore = () => {
    setScoringState('idle');
    setScoreResults(null);
    setFormExpanded(true);
  };

  const loadingSteps = [
    { icon: <SearchIcon />, text: 'Fetching property details...' },
    { icon: <BarChartIcon />, text: 'Calculating ARV & rehab...' },
    { icon: <SmartToyIcon />, text: 'AI analyzing deal & area quality...' },
  ];

  // Common accessible input styles with improved contrast
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
    '& .MuiIconButton-root': { color: 'rgba(255,255,255,0.7)' },
  };

  // Date picker slot props with improved accessibility
  const datePickerSlotProps = {
    textField: {
      fullWidth: true,
      sx: inputSx,
    },
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
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
        {isEditing ? 'Edit Property Lead' : 'Add Property Lead'}
      </DialogTitle>
      <DialogContent sx={{ backgroundColor: '#1a1d26' }}>
        <Box component="form" sx={{ mt: 2 }}>
          {/* Lead ID (Edit mode only) */}
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
                        sx={{ color: 'rgba(255,255,255,0.7)' }}
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
                  color: 'rgba(255,255,255,0.8)',
                  fontFamily: 'monospace',
                },
                '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.9)' },
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                },
              }}
            />
          )}

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
       
              <span>
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
              </span>
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
            <>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                <Button
                  size="small"
                  startIcon={<RefreshIcon />}
                  onClick={handleReScore}
                  sx={{
                    color: 'rgba(255,255,255,0.6)',
                    textTransform: 'none',
                    '&:hover': { color: '#10b981' },
                  }}
                >
                  Re-Score
                </Button>
              </Box>
              <ScoreResultsCard
                score={scoreResults.score}
                grade={scoreResults.grade}
                aiSummary={scoreResults.aiSummary}
                metadata={scoreResults.metadata}
              />
            </>
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
                }}
                sx={{ mt: 1, color: '#10b981' }}
              >
                Dismiss &amp; Try Again
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
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
              sx={inputSx}
            />
            <TextField
              label="Seller Phone"
              name="sellerPhone"
              value={formData.sellerPhone}
              onChange={handleInputChange}
              fullWidth
              margin="normal"
              sx={inputSx}
            />
            <TextField
              label="Seller Email"
              name="sellerEmail"
              value={formData.sellerEmail}
              onChange={handleInputChange}
              fullWidth
              margin="normal"
              type="email"
              sx={inputSx}
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
              sx={inputSx}
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
              sx={inputSx}
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
              sx={inputSx}
            />

            {/* Metadata Display (Read-only) - for editing */}
            {isEditing && formData.metadata && (() => {
              try {
                const parsed = JSON.parse(formData.metadata);
                return Object.keys(parsed).length > 0;
              } catch {
                return false;
              }
            })() && (
              <>
                <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.1)' }} />
                <Typography variant="h6" gutterBottom sx={{ color: '#ffffff' }}>
                  Metadata
                </Typography>
                <Box
                  sx={{
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 1,
                    p: 2,
                    mt: 1,
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
                            color: 'rgba(255,255,255,0.7)',
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
              </>
            )}

            {/* Stage Tracking Section */}
            <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.1)' }} />

            <Typography variant="h6" gutterBottom sx={{ color: '#ffffff' }}>
              Stage Tracking
            </Typography>

            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <DatePicker
                  label="Contacted Date"
                  value={formData.lastContactDate ? new Date(formData.lastContactDate) : null}
                  onChange={(newValue) => setFormData({ ...formData, lastContactDate: newValue ? newValue.toISOString() : null })}
                  slotProps={datePickerSlotProps}
                />
                <DatePicker
                  label="Responded Date"
                  value={formData.respondedDate ? new Date(formData.respondedDate) : null}
                  onChange={(newValue) => setFormData({ ...formData, respondedDate: newValue ? newValue.toISOString() : null })}
                  slotProps={datePickerSlotProps}
                />
                <DatePicker
                  label="Converted Date"
                  value={formData.convertedDate ? new Date(formData.convertedDate) : null}
                  onChange={(newValue) => setFormData({ ...formData, convertedDate: newValue ? newValue.toISOString() : null })}
                  slotProps={datePickerSlotProps}
                />
                <DatePicker
                  label="Under Contract Date"
                  value={formData.underContractDate ? new Date(formData.underContractDate) : null}
                  onChange={(newValue) => setFormData({ ...formData, underContractDate: newValue ? newValue.toISOString() : null })}
                  slotProps={datePickerSlotProps}
                />
                <DatePicker
                  label="Sold Date"
                  value={formData.soldDate ? new Date(formData.soldDate) : null}
                  onChange={(newValue) => setFormData({ ...formData, soldDate: newValue ? newValue.toISOString() : null })}
                  slotProps={datePickerSlotProps}
                />
              </Box>
            </LocalizationProvider>
          </Collapse>
        </Box>
      </DialogContent>
      <DialogActions sx={{ borderTop: '1px solid rgba(255,255,255,0.1)', px: 3, py: 2 }}>
        <Button
          onClick={onClose}
          sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: '#ffffff' } }}
        >
          Cancel
        </Button>
        <Button
          onClick={() => onSave(formData)}
          variant="contained"
          sx={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
            },
          }}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PropertyLeadDialog;

import React, { useState } from 'react';
import {
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  Alert,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  GetApp as DownloadIcon,
  Assessment as ReportIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { Property } from '../../types/property';
import { ReportError } from '../../types/investmentReport';
import {
  generateInvestmentSummary,
  validatePropertyData,
  prepareReportData,
  formatCurrency,
  formatPercentage,
} from '../../services/investmentReportService';

interface InvestmentSummaryGeneratorProps {
  property: Property;
  variant?: 'button' | 'icon';
  size?: 'small' | 'medium' | 'large';
}

export const InvestmentSummaryGenerator: React.FC<InvestmentSummaryGeneratorProps> = ({
  property,
  variant = 'button',
  size = 'medium',
}) => {
  const [loading, setLoading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [errors, setErrors] = useState<ReportError[]>([]);

  const handleGenerateReport = async () => {
    try {
      setLoading(true);
      await generateInvestmentSummary(property);
    } catch (error) {
      console.error('Error generating investment summary:', error);
      // Error handling is done in the service, this will show user-friendly messages
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = () => {
    const validationErrors = validatePropertyData(property);
    setErrors(validationErrors);
    setPreviewOpen(true);
  };

  const handleClosePreview = () => {
    setPreviewOpen(false);
    setErrors([]);
  };

  const renderButton = () => {
    if (variant === 'icon') {
      return (
        <Button
          onClick={handlePreview}
          disabled={loading}
          size={size}
          sx={{
            minWidth: 'auto',
            width: 40,
            height: 40,
            borderRadius: '50%',
          }}
        >
          {loading ? (
            <CircularProgress size={20} />
          ) : (
            <ReportIcon />
          )}
        </Button>
      );
    }

    return (
      <Button
        variant="outlined"
        startIcon={loading ? <CircularProgress size={16} /> : <ReportIcon />}
        onClick={handlePreview}
        disabled={loading}
        size={size}
        sx={{
          borderRadius: 2,
          textTransform: 'none',
          fontWeight: 500,
        }}
      >
        {loading ? 'Generating...' : 'Generate Investment Summary'}
      </Button>
    );
  };

  const reportData = prepareReportData(property);
  const { calculations } = reportData;
  const hasErrors = errors.some(error => error.severity === 'error');
  const hasWarnings = errors.some(error => error.severity === 'warning');

  return (
    <>
      {renderButton()}

      <Dialog
        open={previewOpen}
        onClose={handleClosePreview}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
          }
        }}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <ReportIcon color="primary" />
            <Typography variant="h6" component="div">
              Investment Summary Preview
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent>
          {/* Error and Warning Messages */}
          {hasErrors && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <Typography variant="body2" fontWeight="bold">
                Cannot generate report due to missing required data:
              </Typography>
              <List dense>
                {errors
                  .filter(error => error.severity === 'error')
                  .map((error, index) => (
                    <ListItem key={index} sx={{ py: 0 }}>
                      <ListItemText primary={error.message} />
                    </ListItem>
                  ))}
              </List>
            </Alert>
          )}

          {hasWarnings && !hasErrors && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <WarningIcon fontSize="small" />
                <Typography variant="body2" fontWeight="bold">
                  Report will use default values for missing data:
                </Typography>
              </Box>
              <List dense>
                {errors
                  .filter(error => error.severity === 'warning')
                  .map((error, index) => (
                    <ListItem key={index} sx={{ py: 0 }}>
                      <ListItemText primary={error.message} />
                    </ListItem>
                  ))}
              </List>
            </Alert>
          )}

          {/* Report Preview */}
          <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1 }}>
            <Typography variant="h6" gutterBottom color="primary">
              {property.address}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Status: {property.status}
            </Typography>

            <Divider sx={{ my: 2 }} />

            {/* Key Metrics Grid */}
            <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={2}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Investment Scores
                </Typography>
                <Typography variant="body1">
                  Hold: <strong>{calculations.holdScore}/10</strong> |
                  Flip: <strong>{calculations.flipScore}/10</strong>
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary">
                  Monthly Cashflow
                </Typography>
                <Typography
                  variant="body1"
                  color={calculations.monthlyCashflow >= 0 ? 'success.main' : 'error.main'}
                  fontWeight="bold"
                >
                  {formatCurrency(calculations.monthlyCashflow)}
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary">
                  Home Equity
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {formatCurrency(calculations.homeEquity)}
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary">
                  Total Capital Required
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {formatCurrency(calculations.totalCapitalRequired)}
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary">
                  Rent Ratio
                </Typography>
                <Typography
                  variant="body1"
                  color={calculations.rentRatio >= 0.01 ? 'success.main' : 'error.main'}
                >
                  {formatPercentage(calculations.rentRatio)}
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary">
                  ROI Projection
                </Typography>
                <Typography
                  variant="body1"
                  color={calculations.roiProjection > 0 ? 'success.main' : 'error.main'}
                  fontWeight="bold"
                >
                  {formatPercentage(calculations.roiProjection)}
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography variant="body2" color="text.secondary">
              This preview shows key metrics that will be included in the PDF report.
              The full report contains detailed analysis across 5 sections.
            </Typography>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClosePreview}>
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={loading ? <CircularProgress size={16} /> : <DownloadIcon />}
            onClick={handleGenerateReport}
            disabled={hasErrors || loading}
            sx={{ borderRadius: 2 }}
          >
            {loading ? 'Generating PDF...' : 'Download PDF Report'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default InvestmentSummaryGenerator;
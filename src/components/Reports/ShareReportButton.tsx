import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  TextField,
  IconButton,
  Snackbar,
  Alert,
  CircularProgress,
  Chip,
  SxProps,
  Theme,
} from '@mui/material';
import {
  Share as ShareIcon,
  FileCopy as CopyIcon,
  Close as CloseIcon,
  Launch as LaunchIcon,
} from '@mui/icons-material';
import { Property } from '../../types/property';
import { prepareReportData } from '../../services/investmentReportService';
import { createShareableReport, copyReportUrlToClipboard } from '../../services/reportSharingService';

interface ShareReportButtonProps {
  property: Property;
  variant?: 'contained' | 'outlined' | 'text';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  sx?: SxProps<Theme>;
}

const ShareReportButton: React.FC<ShareReportButtonProps> = ({
  property,
  variant = 'outlined',
  size = 'medium',
  fullWidth = false,
  sx,
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reportUrl, setReportUrl] = useState<string>('');
  const [reportId, setReportId] = useState<string>('');
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  const handleGenerateReport = async () => {
    setLoading(true);
    try {
      // Prepare report data
      const reportData = prepareReportData(property);

      // Create shareable link
      const shareableLink = createShareableReport(reportData);

      setReportUrl(shareableLink.url);
      setReportId(shareableLink.reportId);

      setSnackbar({
        open: true,
        message: 'Investment report generated successfully!',
        severity: 'success',
      });
    } catch (error) {
      console.error('Error generating report:', error);
      setSnackbar({
        open: true,
        message: 'Failed to generate report. Please try again.',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = async () => {
    setOpen(true);
    if (!reportUrl) {
      await handleGenerateReport();
    }
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleCopyUrl = async () => {
    if (reportId) {
      const success = await copyReportUrlToClipboard(reportId);
      setSnackbar({
        open: true,
        message: success ? 'Link copied to clipboard!' : 'Failed to copy link',
        severity: success ? 'success' : 'error',
      });
    }
  };

  const handleOpenReport = () => {
    if (reportUrl) {
      window.open(reportUrl, '_blank');
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share && reportUrl) {
      try {
        await navigator.share({
          title: `Investment Report - ${property.address}`,
          text: 'Check out this investment analysis report',
          url: reportUrl,
        });
      } catch (error) {
        // User cancelled or share failed, fallback to copy
        handleCopyUrl();
      }
    } else {
      // Fallback to copy for browsers without Web Share API
      handleCopyUrl();
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        fullWidth={fullWidth}
        startIcon={<ShareIcon />}
        onClick={handleOpen}
        sx={{ textTransform: 'none', ...sx }}
      >
        Share Report
      </Button>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Share Investment Report</Typography>
            <IconButton onClick={handleClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent>
          <Box mb={2}>
            <Typography variant="body2" color="text.secondary" mb={1}>
              Property: <strong>{property.address}</strong>
            </Typography>
            <Chip
              label={property.status}
              size="small"
              color={property.status === 'Opportunity' ? 'success' : 'default'}
            />
          </Box>

          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" py={4}>
              <CircularProgress size={40} />
              <Typography variant="body2" color="text.secondary" ml={2}>
                Generating report...
              </Typography>
            </Box>
          ) : reportUrl ? (
            <Box>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Your shareable investment report is ready! Anyone with this link can view the report without needing to log in.
              </Typography>

              <TextField
                fullWidth
                variant="outlined"
                label="Shareable Link"
                value={reportUrl}
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <Box display="flex" gap={1}>
                      <IconButton onClick={handleCopyUrl} size="small" title="Copy link">
                        <CopyIcon />
                      </IconButton>
                      <IconButton onClick={handleOpenReport} size="small" title="Open report">
                        <LaunchIcon />
                      </IconButton>
                    </Box>
                  ),
                }}
                sx={{ mb: 2 }}
              />

              <Box display="flex" gap={2}>
                <Button
                  variant="contained"
                  startIcon={<ShareIcon />}
                  onClick={handleNativeShare}
                  fullWidth
                >
                  Share Link
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<CopyIcon />}
                  onClick={handleCopyUrl}
                  fullWidth
                >
                  Copy Link
                </Button>
              </Box>

              <Box mt={2} p={2} bgcolor="blue.50" borderRadius={1}>
                <Typography variant="body2" color="blue.800" mb={1}>
                  <strong>Report includes:</strong>
                </Typography>
                <Typography variant="caption" color="blue.700" display="block">
                  • Investment summary with hold and flip scores
                </Typography>
                <Typography variant="caption" color="blue.700" display="block">
                  • Detailed score analysis and breakdowns
                </Typography>
                <Typography variant="caption" color="blue.700" display="block">
                  • Cash flow analysis and expense breakdown
                </Typography>
                <Typography variant="caption" color="blue.700" display="block">
                  • Financing details and BRRRR strategy
                </Typography>
              </Box>
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Click "Generate Report" to create a shareable investment analysis report for this property.
            </Typography>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} color="inherit">
            Close
          </Button>
          {!reportUrl && !loading && (
            <Button
              onClick={handleGenerateReport}
              variant="contained"
              disabled={loading}
            >
              Generate Report
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ShareReportButton;
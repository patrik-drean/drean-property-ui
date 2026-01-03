import React, { useState } from 'react';
import {
  Button,
  SxProps,
  Theme,
  CircularProgress,
} from '@mui/material';
import {
  Share as ShareIcon,
} from '@mui/icons-material';
import { Property } from '../../types/property';
import { createShareableReport, generateReportUrl } from '../../services/investmentReportService';

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleShareReport = async () => {
    setLoading(true);
    setError(null);

    try {
      // Create report via backend API
      const reportId = await createShareableReport(property);

      // Generate and open URL
      const reportUrl = generateReportUrl(reportId);
      window.open(reportUrl, '_blank', 'noopener,noreferrer');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create shareable report';
      console.error('Error generating report:', errorMessage);
      setError(errorMessage);
      // Could add a toast notification here if needed
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      fullWidth={fullWidth}
      startIcon={loading ? <CircularProgress size={16} /> : <ShareIcon />}
      onClick={handleShareReport}
      disabled={loading}
      sx={{
        textTransform: 'none',
        py: 0.5,         // Further reduced vertical padding
        px: 2,           // Standard horizontal padding
        fontSize: '0.875rem',  // Slightly smaller font
        ...sx
      }}
    >
      {loading ? 'Creating...' : 'Share Report'}
    </Button>
  );
};

export default ShareReportButton;
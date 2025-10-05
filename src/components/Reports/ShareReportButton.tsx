import React from 'react';
import {
  Button,
  SxProps,
  Theme,
} from '@mui/material';
import {
  Share as ShareIcon,
} from '@mui/icons-material';
import { Property } from '../../types/property';
import { prepareReportData } from '../../services/investmentReportService';
import { createShareableReport } from '../../services/reportSharingService';

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
  const handleShareReport = () => {
    try {
      // Prepare report data
      const reportData = prepareReportData(property);

      // Create shareable link
      const shareableLink = createShareableReport(reportData);

      // Open report in new tab directly
      window.open(shareableLink.url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Error generating report:', error);
      // Could add a toast notification here if needed
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      fullWidth={fullWidth}
      startIcon={<ShareIcon />}
      onClick={handleShareReport}
      sx={{
        textTransform: 'none',
        py: 0.5,         // Further reduced vertical padding
        px: 2,           // Standard horizontal padding
        fontSize: '0.875rem',  // Slightly smaller font
        ...sx
      }}
    >
      Share Report
    </Button>
  );
};

export default ShareReportButton;
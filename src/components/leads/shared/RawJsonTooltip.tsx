import React from 'react';
import { Box, Tooltip, Typography } from '@mui/material';

interface RawJsonTooltipProps {
  /** The raw data object to display as JSON */
  data: object | null | undefined;
  /** Label shown at top of tooltip */
  label: string;
  /** The element to wrap with the tooltip */
  children: React.ReactElement;
}

/**
 * RawJsonTooltip - Displays raw JSON data in a styled tooltip
 *
 * Shows formatted JSON with syntax highlighting when hovering over the wrapped element.
 * Used for debugging and showing raw evaluation data from the API.
 */
export const RawJsonTooltip: React.FC<RawJsonTooltipProps> = ({
  data,
  label,
  children,
}) => {
  if (!data) {
    return children;
  }

  const jsonString = JSON.stringify(data, null, 2);

  const tooltipContent = (
    <Box sx={{ maxWidth: 400 }}>
      <Typography
        variant="caption"
        sx={{ color: '#8b949e', display: 'block', mb: 1, fontWeight: 600 }}
      >
        {label}
      </Typography>
      <Box
        component="pre"
        sx={{
          m: 0,
          p: 0,
          fontFamily: 'Monaco, Consolas, "Courier New", monospace',
          fontSize: '0.7rem',
          lineHeight: 1.4,
          color: '#f0f6fc',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        <code>{jsonString}</code>
      </Box>
    </Box>
  );

  return (
    <Tooltip
      title={tooltipContent}
      arrow
      placement="top"
      enterDelay={300}
      slotProps={{
        tooltip: {
          sx: {
            bgcolor: '#1c2128',
            border: '1px solid #30363d',
            maxWidth: 420,
            p: 1.5,
            '& .MuiTooltip-arrow': {
              color: '#1c2128',
              '&::before': {
                border: '1px solid #30363d',
              },
            },
          },
        },
      }}
    >
      {children}
    </Tooltip>
  );
};

export default RawJsonTooltip;

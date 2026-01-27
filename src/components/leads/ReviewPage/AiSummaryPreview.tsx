import React from 'react';
import { Box, Typography, Tooltip } from '@mui/material';
import { AutoAwesome as AiIcon } from '@mui/icons-material';

interface AiSummaryPreviewProps {
  summary: string;
}

/**
 * AiSummaryPreview - displays the AI evaluation summary with truncation and hover tooltip
 */
export const AiSummaryPreview: React.FC<AiSummaryPreviewProps> = ({ summary }) => {
  const content = (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 1,
        p: 1.5,
        bgcolor: 'rgba(96, 165, 250, 0.08)',
        borderRadius: 1,
        border: '1px solid rgba(96, 165, 250, 0.2)',
      }}
    >
      <AiIcon
        sx={{
          color: '#60a5fa',
          fontSize: '1rem',
          mt: 0.25,
          flexShrink: 0,
        }}
      />
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography
          variant="caption"
          sx={{
            color: '#60a5fa',
            fontWeight: 600,
            fontSize: '0.7rem',
            display: 'block',
            mb: 0.5,
          }}
        >
          AI Analysis
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: '#c9d1d9',
            fontSize: '0.75rem',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            lineHeight: 1.5,
          }}
        >
          {summary}
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Tooltip
      title={
        <Typography sx={{ fontSize: '0.8rem', lineHeight: 1.5 }}>
          {summary}
        </Typography>
      }
      arrow
      placement="bottom"
      enterDelay={300}
      slotProps={{
        tooltip: {
          sx: {
            bgcolor: '#1c2128',
            border: '1px solid #30363d',
            maxWidth: 400,
            p: 1.5,
            '& .MuiTooltip-arrow': {
              color: '#1c2128',
            },
          },
        },
      }}
    >
      {content}
    </Tooltip>
  );
};

export default AiSummaryPreview;

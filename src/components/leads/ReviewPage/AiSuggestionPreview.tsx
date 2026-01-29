import React from 'react';
import { Box, Typography } from '@mui/material';
import { AutoAwesome as AiIcon } from '@mui/icons-material';
import { AiSuggestion } from '../../../types/queue';

interface AiSuggestionPreviewProps {
  suggestion: AiSuggestion;
}

/**
 * AiSuggestionPreview - displays the AI-suggested template and message preview
 */
export const AiSuggestionPreview: React.FC<AiSuggestionPreviewProps> = ({ suggestion }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 1,
        p: 1.5,
        bgcolor: 'rgba(74, 222, 128, 0.05)',
        borderRadius: 1,
        border: '1px solid rgba(74, 222, 128, 0.15)',
      }}
    >
      <AiIcon
        sx={{
          color: '#4ade80',
          fontSize: '1rem',
          mt: 0.25,
          flexShrink: 0,
        }}
      />
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <Typography
            variant="caption"
            sx={{
              color: '#4ade80',
              fontWeight: 600,
              fontSize: '0.7rem',
            }}
          >
            AI Suggestion
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: '#8b949e',
              fontSize: '0.65rem',
            }}
          >
            {suggestion.confidence}% confident
          </Typography>
        </Box>
        <Typography
          variant="body2"
          sx={{
            color: '#f0f6fc',
            fontWeight: 500,
            fontSize: '0.8rem',
            mb: 0.5,
          }}
        >
          {suggestion.templateName}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: '#8b949e',
            fontSize: '0.75rem',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            lineHeight: 1.4,
          }}
        >
          {suggestion.messagePreview}
        </Typography>
      </Box>
    </Box>
  );
};

export default AiSuggestionPreview;

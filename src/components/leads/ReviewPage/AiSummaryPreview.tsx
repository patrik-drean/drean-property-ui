import React from 'react';
import { Box, Typography, Tooltip, Chip } from '@mui/material';
import {
  AutoAwesome as AiIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';

interface AiSummaryPreviewProps {
  summary?: string;
  verdict?: string;
  weaknesses?: string[];
  recommendation?: string;
}

/**
 * Get verdict styling based on AI verdict
 */
const getVerdictStyle = (verdict: string | undefined) => {
  const v = verdict?.toLowerCase() || '';
  if (v.includes('strong') || v.includes('buy') || v.includes('pursue') || v.includes('excellent')) {
    return { color: '#4ade80', icon: <ThumbUpIcon sx={{ fontSize: '0.9rem' }} /> };
  }
  if (v.includes('pass') || v.includes('avoid') || v.includes('skip') || v.includes('reject')) {
    return { color: '#f87171', icon: <ThumbDownIcon sx={{ fontSize: '0.9rem' }} /> };
  }
  if (v.includes('caution') || v.includes('maybe') || v.includes('review')) {
    return { color: '#fbbf24', icon: <WarningIcon sx={{ fontSize: '0.9rem' }} /> };
  }
  return { color: '#60a5fa', icon: <AiIcon sx={{ fontSize: '0.9rem' }} /> };
};

/**
 * Full AI Analysis Tooltip Content
 */
const AiAnalysisTooltip: React.FC<AiSummaryPreviewProps> = ({
  summary,
  verdict,
  weaknesses,
  recommendation,
}) => (
  <Box sx={{ maxWidth: 380 }}>
    {/* Verdict */}
    {verdict && (
      <Box sx={{ mb: 1.5 }}>
        <Typography
          variant="caption"
          sx={{ color: '#8b949e', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}
        >
          AI Verdict
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: getVerdictStyle(verdict).color, fontWeight: 600, mt: 0.25 }}
        >
          {verdict}
        </Typography>
      </Box>
    )}

    {/* Summary */}
    {summary && (
      <Box sx={{ mb: 1.5 }}>
        <Typography
          variant="caption"
          sx={{ color: '#8b949e', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}
        >
          Analysis
        </Typography>
        <Typography variant="body2" sx={{ color: '#c9d1d9', mt: 0.25, lineHeight: 1.5 }}>
          {summary}
        </Typography>
      </Box>
    )}

    {/* Weaknesses */}
    {weaknesses && weaknesses.length > 0 && (
      <Box sx={{ mb: 1.5 }}>
        <Typography
          variant="caption"
          sx={{ color: '#8b949e', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}
        >
          Potential Issues
        </Typography>
        <Box sx={{ mt: 0.5, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {weaknesses.map((weakness, index) => (
            <Chip
              key={index}
              label={weakness}
              size="small"
              sx={{
                bgcolor: 'rgba(248, 113, 113, 0.15)',
                color: '#f87171',
                fontSize: '0.7rem',
                height: 22,
                '& .MuiChip-label': { px: 1 },
              }}
            />
          ))}
        </Box>
      </Box>
    )}

    {/* Recommendation */}
    {recommendation && (
      <Box sx={{ borderTop: '1px solid #30363d', pt: 1.5 }}>
        <Typography
          variant="caption"
          sx={{ color: '#8b949e', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}
        >
          Recommendation
        </Typography>
        <Typography variant="body2" sx={{ color: '#60a5fa', mt: 0.25, fontStyle: 'italic' }}>
          {recommendation}
        </Typography>
      </Box>
    )}
  </Box>
);

/**
 * AiSummaryPreview - displays the AI evaluation summary with truncation and hover tooltip
 */
export const AiSummaryPreview: React.FC<AiSummaryPreviewProps> = ({
  summary,
  verdict,
  weaknesses,
  recommendation,
}) => {
  const hasContent = summary || verdict || (weaknesses && weaknesses.length > 0);
  if (!hasContent) return null;

  const verdictStyle = getVerdictStyle(verdict);

  // Display text: prefer verdict for quick scan, fallback to summary
  const displayText = verdict || summary || 'AI analysis available';
  const truncatedText = displayText.length > 80 ? `${displayText.slice(0, 77)}...` : displayText;

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
        cursor: 'help',
      }}
    >
      <Box sx={{ color: verdictStyle.color, mt: 0.25, flexShrink: 0 }}>
        {verdictStyle.icon}
      </Box>
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
          AI Analysis {weaknesses && weaknesses.length > 0 && `· ${weaknesses.length} issue${weaknesses.length > 1 ? 's' : ''}`}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: verdict ? verdictStyle.color : '#c9d1d9',
            fontSize: '0.75rem',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            lineHeight: 1.5,
            fontWeight: verdict ? 500 : 400,
          }}
        >
          {truncatedText}
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Tooltip
      title={
        <AiAnalysisTooltip
          summary={summary}
          verdict={verdict}
          weaknesses={weaknesses}
          recommendation={recommendation}
        />
      }
      arrow
      placement="bottom"
      enterDelay={200}
      slotProps={{
        tooltip: {
          sx: {
            bgcolor: '#1c2128',
            border: '1px solid #30363d',
            maxWidth: 420,
            p: 2,
            '& .MuiTooltip-arrow': {
              color: '#1c2128',
              '&::before': {
                border: '1px solid #30363d',
              }
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

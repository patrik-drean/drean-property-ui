import React from 'react';
import { Box, Typography, Button, IconButton, Tooltip } from '@mui/material';
import {
  OpenInNew as OpenIcon,
  CheckCircle as DoneIcon,
  SkipNext as SkipIcon,
  Archive as ArchiveIcon,
  Home as HomeIcon,
} from '@mui/icons-material';
import { QueueLead } from '../../../types/queue';
import { PriorityBadge } from './PriorityBadge';
import { MetricsGrid } from './MetricsGrid';
import { AiSummaryPreview } from './AiSummaryPreview';

interface QueueCardProps {
  lead: QueueLead;
  isSelected: boolean;
  onSelect: () => void;
  onViewDetails: () => void;
  onDone: () => void;
  onSkip: () => void;
  onArchive: () => void;
}

/**
 * QueueCard - displays a single lead in the queue with priority badge, metrics, and actions
 */
export const QueueCard: React.FC<QueueCardProps> = ({
  lead,
  isSelected,
  onSelect,
  onViewDetails,
  onDone,
  onSkip,
  onArchive,
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPropertyBasics = () => {
    const parts: string[] = [];
    if (lead.bedrooms) parts.push(`${lead.bedrooms}bd`);
    if (lead.bathrooms) parts.push(`${lead.bathrooms}ba`);
    if (lead.squareFootage) parts.push(`${lead.squareFootage.toLocaleString()} sqft`);
    return parts.join(' · ') || 'Details N/A';
  };

  return (
    <Box
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      sx={{
        bgcolor: '#161b22',
        borderRadius: 2,
        border: '1px solid',
        borderColor: isSelected ? '#4ade80' : '#30363d',
        p: 2,
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        '&:hover': {
          borderColor: isSelected ? '#4ade80' : '#4ade80',
          bgcolor: '#1c2128',
        },
        '&:focus': {
          outline: 'none',
          borderColor: '#4ade80',
          boxShadow: '0 0 0 2px rgba(74, 222, 128, 0.2)',
        },
      }}
    >
      {/* Header: Priority badge + Address */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <PriorityBadge priority={lead.priority} timeSince={lead.timeSinceCreated} />
          <Typography
            variant="body1"
            sx={{
              color: '#f0f6fc',
              fontWeight: 600,
              fontSize: '0.95rem',
              mt: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {lead.address}
          </Typography>
        </Box>
        {lead.zillowLink && (
          <Tooltip title="View on Zillow">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                window.open(lead.zillowLink, '_blank');
              }}
              sx={{
                color: '#8b949e',
                '&:hover': { color: '#f0f6fc' },
              }}
            >
              <OpenIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* Property basics */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <HomeIcon sx={{ color: '#8b949e', fontSize: '0.9rem' }} />
        <Typography variant="caption" sx={{ color: '#8b949e' }}>
          {formatPropertyBasics()}
        </Typography>
        <Typography
          variant="caption"
          sx={{ color: '#f0f6fc', fontWeight: 600, ml: 'auto' }}
        >
          {formatCurrency(lead.listingPrice)}
        </Typography>
      </Box>

      {/* Metrics Grid */}
      <MetricsGrid
        score={lead.leadScore}
        mao={lead.mao ?? null}
        spreadPercent={lead.spreadPercent ?? null}
        neighborhoodGrade={lead.neighborhoodGrade ?? null}
      />

      {/* AI Evaluation Summary */}
      {lead.aiSummary && (
        <Box sx={{ mt: 1.5 }}>
          <AiSummaryPreview summary={lead.aiSummary} />
        </Box>
      )}

      {/* Actions */}
      <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
        <Button
          variant="contained"
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails();
          }}
          sx={{
            flex: 1,
            bgcolor: '#238636',
            color: '#ffffff',
            textTransform: 'none',
            fontWeight: 500,
            fontSize: '0.8rem',
            py: 0.75,
            '&:hover': { bgcolor: '#2ea043' },
          }}
        >
          View Details
        </Button>
      </Box>

      {/* Secondary actions */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 0.5,
          mt: 1.5,
          pt: 1.5,
          borderTop: '1px solid #21262d',
        }}
      >
        <Tooltip title="Mark as done (d)">
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onDone();
            }}
            sx={{
              color: '#8b949e',
              '&:hover': { color: '#4ade80', bgcolor: 'rgba(74, 222, 128, 0.1)' },
            }}
          >
            <DoneIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Skip for now (s)">
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onSkip();
            }}
            sx={{
              color: '#8b949e',
              '&:hover': { color: '#fbbf24', bgcolor: 'rgba(251, 191, 36, 0.1)' },
            }}
          >
            <SkipIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Archive (a)">
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onArchive();
            }}
            sx={{
              color: '#8b949e',
              '&:hover': { color: '#f87171', bgcolor: 'rgba(248, 113, 113, 0.1)' },
            }}
          >
            <ArchiveIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
};

export default QueueCard;

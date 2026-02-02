import React, { useState } from 'react';
import { Box, Typography, IconButton, Tooltip } from '@mui/material';
import {
  OpenInNew as OpenIcon,
  CheckCircle as DoneIcon,
  NotificationsActive as RemindIcon,
  Archive as ArchiveIcon,
  Home as HomeIcon,
  Event as EventIcon,
  Refresh as RefreshIcon,
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
  onFollowUp: () => void;
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
  onFollowUp,
  onArchive,
}) => {
  // Track image load error to show placeholder
  const [imageError, setImageError] = useState(false);

  // Double-click to open details
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onViewDetails();
  };

  // Check if we should show the photo or placeholder
  const hasValidPhoto = lead.photoUrl && lead.photoUrl.trim() !== '' && !imageError;
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

  const formatFollowUpDate = (dateStr: string | undefined) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);

    if (dateOnly.getTime() === today.getTime()) return 'Today';
    if (dateOnly.getTime() === tomorrow.getTime()) return 'Tomorrow';

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Helper to check if date is within N days (TASK-107)
  const isWithinDays = (dateStr: string, days: number): boolean => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= days;
  };

  // Helper to format relative date for consolidation badge (TASK-107)
  const formatRelativeDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return 'just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'yesterday';
    return `${diffDays}d ago`;
  };

  // Helper to format full date for tooltip (TASK-107)
  const formatFullDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <Box
      onClick={onSelect}
      onDoubleClick={handleDoubleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onViewDetails();
        }
      }}
      sx={{
        bgcolor: '#161b22',
        borderRadius: 2,
        border: '1px solid',
        borderColor: isSelected ? '#4ade80' : '#30363d',
        overflow: 'hidden',
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
      {/* Cover Photo Banner */}
      {hasValidPhoto ? (
        <Box
          sx={{
            width: '100%',
            aspectRatio: '16/9',
            overflow: 'hidden',
            bgcolor: '#21262d',
          }}
        >
          <Box
            component="img"
            src={lead.photoUrl}
            alt={`${lead.address} exterior`}
            loading="lazy"
            onError={() => setImageError(true)}
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
          />
        </Box>
      ) : (
        <Box
          sx={{
            width: '100%',
            aspectRatio: '16/9',
            bgcolor: '#21262d',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <HomeIcon sx={{ fontSize: 48, color: '#30363d' }} />
        </Box>
      )}

      {/* Card Content with padding */}
      <Box sx={{ p: 2 }}>
        {/* Header: Priority badge + Follow-up badge + Address */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <PriorityBadge priority={lead.priority} timeSince={lead.timeSinceCreated} />
              {lead.followUpDate && (
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.5,
                    px: 1,
                    py: 0.5,
                    borderRadius: 1,
                    backgroundColor: 'rgba(251, 191, 36, 0.15)',
                    border: '1px solid #fbbf24',
                  }}
                >
                  <EventIcon sx={{ fontSize: '0.75rem', color: '#fbbf24' }} />
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#fbbf24',
                      fontWeight: 600,
                      fontSize: '0.7rem',
                    }}
                  >
                    {formatFollowUpDate(lead.followUpDate)}
                  </Typography>
                </Box>
              )}
              {/* Consolidation Badge - TASK-107 */}
              {lead.lastConsolidatedAt && isWithinDays(lead.lastConsolidatedAt, 7) && (
                <Tooltip
                  title={`Data updated from ${lead.lastConsolidatedSource || 'unknown'} on ${formatFullDate(lead.lastConsolidatedAt)}`}
                >
                  <Box
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 0.5,
                      px: 1,
                      py: 0.5,
                      borderRadius: 1,
                      backgroundColor: 'rgba(96, 165, 250, 0.15)',
                      border: '1px solid #60a5fa',
                    }}
                  >
                    <RefreshIcon sx={{ fontSize: '0.75rem', color: '#60a5fa' }} />
                    <Typography
                      variant="caption"
                      sx={{
                        color: '#60a5fa',
                        fontWeight: 600,
                        fontSize: '0.7rem',
                      }}
                    >
                      Updated {formatRelativeDate(lead.lastConsolidatedAt)}
                    </Typography>
                  </Box>
                </Tooltip>
              )}
            </Box>
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
          metrics={lead.metrics}
          listingPrice={lead.listingPrice}
        />

        {/* AI Evaluation Summary */}
        {(lead.aiSummary || lead.aiVerdict || (lead.aiWeaknesses && lead.aiWeaknesses.length > 0)) && (
          <Box sx={{ mt: 1.5 }}>
            <AiSummaryPreview
              summary={lead.aiSummary}
              verdict={lead.aiVerdict}
              weaknesses={lead.aiWeaknesses}
              recommendation={lead.recommendation}
            />
          </Box>
        )}

        {/* Quick Actions */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 0.5,
            mt: 2,
            pt: 1.5,
            borderTop: '1px solid #21262d',
          }}
        >
          <Tooltip title="Mark as done (d)">
            <IconButton
              size="small"
              data-testid="done-button"
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
          <Tooltip title="Follow up in 2 days (l)">
            <IconButton
              size="small"
              data-testid="followup-button"
              onClick={(e) => {
                e.stopPropagation();
                onFollowUp();
              }}
              sx={{
                color: '#8b949e',
                '&:hover': { color: '#fbbf24', bgcolor: 'rgba(251, 191, 36, 0.1)' },
              }}
            >
              <RemindIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Archive (a)">
            <IconButton
              size="small"
              data-testid="archive-button"
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
    </Box>
  );
};

export default QueueCard;

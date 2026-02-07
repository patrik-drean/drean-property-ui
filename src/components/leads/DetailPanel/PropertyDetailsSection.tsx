import React, { useState } from 'react';
import { Box, Typography, Link, Grid, Tooltip, Collapse } from '@mui/material';
import {
  OpenInNew as OpenInNewIcon,
  AutoAwesome as AiIcon,
  Home as HomeIcon,
  DataObject as MetadataIcon,
  Collections as GalleryIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import { QueueLead } from '../../../types/queue'
import { SectionCard } from './SectionCard';
import { QuickMetrics } from './QuickMetrics';

interface PropertyDetailsSectionProps {
  lead: QueueLead;
  /** Callback to open gallery panel */
  onGalleryToggle?: (open: boolean) => void;
}

interface StatItemProps {
  label: string;
  value: string | number | null | undefined;
}

const StatItem: React.FC<StatItemProps> = ({ label, value }) => (
  <Grid item xs={4}>
    <Typography variant="caption" sx={{ color: '#8b949e', fontSize: '0.65rem' }}>
      {label}
    </Typography>
    <Typography variant="body2" sx={{ color: '#f0f6fc', fontWeight: 500 }}>
      {value ?? '-'}
    </Typography>
  </Grid>
);

/**
 * PropertyDetailsSection - Top-left quadrant of the Lead Detail Panel
 *
 * Displays:
 * - Property photo (if available)
 * - Address with Zillow link
 * - Property stats (beds, baths, sqft, units, DOM)
 * - Listing price
 * - Quick metrics (Score, ARV, Rehab, MAO, Neighborhood)
 * - AI Analysis (collapsible)
 */
export const PropertyDetailsSection: React.FC<PropertyDetailsSectionProps> = ({
  lead,
  onGalleryToggle,
}) => {
  // Track image load error to show placeholder
  const [imageError, setImageError] = useState(false);

  // AI Analysis collapsed state (collapsed by default)
  const [aiExpanded, setAiExpanded] = useState(false);

  // Get all photos (use photoUrls if available, otherwise just the single photoUrl)
  const allPhotos = lead.photoUrls?.length ? lead.photoUrls : (lead.photoUrl ? [lead.photoUrl] : []);

  // Handle photo click to open gallery
  const handlePhotoClick = () => {
    if (allPhotos.length > 0) {
      onGalleryToggle?.(true);
    }
  };

  // Check if we should show the photo or placeholder
  const hasValidPhoto = lead.photoUrl && lead.photoUrl.trim() !== '' && !imageError;

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Check if we have any enrichment metadata to display
  const metadata = lead.enrichmentMetadata;
  const hasMetadata = metadata && Object.values(metadata).some(v => v !== null && v !== undefined);

  // Get days on market from enrichment metadata
  const daysOnMarket = metadata?.daysOnMarket ?? null;

  return (
    <SectionCard title="PROPERTY DETAILS">
      {/* Address with thumbnail and Zillow link */}
      <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
        {/* Property Thumbnail - larger size */}
        {hasValidPhoto ? (
          <Tooltip title={allPhotos.length > 1 ? `View ${allPhotos.length} photos (P)` : 'View photo (P)'}>
            <Box
              onClick={handlePhotoClick}
              sx={{
                width: 150,
                height: 112,
                borderRadius: 1,
                overflow: 'hidden',
                flexShrink: 0,
                bgcolor: '#21262d',
                cursor: 'pointer',
                position: 'relative',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'scale(1.03)',
                  boxShadow: '0 0 0 2px #4ade80',
                },
                '&:hover .photo-count': {
                  opacity: 1,
                },
              }}
            >
              <Box
                component="img"
                src={lead.photoUrl}
                alt={`${lead.address} thumbnail`}
                loading="lazy"
                onError={() => setImageError(true)}
                sx={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
              {/* Photo count badge */}
              {allPhotos.length > 1 && (
                <Box
                  className="photo-count"
                  sx={{
                    position: 'absolute',
                    bottom: 4,
                    right: 4,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    px: 0.75,
                    py: 0.25,
                    borderRadius: 0.5,
                    bgcolor: 'rgba(0, 0, 0, 0.75)',
                    color: '#fff',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    opacity: 0.8,
                    transition: 'opacity 0.2s',
                  }}
                >
                  <GalleryIcon sx={{ fontSize: 12 }} />
                  {allPhotos.length}
                </Box>
              )}
            </Box>
          </Tooltip>
        ) : (
          <Box
            sx={{
              width: 150,
              height: 112,
              borderRadius: 1,
              bgcolor: '#21262d',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <HomeIcon sx={{ fontSize: 40, color: '#30363d' }} />
          </Box>
        )}

        {/* Address and Zillow link */}
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="body1" sx={{ color: '#f0f6fc', fontWeight: 600, mb: 0.5 }}>
            {lead.address}
          </Typography>
          {lead.zillowLink && (
            <Link
              href={lead.zillowLink}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                color: '#4ade80',
                fontSize: '0.8rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.5,
                textDecoration: 'none',
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              View on Zillow <OpenInNewIcon sx={{ fontSize: '0.9rem' }} />
            </Link>
          )}
        </Box>
      </Box>

      {/* Property Stats Grid */}
      <Grid container spacing={1} sx={{ mb: 2 }}>
        <StatItem label="Beds" value={lead.bedrooms} />
        <StatItem label="Baths" value={lead.bathrooms} />
        <StatItem
          label="Sq Ft"
          value={lead.squareFootage?.toLocaleString()}
        />
        <StatItem label="Units" value={lead.units ?? 1} />
        <StatItem label="DOM" value={daysOnMarket !== null ? `${daysOnMarket} days` : '-'} />
      </Grid>

      {/* Enrichment Metadata */}
      {hasMetadata && (
        <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center' }}>
          <Tooltip
            title={
              <pre style={{ margin: 0, fontSize: '11px', whiteSpace: 'pre-wrap' }}>
                {JSON.stringify(metadata, null, 2)}
              </pre>
            }
            arrow
            componentsProps={{
              tooltip: {
                sx: {
                  bgcolor: '#1c2128',
                  border: '1px solid #30363d',
                  maxWidth: 400,
                  '& .MuiTooltip-arrow': { color: '#1c2128' },
                },
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#8b949e', cursor: 'help' }}>
              <MetadataIcon sx={{ fontSize: 16 }} />
              <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                Metadata
              </Typography>
            </Box>
          </Tooltip>
        </Box>
      )}

      {/* Listing Price */}
      <Box sx={{ pt: 2, borderTop: '1px solid #30363d' }}>
        <Typography variant="caption" sx={{ color: '#8b949e' }}>
          Listing Price
        </Typography>
        <Typography variant="h5" sx={{ color: '#f0f6fc', fontWeight: 600 }}>
          {formatCurrency(lead.listingPrice)}
        </Typography>
      </Box>

      {/* Quick Metrics Grid */}
      <QuickMetrics lead={lead} />

      {/* AI Analysis - Collapsible */}
      {lead.aiSummary && (
        <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #30363d' }}>
          <Box
            onClick={() => setAiExpanded(!aiExpanded)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              cursor: 'pointer',
              p: 1,
              borderRadius: 1,
              bgcolor: 'rgba(96, 165, 250, 0.08)',
              border: '1px solid rgba(96, 165, 250, 0.2)',
              '&:hover': {
                bgcolor: 'rgba(96, 165, 250, 0.12)',
              },
            }}
          >
            <AiIcon sx={{ color: '#60a5fa', fontSize: '1rem' }} />
            <Typography
              variant="caption"
              sx={{ color: '#60a5fa', fontWeight: 600, fontSize: '0.7rem', flex: 1 }}
            >
              AI Analysis
            </Typography>
            {aiExpanded ? (
              <ExpandLessIcon sx={{ color: '#60a5fa', fontSize: '1rem' }} />
            ) : (
              <ExpandMoreIcon sx={{ color: '#60a5fa', fontSize: '1rem' }} />
            )}
          </Box>
          <Collapse in={aiExpanded}>
            <Box sx={{ p: 1.5, pt: 1 }}>
              <Typography
                variant="body2"
                sx={{ color: '#c9d1d9', fontSize: '0.8rem', lineHeight: 1.6 }}
              >
                {lead.aiSummary}
              </Typography>
            </Box>
          </Collapse>
        </Box>
      )}

    </SectionCard>
  );
};

export default PropertyDetailsSection;

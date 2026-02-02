import React, { useState } from 'react';
import { Box, Typography, Link, Grid, Tooltip } from '@mui/material';
import {
  OpenInNew as OpenInNewIcon,
  AutoAwesome as AiIcon,
  Home as HomeIcon,
  DataObject as MetadataIcon,
} from '@mui/icons-material';
import { QueueLead } from '../../../types/queue'
import { SectionCard } from './SectionCard';

interface PropertyDetailsSectionProps {
  lead: QueueLead;
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
 * - Property stats (beds, baths, sqft, year built, units, DOM)
 * - Listing price
 */
export const PropertyDetailsSection: React.FC<PropertyDetailsSectionProps> = ({ lead }) => {
  // Track image load error to show placeholder
  const [imageError, setImageError] = useState(false);

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
        {/* Property Thumbnail */}
        {hasValidPhoto ? (
          <Box
            sx={{
              width: 60,
              height: 60,
              borderRadius: 1,
              overflow: 'hidden',
              flexShrink: 0,
              bgcolor: '#21262d',
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
          </Box>
        ) : (
          <Box
            sx={{
              width: 60,
              height: 60,
              borderRadius: 1,
              bgcolor: '#21262d',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <HomeIcon sx={{ fontSize: 24, color: '#30363d' }} />
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
        <StatItem label="Phone" value={lead.sellerPhone || '-'} />
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

      {/* AI Analysis */}
      {lead.aiSummary && (
        <Box
          sx={{
            mt: 2,
            pt: 2,
            borderTop: '1px solid #30363d',
          }}
        >
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
                variant="body2"
                sx={{
                  color: '#c9d1d9',
                  fontSize: '0.8rem',
                  lineHeight: 1.6,
                }}
              >
                {lead.aiSummary}
              </Typography>
            </Box>
          </Box>
        </Box>
      )}
    </SectionCard>
  );
};

export default PropertyDetailsSection;

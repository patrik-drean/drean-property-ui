import React from 'react';
import { Box, Typography, Link, Grid } from '@mui/material';
import { OpenInNew as OpenInNewIcon, AutoAwesome as AiIcon } from '@mui/icons-material';
import { QueueLead } from '../../../types/queue';
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
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Calculate days since created as proxy for DOM (using Mountain Time for consistency)
  const daysOnMarket = (() => {
    if (!lead.createdAt) return null;
    try {
      // Ensure the timestamp is treated as UTC by appending 'Z' if not present
      const utcString = lead.createdAt.endsWith('Z') ? lead.createdAt : `${lead.createdAt}Z`;
      const createdDate = new Date(utcString);
      const now = new Date();

      if (isNaN(createdDate.getTime())) return null;

      // Convert to Mountain Time for day calculation
      const mtCreated = new Date(createdDate.toLocaleString('en-US', { timeZone: 'America/Denver' }));
      const mtNow = new Date(now.toLocaleString('en-US', { timeZone: 'America/Denver' }));

      // Calculate days difference using Mountain Time dates (at midnight)
      const mtCreatedDay = new Date(mtCreated.getFullYear(), mtCreated.getMonth(), mtCreated.getDate());
      const mtNowDay = new Date(mtNow.getFullYear(), mtNow.getMonth(), mtNow.getDate());

      return Math.floor((mtNowDay.getTime() - mtCreatedDay.getTime()) / (1000 * 60 * 60 * 24));
    } catch {
      return null;
    }
  })();

  return (
    <SectionCard title="PROPERTY DETAILS">
      {/* Address with Zillow link */}
      <Box sx={{ mb: 2 }}>
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

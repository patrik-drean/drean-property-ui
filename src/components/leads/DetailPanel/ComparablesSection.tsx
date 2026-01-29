import React, { useState } from 'react';
import { Box, Button, Collapse, Link, Typography } from '@mui/material';
import { ExpandMore as ExpandMoreIcon, ExpandLess as ExpandLessIcon } from '@mui/icons-material';

export interface Comparable {
  id?: string;
  address: string;
  salePrice: number;
  pricePerSqft: number;
  saleDate: string;
  distanceMiles: number;
  zillowUrl?: string;
  // Enhanced fields from RentCast
  squareFeet?: number;
  bedrooms?: number;
  bathrooms?: number;
  city?: string;
  state?: string;
  propertyType?: string;
}

interface ComparablesSectionProps {
  comps: Comparable[];
  /** Whether comps are from RentCast (verified) vs mock data */
  isVerified?: boolean;
}

/**
 * ComparablesSection - Expandable table showing comparable sales
 *
 * Supports both basic comps (address, price, sqft, date, distance)
 * and enhanced RentCast comps (with beds/baths, Zillow links).
 */
export const ComparablesSection: React.FC<ComparablesSectionProps> = ({
  comps,
  isVerified = false,
}) => {
  const [expanded, setExpanded] = useState(false);

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Format date in Mountain Time
  const formatDate = (dateString: string): string => {
    try {
      // Ensure the timestamp is treated as UTC by appending 'Z' if not present
      const utcString = dateString.endsWith('Z') ? dateString : `${dateString}Z`;
      const date = new Date(utcString);

      // Validate date
      if (isNaN(date.getTime())) {
        console.warn('Invalid date:', dateString);
        return dateString;
      }

      return new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Denver',
        month: 'short',
        year: '2-digit',
      }).format(date);
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };

  // Format beds/baths display
  const formatBedsBaths = (beds?: number, baths?: number): string | null => {
    if (beds === undefined && baths === undefined) return null;
    const bedsStr = beds !== undefined ? `${beds}bd` : '';
    const bathsStr = baths !== undefined ? `${baths}ba` : '';
    return [bedsStr, bathsStr].filter(Boolean).join('/');
  };

  // Show "No Comps Available" when empty
  if (comps.length === 0) {
    return (
      <Box sx={{ mt: 2 }}>
        <Typography
          variant="caption"
          sx={{
            color: '#8b949e',
            fontSize: '0.8rem',
            fontStyle: 'italic',
          }}
        >
          No Comps Available
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Button
        size="small"
        onClick={() => setExpanded(!expanded)}
        endIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        sx={{
          color: isVerified ? '#a78bfa' : '#4ade80',
          textTransform: 'none',
          fontWeight: 500,
          fontSize: '0.8rem',
          p: 0,
          '&:hover': { bgcolor: 'transparent' },
        }}
      >
        View {comps.length} Comps {isVerified && '(RentCast)'}
      </Button>

      <Collapse in={expanded}>
        <Box
          sx={{
            mt: 1,
            bgcolor: '#21262d',
            border: '1px solid #30363d',
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          {comps.map((comp, index) => {
            const bedsBaths = formatBedsBaths(comp.bedrooms, comp.bathrooms);

            return (
              <Box
                key={comp.id || index}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  px: 1.5,
                  py: 1,
                  borderBottom: index < comps.length - 1 ? '1px solid #30363d' : 'none',
                  '&:hover': { bgcolor: '#161b22' },
                }}
              >
                {/* Left side: Address, Date, Beds/Baths */}
                <Box sx={{ flex: 1, minWidth: 0, mr: 2 }}>
                  <Box sx={{ color: '#f0f6fc', fontSize: '0.75rem', fontWeight: 500 }}>
                    {comp.zillowUrl ? (
                      <Link
                        href={comp.zillowUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          color: '#60a5fa',
                          textDecoration: 'none',
                          '&:hover': { textDecoration: 'underline' },
                        }}
                      >
                        {comp.address}
                      </Link>
                    ) : (
                      comp.address
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, color: '#8b949e', fontSize: '0.65rem' }}>
                    <span>{formatDate(comp.saleDate)}</span>
                    {bedsBaths && (
                      <>
                        <span>•</span>
                        <span>{bedsBaths}</span>
                      </>
                    )}
                    <span>•</span>
                    <span>{comp.distanceMiles.toFixed(1)} mi</span>
                  </Box>
                </Box>

                {/* Right side: Price, $/sqft */}
                <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                  <Box sx={{ color: '#f0f6fc', fontSize: '0.75rem', fontWeight: 500 }}>
                    {formatCurrency(comp.salePrice)}
                  </Box>
                  <Box sx={{ color: '#4ade80', fontSize: '0.65rem' }}>
                    ${comp.pricePerSqft}/sqft
                  </Box>
                </Box>
              </Box>
            );
          })}
        </Box>
      </Collapse>
    </Box>
  );
};

export default ComparablesSection;

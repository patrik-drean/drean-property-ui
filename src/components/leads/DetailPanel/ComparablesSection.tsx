import React, { useState } from 'react';
import { Box, Button, Collapse } from '@mui/material';
import { ExpandMore as ExpandMoreIcon, ExpandLess as ExpandLessIcon } from '@mui/icons-material';

export interface Comparable {
  address: string;
  salePrice: number;
  pricePerSqft: number;
  saleDate: string;
  distanceMiles: number;
  zillowLink?: string;
}

interface ComparablesSectionProps {
  comps: Comparable[];
}

/**
 * ComparablesSection - Expandable table showing comparable sales
 */
export const ComparablesSection: React.FC<ComparablesSectionProps> = ({ comps }) => {
  const [expanded, setExpanded] = useState(false);

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      year: '2-digit',
    });
  };

  if (comps.length === 0) {
    return null;
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Button
        size="small"
        onClick={() => setExpanded(!expanded)}
        endIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        sx={{
          color: '#4ade80',
          textTransform: 'none',
          fontWeight: 500,
          fontSize: '0.8rem',
          p: 0,
          '&:hover': { bgcolor: 'transparent' },
        }}
      >
        View {comps.length} Comps
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
          {comps.map((comp, index) => (
            <Box
              key={index}
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
              <Box sx={{ flex: 1, minWidth: 0, mr: 2 }}>
                <Box sx={{ color: '#f0f6fc', fontSize: '0.75rem', fontWeight: 500 }}>
                  {comp.address}
                </Box>
                <Box sx={{ color: '#8b949e', fontSize: '0.65rem' }}>
                  {formatDate(comp.saleDate)}
                </Box>
              </Box>
              <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                <Box sx={{ color: '#f0f6fc', fontSize: '0.75rem', fontWeight: 500 }}>
                  {formatCurrency(comp.salePrice)}
                </Box>
                <Box sx={{ color: '#4ade80', fontSize: '0.65rem' }}>
                  ${comp.pricePerSqft}/sqft
                </Box>
              </Box>
            </Box>
          ))}
        </Box>
      </Collapse>
    </Box>
  );
};

export default ComparablesSection;

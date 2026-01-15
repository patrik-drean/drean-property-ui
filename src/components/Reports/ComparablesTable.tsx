import React from 'react';
import {
  Paper,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Link as MuiLink,
  Chip,
  Box
} from '@mui/material';
import { SaleComparable, CompTier } from '../../types/property';
import { getZillowUrl } from '../../utils/zillowLinks';

interface Props {
  comparables: SaleComparable[];
}

const getTierColor = (tier?: CompTier): 'success' | 'warning' | 'info' | 'default' => {
  switch (tier) {
    case 'ARV':
      return 'success';
    case 'As-Is':
      return 'warning';
    case 'New Build':
      return 'info';
    default:
      return 'default';
  }
};

const getTierBgColor = (tier?: CompTier): string => {
  switch (tier) {
    case 'ARV':
      return 'rgba(76, 175, 80, 0.08)';
    case 'As-Is':
      return 'rgba(255, 152, 0, 0.08)';
    case 'New Build':
      return 'rgba(33, 150, 243, 0.08)';
    default:
      return 'inherit';
  }
};

const ComparablesTable: React.FC<Props> = ({ comparables }) => {
  if (!comparables || comparables.length === 0) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography color="text.secondary">
          No comparable sales data available
        </Typography>
      </Paper>
    );
  }

  // Check if we have tier data (new format)
  const hasTierData = comparables.some(c => c.tier && c.tier !== 'Mid');

  // Calculate averages for all comps
  const avgPrice = comparables.reduce((sum, c) => sum + c.price, 0) / comparables.length;
  const compsWithSqft = comparables.filter(c => c.squareFootage && c.squareFootage > 0);
  const avgPricePerSqft = compsWithSqft.length > 0
    ? compsWithSqft.reduce((sum, c) => sum + (c.price / c.squareFootage!), 0) / compsWithSqft.length
    : 0;
  const avgDistance = comparables.reduce((sum, c) => sum + c.distance, 0) / comparables.length;

  // Calculate ARV comps averages
  const arvComps = comparables.filter(c => c.tier === 'ARV');
  const arvAvgPrice = arvComps.length > 0
    ? arvComps.reduce((sum, c) => sum + c.price, 0) / arvComps.length
    : 0;
  const arvCompsWithSqft = arvComps.filter(c => c.squareFootage && c.squareFootage > 0);
  const arvAvgPpsf = arvCompsWithSqft.length > 0
    ? arvCompsWithSqft.reduce((sum, c) => sum + (c.price / c.squareFootage!), 0) / arvCompsWithSqft.length
    : 0;

  return (
    <Paper>
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">
          Comparable Sales ({comparables.length} Recent Sales)
        </Typography>
        {hasTierData && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip label="ARV" size="small" color="success" variant="outlined" />
            <Chip label="Mid" size="small" variant="outlined" />
            <Chip label="As-Is" size="small" color="warning" variant="outlined" />
            <Chip label="New Build" size="small" color="info" variant="outlined" />
          </Box>
        )}
      </Box>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Address</TableCell>
            <TableCell align="right">Price</TableCell>
            <TableCell align="right">$/SqFt</TableCell>
            <TableCell>Beds/Baths</TableCell>
            <TableCell align="right">SqFt</TableCell>
            <TableCell align="right">Dist (mi)</TableCell>
            {hasTierData && <TableCell align="center">Tier</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {comparables.map((comp, idx) => (
            <TableRow
              key={idx}
              sx={{
                bgcolor: hasTierData ? getTierBgColor(comp.tier) : 'inherit',
              }}
            >
              <TableCell>
                <MuiLink
                  href={getZillowUrl(comp.address)}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    textDecoration: 'none',
                    color: 'primary.main',
                    '&:hover': { textDecoration: 'underline' },
                    fontSize: '0.875rem',
                  }}
                >
                  {comp.address}
                </MuiLink>
              </TableCell>
              <TableCell align="right">${comp.price.toLocaleString()}</TableCell>
              <TableCell align="right">
                {comp.pricePerSqft && comp.pricePerSqft > 0
                  ? `$${comp.pricePerSqft.toFixed(0)}`
                  : comp.squareFootage
                    ? `$${(comp.price / comp.squareFootage).toFixed(0)}`
                    : 'N/A'}
              </TableCell>
              <TableCell>{comp.bedrooms}/{comp.bathrooms}</TableCell>
              <TableCell align="right">{comp.squareFootage?.toLocaleString() || 'N/A'}</TableCell>
              <TableCell align="right">{comp.distance.toFixed(2)}</TableCell>
              {hasTierData && (
                <TableCell align="center">
                  <Chip
                    label={comp.tier || 'Mid'}
                    size="small"
                    color={getTierColor(comp.tier)}
                    variant={comp.tier === 'ARV' ? 'filled' : 'outlined'}
                    sx={{ fontSize: '0.7rem', height: 22 }}
                  />
                </TableCell>
              )}
            </TableRow>
          ))}

          {/* ARV Average Row - only show if we have tier data and ARV comps */}
          {hasTierData && arvComps.length > 0 && (
            <TableRow
              sx={{
                bgcolor: 'success.light',
                '& td': { fontWeight: 'bold', color: 'success.contrastText' },
              }}
            >
              <TableCell>ARV Average ({arvComps.length} comps)</TableCell>
              <TableCell align="right">
                ${arvAvgPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </TableCell>
              <TableCell align="right">${arvAvgPpsf.toFixed(0)}</TableCell>
              <TableCell>-</TableCell>
              <TableCell align="right">-</TableCell>
              <TableCell align="right">-</TableCell>
              <TableCell align="center">
                <Typography variant="caption" sx={{ color: 'inherit' }}>
                  Used for ARV
                </Typography>
              </TableCell>
            </TableRow>
          )}

          {/* All Comps Average Row */}
          <TableRow sx={{ bgcolor: '#f5f5f5', '& td': { fontWeight: 'bold' } }}>
            <TableCell>All Comps Average</TableCell>
            <TableCell align="right">
              ${avgPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </TableCell>
            <TableCell align="right">${avgPricePerSqft.toFixed(0)}</TableCell>
            <TableCell>-</TableCell>
            <TableCell align="right">-</TableCell>
            <TableCell align="right">{avgDistance.toFixed(2)}</TableCell>
            {hasTierData && (
              <TableCell align="center">
                <Typography variant="caption" color="text.secondary">
                  Used for As-Is
                </Typography>
              </TableCell>
            )}
          </TableRow>
        </TableBody>
      </Table>
    </Paper>
  );
};

export default ComparablesTable;

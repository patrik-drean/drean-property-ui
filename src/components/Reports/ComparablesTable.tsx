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
    case 'Quality':
      return 'success';
    case 'As-Is':
      return 'warning';
    case 'New Build':
      return 'info';
    default:
      return 'default';
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

  // Calculate Quality comps averages
  const qualityComps = comparables.filter(c => c.tier === 'Quality');
  const qualityAvgPrice = qualityComps.length > 0
    ? qualityComps.reduce((sum, c) => sum + c.price, 0) / qualityComps.length
    : 0;
  const qualityCompsWithSqft = qualityComps.filter(c => c.squareFootage && c.squareFootage > 0);
  const qualityAvgPpsf = qualityCompsWithSqft.length > 0
    ? qualityCompsWithSqft.reduce((sum, c) => sum + (c.price / c.squareFootage!), 0) / qualityCompsWithSqft.length
    : 0;

  // Calculate Mid comps averages
  const midComps = comparables.filter(c => c.tier === 'Mid');
  const midAvgPrice = midComps.length > 0
    ? midComps.reduce((sum, c) => sum + c.price, 0) / midComps.length
    : 0;
  const midCompsWithSqft = midComps.filter(c => c.squareFootage && c.squareFootage > 0);
  const midAvgPpsf = midCompsWithSqft.length > 0
    ? midCompsWithSqft.reduce((sum, c) => sum + (c.price / c.squareFootage!), 0) / midCompsWithSqft.length
    : 0;

  // Calculate As-Is comps averages
  const asIsComps = comparables.filter(c => c.tier === 'As-Is');
  const asIsAvgPrice = asIsComps.length > 0
    ? asIsComps.reduce((sum, c) => sum + c.price, 0) / asIsComps.length
    : 0;
  const asIsCompsWithSqft = asIsComps.filter(c => c.squareFootage && c.squareFootage > 0);
  const asIsAvgPpsf = asIsCompsWithSqft.length > 0
    ? asIsCompsWithSqft.reduce((sum, c) => sum + (c.price / c.squareFootage!), 0) / asIsCompsWithSqft.length
    : 0;

  return (
    <Paper>
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">
          Comparable Sales ({comparables.length} Recent Sales)
        </Typography>
        {hasTierData && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip label="Quality" size="small" color="success" variant="outlined" />
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
            <TableRow key={idx}>
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
                    variant="outlined"
                    sx={{ fontSize: '0.7rem', height: 22 }}
                  />
                </TableCell>
              )}
            </TableRow>
          ))}

          {/* Quality Average Row - only show if we have tier data and Quality comps */}
          {hasTierData && qualityComps.length > 0 && (
            <TableRow
              sx={{
                '& td': { fontWeight: 'bold' },
              }}
            >
              <TableCell>Quality Average ({qualityComps.length} comps)</TableCell>
              <TableCell align="right">
                ${qualityAvgPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </TableCell>
              <TableCell align="right">${qualityAvgPpsf.toFixed(0)}</TableCell>
              <TableCell>-</TableCell>
              <TableCell align="right">-</TableCell>
              <TableCell align="right">-</TableCell>
              <TableCell align="center">
                <Typography variant="caption" sx={{ color: 'inherit' }}>
                </Typography>
              </TableCell>
            </TableRow>
          )}

          {/* Mid Average Row - only show if we have tier data and Mid comps */}
          {hasTierData && midComps.length > 0 && (
            <TableRow
              sx={{
                '& td': { fontWeight: 'bold' },
              }}
            >
              <TableCell>Mid Average ({midComps.length} comps)</TableCell>
              <TableCell align="right">
                ${midAvgPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </TableCell>
              <TableCell align="right">${midAvgPpsf.toFixed(0)}</TableCell>
              <TableCell>-</TableCell>
              <TableCell align="right">-</TableCell>
              <TableCell align="right">-</TableCell>
              <TableCell align="center">
                <Typography variant="caption" sx={{ color: 'inherit' }}>
                </Typography>
              </TableCell>
            </TableRow>
          )}

          {/* As-Is Average Row - only show if we have tier data and As-Is comps */}
          {hasTierData && asIsComps.length > 0 && (
            <TableRow
              sx={{
                '& td': { fontWeight: 'bold' },
              }}
            >
              <TableCell>As-Is Average ({asIsComps.length} comps)</TableCell>
              <TableCell align="right">
                ${asIsAvgPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </TableCell>
              <TableCell align="right">${asIsAvgPpsf.toFixed(0)}</TableCell>
              <TableCell>-</TableCell>
              <TableCell align="right">-</TableCell>
              <TableCell align="right">-</TableCell>
              <TableCell align="center">
                <Typography variant="caption" sx={{ color: 'inherit' }}>
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
            <TableCell align="right">-</TableCell>
            {hasTierData && (
              <TableCell align="center">
                <Typography variant="caption" color="text.secondary">
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

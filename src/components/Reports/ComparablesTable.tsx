import React from 'react';
import {
  Paper,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Link as MuiLink
} from '@mui/material';
import { SaleComparable } from '../../types/property';
import { getZillowUrl } from '../../utils/zillowLinks';

interface Props {
  comparables: SaleComparable[];
}

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

  // Calculate averages
  const avgPrice = comparables.reduce((sum, c) => sum + c.price, 0) / comparables.length;
  const compsWithSqft = comparables.filter(c => c.squareFootage && c.squareFootage > 0);
  const avgPricePerSqft = compsWithSqft.length > 0
    ? compsWithSqft.reduce((sum, c) => sum + (c.price / c.squareFootage!), 0) / compsWithSqft.length
    : 0;
  const avgDistance = comparables.reduce((sum, c) => sum + c.distance, 0) / comparables.length;

  return (
    <Paper>
      <Typography variant="h6" sx={{ p: 2 }}>
        Comparable Sales ({comparables.length} Recent Sales)
      </Typography>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Address</TableCell>
            <TableCell align="right">Price</TableCell>
            <TableCell align="right">$/SqFt</TableCell>
            <TableCell>Beds/Baths</TableCell>
            <TableCell align="right">SqFt</TableCell>
            <TableCell align="right">Distance (mi)</TableCell>
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
                    '&:hover': { textDecoration: 'underline' }
                  }}
                >
                  {comp.address}
                </MuiLink>
              </TableCell>
              <TableCell align="right">${comp.price.toLocaleString()}</TableCell>
              <TableCell align="right">
                {comp.squareFootage ? `$${(comp.price / comp.squareFootage).toFixed(0)}` : 'N/A'}
              </TableCell>
              <TableCell>{comp.bedrooms}/{comp.bathrooms}</TableCell>
              <TableCell align="right">{comp.squareFootage?.toLocaleString() || 'N/A'}</TableCell>
              <TableCell align="right">{comp.distance.toFixed(2)}</TableCell>
            </TableRow>
          ))}
          {/* Averages Row */}
          <TableRow sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>
            <TableCell>Average</TableCell>
            <TableCell align="right">
              ${avgPrice.toLocaleString(undefined, {maximumFractionDigits: 0})}
            </TableCell>
            <TableCell align="right">${avgPricePerSqft.toFixed(0)}</TableCell>
            <TableCell>-</TableCell>
            <TableCell align="right">-</TableCell>
            <TableCell align="right">{avgDistance.toFixed(2)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </Paper>
  );
};

export default ComparablesTable;

import React from 'react';
import { Box, Grid } from '@mui/material';
import type { PortfolioPLReport, MonthlyOccupancy } from '../../utils/reportUtils';
import { StatTile, formatCurrency } from './PropertyKpiStrip';
import type { TileColor } from './PropertyKpiStrip';

interface PortfolioKpiStripProps {
  report: PortfolioPLReport;
  occupancy: MonthlyOccupancy[];
}

export const PortfolioKpiStrip: React.FC<PortfolioKpiStripProps> = ({ report, occupancy }) => {
  const lastMonthOccupancy = occupancy[occupancy.length - 1];
  const occupancyRate = lastMonthOccupancy && lastMonthOccupancy.total > 0
    ? Math.round((lastMonthOccupancy.occupied / lastMonthOccupancy.total) * 100)
    : 0;

  const occupancyColor: TileColor =
    occupancyRate >= 90 ? 'success' : occupancyRate >= 75 ? 'warning' : 'error';

  // The business row is not a property, so it does not count either way
  const propertyRows = report.propertyBreakdowns.filter(p => p.propertyId !== 'business');
  const positiveCount = propertyRows.filter(p => p.lastMonthNetIncome >= 0).length;

  const positiveColor: TileColor =
    propertyRows.length === 0
      ? 'text.primary'
      : positiveCount === propertyRows.length
        ? 'success'
        : positiveCount === 0
          ? 'error'
          : 'warning';

  const tiles: Array<{ label: string; value: string; caption?: string; color: TileColor }> = [
    {
      label: 'Last Month Net',
      value: formatCurrency(report.lastFullMonth.netIncome),
      color: report.lastFullMonth.netIncome >= 0 ? 'success' : 'error',
    },
    {
      label: 'Last Month Income',
      value: formatCurrency(report.lastFullMonth.totalIncome),
      color: 'text.primary',
    },
    {
      label: 'Last Month Expenses',
      value: formatCurrency(report.lastFullMonth.totalExpenses),
      color: 'text.primary',
    },
    {
      label: 'Portfolio Occupancy',
      value: lastMonthOccupancy ? `${lastMonthOccupancy.occupied}/${lastMonthOccupancy.total}` : '—',
      caption: `${occupancyRate}% of units`,
      color: occupancyColor,
    },
    {
      label: 'Cashflow Positive',
      value: `${positiveCount} of ${propertyRows.length}`,
      caption: 'properties last month',
      color: positiveColor,
    },
  ];

  return (
    <Box mb={3}>
      <Grid container spacing={2}>
        {tiles.map(tile => (
          <Grid item xs={6} md key={tile.label}>
            <StatTile {...tile} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

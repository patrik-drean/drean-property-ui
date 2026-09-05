import React from 'react';
import { Box, Paper, Typography, Grid } from '@mui/material';
import { Property } from '../../types/property';
import { PropertyPLReport } from '../../utils/reportUtils';
import { calculateOperationalMetrics, OperationalMetrics } from '../../utils/propertyMetricsCalculator';

interface PropertyKpiStripProps {
  property: Property;
  plReport: PropertyPLReport;
}

type TileColor = 'success' | 'error' | 'warning' | 'text.primary';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const StatTile: React.FC<{
  label: string;
  value: string;
  caption?: string;
  color: TileColor;
}> = ({ label, value, caption, color }) => {
  const accent = color === 'text.primary' ? 'divider' : `${color}.main`;

  return (
    <Paper
      sx={{
        p: 2,
        height: '100%',
        borderLeft: '3px solid',
        borderLeftColor: accent,
      }}
    >
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
        {label}
      </Typography>
      <Typography variant="h6" fontWeight="bold" color={color === 'text.primary' ? 'text.primary' : `${color}.main`}>
        {value}
      </Typography>
      {caption && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
          {caption}
        </Typography>
      )}
    </Paper>
  );
};

export const PropertyKpiStrip: React.FC<PropertyKpiStripProps> = ({ property, plReport }) => {
  const metrics: OperationalMetrics = calculateOperationalMetrics(property, plReport);
  const topExpense = metrics.topExpenseCategories[0];

  const occupancyColor: TileColor =
    metrics.occupancyRate >= 90 ? 'success' : metrics.occupancyRate >= 75 ? 'warning' : 'error';

  const tiles: Array<{ label: string; value: string; caption?: string; color: TileColor }> = [
    {
      label: 'Last Month Cashflow',
      value: formatCurrency(metrics.lastMonth.cashflow),
      color: metrics.lastMonth.cashflow >= 0 ? 'success' : 'error',
    },
    {
      label: 'Last Month Income',
      value: formatCurrency(metrics.lastMonth.income),
      color: 'text.primary',
    },
    {
      label: 'Last Month Expenses',
      value: formatCurrency(metrics.lastMonth.expenses),
      color: 'text.primary',
    },
    {
      label: 'Occupancy Rate',
      value: `${metrics.occupancyRate}%`,
      color: occupancyColor,
    },
    {
      label: 'Top Expense',
      value: topExpense ? formatCurrency(topExpense.amount) : '—',
      caption: topExpense ? topExpense.category : 'No expense data',
      color: 'text.primary',
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

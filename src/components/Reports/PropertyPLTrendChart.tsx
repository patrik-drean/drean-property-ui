import React from 'react';
import { Paper, Typography, useTheme } from '@mui/material';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import type { MonthlyPLData } from '../../utils/reportUtils';

interface PropertyPLTrendChartProps {
  months: MonthlyPLData[];
}

const formatMonthLabel = (monthKey: string) => {
  const [year, month] = monthKey.split('-');
  return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', {
    month: 'short',
    year: '2-digit',
  });
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

export const PropertyPLTrendChart: React.FC<PropertyPLTrendChartProps> = ({ months }) => {
  const theme = useTheme();

  const data = months.map(m => ({
    month: formatMonthLabel(m.month),
    income: m.totalIncome,
    expenses: m.totalExpenses,
    net: m.netIncome,
  }));

  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Typography variant="subtitle1" fontWeight="bold" mb={2}>
        {months.length}-Month Trend
      </Typography>
      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
          <CartesianGrid stroke={theme.palette.divider} vertical={false} />
          <XAxis
            dataKey="month"
            stroke={theme.palette.text.secondary}
            tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
          />
          <YAxis
            stroke={theme.palette.text.secondary}
            tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
            tickFormatter={formatCurrency}
            width={80}
          />
          <Tooltip
            formatter={(value: number) => formatCurrency(value)}
            contentStyle={{
              backgroundColor: theme.palette.background.paper,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 8,
            }}
            labelStyle={{ color: theme.palette.text.primary }}
            cursor={{ fill: theme.palette.action.hover }}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: theme.palette.text.secondary }} />
          <ReferenceLine y={0} stroke={theme.palette.divider} />
          {/* Animation is off so the chart redraws correctly when switching properties */}
          <Bar
            dataKey="income"
            name="Income"
            fill={theme.palette.success.main}
            radius={[4, 4, 0, 0]}
            isAnimationActive={false}
          />
          <Bar
            dataKey="expenses"
            name="Expenses"
            fill={theme.palette.error.main}
            radius={[4, 4, 0, 0]}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="net"
            name="Net Income"
            stroke={theme.palette.secondary.main}
            strokeWidth={2}
            dot={{ r: 3, fill: theme.palette.secondary.main }}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </Paper>
  );
};

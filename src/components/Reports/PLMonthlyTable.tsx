import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  useTheme
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { format, subMonths, startOfMonth } from 'date-fns';
import { getIncomeCategories, getExpenseCategories } from '../../utils/reportUtils';
import type { MonthlyPLData, MonthlyOccupancy } from '../../utils/reportUtils';

export interface PLAverage {
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
}

interface PLMonthlyTableProps {
  months: MonthlyPLData[];
  average: PLAverage;
  /** Renders a Units Occupied row in the summary block when provided */
  occupancy?: MonthlyOccupancy[];
  avgLabel: string;
}

export const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);

export const formatMonth = (monthKey: string) => {
  const [year, month] = monthKey.split('-');
  return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric'
  });
};

/** Last full month, e.g. if today is Oct 7 this is September */
export const getLastFullMonth = () => format(subMonths(startOfMonth(new Date()), 1), 'yyyy-MM');

export const formatOccupancy = (occupied: number, total: number) => `${occupied}/${total}`;

export const averageOccupied = (occupancy: MonthlyOccupancy[]) =>
  occupancy.length ? occupancy.reduce((sum, o) => sum + o.occupied, 0) / occupancy.length : 0;

export const PLMonthlyTable: React.FC<PLMonthlyTableProps> = ({
  months,
  average,
  occupancy,
  avgLabel
}) => {
  const theme = useTheme();
  const lastFullMonth = getLastFullMonth();
  const isLastFullMonth = (monthKey: string) => monthKey === lastFullMonth;

  // Subtle highlight for the last full month column
  const getHighlightStyle = (isHighlighted: boolean, baseColor?: string) => {
    if (!isHighlighted) return { bgcolor: baseColor || 'inherit' };
    return {
      bgcolor: alpha(theme.palette.success.main, 0.12),
      borderLeft: '3px solid',
      borderColor: 'success.main'
    };
  };

  // Keep the category column visible while scrolling months horizontally
  const stickyLabel = (bgcolor: string = theme.palette.background.paper) => ({
    position: 'sticky' as const,
    left: 0,
    zIndex: 2,
    bgcolor
  });

  const incomeCategories = getIncomeCategories({ months });
  const expenseCategories = getExpenseCategories({ months });
  const showOccupancy = !!occupancy && occupancy.length > 0;

  // Net income row is shown in the summary block and again after expenses
  const renderNetIncomeRow = (key: string) => (
    <TableRow key={key}>
      <TableCell sx={stickyLabel()}><strong>Net Income</strong></TableCell>
      {months.map(m => (
        <TableCell
          key={m.month}
          align="right"
          sx={{
            ...getHighlightStyle(isLastFullMonth(m.month)),
            color: m.netIncome >= 0 ? 'success.main' : 'error.main',
            fontWeight: 700
          }}
        >
          {formatCurrency(m.netIncome)}
        </TableCell>
      ))}
      <TableCell
        align="right"
        sx={{
          color: average.netIncome >= 0 ? 'success.main' : 'error.main',
          fontWeight: 700
        }}
      >
        {formatCurrency(average.netIncome)}
      </TableCell>
    </TableRow>
  );

  const renderCategoryRows = (
    categories: string[],
    prefix: string,
    pick: (m: MonthlyPLData) => Record<string, number>
  ) =>
    categories.map(category => (
      <TableRow key={`${prefix}-${category}`}>
        <TableCell sx={{ ...stickyLabel(), pl: 4 }}>{category}</TableCell>
        {months.map(m => (
          <TableCell
            key={m.month}
            align="right"
            sx={getHighlightStyle(isLastFullMonth(m.month))}
          >
            {formatCurrency(pick(m)[category] || 0)}
          </TableCell>
        ))}
        <TableCell align="right">
          {formatCurrency(
            months.reduce((sum, m) => sum + (pick(m)[category] || 0), 0) / months.length
          )}
        </TableCell>
      </TableRow>
    ));

  const renderTotalRow = (
    label: string,
    pick: (m: MonthlyPLData) => number,
    averageValue: number
  ) => (
    <TableRow sx={{ bgcolor: 'action.selected' }}>
      <TableCell sx={stickyLabel(theme.palette.action.selected)}><strong>{label}</strong></TableCell>
      {months.map(m => (
        <TableCell
          key={m.month}
          align="right"
          sx={{
            ...getHighlightStyle(isLastFullMonth(m.month)),
            ...(!isLastFullMonth(m.month) && { bgcolor: 'action.selected' })
          }}
        >
          <strong>{formatCurrency(pick(m))}</strong>
        </TableCell>
      ))}
      <TableCell align="right">
        <strong>{formatCurrency(averageValue)}</strong>
      </TableCell>
    </TableRow>
  );

  const renderSectionHeader = (label: string) => (
    <TableRow>
      <TableCell colSpan={months.length + 2} sx={{ bgcolor: 'action.hover' }}>
        <strong>{label}</strong>
      </TableCell>
    </TableRow>
  );

  return (
    <Paper sx={{ overflowX: 'auto' }}>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell sx={{ ...stickyLabel(), zIndex: 3 }}><strong>Category</strong></TableCell>
            {months.map(m => (
              <TableCell
                key={m.month}
                align="right"
                sx={{
                  ...(isLastFullMonth(m.month) ? {
                    bgcolor: `${theme.palette.success.dark} !important`,
                    borderLeft: '3px solid',
                    borderColor: 'success.main',
                    fontWeight: 600,
                    color: `${theme.palette.getContrastText(theme.palette.success.dark)} !important`
                  } : {
                    fontWeight: 400
                  })
                }}
              >
                <strong>{formatMonth(m.month)}</strong>
              </TableCell>
            ))}
            <TableCell align="right">
              <strong>{avgLabel}</strong>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {renderSectionHeader('SUMMARY')}
          {showOccupancy && (
            <TableRow>
              <TableCell sx={stickyLabel()}>Units Occupied</TableCell>
              {occupancy!.map(o => (
                <TableCell
                  key={o.month}
                  align="right"
                  sx={{
                    ...getHighlightStyle(isLastFullMonth(o.month)),
                    ...(o.total > 0 && o.occupied === 0 && { color: 'error.main' })
                  }}
                >
                  {formatOccupancy(o.occupied, o.total)}
                </TableCell>
              ))}
              <TableCell align="right">
                {`${averageOccupied(occupancy!).toFixed(1)}/${occupancy![0].total}`}
              </TableCell>
            </TableRow>
          )}
          {renderNetIncomeRow('summary-net-income')}

          {renderSectionHeader('INCOME')}
          {renderCategoryRows(incomeCategories, 'income', m => m.incomeByCategory)}
          {renderTotalRow('Total Income', m => m.totalIncome, average.totalIncome)}

          {renderSectionHeader('EXPENSES')}
          {renderCategoryRows(expenseCategories, 'expense', m => m.expensesByCategory)}
          {renderTotalRow('Total Expenses', m => m.totalExpenses, average.totalExpenses)}

          {renderNetIncomeRow('net-income')}
        </TableBody>
      </Table>
    </Paper>
  );
};

import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Button
} from '@mui/material';
import { Download as DownloadIcon } from '@mui/icons-material';
import { transactionApi } from '../../services/transactionApi';
import PropertyService from '../../services/PropertyService';
import {
  generatePropertyPLReport,
  getIncomeCategories,
  getExpenseCategories,
  calculateMonthlyOccupancy
} from '../../utils/reportUtils';
import type { PropertyPLReport as PLReport, MonthlyOccupancy } from '../../utils/reportUtils';
import type { Property } from '../../types/property';
import { PropertyKpiStrip } from './PropertyKpiStrip';
import { PropertyPLTrendChart } from './PropertyPLTrendChart';
import {
  PLMonthlyTable,
  formatMonth,
  formatOccupancy,
  averageOccupied
} from './PLMonthlyTable';

interface PropertyPLReportProps {
  propertyId: string;
  months?: number;
}

export const PropertyPLReport: React.FC<PropertyPLReportProps> = ({
  propertyId,
  months = 6
}) => {
  const [report, setReport] = useState<PLReport | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [occupancy, setOccupancy] = useState<MonthlyOccupancy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadReport = async () => {
      try {
        setLoading(true);

        // Fetch property details and transactions
        const [propertyData, transactions] = await Promise.all([
          PropertyService.getPropertyById(propertyId),
          transactionApi.getByProperty(propertyId)
        ]);

        // Generate report from transactions
        const plReport = generatePropertyPLReport(
          transactions,
          propertyId,
          propertyData.address,
          months
        );

        const totalUnits = propertyData.propertyUnits?.length || propertyData.units || 0;
        const monthlyOccupancy = calculateMonthlyOccupancy(
          transactions.filter(t => t.propertyId === propertyId && t.expenseType === 'Operating'),
          totalUnits,
          plReport.months.map(m => m.month)
        );

        setProperty(propertyData);
        setReport(plReport);
        setOccupancy(monthlyOccupancy);
      } catch (err) {
        console.error('Failed to load report:', err);
        setError(err instanceof Error ? err.message : 'Failed to load report');
      } finally {
        setLoading(false);
      }
    };

    loadReport();
  }, [propertyId, months]);

  const handleExportCSV = () => {
    if (!report) return;

    const rows = [];
    const avgLabel = `${months}-Mo Avg`;

    rows.push(['Category', ...report.months.map(m => formatMonth(m.month)), avgLabel]);

    // Summary section
    rows.push(['SUMMARY']);
    if (occupancy.length > 0) {
      rows.push([
        'Units Occupied',
        ...occupancy.map(o => formatOccupancy(o.occupied, o.total)),
        `${averageOccupied(occupancy).toFixed(1)}/${occupancy[0].total}`
      ]);
    }
    rows.push([
      'Net Income',
      ...report.months.map(m => m.netIncome),
      report.sixMonthAverage.netIncome
    ]);

    // Income section
    rows.push(['INCOME']);
    getIncomeCategories(report).forEach(category => {
      rows.push([
        category,
        ...report.months.map(m => m.incomeByCategory[category] || 0),
        report.months.reduce((sum, m) => sum + (m.incomeByCategory[category] || 0), 0) / report.months.length
      ]);
    });
    rows.push([
      'Total Income',
      ...report.months.map(m => m.totalIncome),
      report.sixMonthAverage.totalIncome
    ]);

    // Expense section
    rows.push(['EXPENSES']);
    getExpenseCategories(report).forEach(category => {
      rows.push([
        category,
        ...report.months.map(m => m.expensesByCategory[category] || 0),
        report.months.reduce((sum, m) => sum + (m.expensesByCategory[category] || 0), 0) / report.months.length
      ]);
    });
    rows.push([
      'Total Expenses',
      ...report.months.map(m => m.totalExpenses),
      report.sixMonthAverage.totalExpenses
    ]);

    rows.push([
      'Net Income',
      ...report.months.map(m => m.netIncome),
      report.sixMonthAverage.netIncome
    ]);

    const csvContent = rows.map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `property-pl-${report.propertyAddress.replace(/[^a-z0-9]/gi, '_')}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={4}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (!report || report.months.length === 0) {
    return (
      <Box p={4}>
        <Typography color="text.secondary">
          No transaction data available for this property.
        </Typography>
      </Box>
    );
  }

  const dateRange = `${formatMonth(report.months[0].month)} – ${formatMonth(report.months[report.months.length - 1].month)}`;

  return (
    <Box sx={{ width: '100%' }}>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight="bold">
            {report.propertyAddress}
          </Typography>
          <Typography variant="subtitle2" color="text.secondary">
            Property P&L Report · {dateRange}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={handleExportCSV}
        >
          Export CSV
        </Button>
      </Box>

      {property && (
        <PropertyKpiStrip property={property} plReport={report} occupancy={occupancy} />
      )}

      <PropertyPLTrendChart months={report.months} />

      <PLMonthlyTable
        months={report.months}
        average={report.sixMonthAverage}
        occupancy={occupancy}
        avgLabel={`${months}-Mo Avg`}
      />
    </Box>
  );
};

import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Alert,
  Chip,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Warning as WarningIcon,
  Home as HomeIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import { Property } from '../../types/property';
import { PropertyPLReport } from '../../utils/reportUtils';
import { calculateOperationalMetrics, OperationalMetrics } from '../../utils/propertyMetricsCalculator';

interface PropertyOperationalSummaryProps {
  property: Property;
  plReport: PropertyPLReport;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const MetricCard: React.FC<{
  title: string;
  value: string;
  icon: React.ReactElement;
  color: 'success' | 'error' | 'warning' | 'info';
}> = ({ title, value, icon, color }) => {
  const colorMap = {
    success: '#4caf50',
    error: '#f44336',
    warning: '#ff9800',
    info: '#2196f3',
  };

  return (
    <Card
      sx={{
        height: '100%',
        background: `linear-gradient(135deg, ${colorMap[color]}15 0%, ${colorMap[color]}05 100%)`,
        borderLeft: `4px solid ${colorMap[color]}`,
      }}
    >
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
          <Typography variant="body2" color="text.secondary">
            {title}
          </Typography>
          <Box sx={{ color: colorMap[color] }}>{icon}</Box>
        </Box>
        <Typography variant="h5" fontWeight="bold" color={colorMap[color]}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
};

export const PropertyOperationalSummary: React.FC<PropertyOperationalSummaryProps> = ({
  property,
  plReport,
}) => {
  // Calculate all metrics
  const metrics: OperationalMetrics = calculateOperationalMetrics(property, plReport);

  // Calculate rent alerts
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const neverRentedUnits = property.propertyUnits?.filter(unit => !unit.dateOfLastRent) || [];
  const overdueUnits = property.propertyUnits?.filter(unit =>
    unit.dateOfLastRent && new Date(unit.dateOfLastRent) < thirtyDaysAgo
  ) || [];

  // Determine if there are any critical alerts
  const hasCriticalAlerts =
    metrics.consecutiveMonthsWithLosses > 0 ||
    metrics.vacantUnits.length > 0 ||
    metrics.delinquentUnits.length > 0 ||
    neverRentedUnits.length > 0 ||
    overdueUnits.length > 0;

  return (
    <Box mb={4}>
      {/* Alerts */}
      {hasCriticalAlerts && (
        <Paper
          sx={{
            p: 3,
            mb: 3,
            bgcolor: 'grey.50',
            borderLeft: '4px solid',
            borderColor: 'error.main',
          }}
        >
          <Box display="flex" alignItems="center" mb={2.5}>
            <WarningIcon sx={{ color: 'error.main', mr: 1.5, fontSize: 28 }} />
            <Typography variant="h5" fontWeight="bold" color="text.primary">
              Alerts
            </Typography>
          </Box>

          <Box display="flex" flexDirection="column" gap={2}>
            {/* Consecutive Months with Losses */}
            {metrics.consecutiveMonthsWithLosses > 0 && (
              <Alert severity="error" variant="outlined" sx={{ py: 1.5 }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  {metrics.consecutiveMonthsWithLosses} consecutive month
                  {metrics.consecutiveMonthsWithLosses > 1 ? 's' : ''} with losses
                </Typography>
              </Alert>
            )}

            {/* Vacant Units */}
            {metrics.vacantUnits.length > 0 && (
              <Alert severity="warning" variant="outlined" sx={{ py: 1.5 }}>
                <Typography variant="subtitle1" fontWeight="bold" mb={1}>
                  {metrics.vacantUnits.length} Vacant Unit{metrics.vacantUnits.length > 1 ? 's' : ''}
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {metrics.vacantUnits.map((unit) => (
                    <Chip
                      key={unit.unitNumber}
                      label={
                        <Typography component="span" sx={{ fontSize: '1rem' }}>
                          Unit {unit.unitNumber}: <strong>{unit.daysVacant} days</strong> - {formatCurrency(unit.rent)}/mo
                        </Typography>
                      }
                      size="medium"
                      variant="outlined"
                      sx={{
                        py: 2,
                        px: 1.5,
                      }}
                    />
                  ))}
                </Box>
              </Alert>
            )}

            {/* Delinquent Units */}
            {metrics.delinquentUnits.length > 0 && (
              <Alert severity="error" variant="outlined" sx={{ py: 1.5 }}>
                <Typography variant="subtitle1" fontWeight="bold" mb={1}>
                  {metrics.delinquentUnits.length} Unit{metrics.delinquentUnits.length > 1 ? 's' : ''} Behind on Rent
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {metrics.delinquentUnits.map((unit) => (
                    <Chip
                      key={unit.unitNumber}
                      label={
                        <Typography component="span" sx={{ fontSize: '1rem' }}>
                          Unit {unit.unitNumber}: <strong>{unit.daysBehind} days</strong> - {formatCurrency(unit.amountOwed)} owed
                        </Typography>
                      }
                      size="medium"
                      variant="outlined"
                      sx={{
                        py: 2,
                        px: 1.5,
                      }}
                    />
                  ))}
                </Box>
              </Alert>
            )}

            {/* Units with No Rent Reported */}
            {neverRentedUnits.length > 0 && (
              <Alert severity="warning" variant="outlined" sx={{ py: 1.5 }}>
                <Typography variant="subtitle1" fontWeight="bold" mb={1}>
                  {neverRentedUnits.length} Unit{neverRentedUnits.length > 1 ? 's' : ''} with No Rent Reported
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {neverRentedUnits.map((unit, index) => (
                    <Chip
                      key={unit.id}
                      label={
                        <Typography component="span" sx={{ fontSize: '1rem' }}>
                          Unit {property.propertyUnits.indexOf(unit) + 1}: No rent transactions found
                        </Typography>
                      }
                      size="medium"
                      variant="outlined"
                      sx={{
                        py: 2,
                        px: 1.5,
                      }}
                    />
                  ))}
                </Box>
              </Alert>
            )}

            {/* Units with Overdue Rent */}
            {overdueUnits.length > 0 && (
              <Alert severity="error" variant="outlined" sx={{ py: 1.5 }}>
                <Typography variant="subtitle1" fontWeight="bold" mb={1}>
                  {overdueUnits.length} Unit{overdueUnits.length > 1 ? 's' : ''} with Overdue Rent (&gt;30 days)
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {overdueUnits.map((unit) => {
                    const lastRent = new Date(unit.dateOfLastRent!);
                    const daysAgo = Math.floor((now.getTime() - lastRent.getTime()) / (1000 * 60 * 60 * 24));
                    return (
                      <Chip
                        key={unit.id}
                        label={
                          <Typography component="span" sx={{ fontSize: '1rem' }}>
                            Unit {property.propertyUnits.indexOf(unit) + 1}: <strong>{daysAgo} days ago</strong> - {lastRent.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}
                          </Typography>
                        }
                        size="medium"
                        variant="outlined"
                        sx={{
                          py: 2,
                          px: 1.5,
                        }}
                      />
                    );
                  })}
                </Box>
              </Alert>
            )}
          </Box>
        </Paper>
      )}

      {/* Last Month Metrics */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={4}>
          <MetricCard
            title="Last Month Income"
            value={formatCurrency(metrics.lastMonth.income)}
            icon={<TrendingUpIcon />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <MetricCard
            title="Last Month Expenses"
            value={formatCurrency(metrics.lastMonth.expenses)}
            icon={<TrendingDownIcon />}
            color="error"
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <MetricCard
            title="Last Month Cashflow"
            value={formatCurrency(metrics.lastMonth.cashflow)}
            icon={<MoneyIcon />}
            color={metrics.lastMonth.cashflow >= 0 ? 'success' : 'error'}
          />
        </Grid>
      </Grid>

      {/* Performance Metrics */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle1" fontWeight="bold" mb={2}>
          Performance Metrics
        </Typography>

        <Grid container spacing={2}>
          {/* Occupancy Rate */}
          <Grid item xs={12} sm={6} md={4}>
            <Box>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5}>
                <Typography variant="body2" color="text.secondary">
                  Occupancy Rate
                </Typography>
                <HomeIcon fontSize="small" color="action" />
              </Box>
              <Typography variant="h6" fontWeight="bold" color={metrics.occupancyRate >= 90 ? 'success.main' : metrics.occupancyRate >= 75 ? 'warning.main' : 'error.main'}>
                {metrics.occupancyRate}%
              </Typography>
            </Box>
          </Grid>

          {/* Top Expenses */}
          <Grid item xs={12} md={4}>
            <Box>
              <Typography variant="body2" color="text.secondary" mb={0.5}>
                Top Expenses
              </Typography>
              {metrics.topExpenseCategories.length > 0 ? (
                <Box>
                  {metrics.topExpenseCategories.map((expense, index) => (
                    <Typography key={expense.category} variant="body2" fontSize="0.875rem">
                      {index + 1}. {expense.category}: {formatCurrency(expense.amount)}
                    </Typography>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No expense data
                </Typography>
              )}
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

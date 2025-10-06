import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AccountBalance as AccountBalanceIcon,
  AttachMoney as AttachMoneyIcon,
  ShowChart as ShowChartIcon,
} from '@mui/icons-material';
import { Property } from '../../types/property';
import { InvestmentCalculations } from '../../types/investmentReport';
import { formatCurrency, formatPercentage, getScoreColor, getMetricColor } from '../../services/investmentReportService';

interface InvestmentSummarySectionProps {
  property: Property;
  calculations: InvestmentCalculations;
}

const InvestmentSummarySection: React.FC<InvestmentSummarySectionProps> = ({
  property,
  calculations,
}) => {
  // Score Card for stacked layout
  const ScoreCard: React.FC<{ score: number; label: string; maxScore: number }> = ({
    score,
    label,
    maxScore,
  }) => {
    const color = getScoreColor(score);

    return (
      <Card elevation={2} sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        py: 1,
        bgcolor: color,
        color: '#fff',
      }}>
        <CardContent sx={{ textAlign: 'center', py: 0, '&:last-child': { pb: 0 } }}>
          <Typography variant="body2" sx={{ mb: 0.25, opacity: 0.9, fontWeight: 500, fontSize: '0.875rem' }}>
            {label}
          </Typography>
          <Typography variant="h5" fontWeight="bold">
            {Math.round(score)}/{maxScore}
          </Typography>
        </CardContent>
      </Card>
    );
  };

  const MetricCard: React.FC<{
    title: string;
    value: string;
    icon: React.ReactNode;
    color?: string;
    subtitle?: string;
  }> = ({ title, value, icon, color = '#1976D2', subtitle }) => (
    <Card elevation={1} sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" alignItems="center" mb={1}>
          <Box sx={{ color, mr: 1 }}>{icon}</Box>
          <Typography variant="body2" color="text.secondary">
            {title}
          </Typography>
        </Box>
        <Typography variant="h5" fontWeight="bold" sx={{ color }}>
          {value}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom color="primary" fontWeight="bold">
        Investment Summary
      </Typography>

      <Grid container spacing={3}>
        {/* Top Row: Investment Scores */}
        <Grid item xs={6} md={6}>
          <ScoreCard
            score={calculations.holdScore}
            label="Hold Score"
            maxScore={10}
          />
        </Grid>
        <Grid item xs={6} md={6}>
          <ScoreCard
            score={calculations.flipScore}
            label="Flip Score"
            maxScore={10}
          />
        </Grid>

        {/* Metric Cards Grid - 6 cards */}
        <Grid item xs={12}>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={4}>
              <MetricCard
                title="Rent Ratio"
                value={formatPercentage(calculations.rentRatio)}
                icon={<TrendingUpIcon />}
                color={calculations.rentRatio >= 0.01 ? '#4CAF50' : '#F44336'}
                subtitle="Monthly rent / Purchase price"
              />
            </Grid>
            <Grid item xs={6} sm={4}>
              <MetricCard
                title="Monthly Cash Flow"
                value={formatCurrency(calculations.monthlyCashflow)}
                icon={<AttachMoneyIcon />}
                color={getMetricColor(calculations.monthlyCashflow)}
                subtitle="Net monthly income"
              />
            </Grid>
            <Grid item xs={6} sm={4}>
              <MetricCard
                title="ARV Ratio"
                value={formatPercentage(calculations.arvRatio)}
                icon={<TrendingDownIcon />}
                color={calculations.arvRatio <= 0.80 ? '#4CAF50' : '#F44336'}
                subtitle="Purchase / ARV"
              />
            </Grid>
            <Grid item xs={6} sm={4}>
              <MetricCard
                title="Home Equity"
                value={formatCurrency(calculations.homeEquity)}
                icon={<AccountBalanceIcon />}
                color={getMetricColor(calculations.homeEquity)}
                subtitle="Post-refinance equity"
              />
            </Grid>
            <Grid item xs={6} sm={4}>
              <MetricCard
                title="Cash-on-Cash Return"
                value={formatPercentage(calculations.cashOnCashReturn)}
                icon={<ShowChartIcon />}
                color={calculations.cashOnCashReturn >= 0.05 ? '#4CAF50' : '#F44336'}
                subtitle={`Annual: ${formatCurrency(calculations.monthlyCashflow * 12)} / ${formatCurrency(calculations.downPaymentRequired)}`}
              />
            </Grid>
            <Grid item xs={6} sm={4}>
              <MetricCard
                title="Cap Rate"
                value={formatPercentage(calculations.monthlyCashflow * 12 / calculations.purchasePrice)}
                icon={<ShowChartIcon />}
                color={(() => {
                  const capRate = calculations.monthlyCashflow * 12 / calculations.purchasePrice;
                  if (capRate >= 0.05 && capRate <= 0.10) return '#4CAF50'; // Green: 5-10%
                  return '#FF9800'; // Orange: outside ideal range
                })()}
                subtitle="Net operating income rate"
              />
            </Grid>
          </Grid>
        </Grid>

        {/* Property Overview */}
        <Grid item xs={12}>
          <Box mt={2}>
            <Typography variant="h6" gutterBottom>
              Property Overview
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary">
                  Purchase Price
                </Typography>
                <Typography variant="h6" fontWeight="bold">
                  {formatCurrency(calculations.purchasePrice)}
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary">
                  Rehab Costs
                </Typography>
                <Typography variant="h6" fontWeight="bold">
                  {formatCurrency(calculations.rehabCosts)}
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary">
                  After Repair Value
                </Typography>
                <Typography variant="h6" fontWeight="bold">
                  {formatCurrency(calculations.arv)}
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary">
                  Potential Rent
                </Typography>
                <Typography variant="h6" fontWeight="bold">
                  {formatCurrency(calculations.monthlyIncome)}
                </Typography>
              </Grid>
            </Grid>
            {/* Disclaimer */}
            <Box mt={3}>
              <Typography variant="body2" sx={{ fontStyle: 'italic', color: '#757575', fontSize: '0.875rem', textAlign: 'center' }}>
                *These figures are estimates based on available data. Investors should conduct their own due diligence and verify all information independently before making investment decisions.*
              </Typography>
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default InvestmentSummarySection;
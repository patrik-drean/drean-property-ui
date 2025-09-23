import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  LinearProgress,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AccountBalance as AccountBalanceIcon,
  AttachMoney as AttachMoneyIcon,
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
  const ScoreGauge: React.FC<{ score: number; label: string; maxScore: number }> = ({
    score,
    label,
    maxScore,
  }) => {
    const percentage = (score / maxScore) * 100;
    const color = getScoreColor(score);

    return (
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="body2" color="text.secondary">
            {label}
          </Typography>
          <Typography variant="h6" fontWeight="bold" sx={{ color }}>
            {score}/{maxScore}
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={percentage}
          sx={{
            height: 8,
            borderRadius: 4,
            bgcolor: 'grey.200',
            '& .MuiLinearProgress-bar': {
              bgcolor: color,
              borderRadius: 4,
            },
          }}
        />
      </Box>
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
        {/* Investment Scores */}
        <Grid item xs={12} md={6}>
          <Paper elevation={1} sx={{ p: 2, bgcolor: '#f8f9fa' }}>
            <Typography variant="h6" gutterBottom>
              Investment Scores
            </Typography>
            <Box mb={3}>
              <ScoreGauge
                score={calculations.holdScore}
                label="Hold Score"
                maxScore={10}
              />
            </Box>
            <Box>
              <ScoreGauge
                score={calculations.flipScore}
                label="Flip Score"
                maxScore={10}
              />
            </Box>
          </Paper>
        </Grid>

        {/* Key Metrics */}
        <Grid item xs={12} md={6}>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <MetricCard
                title="Rent Ratio"
                value={formatPercentage(calculations.rentRatio)}
                icon={<TrendingUpIcon />}
                color={calculations.rentRatio >= 0.01 ? '#4CAF50' : '#F44336'}
                subtitle="Monthly rent / Purchase price"
              />
            </Grid>
            <Grid item xs={6}>
              <MetricCard
                title="ARV Ratio"
                value={formatPercentage(calculations.arvRatio)}
                icon={<TrendingDownIcon />}
                color={calculations.arvRatio <= 0.80 ? '#4CAF50' : '#F44336'}
                subtitle="Purchase / ARV"
              />
            </Grid>
            <Grid item xs={6}>
              <MetricCard
                title="Home Equity"
                value={formatCurrency(calculations.homeEquity)}
                icon={<AccountBalanceIcon />}
                color={getMetricColor(calculations.homeEquity)}
                subtitle="Post-refinance equity"
              />
            </Grid>
            <Grid item xs={6}>
              <MetricCard
                title="Monthly Cash Flow"
                value={formatCurrency(calculations.monthlyCashflow)}
                icon={<AttachMoneyIcon />}
                color={getMetricColor(calculations.monthlyCashflow)}
                subtitle="Net monthly income"
              />
            </Grid>
          </Grid>
        </Grid>

        {/* Property Details */}
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
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default InvestmentSummarySection;
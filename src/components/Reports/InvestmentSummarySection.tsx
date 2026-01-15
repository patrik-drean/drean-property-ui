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
          </Grid>
        </Grid>

        {/* Value Breakdown */}
        <Grid item xs={12}>
          <Box mt={3} mb={3}>
            <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
              Value Breakdown
            </Typography>
            <Grid container spacing={4} justifyContent="center">
              {/* Rent Ratio Calculation */}
              <Grid item xs={12} sm={6}>
                <Card sx={{ p: 3, textAlign: 'center', bgcolor: '#f8f9fa' }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mb: 2 }}>
                    Rent Ratio
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                    {/* Numerator */}
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                        Monthly Rent
                      </Typography>
                      <Typography variant="h6" fontWeight="bold">
                        {formatCurrency(calculations.monthlyIncome)}
                      </Typography>
                    </Box>
                    {/* Division line */}
                    <Box sx={{ width: '80%', height: '2px', bgcolor: 'divider', my: 1 }} />
                    {/* Denominator */}
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                        Purchase Price
                      </Typography>
                      <Typography variant="h6" fontWeight="bold">
                        {formatCurrency(calculations.purchasePrice)}
                      </Typography>
                      <Typography variant="body2" sx={{ my: 0.5 }}>+</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                        Rehab Costs
                      </Typography>
                      <Typography variant="h6" fontWeight="bold">
                        {formatCurrency(calculations.rehabCosts)}
                      </Typography>
                    </Box>
                    {/* Result */}
                    <Box sx={{
                      mt: 2,
                      py: 1.5,
                      px: 2,
                      width: '100%',
                      bgcolor: calculations.rentRatio >= 0.01 ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
                      borderRadius: 1
                    }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                        Result
                      </Typography>
                      <Typography variant="h5" fontWeight="bold" color={calculations.rentRatio >= 0.01 ? '#4CAF50' : '#F44336'}>
                        {formatPercentage(calculations.rentRatio)}
                      </Typography>
                    </Box>
                  </Box>
                </Card>
              </Grid>

              {/* ARV Ratio Calculation */}
              <Grid item xs={12} sm={6}>
                <Card sx={{ p: 3, textAlign: 'center', bgcolor: '#f8f9fa' }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mb: 2 }}>
                    ARV Ratio
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                    {/* Numerator */}
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                        Purchase Price
                      </Typography>
                      <Typography variant="h6" fontWeight="bold">
                        {formatCurrency(calculations.purchasePrice)}
                      </Typography>
                      <Typography variant="body2" sx={{ my: 0.5 }}>+</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                        Rehab Costs
                      </Typography>
                      <Typography variant="h6" fontWeight="bold">
                        {formatCurrency(calculations.rehabCosts)}
                      </Typography>
                    </Box>
                    {/* Division line */}
                    <Box sx={{ width: '80%', height: '2px', bgcolor: 'divider', my: 1 }} />
                    {/* Denominator */}
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                        After Repair Value (ARV)
                      </Typography>
                      <Typography variant="h6" fontWeight="bold">
                        {formatCurrency(calculations.arv)}
                      </Typography>
                    </Box>
                    {/* Result */}
                    <Box sx={{
                      mt: 2,
                      py: 1.5,
                      px: 2,
                      width: '100%',
                      bgcolor: calculations.arvRatio <= 0.80 ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
                      borderRadius: 1
                    }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                        Result
                      </Typography>
                      <Typography variant="h5" fontWeight="bold" color={calculations.arvRatio <= 0.80 ? '#4CAF50' : '#F44336'}>
                        {formatPercentage(calculations.arvRatio)}
                      </Typography>
                    </Box>
                  </Box>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default InvestmentSummarySection;
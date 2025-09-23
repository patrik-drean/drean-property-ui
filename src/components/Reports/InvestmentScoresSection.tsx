import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Divider,
} from '@mui/material';
import {
  ShowChart as ShowChartIcon,
  TrendingUp as TrendingUpIcon,
  Home as HomeIcon,
  AttachMoney as AttachMoneyIcon,
} from '@mui/icons-material';
import { Property } from '../../types/property';
import { InvestmentCalculations } from '../../types/investmentReport';
import { formatCurrency, formatPercentage, getScoreColor } from '../../services/investmentReportService';

interface InvestmentScoresSectionProps {
  property: Property;
  calculations: InvestmentCalculations;
}

const InvestmentScoresSection: React.FC<InvestmentScoresSectionProps> = ({
  property,
  calculations,
}) => {
  const ScoreBreakdownCard: React.FC<{
    title: string;
    totalScore: number;
    maxScore: number;
    icon: React.ReactNode;
    children: React.ReactNode;
  }> = ({ title, totalScore, maxScore, icon, children }) => {
    const color = getScoreColor(totalScore);
    const percentage = (totalScore / maxScore) * 100;

    return (
      <Card elevation={1} sx={{ height: '100%' }}>
        <CardContent>
          <Box display="flex" alignItems="center" mb={2}>
            <Box sx={{ color, mr: 1 }}>{icon}</Box>
            <Typography variant="h6" fontWeight="bold">
              {title}
            </Typography>
          </Box>

          {/* Total Score Display */}
          <Box mb={3}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="body2" color="text.secondary">
                Total Score
              </Typography>
              <Typography variant="h5" fontWeight="bold" sx={{ color }}>
                {totalScore}/{maxScore}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={percentage}
              sx={{
                height: 10,
                borderRadius: 5,
                bgcolor: 'grey.200',
                '& .MuiLinearProgress-bar': {
                  bgcolor: color,
                  borderRadius: 5,
                },
              }}
            />
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Score Breakdown */}
          {children}
        </CardContent>
      </Card>
    );
  };

  const ScoreComponent: React.FC<{
    label: string;
    score: number;
    maxScore: number;
    detail: string;
  }> = ({ label, score, maxScore, detail }) => {
    const percentage = (score / maxScore) * 100;
    const color = getScoreColor(score);

    return (
      <Box mb={2}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
          <Typography variant="body2" fontWeight="medium">
            {label}
          </Typography>
          <Typography variant="body2" fontWeight="bold" sx={{ color }}>
            {score}/{maxScore}
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={percentage}
          sx={{
            height: 6,
            borderRadius: 3,
            bgcolor: 'grey.200',
            mb: 0.5,
            '& .MuiLinearProgress-bar': {
              bgcolor: color,
              borderRadius: 3,
            },
          }}
        />
        <Typography variant="caption" color="text.secondary">
          {detail}
        </Typography>
      </Box>
    );
  };

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom color="primary" fontWeight="bold">
        Investment Scores Analysis
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Detailed breakdown of hold and flip investment scores with key metrics
      </Typography>

      <Grid container spacing={3}>
        {/* Hold Score Breakdown */}
        <Grid item xs={12} lg={6}>
          <ScoreBreakdownCard
            title="Hold Score Analysis"
            totalScore={calculations.holdScore}
            maxScore={10}
            icon={<TrendingUpIcon />}
          >
            <ScoreComponent
              label="Cash Flow Score"
              score={calculations.holdScoreBreakdown.cashflowScore}
              maxScore={8}
              detail={`${formatCurrency(calculations.holdScoreBreakdown.cashflowPerUnit)} per unit monthly`}
            />
            <ScoreComponent
              label="Rent Ratio Score"
              score={calculations.holdScoreBreakdown.rentRatioScore}
              maxScore={2}
              detail={`${formatPercentage(calculations.holdScoreBreakdown.rentRatioPercentage)} rent ratio`}
            />

            <Box mt={2} p={2} bgcolor="grey.50" borderRadius={1}>
              <Typography variant="body2" fontWeight="medium" mb={1}>
                Perfect Hold Score (10/10)
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Would require rent of {formatCurrency(calculations.perfectRentForHoldScore)} per month
              </Typography>
            </Box>
          </ScoreBreakdownCard>
        </Grid>

        {/* Flip Score Breakdown */}
        <Grid item xs={12} lg={6}>
          <ScoreBreakdownCard
            title="Flip Score Analysis"
            totalScore={calculations.flipScore}
            maxScore={10}
            icon={<ShowChartIcon />}
          >
            <ScoreComponent
              label="ARV Ratio Score"
              score={calculations.flipScoreBreakdown.arvRatioScore}
              maxScore={8}
              detail={`${formatPercentage(calculations.flipScoreBreakdown.arvRatioPercentage)} purchase to ARV ratio`}
            />
            <ScoreComponent
              label="Home Equity Score"
              score={calculations.flipScoreBreakdown.equityScore}
              maxScore={2}
              detail={`${formatCurrency(calculations.flipScoreBreakdown.equityAmount)} equity amount`}
            />

            <Box mt={2} p={2} bgcolor="grey.50" borderRadius={1}>
              <Typography variant="body2" fontWeight="medium" mb={1}>
                Perfect Flip Score (10/10)
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Would require ARV of {formatCurrency(calculations.perfectARVForFlipScore)}
              </Typography>
            </Box>
          </ScoreBreakdownCard>
        </Grid>

        {/* Score Interpretation */}
        <Grid item xs={12}>
          <Paper elevation={1} sx={{ p: 2, bgcolor: '#f8f9fa' }}>
            <Typography variant="h6" gutterBottom>
              Score Interpretation Guide
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" fontWeight="medium" mb={1}>
                  Hold Score (1-10):
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={1}>
                  • <strong>9-10:</strong> Excellent cash flow investment
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={1}>
                  • <strong>7-8:</strong> Good rental property opportunity
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={1}>
                  • <strong>5-6:</strong> Marginal rental investment
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • <strong>1-4:</strong> Poor rental performance expected
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" fontWeight="medium" mb={1}>
                  Flip Score (1-10):
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={1}>
                  • <strong>9-10:</strong> Excellent flip opportunity
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={1}>
                  • <strong>7-8:</strong> Good profit potential
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={1}>
                  • <strong>5-6:</strong> Moderate flip opportunity
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • <strong>1-4:</strong> High risk or low profit
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default InvestmentScoresSection;
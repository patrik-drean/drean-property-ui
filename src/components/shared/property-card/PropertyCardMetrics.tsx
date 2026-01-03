import React from 'react';
import { Box, Typography, Grid, Chip, Tooltip, useTheme } from '@mui/material';
import { Property } from '../../../types/property';
import {
  calculateRentRatio,
  calculateARVRatio,
  calculateHoldScore,
  calculateFlipScore,
  calculateCashflow,
  calculateHomeEquity,
  calculateNewLoan,
} from '../../../utils/scoreCalculator';

interface PropertyCardMetricsProps {
  property: Property;
  formatCurrency: (amount: number) => string;
  formatPercentage: (value: number) => string;
  getRentRatioColor: (value: number) => string;
  getARVRatioColor: (value: number) => string;
  isMobile?: boolean;
  variant?: 'default' | 'compact';
}

export const PropertyCardMetrics: React.FC<PropertyCardMetricsProps> = ({
  property,
  formatCurrency,
  formatPercentage,
  getRentRatioColor,
  getARVRatioColor,
  isMobile = false,
  variant = 'default',
}) => {
  const theme = useTheme();

  const rentRatio = calculateRentRatio(property.potentialRent, property.offerPrice, property.rehabCosts);
  const arvRatio = calculateARVRatio(property.offerPrice, property.rehabCosts, property.arv);
  const holdScore = calculateHoldScore(property);
  const flipScore = calculateFlipScore(property);
  const monthlyCashflow = calculateCashflow(
    property.potentialRent,
    property.offerPrice,
    calculateNewLoan(property.offerPrice, property.rehabCosts, property.arv)
  );
  const equity = calculateHomeEquity(property.offerPrice, property.rehabCosts, property.arv);

  if (variant === 'compact') {
    return (
      <Grid container spacing={1}>
        <Grid item xs={3}>
          <Box sx={{ textAlign: 'center', p: 0.5, backgroundColor: theme.palette.action.hover, borderRadius: 0.5 }}>
            <Typography variant="caption" sx={{ display: 'block', color: theme.palette.text.secondary, fontSize: '0.7rem' }}>
              Rent %
            </Typography>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 700,
                color: getRentRatioColor(rentRatio),
                fontSize: '0.8rem',
              }}
            >
              {formatPercentage(rentRatio)}
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={3}>
          <Box sx={{ textAlign: 'center', p: 0.5, backgroundColor: theme.palette.action.hover, borderRadius: 0.5 }}>
            <Typography variant="caption" sx={{ display: 'block', color: theme.palette.text.secondary, fontSize: '0.7rem' }}>
              ARV %
            </Typography>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 700,
                color: getARVRatioColor(arvRatio),
                fontSize: '0.8rem',
              }}
            >
              {formatPercentage(arvRatio)}
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={3}>
          <Box sx={{ textAlign: 'center', p: 0.5, backgroundColor: theme.palette.action.hover, borderRadius: 0.5 }}>
            <Typography variant="caption" sx={{ display: 'block', color: theme.palette.text.secondary, fontSize: '0.7rem' }}>
              Hold
            </Typography>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 700,
                color: holdScore >= 7 ? theme.palette.success.main :
                  holdScore >= 5 ? theme.palette.warning.main : theme.palette.error.main,
                fontSize: '0.8rem',
              }}
            >
              {holdScore.toFixed(1)}
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={3}>
          <Box sx={{ textAlign: 'center', p: 0.5, backgroundColor: theme.palette.action.hover, borderRadius: 0.5 }}>
            <Typography variant="caption" sx={{ display: 'block', color: theme.palette.text.secondary, fontSize: '0.7rem' }}>
              Flip
            </Typography>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 700,
                color: flipScore >= 7 ? theme.palette.success.main :
                  flipScore >= 5 ? theme.palette.warning.main : theme.palette.error.main,
                fontSize: '0.8rem',
              }}
            >
              {flipScore.toFixed(1)}
            </Typography>
          </Box>
        </Grid>
      </Grid>
    );
  }

  // Default variant
  return (
    <>
      {/* Key Financial Metrics Section */}
      <Box sx={{ mb: 2 }}>
        <Grid container spacing={1}>
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center', p: 1, backgroundColor: theme.palette.action.hover, borderRadius: 1 }}>
              <Typography variant="caption" sx={{ display: 'block', color: theme.palette.text.secondary }}>
                Cashflow
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  color: monthlyCashflow > 0 ? theme.palette.success.main : theme.palette.error.main,
                  fontSize: isMobile ? '1rem' : '1.1rem',
                }}
              >
                {formatCurrency(monthlyCashflow)}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center', p: 1, backgroundColor: theme.palette.action.hover, borderRadius: 1 }}>
              <Typography variant="caption" sx={{ display: 'block', color: theme.palette.text.secondary }}>
                Rent Ratio
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  color: getRentRatioColor(rentRatio),
                  fontSize: isMobile ? '1rem' : '1.1rem',
                }}
              >
                {formatPercentage(rentRatio)}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center', p: 1, backgroundColor: theme.palette.action.hover, borderRadius: 1 }}>
              <Typography variant="caption" sx={{ display: 'block', color: theme.palette.text.secondary }}>
                ARV Ratio
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  color: getARVRatioColor(arvRatio),
                  fontSize: isMobile ? '1rem' : '1.1rem',
                }}
              >
                {formatPercentage(arvRatio)}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center', p: 1, backgroundColor: theme.palette.action.hover, borderRadius: 1 }}>
              <Typography variant="caption" sx={{ display: 'block', color: theme.palette.text.secondary }}>
                Equity
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  color: equity > 0 ? theme.palette.success.main : theme.palette.error.main,
                  fontSize: isMobile ? '1rem' : '1.1rem',
                }}
              >
                {formatCurrency(equity)}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* Scores Section */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: theme.palette.text.secondary }}>
          Investment Scores
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Tooltip
            title={
              <>
                <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>Hold Score Breakdown:</Typography>
                <Typography variant="body2">Rent Ratio: {formatPercentage(rentRatio)}</Typography>
                <Typography variant="body2">ARV Ratio: {formatPercentage(arvRatio)}</Typography>
                <Typography variant="body2">Total Score: {holdScore.toFixed(1)}/10</Typography>
              </>
            }
            arrow
          >
            <Chip
              label={`Hold: ${holdScore.toFixed(1)}`}
              sx={{
                backgroundColor: holdScore >= 7 ? theme.palette.success.main :
                  holdScore >= 5 ? theme.palette.warning.main : theme.palette.error.main,
                color: 'white',
                fontWeight: 600,
                fontSize: '0.875rem',
              }}
            />
          </Tooltip>
          <Tooltip
            title={
              <>
                <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>Flip Score Breakdown:</Typography>
                <Typography variant="body2">ARV Ratio: {formatPercentage(arvRatio)}</Typography>
                <Typography variant="body2">Total Score: {flipScore.toFixed(1)}/10</Typography>
              </>
            }
            arrow
          >
            <Chip
              label={`Flip: ${flipScore.toFixed(1)}`}
              sx={{
                backgroundColor: flipScore >= 7 ? theme.palette.success.main :
                  flipScore >= 5 ? theme.palette.warning.main : theme.palette.error.main,
                color: 'white',
                fontWeight: 600,
                fontSize: '0.875rem',
              }}
            />
          </Tooltip>
        </Box>
      </Box>
    </>
  );
};

export default PropertyCardMetrics;

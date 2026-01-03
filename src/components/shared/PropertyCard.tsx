import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  Tooltip,
  Grid,
  Divider,
  useTheme,
  useMediaQuery,
  Collapse,
} from '@mui/material';
import * as Icons from '@mui/icons-material';
import { Property } from '../../types/property';
import { getStatusColor } from '../../utils/statusColors';
import { PropertyCardMetrics } from './property-card/PropertyCardMetrics';
import { PropertyCardActions } from './property-card/PropertyCardActions';

interface PropertyCardProps {
  property: Property;
  onEdit?: (property: Property) => void;
  onViewDetails?: (property: Property) => void;
  onArchive?: (propertyId: string) => void;
  formatCurrency: (amount: number) => string;
  formatPercentage: (value: number) => string;
  getRentRatioColor: (value: number) => string;
  getARVRatioColor: (value: number) => string;
  showActions?: boolean;
  variant?: 'default' | 'compact' | 'detailed' | 'opportunity' | 'portfolio';
}

const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  onEdit,
  onViewDetails,
  onArchive,
  formatCurrency,
  formatPercentage,
  getRentRatioColor,
  getARVRatioColor,
  showActions = true,
  variant = 'default',
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [detailsExpanded, setDetailsExpanded] = useState(false);

  // Function to truncate address for mobile
  const truncateAddress = (address: string) => {
    if (!isMobile) return address;

    // Split address by comma and take only the first part (street address)
    const parts = address.split(',');
    return parts[0].trim();
  };

  // Status chip component
  const StatusChip = ({ status }: { status: string }) => (
    <Chip
      label={status}
      size="small"
      sx={{
        backgroundColor: getStatusColor(status as any),
        color: 'white',
        fontWeight: 500,
        fontSize: '0.75rem',
      }}
    />
  );

  // Helper functions for card styling
  const getCardBackgroundColor = () => {
    // Always use white background for clean look
    return theme.palette.background.paper;
  };

  const getCardBorderColor = () => {
    // Use the actual status color for the border
    return getStatusColor(property.status);
  };

  // Helper functions for unit counting (for portfolio variant)
  const getOperationalUnitsCount = (): number => {
    if (!property.propertyUnits || property.propertyUnits.length === 0) {
      return 0;
    }
    return property.propertyUnits.filter(unit => unit.status === 'Operational').length;
  };

  const getBehindRentUnitsCount = (): number => {
    if (!property.propertyUnits || property.propertyUnits.length === 0) {
      return 0;
    }
    return property.propertyUnits.filter(unit => unit.status === 'Behind On Rent').length;
  };

  const getVacantUnitsCount = (): number => {
    if (!property.propertyUnits || property.propertyUnits.length === 0) {
      return 0;
    }
    return property.propertyUnits.filter(unit => unit.status === 'Vacant').length;
  };

  // Calculate financials for portfolio variant
  const calculateMonthlyRent = (): number => {
    if (property.propertyUnits && property.propertyUnits.length > 0) {
      return property.propertyUnits.reduce((sum, unit) => sum + unit.rent, 0);
    }
    return property.actualRent || property.potentialRent || 0;
  };

  const calculateTotalExpenses = (): number => {
    if (!property.monthlyExpenses) return 0;
    const expenses = property.monthlyExpenses;
    return (
      expenses.mortgage +
      expenses.taxes +
      expenses.insurance +
      expenses.propertyManagement +
      expenses.utilities +
      expenses.vacancy +
      expenses.capEx +
      expenses.other
    );
  };

  const getCashflowColor = (cashflow: number): string => {
    if (cashflow > 0) return theme.palette.success.main;
    if (cashflow < 0) return theme.palette.error.main;
    return theme.palette.text.primary;
  };

  // Portfolio variant - matches desktop table structure
  if (variant === 'portfolio') {
    const rent = calculateMonthlyRent();
    const totalExpenses = calculateTotalExpenses();
    const cashflow = rent - totalExpenses;

    return (
      <Card
        sx={{
          mb: 2,
          borderRadius: 2,
          boxShadow: theme.shadows[2],
          backgroundColor: getCardBackgroundColor(),
          borderLeft: `4px solid ${getCardBorderColor()}`,
          '&:hover': {
            boxShadow: theme.shadows[4],
            transform: 'translateY(-2px)',
            transition: 'all 0.2s ease-in-out',
          },
        }}
      >
        <CardContent sx={{ p: 2 }}>
          {/* Header Section - Address + Status + Actions */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                {property.zillowLink && (
                  <Tooltip title="Open Zillow" arrow>
                    <IconButton
                      size="small"
                      onClick={() => window.open(property.zillowLink, '_blank')}
                      sx={{ p: 0.5 }}
                    >
                      <Icons.OpenInNew fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    fontSize: isMobile ? '1rem' : '1.1rem',
                    lineHeight: 1.2,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {truncateAddress(property.address)}
                </Typography>
              </Box>
              <StatusChip status={property.status} />
            </Box>

            {/* Action Buttons */}
            {showActions && (
              <PropertyCardActions
                property={property}
                onEdit={onEdit}
                onViewDetails={onViewDetails}
                variant="portfolio"
              />
            )}
          </Box>

          {/* Financial Metrics Section */}
          <Box sx={{ mb: 2 }}>
            <Grid container spacing={2}>
              {/* Monthly Rent */}
              <Grid item xs={6}>
                <Box sx={{ textAlign: 'center', p: 1.5, backgroundColor: theme.palette.action.hover, borderRadius: 1 }}>
                  <Typography variant="caption" sx={{ display: 'block', color: theme.palette.text.secondary, mb: 0.5 }}>
                    Monthly Rent
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {formatCurrency(rent)}
                  </Typography>
                </Box>
              </Grid>

              {/* Total Expenses */}
              <Grid item xs={6}>
                <Box sx={{ textAlign: 'center', p: 1.5, backgroundColor: theme.palette.action.hover, borderRadius: 1 }}>
                  <Typography variant="caption" sx={{ display: 'block', color: theme.palette.text.secondary, mb: 0.5 }}>
                    Total Expenses
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {formatCurrency(totalExpenses)}
                  </Typography>
                </Box>
              </Grid>

              {/* Net Cash Flow - Full Width */}
              <Grid item xs={12}>
                <Box sx={{ textAlign: 'center', p: 2, backgroundColor: theme.palette.action.hover, borderRadius: 1 }}>
                  <Typography variant="caption" sx={{ display: 'block', color: theme.palette.text.secondary, mb: 0.5 }}>
                    Net Cash Flow
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 700,
                      color: getCashflowColor(cashflow),
                    }}
                  >
                    {formatCurrency(cashflow)}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>

          {/* Unit Breakdown Section */}
          <Divider sx={{ mb: 2 }} />
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: theme.palette.text.secondary }}>
              Unit Breakdown
            </Typography>
            <Grid container spacing={1}>
              <Grid item xs={4}>
                <Box sx={{ textAlign: 'center', p: 1, backgroundColor: theme.palette.action.hover, borderRadius: 1 }}>
                  <Typography variant="caption" sx={{ display: 'block', color: theme.palette.text.secondary, fontSize: '0.7rem' }}>
                    Operational
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.success.main }}>
                    {getOperationalUnitsCount()}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box sx={{ textAlign: 'center', p: 1, backgroundColor: theme.palette.action.hover, borderRadius: 1 }}>
                  <Typography variant="caption" sx={{ display: 'block', color: theme.palette.text.secondary, fontSize: '0.7rem' }}>
                    Behind Rent
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      color: getBehindRentUnitsCount() > 0 ? theme.palette.warning.main : theme.palette.text.primary
                    }}
                  >
                    {getBehindRentUnitsCount()}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box sx={{ textAlign: 'center', p: 1, backgroundColor: theme.palette.action.hover, borderRadius: 1 }}>
                  <Typography variant="caption" sx={{ display: 'block', color: theme.palette.text.secondary, fontSize: '0.7rem' }}>
                    Vacant
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      color: getVacantUnitsCount() > 0 ? theme.palette.error.main : theme.palette.text.primary
                    }}
                  >
                    {getVacantUnitsCount()}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>
    );
  }

  // Compact variant for smaller spaces
  if (variant === 'compact') {
    return (
      <Card
        sx={{
          mb: 1,
          borderRadius: 1,
          boxShadow: theme.shadows[1],
          backgroundColor: getCardBackgroundColor(),
          borderLeft: `3px solid ${getCardBorderColor()}`,
          '&:hover': {
            boxShadow: theme.shadows[2],
            transform: 'translateY(-1px)',
            transition: 'all 0.2s ease-in-out',
          },
        }}
      >
        <CardContent sx={{ p: 1.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  mb: 0.5,
                }}
              >
                {property.address}
              </Typography>
              <StatusChip status={property.status} />
            </Box>

            {showActions && (
              <PropertyCardActions
                property={property}
                onEdit={onEdit}
                onViewDetails={onViewDetails}
                variant="compact"
              />
            )}
          </Box>

          {/* Key metrics in compact layout */}
          <PropertyCardMetrics
            property={property}
            formatCurrency={formatCurrency}
            formatPercentage={formatPercentage}
            getRentRatioColor={getRentRatioColor}
            getARVRatioColor={getARVRatioColor}
            variant="compact"
          />
        </CardContent>
      </Card>
    );
  }

  // Default variant - full featured card

  return (
    <Card
      sx={{
        mb: 2,
        borderRadius: 2,
        boxShadow: theme.shadows[2],
        mx: 'auto',
        maxWidth: '100%',
        backgroundColor: getCardBackgroundColor(),
        borderLeft: `4px solid ${getCardBorderColor()}`,
        '&:hover': {
          boxShadow: theme.shadows[4],
          transform: 'translateY(-2px)',
          transition: 'all 0.2s ease-in-out',
        },
      }}
    >
      <CardContent sx={{ p: 2 }}>
        {/* Header Section - Address + Status + Actions */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              {property.zillowLink && (
                <Tooltip title="Open Zillow" arrow>
                  <IconButton
                    size="small"
                    onClick={() => window.open(property.zillowLink, '_blank')}
                    sx={{ p: 0.5 }}
                  >
                    <Icons.OpenInNew fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
                     <Typography
                       variant="h6"
                       sx={{
                         fontWeight: 600,
                         fontSize: isMobile ? '1rem' : '1.1rem',
                         lineHeight: 1.2,
                         overflow: 'hidden',
                         textOverflow: 'ellipsis',
                         whiteSpace: 'nowrap',
                       }}
                     >
                       {truncateAddress(property.address)}
                     </Typography>
            </Box>
            <StatusChip status={property.status} />
          </Box>
          
          {/* Action Buttons */}
          {showActions && (
            <PropertyCardActions
              property={property}
              onEdit={onEdit}
              onViewDetails={onViewDetails}
              onArchive={onArchive}
              variant="default"
            />
          )}
        </Box>

        {/* Key Financial Metrics and Scores Section */}
        <PropertyCardMetrics
          property={property}
          formatCurrency={formatCurrency}
          formatPercentage={formatPercentage}
          getRentRatioColor={getRentRatioColor}
          getARVRatioColor={getARVRatioColor}
          isMobile={isMobile}
          variant="default"
        />

        {/* Property Details & Notes Section - Combined Collapsible */}
        <Divider sx={{ my: 1 }} />
        <Box>
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              cursor: 'pointer',
              py: 0.5,
              '&:hover': {
                backgroundColor: theme.palette.action.hover,
                borderRadius: 1,
              }
            }}
            onClick={() => setDetailsExpanded(!detailsExpanded)}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: theme.palette.text.secondary }}>
              Details
            </Typography>
            <IconButton size="small" sx={{ p: 0.5 }}>
              {detailsExpanded ? <Icons.ExpandLess /> : <Icons.ExpandMore />}
            </IconButton>
          </Box>
          
          <Collapse in={detailsExpanded}>
            <Box sx={{ mt: 1 }}>
              {/* Property Details */}
              <Grid container spacing={1}>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" sx={{ display: 'block', color: theme.palette.text.secondary }}>
                    Units
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {property.units || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" sx={{ display: 'block', color: theme.palette.text.secondary }}>
                    Sq Ft
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {property.squareFootage ? property.squareFootage.toLocaleString() : 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" sx={{ display: 'block', color: theme.palette.text.secondary }}>
                    Offer
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {formatCurrency(property.offerPrice)}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" sx={{ display: 'block', color: theme.palette.text.secondary }}>
                    Rehab
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {formatCurrency(property.rehabCosts)}
                  </Typography>
                </Grid>
              </Grid>
              
              {/* Additional details row */}
              <Grid container spacing={1} sx={{ mt: 1 }}>
                <Grid item xs={6} sm={6}>
                  <Typography variant="caption" sx={{ display: 'block', color: theme.palette.text.secondary }}>
                    Potential Rent
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {formatCurrency(property.potentialRent)}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={6}>
                  <Typography variant="caption" sx={{ display: 'block', color: theme.palette.text.secondary }}>
                    ARV
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {formatCurrency(property.arv)}
                  </Typography>
                </Grid>
              </Grid>

              {/* Notes Section (if available) */}
              {property.notes && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Box>
                    <Typography variant="caption" sx={{ display: 'block', color: theme.palette.text.secondary, mb: 0.5 }}>
                      Notes
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontStyle: 'italic',
                        color: theme.palette.text.secondary,
                      }}
                    >
                      {property.notes}
                    </Typography>
                  </Box>
                </>
              )}
            </Box>
          </Collapse>
        </Box>
      </CardContent>
    </Card>
  );
};

export default PropertyCard;

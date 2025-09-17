import React from 'react';
import { Box, Grid, Typography, useTheme, useMediaQuery } from '@mui/material';
import { Property } from '../../types/property';
import PropertyCard from './PropertyCard';
import useResponsiveLayout from '../../hooks/useResponsiveLayout';

interface PropertyCardGridProps {
  properties: Property[];
  title?: string;
  subtitle?: string;
  onEdit?: (property: Property) => void;
  onViewDetails?: (property: Property) => void;
  onArchive?: (propertyId: string) => void;
  formatCurrency: (amount: number) => string;
  formatPercentage: (value: number) => string;
  getRentRatioColor: (value: number) => string;
  getARVRatioColor: (value: number) => string;
  showActions?: boolean;
  variant?: 'default' | 'compact';
  filterFunction?: (property: Property) => boolean;
  emptyMessage?: string;
}

const PropertyCardGrid: React.FC<PropertyCardGridProps> = ({
  properties,
  title,
  subtitle,
  onEdit,
  onViewDetails,
  onArchive,
  formatCurrency,
  formatPercentage,
  getRentRatioColor,
  getARVRatioColor,
  showActions = true,
  variant = 'default',
  filterFunction,
  emptyMessage = 'No properties found',
}) => {
  const theme = useTheme();
  const { useCardLayout, getGridColumns, getCardSpacing } = useResponsiveLayout();
  
  // Filter properties if filter function provided
  const filteredProperties = filterFunction 
    ? properties.filter(filterFunction)
    : properties;

  // Don't render if we're not using card layout
  if (!useCardLayout) {
    return null;
  }

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header */}
      {(title || subtitle) && (
        <Box sx={{ mb: 2 }}>
          {title && (
            <Typography variant="h5" sx={{ fontWeight: 600, mb: subtitle ? 0.5 : 0 }}>
              {title}
            </Typography>
          )}
          {subtitle && (
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
              {subtitle}
            </Typography>
          )}
        </Box>
      )}

      {/* Cards Grid */}
      {filteredProperties.length > 0 ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: getCardSpacing() }}>
          {filteredProperties.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              onEdit={onEdit}
              onViewDetails={onViewDetails}
              onArchive={onArchive}
              formatCurrency={formatCurrency}
              formatPercentage={formatPercentage}
              getRentRatioColor={getRentRatioColor}
              getARVRatioColor={getARVRatioColor}
              showActions={showActions}
              variant={variant}
            />
          ))}
        </Box>
      ) : (
        <Box 
          sx={{ 
            textAlign: 'center', 
            py: 4,
            color: theme.palette.text.secondary,
          }}
        >
          <Typography variant="body1">{emptyMessage}</Typography>
        </Box>
      )}
    </Box>
  );
};

export default PropertyCardGrid;

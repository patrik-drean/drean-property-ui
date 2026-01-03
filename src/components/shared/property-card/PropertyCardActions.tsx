import React from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import * as Icons from '@mui/icons-material';
import { Property } from '../../../types/property';

interface PropertyCardActionsProps {
  property: Property;
  onEdit?: (property: Property) => void;
  onViewDetails?: (property: Property) => void;
  onArchive?: (propertyId: string) => void;
  variant?: 'default' | 'compact' | 'portfolio';
}

export const PropertyCardActions: React.FC<PropertyCardActionsProps> = ({
  property,
  onEdit,
  onViewDetails,
  onArchive,
  variant = 'default',
}) => {
  const iconSize = variant === 'compact' ? 'small' : 'small';
  const padding = variant === 'compact' ? 0.5 : 0.5;

  return (
    <Box sx={{ display: 'flex', gap: 0.5, ml: 1 }}>
      {onViewDetails && (
        <Tooltip title="View Details" arrow>
          <IconButton
            size="small"
            onClick={() => onViewDetails(property)}
            sx={{ p: padding }}
          >
            <Icons.Visibility fontSize={iconSize} />
          </IconButton>
        </Tooltip>
      )}
      {onEdit && (
        <Tooltip title="Edit Property" arrow>
          <IconButton
            size="small"
            onClick={() => onEdit(property)}
            sx={{ p: padding }}
          >
            <Icons.Edit fontSize={iconSize} />
          </IconButton>
        </Tooltip>
      )}
      {onArchive && variant !== 'portfolio' && variant !== 'compact' && (
        <Tooltip title="Archive Property" arrow>
          <IconButton
            size="small"
            onClick={() => onArchive(property.id)}
            sx={{ p: padding }}
          >
            <Icons.Archive fontSize={iconSize} />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
};

export default PropertyCardActions;

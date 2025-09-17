import { PropertyStatus } from '../types/property';

/**
 * Get the color for a property status using the Maximum Distinction Palette
 * This ensures consistent color coding across all components
 */
export const getStatusColor = (status: PropertyStatus): string => {
  switch (status) {
    case 'Opportunity':
      return '#6B8E6B'; // Muted sage green
    case 'Soft Offer':
      return '#D4A574'; // Warm beige
    case 'Hard Offer':
      return '#B8860B'; // Dark gold
    case 'Rehab':
      return '#A0522D'; // Sienna brown
    case 'Operational':
      return '#4682B4'; // Steel blue
    case 'Needs Tenant':
      return '#9370DB'; // Muted purple
    case 'Selling':
      return '#CD853F'; // Peru
    default:
      return '#737373'; // Neutral gray
  }
};

/**
 * Get the order/priority for sorting property statuses
 * Lower numbers appear first in sorted lists
 */
export const getStatusOrder = (status: PropertyStatus): number => {
  switch (status) {
    case 'Opportunity':
      return 0;
    case 'Soft Offer':
      return 1;
    case 'Hard Offer':
      return 2;
    case 'Selling':
      return 3;
    case 'Rehab':
      return 4;
    case 'Needs Tenant':
      return 5;
    case 'Operational':
      return 6;
    default:
      return 7;
  }
};

/**
 * Get a human-readable description for each status
 */
export const getStatusDescription = (status: PropertyStatus): string => {
  switch (status) {
    case 'Opportunity':
      return 'Growth potential';
    case 'Soft Offer':
      return 'Gentle caution, review needed';
    case 'Hard Offer':
      return 'Action required, uses theme gold';
    case 'Rehab':
      return 'Attention needed';
    case 'Operational':
      return 'Stable, performing';
    case 'Needs Tenant':
      return 'Vacancy issue';
    case 'Selling':
      return 'Exit strategy';
    default:
      return 'Unknown status';
  }
};

/**
 * Get all available status colors as an object
 * Useful for creating color palettes or theme configurations
 */
export const getAllStatusColors = (): Record<PropertyStatus, string> => {
  return {
    'Opportunity': '#6B8E6B',
    'Soft Offer': '#D4A574',
    'Hard Offer': '#B8860B',
    'Rehab': '#A0522D',
    'Operational': '#4682B4',
    'Needs Tenant': '#9370DB',
    'Selling': '#CD853F',
  };
};

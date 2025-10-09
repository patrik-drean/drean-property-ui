import { PropertyStatus } from '../types/property';

/**
 * Get the color for a property status using modern Tailwind palette
 * Aligned with Option 5 theme (Slate + Cyan + Emerald)
 * This ensures consistent color coding across all components
 */
export const getStatusColor = (status: PropertyStatus): string => {
  switch (status) {
    case 'Opportunity':
      return '#8B5CF6'; // Violet 500 - Early stage, potential
    case 'Soft Offer':
      return '#F59E0B'; // Amber 500 - Gentle caution, attention needed
    case 'Hard Offer':
      return '#EF4444'; // Red 500 - Critical action required
    case 'Rehab':
      return '#F97316'; // Orange 500 - Active work, transformation
    case 'Operational':
      return '#10B981'; // Emerald 500 - Stable, performing (matches theme accent)
    case 'Needs Tenant':
      return '#06B6D4'; // Cyan 500 - Needs focus (matches theme secondary)
    case 'Selling':
      return '#6366F1'; // Indigo 500 - Transition state, exit strategy
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
      return 'Growth potential, early stage';
    case 'Soft Offer':
      return 'Gentle caution, review needed';
    case 'Hard Offer':
      return 'Critical action required';
    case 'Rehab':
      return 'Active transformation';
    case 'Operational':
      return 'Stable, performing';
    case 'Needs Tenant':
      return 'Vacancy, needs focus';
    case 'Selling':
      return 'Exit strategy, transition';
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
    'Opportunity': '#8B5CF6',
    'Soft Offer': '#F59E0B',
    'Hard Offer': '#EF4444',
    'Rehab': '#F97316',
    'Operational': '#10B981',
    'Needs Tenant': '#06B6D4',
    'Selling': '#6366F1',
  };
};

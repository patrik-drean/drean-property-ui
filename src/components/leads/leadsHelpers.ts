import { PropertyLead } from '../../types/property';

// Helper function to calculate ARV Guess for a lead
export const calculateARVGuess = (squareFootage: number | null): number => {
  if (!squareFootage) return 0;
  return 160 * squareFootage;
};

// Helper function to calculate lead score based on listing price vs ARV
export const calculateLeadScore = (listingPrice: number, squareFootage: number | null): number => {
  const arvGuess = calculateARVGuess(squareFootage);
  if (!arvGuess || arvGuess === 0) return 0;

  const ratio = listingPrice / arvGuess;

  // Calculate score based on ratio thresholds
  if (ratio >= 0.95) return 1;
  if (ratio >= 0.90) return 2;
  if (ratio >= 0.85) return 3;
  if (ratio >= 0.80) return 4;
  if (ratio >= 0.75) return 5;
  if (ratio >= 0.70) return 6;
  if (ratio >= 0.65) return 7;
  if (ratio >= 0.60) return 8;
  if (ratio >= 0.55) return 9;
  // Anything 50% and under is a 10
  return 10;
};

// Helper function to get score background color
export const getScoreBackgroundColor = (score: number): string => {
  if (score >= 8) return '#4CAF50'; // Green for 8-10
  if (score >= 5) return '#FFC107'; // Yellow for 5-7
  if (score >= 1) return '#F44336'; // Red for 1-4
  return '#9E9E9E'; // Grey for 0 (no data)
};

// Helper function to get score text color
export const getScoreColor = (score: number): string => {
  if (score >= 8) return '#E8F5E9'; // Light green text for green background
  if (score >= 5) return '#212121'; // Dark text for yellow background
  if (score >= 1) return '#FFEBEE'; // Light red text for red background
  return '#FFFFFF'; // White text for grey background
};

// Helper function to check if metadata has content
export const hasMetadataContent = (metadata: string | undefined): boolean => {
  if (!metadata || metadata === '{}') return false;
  try {
    const parsed = JSON.parse(metadata);
    return Object.keys(parsed).length > 0;
  } catch {
    return false;
  }
};

// Helper function to check if a metadata key represents a financial value
export const isFinancialKey = (key: string): boolean => {
  const lowerKey = key.toLowerCase();
  return lowerKey.includes('price') ||
         lowerKey.includes('estimate') ||
         lowerKey.includes('value') ||
         lowerKey.includes('arv') ||
         lowerKey.includes('zestimate') ||
         lowerKey.includes('rent') ||
         lowerKey.includes('cost') ||
         lowerKey.includes('mao');
};

// Helper function to check if a metadata key represents a ratio/percentage
export const isRatioKey = (key: string): boolean => {
  const lowerKey = key.toLowerCase();
  return lowerKey.includes('ratio') ||
         lowerKey.includes('percent') ||
         lowerKey.includes('rate');
};

// Add sorting function for property leads - modified to handle archived status
export const sortPropertyLeads = (leads: PropertyLead[]): PropertyLead[] => {
  return [...leads].sort((a, b) => {
    // First sort by archived status
    if (a.archived !== b.archived) {
      return a.archived ? 1 : -1; // Non-archived leads first
    }

    // Then sort by last contact date (not contacted leads first, then most recent)
    if (!a.lastContactDate && !b.lastContactDate) {
      // Both have no contact date (Not Contacted)
      // Sort by lead score descending (10 -> 1, then null)
      // Use backend score if available, otherwise calculate client-side (same as display logic)
      const aScore = (a.leadScore !== null && a.leadScore !== undefined)
        ? a.leadScore
        : calculateLeadScore(a.listingPrice, a.squareFootage);
      const bScore = (b.leadScore !== null && b.leadScore !== undefined)
        ? b.leadScore
        : calculateLeadScore(b.listingPrice, b.squareFootage);

      if (aScore !== bScore) {
        return bScore - aScore; // Descending order (higher scores first)
      }

      // If scores are equal, sort by created date (most recent first)
      const createdDateComparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (createdDateComparison !== 0) {
        return createdDateComparison;
      }
    } else if (!a.lastContactDate) {
      return -1; // a has no contact date, put it first
    } else if (!b.lastContactDate) {
      return 1; // b has no contact date, put it first
    } else {
      // Both have contact dates, sort by most recent first
      const dateComparison = new Date(b.lastContactDate).getTime() - new Date(a.lastContactDate).getTime();
      if (dateComparison !== 0) {
        return dateComparison;
      }
    }

    // Then sort by number of units descending (null/undefined units go to the end)
    const aUnits = a.units || 0;
    const bUnits = b.units || 0;
    if (aUnits !== bUnits) {
      return bUnits - aUnits; // Descending order
    }

    // Finally sort alphabetically by address ascending
    return a.address.localeCompare(b.address);
  });
};

// Format currency helper
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

// Helper function to format metadata value based on its key and type
export const formatMetadataValue = (key: string, value: any): string => {
  // Check if it's a number
  if (typeof value === 'number') {
    // Format as percentage if it's a ratio field
    if (isRatioKey(key)) {
      return `${(value * 100).toFixed(1)}%`;
    }
    // Format as currency if it's a financial field
    if (isFinancialKey(key)) {
      return formatCurrency(value);
    }
  }
  return String(value);
};

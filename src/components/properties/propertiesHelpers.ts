// Helper function for score background color
export const getScoreBackgroundColor = (score: number): string => {
  if (score >= 9) return '#4CAF50'; // Green for 9-10
  if (score >= 7) return '#FFC107'; // Amber for 7-8
  if (score >= 5) return '#FF9800'; // Orange for 5-6
  return '#F44336'; // Red for < 5
};

// Helper function for score text color
export const getScoreTextColor = (score: number): string => {
  if (score >= 9) return '#FFFFFF';
  if (score >= 7) return '#000000';
  if (score >= 5) return '#000000';
  return '#FFFFFF';
};

// Format currency helper
export const formatCurrency = (amount: number | null | undefined) => {
  if (amount === null || amount === undefined) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Format percentage helper
export const formatPercentage = (value: number) => {
  return `${(value * 100).toFixed(1)}%`;
};

// Get rent ratio color
export const getRentRatioColor = (ratio: number) => {
  if (ratio >= 0.01) return '#4CAF50'; // Green >= 1%
  if (ratio >= 0.008) return '#FFC107'; // Amber 0.8-1%
  return '#F44336'; // Red < 0.8%
};

// Get ARV ratio color
export const getARVRatioColor = (ratio: number) => {
  if (ratio <= 0.70) return '#4CAF50'; // Green <= 70%
  if (ratio <= 0.80) return '#FFC107'; // Amber 70-80%
  return '#F44336'; // Red > 80%
};

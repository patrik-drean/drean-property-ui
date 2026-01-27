/**
 * Currency formatting and validation utilities
 */

/**
 * Format a number as currency ($XXX,XXX)
 */
export const formatCurrency = (value: number): string => {
  return `$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
};

/**
 * Parse a currency string to a number
 * Handles $, commas, and whitespace
 */
export const parseCurrency = (input: string): number => {
  // Remove $, commas, and whitespace
  const cleaned = input.replace(/[$,\s]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Validate a currency value is within acceptable range
 */
export const validateCurrency = (
  value: number,
  min = 0,
  max = 10_000_000
): string | null => {
  if (isNaN(value)) return 'Please enter a valid number';
  if (value < min) return `Value must be at least ${formatCurrency(min)}`;
  if (value > max) return `Value cannot exceed ${formatCurrency(max)}`;
  return null;
};

/**
 * Format a number as a percentage
 */
export const formatPercent = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

/**
 * Parse a percentage string to a number
 */
export const parsePercent = (input: string): number => {
  const cleaned = input.replace(/[%\s]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

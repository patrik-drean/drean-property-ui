/**
 * Phone number utilities for formatting and normalization.
 * Phones are stored normalized (+1XXXXXXXXXX) and displayed formatted ((XXX) XXX-XXXX).
 */

/**
 * Extracts only digits from a phone string.
 */
export const extractDigits = (value: string | null | undefined): string => {
  if (!value) return '';
  return value.replace(/\D/g, '');
};

/**
 * Normalizes a phone number to +1XXXXXXXXXX format for storage.
 * Returns empty string if not a valid US phone number.
 */
export const normalizePhone = (value: string | null | undefined): string => {
  const digits = extractDigits(value);

  if (digits.length === 10) {
    return `+1${digits}`;
  }
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }

  // Return as-is if not a standard US number
  return digits.length > 0 ? `+${digits}` : '';
};

/**
 * Formats a phone number for display: (XXX) XXX-XXXX
 * Handles both normalized (+1XXXXXXXXXX) and raw formats.
 */
export const formatPhoneForDisplay = (value: string | null | undefined): string => {
  const digits = extractDigits(value);

  if (digits.length === 0) return '';

  // Handle 10-digit US numbers
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  // Handle 11-digit numbers with country code
  if (digits.length === 11 && digits.startsWith('1')) {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }

  // Return original if not a standard format
  return value || '';
};

/**
 * Validates that a phone number has at least 10 digits.
 */
export const isValidPhone = (value: string | null | undefined): boolean => {
  const digits = extractDigits(value);
  return digits.length >= 10;
};

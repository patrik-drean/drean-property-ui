import {
  formatCurrency,
  parseCurrency,
  validateCurrency,
  formatPercent,
  parsePercent,
} from '../currencyUtils';

describe('currencyUtils', () => {
  describe('formatCurrency', () => {
    it('formats positive numbers with dollar sign and commas', () => {
      expect(formatCurrency(150000)).toBe('$150,000');
      expect(formatCurrency(1500000)).toBe('$1,500,000');
      expect(formatCurrency(1000)).toBe('$1,000');
    });

    it('formats zero', () => {
      expect(formatCurrency(0)).toBe('$0');
    });

    it('formats negative numbers', () => {
      expect(formatCurrency(-5000)).toBe('$-5,000');
    });

    it('rounds decimal values', () => {
      expect(formatCurrency(150000.75)).toBe('$150,001');
      expect(formatCurrency(150000.25)).toBe('$150,000');
    });

    it('handles very large numbers', () => {
      expect(formatCurrency(999999999)).toBe('$999,999,999');
    });

    it('handles small numbers', () => {
      expect(formatCurrency(1)).toBe('$1');
      expect(formatCurrency(10)).toBe('$10');
      expect(formatCurrency(100)).toBe('$100');
    });
  });

  describe('parseCurrency', () => {
    it('parses plain numbers', () => {
      expect(parseCurrency('150000')).toBe(150000);
      expect(parseCurrency('1000')).toBe(1000);
    });

    it('parses numbers with dollar sign', () => {
      expect(parseCurrency('$150000')).toBe(150000);
      expect(parseCurrency('$1,500,000')).toBe(1500000);
    });

    it('parses numbers with commas', () => {
      expect(parseCurrency('150,000')).toBe(150000);
      expect(parseCurrency('1,500,000')).toBe(1500000);
    });

    it('parses numbers with dollar sign and commas', () => {
      expect(parseCurrency('$150,000')).toBe(150000);
      expect(parseCurrency('$1,500,000')).toBe(1500000);
    });

    it('handles whitespace', () => {
      expect(parseCurrency(' 150000 ')).toBe(150000);
      expect(parseCurrency(' $150,000 ')).toBe(150000);
    });

    it('returns 0 for invalid input', () => {
      expect(parseCurrency('invalid')).toBe(0);
      expect(parseCurrency('abc')).toBe(0);
      expect(parseCurrency('')).toBe(0);
    });

    it('handles decimal values', () => {
      expect(parseCurrency('150000.50')).toBe(150000.5);
      expect(parseCurrency('$150,000.75')).toBe(150000.75);
    });

    it('handles zero', () => {
      expect(parseCurrency('0')).toBe(0);
      expect(parseCurrency('$0')).toBe(0);
    });

    it('handles negative numbers', () => {
      expect(parseCurrency('-5000')).toBe(-5000);
    });
  });

  describe('validateCurrency', () => {
    it('returns null for valid values within default range', () => {
      expect(validateCurrency(5000)).toBeNull();
      expect(validateCurrency(100000)).toBeNull();
      expect(validateCurrency(0)).toBeNull();
    });

    it('returns error for values below minimum', () => {
      expect(validateCurrency(-100, 0, 1000000)).toBe('Value must be at least $0');
      expect(validateCurrency(5000, 10000, 1000000)).toBe('Value must be at least $10,000');
    });

    it('returns error for values above maximum', () => {
      expect(validateCurrency(15000000, 0, 10000000)).toBe('Value cannot exceed $10,000,000');
      expect(validateCurrency(600000, 0, 500000)).toBe('Value cannot exceed $500,000');
    });

    it('uses custom min and max', () => {
      expect(validateCurrency(50000, 10000, 500000)).toBeNull();
      expect(validateCurrency(5000, 10000, 500000)).toBe('Value must be at least $10,000');
      expect(validateCurrency(600000, 10000, 500000)).toBe('Value cannot exceed $500,000');
    });

    it('handles edge cases at boundaries', () => {
      expect(validateCurrency(0, 0, 100)).toBeNull();
      expect(validateCurrency(100, 0, 100)).toBeNull();
    });

    it('returns error for NaN', () => {
      expect(validateCurrency(NaN)).toBe('Please enter a valid number');
    });
  });

  describe('formatPercent', () => {
    it('formats percentage with one decimal place', () => {
      expect(formatPercent(25)).toBe('25.0%');
      expect(formatPercent(12.5)).toBe('12.5%');
      expect(formatPercent(0)).toBe('0.0%');
    });

    it('rounds to one decimal place', () => {
      expect(formatPercent(12.567)).toBe('12.6%');
      expect(formatPercent(12.544)).toBe('12.5%');
    });

    it('handles negative percentages', () => {
      expect(formatPercent(-5.5)).toBe('-5.5%');
    });

    it('handles large percentages', () => {
      expect(formatPercent(150)).toBe('150.0%');
    });
  });

  describe('parsePercent', () => {
    it('parses plain numbers', () => {
      expect(parsePercent('25')).toBe(25);
      expect(parsePercent('12.5')).toBe(12.5);
    });

    it('parses numbers with percent sign', () => {
      expect(parsePercent('25%')).toBe(25);
      expect(parsePercent('12.5%')).toBe(12.5);
    });

    it('handles whitespace', () => {
      expect(parsePercent(' 25 ')).toBe(25);
      expect(parsePercent(' 12.5% ')).toBe(12.5);
    });

    it('returns 0 for invalid input', () => {
      expect(parsePercent('invalid')).toBe(0);
      expect(parsePercent('abc')).toBe(0);
      expect(parsePercent('')).toBe(0);
    });

    it('handles zero', () => {
      expect(parsePercent('0')).toBe(0);
      expect(parsePercent('0%')).toBe(0);
    });

    it('handles negative percentages', () => {
      expect(parsePercent('-5.5%')).toBe(-5.5);
    });
  });
});

import {
  calculateARVGuess,
  calculateLeadScore,
  getScoreBackgroundColor,
  getScoreColor,
  hasMetadataContent,
  isFinancialKey,
  isRatioKey,
  sortPropertyLeads,
  formatCurrency,
  formatMetadataValue,
} from '../leadsHelpers';
import { PropertyLead } from '../../../types/property';

describe('leadsHelpers', () => {
  describe('calculateARVGuess', () => {
    it('should return 0 for null square footage', () => {
      expect(calculateARVGuess(null)).toBe(0);
    });

    it('should return 0 for 0 square footage', () => {
      expect(calculateARVGuess(0)).toBe(0);
    });

    it('should calculate ARV as 160 * square footage', () => {
      expect(calculateARVGuess(1000)).toBe(160000);
      expect(calculateARVGuess(1500)).toBe(240000);
      expect(calculateARVGuess(2500)).toBe(400000);
    });
  });

  describe('calculateLeadScore', () => {
    it('should return 0 for null square footage', () => {
      expect(calculateLeadScore(100000, null)).toBe(0);
    });

    it('should return 0 for 0 square footage', () => {
      expect(calculateLeadScore(100000, 0)).toBe(0);
    });

    it('should return 10 for ratio <= 50%', () => {
      // ARV = 160 * 1000 = 160000, ratio = 80000/160000 = 0.50
      expect(calculateLeadScore(80000, 1000)).toBe(10);
      // ratio = 50000/160000 = 0.3125
      expect(calculateLeadScore(50000, 1000)).toBe(10);
    });

    it('should return 9 for ratio between 55-60%', () => {
      // ARV = 160000, ratio = 88000/160000 = 0.55
      expect(calculateLeadScore(88000, 1000)).toBe(9);
    });

    it('should return 8 for ratio between 60-65%', () => {
      // ratio = 96000/160000 = 0.60
      expect(calculateLeadScore(96000, 1000)).toBe(8);
    });

    it('should return 5 for ratio between 75-80%', () => {
      // ratio = 120000/160000 = 0.75
      expect(calculateLeadScore(120000, 1000)).toBe(5);
    });

    it('should return 1 for ratio >= 95%', () => {
      // ratio = 152000/160000 = 0.95
      expect(calculateLeadScore(152000, 1000)).toBe(1);
      // ratio = 160000/160000 = 1.0
      expect(calculateLeadScore(160000, 1000)).toBe(1);
    });
  });

  describe('getScoreBackgroundColor', () => {
    it('should return green for scores 8-10', () => {
      expect(getScoreBackgroundColor(8)).toBe('#4CAF50');
      expect(getScoreBackgroundColor(9)).toBe('#4CAF50');
      expect(getScoreBackgroundColor(10)).toBe('#4CAF50');
    });

    it('should return yellow for scores 5-7', () => {
      expect(getScoreBackgroundColor(5)).toBe('#FFC107');
      expect(getScoreBackgroundColor(6)).toBe('#FFC107');
      expect(getScoreBackgroundColor(7)).toBe('#FFC107');
    });

    it('should return red for scores 1-4', () => {
      expect(getScoreBackgroundColor(1)).toBe('#F44336');
      expect(getScoreBackgroundColor(2)).toBe('#F44336');
      expect(getScoreBackgroundColor(4)).toBe('#F44336');
    });

    it('should return grey for score 0', () => {
      expect(getScoreBackgroundColor(0)).toBe('#9E9E9E');
    });
  });

  describe('getScoreColor', () => {
    it('should return light green text for scores 8-10', () => {
      expect(getScoreColor(8)).toBe('#E8F5E9');
      expect(getScoreColor(10)).toBe('#E8F5E9');
    });

    it('should return dark text for scores 5-7', () => {
      expect(getScoreColor(5)).toBe('#212121');
      expect(getScoreColor(7)).toBe('#212121');
    });

    it('should return light red text for scores 1-4', () => {
      expect(getScoreColor(1)).toBe('#FFEBEE');
      expect(getScoreColor(4)).toBe('#FFEBEE');
    });

    it('should return white text for score 0', () => {
      expect(getScoreColor(0)).toBe('#FFFFFF');
    });
  });

  describe('hasMetadataContent', () => {
    it('should return false for undefined', () => {
      expect(hasMetadataContent(undefined)).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(hasMetadataContent('')).toBe(false);
    });

    it('should return false for empty object string', () => {
      expect(hasMetadataContent('{}')).toBe(false);
    });

    it('should return false for invalid JSON', () => {
      expect(hasMetadataContent('not valid json')).toBe(false);
    });

    it('should return true for valid JSON with content', () => {
      expect(hasMetadataContent('{"key": "value"}')).toBe(true);
      expect(hasMetadataContent('{"price": 100000}')).toBe(true);
    });
  });

  describe('isFinancialKey', () => {
    it('should return true for financial keys', () => {
      expect(isFinancialKey('price')).toBe(true);
      expect(isFinancialKey('listingPrice')).toBe(true);
      expect(isFinancialKey('estimate')).toBe(true);
      expect(isFinancialKey('value')).toBe(true);
      expect(isFinancialKey('arv')).toBe(true);
      expect(isFinancialKey('zestimate')).toBe(true);
      expect(isFinancialKey('rent')).toBe(true);
      expect(isFinancialKey('cost')).toBe(true);
      expect(isFinancialKey('mao')).toBe(true);
    });

    it('should return false for non-financial keys', () => {
      expect(isFinancialKey('address')).toBe(false);
      expect(isFinancialKey('notes')).toBe(false);
      expect(isFinancialKey('status')).toBe(false);
    });

    it('should be case insensitive', () => {
      expect(isFinancialKey('PRICE')).toBe(true);
      expect(isFinancialKey('Price')).toBe(true);
      expect(isFinancialKey('ARV')).toBe(true);
    });
  });

  describe('isRatioKey', () => {
    it('should return true for ratio keys', () => {
      expect(isRatioKey('ratio')).toBe(true);
      expect(isRatioKey('rentRatio')).toBe(true);
      expect(isRatioKey('percent')).toBe(true);
      expect(isRatioKey('percentage')).toBe(true);
      expect(isRatioKey('rate')).toBe(true);
      expect(isRatioKey('interestRate')).toBe(true);
    });

    it('should return false for non-ratio keys', () => {
      expect(isRatioKey('price')).toBe(false);
      expect(isRatioKey('value')).toBe(false);
    });
  });

  describe('formatCurrency', () => {
    it('should format numbers as USD currency', () => {
      expect(formatCurrency(0)).toBe('$0');
      expect(formatCurrency(1000)).toBe('$1,000');
      expect(formatCurrency(100000)).toBe('$100,000');
      expect(formatCurrency(1500000)).toBe('$1,500,000');
    });

    it('should round to whole numbers', () => {
      expect(formatCurrency(1000.50)).toBe('$1,001');
      expect(formatCurrency(1000.49)).toBe('$1,000');
    });

    it('should handle negative numbers', () => {
      expect(formatCurrency(-1000)).toBe('-$1,000');
    });
  });

  describe('formatMetadataValue', () => {
    it('should format ratio values as percentages', () => {
      expect(formatMetadataValue('ratio', 0.75)).toBe('75.0%');
      expect(formatMetadataValue('rentRatio', 0.01)).toBe('1.0%');
    });

    it('should format financial values as currency', () => {
      expect(formatMetadataValue('price', 100000)).toBe('$100,000');
      expect(formatMetadataValue('arv', 250000)).toBe('$250,000');
    });

    it('should convert non-number values to string', () => {
      expect(formatMetadataValue('address', '123 Main St')).toBe('123 Main St');
      expect(formatMetadataValue('status', 'active')).toBe('active');
    });
  });

  describe('sortPropertyLeads', () => {
    const createMockLead = (overrides: Partial<PropertyLead> = {}): PropertyLead => ({
      id: '1',
      address: 'Test Address',
      zillowLink: 'http://test.com',
      listingPrice: 100000,
      sellerPhone: '555-1234',
      sellerEmail: 'test@test.com',
      lastContactDate: null,
      respondedDate: null,
      convertedDate: null,
      underContractDate: null,
      soldDate: null,
      notes: '',
      squareFootage: 1000,
      units: 1,
      convertedToProperty: false,
      archived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      leadScore: null,
      tags: [],
      ...overrides,
    });

    it('should sort non-archived leads before archived leads', () => {
      const leads: PropertyLead[] = [
        createMockLead({ id: '1', archived: true, address: 'A' }),
        createMockLead({ id: '2', archived: false, address: 'B' }),
      ];

      const sorted = sortPropertyLeads(leads);
      expect(sorted[0].archived).toBe(false);
      expect(sorted[1].archived).toBe(true);
    });

    it('should sort not contacted leads before contacted leads', () => {
      const leads: PropertyLead[] = [
        createMockLead({ id: '1', lastContactDate: '2024-01-01', address: 'A' }),
        createMockLead({ id: '2', lastContactDate: null, address: 'B' }),
      ];

      const sorted = sortPropertyLeads(leads);
      expect(sorted[0].lastContactDate).toBeNull();
      expect(sorted[1].lastContactDate).not.toBeNull();
    });

    it('should sort by lead score descending for not contacted leads', () => {
      const leads: PropertyLead[] = [
        createMockLead({ id: '1', lastContactDate: null, leadScore: 5 }),
        createMockLead({ id: '2', lastContactDate: null, leadScore: 8 }),
        createMockLead({ id: '3', lastContactDate: null, leadScore: 3 }),
      ];

      const sorted = sortPropertyLeads(leads);
      expect(sorted[0].leadScore).toBe(8);
      expect(sorted[1].leadScore).toBe(5);
      expect(sorted[2].leadScore).toBe(3);
    });

    it('should sort contacted leads by most recent contact date first', () => {
      const leads: PropertyLead[] = [
        createMockLead({ id: '1', lastContactDate: '2024-01-01' }),
        createMockLead({ id: '2', lastContactDate: '2024-01-15' }),
        createMockLead({ id: '3', lastContactDate: '2024-01-10' }),
      ];

      const sorted = sortPropertyLeads(leads);
      expect(sorted[0].lastContactDate).toBe('2024-01-15');
      expect(sorted[1].lastContactDate).toBe('2024-01-10');
      expect(sorted[2].lastContactDate).toBe('2024-01-01');
    });

    it('should sort by units descending when other criteria are equal', () => {
      const leads: PropertyLead[] = [
        createMockLead({ id: '1', lastContactDate: '2024-01-01', units: 2 }),
        createMockLead({ id: '2', lastContactDate: '2024-01-01', units: 4 }),
        createMockLead({ id: '3', lastContactDate: '2024-01-01', units: 1 }),
      ];

      const sorted = sortPropertyLeads(leads);
      expect(sorted[0].units).toBe(4);
      expect(sorted[1].units).toBe(2);
      expect(sorted[2].units).toBe(1);
    });

    it('should sort alphabetically by address as final tiebreaker', () => {
      const leads: PropertyLead[] = [
        createMockLead({ id: '1', lastContactDate: '2024-01-01', units: 2, address: 'C Street' }),
        createMockLead({ id: '2', lastContactDate: '2024-01-01', units: 2, address: 'A Street' }),
        createMockLead({ id: '3', lastContactDate: '2024-01-01', units: 2, address: 'B Street' }),
      ];

      const sorted = sortPropertyLeads(leads);
      expect(sorted[0].address).toBe('A Street');
      expect(sorted[1].address).toBe('B Street');
      expect(sorted[2].address).toBe('C Street');
    });

    it('should not mutate the original array', () => {
      const leads: PropertyLead[] = [
        createMockLead({ id: '1', address: 'B' }),
        createMockLead({ id: '2', address: 'A' }),
      ];
      const originalFirst = leads[0];

      sortPropertyLeads(leads);
      expect(leads[0]).toBe(originalFirst);
    });
  });
});

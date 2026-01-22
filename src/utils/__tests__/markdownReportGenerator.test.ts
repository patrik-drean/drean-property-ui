import {
  generateMarkdownReport,
  sanitizeFilename,
} from '../markdownReportGenerator';
import { Property, PropertyLead, SaleComparable } from '../../types/property';
import * as investmentReportService from '../../services/investmentReportService';

// Helper functions for formatting (same as the real implementations)
const formatCurrencyImpl = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatPercentageImpl = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
};

// Mock the investmentReportService
jest.mock('../../services/investmentReportService', () => ({
  calculateInvestmentMetrics: jest.fn(),
  formatCurrency: (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  },
  formatPercentage: (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value);
  },
}));

const mockCalculations = {
  rentRatio: 0.012,
  arvRatio: 0.795,
  holdScore: 8,
  flipScore: 7,
  homeEquity: 45000,
  monthlyCashflow: 500,
  holdScoreBreakdown: {
    totalScore: 8,
    cashflowScore: 6,
    rentRatioScore: 2,
    cashflowPerUnit: 500,
    rentRatioPercentage: 0.012,
  },
  flipScoreBreakdown: {
    totalScore: 7,
    arvRatioScore: 6,
    equityScore: 1,
    arvRatioPercentage: 0.795,
    equityAmount: 45000,
  },
  perfectRentForHoldScore: 2000,
  perfectARVForFlipScore: 250000,
  monthlyIncome: 1800,
  monthlyExpenses: {
    mortgage: 800,
    taxes: 250,
    insurance: 150,
    propertyManagement: 165,
    utilities: 100,
    vacancy: 90,
    capEx: 100,
    other: 50,
    total: 1705,
  },
  netMonthlyCashflow: 500,
  annualCashflow: 6000,
  purchasePrice: 150000,
  rehabCosts: 25000,
  totalInvestment: 175000,
  arv: 220000,
  newLoanAmount: 154000,
  downPaymentRequired: 30000,
  closingCosts: 3000,
  postRefinanceEquity: 45000,
  cashOnCashReturn: 0.2,
};

const createMockProperty = (overrides: Partial<Property> = {}): Property => ({
  id: '1',
  address: '123 Test St, San Antonio, TX 78201',
  status: 'Opportunity',
  listingPrice: 180000,
  offerPrice: 150000,
  rehabCosts: 25000,
  potentialRent: 1800,
  arv: 220000,
  rentCastEstimates: {
    price: 215000,
    priceLow: 200000,
    priceHigh: 230000,
    rent: 1750,
    rentLow: 1650,
    rentHigh: 1850,
    arv: 225000,
    arvPerSqft: 188,
    asIsValue: 180000,
    asIsValuePerSqft: 150,
  },
  hasRentcastData: true,
  saleComparables: [],
  notes: 'Test property notes',
  score: 8,
  zillowLink: 'https://zillow.com/test',
  squareFootage: 1200,
  units: 2,
  actualRent: 1650,
  currentHouseValue: 200000,
  currentLoanValue: 120000,
  propertyUnits: [],
  monthlyExpenses: null,
  capitalCosts: null,
  ...overrides,
});

const createMockLead = (overrides: Partial<PropertyLead> = {}): PropertyLead => ({
  id: 'lead-1',
  address: '123 Test St, San Antonio, TX 78201',
  zillowLink: 'https://zillow.com/test',
  listingPrice: 180000,
  sellerPhone: '555-1234',
  sellerEmail: 'seller@test.com',
  lastContactDate: null,
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
  archived: false,
  tags: [],
  convertedToProperty: true,
  squareFootage: 1200,
  units: 2,
  notes: 'Lead notes',
  leadScore: 8,
  metadata: JSON.stringify({
    Zestimate: 200000,
    PropertyGrade: 'B',
    DaysOnMarket: 30,
  }),
  ...overrides,
});

const createMockComparables = (): SaleComparable[] => [
  {
    address: '100 Comp St',
    price: 200000,
    bedrooms: 3,
    bathrooms: 2,
    squareFootage: 1100,
    lotSize: 5000,
    yearBuilt: 2010,
    distance: 0.5,
    correlation: 0.9,
    daysOnMarket: 15,
    status: 'Sold',
    pricePerSqft: 182,
    tier: 'Quality',
    percentileRank: 80,
  },
  {
    address: '200 Comp Ave',
    price: 180000,
    bedrooms: 3,
    bathrooms: 2,
    squareFootage: 1200,
    lotSize: 4500,
    yearBuilt: 2005,
    distance: 0.8,
    correlation: 0.85,
    daysOnMarket: 20,
    status: 'Sold',
    pricePerSqft: 150,
    tier: 'Mid',
    percentileRank: 50,
  },
  {
    address: '300 Comp Rd',
    price: 150000,
    bedrooms: 3,
    bathrooms: 1.5,
    squareFootage: 1000,
    lotSize: 4000,
    yearBuilt: 1990,
    distance: 1.2,
    correlation: 0.75,
    daysOnMarket: 45,
    status: 'Sold',
    pricePerSqft: 150,
    tier: 'As-Is',
    percentileRank: 20,
  },
];

describe('markdownReportGenerator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (investmentReportService.calculateInvestmentMetrics as jest.Mock).mockReturnValue(mockCalculations);
  });

  describe('sanitizeFilename', () => {
    it('should convert spaces to hyphens', () => {
      const result = sanitizeFilename('123 Main St');
      expect(result).toBe('123-Main-St');
    });

    it('should remove special characters', () => {
      const result = sanitizeFilename('123 Main St, San Antonio, TX 78201');
      expect(result).toBe('123-Main-St-San-Antonio-TX-78201');
    });

    it('should remove apostrophes', () => {
      const result = sanitizeFilename("O'Connor St");
      expect(result).toBe('OConnor-St');
    });

    it('should remove hash symbols', () => {
      const result = sanitizeFilename('456 Oak Ave #2');
      expect(result).toBe('456-Oak-Ave-2');
    });

    it('should remove ampersands', () => {
      const result = sanitizeFilename('City & Town');
      expect(result).toBe('City-Town');
    });

    it('should collapse multiple hyphens', () => {
      const result = sanitizeFilename('123 Main - St');
      expect(result).toBe('123-Main-St');
    });

    it('should handle multiple spaces', () => {
      const result = sanitizeFilename('123   Main    St');
      expect(result).toBe('123-Main-St');
    });

    it('should truncate addresses longer than 100 characters', () => {
      const longAddress = 'A'.repeat(150);
      const result = sanitizeFilename(longAddress);
      expect(result.length).toBe(100);
    });

    it('should handle empty string', () => {
      const result = sanitizeFilename('');
      expect(result).toBe('');
    });

    it('should preserve numbers', () => {
      const result = sanitizeFilename('12345 67890');
      expect(result).toBe('12345-67890');
    });

    it('should handle addresses with periods', () => {
      const result = sanitizeFilename('123 N.E. Main St.');
      expect(result).toBe('123-NE-Main-St');
    });

    it('should handle addresses with parentheses', () => {
      const result = sanitizeFilename('555 Test St (Building A)');
      expect(result).toBe('555-Test-St-Building-A');
    });

    it('should handle addresses with slashes', () => {
      const result = sanitizeFilename('777 Main/Oak Corner');
      expect(result).toBe('777-MainOak-Corner');
    });

    it('should trim leading and trailing whitespace', () => {
      const result = sanitizeFilename('  123 Main St  ');
      expect(result).toBe('123-Main-St');
    });

    it('should handle typical real address format', () => {
      const result = sanitizeFilename('1234 Main St, San Antonio, TX 78201');
      expect(result).toBe('1234-Main-St-San-Antonio-TX-78201');
    });
  });

  describe('generateMarkdownReport', () => {
    it('should include property address in header', () => {
      const property = createMockProperty();
      const report = generateMarkdownReport({ property });

      expect(report).toContain('# Investment Report: 123 Test St, San Antonio, TX 78201');
    });

    it('should include generated date', () => {
      const property = createMockProperty();
      const report = generateMarkdownReport({ property });

      expect(report).toContain('**Generated**:');
    });

    it('should include square footage when available', () => {
      const property = createMockProperty({ squareFootage: 1200 });
      const report = generateMarkdownReport({ property });

      expect(report).toContain('**Square Footage**: 1,200 sq ft');
    });

    it('should not include square footage when null', () => {
      const property = createMockProperty({ squareFootage: null });
      const report = generateMarkdownReport({ property });

      expect(report).not.toContain('**Square Footage**');
    });

    it('should include units when available', () => {
      const property = createMockProperty({ units: 2 });
      const report = generateMarkdownReport({ property });

      expect(report).toContain('**Units**: 2');
    });

    it('should not include units when null', () => {
      const property = createMockProperty({ units: null });
      const report = generateMarkdownReport({ property });

      expect(report).not.toContain('**Units**');
    });

    it('should include Zillow link when available', () => {
      const property = createMockProperty({ zillowLink: 'https://zillow.com/test' });
      const report = generateMarkdownReport({ property });

      expect(report).toContain('**Zillow**: https://zillow.com/test');
    });

    it('should not include Zillow link when empty', () => {
      const property = createMockProperty({ zillowLink: '' });
      const report = generateMarkdownReport({ property });

      expect(report).not.toContain('**Zillow**:');
    });

    it('should include Investment Summary section', () => {
      const property = createMockProperty();
      const report = generateMarkdownReport({ property });

      expect(report).toContain('## Investment Summary');
      expect(report).toContain('| Hold Score |');
      expect(report).toContain('| Flip Score |');
      expect(report).toContain('| Rent Ratio |');
      expect(report).toContain('| Monthly Cash Flow |');
      expect(report).toContain('| ARV Ratio |');
    });

    it('should include Value Breakdown section', () => {
      const property = createMockProperty();
      const report = generateMarkdownReport({ property });

      expect(report).toContain('## Value Breakdown');
      expect(report).toContain('### Rent Ratio Calculation');
      expect(report).toContain('### ARV Ratio Calculation');
    });

    it('should include Market Analysis when hasRentcastData is true', () => {
      const property = createMockProperty({ hasRentcastData: true });
      const report = generateMarkdownReport({ property });

      expect(report).toContain('## Market Analysis');
      expect(report).toContain('### RentCast Valuation (85% Confidence)');
    });

    it('should not include Market Analysis when hasRentcastData is false', () => {
      const property = createMockProperty({ hasRentcastData: false });
      const report = generateMarkdownReport({ property });

      expect(report).not.toContain('## Market Analysis');
    });

    it('should include RentCast price estimates', () => {
      const property = createMockProperty();
      const report = generateMarkdownReport({ property });

      expect(report).toContain('**Price Estimate**');
      expect(report).toContain('**Rent Estimate**');
    });

    it('should include ARV estimate when available', () => {
      const property = createMockProperty({
        rentCastEstimates: {
          price: 215000,
          priceLow: 200000,
          priceHigh: 230000,
          rent: 1750,
          rentLow: 1650,
          rentHigh: 1850,
          arv: 225000,
          arvPerSqft: 188,
        },
      });
      const report = generateMarkdownReport({ property });

      expect(report).toContain('**ARV Estimate**');
    });

    it('should include As-Is Value when available', () => {
      const property = createMockProperty({
        rentCastEstimates: {
          price: 215000,
          priceLow: 200000,
          priceHigh: 230000,
          rent: 1750,
          rentLow: 1650,
          rentHigh: 1850,
          asIsValue: 180000,
          asIsValuePerSqft: 150,
        },
      });
      const report = generateMarkdownReport({ property });

      expect(report).toContain('**As-Is Value**');
    });

    it('should include Sale Comparables table when comps exist', () => {
      const property = createMockProperty({ saleComparables: createMockComparables() });
      const report = generateMarkdownReport({ property });

      expect(report).toContain('### Sale Comparables');
      expect(report).toContain('| Address | Price |');
      expect(report).toContain('100 Comp St');
      expect(report).toContain('200 Comp Ave');
      expect(report).toContain('300 Comp Rd');
    });

    it('should include tier column when comps have tier data', () => {
      const property = createMockProperty({ saleComparables: createMockComparables() });
      const report = generateMarkdownReport({ property });

      expect(report).toContain('| Tier |');
      expect(report).toContain('Quality');
      expect(report).toContain('Mid');
      expect(report).toContain('As-Is');
    });

    it('should include tier averages when tier data exists', () => {
      const property = createMockProperty({ saleComparables: createMockComparables() });
      const report = generateMarkdownReport({ property });

      expect(report).toContain('**Averages by Tier:**');
      expect(report).toContain('Quality (1 comps)');
      expect(report).toContain('Mid (1 comps)');
      expect(report).toContain('As-Is (1 comps)');
    });

    it('should include all comps average', () => {
      const property = createMockProperty({ saleComparables: createMockComparables() });
      const report = generateMarkdownReport({ property });

      expect(report).toContain('**All Comps (3)**');
    });

    it('should include Property Notes section', () => {
      const property = createMockProperty({ notes: 'This is a test note' });
      const report = generateMarkdownReport({ property });

      expect(report).toContain('## Property Notes');
      expect(report).toContain('This is a test note');
    });

    it('should show "No notes recorded." when notes are empty', () => {
      const property = createMockProperty({ notes: '' });
      const report = generateMarkdownReport({ property });

      expect(report).toContain('No notes recorded.');
    });

    it('should show "No notes recorded." when notes are whitespace only', () => {
      const property = createMockProperty({ notes: '   ' });
      const report = generateMarkdownReport({ property });

      expect(report).toContain('No notes recorded.');
    });

    it('should include Lead Metadata when linked lead has metadata', () => {
      const property = createMockProperty();
      const linkedLead = createMockLead();
      const report = generateMarkdownReport({ property, linkedLead });

      expect(report).toContain('## Lead Metadata');
      expect(report).toContain('| Zestimate |');
      expect(report).toContain('| PropertyGrade |');
      expect(report).toContain('| DaysOnMarket |');
    });

    it('should include lead score in metadata when available', () => {
      const property = createMockProperty();
      const linkedLead = createMockLead({ leadScore: 8 });
      const report = generateMarkdownReport({ property, linkedLead });

      expect(report).toContain('| Lead Score | 8/10 |');
    });

    it('should not include Lead Metadata when no linked lead', () => {
      const property = createMockProperty();
      const report = generateMarkdownReport({ property });

      expect(report).not.toContain('## Lead Metadata');
    });

    it('should not include Lead Metadata when linked lead has no metadata', () => {
      const property = createMockProperty();
      const linkedLead = createMockLead({ metadata: undefined });
      const report = generateMarkdownReport({ property, linkedLead });

      expect(report).not.toContain('## Lead Metadata');
    });

    it('should handle invalid JSON metadata gracefully', () => {
      const property = createMockProperty();
      const linkedLead = createMockLead({ metadata: 'invalid json' });

      // Should not throw
      expect(() => generateMarkdownReport({ property, linkedLead })).not.toThrow();
    });

    it('should include footer', () => {
      const property = createMockProperty();
      const report = generateMarkdownReport({ property });

      expect(report).toContain('*Generated by PropGuide Investment Analysis Platform*');
    });

    it('should include horizontal rules between sections', () => {
      const property = createMockProperty();
      const report = generateMarkdownReport({ property });

      // Count the number of horizontal rules
      const hrCount = (report.match(/---/g) || []).length;
      expect(hrCount).toBeGreaterThanOrEqual(3);
    });

    it('should format currency values in metadata correctly', () => {
      const property = createMockProperty();
      const linkedLead = createMockLead({
        metadata: JSON.stringify({
          Zestimate: 200000,
          somePrice: 150000,
          someValue: 175000,
        }),
      });
      const report = generateMarkdownReport({ property, linkedLead });

      // Currency fields should be formatted
      expect(report).toContain('$200,000');
    });

    it('should format boolean values in metadata as Yes/No', () => {
      const property = createMockProperty();
      const linkedLead = createMockLead({
        metadata: JSON.stringify({
          hasPool: true,
          isVacant: false,
        }),
      });
      const report = generateMarkdownReport({ property, linkedLead });

      expect(report).toContain('| hasPool | Yes |');
      expect(report).toContain('| isVacant | No |');
    });

    it('should handle null values in metadata as N/A', () => {
      const property = createMockProperty();
      const linkedLead = createMockLead({
        metadata: JSON.stringify({
          someField: null,
        }),
      });
      const report = generateMarkdownReport({ property, linkedLead });

      expect(report).toContain('| someField | N/A |');
    });

    it('should generate valid markdown table structure', () => {
      const property = createMockProperty();
      const report = generateMarkdownReport({ property });

      // Check Investment Summary table has proper structure
      expect(report).toMatch(/\| Metric \| Value \|/);
      expect(report).toMatch(/\|[-]+\|[-]+\|/);
    });

    it('should not include comparables table when no comps exist', () => {
      const property = createMockProperty({ saleComparables: [] });
      const report = generateMarkdownReport({ property });

      expect(report).not.toContain('### Sale Comparables');
    });

    it('should handle comps with missing squareFootage', () => {
      const comps: SaleComparable[] = [{
        address: '100 Test St',
        price: 200000,
        bedrooms: 3,
        bathrooms: 2,
        squareFootage: null,
        lotSize: null,
        yearBuilt: null,
        distance: 0.5,
        correlation: 0.9,
        daysOnMarket: null,
        status: null,
      }];
      const property = createMockProperty({ saleComparables: comps });
      const report = generateMarkdownReport({ property });

      expect(report).toContain('N/A');
    });

    it('should handle comps with zero pricePerSqft by calculating from price/sqft', () => {
      const comps: SaleComparable[] = [{
        address: '100 Test St',
        price: 200000,
        bedrooms: 3,
        bathrooms: 2,
        squareFootage: 1000,
        lotSize: null,
        yearBuilt: null,
        distance: 0.5,
        correlation: 0.9,
        daysOnMarket: null,
        status: null,
        pricePerSqft: 0,
      }];
      const property = createMockProperty({ saleComparables: comps });
      const report = generateMarkdownReport({ property });

      // Should calculate 200000/1000 = $200
      expect(report).toContain('$200');
    });

    it('should handle comps without tier data (no Tier column)', () => {
      const comps: SaleComparable[] = [{
        address: '100 Test St',
        price: 200000,
        bedrooms: 3,
        bathrooms: 2,
        squareFootage: 1000,
        lotSize: null,
        yearBuilt: null,
        distance: 0.5,
        correlation: 0.9,
        daysOnMarket: null,
        status: null,
        tier: 'Mid', // All Mid = no tier variation
      }];
      const property = createMockProperty({ saleComparables: comps });
      const report = generateMarkdownReport({ property });

      // When all comps are Mid, hasTierData should be false
      expect(report).not.toContain('| Tier |');
    });
  });

  describe('report structure completeness', () => {
    it('should generate complete report with all sections for full data property', () => {
      const property = createMockProperty({
        hasRentcastData: true,
        saleComparables: createMockComparables(),
        notes: 'Important notes here',
      });
      const linkedLead = createMockLead();
      const report = generateMarkdownReport({ property, linkedLead });

      // All major sections should be present
      expect(report).toContain('# Investment Report:');
      expect(report).toContain('## Investment Summary');
      expect(report).toContain('## Value Breakdown');
      expect(report).toContain('## Market Analysis');
      expect(report).toContain('### Sale Comparables');
      expect(report).toContain('## Property Notes');
      expect(report).toContain('## Lead Metadata');
      expect(report).toContain('*Generated by PropGuide');
    });

    it('should generate minimal report for property without optional data', () => {
      const property = createMockProperty({
        hasRentcastData: false,
        saleComparables: [],
        notes: '',
        squareFootage: null,
        units: null,
        zillowLink: '',
      });
      const report = generateMarkdownReport({ property });

      // Core sections should still be present
      expect(report).toContain('# Investment Report:');
      expect(report).toContain('## Investment Summary');
      expect(report).toContain('## Value Breakdown');
      expect(report).toContain('## Property Notes');
      expect(report).toContain('No notes recorded.');
      expect(report).toContain('*Generated by PropGuide');

      // Optional sections should not be present
      expect(report).not.toContain('## Market Analysis');
      expect(report).not.toContain('## Lead Metadata');
      expect(report).not.toContain('**Square Footage**');
      expect(report).not.toContain('**Units**');
      expect(report).not.toContain('**Zillow**');
    });
  });
});

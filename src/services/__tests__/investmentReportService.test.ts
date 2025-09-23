import {
  formatCurrency,
  formatPercentage,
  generateFilename,
  validatePropertyData,
  calculateInvestmentMetrics,
  prepareReportData,
} from '../investmentReportService';
import { Property } from '../../types/property';
import * as scoreCalculator from '../../utils/scoreCalculator';

// Mock jsPDF to avoid TextEncoder issues in tests
jest.mock('jspdf', () => {
  return jest.fn().mockImplementation(() => ({
    setFontSize: jest.fn(),
    setFont: jest.fn(),
    setTextColor: jest.fn(),
    text: jest.fn(),
    save: jest.fn(),
  }));
});

// Mock the score calculator functions
jest.mock('../../utils/scoreCalculator', () => ({
  calculateRentRatio: jest.fn(),
  calculateARVRatio: jest.fn(),
  calculateNewLoan: jest.fn(),
  calculateHomeEquity: jest.fn(),
  calculateCashflow: jest.fn(),
  calculateHoldScore: jest.fn(),
  calculateFlipScore: jest.fn(),
  getHoldScoreBreakdown: jest.fn(),
  getFlipScoreBreakdown: jest.fn(),
  calculatePerfectRentForHoldScore: jest.fn(),
  calculatePerfectARVForFlipScore: jest.fn(),
}));

const mockProperty: Property = {
  id: '1',
  address: '123 Test St, Test City, TS 12345',
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
  },
  hasRentcastData: true,
  notes: 'Test property',
  score: 8,
  zillowLink: 'https://zillow.com/test',
  squareFootage: 1200,
  units: 1,
  actualRent: 1650,
  currentHouseValue: 200000,
  currentLoanValue: 120000,
  propertyUnits: [],
  monthlyExpenses: {
    id: '1',
    propertyId: '1',
    mortgage: 800,
    taxes: 250,
    insurance: 150,
    propertyManagement: 165,
    utilities: 100,
    vacancy: 90,
    capEx: 100,
    other: 50,
    total: 1705,
    createdAt: '2023-01-01',
    updatedAt: '2023-01-01',
  },
  capitalCosts: {
    id: '1',
    propertyId: '1',
    closingCosts: 3000,
    upfrontRepairs: 25000,
    downPayment: 30000,
    other: 2000,
    total: 60000,
    createdAt: '2023-01-01',
    updatedAt: '2023-01-01',
  },
};

describe('investmentReportService', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mock returns
    (scoreCalculator.calculateRentRatio as jest.Mock).mockReturnValue(0.012);
    (scoreCalculator.calculateARVRatio as jest.Mock).mockReturnValue(0.795);
    (scoreCalculator.calculateNewLoan as jest.Mock).mockReturnValue(154000);
    (scoreCalculator.calculateHomeEquity as jest.Mock).mockReturnValue(45000);
    (scoreCalculator.calculateCashflow as jest.Mock).mockReturnValue(95);
    (scoreCalculator.calculateHoldScore as jest.Mock).mockReturnValue(8);
    (scoreCalculator.calculateFlipScore as jest.Mock).mockReturnValue(7);
    (scoreCalculator.getHoldScoreBreakdown as jest.Mock).mockReturnValue({
      totalScore: 8,
      cashflowScore: 6,
      rentRatioScore: 2,
    });
    (scoreCalculator.getFlipScoreBreakdown as jest.Mock).mockReturnValue({
      totalScore: 7,
      arvRatioScore: 6,
      equityScore: 1,
    });
    (scoreCalculator.calculatePerfectRentForHoldScore as jest.Mock).mockReturnValue(2000);
    (scoreCalculator.calculatePerfectARVForFlipScore as jest.Mock).mockReturnValue(250000);
  });

  describe('formatCurrency', () => {
    it('formats positive numbers correctly', () => {
      expect(formatCurrency(1234.56)).toBe('$1,235');
    });

    it('formats zero correctly', () => {
      expect(formatCurrency(0)).toBe('$0');
    });

    it('formats negative numbers correctly', () => {
      expect(formatCurrency(-1234.56)).toBe('-$1,235');
    });

    it('formats large numbers correctly', () => {
      expect(formatCurrency(1234567.89)).toBe('$1,234,568');
    });
  });

  describe('formatPercentage', () => {
    it('formats decimal percentages correctly', () => {
      expect(formatPercentage(0.1234)).toBe('12.3%');
    });

    it('formats zero correctly', () => {
      expect(formatPercentage(0)).toBe('0.0%');
    });

    it('formats negative percentages correctly', () => {
      expect(formatPercentage(-0.05)).toBe('-5.0%');
    });

    it('formats greater than 100% correctly', () => {
      expect(formatPercentage(1.25)).toBe('125.0%');
    });
  });

  describe('generateFilename', () => {
    beforeEach(() => {
      // Mock Date to ensure consistent testing
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2023-12-01'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('generates correct filename with date', () => {
      const filename = generateFilename('123 Test St, Test City');
      expect(filename).toBe('Investment-Summary-123-Test-St-Test-City-2023-12-01.pdf');
    });

    it('sanitizes special characters', () => {
      const filename = generateFilename('123 Main St. #4B, New York, NY 10001');
      expect(filename).toBe('Investment-Summary-123-Main-St-4B-New-York-NY-10001-2023-12-01.pdf');
    });

    it('handles empty address', () => {
      const filename = generateFilename('');
      expect(filename).toBe('Investment-Summary--2023-12-01.pdf');
    });
  });

  describe('validatePropertyData', () => {
    it('returns no errors for valid property', () => {
      const errors = validatePropertyData(mockProperty);
      expect(errors).toHaveLength(0);
    });

    it('returns error for missing address', () => {
      const invalidProperty = { ...mockProperty, address: '' };
      const errors = validatePropertyData(invalidProperty);

      expect(errors).toContainEqual({
        field: 'address',
        message: 'Property address is required',
        severity: 'error',
      });
    });

    it('returns error for invalid offer price', () => {
      const invalidProperty = { ...mockProperty, offerPrice: 0 };
      const errors = validatePropertyData(invalidProperty);

      expect(errors).toContainEqual({
        field: 'offerPrice',
        message: 'Valid offer price is required',
        severity: 'error',
      });
    });

    it('returns error for missing ARV', () => {
      const invalidProperty = { ...mockProperty, arv: 0 };
      const errors = validatePropertyData(invalidProperty);

      expect(errors).toContainEqual({
        field: 'arv',
        message: 'ARV is required for investment analysis',
        severity: 'error',
      });
    });

    it('returns error for missing potential rent', () => {
      const invalidProperty = { ...mockProperty, potentialRent: 0 };
      const errors = validatePropertyData(invalidProperty);

      expect(errors).toContainEqual({
        field: 'potentialRent',
        message: 'Potential rent is required',
        severity: 'error',
      });
    });

    it('returns warning for missing capital costs', () => {
      const incompleteProperty = { ...mockProperty, capitalCosts: null };
      const errors = validatePropertyData(incompleteProperty);

      expect(errors).toContainEqual({
        field: 'capitalCosts',
        message: 'Capital costs data missing - will use defaults',
        severity: 'warning',
      });
    });

    it('returns warning for missing monthly expenses', () => {
      const incompleteProperty = { ...mockProperty, monthlyExpenses: null };
      const errors = validatePropertyData(incompleteProperty);

      expect(errors).toContainEqual({
        field: 'monthlyExpenses',
        message: 'Monthly expenses data missing - will estimate',
        severity: 'warning',
      });
    });
  });

  describe('calculateInvestmentMetrics', () => {
    it('calculates all metrics correctly', () => {
      const metrics = calculateInvestmentMetrics(mockProperty);

      expect(metrics.rentRatio).toBe(0.012);
      expect(metrics.arvRatio).toBe(0.795);
      expect(metrics.holdScore).toBe(8);
      expect(metrics.flipScore).toBe(7);
      expect(metrics.homeEquity).toBe(45000);
      expect(metrics.monthlyCashflow).toBe(95);
      expect(metrics.totalInvestment).toBe(175000); // purchase + rehab
      expect(metrics.annualCashflow).toBe(1140); // 95 * 12
      expect(metrics.cashOnCashReturn).toBeCloseTo(0.038); // 1140 / 30000
    });

    it('handles missing capital costs', () => {
      const propertyWithoutCapitalCosts = { ...mockProperty, capitalCosts: null };
      const metrics = calculateInvestmentMetrics(propertyWithoutCapitalCosts);

      expect(metrics.downPaymentRequired).toBe(43750); // 25% of totalInvestment
      expect(metrics.closingCosts).toBe(3000); // 2% of purchase price
      expect(metrics.totalInvestment).toBe(175000); // purchase + rehab
    });

    it('handles missing monthly expenses', () => {
      const propertyWithoutExpenses = { ...mockProperty, monthlyExpenses: null };
      const metrics = calculateInvestmentMetrics(propertyWithoutExpenses);

      expect(metrics.monthlyExpenses.total).toBe(0);
    });

    it('calculates ROI correctly even with capital costs', () => {
      const propertyNoCapital = {
        ...mockProperty,
        capitalCosts: {
          ...mockProperty.capitalCosts!,
          downPayment: 0,
          closingCosts: 0,
          upfrontRepairs: 0,
          other: 0,
          total: 0,
        },
        rehabCosts: 0,
      };
      const metrics = calculateInvestmentMetrics(propertyNoCapital);

      // ROI should be calculated based on the default down payment (25% of total investment)
      expect(metrics.cashOnCashReturn).toBeGreaterThan(0);
    });
  });

  describe('prepareReportData', () => {
    it('returns complete report data structure', () => {
      const reportData = prepareReportData(mockProperty);

      expect(reportData.property).toEqual(mockProperty);
      expect(reportData.calculations).toBeDefined();
      expect(reportData.generatedAt).toBeInstanceOf(Date);
    });

    it('includes all calculation fields', () => {
      const reportData = prepareReportData(mockProperty);
      const { calculations } = reportData;

      // Check all required fields are present
      const requiredFields = [
        'rentRatio', 'arvRatio', 'holdScore', 'flipScore',
        'holdScoreBreakdown', 'flipScoreBreakdown',
        'homeEquity', 'monthlyCashflow', 'newLoanAmount',
        'totalInvestment', 'downPaymentRequired', 'closingCosts',
        'purchasePrice', 'rehabCosts', 'arv',
        'annualCashflow', 'monthlyIncome', 'monthlyExpenses', 'cashOnCashReturn',
        'perfectRentForHoldScore', 'perfectARVForFlipScore'
      ];

      requiredFields.forEach(field => {
        expect(calculations).toHaveProperty(field);
      });
    });
  });
});
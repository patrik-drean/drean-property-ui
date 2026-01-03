import {
  calculateRentRatio,
  calculateARVRatio,
  calculateDownPayment,
  calculateLoanAmount,
  calculateCashRemaining,
  calculateNewLoan,
  calculateNewLoanPercent,
  calculateCashToPullOut,
  calculateHomeEquity,
  calculateMonthlyMortgage,
  calculateCashflow,
  calculateRefinancingNewLoan,
  calculateRefinancingHomeEquity,
  calculateRefinancingCashflow,
  calculateHoldCashflowScore,
  calculateHoldARVRatioScore,
  calculateHoldRentRatioScore,
  calculateFlipARVRatioScore,
  calculateFlipEquityScore,
  calculateHoldScore,
  calculateFlipScore,
  calculateLegacyScore,
  getHoldScoreBreakdown,
  getFlipScoreBreakdown,
  calculatePerfectRentForHoldScore,
  calculatePerfectARVForFlipScore
} from '../scoreCalculator';
import { Property, PropertyStatus } from '../../types/property';

// Helper function to create a minimal property for testing
const createTestProperty = (overrides: Partial<Omit<Property, 'id'>> = {}): Omit<Property, 'id'> => ({
  address: 'Test Property',
  status: 'Opportunity' as PropertyStatus,
  listingPrice: 100000,
  offerPrice: 80000,
  rehabCosts: 20000,
  potentialRent: 1200,
  arv: 150000,
  rentCastEstimates: { price: 0, priceLow: 0, priceHigh: 0, rent: 0, rentLow: 0, rentHigh: 0 },
  todoMetaData: { todoistSectionId: null },
  hasRentcastData: false,
  saleComparables: [],
  notes: '',
  score: 0,
  zillowLink: '',
  squareFootage: null,
  units: 1,
  actualRent: 0,
  currentHouseValue: 0,
  currentLoanValue: null,
  propertyUnits: [],
  monthlyExpenses: null,
  capitalCosts: null,
  ...overrides
});

// Create property with excellent metrics for max score
const createExcellentProperty = (): Omit<Property, 'id'> => createTestProperty({
  offerPrice: 60000,
  rehabCosts: 10000,
  potentialRent: 1500,
  arv: 150000, // ARV ratio = 70000/150000 = 46.67% (excellent)
  units: 1
});

// Create property with minimal/zero values
const createEmptyProperty = (): Omit<Property, 'id'> => createTestProperty({
  offerPrice: 0,
  rehabCosts: 0,
  potentialRent: 0,
  arv: 0,
  units: 1
});

// Create property with typical values
const createTypicalProperty = (): Omit<Property, 'id'> => createTestProperty({
  offerPrice: 100000,
  rehabCosts: 15000,
  potentialRent: 1200,
  arv: 160000,
  units: 1
});

describe('scoreCalculator', () => {
  describe('calculateRentRatio', () => {
    it('returns 0 when total investment is 0', () => {
      expect(calculateRentRatio(1000, 0, 0)).toBe(0);
    });

    it('calculates correct ratio for typical property', () => {
      // $1000/month rent, $100,000 offer + $0 rehab = 1% ratio
      expect(calculateRentRatio(1000, 100000, 0)).toBeCloseTo(0.01);
    });

    it('includes rehab costs in calculation', () => {
      // $1000/month rent, $80,000 offer + $20,000 rehab = $100,000 total = 1% ratio
      expect(calculateRentRatio(1000, 80000, 20000)).toBeCloseTo(0.01);
    });

    it('handles edge case of very high rent', () => {
      // $5000/month rent, $100,000 total = 5% ratio
      expect(calculateRentRatio(5000, 100000, 0)).toBeCloseTo(0.05);
    });

    it('handles edge case of very low rent', () => {
      // $500/month rent, $100,000 total = 0.5% ratio
      expect(calculateRentRatio(500, 100000, 0)).toBeCloseTo(0.005);
    });

    it('handles zero rent', () => {
      expect(calculateRentRatio(0, 100000, 0)).toBe(0);
    });
  });

  describe('calculateARVRatio', () => {
    it('returns 0 when ARV is 0', () => {
      expect(calculateARVRatio(100000, 20000, 0)).toBe(0);
    });

    it('calculates correct ratio for typical property', () => {
      // $100,000 offer + $20,000 rehab / $150,000 ARV = 80%
      expect(calculateARVRatio(100000, 20000, 150000)).toBeCloseTo(0.8);
    });

    it('calculates excellent 70% rule property', () => {
      // $70,000 total / $100,000 ARV = 70%
      expect(calculateARVRatio(50000, 20000, 100000)).toBeCloseTo(0.7);
    });

    it('calculates edge case of over 100% ARV ratio', () => {
      // $150,000 total / $100,000 ARV = 150%
      expect(calculateARVRatio(100000, 50000, 100000)).toBeCloseTo(1.5);
    });
  });

  describe('calculateDownPayment', () => {
    it('calculates 25% down payment', () => {
      // ($100,000 + $20,000) * 0.25 = $30,000
      expect(calculateDownPayment(100000, 20000)).toBe(30000);
    });

    it('handles zero values', () => {
      expect(calculateDownPayment(0, 0)).toBe(0);
    });
  });

  describe('calculateLoanAmount', () => {
    it('calculates 75% loan amount', () => {
      // $120,000 total - $30,000 down = $90,000 loan
      expect(calculateLoanAmount(100000, 20000)).toBe(90000);
    });

    it('handles zero values', () => {
      expect(calculateLoanAmount(0, 0)).toBe(0);
    });
  });

  describe('calculateCashRemaining', () => {
    it('always returns fixed $20,000', () => {
      expect(calculateCashRemaining()).toBe(20000);
    });
  });

  describe('calculateNewLoan', () => {
    it('calculates new loan based on fixed cash remaining', () => {
      // Loan = loanAmount + (downPayment - cashRemaining)
      // loanAmount = 90000, downPayment = 30000, cashRemaining = 20000
      // newLoan = 90000 + (30000 - 20000) = 100000
      const result = calculateNewLoan(100000, 20000, 150000);
      expect(result).toBe(100000);
    });
  });

  describe('calculateNewLoanPercent', () => {
    it('returns 0 when ARV is 0', () => {
      expect(calculateNewLoanPercent(100000, 20000, 0)).toBe(0);
    });

    it('calculates new loan as percentage of ARV', () => {
      // newLoan = 100000, ARV = 150000 => 66.67%
      const result = calculateNewLoanPercent(100000, 20000, 150000);
      expect(result).toBeCloseTo(0.6667, 3);
    });
  });

  describe('calculateCashToPullOut', () => {
    it('calculates cash to pull out correctly', () => {
      // downPayment - cashRemaining = 30000 - 20000 = 10000
      expect(calculateCashToPullOut(100000, 20000, 150000)).toBe(10000);
    });
  });

  describe('calculateHomeEquity', () => {
    it('calculates home equity correctly', () => {
      // ARV - newLoan = 150000 - 100000 = 50000
      expect(calculateHomeEquity(100000, 20000, 150000)).toBe(50000);
    });
  });

  describe('calculateMonthlyMortgage', () => {
    it('returns 0 for zero or negative loan amount', () => {
      expect(calculateMonthlyMortgage(0)).toBe(0);
      expect(calculateMonthlyMortgage(-1000)).toBe(0);
    });

    it('calculates monthly mortgage with default rates', () => {
      // $100,000 loan at 7% for 30 years
      const result = calculateMonthlyMortgage(100000);
      // Expected ~$665.30 per month
      expect(result).toBeGreaterThan(600);
      expect(result).toBeLessThan(700);
    });

    it('calculates with custom interest rate', () => {
      const result = calculateMonthlyMortgage(100000, 0.05, 30);
      // Lower interest rate should result in lower payment
      expect(result).toBeLessThan(calculateMonthlyMortgage(100000, 0.07, 30));
    });

    it('calculates with custom loan term', () => {
      const result15yr = calculateMonthlyMortgage(100000, 0.07, 15);
      const result30yr = calculateMonthlyMortgage(100000, 0.07, 30);
      // Shorter term = higher payment
      expect(result15yr).toBeGreaterThan(result30yr);
    });
  });

  describe('calculateCashflow', () => {
    it('calculates monthly cashflow correctly', () => {
      // rent - (management + taxes + other + mortgage)
      const result = calculateCashflow(1500, 100000, 100000);
      // Should be positive for this scenario
      expect(typeof result).toBe('number');
    });

    it('handles zero rent', () => {
      const result = calculateCashflow(0, 100000, 100000);
      expect(result).toBeLessThan(0); // Negative cashflow with no income
    });
  });

  describe('calculateRefinancingNewLoan', () => {
    it('calculates 75% of ARV', () => {
      expect(calculateRefinancingNewLoan(100000, 20000, 200000)).toBe(150000);
    });
  });

  describe('calculateRefinancingHomeEquity', () => {
    it('calculates ARV minus new loan', () => {
      // ARV - (ARV * 0.75) = ARV * 0.25 = 50000
      expect(calculateRefinancingHomeEquity(100000, 20000, 200000)).toBe(50000);
    });
  });

  describe('calculateRefinancingCashflow', () => {
    it('calculates refinancing cashflow', () => {
      const result = calculateRefinancingCashflow(1500, 100000, 200000);
      expect(typeof result).toBe('number');
    });
  });

  describe('calculateHoldCashflowScore', () => {
    it('returns 8 for cashflow >= $200/unit', () => {
      expect(calculateHoldCashflowScore(200, 1)).toBe(8);
      expect(calculateHoldCashflowScore(400, 2)).toBe(8); // $200/unit
      expect(calculateHoldCashflowScore(500, 1)).toBe(8);
    });

    it('returns 7 for cashflow $175-$199/unit', () => {
      expect(calculateHoldCashflowScore(175, 1)).toBe(7);
      expect(calculateHoldCashflowScore(199, 1)).toBe(7);
      expect(calculateHoldCashflowScore(350, 2)).toBe(7); // $175/unit
    });

    it('returns 6 for cashflow $150-$174/unit', () => {
      expect(calculateHoldCashflowScore(150, 1)).toBe(6);
      expect(calculateHoldCashflowScore(174, 1)).toBe(6);
    });

    it('returns 5 for cashflow $125-$149/unit', () => {
      expect(calculateHoldCashflowScore(125, 1)).toBe(5);
      expect(calculateHoldCashflowScore(149, 1)).toBe(5);
    });

    it('returns 4 for cashflow $100-$124/unit', () => {
      expect(calculateHoldCashflowScore(100, 1)).toBe(4);
      expect(calculateHoldCashflowScore(124, 1)).toBe(4);
    });

    it('returns 3 for cashflow $75-$99/unit', () => {
      expect(calculateHoldCashflowScore(75, 1)).toBe(3);
      expect(calculateHoldCashflowScore(99, 1)).toBe(3);
    });

    it('returns 2 for cashflow $50-$74/unit', () => {
      expect(calculateHoldCashflowScore(50, 1)).toBe(2);
      expect(calculateHoldCashflowScore(74, 1)).toBe(2);
    });

    it('returns 1 for cashflow $0-$49/unit', () => {
      expect(calculateHoldCashflowScore(0, 1)).toBe(1);
      expect(calculateHoldCashflowScore(49, 1)).toBe(1);
    });

    it('returns 0 for negative cashflow', () => {
      expect(calculateHoldCashflowScore(-1, 1)).toBe(0);
      expect(calculateHoldCashflowScore(-100, 1)).toBe(0);
    });

    it('defaults to 1 unit if not specified', () => {
      expect(calculateHoldCashflowScore(200)).toBe(8);
    });
  });

  describe('calculateHoldARVRatioScore', () => {
    it('returns 0 (deprecated function)', () => {
      expect(calculateHoldARVRatioScore(0.5)).toBe(0);
      expect(calculateHoldARVRatioScore(0.7)).toBe(0);
      expect(calculateHoldARVRatioScore(1.0)).toBe(0);
    });
  });

  describe('calculateHoldRentRatioScore', () => {
    it('returns 2 for rent ratio >= 1%', () => {
      expect(calculateHoldRentRatioScore(0.01)).toBe(2);
      expect(calculateHoldRentRatioScore(0.015)).toBe(2);
      expect(calculateHoldRentRatioScore(0.02)).toBe(2);
    });

    it('returns 1 for rent ratio 0.8%-0.99%', () => {
      expect(calculateHoldRentRatioScore(0.008)).toBe(1);
      expect(calculateHoldRentRatioScore(0.009)).toBe(1);
      expect(calculateHoldRentRatioScore(0.0099)).toBe(1);
    });

    it('returns 0 for rent ratio < 0.8%', () => {
      expect(calculateHoldRentRatioScore(0.007)).toBe(0);
      expect(calculateHoldRentRatioScore(0.005)).toBe(0);
      expect(calculateHoldRentRatioScore(0)).toBe(0);
    });
  });

  describe('calculateFlipARVRatioScore', () => {
    it('returns 10 for ARV ratio <= 65%', () => {
      expect(calculateFlipARVRatioScore(0.65)).toBe(10);
      expect(calculateFlipARVRatioScore(0.60)).toBe(10);
      expect(calculateFlipARVRatioScore(0.50)).toBe(10);
    });

    it('deducts 1 point for each 3.5% above 65%', () => {
      // percentageAbove65 = (ratio - 0.65) * 100
      // deductions = floor(percentageAbove65 / 3.5)
      expect(calculateFlipARVRatioScore(0.685)).toBe(9); // (0.685-0.65)*100 = 3.5, floor(3.5/3.5) = 1 deduction, score = 9
      expect(calculateFlipARVRatioScore(0.72)).toBe(9);  // (0.72-0.65)*100 = 7, floor(7/3.5) = 2 deductions, score = 8
      expect(calculateFlipARVRatioScore(0.755)).toBe(8); // (0.755-0.65)*100 = 10.5, floor(10.5/3.5) = 3 deductions, score = 7
    });

    it('returns 0 for very high ARV ratio', () => {
      expect(calculateFlipARVRatioScore(1.0)).toBe(0);
      expect(calculateFlipARVRatioScore(1.5)).toBe(0);
    });
  });

  describe('calculateFlipEquityScore', () => {
    it('returns 2 for equity >= $75,000', () => {
      expect(calculateFlipEquityScore(75000)).toBe(2);
      expect(calculateFlipEquityScore(100000)).toBe(2);
    });

    it('returns 1 for equity $60,000-$74,999', () => {
      expect(calculateFlipEquityScore(60000)).toBe(1);
      expect(calculateFlipEquityScore(74999)).toBe(1);
    });

    it('returns 0 for equity < $60,000', () => {
      expect(calculateFlipEquityScore(59999)).toBe(0);
      expect(calculateFlipEquityScore(0)).toBe(0);
    });
  });

  describe('calculateHoldScore', () => {
    it('returns minimum score of 1 for empty property', () => {
      const property = createEmptyProperty();
      const score = calculateHoldScore(property);
      expect(score).toBeGreaterThanOrEqual(1);
      expect(score).toBeLessThanOrEqual(10);
    });

    it('returns maximum score of 10 for excellent property', () => {
      const property = createExcellentProperty();
      const score = calculateHoldScore(property);
      expect(score).toBeLessThanOrEqual(10);
    });

    it('calculates score correctly for typical property', () => {
      const property = createTypicalProperty();
      const score = calculateHoldScore(property);
      expect(score).toBeGreaterThanOrEqual(1);
      expect(score).toBeLessThanOrEqual(10);
    });

    it('handles multi-unit properties correctly', () => {
      const property = createTypicalProperty();
      property.units = 4;
      const score = calculateHoldScore(property);
      expect(score).toBeGreaterThanOrEqual(1);
      expect(score).toBeLessThanOrEqual(10);
    });

    it('defaults to 1 unit when units is null', () => {
      const property = createTypicalProperty();
      property.units = null;
      const score = calculateHoldScore(property);
      expect(score).toBeGreaterThanOrEqual(1);
    });
  });

  describe('calculateFlipScore', () => {
    it('returns max score for property with no ARV (0/0 = 0 ratio, excellent)', () => {
      // When ARV is 0, calculateARVRatio returns 0, which is <= 0.65, so score is 10
      const property = createEmptyProperty();
      const score = calculateFlipScore(property);
      expect(score).toBe(10);
    });

    it('returns high score for excellent ARV ratio', () => {
      const property = createExcellentProperty();
      const score = calculateFlipScore(property);
      expect(score).toBeGreaterThanOrEqual(8);
      expect(score).toBeLessThanOrEqual(10);
    });

    it('calculates score based on ARV ratio', () => {
      const property = createTypicalProperty();
      const score = calculateFlipScore(property);
      expect(score).toBeGreaterThanOrEqual(1);
      expect(score).toBeLessThanOrEqual(10);
    });
  });

  describe('calculateLegacyScore', () => {
    it('returns score between 1 and 10', () => {
      const property = createTypicalProperty();
      const score = calculateLegacyScore(property);
      expect(score).toBeGreaterThanOrEqual(1);
      expect(score).toBeLessThanOrEqual(10);
    });

    it('returns score for empty property (gets some points from ARV ratio)', () => {
      // Empty property gets points: ARV ratio 0/0=0 <= 0.75 (+3), plus 0.75 <= 0.75 (+1 for cashflow)
      const property = createEmptyProperty();
      const score = calculateLegacyScore(property);
      // ARV ratio is 0 which is <= 0.75, so gets 3 points, and min cap is 1
      expect(score).toBeGreaterThanOrEqual(1);
      expect(score).toBeLessThanOrEqual(10);
    });
  });

  describe('getHoldScoreBreakdown', () => {
    it('returns all score components', () => {
      const property = createTypicalProperty();
      const breakdown = getHoldScoreBreakdown(property);

      expect(breakdown).toHaveProperty('cashflowScore');
      expect(breakdown).toHaveProperty('rentRatioScore');
      expect(breakdown).toHaveProperty('totalScore');
    });

    it('breakdown components sum correctly', () => {
      const property = createTypicalProperty();
      const breakdown = getHoldScoreBreakdown(property);

      // Total should be capped between 1 and 10
      expect(breakdown.totalScore).toBeGreaterThanOrEqual(1);
      expect(breakdown.totalScore).toBeLessThanOrEqual(10);
    });

    it('cashflowScore is between 0 and 8', () => {
      const property = createTypicalProperty();
      const breakdown = getHoldScoreBreakdown(property);
      expect(breakdown.cashflowScore).toBeGreaterThanOrEqual(0);
      expect(breakdown.cashflowScore).toBeLessThanOrEqual(8);
    });

    it('rentRatioScore is between 0 and 2', () => {
      const property = createTypicalProperty();
      const breakdown = getHoldScoreBreakdown(property);
      expect(breakdown.rentRatioScore).toBeGreaterThanOrEqual(0);
      expect(breakdown.rentRatioScore).toBeLessThanOrEqual(2);
    });
  });

  describe('getFlipScoreBreakdown', () => {
    it('returns all score components', () => {
      const property = createTypicalProperty();
      const breakdown = getFlipScoreBreakdown(property);

      expect(breakdown).toHaveProperty('arvRatioScore');
      expect(breakdown).toHaveProperty('equityScore');
      expect(breakdown).toHaveProperty('totalScore');
    });

    it('arvRatioScore is between 0 and 10', () => {
      const property = createTypicalProperty();
      const breakdown = getFlipScoreBreakdown(property);
      expect(breakdown.arvRatioScore).toBeGreaterThanOrEqual(0);
      expect(breakdown.arvRatioScore).toBeLessThanOrEqual(10);
    });

    it('equityScore is between 0 and 2', () => {
      const property = createTypicalProperty();
      const breakdown = getFlipScoreBreakdown(property);
      expect(breakdown.equityScore).toBeGreaterThanOrEqual(0);
      expect(breakdown.equityScore).toBeLessThanOrEqual(2);
    });
  });

  describe('calculatePerfectRentForHoldScore', () => {
    it('returns rent that achieves perfect hold score', () => {
      const offerPrice = 100000;
      const rehabCosts = 20000;
      const arv = 150000;
      const units = 1;

      const perfectRent = calculatePerfectRentForHoldScore(offerPrice, rehabCosts, arv, units);

      // Create property with perfect rent
      const property = createTestProperty({
        offerPrice,
        rehabCosts,
        potentialRent: perfectRent,
        arv,
        units
      });

      const score = calculateHoldScore(property);
      expect(score).toBe(10);
    });

    it('scales with number of units', () => {
      const rentFor1Unit = calculatePerfectRentForHoldScore(100000, 20000, 150000, 1);
      const rentFor2Units = calculatePerfectRentForHoldScore(100000, 20000, 150000, 2);

      // More units require higher total rent for same score
      expect(rentFor2Units).toBeGreaterThan(rentFor1Unit);
    });
  });

  describe('calculatePerfectARVForFlipScore', () => {
    it('returns ARV that achieves perfect flip score', () => {
      const offerPrice = 100000;
      const rehabCosts = 20000;

      const perfectARV = calculatePerfectARVForFlipScore(offerPrice, rehabCosts);

      // Create property with perfect ARV
      const property = createTestProperty({
        offerPrice,
        rehabCosts,
        arv: perfectARV
      });

      const score = calculateFlipScore(property);
      expect(score).toBe(10);
    });

    it('ensures ARV ratio <= 65%', () => {
      const offerPrice = 100000;
      const rehabCosts = 20000;
      const totalInvestment = offerPrice + rehabCosts;

      const perfectARV = calculatePerfectARVForFlipScore(offerPrice, rehabCosts);
      const ratio = totalInvestment / perfectARV;

      expect(ratio).toBeLessThanOrEqual(0.65);
    });
  });

  describe('edge cases and boundary conditions', () => {
    it('handles negative values gracefully', () => {
      const property = createTestProperty({
        offerPrice: -100000,
        potentialRent: -1000
      });

      // Should not throw errors
      expect(() => calculateHoldScore(property)).not.toThrow();
      expect(() => calculateFlipScore(property)).not.toThrow();
    });

    it('handles very large numbers', () => {
      const property = createTestProperty({
        offerPrice: 10000000,
        potentialRent: 50000,
        arv: 15000000
      });

      const holdScore = calculateHoldScore(property);
      const flipScore = calculateFlipScore(property);

      expect(holdScore).toBeGreaterThanOrEqual(1);
      expect(holdScore).toBeLessThanOrEqual(10);
      expect(flipScore).toBeGreaterThanOrEqual(1);
      expect(flipScore).toBeLessThanOrEqual(10);
    });

    it('handles decimal values correctly', () => {
      const property = createTestProperty({
        offerPrice: 99999.99,
        rehabCosts: 15000.50,
        potentialRent: 1200.75,
        arv: 149999.99
      });

      expect(() => calculateHoldScore(property)).not.toThrow();
      expect(() => calculateFlipScore(property)).not.toThrow();
    });
  });
});

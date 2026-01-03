import {
  calculatePropertyCashFlow,
  calculatePropertyAssets,
  aggregateCashFlowData,
  aggregateAssetData,
  isOperationalProperty,
  formatCurrency,
  formatPercentage
} from '../portfolioAggregator';
import { Property } from '../../types/property';

// Mock property data for testing
const mockOperationalProperty: Property = {
  id: '1',
  address: '123 Test St',
  status: 'Operational',
  listingPrice: 200000,
  offerPrice: 180000,
  rehabCosts: 20000,
  potentialRent: 1800,
  arv: 250000,
  rentCastEstimates: {
    price: 200000,
    priceLow: 190000,
    priceHigh: 210000,
    rent: 1800,
    rentLow: 1700,
    rentHigh: 1900
  },
  todoMetaData: { todoistSectionId: null },
  hasRentcastData: true,
  notes: '',
  score: 7,
  zillowLink: '',
  squareFootage: 1800,
  units: 1,
  actualRent: 1850,
  currentHouseValue: 245000,
  currentLoanValue: 150000,
  propertyUnits: [],
  monthlyExpenses: {
    id: 'exp-1',
    propertyId: '1',
    mortgage: 800,
    taxes: 200,
    insurance: 100,
    propertyManagement: 150,
    utilities: 50,
    vacancy: 92,
    capEx: 92,
    other: 50,
    total: 1534,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  capitalCosts: null
};

const mockNonOperationalProperty: Property = {
  id: '2',
  address: '456 Test Ave',
  status: 'Opportunity',
  listingPrice: 150000,
  offerPrice: 140000,
  rehabCosts: 15000,
  potentialRent: 1500,
  arv: 190000,
  rentCastEstimates: {
    price: 150000,
    priceLow: 145000,
    priceHigh: 155000,
    rent: 1500,
    rentLow: 1400,
    rentHigh: 1600
  },
  todoMetaData: { todoistSectionId: null },
  hasRentcastData: true,
  notes: '',
  score: 6,
  zillowLink: '',
  squareFootage: 1400,
  units: 1,
  actualRent: 0,
  currentHouseValue: 0,
  currentLoanValue: null,
  propertyUnits: [],
  monthlyExpenses: null,
  capitalCosts: null
};

describe('portfolioAggregator', () => {
  describe('isOperationalProperty', () => {
    it('should identify operational properties correctly', () => {
      expect(isOperationalProperty('Operational')).toBe(true);
      expect(isOperationalProperty('Needs Tenant')).toBe(true);
      expect(isOperationalProperty('Selling')).toBe(true);
    });

    it('should identify non-operational properties correctly', () => {
      expect(isOperationalProperty('Opportunity')).toBe(false);
      expect(isOperationalProperty('Soft Offer')).toBe(false);
      expect(isOperationalProperty('Hard Offer')).toBe(false);
    });
  });

  describe('calculatePropertyCashFlow', () => {
    it('should calculate cash flow for operational property', () => {
      const result = calculatePropertyCashFlow(mockOperationalProperty);

      expect(result.id).toBe('1');
      expect(result.address).toBe('123 Test St');
      expect(result.isOperational).toBe(true);
      expect(result.currentRentIncome).toBe(1850); // actualRent > 0
      expect(result.currentExpenses.total).toBeGreaterThan(0);
      expect(result.currentNetCashFlow).toBe(result.currentRentIncome - result.currentExpenses.total);
    });

    it('should return zero values for non-operational property', () => {
      const result = calculatePropertyCashFlow(mockNonOperationalProperty);

      expect(result.id).toBe('2');
      expect(result.address).toBe('456 Test Ave');
      expect(result.isOperational).toBe(false);
      expect(result.currentRentIncome).toBe(0);
      expect(result.currentExpenses.total).toBe(0);
      expect(result.currentNetCashFlow).toBe(0);
    });

    it('should use potential rent when actual rent is zero', () => {
      const propertyWithPotentialRent = {
        ...mockOperationalProperty,
        actualRent: 0,
        potentialRent: 1700
      };

      const result = calculatePropertyCashFlow(propertyWithPotentialRent);
      expect(result.potentialRentIncome).toBe(1700);
    });
  });

  describe('calculatePropertyAssets', () => {
    it('should calculate assets for operational property', () => {
      const result = calculatePropertyAssets(mockOperationalProperty);

      expect(result.id).toBe('1');
      expect(result.address).toBe('123 Test St');
      expect(result.isOperational).toBe(true);
      expect(result.currentValue).toBe(245000); // currentHouseValue > 0
      expect(result.loanValue).toBe(150000); // currentLoanValue
      expect(result.equity).toBe(95000); // 245000 - 150000
      expect(result.equityPercent).toBeCloseTo(38.78, 2); // (95000 / 245000) * 100
    });

    it('should use ARV when current house value is zero', () => {
      const propertyWithoutCurrentValue = {
        ...mockOperationalProperty,
        currentHouseValue: 0
      };

      const result = calculatePropertyAssets(propertyWithoutCurrentValue);
      expect(result.currentValue).toBe(250000); // ARV
    });

    it('should calculate loan value for non-operational property', () => {
      const result = calculatePropertyAssets(mockNonOperationalProperty);

      expect(result.isOperational).toBe(false);
      expect(result.currentValue).toBe(190000); // ARV since currentHouseValue is 0
      expect(result.loanValue).toBe(0); // Non-operational
      expect(result.equity).toBe(190000);
      expect(result.equityPercent).toBe(100);
    });
  });

  describe('aggregateCashFlowData', () => {
    it('should aggregate multiple properties correctly', () => {
      const properties = [mockOperationalProperty, mockNonOperationalProperty];
      const result = aggregateCashFlowData(properties);

      expect(result.data).toBeDefined();
      expect(result.errors).toHaveLength(0);
      expect(result.hasWarnings).toBe(false);

      if (result.data) {
        expect(result.data.properties).toHaveLength(1); // Only operational property after filtering
        expect(result.data.summary.propertiesCount).toBe(1);
        expect(result.data.summary.operationalPropertiesCount).toBe(1);
        expect(result.data.summary.currentTotalRentIncome).toBe(1850); // Only operational property
      }
    });

    it('should handle empty properties array', () => {
      const result = aggregateCashFlowData([]);

      expect(result.data).toBeDefined();
      if (result.data) {
        expect(result.data.properties).toHaveLength(0);
        expect(result.data.summary.propertiesCount).toBe(0);
        expect(result.data.summary.currentTotalRentIncome).toBe(0);
      }
    });
  });

  describe('aggregateAssetData', () => {
    it('should aggregate asset data correctly', () => {
      const properties = [mockOperationalProperty, mockNonOperationalProperty];
      const result = aggregateAssetData(properties);

      expect(result.data).toBeDefined();
      expect(result.errors).toHaveLength(0);

      if (result.data) {
        expect(result.data.properties).toHaveLength(1); // Only operational property after filtering
        expect(result.data.summary.propertiesCount).toBe(1);
        expect(result.data.summary.operationalPropertiesCount).toBe(1);
        expect(result.data.summary.totalPropertyValue).toBe(245000); // Only operational property
        expect(result.data.summary.totalLoanValue).toBe(150000);
        expect(result.data.summary.totalEquity).toBe(95000); // 245000 - 150000
      }
    });
  });

  describe('formatCurrency', () => {
    it('should format currency correctly', () => {
      expect(formatCurrency(1234.56)).toBe('$1,235');
      expect(formatCurrency(0)).toBe('$0');
      expect(formatCurrency(-500)).toBe('-$500');
    });
  });

  describe('formatPercentage', () => {
    it('should format percentage correctly', () => {
      expect(formatPercentage(25.67)).toBe('25.7%');
      expect(formatPercentage(0)).toBe('0.0%');
      expect(formatPercentage(100)).toBe('100.0%');
    });
  });
});
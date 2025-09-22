import { PortfolioReportService } from '../portfolioReportService';
import { Property } from '../../types/property';

// Mock the dependencies
jest.mock('../PropertyService', () => ({
  getAllProperties: jest.fn()
}));

jest.mock('../mock/mockApi', () => ({
  getProperties: jest.fn()
}));

jest.mock('../../utils/portfolioAggregator', () => ({
  getCachedCashFlowReport: jest.fn(),
  getCachedAssetReport: jest.fn(),
  clearReportCache: jest.fn()
}));

import PropertyService from '../PropertyService';
import { getProperties } from '../mock/mockApi';
import { getCachedCashFlowReport, getCachedAssetReport, clearReportCache } from '../../utils/portfolioAggregator';

const mockPropertyService = PropertyService as jest.Mocked<typeof PropertyService>;
const mockGetProperties = getProperties as jest.MockedFunction<typeof getProperties>;
const mockGetCachedCashFlowReport = getCachedCashFlowReport as jest.MockedFunction<typeof getCachedCashFlowReport>;
const mockGetCachedAssetReport = getCachedAssetReport as jest.MockedFunction<typeof getCachedAssetReport>;
const mockClearReportCache = clearReportCache as jest.MockedFunction<typeof clearReportCache>;

// Mock property data
const mockProperties: Property[] = [
  {
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
    monthlyExpenses: null,
    capitalCosts: null
  }
];

const mockCashFlowReport = {
  properties: [{
    id: '1',
    address: '123 Test St',
    status: 'Operational',
    currentRentIncome: 1850,
    currentExpenses: {
      mortgage: 1200,
      propertyTax: 416,
      insurance: 130,
      propertyManagement: 222,
      maintenance: 92,
      vacancy: 148,
      other: 0,
      total: 2208
    },
    currentNetCashFlow: -358,
    potentialRentIncome: 1800,
    potentialExpenses: {
      mortgage: 1200,
      propertyTax: 416,
      insurance: 130,
      propertyManagement: 216,
      maintenance: 90,
      vacancy: 144,
      other: 0,
      total: 2196
    },
    potentialNetCashFlow: -396,
    isOperational: true
  }],
  summary: {
    currentTotalRentIncome: 1850,
    currentTotalExpenses: {
      mortgage: 1200,
      propertyTax: 416,
      insurance: 130,
      propertyManagement: 222,
      maintenance: 92,
      vacancy: 148,
      other: 0,
      total: 2208
    },
    currentTotalNetCashFlow: -358,
    potentialTotalRentIncome: 1800,
    potentialTotalExpenses: {
      mortgage: 1200,
      propertyTax: 416,
      insurance: 130,
      propertyManagement: 216,
      maintenance: 90,
      vacancy: 144,
      other: 0,
      total: 2196
    },
    potentialTotalNetCashFlow: -396,
    propertiesCount: 1,
    operationalPropertiesCount: 1
  },
  generatedAt: new Date()
};

const mockAssetReport = {
  properties: [{
    id: '1',
    address: '123 Test St',
    status: 'Operational',
    currentValue: 245000,
    loanValue: 150000,
    equity: 95000,
    equityPercent: 38.78,
    isOperational: true
  }],
  summary: {
    totalPropertyValue: 245000,
    totalLoanValue: 150000,
    totalEquity: 95000,
    averageEquityPercent: 38.78,
    propertiesCount: 1,
    operationalPropertiesCount: 1
  },
  generatedAt: new Date()
};

describe('PortfolioReportService', () => {
  let service: PortfolioReportService;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Set default environment before creating service
    process.env.REACT_APP_USE_MOCK_API = 'true';

    // Create new service instance
    service = new PortfolioReportService();
  });

  describe('generateCashFlowReport', () => {
    it('should generate cash flow report successfully', async () => {
      mockGetProperties.mockResolvedValue(mockProperties);
      mockGetCachedCashFlowReport.mockReturnValue({
        data: mockCashFlowReport,
        errors: [],
        hasWarnings: false
      });

      const result = await service.generateCashFlowReport();

      expect(result.data).toEqual(mockCashFlowReport);
      expect(result.errors).toHaveLength(0);
      expect(result.hasWarnings).toBe(false);
      expect(mockGetProperties).toHaveBeenCalledWith(false);
      expect(mockGetCachedCashFlowReport).toHaveBeenCalledWith(mockProperties);
    });

    it('should handle no properties', async () => {
      mockGetProperties.mockResolvedValue([]);

      const result = await service.generateCashFlowReport();

      expect(result.data).toBeUndefined();
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toBe('No active properties found for cash flow analysis');
      expect(result.hasWarnings).toBe(true);
    });

    it('should handle API errors', async () => {
      mockGetProperties.mockRejectedValue(new Error('API Error'));

      const result = await service.generateCashFlowReport();

      expect(result.data).toBeUndefined();
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toBe('Failed to generate cash flow report');
      expect(result.hasWarnings).toBe(true);
    });

    it('should filter out archived properties', async () => {
      const propertiesWithArchived = [
        ...mockProperties,
        { ...mockProperties[0], id: '2', archived: true }
      ];
      mockGetProperties.mockResolvedValue(propertiesWithArchived);
      mockGetCachedCashFlowReport.mockReturnValue({
        data: mockCashFlowReport,
        errors: [],
        hasWarnings: false
      });

      await service.generateCashFlowReport();

      // Should only pass non-archived properties to aggregator
      expect(mockGetCachedCashFlowReport).toHaveBeenCalledWith(mockProperties);
    });
  });

  describe('generateAssetReport', () => {
    it('should generate asset report successfully', async () => {
      mockGetProperties.mockResolvedValue(mockProperties);
      mockGetCachedAssetReport.mockReturnValue({
        data: mockAssetReport,
        errors: [],
        hasWarnings: false
      });

      const result = await service.generateAssetReport();

      expect(result.data).toEqual(mockAssetReport);
      expect(result.errors).toHaveLength(0);
      expect(result.hasWarnings).toBe(false);
      expect(mockGetCachedAssetReport).toHaveBeenCalledWith(mockProperties);
    });
  });

  describe('generateAllReports', () => {
    it('should generate both reports concurrently', async () => {
      mockGetProperties.mockResolvedValue(mockProperties);
      mockGetCachedCashFlowReport.mockReturnValue({
        data: mockCashFlowReport,
        errors: [],
        hasWarnings: false
      });
      mockGetCachedAssetReport.mockReturnValue({
        data: mockAssetReport,
        errors: [],
        hasWarnings: false
      });

      const result = await service.generateAllReports();

      expect(result.cashFlow.data).toEqual(mockCashFlowReport);
      expect(result.assets.data).toEqual(mockAssetReport);
      expect(result.cashFlow.errors).toHaveLength(0);
      expect(result.assets.errors).toHaveLength(0);
    });
  });

  describe('refreshReports', () => {
    it('should clear cache', () => {
      service.refreshReports();
      expect(mockClearReportCache).toHaveBeenCalled();
    });
  });

  describe('getPropertiesForReports', () => {
    it('should return properties without archived ones', async () => {
      const propertiesWithArchived = [
        ...mockProperties,
        { ...mockProperties[0], id: '2', archived: true }
      ];
      mockGetProperties.mockResolvedValue(propertiesWithArchived);

      const result = await service.getPropertiesForReports();

      expect(result).toEqual(mockProperties);
    });
  });

  describe('validatePropertyData', () => {
    it('should validate property data correctly', () => {
      const validProperty = mockProperties[0];
      const invalidProperty = {
        ...validProperty,
        id: '2',
        address: '',
        status: ''
      };

      const result = service.validatePropertyData([validProperty, invalidProperty]);

      expect(result.valid).toHaveLength(1);
      expect(result.invalid).toHaveLength(1);
      expect(result.warnings).toContain(': Missing address, Missing status');
    });
  });

  describe('exportToCsv', () => {
    it('should export cash flow report to CSV', () => {
      const csv = service.exportToCsv('cashflow', mockCashFlowReport);

      expect(csv).toContain('Address,Status,Current Monthly Rent');
      expect(csv).toContain('123 Test St,Operational,1850.00');
      expect(csv).toContain('TOTAL,,1850.00');
    });

    it('should export asset report to CSV', () => {
      const csv = service.exportToCsv('assets', mockAssetReport);

      expect(csv).toContain('Address,Status,Current Value');
      expect(csv).toContain('123 Test St,Operational,245000.00');
      expect(csv).toContain('TOTAL,,245000.00');
    });

    it('should return empty string for invalid data', () => {
      const csv = service.exportToCsv('cashflow', null);
      expect(csv).toBe('');
    });
  });

  describe('API switching', () => {
    it('should use PropertyService when mock API is disabled', async () => {
      process.env.REACT_APP_USE_MOCK_API = 'false';
      service = new PortfolioReportService(); // Recreate with new env

      mockPropertyService.getAllProperties.mockResolvedValue(mockProperties);
      mockGetCachedCashFlowReport.mockReturnValue({
        data: mockCashFlowReport,
        errors: [],
        hasWarnings: false
      });

      await service.generateCashFlowReport();

      expect(mockPropertyService.getAllProperties).toHaveBeenCalled();
      expect(mockGetProperties).not.toHaveBeenCalled();
    });

    it('should use mock API when enabled', async () => {
      process.env.REACT_APP_USE_MOCK_API = 'true';
      service = new PortfolioReportService(); // Recreate with new env

      mockGetProperties.mockResolvedValue(mockProperties);
      mockGetCachedCashFlowReport.mockReturnValue({
        data: mockCashFlowReport,
        errors: [],
        hasWarnings: false
      });

      await service.generateCashFlowReport();

      expect(mockGetProperties).toHaveBeenCalledWith(false);
      expect(mockPropertyService.getAllProperties).not.toHaveBeenCalled();
    });
  });
});
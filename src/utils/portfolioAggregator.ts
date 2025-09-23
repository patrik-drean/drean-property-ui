import { Property } from '../types/property';
import {
  PropertyCashFlowData,
  PropertyAssetData,
  CashFlowSummary,
  AssetSummary,
  PortfolioCashFlowReport,
  PortfolioAssetReport,
  ReportError,
  ReportGenerationResult,
  OPERATIONAL_STATUSES
} from '../types/portfolioReport';
// Note: We no longer calculate expenses - we use actual monthly expenses from property data

/**
 * Checks if a property is considered operational for reporting purposes
 */
export const isOperationalProperty = (status: string): boolean => {
  return OPERATIONAL_STATUSES.includes(status as any);
};

/**
 * Calculates monthly cash flow data for a single property (both current and potential scenarios)
 */
export const calculatePropertyCashFlow = (property: Property): PropertyCashFlowData => {
  const isOperational = isOperationalProperty(property.status);

  // For non-operational properties, all values are 0
  if (!isOperational) {
    return {
      id: property.id,
      address: property.address,
      status: property.status,
      currentRentIncome: 0,
      currentExpenses: {
        mortgage: 0,
        taxes: 0,
        insurance: 0,
        propertyManagement: 0,
        utilities: 0,
        vacancy: 0,
        capEx: 0,
        other: 0,
        total: 0
      },
      currentNetCashFlow: 0,
      potentialRentIncome: 0,
      potentialExpenses: {
        mortgage: 0,
        taxes: 0,
        insurance: 0,
        propertyManagement: 0,
        utilities: 0,
        vacancy: 0,
        capEx: 0,
        other: 0,
        total: 0
      },
      potentialNetCashFlow: 0,
      isOperational: false,
      operationalUnits: 0,
      behindRentUnits: 0,
      vacantUnits: 0
    };
  }

  // Current scenario: Use actual rent (0 if not set)
  const currentRentIncome = property.actualRent || 0;

  // Potential scenario: Use potential rent
  const potentialRentIncome = property.potentialRent || 0;

  // Use actual monthly expenses from property data if available
  const monthlyExpenses = property.monthlyExpenses || {
    mortgage: 0,
    taxes: 0,
    insurance: 0,
    propertyManagement: 0,
    utilities: 0,
    vacancy: 0,
    capEx: 0,
    other: 0,
    total: 0
  };

  // For both scenarios, use the same actual expenses from the property
  // The current vs potential scenarios only differ in rent income, not expenses
  const currentTotalExpenses = monthlyExpenses.total;
  const potentialTotalExpenses = monthlyExpenses.total;

  // Calculate unit status counts from propertyUnits array
  let operationalUnits = 0;
  let behindRentUnits = 0;
  let vacantUnits = 0;

  if (property.propertyUnits && property.propertyUnits.length > 0) {
    property.propertyUnits.forEach(unit => {
      switch (unit.status) {
        case 'Operational':
          operationalUnits++;
          break;
        case 'Behind On Rent':
          behindRentUnits++;
          break;
        case 'Vacant':
          vacantUnits++;
          break;
        default:
          // For any other status, count as operational
          operationalUnits++;
          break;
      }
    });
  } else {
    // If no unit data, use total units as operational for operational properties
    operationalUnits = property.units || 0;
  }

  return {
    id: property.id,
    address: property.address,
    status: property.status,
    currentRentIncome,
    currentExpenses: {
      mortgage: monthlyExpenses.mortgage,
      taxes: monthlyExpenses.taxes,
      insurance: monthlyExpenses.insurance,
      propertyManagement: monthlyExpenses.propertyManagement,
      utilities: monthlyExpenses.utilities,
      vacancy: monthlyExpenses.vacancy,
      capEx: monthlyExpenses.capEx,
      other: monthlyExpenses.other,
      total: currentTotalExpenses
    },
    currentNetCashFlow: currentRentIncome - currentTotalExpenses,
    potentialRentIncome,
    potentialExpenses: {
      mortgage: monthlyExpenses.mortgage,
      taxes: monthlyExpenses.taxes,
      insurance: monthlyExpenses.insurance,
      propertyManagement: monthlyExpenses.propertyManagement,
      utilities: monthlyExpenses.utilities,
      vacancy: monthlyExpenses.vacancy,
      capEx: monthlyExpenses.capEx,
      other: monthlyExpenses.other,
      total: potentialTotalExpenses
    },
    potentialNetCashFlow: potentialRentIncome - potentialTotalExpenses,
    isOperational: true,
    operationalUnits,
    behindRentUnits,
    vacantUnits
  };
};

/**
 * Calculates asset data for a single property
 */
export const calculatePropertyAssets = (property: Property): PropertyAssetData => {
  const isOperational = isOperationalProperty(property.status);

  // Use current house value if available, otherwise use ARV
  const currentValue = property.currentHouseValue > 0 ? property.currentHouseValue : property.arv;

  // Use current loan value if available, otherwise default to 0
  const loanValue = property.currentLoanValue !== null && property.currentLoanValue > 0
    ? property.currentLoanValue
    : 0;

  const equity = currentValue - loanValue;
  const equityPercent = currentValue > 0 ? (equity / currentValue) * 100 : 0;

  return {
    id: property.id,
    address: property.address,
    status: property.status,
    currentValue,
    loanValue,
    equity,
    equityPercent,
    isOperational
  };
};

/**
 * Aggregates cash flow data across all properties
 */
export const aggregateCashFlowData = (properties: Property[]): ReportGenerationResult<PortfolioCashFlowReport> => {
  const errors: ReportError[] = [];
  const propertyData: PropertyCashFlowData[] = [];

  // Filter out non-operational properties (Opportunity, Soft Offer, Hard Offer)
  const filteredProperties = properties.filter(property => 
    isOperationalProperty(property.status)
  );

  // Process each operational property
  for (const property of filteredProperties) {
    try {
      const cashFlowData = calculatePropertyCashFlow(property);
      propertyData.push(cashFlowData);
    } catch (error) {
      errors.push({
        message: 'Failed to calculate cash flow for property',
        propertyId: property.id,
        propertyAddress: property.address,
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Calculate summary totals for both scenarios
  const operationalProperties = propertyData.filter(p => p.isOperational);

  const summary: CashFlowSummary = {
    // Current scenario totals
    currentTotalRentIncome: propertyData.reduce((sum, p) => sum + p.currentRentIncome, 0),
    currentTotalExpenses: {
      mortgage: propertyData.reduce((sum, p) => sum + p.currentExpenses.mortgage, 0),
      taxes: propertyData.reduce((sum, p) => sum + p.currentExpenses.taxes, 0),
      insurance: propertyData.reduce((sum, p) => sum + p.currentExpenses.insurance, 0),
      propertyManagement: propertyData.reduce((sum, p) => sum + p.currentExpenses.propertyManagement, 0),
      utilities: propertyData.reduce((sum, p) => sum + p.currentExpenses.utilities, 0),
      vacancy: propertyData.reduce((sum, p) => sum + p.currentExpenses.vacancy, 0),
      capEx: propertyData.reduce((sum, p) => sum + p.currentExpenses.capEx, 0),
      other: propertyData.reduce((sum, p) => sum + p.currentExpenses.other, 0),
      total: propertyData.reduce((sum, p) => sum + p.currentExpenses.total, 0)
    },
    currentTotalNetCashFlow: propertyData.reduce((sum, p) => sum + p.currentNetCashFlow, 0),
    // Potential scenario totals
    potentialTotalRentIncome: propertyData.reduce((sum, p) => sum + p.potentialRentIncome, 0),
    potentialTotalExpenses: {
      mortgage: propertyData.reduce((sum, p) => sum + p.potentialExpenses.mortgage, 0),
      taxes: propertyData.reduce((sum, p) => sum + p.potentialExpenses.taxes, 0),
      insurance: propertyData.reduce((sum, p) => sum + p.potentialExpenses.insurance, 0),
      propertyManagement: propertyData.reduce((sum, p) => sum + p.potentialExpenses.propertyManagement, 0),
      utilities: propertyData.reduce((sum, p) => sum + p.potentialExpenses.utilities, 0),
      vacancy: propertyData.reduce((sum, p) => sum + p.potentialExpenses.vacancy, 0),
      capEx: propertyData.reduce((sum, p) => sum + p.potentialExpenses.capEx, 0),
      other: propertyData.reduce((sum, p) => sum + p.potentialExpenses.other, 0),
      total: propertyData.reduce((sum, p) => sum + p.potentialExpenses.total, 0)
    },
    potentialTotalNetCashFlow: propertyData.reduce((sum, p) => sum + p.potentialNetCashFlow, 0),
    propertiesCount: propertyData.length,
    operationalPropertiesCount: operationalProperties.length,
    // Calculate unit totals
    totalOperationalUnits: propertyData.reduce((sum, p) => sum + p.operationalUnits, 0),
    totalBehindRentUnits: propertyData.reduce((sum, p) => sum + p.behindRentUnits, 0),
    totalVacantUnits: propertyData.reduce((sum, p) => sum + p.vacantUnits, 0)
  };

  const report: PortfolioCashFlowReport = {
    properties: propertyData,
    summary,
    generatedAt: new Date()
  };

  return {
    data: report,
    errors,
    hasWarnings: errors.length > 0
  };
};

/**
 * Aggregates asset data across all properties
 */
export const aggregateAssetData = (properties: Property[]): ReportGenerationResult<PortfolioAssetReport> => {
  const errors: ReportError[] = [];
  const propertyData: PropertyAssetData[] = [];

  // Filter out non-operational properties (Opportunity, Soft Offer, Hard Offer)
  const filteredProperties = properties.filter(property => 
    isOperationalProperty(property.status)
  );

  // Process each operational property
  for (const property of filteredProperties) {
    try {
      const assetData = calculatePropertyAssets(property);
      propertyData.push(assetData);
    } catch (error) {
      errors.push({
        message: 'Failed to calculate assets for property',
        propertyId: property.id,
        propertyAddress: property.address,
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Calculate summary totals
  const operationalProperties = propertyData.filter(p => p.isOperational);
  const totalPropertyValue = propertyData.reduce((sum, p) => sum + p.currentValue, 0);
  const totalLoanValue = propertyData.reduce((sum, p) => sum + p.loanValue, 0);
  const totalEquity = propertyData.reduce((sum, p) => sum + p.equity, 0);

  const summary: AssetSummary = {
    totalPropertyValue,
    totalLoanValue,
    totalEquity,
    averageEquityPercent: totalPropertyValue > 0 ? (totalEquity / totalPropertyValue) * 100 : 0,
    propertiesCount: propertyData.length,
    operationalPropertiesCount: operationalProperties.length
  };

  const report: PortfolioAssetReport = {
    properties: propertyData,
    summary,
    generatedAt: new Date()
  };

  return {
    data: report,
    errors,
    hasWarnings: errors.length > 0
  };
};

/**
 * Formats currency values for display
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Math.round(value));
};

/**
 * Formats percentage values for display
 */
export const formatPercentage = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(value / 100);
};

/**
 * Memoization cache for report data
 */
interface ReportCache {
  cashFlow?: {
    data: PortfolioCashFlowReport;
    timestamp: number;
    propertiesHash: string;
  };
  assets?: {
    data: PortfolioAssetReport;
    timestamp: number;
    propertiesHash: string;
  };
}

let reportCache: ReportCache = {};

/**
 * Creates a hash of properties for cache invalidation
 */
const createPropertiesHash = (properties: Property[]): string => {
  return properties
    .map(p => `${p.id}-${p.address}-${p.status}-${p.actualRent}-${p.currentHouseValue}-${p.currentLoanValue}`)
    .join('|');
};

/**
 * Gets cached cash flow report or generates new one
 */
export const getCachedCashFlowReport = (properties: Property[]): ReportGenerationResult<PortfolioCashFlowReport> => {
  const propertiesHash = createPropertiesHash(properties);
  const cacheAge = Date.now() - (reportCache.cashFlow?.timestamp || 0);
  const cacheExpiry = 5 * 60 * 1000; // 5 minutes

  if (
    reportCache.cashFlow &&
    reportCache.cashFlow.propertiesHash === propertiesHash &&
    cacheAge < cacheExpiry
  ) {
    return {
      data: reportCache.cashFlow.data,
      errors: [],
      hasWarnings: false
    };
  }

  const result = aggregateCashFlowData(properties);
  if (result.data) {
    reportCache.cashFlow = {
      data: result.data,
      timestamp: Date.now(),
      propertiesHash
    };
  }

  return result;
};

/**
 * Gets cached asset report or generates new one
 */
export const getCachedAssetReport = (properties: Property[]): ReportGenerationResult<PortfolioAssetReport> => {
  const propertiesHash = createPropertiesHash(properties);
  const cacheAge = Date.now() - (reportCache.assets?.timestamp || 0);
  const cacheExpiry = 5 * 60 * 1000; // 5 minutes

  if (
    reportCache.assets &&
    reportCache.assets.propertiesHash === propertiesHash &&
    cacheAge < cacheExpiry
  ) {
    return {
      data: reportCache.assets.data,
      errors: [],
      hasWarnings: false
    };
  }

  const result = aggregateAssetData(properties);
  if (result.data) {
    reportCache.assets = {
      data: result.data,
      timestamp: Date.now(),
      propertiesHash
    };
  }

  return result;
};

/**
 * Clears the report cache
 */
export const clearReportCache = (): void => {
  reportCache = {};
};
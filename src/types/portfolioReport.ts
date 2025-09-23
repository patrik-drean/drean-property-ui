// Portfolio report type definitions

export interface PropertyCashFlowData {
  id: string;
  address: string;
  status: string;
  // Current scenario (using actual rent)
  currentRentIncome: number;
  currentExpenses: {
    mortgage: number;
    taxes: number;
    insurance: number;
    propertyManagement: number;
    utilities: number;
    vacancy: number;
    capEx: number;
    other: number;
    total: number;
  };
  currentNetCashFlow: number;
  // Potential scenario (using potential rent)
  potentialRentIncome: number;
  potentialExpenses: {
    mortgage: number;
    taxes: number;
    insurance: number;
    propertyManagement: number;
    utilities: number;
    vacancy: number;
    capEx: number;
    other: number;
    total: number;
  };
  potentialNetCashFlow: number;
  isOperational: boolean;
  // Unit status counts
  operationalUnits: number;
  behindRentUnits: number;
  vacantUnits: number;
}

export interface PropertyAssetData {
  id: string;
  address: string;
  status: string;
  currentValue: number;
  loanValue: number;
  equity: number;
  equityPercent: number;
  isOperational: boolean;
}

export interface CashFlowSummary {
  // Current scenario totals
  currentTotalRentIncome: number;
  currentTotalExpenses: {
    mortgage: number;
    taxes: number;
    insurance: number;
    propertyManagement: number;
    utilities: number;
    vacancy: number;
    capEx: number;
    other: number;
    total: number;
  };
  currentTotalNetCashFlow: number;
  // Potential scenario totals
  potentialTotalRentIncome: number;
  potentialTotalExpenses: {
    mortgage: number;
    taxes: number;
    insurance: number;
    propertyManagement: number;
    utilities: number;
    vacancy: number;
    capEx: number;
    other: number;
    total: number;
  };
  potentialTotalNetCashFlow: number;
  propertiesCount: number;
  operationalPropertiesCount: number;
  // Unit totals
  totalOperationalUnits: number;
  totalBehindRentUnits: number;
  totalVacantUnits: number;
}

export interface AssetSummary {
  totalPropertyValue: number;
  totalLoanValue: number;
  totalEquity: number;
  averageEquityPercent: number;
  propertiesCount: number;
  operationalPropertiesCount: number;
}

export interface PortfolioCashFlowReport {
  properties: PropertyCashFlowData[];
  summary: CashFlowSummary;
  generatedAt: Date;
}

export interface PortfolioAssetReport {
  properties: PropertyAssetData[];
  summary: AssetSummary;
  generatedAt: Date;
}

export interface ReportError {
  message: string;
  propertyId?: string;
  propertyAddress?: string;
  details?: string;
}

export interface ReportGenerationResult<T> {
  data?: T;
  errors: ReportError[];
  hasWarnings: boolean;
}

// Operational status categories for filtering - properties that generate or can generate income
export const OPERATIONAL_STATUSES = [
  'Operational',
  'Needs Tenant',
  'Selling',
  'Rehab',
  'Closed'
] as const;

// Non-operational statuses - properties in acquisition phase that should be excluded from reports
export const NON_OPERATIONAL_STATUSES = [
  'Opportunity',
  'Soft Offer',
  'Hard Offer'
] as const;

export type OperationalStatus = typeof OPERATIONAL_STATUSES[number];
export type NonOperationalStatus = typeof NON_OPERATIONAL_STATUSES[number];
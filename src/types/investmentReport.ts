import { Property } from './property';

export interface InvestmentReportData {
  property: Property;
  calculations: InvestmentCalculations;
  reportId: string;
  generatedAt: Date;
  sharedAt?: Date;
}

export interface InvestmentCalculations {
  // Investment Summary Section
  rentRatio: number;
  arvRatio: number;
  holdScore: number;
  flipScore: number;
  homeEquity: number;
  monthlyCashflow: number;

  // Investment Scores Analysis Section
  holdScoreBreakdown: HoldScoreBreakdown;
  flipScoreBreakdown: FlipScoreBreakdown;
  perfectRentForHoldScore: number;
  perfectARVForFlipScore: number;

  // Cash Flow Analysis Section
  monthlyIncome: number;
  monthlyExpenses: ExpenseBreakdown;
  netMonthlyCashflow: number;
  annualCashflow: number;

  // Financing Details Section
  purchasePrice: number;
  rehabCosts: number;
  totalInvestment: number;
  arv: number;
  newLoanAmount: number;
  downPaymentRequired: number;
  closingCosts: number;
  postRefinanceEquity: number;
  cashOnCashReturn: number;
}

export interface HoldScoreBreakdown {
  totalScore: number;
  cashflowScore: number;
  rentRatioScore: number;
  cashflowPerUnit: number;
  rentRatioPercentage: number;
}

export interface FlipScoreBreakdown {
  totalScore: number;
  arvRatioScore: number;
  equityScore: number;
  arvRatioPercentage: number;
  equityAmount: number;
}

export interface ExpenseBreakdown {
  mortgage: number;
  taxes: number;
  insurance: number;
  propertyManagement: number;
  utilities: number;
  vacancy: number;
  capEx: number;
  other: number;
  total: number;
}

export interface ReportError {
  field: string;
  message: string;
  severity: 'warning' | 'error';
}

export interface ShareableReportLink {
  reportId: string;
  url: string;
  propertyId: string;
  createdAt: Date;
  expiresAt?: Date;
  viewCount?: number;
}

export interface ReportSharingOptions {
  includeCharts?: boolean;
  allowPDFExport?: boolean;
  customBranding?: boolean;
}
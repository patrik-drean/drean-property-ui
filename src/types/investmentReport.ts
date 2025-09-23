import { Property } from './property';

export interface InvestmentSummaryData {
  property: Property;
  calculations: InvestmentCalculations;
  generatedAt: Date;
}

export interface InvestmentCalculations {
  // Investment Analysis
  rentRatio: number;
  arvRatio: number;
  holdScore: number;
  flipScore: number;
  holdScoreBreakdown: ScoreBreakdown;
  flipScoreBreakdown: ScoreBreakdown;

  // Financial Metrics
  homeEquity: number;
  monthlyCashflow: number;
  newLoan: number;

  // Capital Requirements
  totalCapitalRequired: number;
  downPayment: number;
  closingCosts: number;
  upfrontRepairs: number;
  otherCapitalCosts: number;

  // Returns Analysis
  annualCashflow: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  roiProjection: number;
}

export interface ScoreBreakdown {
  totalScore: number;
  cashflowScore?: number;
  rentRatioScore?: number;
  arvRatioScore?: number;
  equityScore?: number;
}

export interface ReportError {
  field: string;
  message: string;
  severity: 'warning' | 'error';
}

export interface InvestmentReportOptions {
  includePreview?: boolean;
  filename?: string;
  reportTitle?: string;
}
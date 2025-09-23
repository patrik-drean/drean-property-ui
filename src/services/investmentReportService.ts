import { Property } from '../types/property';
import {
  InvestmentReportData,
  InvestmentCalculations,
  ReportError,
  HoldScoreBreakdown,
  FlipScoreBreakdown,
  ExpenseBreakdown
} from '../types/investmentReport';
import {
  calculateRentRatio,
  calculateARVRatio,
  calculateNewLoan,
  calculateHomeEquity,
  calculateCashflow,
  calculateHoldScore,
  calculateFlipScore,
  getHoldScoreBreakdown,
  getFlipScoreBreakdown,
  calculatePerfectRentForHoldScore,
  calculatePerfectARVForFlipScore,
} from '../utils/scoreCalculator';

// Format currency for display
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

// Format percentage for display
export const formatPercentage = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
};

// Generate unique report ID
export const generateReportId = (): string => {
  return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Generate shareable report URL
export const generateReportUrl = (reportId: string): string => {
  const baseUrl = window.location.origin;
  return `${baseUrl}/#/reports/investment/${reportId}`;
};

// Validate property data and collect errors
export const validatePropertyData = (property: Property): ReportError[] => {
  const errors: ReportError[] = [];

  if (!property.address) {
    errors.push({ field: 'address', message: 'Property address is required', severity: 'error' });
  }

  if (!property.offerPrice || property.offerPrice <= 0) {
    errors.push({ field: 'offerPrice', message: 'Valid offer price is required', severity: 'error' });
  }

  if (!property.arv || property.arv <= 0) {
    errors.push({ field: 'arv', message: 'ARV is required for investment analysis', severity: 'error' });
  }

  if (!property.potentialRent || property.potentialRent <= 0) {
    errors.push({ field: 'potentialRent', message: 'Potential rent is required', severity: 'error' });
  }

  // Warnings for missing optional data
  if (!property.capitalCosts) {
    errors.push({ field: 'capitalCosts', message: 'Capital costs data missing - will use defaults', severity: 'warning' });
  }

  if (!property.monthlyExpenses) {
    errors.push({ field: 'monthlyExpenses', message: 'Monthly expenses data missing - will estimate', severity: 'warning' });
  }

  return errors;
};

// Calculate all investment metrics based on Investment Details tooltips
export const calculateInvestmentMetrics = (property: Property): InvestmentCalculations => {
  // Basic calculations
  const rentRatio = calculateRentRatio(property.potentialRent, property.offerPrice, property.rehabCosts);
  const arvRatio = calculateARVRatio(property.offerPrice, property.rehabCosts, property.arv);
  const newLoanAmount = calculateNewLoan(property.offerPrice, property.rehabCosts, property.arv);
  const homeEquity = calculateHomeEquity(property.offerPrice, property.rehabCosts, property.arv);
  const monthlyCashflow = calculateCashflow(property.potentialRent, property.offerPrice, newLoanAmount);

  // Investment scores
  const holdScore = calculateHoldScore(property);
  const flipScore = calculateFlipScore(property);
  const holdBreakdown = getHoldScoreBreakdown(property);
  const flipBreakdown = getFlipScoreBreakdown(property);

  // Perfect score calculations
  const perfectRentForHoldScore = calculatePerfectRentForHoldScore(
    property.offerPrice,
    property.rehabCosts,
    property.arv,
    property.units || 1
  );
  const perfectARVForFlipScore = calculatePerfectARVForFlipScore(
    property.offerPrice,
    property.rehabCosts
  );

  // Hold Score Breakdown
  const holdScoreBreakdown: HoldScoreBreakdown = {
    totalScore: holdBreakdown.totalScore,
    cashflowScore: holdBreakdown.cashflowScore || 0,
    rentRatioScore: holdBreakdown.rentRatioScore || 0,
    cashflowPerUnit: monthlyCashflow / (property.units || 1),
    rentRatioPercentage: rentRatio,
  };

  // Flip Score Breakdown
  const flipScoreBreakdown: FlipScoreBreakdown = {
    totalScore: flipBreakdown.totalScore,
    arvRatioScore: flipBreakdown.arvRatioScore || 0,
    equityScore: flipBreakdown.equityScore || 0,
    arvRatioPercentage: arvRatio,
    equityAmount: homeEquity,
  };

  // Monthly Expenses Breakdown
  const monthlyExpenses: ExpenseBreakdown = {
    mortgage: property.monthlyExpenses?.mortgage || 0,
    taxes: property.monthlyExpenses?.taxes || 0,
    insurance: property.monthlyExpenses?.insurance || 0,
    propertyManagement: property.monthlyExpenses?.propertyManagement || 0,
    utilities: property.monthlyExpenses?.utilities || 0,
    vacancy: property.monthlyExpenses?.vacancy || 0,
    capEx: property.monthlyExpenses?.capEx || 0,
    other: property.monthlyExpenses?.other || 0,
    total: property.monthlyExpenses?.total || 0,
  };

  // Financing Details
  const purchasePrice = property.offerPrice;
  const rehabCosts = property.rehabCosts;
  const totalInvestment = purchasePrice + rehabCosts;
  const downPaymentRequired = property.capitalCosts?.downPayment || (totalInvestment * 0.25); // Assume 25% if not specified
  const closingCosts = property.capitalCosts?.closingCosts || (purchasePrice * 0.02); // Assume 2% if not specified
  const postRefinanceEquity = homeEquity;
  const cashOnCashReturn = downPaymentRequired > 0 ? (monthlyCashflow * 12) / downPaymentRequired : 0;

  return {
    // Investment Summary Section
    rentRatio,
    arvRatio,
    holdScore,
    flipScore,
    homeEquity,
    monthlyCashflow,

    // Investment Scores Analysis Section
    holdScoreBreakdown,
    flipScoreBreakdown,
    perfectRentForHoldScore,
    perfectARVForFlipScore,

    // Cash Flow Analysis Section
    monthlyIncome: property.potentialRent,
    monthlyExpenses,
    netMonthlyCashflow: monthlyCashflow,
    annualCashflow: monthlyCashflow * 12,

    // Financing Details Section
    purchasePrice,
    rehabCosts,
    totalInvestment,
    arv: property.arv,
    newLoanAmount,
    downPaymentRequired,
    closingCosts,
    postRefinanceEquity,
    cashOnCashReturn,
  };
};

// Prepare report data for web sharing
export const prepareReportData = (property: Property): InvestmentReportData => {
  const calculations = calculateInvestmentMetrics(property);
  const reportId = generateReportId();

  return {
    property,
    calculations,
    reportId,
    generatedAt: new Date(),
  };
};

// Get score color based on score value (for web display)
export const getScoreColor = (score: number): string => {
  if (score >= 9) return '#4CAF50'; // Green
  if (score >= 7) return '#FFC107'; // Yellow/Orange
  if (score >= 5) return '#FF9800'; // Orange
  return '#F44336'; // Red
};

// Get metric color for positive/negative values
export const getMetricColor = (value: number, isPositive: boolean = true): string => {
  if (value === 0) return '#757575'; // Gray
  return (isPositive ? value > 0 : value < 0) ? '#4CAF50' : '#F44336';
};

// Generate filename for PDF exports (when needed)
export const generateFilename = (address: string): string => {
  const today = new Date().toISOString().split('T')[0];
  const sanitizedAddress = address
    .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .trim();

  return `Investment-Summary-${sanitizedAddress}-${today}.pdf`;
};
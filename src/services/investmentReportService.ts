import jsPDF from 'jspdf';
import { Property } from '../types/property';
import { InvestmentSummaryData, InvestmentCalculations, ReportError } from '../types/investmentReport';
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

// Sanitize address for filename
const sanitizeForFilename = (text: string): string => {
  return text.replace(/[^a-z0-9]/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
};

// Generate report filename
export const generateFilename = (address: string): string => {
  const sanitizedAddress = sanitizeForFilename(address);
  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return `Investment-Summary-${sanitizedAddress}-${date}.pdf`;
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

// Calculate all investment metrics
export const calculateInvestmentMetrics = (property: Property): InvestmentCalculations => {
  const rentRatio = calculateRentRatio(property.potentialRent, property.offerPrice, property.rehabCosts);
  const arvRatio = calculateARVRatio(property.offerPrice, property.rehabCosts, property.arv);
  const newLoan = calculateNewLoan(property.offerPrice, property.rehabCosts, property.arv);
  const homeEquity = calculateHomeEquity(property.offerPrice, property.rehabCosts, property.arv);
  const monthlyCashflow = calculateCashflow(property.potentialRent, property.offerPrice, newLoan);

  const holdScore = calculateHoldScore(property);
  const flipScore = calculateFlipScore(property);
  const holdScoreBreakdown = getHoldScoreBreakdown(property);
  const flipScoreBreakdown = getFlipScoreBreakdown(property);

  // Capital requirements
  const downPayment = property.capitalCosts?.downPayment || 0;
  const closingCosts = property.capitalCosts?.closingCosts || 0;
  const upfrontRepairs = property.capitalCosts?.upfrontRepairs || property.rehabCosts;
  const otherCapitalCosts = property.capitalCosts?.other || 0;
  const totalCapitalRequired = downPayment + closingCosts + upfrontRepairs + otherCapitalCosts;

  // Returns analysis
  const annualCashflow = monthlyCashflow * 12;
  const monthlyIncome = property.potentialRent;
  const monthlyExpenses = property.monthlyExpenses?.total || 0;
  const roiProjection = totalCapitalRequired > 0 ? (annualCashflow / totalCapitalRequired) : 0;

  return {
    rentRatio,
    arvRatio,
    holdScore,
    flipScore,
    holdScoreBreakdown,
    flipScoreBreakdown,
    homeEquity,
    monthlyCashflow,
    newLoan,
    totalCapitalRequired,
    downPayment,
    closingCosts,
    upfrontRepairs,
    otherCapitalCosts,
    annualCashflow,
    monthlyIncome,
    monthlyExpenses,
    roiProjection,
  };
};

// Prepare report data
export const prepareReportData = (property: Property): InvestmentSummaryData => {
  const calculations = calculateInvestmentMetrics(property);

  return {
    property,
    calculations,
    generatedAt: new Date(),
  };
};

// Color definitions matching theme
const COLORS = {
  header: '#2E7D32',
  sectionHeader: '#1976D2',
  positive: '#4CAF50',
  negative: '#F44336',
  neutral: '#212121',
  light: '#757575',
  background: '#f8f9fa',
};

// Get color based on value (for metrics)
const getMetricColor = (value: number, isPositive: boolean = true): string => {
  if (value === 0) return COLORS.neutral;
  return (isPositive ? value > 0 : value < 0) ? COLORS.positive : COLORS.negative;
};

// Get score color based on score value
const getScoreColor = (score: number): string => {
  if (score >= 9) return COLORS.positive;
  if (score >= 7) return '#FFC107';
  if (score >= 5) return '#FF9800';
  return COLORS.negative;
};

// Generate PDF report
export const generateInvestmentSummaryPDF = async (data: InvestmentSummaryData): Promise<void> => {
  const { property, calculations } = data;

  // Create PDF with letter size
  const pdf = new jsPDF('portrait', 'in', 'letter');
  const pageWidth = 8.5;
  const pageHeight = 11;
  const margin = 0.75;
  const contentWidth = pageWidth - (margin * 2);

  let yPosition = margin;

  // Helper function to add text with color
  const addText = (text: string, x: number, y: number, options: {
    fontSize?: number;
    fontWeight?: 'normal' | 'bold';
    color?: string;
    align?: 'left' | 'center' | 'right';
  } = {}) => {
    const { fontSize = 10, fontWeight = 'normal', color = COLORS.neutral, align = 'left' } = options;

    pdf.setFontSize(fontSize);
    pdf.setFont('helvetica', fontWeight);
    pdf.setTextColor(color);

    if (align === 'center') {
      pdf.text(text, x, y, { align: 'center' });
    } else if (align === 'right') {
      pdf.text(text, x, y, { align: 'right' });
    } else {
      pdf.text(text, x, y);
    }
  };

  // Helper function to add section header
  const addSectionHeader = (title: string, y: number): number => {
    addText(title, margin, y, { fontSize: 12, fontWeight: 'bold', color: COLORS.sectionHeader });
    return y + 0.25;
  };

  // Header Section
  addText('INVESTMENT SUMMARY REPORT', pageWidth / 2, yPosition, {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.header,
    align: 'center'
  });
  yPosition += 0.3;

  addText(property.address, pageWidth / 2, yPosition, {
    fontSize: 14,
    fontWeight: 'bold',
    align: 'center'
  });
  yPosition += 0.2;

  addText(`Status: ${property.status}`, pageWidth / 2, yPosition, {
    fontSize: 10,
    align: 'center'
  });
  yPosition += 0.1;

  addText(`Generated: ${data.generatedAt.toLocaleDateString()}`, pageWidth / 2, yPosition, {
    fontSize: 8,
    color: COLORS.light,
    align: 'center'
  });
  yPosition += 0.4;

  // Section 1: Property Overview
  yPosition = addSectionHeader('Property Overview', yPosition);
  const col1 = margin;
  const col2 = margin + contentWidth / 3;
  const col3 = margin + (contentWidth * 2 / 3);

  addText('Square Footage:', col1, yPosition, { fontWeight: 'bold' });
  addText(property.squareFootage?.toLocaleString() || 'N/A', col1 + 1.2, yPosition);

  addText('Units:', col2, yPosition, { fontWeight: 'bold' });
  addText(property.units?.toString() || 'N/A', col2 + 0.8, yPosition);

  addText('Current Value:', col3, yPosition, { fontWeight: 'bold' });
  addText(formatCurrency(property.currentHouseValue || property.arv), col3 + 1.2, yPosition);
  yPosition += 0.35;

  // Section 2: Investment Analysis
  yPosition = addSectionHeader('Investment Analysis', yPosition);

  addText('Offer Price:', col1, yPosition, { fontWeight: 'bold' });
  addText(formatCurrency(property.offerPrice), col1 + 1.2, yPosition);

  addText('Rehab Costs:', col2, yPosition, { fontWeight: 'bold' });
  addText(formatCurrency(property.rehabCosts), col2 + 1.2, yPosition);

  addText('ARV:', col3, yPosition, { fontWeight: 'bold' });
  addText(formatCurrency(property.arv), col3 + 1.2, yPosition);
  yPosition += 0.2;

  addText('Potential Rent:', col1, yPosition, { fontWeight: 'bold' });
  addText(formatCurrency(property.potentialRent), col1 + 1.2, yPosition);

  addText('Rent Ratio:', col2, yPosition, { fontWeight: 'bold' });
  addText(formatPercentage(calculations.rentRatio), col2 + 1.2, yPosition, {
    color: calculations.rentRatio >= 0.01 ? COLORS.positive : COLORS.negative
  });

  addText('ARV Ratio:', col3, yPosition, { fontWeight: 'bold' });
  addText(formatPercentage(calculations.arvRatio), col3 + 1.2, yPosition, {
    color: calculations.arvRatio <= 0.80 ? COLORS.positive : COLORS.negative
  });
  yPosition += 0.35;

  // Investment Scores
  addText('Hold Score:', col1, yPosition, { fontWeight: 'bold' });
  addText(`${calculations.holdScore}/10`, col1 + 1.2, yPosition, {
    color: getScoreColor(calculations.holdScore),
    fontWeight: 'bold'
  });

  addText('Flip Score:', col2, yPosition, { fontWeight: 'bold' });
  addText(`${calculations.flipScore}/10`, col2 + 1.2, yPosition, {
    color: getScoreColor(calculations.flipScore),
    fontWeight: 'bold'
  });
  yPosition += 0.35;

  // Section 3: Financial Metrics
  yPosition = addSectionHeader('Financial Metrics', yPosition);

  addText('Home Equity:', col1, yPosition, { fontWeight: 'bold' });
  addText(formatCurrency(calculations.homeEquity), col1 + 1.2, yPosition, {
    color: getMetricColor(calculations.homeEquity)
  });

  addText('Monthly Cashflow:', col2, yPosition, { fontWeight: 'bold' });
  addText(formatCurrency(calculations.monthlyCashflow), col2 + 1.2, yPosition, {
    color: getMetricColor(calculations.monthlyCashflow)
  });

  addText('Annual Cashflow:', col3, yPosition, { fontWeight: 'bold' });
  addText(formatCurrency(calculations.annualCashflow), col3 + 1.2, yPosition, {
    color: getMetricColor(calculations.annualCashflow)
  });
  yPosition += 0.35;

  // Section 4: Capital Requirements
  yPosition = addSectionHeader('Capital Requirements', yPosition);

  addText('Down Payment:', col1, yPosition, { fontWeight: 'bold' });
  addText(formatCurrency(calculations.downPayment), col1 + 1.2, yPosition);

  addText('Closing Costs:', col2, yPosition, { fontWeight: 'bold' });
  addText(formatCurrency(calculations.closingCosts), col2 + 1.2, yPosition);

  addText('Upfront Repairs:', col3, yPosition, { fontWeight: 'bold' });
  addText(formatCurrency(calculations.upfrontRepairs), col3 + 1.2, yPosition);
  yPosition += 0.2;

  addText('Other Costs:', col1, yPosition, { fontWeight: 'bold' });
  addText(formatCurrency(calculations.otherCapitalCosts), col1 + 1.2, yPosition);

  addText('Total Capital:', col2, yPosition, { fontWeight: 'bold', fontSize: 11 });
  addText(formatCurrency(calculations.totalCapitalRequired), col2 + 1.2, yPosition, {
    fontWeight: 'bold',
    fontSize: 11,
    color: COLORS.sectionHeader
  });
  yPosition += 0.35;

  // Section 5: Returns Analysis
  yPosition = addSectionHeader('Returns Analysis', yPosition);

  addText('Monthly Income:', col1, yPosition, { fontWeight: 'bold' });
  addText(formatCurrency(calculations.monthlyIncome), col1 + 1.2, yPosition, {
    color: COLORS.positive
  });

  addText('Monthly Expenses:', col2, yPosition, { fontWeight: 'bold' });
  addText(formatCurrency(calculations.monthlyExpenses), col2 + 1.2, yPosition, {
    color: COLORS.negative
  });

  addText('ROI Projection:', col3, yPosition, { fontWeight: 'bold' });
  addText(formatPercentage(calculations.roiProjection), col3 + 1.2, yPosition, {
    color: getMetricColor(calculations.roiProjection),
    fontWeight: 'bold'
  });
  yPosition += 0.5;

  // Footer
  const footerY = pageHeight - margin - 0.3;
  addText('Generated by PropGuide Investment Analysis Platform', pageWidth / 2, footerY, {
    fontSize: 8,
    color: COLORS.light,
    align: 'center'
  });

  // Save PDF
  const filename = generateFilename(property.address);
  pdf.save(filename);
};

// Main service function to generate and download report
export const generateInvestmentSummary = async (property: Property): Promise<void> => {
  try {
    // Validate data
    const errors = validatePropertyData(property);
    const hasErrors = errors.some(error => error.severity === 'error');

    if (hasErrors) {
      const errorMessages = errors
        .filter(error => error.severity === 'error')
        .map(error => error.message)
        .join(', ');
      throw new Error(`Cannot generate report: ${errorMessages}`);
    }

    // Prepare data
    const reportData = prepareReportData(property);

    // Generate PDF
    await generateInvestmentSummaryPDF(reportData);

  } catch (error) {
    console.error('Error generating investment summary:', error);
    throw error;
  }
};
import { Property } from '../types/property';

// Base calculation functions
export const calculateRentRatio = (rent: number, offerPrice: number, rehabCosts: number) => {
  const totalInvestment = offerPrice + rehabCosts;
  if (!totalInvestment) return 0;
  return rent / totalInvestment;
};

export const calculateARVRatio = (offerPrice: number, rehabCosts: number, arv: number) => {
  if (!arv) return 0;
  return (offerPrice + rehabCosts) / arv;
};

export const calculateDownPayment = (offerPrice: number, rehabCosts: number) => {
  return (offerPrice + rehabCosts) * 0.25;
};

export const calculateLoanAmount = (offerPrice: number, rehabCosts: number) => {
  const downPayment = calculateDownPayment(offerPrice, rehabCosts);
  return (offerPrice + rehabCosts) - downPayment;
};

export const calculateCashRemaining = () => {
  // Fixed at $20,000
  return 20000;
};

export const calculateNewLoan = (offerPrice: number, rehabCosts: number, arv: number) => {
  // Instead of using a fixed 75% of ARV, calculate based on fixed cash remaining
  const downPayment = calculateDownPayment(offerPrice, rehabCosts);
  const loanAmount = calculateLoanAmount(offerPrice, rehabCosts);
  return loanAmount + (downPayment - calculateCashRemaining());
};

export const calculateNewLoanPercent = (offerPrice: number, rehabCosts: number, arv: number) => {
  if (!arv) return 0;
  const newLoan = calculateNewLoan(offerPrice, rehabCosts, arv);
  return newLoan / arv;
};

export const calculateCashToPullOut = (offerPrice: number, rehabCosts: number, arv: number) => {
  const downPayment = calculateDownPayment(offerPrice, rehabCosts);
  // Cash to pull out is downPayment minus fixed cash remaining
  return downPayment - calculateCashRemaining();
};

export const calculateHomeEquity = (offerPrice: number, rehabCosts: number, arv: number) => {
  const newLoan = calculateNewLoan(offerPrice, rehabCosts, arv);
  return arv - newLoan;
};

export const calculateMonthlyMortgage = (loanAmount: number, interestRate = 0.07, loanTermYears = 30) => {
  const monthlyRate = interestRate / 12;
  const numberOfPayments = loanTermYears * 12;
  
  if (loanAmount <= 0) return 0;
  
  // Mortgage formula: P * (r(1+r)^n) / ((1+r)^n - 1)
  return loanAmount * 
    (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / 
    (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
};

export const calculateCashflow = (rent: number, offerPrice: number, newLoanAmount: number) => {
  // 12% of rent for property management and other fees
  const managementFees = rent * 0.12;
  
  // 2.5% of offer price for taxes (annually), divided by 12 for monthly
  const propertyTaxes = (offerPrice * 0.025) / 12;
  
  // Fixed $130 for insurance and lawn care
  const otherExpenses = 130;
  
  // Monthly mortgage payment on the new loan
  const mortgagePayment = calculateMonthlyMortgage(newLoanAmount);
  
  // Total expenses
  const totalExpenses = managementFees + propertyTaxes + otherExpenses + mortgagePayment;
  
  // Cashflow: rent - expenses
  return rent - totalExpenses;
};

// Separate functions for refinancing calculations (original simple method)
export const calculateRefinancingNewLoan = (offerPrice: number, rehabCosts: number, arv: number) => {
  return arv * 0.75;
};

export const calculateRefinancingHomeEquity = (offerPrice: number, rehabCosts: number, arv: number) => {
  return arv - calculateRefinancingNewLoan(offerPrice, rehabCosts, arv);
};

export const calculateRefinancingCashflow = (rent: number, offerPrice: number, arv: number) => {
  const newLoanAmount = calculateRefinancingNewLoan(offerPrice, 0, arv); // Using 0 for rehab costs in refinancing
  const monthlyMortgage = calculateMonthlyMortgage(newLoanAmount);
  const propertyManagement = rent * 0.12;
  const propertyTaxes = (offerPrice * 0.025) / 12;
  const otherExpenses = 130;
  return rent - propertyManagement - propertyTaxes - otherExpenses - monthlyMortgage;
};

// Hold Score calculation functions
export const calculateHoldCashflowScore = (cashflow: number, units: number = 1): number => {
  const cashflowPerUnit = cashflow / units;
  if (cashflowPerUnit >= 200) return 5; // $200 or more per unit
  if (cashflowPerUnit >= 175) return 4; // $175-$199 per unit
  if (cashflowPerUnit >= 150) return 3; // $150-$199 per unit
  if (cashflowPerUnit >= 100) return 2; // $100-$149 per unit
  if (cashflowPerUnit >= 0) return 1;   // $0-$99 per unit
  return 0; // Negative cashflow
};

export const calculateHoldARVRatioScore = (arvRatio: number): number => {
  if (arvRatio <= 0.75) return 3; // 75% or lower is good
  if (arvRatio <= 0.80) return 2; // 76-80%
  if (arvRatio <= 0.85) return 1; // 81-85%
  return 0; // > 85%
};

export const calculateHoldRentRatioScore = (rentRatio: number): number => {
  if (rentRatio >= 0.01) return 2; // 1% or higher
  if (rentRatio >= 0.008) return 1; // 0.8% or higher
  return 0; // < 0.8%
};

// Flip Score calculation functions
export const calculateFlipARVRatioScore = (arvRatio: number): number => {
  if (arvRatio <= 0.65) return 8; // 65% or lower gets full points
  
  // Deduct 1 point for each 2.5% increment above 65%
  const percentageAbove65 = (arvRatio - 0.65) * 100;
  const deductions = Math.floor(percentageAbove65 / 2.5);
  const score = 8 - deductions;
  
  return Math.max(0, score); // Ensure score doesn't go below 0
};

export const calculateFlipEquityScore = (homeEquity: number): number => {
  if (homeEquity >= 75000) return 2; // $75k or more
  if (homeEquity >= 60000) return 1; // $60k-$74,999
  return 0; // < $60k
};

// Main score calculation functions
export const calculateHoldScore = (property: Omit<Property, 'id'>): number => {
  const rentRatio = calculateRentRatio(property.potentialRent, property.offerPrice, property.rehabCosts);
  const arvRatio = calculateARVRatio(property.offerPrice, property.rehabCosts, property.arv);
  const cashflow = calculateCashflow(
    property.potentialRent, 
    property.offerPrice, 
    calculateNewLoan(property.offerPrice, property.rehabCosts, property.arv)
  );

  const cashflowScore = calculateHoldCashflowScore(cashflow, property.units || 1);
  const arvRatioScore = calculateHoldARVRatioScore(arvRatio);
  const rentRatioScore = calculateHoldRentRatioScore(rentRatio);

  const totalScore = cashflowScore + arvRatioScore + rentRatioScore;
  
  // Ensure minimum score of 1, maximum of 10
  return Math.min(10, Math.max(1, totalScore));
};

export const calculateFlipScore = (property: Omit<Property, 'id'>): number => {
  const arvRatio = calculateARVRatio(property.offerPrice, property.rehabCosts, property.arv);
  const homeEquity = calculateHomeEquity(property.offerPrice, property.rehabCosts, property.arv);

  const arvRatioScore = calculateFlipARVRatioScore(arvRatio);
  const equityScore = calculateFlipEquityScore(homeEquity);

  const totalScore = arvRatioScore + equityScore;
  
  // Ensure minimum score of 1, maximum of 10
  return Math.min(10, Math.max(1, totalScore));
};

// Legacy score calculation (for backward compatibility)
export const calculateLegacyScore = (property: Omit<Property, 'id'>): number => {
  const rentRatio = calculateRentRatio(property.potentialRent, property.offerPrice, property.rehabCosts);
  const arvRatio = calculateARVRatio(property.offerPrice, property.rehabCosts, property.arv);
  const homeEquity = calculateHomeEquity(property.offerPrice, property.rehabCosts, property.arv);
  const cashflow = calculateCashflow(
    property.potentialRent, 
    property.offerPrice, 
    calculateNewLoan(property.offerPrice, property.rehabCosts, property.arv)
  );

  // Legacy scoring logic
  let score = 0;
  
  // Rent to price ratio (3 points)
  if (rentRatio >= 0.01) score += 3; // 1% or higher
  else if (rentRatio >= 0.008) score += 2; // Close to 1%
  else if (rentRatio >= 0.006) score += 1; // Getting there

  // ARV ratio (3 points)
  if (arvRatio <= 0.75) score += 3; // 75% or lower is good
  else if (arvRatio <= 0.80) score += 2;
  else if (arvRatio <= 0.85) score += 1;

  // Home Equity (1 point)
  if (homeEquity >= 60000) score += 1;
  
  // Cashflow (3 points)
  if (cashflow >= 200) score += 3; // $200 or more monthly cashflow
  else if (cashflow >= 100) score += 2; // $100-$199 monthly cashflow
  else if (cashflow >= 0) score += 1; // $0-$99 monthly cashflow

  // Ensure minimum score of 1, maximum of 10
  return Math.min(10, Math.max(1, score));
};

// Score breakdown interfaces
export interface HoldScoreBreakdown {
  cashflowScore: number;
  arvRatioScore: number;
  rentRatioScore: number;
  totalScore: number;
}

export interface FlipScoreBreakdown {
  arvRatioScore: number;
  equityScore: number;
  totalScore: number;
}

// Functions to get detailed score breakdowns
export const getHoldScoreBreakdown = (property: Omit<Property, 'id'>): HoldScoreBreakdown => {
  const rentRatio = calculateRentRatio(property.potentialRent, property.offerPrice, property.rehabCosts);
  const arvRatio = calculateARVRatio(property.offerPrice, property.rehabCosts, property.arv);
  const cashflow = calculateCashflow(
    property.potentialRent, 
    property.offerPrice, 
    calculateNewLoan(property.offerPrice, property.rehabCosts, property.arv)
  );

  const cashflowScore = calculateHoldCashflowScore(cashflow, property.units || 1);
  const arvRatioScore = calculateHoldARVRatioScore(arvRatio);
  const rentRatioScore = calculateHoldRentRatioScore(rentRatio);

  return {
    cashflowScore,
    arvRatioScore,
    rentRatioScore,
    totalScore: calculateHoldScore(property)
  };
};

export const getFlipScoreBreakdown = (property: Omit<Property, 'id'>): FlipScoreBreakdown => {
  const arvRatio = calculateARVRatio(property.offerPrice, property.rehabCosts, property.arv);
  const homeEquity = calculateHomeEquity(property.offerPrice, property.rehabCosts, property.arv);

  const arvRatioScore = calculateFlipARVRatioScore(arvRatio);
  const equityScore = calculateFlipEquityScore(homeEquity);

  return {
    arvRatioScore,
    equityScore,
    totalScore: calculateFlipScore(property)
  };
}; 
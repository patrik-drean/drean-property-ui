import React from 'react';
import { Typography, Box } from '@mui/material';
import { Property } from '../../types/property';
import {
  calculateDownPayment,
  calculateLoanAmount,
  calculateNewLoan,
  calculateNewLoanPercent,
  calculateCashToPullOut,
  calculateCashRemaining,
  calculateMonthlyMortgage,
  calculateCashflow,
} from '../../utils/scoreCalculator';

interface PropertyTooltipsProps {
  property: Property;
  formatCurrency: (value: number) => string;
  formatPercentage: (value: number) => string;
}

export const FinancingDetailsTooltip: React.FC<PropertyTooltipsProps> = ({ 
  property, 
  formatCurrency, 
  formatPercentage 
}) => {
  return (
    <>
      <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>Financing Details:</Typography>
      <Typography variant="body2">Down Payment: {formatCurrency(calculateDownPayment(property.offerPrice, property.rehabCosts))}</Typography>
      <Typography variant="body2">Loan Amount: {formatCurrency(calculateLoanAmount(property.offerPrice, property.rehabCosts))}</Typography>
      <Typography variant="body2">New Loan: {formatCurrency(calculateNewLoan(property.offerPrice, property.rehabCosts, property.arv))}</Typography>
      <Typography variant="body2">New Loan %: {formatPercentage(calculateNewLoanPercent(property.offerPrice, property.rehabCosts, property.arv))}</Typography>
      <Typography variant="body2">Cash to Pull Out: {formatCurrency(calculateCashToPullOut(property.offerPrice, property.rehabCosts, property.arv))}</Typography>
      <Typography variant="body2">Cash Remaining: {formatCurrency(calculateCashRemaining())}</Typography>
    </>
  );
};

export const CashflowBreakdownTooltip: React.FC<PropertyTooltipsProps> = ({ 
  property, 
  formatCurrency 
}) => {
  return (
    <>
      <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>Monthly Cashflow Breakdown:</Typography>
      <Typography variant="body2">Rent: {formatCurrency(property.potentialRent)}</Typography>
      <Typography variant="body2">Property Management (12%): -{formatCurrency(property.potentialRent * 0.12)}</Typography>
      <Typography variant="body2">Property Taxes: -{formatCurrency((property.offerPrice * 0.025) / 12)}</Typography>
      <Typography variant="body2">Other Expenses: -$130</Typography>
      <Typography variant="body2">Mortgage Payment: -{formatCurrency(calculateMonthlyMortgage(calculateNewLoan(property.offerPrice, property.rehabCosts, property.arv)))}</Typography>
    </>
  );
};

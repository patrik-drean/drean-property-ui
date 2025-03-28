import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  styled,
} from '@mui/material';

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  '&.header': {
    backgroundColor: '#7986cb',
    color: theme.palette.common.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  '&.subheader': {
    backgroundColor: '#9fa8da',
    color: theme.palette.common.white,
    fontWeight: 'bold',
  },
  '&.highlightValue': {
    backgroundColor: '#e8f5e9',
  },
}));

interface CalculatorInputs {
  purchasePrice: number;
  immediateRepairs: number;
  closingCosts: number;
  closingCostsPercent: number;
  downPaymentPercent: number;
  interestRate: number;
  rentalIncome: number;
  propertyManagementFeePercent: number;
  taxesPercent: number;
  insurance: number;
  otherExpenses: number;
  afterRepairValue: number;
  newLoanPercent: number;
}

const Calculator: React.FC = () => {
  const [inputs, setInputs] = useState<CalculatorInputs>({
    purchasePrice: 135000,
    immediateRepairs: 50000,
    closingCosts: 0,
    closingCostsPercent: 5,
    downPaymentPercent: 25,
    interestRate: 8,
    rentalIncome: 1900,
    propertyManagementFeePercent: 12,
    taxesPercent: 2.5,
    insurance: 100,
    otherExpenses: 30,
    afterRepairValue: 220000,
    newLoanPercent: 75,
  });

  const handleInputChange = (field: keyof CalculatorInputs, value: number) => {
    setInputs({
      ...inputs,
      [field]: value,
    });
  };

  // Format number with commas
  const formatNumber = (num: number): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Parse formatted input to remove commas
  const parseFormattedInput = (value: string): number => {
    return parseInt(value.replace(/,/g, ''), 10) || 0;
  };

  // Calculate derived values
  const closingCosts = inputs.purchasePrice * (inputs.closingCostsPercent / 100);
  const totalInitialInvestment = inputs.purchasePrice + inputs.immediateRepairs + closingCosts;
  const downPayment = inputs.purchasePrice * (inputs.downPaymentPercent / 100);
  const loanAmount = inputs.purchasePrice - downPayment;
  const upfrontCash = downPayment + inputs.immediateRepairs + closingCosts;
  
  // Monthly expenses
  const propertyManagementFee = inputs.rentalIncome * (inputs.propertyManagementFeePercent / 100);
  const taxes = inputs.purchasePrice * (inputs.taxesPercent / 100) / 12;
  const monthlyInterestRate = inputs.interestRate / 100 / 12;
  const loanTerm = 30 * 12; // 30 years in months
  const loanPayment = loanAmount * (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, loanTerm)) / 
                     (Math.pow(1 + monthlyInterestRate, loanTerm) - 1);
  
  const totalExpenses = propertyManagementFee + taxes + inputs.insurance + inputs.otherExpenses + loanPayment;
  const cashFlow = inputs.rentalIncome - totalExpenses;
  const cashFlowRatio = Math.round((inputs.rentalIncome / totalExpenses) * 100) / 100;
  const cashOnCash = Math.round((cashFlow * 12 / upfrontCash) * 10000) / 100;
  
  // Refinancing calculations
  const newLoan = inputs.afterRepairValue * (inputs.newLoanPercent / 100);
  const cashToPullOut = newLoan - loanAmount;
  const cashRemainingInProperty = upfrontCash - cashToPullOut;
  const equityInHome = inputs.afterRepairValue - newLoan;
  const arvRatio = Math.round((newLoan / inputs.afterRepairValue) * 10000) / 100;

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Property Investment Calculator
      </Typography>
      
      <Grid container spacing={4}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Input Values
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="Purchase Price"
                  fullWidth
                  value={formatNumber(inputs.purchasePrice)}
                  onChange={(e) => handleInputChange('purchasePrice', parseFormattedInput(e.target.value))}
                  InputProps={{ startAdornment: '$' }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Immediate Repairs"
                  fullWidth
                  value={formatNumber(inputs.immediateRepairs)}
                  onChange={(e) => handleInputChange('immediateRepairs', parseFormattedInput(e.target.value))}
                  InputProps={{ startAdornment: '$' }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Closing Costs %"
                  type="number"
                  fullWidth
                  value={inputs.closingCostsPercent}
                  onChange={(e) => handleInputChange('closingCostsPercent', Number(e.target.value))}
                  InputProps={{ endAdornment: '%' }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Down Payment %"
                  type="number"
                  fullWidth
                  value={inputs.downPaymentPercent}
                  onChange={(e) => handleInputChange('downPaymentPercent', Number(e.target.value))}
                  InputProps={{ endAdornment: '%' }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Interest Rate"
                  type="number"
                  fullWidth
                  value={inputs.interestRate}
                  onChange={(e) => handleInputChange('interestRate', Number(e.target.value))}
                  InputProps={{ endAdornment: '%' }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Rental Income"
                  fullWidth
                  value={formatNumber(inputs.rentalIncome)}
                  onChange={(e) => handleInputChange('rentalIncome', parseFormattedInput(e.target.value))}
                  InputProps={{ startAdornment: '$' }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Property Management Fee %"
                  type="number"
                  fullWidth
                  value={inputs.propertyManagementFeePercent}
                  onChange={(e) => handleInputChange('propertyManagementFeePercent', Number(e.target.value))}
                  InputProps={{ endAdornment: '%' }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Real Estate Taxes %"
                  type="number"
                  fullWidth
                  value={inputs.taxesPercent}
                  onChange={(e) => handleInputChange('taxesPercent', Number(e.target.value))}
                  InputProps={{ endAdornment: '%' }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Insurance"
                  fullWidth
                  value={formatNumber(inputs.insurance)}
                  onChange={(e) => handleInputChange('insurance', parseFormattedInput(e.target.value))}
                  InputProps={{ startAdornment: '$' }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Other Expenses"
                  fullWidth
                  value={formatNumber(inputs.otherExpenses)}
                  onChange={(e) => handleInputChange('otherExpenses', parseFormattedInput(e.target.value))}
                  InputProps={{ startAdornment: '$' }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="After Repair Value"
                  fullWidth
                  value={formatNumber(inputs.afterRepairValue)}
                  onChange={(e) => handleInputChange('afterRepairValue', parseFormattedInput(e.target.value))}
                  InputProps={{ startAdornment: '$' }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="New Loan %"
                  type="number"
                  fullWidth
                  value={inputs.newLoanPercent}
                  onChange={(e) => handleInputChange('newLoanPercent', Number(e.target.value))}
                  InputProps={{ endAdornment: '%' }}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={8}>
          <TableContainer component={Paper}>
            <Table>
              <TableBody>
                {/* Initial Investment Section */}
                <TableRow>
                  <StyledTableCell className="header" colSpan={7}>Initial Investment</StyledTableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Purchase Price</TableCell>
                  <TableCell></TableCell>
                  <TableCell sx={{ backgroundColor: '#fff9c4' }}>${inputs.purchasePrice.toLocaleString()}</TableCell>
                  <TableCell colSpan={4}></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Immediate Repairs</TableCell>
                  <TableCell></TableCell>
                  <TableCell sx={{ backgroundColor: '#fff9c4' }}>${inputs.immediateRepairs.toLocaleString()}</TableCell>
                  <TableCell colSpan={4}></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Closing Costs</TableCell>
                  <TableCell>{inputs.closingCostsPercent}%</TableCell>
                  <TableCell>${closingCosts.toLocaleString()}</TableCell>
                  <TableCell colSpan={4}></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Total Initial Investment</TableCell>
                  <TableCell></TableCell>
                  <TableCell>${totalInitialInvestment.toLocaleString()}</TableCell>
                  <TableCell colSpan={4}></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Upfront Cash</TableCell>
                  <TableCell></TableCell>
                  <TableCell>${upfrontCash.toLocaleString()}</TableCell>
                  <TableCell colSpan={4}></TableCell>
                </TableRow>

                {/* Financing Section */}
                <TableRow>
                  <StyledTableCell className="header" colSpan={3}>Financing</StyledTableCell>
                  <StyledTableCell className="header" colSpan={4}>Refinancing</StyledTableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Down Payment</TableCell>
                  <TableCell>{inputs.downPaymentPercent}%</TableCell>
                  <TableCell>${downPayment.toLocaleString()}</TableCell>
                  <TableCell>ARV</TableCell>
                  <TableCell colSpan={3}>${inputs.afterRepairValue.toLocaleString()}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Loan Amount</TableCell>
                  <TableCell></TableCell>
                  <TableCell>${loanAmount.toLocaleString()}</TableCell>
                  <TableCell>New loan</TableCell>
                  <TableCell>${newLoan.toLocaleString()}</TableCell>
                  <TableCell>{inputs.newLoanPercent}%</TableCell>
                  <TableCell></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Interest Rate</TableCell>
                  <TableCell>{inputs.interestRate}%</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell>Cash to pull out</TableCell>
                  <TableCell colSpan={3}>${cashToPullOut.toLocaleString()}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={3}></TableCell>
                  <TableCell>Cash remaining in property</TableCell>
                  <TableCell colSpan={3}>${cashRemainingInProperty.toLocaleString()}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={3}></TableCell>
                  <TableCell>Equity in home</TableCell>
                  <TableCell colSpan={3}>${equityInHome.toLocaleString()}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={3}></TableCell>
                  <TableCell>ARV Ratio</TableCell>
                  <StyledTableCell className="highlightValue" colSpan={3}>{arvRatio}%</StyledTableCell>
                </TableRow>

                {/* Cashflow Section */}
                <TableRow>
                  <StyledTableCell className="header" colSpan={7}>Cashflow</StyledTableCell>
                </TableRow>
                <TableRow>
                  <StyledTableCell className="subheader" colSpan={7}>Revenue</StyledTableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Rental Income</TableCell>
                  <TableCell></TableCell>
                  <TableCell sx={{ backgroundColor: '#fff9c4' }}>${inputs.rentalIncome.toLocaleString()}</TableCell>
                  <TableCell colSpan={4}></TableCell>
                </TableRow>

                {/* Expenses Section */}
                <TableRow>
                  <StyledTableCell className="subheader" colSpan={7}>Expenses</StyledTableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Property Management Fee</TableCell>
                  <TableCell>{inputs.propertyManagementFeePercent}%</TableCell>
                  <TableCell>${propertyManagementFee.toLocaleString()}</TableCell>
                  <TableCell colSpan={4}></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Utilities</TableCell>
                  <TableCell>0%</TableCell>
                  <TableCell>$0</TableCell>
                  <TableCell colSpan={4}></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Vacancy</TableCell>
                  <TableCell>0%</TableCell>
                  <TableCell>$0</TableCell>
                  <TableCell colSpan={4}></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Maintenance</TableCell>
                  <TableCell>0%</TableCell>
                  <TableCell>$0</TableCell>
                  <TableCell colSpan={4}></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Real Estate Taxes</TableCell>
                  <TableCell>{inputs.taxesPercent}%</TableCell>
                  <TableCell>${taxes.toFixed(0)}</TableCell>
                  <TableCell colSpan={4}></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Insurance</TableCell>
                  <TableCell></TableCell>
                  <TableCell sx={{ backgroundColor: '#fff9c4' }}>${inputs.insurance.toLocaleString()}</TableCell>
                  <TableCell colSpan={4}></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>HOA Fees</TableCell>
                  <TableCell></TableCell>
                  <TableCell sx={{ backgroundColor: '#fff9c4' }}>$0</TableCell>
                  <TableCell colSpan={4}></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Other Ongoing Expenses</TableCell>
                  <TableCell></TableCell>
                  <TableCell>${inputs.otherExpenses.toLocaleString()}</TableCell>
                  <TableCell colSpan={4}></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Loan Payment</TableCell>
                  <TableCell></TableCell>
                  <TableCell>${loanPayment.toFixed(0)}</TableCell>
                  <TableCell colSpan={4}></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Total Expenses</TableCell>
                  <TableCell></TableCell>
                  <TableCell>${totalExpenses.toFixed(0)}</TableCell>
                  <TableCell colSpan={4}></TableCell>
                </TableRow>

                {/* Summary */}
                <TableRow>
                  <TableCell colSpan={2}>Cash Flow</TableCell>
                  <StyledTableCell className="highlightValue">${cashFlow.toFixed(0)}</StyledTableCell>
                  <TableCell colSpan={4}></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={2}>Ratio</TableCell>
                  <TableCell>{cashFlowRatio}</TableCell>
                  <TableCell colSpan={4}></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={2}>Cash-on-Cash</TableCell>
                  <TableCell>{cashOnCash}%</TableCell>
                  <TableCell colSpan={4}></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Calculator; 
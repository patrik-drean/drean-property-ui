import React, { useState, useEffect } from 'react';
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
import { useLocation } from 'react-router-dom';

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
  const location = useLocation();

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

  // Parse URL parameters when component mounts
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const offerPrice = params.get('offerPrice');
    const rehabCosts = params.get('rehabCosts');
    const potentialRent = params.get('potentialRent');
    const arv = params.get('arv');

    const updatedInputs = { ...inputs };
    let hasUpdates = false;

    if (offerPrice) {
      updatedInputs.purchasePrice = parseInt(offerPrice, 10);
      hasUpdates = true;
    }
    
    if (rehabCosts) {
      updatedInputs.immediateRepairs = parseInt(rehabCosts, 10);
      hasUpdates = true;
    }
    
    if (potentialRent) {
      updatedInputs.rentalIncome = parseInt(potentialRent, 10);
      hasUpdates = true;
    }
    
    if (arv) {
      updatedInputs.afterRepairValue = parseInt(arv, 10);
      hasUpdates = true;
    }

    if (hasUpdates) {
      setInputs(updatedInputs);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

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
  const totalProjectCost = inputs.purchasePrice + inputs.immediateRepairs;
  const downPayment = totalProjectCost * (inputs.downPaymentPercent / 100);
  const loanAmount = totalProjectCost - downPayment;
  const upfrontCash = downPayment + closingCosts;
  
  // Monthly expenses
  const propertyManagementFee = inputs.rentalIncome * (inputs.propertyManagementFeePercent / 100);
  const taxes = inputs.purchasePrice * (inputs.taxesPercent / 100) / 12;
  const monthlyInterestRate = inputs.interestRate / 100 / 12;
  const loanTerm = 30 * 12; // 30 years in months
  
  // Refinancing calculations
  const newLoan = inputs.afterRepairValue * (inputs.newLoanPercent / 100);
  const cashToPullOut = newLoan - loanAmount;
  const cashRemainingInProperty = upfrontCash - cashToPullOut;
  const equityInHome = inputs.afterRepairValue - newLoan;
  const arvRatio = Math.round((newLoan / inputs.afterRepairValue) * 10000) / 100;
  
  // Calculate loan payment based on new loan amount
  const loanPayment = newLoan * (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, loanTerm)) / 
                     (Math.pow(1 + monthlyInterestRate, loanTerm) - 1);
  
  const totalExpenses = propertyManagementFee + taxes + inputs.insurance + inputs.otherExpenses + loanPayment;
  const cashFlow = inputs.rentalIncome - totalExpenses;
  const cashFlowRatio = Math.round((inputs.rentalIncome / totalExpenses) * 100) / 100;
  const cashOnCash = Math.round((cashFlow * 12 / upfrontCash) * 10000) / 100;

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Property Investment Calculator
      </Typography>
      
      <Grid container spacing={4}>
        <Grid item xs={12}>
          <TableContainer component={Paper}>
            <Table>
              <TableBody>
                {/* Initial Investment Section */}
                <TableRow>
                  <StyledTableCell className="header" colSpan={3}>Input Values</StyledTableCell>
                  <StyledTableCell className="header" colSpan={5}>Initial Investment</StyledTableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={3}>
                    <TextField
                      label="Purchase Price"
                      fullWidth
                      value={formatNumber(inputs.purchasePrice)}
                      onChange={(e) => handleInputChange('purchasePrice', parseFormattedInput(e.target.value))}
                      InputProps={{ startAdornment: '$' }}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>Purchase Price</TableCell>
                  <TableCell></TableCell>
                  <TableCell>${inputs.purchasePrice.toLocaleString()}</TableCell>
                  <TableCell colSpan={2}></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={3}>
                    <TextField
                      label="Immediate Repairs"
                      fullWidth
                      value={formatNumber(inputs.immediateRepairs)}
                      onChange={(e) => handleInputChange('immediateRepairs', parseFormattedInput(e.target.value))}
                      InputProps={{ startAdornment: '$' }}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>Immediate Repairs</TableCell>
                  <TableCell></TableCell>
                  <TableCell>${inputs.immediateRepairs.toLocaleString()}</TableCell>
                  <TableCell colSpan={2}></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={3}>
                    <TextField
                      label="Closing Costs %"
                      type="number"
                      fullWidth
                      value={inputs.closingCostsPercent}
                      onChange={(e) => handleInputChange('closingCostsPercent', Number(e.target.value))}
                      InputProps={{ endAdornment: '%' }}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>Closing Costs</TableCell>
                  <TableCell>{inputs.closingCostsPercent}%</TableCell>
                  <TableCell>${closingCosts.toLocaleString()}</TableCell>
                  <TableCell colSpan={2}></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={3}></TableCell>
                  <TableCell>Total Initial Investment</TableCell>
                  <TableCell></TableCell>
                  <TableCell>${totalInitialInvestment.toLocaleString()}</TableCell>
                  <TableCell colSpan={2}></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={3}></TableCell>
                  <TableCell>Upfront Cash</TableCell>
                  <TableCell></TableCell>
                  <TableCell>${upfrontCash.toLocaleString()}</TableCell>
                  <TableCell colSpan={2}></TableCell>
                </TableRow>

                {/* Financing Section */}
                <TableRow>
                  <StyledTableCell className="header" colSpan={3}>Input Values</StyledTableCell>
                  <StyledTableCell className="header" colSpan={3}>Financing</StyledTableCell>
                  <StyledTableCell className="header" colSpan={2}>Refinancing</StyledTableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={3}>
                    <TextField
                      label="Down Payment %"
                      type="number"
                      fullWidth
                      value={inputs.downPaymentPercent}
                      onChange={(e) => handleInputChange('downPaymentPercent', Number(e.target.value))}
                      InputProps={{ endAdornment: '%' }}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>Down Payment</TableCell>
                  <TableCell>{inputs.downPaymentPercent}%</TableCell>
                  <TableCell>${downPayment.toLocaleString()}</TableCell>
                  <TableCell>ARV</TableCell>
                  <TableCell>${inputs.afterRepairValue.toLocaleString()}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={3}>
                    <TextField
                      label="After Repair Value"
                      fullWidth
                      value={formatNumber(inputs.afterRepairValue)}
                      onChange={(e) => handleInputChange('afterRepairValue', parseFormattedInput(e.target.value))}
                      InputProps={{ startAdornment: '$' }}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>Loan Amount</TableCell>
                  <TableCell></TableCell>
                  <TableCell>${loanAmount.toLocaleString()}</TableCell>
                  <TableCell>New loan</TableCell>
                  <TableCell>${newLoan.toLocaleString()} ({inputs.newLoanPercent}%)</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={3}>
                    <TextField
                      label="Interest Rate"
                      type="number"
                      fullWidth
                      value={inputs.interestRate}
                      onChange={(e) => handleInputChange('interestRate', Number(e.target.value))}
                      InputProps={{ endAdornment: '%' }}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>Interest Rate</TableCell>
                  <TableCell>{inputs.interestRate}%</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell>Cash to pull out</TableCell>
                  <TableCell>${cashToPullOut.toLocaleString()}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={3}>
                    <TextField
                      label="New Loan %"
                      type="number"
                      fullWidth
                      value={inputs.newLoanPercent}
                      onChange={(e) => handleInputChange('newLoanPercent', Number(e.target.value))}
                      InputProps={{ endAdornment: '%' }}
                      size="small"
                    />
                  </TableCell>
                  <TableCell colSpan={3}></TableCell>
                  <TableCell>Cash remaining in property</TableCell>
                  <TableCell>${cashRemainingInProperty.toLocaleString()}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={3}></TableCell>
                  <TableCell colSpan={3}></TableCell>
                  <TableCell>Equity in home</TableCell>
                  <TableCell>${equityInHome.toLocaleString()}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={3}></TableCell>
                  <TableCell colSpan={3}></TableCell>
                  <TableCell>ARV Ratio</TableCell>
                  <TableCell>{arvRatio}%</TableCell>
                </TableRow>

                {/* Cashflow Section */}
                <TableRow>
                  <StyledTableCell className="header" colSpan={3}>Input Values</StyledTableCell>
                  <StyledTableCell className="header" colSpan={5}>Cashflow</StyledTableCell>
                </TableRow>
                <TableRow>
                  <StyledTableCell className="subheader" colSpan={8}>Revenue</StyledTableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={3}>
                    <TextField
                      label="Rental Income"
                      fullWidth
                      value={formatNumber(inputs.rentalIncome)}
                      onChange={(e) => handleInputChange('rentalIncome', parseFormattedInput(e.target.value))}
                      InputProps={{ startAdornment: '$' }}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>Rental Income</TableCell>
                  <TableCell></TableCell>
                  <TableCell>${inputs.rentalIncome.toLocaleString()}</TableCell>
                  <TableCell colSpan={2}></TableCell>
                </TableRow>

                {/* Expenses Section */}
                <TableRow>
                  <StyledTableCell className="subheader" colSpan={8}>Expenses</StyledTableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={3}>
                    <TextField
                      label="Property Management Fee %"
                      type="number"
                      fullWidth
                      value={inputs.propertyManagementFeePercent}
                      onChange={(e) => handleInputChange('propertyManagementFeePercent', Number(e.target.value))}
                      InputProps={{ endAdornment: '%' }}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>Property Management Fee</TableCell>
                  <TableCell>{inputs.propertyManagementFeePercent}%</TableCell>
                  <TableCell>${propertyManagementFee.toLocaleString()}</TableCell>
                  <TableCell colSpan={2}></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={3}></TableCell>
                  <TableCell>Utilities</TableCell>
                  <TableCell>0%</TableCell>
                  <TableCell>$0</TableCell>
                  <TableCell colSpan={2}></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={3}></TableCell>
                  <TableCell>Vacancy</TableCell>
                  <TableCell>0%</TableCell>
                  <TableCell>$0</TableCell>
                  <TableCell colSpan={2}></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={3}></TableCell>
                  <TableCell>Maintenance</TableCell>
                  <TableCell>0%</TableCell>
                  <TableCell>$0</TableCell>
                  <TableCell colSpan={2}></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={3}>
                    <TextField
                      label="Real Estate Taxes %"
                      type="number"
                      fullWidth
                      value={inputs.taxesPercent}
                      onChange={(e) => handleInputChange('taxesPercent', Number(e.target.value))}
                      InputProps={{ endAdornment: '%' }}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>Real Estate Taxes</TableCell>
                  <TableCell>{inputs.taxesPercent}%</TableCell>
                  <TableCell>${taxes.toFixed(0)}</TableCell>
                  <TableCell colSpan={2}></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={3}>
                    <TextField
                      label="Insurance"
                      fullWidth
                      value={formatNumber(inputs.insurance)}
                      onChange={(e) => handleInputChange('insurance', parseFormattedInput(e.target.value))}
                      InputProps={{ startAdornment: '$' }}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>Insurance</TableCell>
                  <TableCell></TableCell>
                  <TableCell>${inputs.insurance.toLocaleString()}</TableCell>
                  <TableCell colSpan={2}></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={3}></TableCell>
                  <TableCell>HOA Fees</TableCell>
                  <TableCell></TableCell>
                  <TableCell>$0</TableCell>
                  <TableCell colSpan={2}></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={3}>
                    <TextField
                      label="Other Expenses"
                      fullWidth
                      value={formatNumber(inputs.otherExpenses)}
                      onChange={(e) => handleInputChange('otherExpenses', parseFormattedInput(e.target.value))}
                      InputProps={{ startAdornment: '$' }}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>Other Ongoing Expenses</TableCell>
                  <TableCell></TableCell>
                  <TableCell>${inputs.otherExpenses.toLocaleString()}</TableCell>
                  <TableCell colSpan={2}></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={3}></TableCell>
                  <TableCell>Loan Payment</TableCell>
                  <TableCell></TableCell>
                  <TableCell>${loanPayment.toFixed(0)}</TableCell>
                  <TableCell colSpan={2}></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={3}></TableCell>
                  <TableCell>Total Expenses</TableCell>
                  <TableCell></TableCell>
                  <TableCell>${totalExpenses.toFixed(0)}</TableCell>
                  <TableCell colSpan={2}></TableCell>
                </TableRow>

                {/* Summary */}
                <TableRow>
                  <TableCell colSpan={3}></TableCell>
                  <TableCell colSpan={2}>Cash Flow</TableCell>
                  <TableCell>${cashFlow.toFixed(0)}</TableCell>
                  <TableCell colSpan={2}></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={3}></TableCell>
                  <TableCell colSpan={2}>Ratio</TableCell>
                  <TableCell>{cashFlowRatio}</TableCell>
                  <TableCell colSpan={2}></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={3}></TableCell>
                  <TableCell colSpan={2}>Cash-on-Cash</TableCell>
                  <TableCell>{cashOnCash}%</TableCell>
                  <TableCell colSpan={2}></TableCell>
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
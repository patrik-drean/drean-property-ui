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
  Card,
  CardContent,
  Divider,
} from '@mui/material';
import { useLocation } from 'react-router-dom';

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  '&.header': {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.common.white,
    fontSize: 16,
    fontWeight: 'bold',
    padding: '12px 16px',
  },
  '&.subheader': {
    backgroundColor: theme.palette.primary.light,
    color: theme.palette.common.white,
    fontWeight: 'bold',
    padding: '10px 16px',
  },
  '&.total': {
    fontWeight: 'bold',
    backgroundColor: '#f5f5f5',
  },
  '&.positive': {
    color: theme.palette.success.main,
    fontWeight: 'bold',
  },
  '&.negative': {
    color: theme.palette.error.main,
    fontWeight: 'bold',
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:last-child td, &:last-child th': {
    border: 0,
  },
  '&.summary': {
    backgroundColor: '#f9f9f9',
  },
}));

const StyledInputTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    '&:hover fieldset': {
      borderColor: theme.palette.primary.main,
    },
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
    // Return empty string if value is 0 to avoid displaying leading zeros
    if (num === 0) return '';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Parse formatted input to remove commas
  const parseFormattedInput = (value: string): number => {
    // Only parse if there's actual content
    if (!value) return 0;
    return parseInt(value.replace(/,/g, ''), 10) || 0;
  };

  // Modified input handling functions for percentage fields
  const formatPercentage = (num: number): string => {
    // Return empty string if value is 0
    if (num === 0) return '';
    return num.toString();
  };

  const parsePercentageInput = (value: string): number => {
    if (!value) return 0;
    return Number(value) || 0;
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

  // Determine if cash flow is positive or negative for styling
  const cashFlowClass = cashFlow >= 0 ? 'positive' : 'negative';
  const cashOnCashClass = cashOnCash >= 0 ? 'positive' : 'negative';

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', width: '100%' }}>
      <Grid container spacing={4}>
        <Grid item xs={12}>
          <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 2, overflow: 'visible' }}>
            <Table>
              <TableBody>
                {/* Initial Investment Section */}
                <TableRow>
                  <StyledTableCell className="header" colSpan={8}>Initial Investment</StyledTableCell>
                </TableRow>
                <StyledTableRow>
                  <TableCell colSpan={3} sx={{ borderRight: '1px solid #eee', py: 2 }}>
                    <TextField
                      label="Purchase Price"
                      fullWidth
                      value={inputs.purchasePrice === 0 ? '' : formatNumber(inputs.purchasePrice)}
                      onChange={(e) => {
                        const value = e.target.value === '' ? 0 : parseFormattedInput(e.target.value);
                        handleInputChange('purchasePrice', value);
                      }}
                      InputProps={{ startAdornment: '$' }}
                      size="small"
                      variant="outlined"
                      sx={{ '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#1976d2'
                      }}}
                    />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>Purchase Price</TableCell>
                  <TableCell></TableCell>
                  <TableCell>${inputs.purchasePrice.toLocaleString()}</TableCell>
                  <TableCell colSpan={2}></TableCell>
                </StyledTableRow>
                <StyledTableRow>
                  <TableCell colSpan={3} sx={{ borderRight: '1px solid #eee', py: 2 }}>
                    <TextField
                      label="Immediate Repairs"
                      fullWidth
                      value={inputs.immediateRepairs === 0 ? '' : formatNumber(inputs.immediateRepairs)}
                      onChange={(e) => {
                        const value = e.target.value === '' ? 0 : parseFormattedInput(e.target.value);
                        handleInputChange('immediateRepairs', value);
                      }}
                      InputProps={{ startAdornment: '$' }}
                      size="small"
                      variant="outlined"
                      sx={{ '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#1976d2'
                      }}}
                    />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>Immediate Repairs</TableCell>
                  <TableCell></TableCell>
                  <TableCell>${inputs.immediateRepairs.toLocaleString()}</TableCell>
                  <TableCell colSpan={2}></TableCell>
                </StyledTableRow>
                <StyledTableRow>
                  <TableCell colSpan={3} sx={{ borderRight: '1px solid #eee', py: 2 }}>
                    <TextField
                      label="Closing Costs %"
                      type="number"
                      fullWidth
                      value={inputs.closingCostsPercent === 0 ? '' : inputs.closingCostsPercent}
                      onChange={(e) => {
                        const value = e.target.value === '' ? 0 : Number(e.target.value);
                        handleInputChange('closingCostsPercent', value);
                      }}
                      InputProps={{ endAdornment: '%' }}
                      size="small"
                      variant="outlined"
                      sx={{ '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#1976d2'
                      }}}
                    />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>Closing Costs</TableCell>
                  <TableCell>{inputs.closingCostsPercent}%</TableCell>
                  <TableCell>${closingCosts.toLocaleString()}</TableCell>
                  <TableCell colSpan={2}></TableCell>
                </StyledTableRow>
                <StyledTableRow>
                  <TableCell colSpan={3} sx={{ borderRight: '1px solid #eee' }}></TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>Total Initial Investment</TableCell>
                  <TableCell></TableCell>
                  <TableCell className="total">${totalInitialInvestment.toLocaleString()}</TableCell>
                  <TableCell colSpan={2}></TableCell>
                </StyledTableRow>
                <StyledTableRow>
                  <TableCell colSpan={3} sx={{ borderRight: '1px solid #eee' }}></TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>Upfront Cash</TableCell>
                  <TableCell></TableCell>
                  <TableCell className="total">${upfrontCash.toLocaleString()}</TableCell>
                  <TableCell colSpan={2}></TableCell>
                </StyledTableRow>

                {/* Financing Section */}
                <TableRow>
                  <StyledTableCell className="header" colSpan={8}>Financing & Refinancing</StyledTableCell>
                </TableRow>
                <StyledTableRow>
                  <TableCell colSpan={3} sx={{ borderRight: '1px solid #eee', py: 2 }}>
                    <TextField
                      label="Down Payment %"
                      type="number"
                      fullWidth
                      value={inputs.downPaymentPercent === 0 ? '' : inputs.downPaymentPercent}
                      onChange={(e) => {
                        const value = e.target.value === '' ? 0 : Number(e.target.value);
                        handleInputChange('downPaymentPercent', value);
                      }}
                      InputProps={{ endAdornment: '%' }}
                      size="small"
                      variant="outlined"
                      sx={{ '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#1976d2'
                      }}}
                    />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>Down Payment</TableCell>
                  <TableCell>{inputs.downPaymentPercent}%</TableCell>
                  <TableCell>${downPayment.toLocaleString()}</TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>ARV</TableCell>
                  <TableCell>${inputs.afterRepairValue.toLocaleString()}</TableCell>
                </StyledTableRow>
                <StyledTableRow>
                  <TableCell colSpan={3} sx={{ borderRight: '1px solid #eee', py: 2 }}>
                    <TextField
                      label="After Repair Value"
                      fullWidth
                      value={inputs.afterRepairValue === 0 ? '' : formatNumber(inputs.afterRepairValue)}
                      onChange={(e) => {
                        const value = e.target.value === '' ? 0 : parseFormattedInput(e.target.value);
                        handleInputChange('afterRepairValue', value);
                      }}
                      InputProps={{ startAdornment: '$' }}
                      size="small"
                      variant="outlined"
                      sx={{ '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#1976d2'
                      }}}
                    />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>Loan Amount</TableCell>
                  <TableCell></TableCell>
                  <TableCell>${loanAmount.toLocaleString()}</TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>New loan</TableCell>
                  <TableCell>${newLoan.toLocaleString()} ({inputs.newLoanPercent}%)</TableCell>
                </StyledTableRow>
                <StyledTableRow>
                  <TableCell colSpan={3} sx={{ borderRight: '1px solid #eee', py: 2 }}>
                    <TextField
                      label="Interest Rate"
                      type="number"
                      fullWidth
                      value={inputs.interestRate === 0 ? '' : inputs.interestRate}
                      onChange={(e) => {
                        const value = e.target.value === '' ? 0 : Number(e.target.value);
                        handleInputChange('interestRate', value);
                      }}
                      InputProps={{ endAdornment: '%' }}
                      size="small"
                      variant="outlined"
                      sx={{ '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#1976d2'
                      }}}
                    />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>Interest Rate</TableCell>
                  <TableCell>{inputs.interestRate}%</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>Cash to pull out</TableCell>
                  <TableCell>${cashToPullOut.toLocaleString()}</TableCell>
                </StyledTableRow>
                <StyledTableRow>
                  <TableCell colSpan={3} sx={{ borderRight: '1px solid #eee', py: 2 }}>
                    <TextField
                      label="New Loan %"
                      type="number"
                      fullWidth
                      value={inputs.newLoanPercent === 0 ? '' : inputs.newLoanPercent}
                      onChange={(e) => {
                        const value = e.target.value === '' ? 0 : Number(e.target.value);
                        handleInputChange('newLoanPercent', value);
                      }}
                      InputProps={{ endAdornment: '%' }}
                      size="small"
                      variant="outlined"
                      sx={{ '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#1976d2'
                      }}}
                    />
                  </TableCell>
                  <TableCell colSpan={3}></TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>Cash remaining in property</TableCell>
                  <TableCell>${cashRemainingInProperty.toLocaleString()}</TableCell>
                </StyledTableRow>
                <StyledTableRow>
                  <TableCell colSpan={3} sx={{ borderRight: '1px solid #eee' }}></TableCell>
                  <TableCell colSpan={3}></TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>Equity in home</TableCell>
                  <TableCell>${equityInHome.toLocaleString()}</TableCell>
                </StyledTableRow>
                <StyledTableRow>
                  <TableCell colSpan={3} sx={{ borderRight: '1px solid #eee' }}></TableCell>
                  <TableCell colSpan={3}></TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>ARV Ratio</TableCell>
                  <TableCell>${arvRatio}%</TableCell>
                </StyledTableRow>

                {/* Cashflow Section */}
                <TableRow>
                  <StyledTableCell className="header" colSpan={8}>Cashflow</StyledTableCell>
                </TableRow>
                <TableRow>
                  <StyledTableCell className="subheader" colSpan={8}>Revenue</StyledTableCell>
                </TableRow>
                <StyledTableRow>
                  <TableCell colSpan={3} sx={{ borderRight: '1px solid #eee', py: 2 }}>
                    <TextField
                      label="Rental Income"
                      fullWidth
                      value={inputs.rentalIncome === 0 ? '' : formatNumber(inputs.rentalIncome)}
                      onChange={(e) => {
                        const value = e.target.value === '' ? 0 : parseFormattedInput(e.target.value);
                        handleInputChange('rentalIncome', value);
                      }}
                      InputProps={{ startAdornment: '$' }}
                      size="small"
                      variant="outlined"
                      sx={{ '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#1976d2'
                      }}}
                    />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>Rental Income</TableCell>
                  <TableCell></TableCell>
                  <TableCell>${inputs.rentalIncome.toLocaleString()}</TableCell>
                  <TableCell colSpan={2}></TableCell>
                </StyledTableRow>

                {/* Expenses Section */}
                <TableRow>
                  <StyledTableCell className="subheader" colSpan={8}>Expenses</StyledTableCell>
                </TableRow>
                <StyledTableRow>
                  <TableCell colSpan={3} sx={{ borderRight: '1px solid #eee', py: 2 }}>
                    <TextField
                      label="Property Management Fee %"
                      type="number"
                      fullWidth
                      value={inputs.propertyManagementFeePercent === 0 ? '' : inputs.propertyManagementFeePercent}
                      onChange={(e) => {
                        const value = e.target.value === '' ? 0 : Number(e.target.value);
                        handleInputChange('propertyManagementFeePercent', value);
                      }}
                      InputProps={{ endAdornment: '%' }}
                      size="small"
                      variant="outlined"
                      sx={{ '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#1976d2'
                      }}}
                    />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>Property Management Fee</TableCell>
                  <TableCell>{inputs.propertyManagementFeePercent}%</TableCell>
                  <TableCell>${propertyManagementFee.toLocaleString()}</TableCell>
                  <TableCell colSpan={2}></TableCell>
                </StyledTableRow>
                <StyledTableRow>
                  <TableCell colSpan={3} sx={{ borderRight: '1px solid #eee' }}></TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>Utilities</TableCell>
                  <TableCell>0%</TableCell>
                  <TableCell>$0</TableCell>
                  <TableCell colSpan={2}></TableCell>
                </StyledTableRow>
                <StyledTableRow>
                  <TableCell colSpan={3} sx={{ borderRight: '1px solid #eee' }}></TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>Vacancy</TableCell>
                  <TableCell>0%</TableCell>
                  <TableCell>$0</TableCell>
                  <TableCell colSpan={2}></TableCell>
                </StyledTableRow>
                <StyledTableRow>
                  <TableCell colSpan={3} sx={{ borderRight: '1px solid #eee' }}></TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>Maintenance</TableCell>
                  <TableCell>0%</TableCell>
                  <TableCell>$0</TableCell>
                  <TableCell colSpan={2}></TableCell>
                </StyledTableRow>
                <StyledTableRow>
                  <TableCell colSpan={3} sx={{ borderRight: '1px solid #eee', py: 2 }}>
                    <TextField
                      label="Real Estate Taxes %"
                      type="number"
                      fullWidth
                      value={inputs.taxesPercent === 0 ? '' : inputs.taxesPercent}
                      onChange={(e) => {
                        const value = e.target.value === '' ? 0 : Number(e.target.value);
                        handleInputChange('taxesPercent', value);
                      }}
                      InputProps={{ endAdornment: '%' }}
                      size="small"
                      variant="outlined"
                      sx={{ '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#1976d2'
                      }}}
                    />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>Real Estate Taxes</TableCell>
                  <TableCell>{inputs.taxesPercent}%</TableCell>
                  <TableCell>${taxes.toFixed(0)}</TableCell>
                  <TableCell colSpan={2}></TableCell>
                </StyledTableRow>
                <StyledTableRow>
                  <TableCell colSpan={3} sx={{ borderRight: '1px solid #eee', py: 2 }}>
                    <TextField
                      label="Insurance"
                      fullWidth
                      value={inputs.insurance === 0 ? '' : formatNumber(inputs.insurance)}
                      onChange={(e) => {
                        const value = e.target.value === '' ? 0 : parseFormattedInput(e.target.value);
                        handleInputChange('insurance', value);
                      }}
                      InputProps={{ startAdornment: '$' }}
                      size="small"
                      variant="outlined"
                      sx={{ '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#1976d2'
                      }}}
                    />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>Insurance</TableCell>
                  <TableCell></TableCell>
                  <TableCell>${inputs.insurance.toLocaleString()}</TableCell>
                  <TableCell colSpan={2}></TableCell>
                </StyledTableRow>
                <StyledTableRow>
                  <TableCell colSpan={3} sx={{ borderRight: '1px solid #eee' }}></TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>HOA Fees</TableCell>
                  <TableCell></TableCell>
                  <TableCell>$0</TableCell>
                  <TableCell colSpan={2}></TableCell>
                </StyledTableRow>
                <StyledTableRow>
                  <TableCell colSpan={3} sx={{ borderRight: '1px solid #eee', py: 2 }}>
                    <TextField
                      label="Other Expenses"
                      fullWidth
                      value={inputs.otherExpenses === 0 ? '' : formatNumber(inputs.otherExpenses)}
                      onChange={(e) => {
                        const value = e.target.value === '' ? 0 : parseFormattedInput(e.target.value);
                        handleInputChange('otherExpenses', value);
                      }}
                      InputProps={{ startAdornment: '$' }}
                      size="small"
                      variant="outlined"
                      sx={{ '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#1976d2'
                      }}}
                    />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>Other Ongoing Expenses</TableCell>
                  <TableCell></TableCell>
                  <TableCell>${inputs.otherExpenses.toLocaleString()}</TableCell>
                  <TableCell colSpan={2}></TableCell>
                </StyledTableRow>
                <StyledTableRow>
                  <TableCell colSpan={3} sx={{ borderRight: '1px solid #eee' }}></TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>Loan Payment</TableCell>
                  <TableCell></TableCell>
                  <TableCell>${loanPayment.toFixed(0)}</TableCell>
                  <TableCell colSpan={2}></TableCell>
                </StyledTableRow>
                <StyledTableRow>
                  <TableCell colSpan={3} sx={{ borderRight: '1px solid #eee' }}></TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>Total Expenses</TableCell>
                  <TableCell></TableCell>
                  <TableCell className="total">${totalExpenses.toFixed(0)}</TableCell>
                  <TableCell colSpan={2}></TableCell>
                </StyledTableRow>

                {/* Summary */}
                <Divider />
                <StyledTableRow className="summary">
                  <TableCell colSpan={3} sx={{ borderRight: '1px solid #eee' }}></TableCell>
                  <TableCell colSpan={2} sx={{ fontWeight: 600, fontSize: '1.05rem' }}>Cash Flow</TableCell>
                  <StyledTableCell className={cashFlowClass} sx={{ fontSize: '1.05rem' }}>${cashFlow.toFixed(0)}</StyledTableCell>
                  <TableCell colSpan={2}></TableCell>
                </StyledTableRow>
                <StyledTableRow className="summary">
                  <TableCell colSpan={3} sx={{ borderRight: '1px solid #eee' }}></TableCell>
                  <TableCell colSpan={2} sx={{ fontWeight: 600 }}>Ratio</TableCell>
                  <TableCell>${cashFlowRatio}</TableCell>
                  <TableCell colSpan={2}></TableCell>
                </StyledTableRow>
                <StyledTableRow className="summary">
                  <TableCell colSpan={3} sx={{ borderRight: '1px solid #eee' }}></TableCell>
                  <TableCell colSpan={2} sx={{ fontWeight: 600 }}>Cash-on-Cash</TableCell>
                  <StyledTableCell className={cashOnCashClass}>${cashOnCash}%</StyledTableCell>
                  <TableCell colSpan={2}></TableCell>
                </StyledTableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Calculator; 
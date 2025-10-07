import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Divider,
  Link,
} from '@mui/material';
import { Download as DownloadIcon, Upload as UploadIcon } from '@mui/icons-material';
import { TransactionCreate } from '../../types/transaction';

interface ValidationError {
  line: number;
  message: string;
}

interface ValidationResult {
  validTransactions: TransactionCreate[];
  errors: ValidationError[];
  validCount: number;
  errorCount: number;
}

interface TransactionImportProps {
  open: boolean;
  onClose: () => void;
  onImport: (transactions: TransactionCreate[]) => void;
}

export const TransactionImport: React.FC<TransactionImportProps> = ({ open, onClose, onImport }) => {
  const [csvText, setCsvText] = useState('');
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState(false);

  const csvTemplate = `date,amount,category,property,unit,description,override_date,payee,expense_type
9/18/2025,785.00,Rent,123 Ohio St,Unit A,September rent,,Tenant Name,
9/2/2025,-150.00,Property Management,123 Ohio St,,Monthly fee,8/1/2025,ABC Property Mgmt,
10/1/2025,-1200.00,Mortgage & Escrow,123 Ohio St,,October payment,,,Operating`;

  const handleDownloadTemplate = () => {
    const blob = new Blob([csvTemplate], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'transaction_template.csv';
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const handleValidate = async () => {
    if (!csvText.trim()) return;

    try {
      setLoading(true);
      // TODO: Implement actual validation API call when backend is ready
      // For now, simulate validation
      const lines = csvText.trim().split('\n');
      const errors: ValidationError[] = [];
      const validTransactions: TransactionCreate[] = [];
      
      // Skip header row
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const parts = line.split(',');
        if (parts.length < 3) {
          errors.push({ line: i + 1, message: 'Invalid CSV format - missing required fields' });
          continue;
        }
        
        const [date, amount, category, property, unit, description, overrideDate, payee, expenseType] = parts;
        
        // Basic validation
        if (!date || !amount || !category) {
          errors.push({ line: i + 1, message: 'Missing required fields: date, amount, or category' });
          continue;
        }
        
        const amountNum = parseFloat(amount);
        if (isNaN(amountNum)) {
          errors.push({ line: i + 1, message: 'Invalid amount format' });
          continue;
        }
        
        validTransactions.push({
          date: date.trim(),
          amount: amountNum,
          category: category.trim(),
          propertyId: property?.trim() || undefined,
          unit: unit?.trim() || undefined,
          description: description?.trim() || undefined,
          overrideDate: overrideDate?.trim() || undefined,
          payee: payee?.trim() || undefined,
          expenseType: expenseType?.trim() || 'Operating',
        });
      }
      
      setValidationResult({
        validTransactions,
        errors,
        validCount: validTransactions.length,
        errorCount: errors.length,
      });
    } catch (err) {
      console.error('Validation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = () => {
    if (validationResult && validationResult.validCount > 0) {
      onImport(validationResult.validTransactions);
      handleClose();
    }
  };

  const handleClose = () => {
    setCsvText('');
    setValidationResult(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
      <DialogTitle>Import Transactions from CSV</DialogTitle>
      <DialogContent>
        <Box mb={2}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Paste your CSV-formatted transaction data below. Use the template format for best results.
          </Typography>
          <Link component="button" onClick={handleDownloadTemplate} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DownloadIcon fontSize="small" />
            Download Sample CSV Template
          </Link>
        </Box>

        <TextField
          label="CSV Data"
          multiline
          rows={12}
          value={csvText}
          onChange={(e) => setCsvText(e.target.value)}
          fullWidth
          placeholder={csvTemplate}
          variant="outlined"
          sx={{ mb: 2 }}
        />

        <Box display="flex" gap={2} mb={2}>
          <Button
            variant="outlined"
            onClick={handleValidate}
            disabled={!csvText.trim() || loading}
            startIcon={loading ? <CircularProgress size={20} /> : <UploadIcon />}
          >
            Validate Data
          </Button>
        </Box>

        {validationResult && (
          <>
            <Divider sx={{ my: 2 }} />
            
            <Box mb={2}>
              <Alert severity={validationResult.errorCount === 0 ? 'success' : 'warning'}>
                Validation Results: {validationResult.validCount} valid transactions, {validationResult.errorCount} errors
              </Alert>
            </Box>

            {validationResult.errors.length > 0 && (
              <Box mb={2}>
                <Typography variant="h6" gutterBottom>
                  Errors to Fix:
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Line</TableCell>
                        <TableCell>Error</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {validationResult.errors.map((error, index) => (
                        <TableRow key={index}>
                          <TableCell>{error.line}</TableCell>
                          <TableCell>{error.message}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            {validationResult.validCount > 0 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Valid Transactions ({validationResult.validCount}):
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Amount</TableCell>
                        <TableCell>Category</TableCell>
                        <TableCell>Property</TableCell>
                        <TableCell>Description</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {validationResult.validTransactions.map((transaction, index) => (
                        <TableRow key={index}>
                          <TableCell>{transaction.date}</TableCell>
                          <TableCell>${transaction.amount}</TableCell>
                          <TableCell>{transaction.category}</TableCell>
                          <TableCell>{transaction.propertyId || 'Business'}</TableCell>
                          <TableCell>{transaction.description || transaction.payee || '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button 
          onClick={handleImport} 
          variant="contained" 
          disabled={!validationResult || validationResult.validCount === 0}
        >
          Import {validationResult?.validCount || 0} Transactions
        </Button>
      </DialogActions>
    </Dialog>
  );
};

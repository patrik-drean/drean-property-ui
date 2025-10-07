import React, { useState } from 'react';
import { Container, Box, Snackbar, Alert } from '@mui/material';
import { TransactionList } from '../components/transactions/TransactionList';
import { TransactionImport } from '../components/transactions/TransactionImport';
import { TransactionCreate } from '../types/transaction';
import { transactionApi } from '../services/transactionApi';

export const TransactionsPage: React.FC = () => {
  const [importOpen, setImportOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });

  const handleImport = () => {
    setImportOpen(true);
  };

  const handleImportTransactions = async (transactions: TransactionCreate[]) => {
    try {
      // Convert transactions to CSV format for the API
      const csvData = [
        'date,amount,category,property,unit,description,override_date,payee,expense_type',
        ...transactions.map(t => [
          t.date,
          t.amount,
          t.category,
          t.propertyId || '',
          t.unit || '',
          t.description || '',
          t.overrideDate || '',
          t.payee || '',
          t.expenseType || 'Operating'
        ].join(','))
      ].join('\n');
      
      await transactionApi.import(csvData);
      setRefreshKey((prev) => prev + 1); // Trigger list refresh
      setSnackbar({ open: true, message: `${transactions.length} transactions imported successfully`, severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: err instanceof Error ? err.message : 'Failed to import transactions', severity: 'error' });
    }
  };

  const handleImportClose = () => {
    setImportOpen(false);
  };

  return (
    <Container maxWidth="lg">
      <Box py={4}>
        <TransactionList
          key={refreshKey}
          onImport={handleImport}
          onEdit={() => {}} // TODO: Implement edit functionality if needed
        />
        <TransactionImport
          open={importOpen}
          onClose={handleImportClose}
          onImport={handleImportTransactions}
        />
        
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Container>
  );
};

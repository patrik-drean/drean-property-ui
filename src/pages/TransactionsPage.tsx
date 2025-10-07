import React, { useState } from 'react';
import { Container, Box, Snackbar, Alert } from '@mui/material';
import { TransactionList } from '../components/transactions/TransactionList';
import { TransactionImport } from '../components/transactions/TransactionImport';
import { TransactionEdit } from '../components/transactions/TransactionEdit';
import { Transaction } from '../types/transaction';
import { transactionApi } from '../services/transactionApi';

export const TransactionsPage: React.FC = () => {
  const [importOpen, setImportOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });

  const handleImport = () => {
    setImportOpen(true);
  };

  const handleImportTransactions = async (csvText: string, transactionCount: number) => {
    try {
      // Pass the original CSV text directly to the import API
      await transactionApi.import(csvText);
      setRefreshKey((prev) => prev + 1); // Trigger list refresh
      setSnackbar({ open: true, message: `${transactionCount} transactions imported successfully`, severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: err instanceof Error ? err.message : 'Failed to import transactions', severity: 'error' });
    }
  };

  const handleImportClose = () => {
    setImportOpen(false);
  };

  const handleEdit = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setEditOpen(true);
  };

  const handleEditClose = () => {
    setEditOpen(false);
    setSelectedTransaction(null);
  };

  const handleEditSave = () => {
    setRefreshKey((prev) => prev + 1); // Trigger list refresh
    setSnackbar({ open: true, message: 'Transaction updated successfully', severity: 'success' });
  };

  return (
    <Container maxWidth="lg">
      <Box py={4}>
        <TransactionList
          key={refreshKey}
          onImport={handleImport}
          onEdit={handleEdit}
        />
        <TransactionImport
          open={importOpen}
          onClose={handleImportClose}
          onImport={handleImportTransactions}
        />
        <TransactionEdit
          open={editOpen}
          transaction={selectedTransaction}
          onClose={handleEditClose}
          onSave={handleEditSave}
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

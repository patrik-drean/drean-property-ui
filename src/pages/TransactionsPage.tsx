import React, { useState } from 'react';
import { Container, Box, Snackbar, Alert } from '@mui/material';
import { TransactionList } from '../components/transactions/TransactionList';
import { TransactionForm } from '../components/transactions/TransactionForm';
import { Transaction } from '../types/transaction';

export const TransactionsPage: React.FC = () => {
  const [formOpen, setFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>(undefined);
  const [refreshKey, setRefreshKey] = useState(0);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });

  const handleAdd = () => {
    setEditingTransaction(undefined);
    setFormOpen(true);
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setFormOpen(true);
  };

  const handleSave = async () => {
    try {
      setRefreshKey((prev) => prev + 1); // Trigger list refresh
      setSnackbar({ open: true, message: editingTransaction ? 'Transaction updated successfully' : 'Transaction created successfully', severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: err instanceof Error ? err.message : 'Failed to save transaction', severity: 'error' });
    }
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditingTransaction(undefined);
  };

  return (
    <Container maxWidth="lg">
      <Box py={4}>
        <TransactionList
          key={refreshKey}
          onAdd={handleAdd}
          onEdit={handleEdit}
        />
        <TransactionForm
          open={formOpen}
          transaction={editingTransaction}
          onClose={handleFormClose}
          onSave={handleSave}
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

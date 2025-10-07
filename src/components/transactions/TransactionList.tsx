import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Typography,
  CircularProgress,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
  Card,
  CardContent,
  CardActions,
  Grid,
  Stack,
  Snackbar,
  Alert,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon, ViewList as ViewListIcon, ViewModule as ViewModuleIcon } from '@mui/icons-material';
import { Transaction } from '../../types/transaction';
import { transactionApi } from '../../services/transactionApi';
import { format } from 'date-fns';

interface TransactionListProps {
  propertyId?: string; // Optional: filter by property
  onEdit: (transaction: Transaction) => void;
  onAdd: () => void;
}

type ViewMode = 'table' | 'cards';

export const TransactionList: React.FC<TransactionListProps> = ({ propertyId, onEdit, onAdd }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });

  const loadTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const data = propertyId
        ? await transactionApi.getByProperty(propertyId)
        : await transactionApi.getAll();
      setTransactions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    loadTransactions();
  }, [propertyId, loadTransactions]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) return;

    try {
      await transactionApi.delete(id);
      await loadTransactions(); // Refresh list
      setSnackbar({ open: true, message: 'Transaction deleted successfully', severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: err instanceof Error ? err.message : 'Failed to delete transaction', severity: 'error' });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(Math.abs(amount));
  };

  const handleViewModeChange = (_: React.MouseEvent<HTMLElement>, newViewMode: ViewMode | null) => {
    if (newViewMode !== null) {
      setViewMode(newViewMode);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={4}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  const renderTableView = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Date</TableCell>
            <TableCell>Category</TableCell>
            <TableCell>Description</TableCell>
            <TableCell>Property/Unit</TableCell>
            <TableCell align="right">Amount</TableCell>
            <TableCell>Type</TableCell>
            <TableCell align="center">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {transactions.map((transaction) => (
            <TableRow key={transaction.id}>
              <TableCell>{format(new Date(transaction.date), 'MMM dd, yyyy')}</TableCell>
              <TableCell>{transaction.category}</TableCell>
              <TableCell>{transaction.description || transaction.payee || '—'}</TableCell>
              <TableCell>
                {transaction.propertyId ? (
                  <>
                    Property {transaction.propertyId.slice(0, 8)}
                    {transaction.unit && ` - ${transaction.unit}`}
                  </>
                ) : (
                  'Business'
                )}
              </TableCell>
              <TableCell align="right">
                <Typography color={transaction.amount > 0 ? 'success.main' : 'text.primary'}>
                  {transaction.amount > 0 ? '+' : '-'}
                  {formatCurrency(transaction.amount)}
                </Typography>
              </TableCell>
              <TableCell>
                <Chip
                  label={transaction.expenseType}
                  size="small"
                  color={transaction.expenseType === 'Capital' ? 'warning' : 'default'}
                />
              </TableCell>
              <TableCell align="center">
                <IconButton size="small" onClick={() => onEdit(transaction)}>
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={() => handleDelete(transaction.id)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderCardView = () => (
    <Grid container spacing={2}>
      {transactions.map((transaction) => (
        <Grid item xs={12} sm={6} md={4} key={transaction.id}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {transaction.category}
              </Typography>
              <Typography variant="h5" color={transaction.amount > 0 ? 'success.main' : 'text.primary'}>
                {transaction.amount > 0 ? '+' : '-'}
                {formatCurrency(transaction.amount)}
              </Typography>
              <Typography color="text.secondary">
                {format(new Date(transaction.date), 'MMM dd, yyyy')}
              </Typography>
              <Typography variant="body2">
                {transaction.description || transaction.payee || '—'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {transaction.propertyId ? (
                  <>
                    Property {transaction.propertyId.slice(0, 8)}
                    {transaction.unit && ` - ${transaction.unit}`}
                  </>
                ) : (
                  'Business'
                )}
              </Typography>
              <Box mt={1}>
                <Chip
                  label={transaction.expenseType}
                  size="small"
                  color={transaction.expenseType === 'Capital' ? 'warning' : 'default'}
                />
              </Box>
            </CardContent>
            <CardActions>
              <IconButton size="small" onClick={() => onEdit(transaction)}>
                <EditIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={() => handleDelete(transaction.id)}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </CardActions>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Transactions</Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={handleViewModeChange}
            size="small"
          >
            <ToggleButton value="table">
              <ViewListIcon />
            </ToggleButton>
            <ToggleButton value="cards">
              <ViewModuleIcon />
            </ToggleButton>
          </ToggleButtonGroup>
          <Button variant="contained" startIcon={<AddIcon />} onClick={onAdd}>
            Add Transaction
          </Button>
        </Stack>
      </Box>

      {transactions.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">
            No transactions yet. Click "Add Transaction" to create your first transaction.
          </Typography>
        </Paper>
      ) : (
        viewMode === 'table' ? renderTableView() : renderCardView()
      )}

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
  );
};

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
import { Edit as EditIcon, Delete as DeleteIcon, Upload as UploadIcon, ViewList as ViewListIcon, ViewModule as ViewModuleIcon } from '@mui/icons-material';
import { Transaction } from '../../types/transaction';
import { transactionApi } from '../../services/transactionApi';
import PropertyService from '../../services/PropertyService';
import { format } from 'date-fns';

interface TransactionListProps {
  propertyId?: string; // Optional: filter by property
  onEdit: (transaction: Transaction) => void;
  onImport: () => void;
}

type ViewMode = 'table' | 'cards';

export const TransactionList: React.FC<TransactionListProps> = ({ propertyId, onEdit, onImport }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [propertyAddresses, setPropertyAddresses] = useState<Map<string, string>>(new Map());
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

  const loadProperties = useCallback(async () => {
    try {
      const properties = await PropertyService.getAllProperties();
      const addressMap = new Map<string, string>();
      properties.forEach(property => {
        addressMap.set(property.id, property.address);
      });
      setPropertyAddresses(addressMap);
    } catch (err) {
      console.error('Failed to load property addresses:', err);
    }
  }, []);

  useEffect(() => {
    loadTransactions();
    loadProperties();
  }, [propertyId, loadTransactions, loadProperties]);

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

  const getPropertyDisplay = (propertyId?: string) => {
    if (!propertyId) return 'Business';
    const fullAddress = propertyAddresses.get(propertyId);
    if (!fullAddress) return `Property ${propertyId.slice(0, 8)}`;
    // Return just the street number and name (first part before comma)
    return fullAddress.split(',')[0].trim();
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
                {getPropertyDisplay(transaction.propertyId)}
                {transaction.unit && ` - ${transaction.unit}`}
              </TableCell>
              <TableCell align="right">
                <Typography
                  color={transaction.amount > 0 ? 'primary.main' : 'error.main'}
                  fontWeight={transaction.amount > 0 ? 600 : 500}
                >
                  {transaction.amount > 0 ? '+' : '-'}
                  {formatCurrency(transaction.amount)}
                </Typography>
              </TableCell>
              <TableCell>
                <Chip
                  label={transaction.expenseType}
                  size="small"
                  variant="outlined"
                  sx={{
                    borderColor: transaction.expenseType === 'Capital' ? 'secondary.main' : 'grey.400',
                    color: transaction.expenseType === 'Capital' ? 'secondary.main' : 'text.secondary'
                  }}
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
              <Typography
                variant="h5"
                color={transaction.amount > 0 ? 'primary.main' : 'error.main'}
                fontWeight={transaction.amount > 0 ? 600 : 500}
              >
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
                {getPropertyDisplay(transaction.propertyId)}
                {transaction.unit && ` - ${transaction.unit}`}
              </Typography>
              <Box mt={1}>
                <Chip
                  label={transaction.expenseType}
                  size="small"
                  variant="outlined"
                  sx={{
                    borderColor: transaction.expenseType === 'Capital' ? 'secondary.main' : 'grey.400',
                    color: transaction.expenseType === 'Capital' ? 'secondary.main' : 'text.secondary'
                  }}
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
          <Button variant="contained" startIcon={<UploadIcon />} onClick={onImport}>
            Import Transactions
          </Button>
        </Stack>
      </Box>

      {transactions.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">
            No transactions yet. Click "Import Transactions" to import your first transactions from CSV.
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

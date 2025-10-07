import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Grid,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
} from '@mui/material';
import { Transaction, TransactionCreate, TransactionUpdate, TransactionCategory } from '../../types/transaction';
import { transactionApi } from '../../services/transactionApi';

interface TransactionFormProps {
  open: boolean;
  transaction?: Transaction; // If provided, edit mode
  onClose: () => void;
  onSave: () => void; // Callback after successful save
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ open, transaction, onClose, onSave }) => {
  const [formData, setFormData] = useState<TransactionCreate | TransactionUpdate>({
    date: '',
    amount: 0,
    category: '',
    propertyId: '',
    unit: '',
    payee: '',
    description: '',
    overrideDate: '',
    expenseType: 'Operating',
  });
  const [categories, setCategories] = useState<TransactionCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (open) {
      loadCategories();
      if (transaction) {
        // Edit mode - populate form with transaction data
        setFormData({
          date: transaction.date,
          amount: transaction.amount,
          category: transaction.category,
          propertyId: transaction.propertyId || '',
          unit: transaction.unit || '',
          payee: transaction.payee || '',
          description: transaction.description || '',
          overrideDate: transaction.overrideDate || '',
          expenseType: transaction.expenseType,
        });
      } else {
        // Create mode - reset form
        setFormData({
          date: new Date().toISOString().split('T')[0], // Today's date
          amount: 0,
          category: '',
          propertyId: '',
          unit: '',
          payee: '',
          description: '',
          overrideDate: '',
          expenseType: 'Operating',
        });
      }
      setErrors({});
    }
  }, [open, transaction]);

  const loadCategories = async () => {
    try {
      const data = await transactionApi.getCategories();
      setCategories(data);
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  };

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.date) newErrors.date = 'Date is required';
    if (formData.amount === 0) newErrors.amount = 'Amount cannot be zero';
    if (!formData.category) newErrors.category = 'Category is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    try {
      setLoading(true);
      if (transaction) {
        // Update existing
        await transactionApi.update(transaction.id, formData);
      } else {
        // Create new
        await transactionApi.create(formData);
      }
      onSave();
      onClose();
    } catch (err) {
      // Error will be handled by parent component via Snackbar
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{transaction ? 'Edit Transaction' : 'Add Transaction'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              fullWidth
              required
              error={!!errors.date}
              helperText={errors.date}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Amount"
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
              fullWidth
              required
              error={!!errors.amount}
              helperText={errors.amount || 'Positive for income, negative for expenses'}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required error={!!errors.category}>
              <InputLabel>Category</InputLabel>
              <Select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                label="Category"
              >
                {categories.map((cat) => (
                  <MenuItem key={cat.id} value={cat.name}>
                    {cat.name} ({cat.type})
                  </MenuItem>
                ))}
              </Select>
              {errors.category && <FormHelperText>{errors.category}</FormHelperText>}
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Expense Type</InputLabel>
              <Select
                value={formData.expenseType}
                onChange={(e) => setFormData({ ...formData, expenseType: e.target.value })}
                label="Expense Type"
              >
                <MenuItem value="Operating">Operating</MenuItem>
                <MenuItem value="Capital">Capital</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Payee"
              value={formData.payee}
              onChange={(e) => setFormData({ ...formData, payee: e.target.value })}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Unit (optional)"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              fullWidth
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
              multiline
              rows={2}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Override Date (optional)"
              type="date"
              value={formData.overrideDate}
              onChange={(e) => setFormData({ ...formData, overrideDate: e.target.value })}
              fullWidth
              helperText="Use this to report transaction in a different month"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Property ID (optional)"
              value={formData.propertyId}
              onChange={(e) => setFormData({ ...formData, propertyId: e.target.value })}
              fullWidth
              helperText="Enter property ID if transaction is property-specific"
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleSave} variant="contained" disabled={loading}>
          {loading ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

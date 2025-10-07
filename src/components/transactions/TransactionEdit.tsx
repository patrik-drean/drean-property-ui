import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Box,
} from '@mui/material';
import { Transaction, TransactionUpdate } from '../../types/transaction';
import { transactionApi } from '../../services/transactionApi';
import PropertyService from '../../services/PropertyService';

interface TransactionEditProps {
  open: boolean;
  transaction: Transaction | null;
  onClose: () => void;
  onSave: () => void;
}

export const TransactionEdit: React.FC<TransactionEditProps> = ({ open, transaction, onClose, onSave }) => {
  const [formData, setFormData] = useState<TransactionUpdate>({
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
  const [categories, setCategories] = useState<string[]>([]);
  const [properties, setProperties] = useState<{ id: string; address: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (transaction) {
      setFormData({
        date: transaction.date,
        amount: transaction.amount,
        category: transaction.category,
        propertyId: transaction.propertyId || '',
        unit: transaction.unit || '',
        payee: transaction.payee || '',
        description: transaction.description || '',
        overrideDate: transaction.overrideDate || '',
        expenseType: transaction.expenseType || 'Operating',
      });
    }
  }, [transaction]);

  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const [categoriesData, propertiesData] = await Promise.all([
          transactionApi.getCategories(),
          PropertyService.getAllProperties(),
        ]);
        setCategories(categoriesData.map(c => c.name));
        setProperties(propertiesData.map(p => ({ id: p.id, address: p.address })));
      } catch (err) {
        console.error('Failed to load metadata:', err);
      }
    };

    if (open) {
      loadMetadata();
    }
  }, [open]);

  const handleChange = (field: keyof TransactionUpdate, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!transaction) return;

    try {
      setLoading(true);
      setError(null);
      await transactionApi.update(transaction.id, formData);
      onSave();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Edit Transaction</DialogTitle>
      <DialogContent>
        <Box pt={1}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Date"
                type="date"
                fullWidth
                value={formData.date}
                onChange={(e) => handleChange('date', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Amount"
                type="number"
                fullWidth
                value={formData.amount}
                onChange={(e) => handleChange('amount', parseFloat(e.target.value))}
                helperText="Use negative for expenses, positive for income"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.category}
                  label="Category"
                  onChange={(e) => handleChange('category', e.target.value)}
                >
                  {categories.map(cat => (
                    <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Expense Type</InputLabel>
                <Select
                  value={formData.expenseType}
                  label="Expense Type"
                  onChange={(e) => handleChange('expenseType', e.target.value)}
                >
                  <MenuItem value="Operating">Operating</MenuItem>
                  <MenuItem value="Capital">Capital</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={8}>
              <FormControl fullWidth>
                <InputLabel>Property</InputLabel>
                <Select
                  value={formData.propertyId}
                  label="Property"
                  onChange={(e) => handleChange('propertyId', e.target.value)}
                >
                  <MenuItem value="">Business (No Property)</MenuItem>
                  {properties.map(prop => (
                    <MenuItem key={prop.id} value={prop.id}>{prop.address}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Unit"
                fullWidth
                value={formData.unit}
                onChange={(e) => handleChange('unit', e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Payee"
                fullWidth
                value={formData.payee}
                onChange={(e) => handleChange('payee', e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Description"
                fullWidth
                multiline
                rows={2}
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Override Date"
                type="date"
                fullWidth
                value={formData.overrideDate}
                onChange={(e) => handleChange('overrideDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
                helperText="Optional: Override date for categorization"
              />
            </Grid>
          </Grid>
          {error && (
            <Box mt={2} color="error.main">
              {error}
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Divider,
  Typography
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

interface PropertyLeadDialogProps {
  open: boolean;
  isEditing: boolean;
  initialFormData: any;
  onSave: (formData: any) => void;
  onClose: () => void;
  handleCurrencyInput: (value: string) => number;
  formatInputCurrency: (value: number) => string;
}

const PropertyLeadDialog: React.FC<PropertyLeadDialogProps> = ({
  open,
  isEditing,
  initialFormData,
  onSave,
  onClose,
  handleCurrencyInput,
  formatInputCurrency
}) => {
  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    if (open) {
      setFormData(initialFormData);
    }
  }, [open, initialFormData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleZillowLinkBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Optionally, add Zillow parsing logic here if needed
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>
        {isEditing ? 'Edit Property Lead' : 'Add Property Lead'}
      </DialogTitle>
      <DialogContent>
        <Box component="form" sx={{ mt: 2 }}>
          <TextField
            label="Zillow Link"
            name="zillowLink"
            value={formData.zillowLink}
            onChange={handleInputChange}
            onBlur={handleZillowLinkBlur}
            fullWidth
            margin="normal"
            placeholder="Paste Zillow link to auto-fill address and price"
          />
          <TextField
            label="Address"
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            fullWidth
            margin="normal"
            required
          />
          <TextField
            label="Listing Price"
            name="listingPrice"
            value={formatInputCurrency(Number(formData.listingPrice))}
            onChange={(e) => {
              setFormData((prev: any) => ({
                ...prev,
                listingPrice: handleCurrencyInput(e.target.value)
              }));
            }}
            fullWidth
            margin="normal"
            required
            InputProps={{
              startAdornment: <span style={{ marginRight: '8px' }}>$</span>,
            }}
          />
          <TextField
            label="Seller Phone"
            name="sellerPhone"
            value={formData.sellerPhone}
            onChange={handleInputChange}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Seller Email"
            name="sellerEmail"
            value={formData.sellerEmail}
            onChange={handleInputChange}
            fullWidth
            margin="normal"
            type="email"
          />
          <TextField
            label="Square Footage"
            name="squareFootage"
            value={formData.squareFootage !== null ? formData.squareFootage : ''}
            onChange={(e) => {
              const value = e.target.value.trim() === '' ? null : parseInt(e.target.value, 10);
              setFormData((prev: any) => ({ ...prev, squareFootage: value }));
            }}
            fullWidth
            margin="normal"
            type="number"
          />
          <TextField
            label="Units"
            name="units"
            value={formData.units !== null ? formData.units : ''}
            onChange={(e) => {
              const value = e.target.value.trim() === '' ? null : parseInt(e.target.value, 10);
              setFormData((prev: any) => ({ ...prev, units: value }));
            }}
            fullWidth
            margin="normal"
            type="number"
            inputProps={{ min: 1 }}
          />
          <TextField
            label="Notes"
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            fullWidth
            margin="normal"
            multiline
            rows={3}
            placeholder="Add any notes about this property lead..."
          />

          {/* Stage Tracking Section */}
          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" gutterBottom>
            Stage Tracking
          </Typography>

          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <DatePicker
                label="Contacted Date"
                value={formData.lastContactDate ? new Date(formData.lastContactDate) : null}
                onChange={(newValue) => setFormData({ ...formData, lastContactDate: newValue ? newValue.toISOString() : null })}
                slotProps={{
                  textField: {
                    fullWidth: true,
                  },
                }}
              />

              <DatePicker
                label="Responded Date"
                value={formData.respondedDate ? new Date(formData.respondedDate) : null}
                onChange={(newValue) => setFormData({ ...formData, respondedDate: newValue ? newValue.toISOString() : null })}
                slotProps={{
                  textField: {
                    fullWidth: true,
                  },
                }}
              />

              <DatePicker
                label="Converted Date"
                value={formData.convertedDate ? new Date(formData.convertedDate) : null}
                onChange={(newValue) => setFormData({ ...formData, convertedDate: newValue ? newValue.toISOString() : null })}
                slotProps={{
                  textField: {
                    fullWidth: true,
                  },
                }}
              />

              <DatePicker
                label="Under Contract Date"
                value={formData.underContractDate ? new Date(formData.underContractDate) : null}
                onChange={(newValue) => setFormData({ ...formData, underContractDate: newValue ? newValue.toISOString() : null })}
                slotProps={{
                  textField: {
                    fullWidth: true,
                  },
                }}
              />

              <DatePicker
                label="Sold Date"
                value={formData.soldDate ? new Date(formData.soldDate) : null}
                onChange={(newValue) => setFormData({ ...formData, soldDate: newValue ? newValue.toISOString() : null })}
                slotProps={{
                  textField: {
                    fullWidth: true,
                  },
                }}
              />
            </Box>
          </LocalizationProvider>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={() => onSave(formData)} variant="contained" color="primary">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PropertyLeadDialog; 
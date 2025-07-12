import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box
} from '@mui/material';

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
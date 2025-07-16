import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  styled,
} from '@mui/material';
import { Property, PropertyStatus } from '../types/property';

// Styled MenuItem for status dropdown
const StyledMenuItem = styled(MenuItem)<{ statuscolor: string }>(({ statuscolor }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  '&::before': {
    content: '""',
    display: 'block',
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    backgroundColor: statuscolor,
  },
}));

interface PropertyDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (property: Omit<Property, 'id'>) => Promise<void>;
  property?: Property | null;
  isEditing: boolean;
}

const PropertyDialog: React.FC<PropertyDialogProps> = ({
  open,
  onClose,
  onSave,
  property,
  isEditing
}) => {
  const [newProperty, setNewProperty] = useState<Omit<Property, 'id'>>({
    address: '',
    status: 'Opportunity',
    listingPrice: 0,
    offerPrice: 0,
    rehabCosts: 0,
    potentialRent: 0,
    arv: 0,
    rentCastEstimates: {
      price: 0,
      priceLow: 0,
      priceHigh: 0,
      rent: 0,
      rentLow: 0,
      rentHigh: 0
    },
    todoMetaData: {
      todoistSectionId: null
    },
    hasRentcastData: false,
    notes: '',
    score: 0,
    zillowLink: '',
    squareFootage: null,
    units: null
  });

  // Helper function to get status color
  const getStatusColor = (status: PropertyStatus): string => {
    switch (status) {
      case 'Opportunity':
        return '#4CAF50'; // Green
      case 'Soft Offer':
        return '#FFC107'; // Amber
      case 'Hard Offer':
        return '#FF9800'; // Orange
      case 'Rehab':
        return '#F44336'; // Red
      case 'Operational':
        return '#2196F3'; // Blue
      case 'Needs Tenant':
        return '#9C27B0'; // Purple
      case 'Selling':
        return '#FF5722'; // Deep Orange
      default:
        return '#757575'; // Grey
    }
  };

  const handleCurrencyInput = (value: string) => {
    // Remove any non-digit characters
    const numericValue = value.replace(/[^0-9]/g, '');
    return numericValue ? parseInt(numericValue) : 0;
  };

  const formatInputCurrency = (value: number) => {
    if (value === 0) return '';
    return value.toLocaleString('en-US');
  };

  const parseZillowLink = (url: string) => {
    try {
      // Extract address from URL
      const addressMatch = url.match(/\/homedetails\/([^/]+)/);
      if (addressMatch) {
        const address = addressMatch[1]
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        
        // Extract price from URL - try multiple patterns
        let price = 0;
        
        // Try to find price in the URL path
        const pathPriceMatch = url.match(/\$(\d{3}(?:,\d{3})*(?:\.\d{2})?)/);
        if (pathPriceMatch) {
          price = handleCurrencyInput(pathPriceMatch[1]);
        }
        
        // If no price in path, try to find it in the title/description part
        if (!price) {
          const titlePriceMatch = url.match(/title=([^&]+)/);
          if (titlePriceMatch) {
            const title = decodeURIComponent(titlePriceMatch[1]);
            const priceMatch = title.match(/\$(\d{3}(?:,\d{3})*(?:\.\d{2})?)/);
            if (priceMatch) {
              price = handleCurrencyInput(priceMatch[1]);
            }
          }
        }

        return { address, price };
      }
      return null;
    } catch (error) {
      console.error('Error parsing Zillow link:', error);
      return null;
    }
  };

  const handleZillowLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setNewProperty({ ...newProperty, zillowLink: url });
    
    // Only parse if we're not editing and the URL is a valid Zillow link
    if (!isEditing && url.includes('zillow.com')) {
      const parsedData = parseZillowLink(url);
      if (parsedData) {
        setNewProperty(prev => ({
          ...prev,
          address: parsedData.address,
          zillowLink: url
        }));
      }
    }
  };

  const handleSave = async () => {
    try {
      await onSave(newProperty);
      handleClose();
    } catch (error) {
      console.error('Error saving property:', error);
    }
  };

  const handleClose = () => {
    setNewProperty({
      address: '',
      status: 'Opportunity',
      listingPrice: 0,
      offerPrice: 0,
      rehabCosts: 0,
      potentialRent: 0,
      arv: 0,
      rentCastEstimates: {
        price: 0,
        priceLow: 0,
        priceHigh: 0,
        rent: 0,
        rentLow: 0,
        rentHigh: 0
      },
      todoMetaData: {
        todoistSectionId: null
      },
      hasRentcastData: false,
      notes: '',
      score: 0,
      zillowLink: '',
      squareFootage: null,
      units: null
    });
    onClose();
  };

  // Update form when property prop changes (for editing)
  useEffect(() => {
    if (property && isEditing) {
      setNewProperty({
        address: property.address,
        status: property.status,
        listingPrice: property.listingPrice,
        offerPrice: property.offerPrice,
        rehabCosts: property.rehabCosts,
        potentialRent: property.potentialRent,
        arv: property.arv,
        rentCastEstimates: property.rentCastEstimates,
        todoMetaData: property.todoMetaData || { todoistSectionId: null },
        hasRentcastData: property.hasRentcastData,
        notes: property.notes,
        score: property.score,
        zillowLink: property.zillowLink,
        squareFootage: property.squareFootage,
        units: property.units
      });
    }
  }, [property, isEditing]);

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="md" 
      fullWidth 
      PaperProps={{ sx: { borderRadius: 2 } }}
    >
      <DialogTitle sx={{ fontSize: '1.25rem', fontWeight: 500, pb: 1 }}>
        {isEditing ? 'Edit Property' : 'Add New Property'}
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ p: 1 }}>
          <TextField
            fullWidth
            label="Zillow Link"
            value={newProperty.zillowLink}
            onChange={handleZillowLinkChange}
            margin="normal"
            placeholder="Paste Zillow link to auto-fill address and price"
            variant="outlined"
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Address"
            value={newProperty.address}
            onChange={(e) => setNewProperty({ ...newProperty, address: e.target.value })}
            margin="normal"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Status</InputLabel>
            <Select
              value={newProperty.status}
              onChange={(e) => setNewProperty({ ...newProperty, status: e.target.value as PropertyStatus })}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box 
                    sx={{ 
                      width: 16, 
                      height: 16, 
                      borderRadius: '50%', 
                      backgroundColor: getStatusColor(selected as PropertyStatus),
                    }} 
                  />
                  {selected}
                </Box>
              )}
            >
              <StyledMenuItem value="Opportunity" statuscolor={getStatusColor('Opportunity')}>
                Opportunity
              </StyledMenuItem>
              <StyledMenuItem value="Soft Offer" statuscolor={getStatusColor('Soft Offer')}>
                Soft Offer
              </StyledMenuItem>
              <StyledMenuItem value="Hard Offer" statuscolor={getStatusColor('Hard Offer')}>
                Hard Offer
              </StyledMenuItem>
              <StyledMenuItem value="Rehab" statuscolor={getStatusColor('Rehab')}>
                Rehab
              </StyledMenuItem>
              <StyledMenuItem value="Operational" statuscolor={getStatusColor('Operational')}>
                Operational
              </StyledMenuItem>
              <StyledMenuItem value="Needs Tenant" statuscolor={getStatusColor('Needs Tenant')}>
                Needs Tenant
              </StyledMenuItem>
              <StyledMenuItem value="Selling" statuscolor={getStatusColor('Selling')}>
                Selling
              </StyledMenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Listing Price"
            value={formatInputCurrency(newProperty.listingPrice)}
            onChange={(e) => setNewProperty({ ...newProperty, listingPrice: handleCurrencyInput(e.target.value) })}
            margin="normal"
            InputProps={{
              startAdornment: <span style={{ marginRight: '8px' }}>$</span>,
            }}
          />
          <TextField
            fullWidth
            label="Offer Price"
            value={formatInputCurrency(newProperty.offerPrice)}
            onChange={(e) => setNewProperty({ ...newProperty, offerPrice: handleCurrencyInput(e.target.value) })}
            margin="normal"
            InputProps={{
              startAdornment: <span style={{ marginRight: '8px' }}>$</span>,
            }}
          />
          <TextField
            fullWidth
            label="Rehab Costs"
            value={formatInputCurrency(newProperty.rehabCosts)}
            onChange={(e) => setNewProperty({ ...newProperty, rehabCosts: handleCurrencyInput(e.target.value) })}
            margin="normal"
            InputProps={{
              startAdornment: <span style={{ marginRight: '8px' }}>$</span>,
            }}
          />
          <TextField
            fullWidth
            label="Potential Monthly Rent"
            value={formatInputCurrency(newProperty.potentialRent)}
            onChange={(e) => setNewProperty({ ...newProperty, potentialRent: handleCurrencyInput(e.target.value) })}
            margin="normal"
            InputProps={{
              startAdornment: <span style={{ marginRight: '8px' }}>$</span>,
            }}
          />
          <TextField
            fullWidth
            label="ARV"
            value={formatInputCurrency(newProperty.arv)}
            onChange={(e) => setNewProperty({ ...newProperty, arv: handleCurrencyInput(e.target.value) })}
            margin="normal"
            InputProps={{
              startAdornment: <span style={{ marginRight: '8px' }}>$</span>,
            }}
          />
          <TextField
            fullWidth
            label="Square Footage"
            value={newProperty.squareFootage !== null ? newProperty.squareFootage : ''}
            onChange={(e) => {
              const value = e.target.value.trim() === '' ? null : parseInt(e.target.value, 10);
              setNewProperty({ ...newProperty, squareFootage: value });
            }}
            margin="normal"
            type="number"
          />
          <TextField
            fullWidth
            label="Units"
            value={newProperty.units !== null ? newProperty.units : ''}
            onChange={(e) => {
              const value = e.target.value.trim() === '' ? null : parseInt(e.target.value, 10);
              setNewProperty({ ...newProperty, units: value });
            }}
            margin="normal"
            type="number"
            inputProps={{ min: 1 }}
          />
          <TextField
            fullWidth
            label="Notes"
            multiline
            rows={4}
            value={newProperty.notes}
            onChange={(e) => setNewProperty({ ...newProperty, notes: e.target.value })}
            margin="normal"
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} color="inherit" sx={{ borderRadius: 2 }}>
          Cancel
        </Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          color="primary"
          sx={{ borderRadius: 2 }}
        >
          {isEditing ? 'Update' : 'Add'} Property
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PropertyDialog; 
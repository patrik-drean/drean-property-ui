import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tooltip,
} from '@mui/material';
import { Property, PropertyStatus } from '../types/property';
import { getProperties, addProperty, archiveProperty, updateProperty } from '../services/api';

const PropertiesPage: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
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
    notes: '',
    score: 0,
    zillowLink: ''
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
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

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const data = await getProperties();
        setProperties(data);
      } catch (error) {
        console.error('Error fetching properties:', error);
      }
    };
    fetchProperties();
  }, []);

  const handleEditProperty = (property: Property) => {
    setIsEditing(true);
    setEditingId(property.id);
    setNewProperty({
      address: property.address,
      status: property.status,
      listingPrice: property.listingPrice,
      offerPrice: property.offerPrice,
      rehabCosts: property.rehabCosts,
      potentialRent: property.potentialRent,
      arv: property.arv,
      rentCastEstimates: property.rentCastEstimates,
      notes: property.notes,
      score: property.score,
      zillowLink: property.zillowLink
    });
    setOpenDialog(true);
  };

  const handleSaveProperty = async () => {
    try {
      if (isEditing && editingId) {
        // Update existing property
        const updatedProperty = await updateProperty(editingId, newProperty);
        setProperties(properties.map(p => 
          p.id === editingId ? { ...updatedProperty } : p
        ));
      } else {
        // Add new property
        const addedProperty = await addProperty(newProperty);
        setProperties([...properties, addedProperty]);
      }
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving property:', error);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setIsEditing(false);
    setEditingId(null);
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
      notes: '',
      score: 0,
      zillowLink: ''
    });
  };

  const handleArchive = async (id: string) => {
    try {
      await archiveProperty(id);
      setProperties(properties.filter(p => p.id !== id));
    } catch (error) {
      console.error('Error archiving property:', error);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Properties
      </Typography>
      
      <Button
        variant="contained"
        color="primary"
        onClick={() => setOpenDialog(true)}
        sx={{ mb: 2 }}
      >
        Add Property
      </Button>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Address</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Listing Price</TableCell>
              <TableCell>Offer Price</TableCell>
              <TableCell>Rehab Costs</TableCell>
              <TableCell>Potential Rent</TableCell>
              <TableCell>ARV</TableCell>
              <TableCell>
                <Tooltip title="Hover to see rent range">
                  <span>Estimated Rent</span>
                </Tooltip>
              </TableCell>
              <TableCell>
                <Tooltip title="Hover to see price range">
                  <span>Estimated Price</span>
                </Tooltip>
              </TableCell>
              <TableCell>Score</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {properties.map((property) => (
              <TableRow key={property.id}>
                <TableCell>
                  <a href={property.zillowLink} target="_blank" rel="noopener noreferrer">
                    {property.address}
                  </a>
                </TableCell>
                <TableCell>{property.status}</TableCell>
                <TableCell>{formatCurrency(property.listingPrice)}</TableCell>
                <TableCell>{formatCurrency(property.offerPrice)}</TableCell>
                <TableCell>{formatCurrency(property.rehabCosts)}</TableCell>
                <TableCell>{formatCurrency(property.potentialRent)}</TableCell>
                <TableCell>{formatCurrency(property.arv)}</TableCell>
                <TableCell>{formatCurrency(property.rentCastEstimates.rent)}</TableCell>
                <TableCell>{formatCurrency(property.rentCastEstimates.price)}</TableCell>
                <TableCell>{property.score}/10</TableCell>
                <TableCell>
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={() => handleEditProperty(property)}
                    sx={{ mr: 1 }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={() => handleArchive(property.id)}
                  >
                    Archive
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{isEditing ? 'Edit Property' : 'Add New Property'}</DialogTitle>
        <DialogContent>
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
            >
              <MenuItem value="Opportunity">Opportunity</MenuItem>
              <MenuItem value="Soft Offer">Soft Offer</MenuItem>
              <MenuItem value="Hard Offer">Hard Offer</MenuItem>
              <MenuItem value="Rehab">Rehab</MenuItem>
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
            label="Zillow Link"
            value={newProperty.zillowLink}
            onChange={(e) => setNewProperty({ ...newProperty, zillowLink: e.target.value })}
            margin="normal"
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
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSaveProperty} variant="contained" color="primary">
            {isEditing ? 'Save Changes' : 'Add Property'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default PropertiesPage; 
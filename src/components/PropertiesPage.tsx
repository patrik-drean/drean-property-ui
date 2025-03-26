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
import { getProperties, addProperty, archiveProperty } from '../services/api';

const PropertiesPage: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
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

  const handleAddProperty = async () => {
    try {
      const addedProperty = await addProperty(newProperty);
      setProperties([...properties, addedProperty]);
      setOpenDialog(false);
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
    } catch (error) {
      console.error('Error adding property:', error);
    }
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
                <TableCell>${property.listingPrice.toLocaleString()}</TableCell>
                <TableCell>${property.offerPrice.toLocaleString()}</TableCell>
                <TableCell>${property.rehabCosts.toLocaleString()}</TableCell>
                <TableCell>${property.potentialRent.toLocaleString()}</TableCell>
                <TableCell>${property.arv.toLocaleString()}</TableCell>
                <TableCell>${property.rentCastEstimates.rent.toLocaleString()}</TableCell>
                <TableCell>${property.rentCastEstimates.price.toLocaleString()}</TableCell>
                <TableCell>{property.score}/10</TableCell>
                <TableCell>
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

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add New Property</DialogTitle>
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
            type="number"
            value={newProperty.listingPrice}
            onChange={(e) => setNewProperty({ ...newProperty, listingPrice: Number(e.target.value) })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Offer Price"
            type="number"
            value={newProperty.offerPrice}
            onChange={(e) => setNewProperty({ ...newProperty, offerPrice: Number(e.target.value) })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Rehab Costs"
            type="number"
            value={newProperty.rehabCosts}
            onChange={(e) => setNewProperty({ ...newProperty, rehabCosts: Number(e.target.value) })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Potential Monthly Rent"
            type="number"
            value={newProperty.potentialRent}
            onChange={(e) => setNewProperty({ ...newProperty, potentialRent: Number(e.target.value) })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="ARV"
            type="number"
            value={newProperty.arv}
            onChange={(e) => setNewProperty({ ...newProperty, arv: Number(e.target.value) })}
            margin="normal"
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
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleAddProperty} variant="contained" color="primary">
            Add Property
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default PropertiesPage; 
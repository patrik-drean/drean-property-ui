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
  IconButton,
} from '@mui/material';
import * as Icons from '@mui/icons-material';
import { Property, PropertyStatus } from '../types/property';
import { getProperties, addProperty, archiveProperty, updateProperty, getZillowData } from '../services/api';

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

  const formatPercentage = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value);
  };

  const calculateRentRatio = (rent: number, offerPrice: number, rehabCosts: number) => {
    const totalInvestment = offerPrice + rehabCosts;
    if (!totalInvestment) return 0;
    return rent / totalInvestment;
  };

  const calculateARVRatio = (offerPrice: number, rehabCosts: number, arv: number) => {
    if (!arv) return 0;
    return (offerPrice + rehabCosts) / arv;
  };

  const calculateDiscount = (listingPrice: number, offerPrice: number) => {
    if (!listingPrice) return 0;
    return (listingPrice - offerPrice) / listingPrice;
  };

  const calculateScore = (property: Omit<Property, 'id'>) => {
    let score = 0;
    const maxScore = 10;
    
    // Rent to price ratio (4 points) - highest priority
    const rentRatio = calculateRentRatio(property.potentialRent, property.offerPrice, property.rehabCosts);
    if (rentRatio >= 0.01) { // 1% or higher
      score += 4;
    } else if (rentRatio >= 0.008) { // Close to 1%
      score += 3;
    } else if (rentRatio >= 0.006) { // Getting there
      score += 2;
    } else if (rentRatio >= 0.004) { // Not great but not terrible
      score += 1;
    }

    // ARV ratio (3 points)
    const arvRatio = calculateARVRatio(property.offerPrice, property.rehabCosts, property.arv);
    if (arvRatio <= 0.8) { // 80% or lower is good
      score += 3;
    } else if (arvRatio <= 0.85) {
      score += 2;
    } else if (arvRatio <= 0.9) {
      score += 1;
    }

    // Discount (2 points)
    const discount = calculateDiscount(property.listingPrice, property.offerPrice);
    if (discount >= 0.15) { // 15% or higher discount
      score += 2;
    } else if (discount >= 0.1) {
      score += 1;
    }

    // Rehab costs (1 point)
    if (property.rehabCosts < 50000) {
      score += 1;
    }

    // Ensure minimum score of 1
    return Math.max(1, score);
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

  const getStatusColor = (status: PropertyStatus) => {
    switch (status) {
      case 'Opportunity':
        return '#4CAF50'; // Green
      case 'Soft Offer':
        return '#FFC107'; // Amber
      case 'Hard Offer':
        return '#FF9800'; // Orange
      case 'Rehab':
        return '#F44336'; // Red
      default:
        return '#757575'; // Grey
    }
  };

  const getStatusOrder = (status: PropertyStatus) => {
    switch (status) {
      case 'Opportunity':
        return 0;
      case 'Soft Offer':
        return 1;
      case 'Hard Offer':
        return 2;
      case 'Rehab':
        return 3;
      default:
        return 4;
    }
  };

  const sortedProperties = [...properties].sort((a, b) => {
    const orderA = getStatusOrder(a.status);
    const orderB = getStatusOrder(b.status);
    return orderA - orderB;
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
      const propertyWithScore = {
        ...newProperty,
        score: calculateScore(newProperty)
      };

      if (isEditing && editingId) {
        // Update existing property - only send the fields that can be updated
        const propertyToUpdate = {
          address: propertyWithScore.address,
          status: propertyWithScore.status,
          listingPrice: propertyWithScore.listingPrice,
          offerPrice: propertyWithScore.offerPrice,
          rehabCosts: propertyWithScore.rehabCosts,
          potentialRent: propertyWithScore.potentialRent,
          arv: propertyWithScore.arv,
          notes: propertyWithScore.notes,
          score: propertyWithScore.score,
          zillowLink: propertyWithScore.zillowLink,
          // Send a new object for rentCastEstimates to avoid tracking issues
          rentCastEstimates: {
            price: propertyWithScore.rentCastEstimates.price || 0,
            priceLow: propertyWithScore.rentCastEstimates.priceLow || 0,
            priceHigh: propertyWithScore.rentCastEstimates.priceHigh || 0,
            rent: propertyWithScore.rentCastEstimates.rent || 0,
            rentLow: propertyWithScore.rentCastEstimates.rentLow || 0,
            rentHigh: propertyWithScore.rentCastEstimates.rentHigh || 0
          }
        };
        
        console.log('Updating property:', propertyToUpdate);
        const updatedProperty = await updateProperty(editingId, propertyToUpdate);
        
        // Update local state with the returned property
        setProperties(properties.map(p => 
          p.id === editingId ? updatedProperty : p
        ));
      } else {
        // Add new property
        const addedProperty = await addProperty(propertyWithScore);
        setProperties([...properties, addedProperty]);
      }
      handleCloseDialog();
    } catch (err: any) {
      console.error('Error saving property:', err);
      if (err.response) {
        console.error('Error response:', err.response.data);
      }
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
              <TableCell>
                <Tooltip title="Monthly Rent / (Offer Price + Rehab)">
                  <span>Rent Ratio</span>
                </Tooltip>
              </TableCell>
              <TableCell>
                <Tooltip title="(Offer Price + Rehab) / ARV">
                  <span>ARV Ratio</span>
                </Tooltip>
              </TableCell>
              <TableCell>
                <Tooltip title="(Listing - Offer) / Listing">
                  <span>Discount</span>
                </Tooltip>
              </TableCell>
              <TableCell>Score</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedProperties.map((property) => (
              <TableRow key={property.id}>
                <TableCell>
                  <a href={property.zillowLink} target="_blank" rel="noopener noreferrer">
                    {property.address}
                  </a>
                </TableCell>
                <TableCell>
                  <span
                    style={{
                      backgroundColor: getStatusColor(property.status),
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      whiteSpace: 'nowrap',
                      display: 'inline-block',
                    }}
                  >
                    {property.status}
                  </span>
                </TableCell>
                <TableCell>{formatCurrency(property.listingPrice)}</TableCell>
                <TableCell>{formatCurrency(property.offerPrice)}</TableCell>
                <TableCell>{formatCurrency(property.rehabCosts)}</TableCell>
                <TableCell>{formatCurrency(property.potentialRent)}</TableCell>
                <TableCell>{formatCurrency(property.arv)}</TableCell>
                <TableCell>{formatCurrency(property.rentCastEstimates.rent)}</TableCell>
                <TableCell>{formatCurrency(property.rentCastEstimates.price)}</TableCell>
                <TableCell>{formatPercentage(calculateRentRatio(property.potentialRent, property.offerPrice, property.rehabCosts))}</TableCell>
                <TableCell>{formatPercentage(calculateARVRatio(property.offerPrice, property.rehabCosts, property.arv))}</TableCell>
                <TableCell>{formatPercentage(calculateDiscount(property.listingPrice, property.offerPrice))}</TableCell>
                <TableCell>{property.score}/10</TableCell>
                <TableCell>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Tooltip title="Edit Property">
                      <IconButton
                        color="primary"
                        onClick={() => handleEditProperty(property)}
                        size="small"
                      >
                        <Icons.Edit />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Archive Property">
                      <IconButton
                        color="secondary"
                        onClick={() => handleArchive(property.id)}
                        size="small"
                      >
                        <Icons.Archive />
                      </IconButton>
                    </Tooltip>
                  </div>
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
            label="Zillow Link"
            value={newProperty.zillowLink}
            onChange={handleZillowLinkChange}
            margin="normal"
            placeholder="Paste Zillow link to auto-fill address and price"
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
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
  Tooltip,
  IconButton,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import * as Icons from '@mui/icons-material';
import { Property, PropertyStatus } from '../types/property';
import { getArchivedProperties, restoreProperty } from '../services/api';

const ArchivedPropertiesPage: React.FC = () => {
  const [archivedProperties, setArchivedProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const fetchArchivedProperties = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getArchivedProperties();
      setArchivedProperties(data);
    } catch (error) {
      console.error('Error fetching archived properties:', error);
      setError('Failed to load archived properties. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArchivedProperties();
  }, []);

  const handleRestore = async (property: Property) => {
    try {
      await restoreProperty(property.id, property);
      setSnackbar({
        open: true,
        message: 'Property restored successfully',
        severity: 'success',
      });
      // Refresh the list after restoration
      fetchArchivedProperties();
    } catch (error: any) {
      console.error('Error restoring property:', error);
      let errorMessage = 'Failed to restore property';
      
      // Check if backend returned a specific error message
      if (error.response) {
        if (error.response.status === 404) {
          errorMessage = 'Property not found';
        } else if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      }
      
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error',
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

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

  // Helper functions to get cell colors based on values
  const getRentRatioColor = (ratio: number) => {
    if (ratio >= 0.01) return '#4CAF50'; // Green for >= 1%
    if (ratio >= 0.009) return '#FFC107'; // Yellow for >= 0.9%
    return '#F44336'; // Red for < 0.9%
  };

  const getARVRatioColor = (ratio: number) => {
    if (ratio <= 0.75) return '#4CAF50'; // Green for <= 75%
    if (ratio <= 0.85) return '#FFC107'; // Yellow for <= 85%
    return '#F44336'; // Red for > 85%
  };

  const getScoreColor = (score: number) => {
    if (score >= 9) return '#4CAF50'; // Green for 9-10
    if (score >= 7) return '#FFC107'; // Yellow for 7-8
    return '#F44336'; // Red for <= 6
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Archived Properties
      </Typography>
      
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
          <CircularProgress />
        </div>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : archivedProperties.length === 0 ? (
        <Typography>No archived properties found.</Typography>
      ) : (
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
                <TableCell sx={{ backgroundColor: '#f5f5f5' }}>
                  <Tooltip title="Hover over values to see the estimated rent range from Rentcast">
                    <span>Estimated Rent</span>
                  </Tooltip>
                </TableCell>
                <TableCell sx={{ backgroundColor: '#f5f5f5' }}>
                  <Tooltip title="Hover over values to see the estimated price range from Rentcast">
                    <span>Estimated Price</span>
                  </Tooltip>
                </TableCell>
                <TableCell sx={{ backgroundColor: '#f5f5f5' }}>
                  <Tooltip title="Monthly Rent / (Offer Price + Rehab)">
                    <span>Rent Ratio</span>
                  </Tooltip>
                </TableCell>
                <TableCell sx={{ backgroundColor: '#f5f5f5' }}>
                  <Tooltip title="(Offer Price + Rehab) / ARV">
                    <span>ARV Ratio</span>
                  </Tooltip>
                </TableCell>
                <TableCell sx={{ backgroundColor: '#f5f5f5' }}>
                  <Tooltip title="(Listing - Offer) / Listing">
                    <span>Discount</span>
                  </Tooltip>
                </TableCell>
                <TableCell sx={{ backgroundColor: '#f5f5f5' }}>Score</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {archivedProperties.map((property) => (
                <TableRow key={property.id}>
                  <TableCell>
                    <Tooltip title={property.notes || "No notes available"} arrow placement="top-start">
                      <a href={property.zillowLink} target="_blank" rel="noopener noreferrer">
                        {property.address}
                      </a>
                    </Tooltip>
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
                  <TableCell sx={{ backgroundColor: '#f5f5f5' }}>
                    {property.hasRentcastData ? (
                      <Tooltip title={`Rentcast Data: ${formatCurrency(property.rentCastEstimates.rentLow)} - ${formatCurrency(property.rentCastEstimates.rentHigh)}`}>
                        <span style={{ display: 'flex', alignItems: 'center' }}>
                          {formatCurrency(property.rentCastEstimates.rent)}
                          <Icons.Check color="success" style={{ fontSize: 16, marginLeft: 4 }} />
                        </span>
                      </Tooltip>
                    ) : (
                      formatCurrency(property.rentCastEstimates.rent)
                    )}
                  </TableCell>
                  <TableCell sx={{ backgroundColor: '#f5f5f5' }}>
                    {property.hasRentcastData ? (
                      <Tooltip title={`Rentcast Data: ${formatCurrency(property.rentCastEstimates.priceLow)} - ${formatCurrency(property.rentCastEstimates.priceHigh)}`}>
                        <span style={{ display: 'flex', alignItems: 'center' }}>
                          {formatCurrency(property.rentCastEstimates.price)}
                          <Icons.Check color="success" style={{ fontSize: 16, marginLeft: 4 }} />
                        </span>
                      </Tooltip>
                    ) : (
                      formatCurrency(property.rentCastEstimates.price)
                    )}
                  </TableCell>
                  <TableCell sx={{ backgroundColor: '#f5f5f5' }}>
                    <span style={{ 
                      color: getRentRatioColor(calculateRentRatio(property.potentialRent, property.offerPrice, property.rehabCosts)),
                      fontWeight: 'bold'
                    }}>
                      {formatPercentage(calculateRentRatio(property.potentialRent, property.offerPrice, property.rehabCosts))}
                    </span>
                  </TableCell>
                  <TableCell sx={{ backgroundColor: '#f5f5f5' }}>
                    <span style={{ 
                      color: getARVRatioColor(calculateARVRatio(property.offerPrice, property.rehabCosts, property.arv)),
                      fontWeight: 'bold'
                    }}>
                      {formatPercentage(calculateARVRatio(property.offerPrice, property.rehabCosts, property.arv))}
                    </span>
                  </TableCell>
                  <TableCell sx={{ backgroundColor: '#f5f5f5' }}>{formatPercentage(calculateDiscount(property.listingPrice, property.offerPrice))}</TableCell>
                  <TableCell sx={{ backgroundColor: '#f5f5f5' }}>
                    <span style={{ 
                      color: getScoreColor(property.score),
                      fontWeight: 'bold'
                    }}>
                      {property.score}/10
                    </span>
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Restore property">
                      <IconButton 
                        onClick={() => handleRestore(property)} 
                        color="primary"
                        size="small"
                      >
                        <Icons.Restore />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ArchivedPropertiesPage; 
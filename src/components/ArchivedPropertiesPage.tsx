import React, { useState, useEffect } from 'react';
import {
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
  CircularProgress,
  Snackbar,
  Alert,
  Box,
  Chip,
  styled,
  useTheme,
} from '@mui/material';
import * as Icons from '@mui/icons-material';
import { Property, PropertyStatus } from '../types/property';
import { api } from '../services/apiConfig';
import {
  calculateRentRatio,
  calculateARVRatio,
  calculateHoldScore,
  calculateFlipScore,
} from '../utils/scoreCalculator';
import { getStatusColor, getStatusOrder } from '../utils/statusColors';

// Status color function is now imported from utils/statusColors.ts

// Styled components for consistent UI elements
const StyledTableCell = styled(TableCell)(({ theme }) => ({
  padding: '12px 16px',
  '&.header': {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.common.white,
    fontWeight: 'bold',
  },
  '&.metric': {
    backgroundColor: theme.palette.primary.light,
    color: theme.palette.common.white,
  }
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.action.hover,
  },
  '&:last-child td, &:last-child th': {
    border: 0,
  },
  '&:hover': {
    backgroundColor: '#f8f9fa',
  }
}));

// Status chip component
interface StatusChipProps {
  status: PropertyStatus;
  label?: string;
  size?: 'small' | 'medium';
}

const StatusChip = styled(Chip, {
  shouldForwardProp: (prop) => prop !== 'status',
})<StatusChipProps>(({ theme, status }) => ({
  backgroundColor: getStatusColor(status),
  color: 'white',
  fontWeight: 500,
  borderRadius: '16px',
  minWidth: '90px',
  '& .MuiChip-label': {
    padding: '0 12px',
  }
}));

const ArchivedPropertiesPage: React.FC = () => {
  const [archivedProperties, setArchivedProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });
  const theme = useTheme();

  const fetchArchivedProperties = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getArchivedProperties();
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
      await api.restoreProperty(property.id);
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
    <Box sx={{ p: { xs: 1, md: 3 }, maxWidth: 1600, mx: 'auto', width: '100%' }}>
      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        Archived Properties
      </Typography>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : archivedProperties.length === 0 ? (
        <Paper sx={{ p: 3, borderRadius: 2 }}>
          <Typography>No archived properties found.</Typography>
          <Button 
            variant="contained" 
            color="primary" 
            sx={{ mt: 2 }}
            onClick={() => window.history.back()}
          >
            Go Back
          </Button>
        </Paper>
      ) : (
        <>
          {/* Desktop view - Table */}
          <Box sx={{ display: { xs: 'none', lg: 'block' }, width: '100%' }}>
            <TableContainer 
              component={Paper} 
              elevation={2} 
              sx={{ 
                borderRadius: 2, 
                mb: 4, 
                overflow: 'hidden',
                width: '100%'
              }}
            >
              <Table size="medium" sx={{ minWidth: 1200 }}>
                <TableHead>
                  <TableRow>
                    <StyledTableCell className="header">Address</StyledTableCell>
                    <StyledTableCell className="header">Status</StyledTableCell>
                    <StyledTableCell className="header">Listing Price</StyledTableCell>
                    <StyledTableCell className="header">Offer Price</StyledTableCell>
                    <StyledTableCell className="header">Rehab Costs</StyledTableCell>
                    <StyledTableCell className="header">Potential Rent</StyledTableCell>
                    <StyledTableCell className="header">ARV</StyledTableCell>
                    <StyledTableCell className="header metric">
                      <Tooltip title="Monthly Rent / (Offer Price + Rehab)">
                        <span>Rent Ratio</span>
                      </Tooltip>
                    </StyledTableCell>
                    <StyledTableCell className="header metric">
                      <Tooltip title="(Offer Price + Rehab) / ARV">
                        <span>ARV Ratio</span>
                      </Tooltip>
                    </StyledTableCell>
                    <StyledTableCell className="header metric">Hold Score</StyledTableCell>
                    <StyledTableCell className="header metric">Flip Score</StyledTableCell>
                    <StyledTableCell className="header">Actions</StyledTableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {archivedProperties.map((property) => (
                    <StyledTableRow key={property.id}>
                      <TableCell>
                        <Tooltip title={property.notes || "No notes available"} arrow placement="top-start">
                          <a 
                            href={property.zillowLink} 
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ 
                              color: '#1976d2', 
                              textDecoration: 'none',
                              fontWeight: 500
                            }}
                          >
                            {property.address}
                          </a>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <StatusChip 
                          status={property.status}
                          label={property.status}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{formatCurrency(property.listingPrice)}</TableCell>
                      <TableCell>{formatCurrency(property.offerPrice)}</TableCell>
                      <TableCell>{formatCurrency(property.rehabCosts)}</TableCell>
                      <TableCell>{formatCurrency(property.potentialRent)}</TableCell>
                      <TableCell>{formatCurrency(property.arv)}</TableCell>
                      <TableCell className="metric">
                        <Typography sx={{ 
                          color: getRentRatioColor(calculateRentRatio(property.potentialRent, property.offerPrice, property.rehabCosts))
                        }}>
                          {formatPercentage(calculateRentRatio(property.potentialRent, property.offerPrice, property.rehabCosts))}
                        </Typography>
                      </TableCell>
                      <TableCell className="metric">
                        <Typography sx={{ 
                          color: getARVRatioColor(calculateARVRatio(property.offerPrice, property.rehabCosts, property.arv))
                        }}>
                          {formatPercentage(calculateARVRatio(property.offerPrice, property.rehabCosts, property.arv))}
                        </Typography>
                      </TableCell>
                      <TableCell className="metric">
                        <Typography sx={{ 
                          color: getScoreColor(calculateHoldScore(property))
                        }}>
                          {calculateHoldScore(property)}/10
                        </Typography>
                      </TableCell>
                      <TableCell className="metric">
                        <Typography sx={{ 
                          color: getScoreColor(calculateFlipScore(property))
                        }}>
                          {calculateFlipScore(property)}/10
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleRestore(property)}
                          startIcon={<Icons.RestoreFromTrash />}
                        >
                          Restore
                        </Button>
                      </TableCell>
                    </StyledTableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          {/* Mobile & Tablet view - Cards */}
          <Box sx={{ display: { xs: 'flex', lg: 'none' }, flexDirection: 'column', gap: 2 }}>
            {archivedProperties.map((property) => (
              <Paper 
                key={property.id}
                elevation={2}
                sx={{ 
                  borderRadius: 2, 
                  overflow: 'hidden',
                  p: 2
                }}
              >
                {/* Card Header with Status and Scores */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <StatusChip 
                    status={property.status}
                    label={property.status}
                    size="small"
                  />
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      backgroundColor: theme.palette.primary.light,
                      color: '#fff',
                      p: 0.5,
                      px: 1,
                      borderRadius: 1
                    }}>
                      <Typography sx={{ 
                        color: getScoreColor(calculateHoldScore(property)),
                        fontWeight: 'bold',
                        mr: 0.5
                      }}>
                        {calculateHoldScore(property)}/10
                      </Typography>
                      <Typography variant="body2">Hold</Typography>
                    </Box>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      backgroundColor: theme.palette.primary.light,
                      color: '#fff',
                      p: 0.5,
                      px: 1,
                      borderRadius: 1
                    }}>
                      <Typography sx={{ 
                        color: getScoreColor(calculateFlipScore(property)),
                        fontWeight: 'bold',
                        mr: 0.5
                      }}>
                        {calculateFlipScore(property)}/10
                      </Typography>
                      <Typography variant="body2">Flip</Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Address with Zillow link */}
                <Typography 
                  variant="h6" 
                  gutterBottom
                  component="a"
                  href={property.zillowLink}
                  target="_blank" 
                  rel="noopener noreferrer"
                  sx={{
                    color: '#1976d2', 
                    textDecoration: 'none',
                    display: 'block',
                    mb: 2
                  }}
                >
                  {property.address}
                </Typography>

                {/* Financial details grid */}
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, 1fr)' },
                  gap: 2,
                  mb: 2
                }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Listing Price</Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {formatCurrency(property.listingPrice)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Offer Price</Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {formatCurrency(property.offerPrice)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Rehab Costs</Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {formatCurrency(property.rehabCosts)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Potential Rent</Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {formatCurrency(property.potentialRent)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">ARV</Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {formatCurrency(property.arv)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Rent Ratio</Typography>
                    <Typography 
                      variant="body1" 
                      fontWeight="medium"
                      sx={{ 
                        color: getRentRatioColor(calculateRentRatio(property.potentialRent, property.offerPrice, property.rehabCosts))
                      }}
                    >
                      {formatPercentage(calculateRentRatio(property.potentialRent, property.offerPrice, property.rehabCosts))}
                    </Typography>
                  </Box>
                </Box>

                {/* Notes section */}
                {property.notes && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary">Notes</Typography>
                    <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                      {property.notes}
                    </Typography>
                  </Box>
                )}

                {/* Actions */}
                <Box sx={{ 
                  display: 'flex',
                  justifyContent: 'flex-end',
                  mt: 2
                }}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<Icons.RestoreFromTrash />}
                    onClick={() => handleRestore(property)}
                  >
                    Restore Property
                  </Button>
                </Box>
              </Paper>
            ))}
          </Box>
        </>
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
    </Box>
  );
};

export default ArchivedPropertiesPage; 
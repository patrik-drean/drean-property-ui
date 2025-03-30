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
  Box,
  Card,
  CardContent,
  styled,
  Chip,
  ChipProps,
  useTheme,
} from '@mui/material';
import * as Icons from '@mui/icons-material';
import { Property, PropertyStatus } from '../types/property';
import { api } from '../services/apiConfig';
import { useNavigate } from 'react-router-dom';

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
    default:
      return '#757575'; // Grey
  }
};

// Status chip component
interface StatusChipProps extends ChipProps {
  status: PropertyStatus;
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

// Action button styling
const ActionIconButton = styled(IconButton)(({ theme }) => ({
  backgroundColor: 'rgba(25, 118, 210, 0.08)',
  '&:hover': { 
    backgroundColor: 'rgba(25, 118, 210, 0.15)'
  }
}));

const DeleteIconButton = styled(IconButton)(({ theme }) => ({
  backgroundColor: 'rgba(211, 47, 47, 0.08)',
  '&:hover': { 
    backgroundColor: 'rgba(211, 47, 47, 0.15)'
  }
}));

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
    hasRentcastData: false,
    notes: '',
    score: 0,
    zillowLink: ''
  });
  const navigate = useNavigate();
  const theme = useTheme();

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
    } 

    // ARV ratio (4 points)
    const arvRatio = calculateARVRatio(property.offerPrice, property.rehabCosts, property.arv);
    if (arvRatio <= 0.75) { // 75% or lower is good
      score += 4;
    } else if (arvRatio <= 0.80) {
      score += 3;
    } else if (arvRatio <= 0.85) {
      score += 2;
    }

    // Discount (1 point)
    const discount = calculateDiscount(property.listingPrice, property.offerPrice);
    if (discount >= 0.1) { // 10% or higher discount
      score += 1;
    } 

    // Cash remaining after refinance (1 point)
    const downPayment = (property.offerPrice + property.rehabCosts) * 0.25; // 25% down payment
    const loanAmount = (property.offerPrice + property.rehabCosts) - downPayment;
    const newLoan = property.arv * 0.75; // 75% of ARV
    const cashToPullOut = newLoan - loanAmount;
    const cashRemaining = downPayment - cashToPullOut;
    
    if (cashRemaining < 15000) { // Less than $15k cash remaining is good
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
        const data = await api.getProperties();
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
      hasRentcastData: property.hasRentcastData,
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
          hasRentcastData: propertyWithScore.hasRentcastData,
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
        const updatedProperty = await api.updateProperty(editingId, propertyToUpdate);
        
        // Update local state with the returned property
        setProperties(properties.map(p => 
          p.id === editingId ? updatedProperty : p
        ));
      } else {
        // Add new property
        const addedProperty = await api.addProperty(propertyWithScore);
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
      hasRentcastData: false,
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
      await api.archiveProperty(id);
      setProperties(properties.filter(p => p.id !== id));
    } catch (error) {
      console.error('Error archiving property:', error);
    }
  };

  const handleUpdateRentcast = async (id: string) => {
    try {
      const updatedProperty = await api.updatePropertyRentcast(id);
      setProperties(properties.map(p => p.id === id ? updatedProperty : p));
    } catch (error) {
      console.error('Error updating Rentcast data:', error);
    }
  };

  // Helper functions to get cell colors based on values
  const getRentRatioColor = (ratio: number) => {
    if (ratio >= 0.01) return '#4CAF50'; // Green for >= 1%
    if (ratio >= 0.008) return '#FFC107'; // Yellow for >= 0.8%
    return '#F44336'; // Red for < 0.8%
  };

  const getARVRatioColor = (ratio: number) => {
    if (ratio <= 0.75) return '#4CAF50'; // Green for <= 75%
    if (ratio <= 0.85) return '#FFC107'; // Yellow for <= 85%
    return '#F44336'; // Red for > 85%
  };

  const getCashRemainingColor = (amount: number) => {
    if (amount < 15000) return '#4CAF50'; // Green for < $15k
    if (amount < 25000) return '#FFC107'; // Yellow for < $25k
    return '#F44336'; // Red for >= $25k
  };

  const getScoreColor = (score: number) => {
    if (score >= 9) return '#4CAF50'; // Green for 9-10
    if (score >= 7) return '#FFC107'; // Yellow for 7-8
    return '#F44336'; // Red for <= 6
  };

  // Send property data to calculator
  const handleSendToCalculator = (property: Property) => {
    const params = new URLSearchParams({
      offerPrice: property.offerPrice.toString(),
      rehabCosts: property.rehabCosts.toString(),
      potentialRent: property.potentialRent.toString(),
      arv: property.arv.toString()
    });
    navigate(`/calculator?${params.toString()}`);
  };

  // Helper functions for the newly calculated fields
  const calculateDownPayment = (offerPrice: number, rehabCosts: number) => {
    return (offerPrice + rehabCosts) * 0.25;
  };

  const calculateLoanAmount = (offerPrice: number, rehabCosts: number) => {
    const downPayment = calculateDownPayment(offerPrice, rehabCosts);
    return (offerPrice + rehabCosts) - downPayment;
  };

  const calculateNewLoan = (arv: number) => {
    return arv * 0.75;
  };

  const calculateCashToPullOut = (offerPrice: number, rehabCosts: number, arv: number) => {
    const loanAmount = calculateLoanAmount(offerPrice, rehabCosts);
    const newLoan = calculateNewLoan(arv);
    return newLoan - loanAmount;
  };

  const calculateCashRemaining = (offerPrice: number, rehabCosts: number, arv: number) => {
    const downPayment = calculateDownPayment(offerPrice, rehabCosts);
    const cashToPullOut = calculateCashToPullOut(offerPrice, rehabCosts, arv);
    return downPayment - cashToPullOut;
  };

  const calculateHomeEquity = (arv: number) => {
    const newLoan = calculateNewLoan(arv);
    return arv - newLoan;
  };

  return (
    <Box sx={{ p: { xs: 1, md: 3 }, maxWidth: 1600, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => setOpenDialog(true)}
          startIcon={<Icons.Add />}
          sx={{ borderRadius: 2 }}
        >
          Add Property
        </Button>
      </Box>

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
          <Table size="medium" sx={{ minWidth: 1200, tableLayout: 'fixed' }}>
            <TableHead>
              <TableRow>
                <StyledTableCell className="header" width="14%">Address</StyledTableCell>
                <StyledTableCell className="header" width="9%">Status</StyledTableCell>
                <StyledTableCell className="header" width="7%">Offer Price</StyledTableCell>
                <StyledTableCell className="header" width="6%">Rehab Costs</StyledTableCell>
                <StyledTableCell className="header" width="6%">Potential Rent</StyledTableCell>
                <StyledTableCell className="header" width="6%">ARV</StyledTableCell>
                <StyledTableCell className="header metric" width="7%">
                  <Tooltip title="Hover over values to see the estimated rent range from Rentcast">
                    <span>Estimated Rent</span>
                  </Tooltip>
                </StyledTableCell>
                <StyledTableCell className="header metric" width="7%">
                  <Tooltip title="Hover over values to see the estimated price range from Rentcast">
                    <span>Estimated Price</span>
                  </Tooltip>
                </StyledTableCell>
                <StyledTableCell className="header metric" width="5%">
                  <Tooltip title="Monthly Rent / (Offer Price + Rehab)">
                    <span>Rent Ratio</span>
                  </Tooltip>
                </StyledTableCell>
                <StyledTableCell className="header metric" width="5%">
                  <Tooltip title="(Offer Price + Rehab) / ARV">
                    <span>ARV Ratio</span>
                  </Tooltip>
                </StyledTableCell>
                <StyledTableCell className="header metric" width="7%">
                  <Tooltip title="Amount left invested in the property after refinance">
                    <span>Cash Remaining</span>
                  </Tooltip>
                </StyledTableCell>
                <StyledTableCell className="header metric" width="5%">
                  <Tooltip title="(Listing - Offer) / Listing">
                    <span>Discount</span>
                  </Tooltip>
                </StyledTableCell>
                <StyledTableCell className="header metric" width="5%">Score</StyledTableCell>
                <StyledTableCell className="header metric" width="14%">Actions</StyledTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedProperties.map((property) => (
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
                      label={property.status} 
                      status={property.status} 
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Tooltip title={`Listing Price: ${formatCurrency(property.listingPrice)}`} arrow placement="top">
                      <Box component="span">
                        {formatCurrency(property.offerPrice)}
                      </Box>
                    </Tooltip>
                  </TableCell>
                  <TableCell>{formatCurrency(property.rehabCosts)}</TableCell>
                  <TableCell>{formatCurrency(property.potentialRent)}</TableCell>
                  <TableCell>{formatCurrency(property.arv)}</TableCell>
                  <TableCell className="metric">
                    {property.hasRentcastData ? (
                      <Tooltip title={`Rentcast Data: ${formatCurrency(property.rentCastEstimates.rentLow)} - ${formatCurrency(property.rentCastEstimates.rentHigh)}`}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {formatCurrency(property.rentCastEstimates.rent)}
                          <Icons.Check color="success" sx={{ fontSize: 16, ml: 0.5 }} />
                        </Box>
                      </Tooltip>
                    ) : (
                      formatCurrency(property.rentCastEstimates.rent)
                    )}
                  </TableCell>
                  <TableCell className="metric">
                    {property.hasRentcastData ? (
                      <Tooltip title={`Rentcast Data: ${formatCurrency(property.rentCastEstimates.priceLow)} - ${formatCurrency(property.rentCastEstimates.priceHigh)}`}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {formatCurrency(property.rentCastEstimates.price)}
                          <Icons.Check color="success" sx={{ fontSize: 16, ml: 0.5 }} />
                        </Box>
                      </Tooltip>
                    ) : (
                      formatCurrency(property.rentCastEstimates.price)
                    )}
                  </TableCell>
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
                    <Tooltip 
                      title={
                        <>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>Financing Details:</Typography>
                          <Typography variant="body2">Down Payment: {formatCurrency(calculateDownPayment(property.offerPrice, property.rehabCosts))}</Typography>
                          <Typography variant="body2">Loan Amount: {formatCurrency(calculateLoanAmount(property.offerPrice, property.rehabCosts))}</Typography>
                          <Typography variant="body2">New Loan: {formatCurrency(calculateNewLoan(property.arv))}</Typography>
                          <Typography variant="body2">Cash to Pull Out: {formatCurrency(calculateCashToPullOut(property.offerPrice, property.rehabCosts, property.arv))}</Typography>
                          <Typography variant="body2">Home Equity: {formatCurrency(calculateHomeEquity(property.arv))}</Typography>
                        </>
                      } 
                      arrow 
                      placement="top"
                    >
                      <Box component="span" sx={{ 
                        color: getCashRemainingColor(calculateCashRemaining(property.offerPrice, property.rehabCosts, property.arv))
                      }}>
                        {formatCurrency(calculateCashRemaining(property.offerPrice, property.rehabCosts, property.arv))}
                      </Box>
                    </Tooltip>
                  </TableCell>
                  <TableCell className="metric">{formatPercentage(calculateDiscount(property.listingPrice, property.offerPrice))}</TableCell>
                  <TableCell className="metric">
                    <Typography sx={{ 
                      color: getScoreColor(property.score)
                    }}>
                      {property.score}/10
                    </Typography>
                  </TableCell>
                  <TableCell className="metric">
                    <Box sx={{ 
                      display: 'flex',
                      gap: 1
                    }}>
                      <Tooltip title="Edit Property">
                        <ActionIconButton
                          color="primary"
                          onClick={() => handleEditProperty(property)}
                          size="small"
                        >
                          <Icons.Edit fontSize="small" />
                        </ActionIconButton>
                      </Tooltip>
                      <Tooltip title="Archive Property">
                        <DeleteIconButton
                          color="secondary"
                          onClick={() => handleArchive(property.id)}
                          size="small"
                        >
                          <Icons.Archive fontSize="small" />
                        </DeleteIconButton>
                      </Tooltip>
                      <Tooltip title="Update Rentcast Data">
                        <ActionIconButton
                          color="primary"
                          onClick={() => handleUpdateRentcast(property.id)}
                          size="small"
                        >
                          <Icons.Refresh fontSize="small" />
                        </ActionIconButton>
                      </Tooltip>
                      <Tooltip title="Send to Calculator">
                        <ActionIconButton
                          color="primary"
                          onClick={() => handleSendToCalculator(property)}
                          size="small"
                        >
                          <Icons.Calculate fontSize="small" />
                        </ActionIconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </StyledTableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Mobile & Tablet view - Cards */}
      <Box sx={{ display: { xs: 'flex', lg: 'none' }, flexDirection: 'column', gap: 2 }}>
        {sortedProperties.map((property) => (
          <Paper 
            key={property.id}
            elevation={2}
            sx={{ 
              borderRadius: 2, 
              overflow: 'hidden',
              p: 2
            }}
          >
            {/* Card Header with Status and Score */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <StatusChip 
                label={property.status} 
                status={property.status} 
                size="small"
              />
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
                  color: getScoreColor(property.score),
                  fontWeight: 'bold',
                  mr: 0.5
                }}>
                  {property.score}/10
                </Typography>
                <Typography variant="body2">Score</Typography>
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
                <Typography variant="caption" color="text.secondary">ARV</Typography>
                <Typography variant="body1" fontWeight="medium">
                  {formatCurrency(property.arv)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Potential Rent</Typography>
                <Typography variant="body1" fontWeight="medium">
                  {formatCurrency(property.potentialRent)}
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
              <Box>
                <Typography variant="caption" color="text.secondary">ARV Ratio</Typography>
                <Typography 
                  variant="body1" 
                  fontWeight="medium"
                  sx={{ 
                    color: getARVRatioColor(calculateARVRatio(property.offerPrice, property.rehabCosts, property.arv))
                  }}
                >
                  {formatPercentage(calculateARVRatio(property.offerPrice, property.rehabCosts, property.arv))}
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
              gap: 1,
              justifyContent: 'flex-end',
              mt: 2
            }}>
              <Button
                variant="outlined"
                startIcon={<Icons.Edit />}
                size="small"
                onClick={() => handleEditProperty(property)}
              >
                Edit
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<Icons.Archive />}
                size="small"
                onClick={() => handleArchive(property.id)}
              >
                Archive
              </Button>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<Icons.Update />}
                size="small"
                onClick={() => handleUpdateRentcast(property.id)}
                disabled={property.hasRentcastData}
              >
                {property.hasRentcastData ? 'Updated' : 'Update Data'}
              </Button>
            </Box>
          </Paper>
        ))}
      </Box>

      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
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
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleCloseDialog} color="inherit" sx={{ borderRadius: 2 }}>
            Cancel
          </Button>
          <Button 
            onClick={handleSaveProperty} 
            variant="contained" 
            color="primary"
            sx={{ borderRadius: 2 }}
          >
            {isEditing ? 'Update' : 'Add'} Property
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PropertiesPage; 
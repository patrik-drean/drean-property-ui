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
  Snackbar,
  Alert,
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

// Add new helper function for score background color
const getScoreBackgroundColor = (score: number): string => {
  if (score >= 9) return '#4CAF50'; // Green
  if (score >= 7) return '#FFC107'; // Amber
  return '#F44336'; // Red
};

// Update the getScoreColor function to ensure text contrast
const getScoreColor = (score: number): string => {
  if (score >= 9) return '#E8F5E9'; // Light green text for green background
  if (score >= 7) return '#212121'; // Dark text for amber background
  return '#FFEBEE'; // Light red text for red background
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
  const [snackbarOpen, setSnackbarOpen] = useState(false);
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

  // Helper functions for the newly calculated fields
  const calculateDownPayment = (offerPrice: number, rehabCosts: number) => {
    return (offerPrice + rehabCosts) * 0.25;
  };

  const calculateLoanAmount = (offerPrice: number, rehabCosts: number) => {
    const downPayment = calculateDownPayment(offerPrice, rehabCosts);
    return (offerPrice + rehabCosts) - downPayment;
  };

  const calculateCashRemaining = () => {
    // Fixed at $20,000
    return 20000;
  };

  const calculateNewLoan = (offerPrice: number, rehabCosts: number, arv: number) => {
    // Instead of using a fixed 75% of ARV, calculate based on fixed cash remaining
    const downPayment = calculateDownPayment(offerPrice, rehabCosts);
    const loanAmount = calculateLoanAmount(offerPrice, rehabCosts);
    return loanAmount + (downPayment - calculateCashRemaining());
  };

  const calculateCashToPullOut = (offerPrice: number, rehabCosts: number, arv: number) => {
    const downPayment = calculateDownPayment(offerPrice, rehabCosts);
    // Cash to pull out is downPayment minus fixed cash remaining
    return downPayment - calculateCashRemaining();
  };

  const calculateHomeEquity = (offerPrice: number, rehabCosts: number, arv: number) => {
    const newLoan = calculateNewLoan(offerPrice, rehabCosts, arv);
    return arv - newLoan;
  };

  const calculateNewLoanPercent = (offerPrice: number, rehabCosts: number, arv: number) => {
    if (!arv) return 0;
    const newLoan = calculateNewLoan(offerPrice, rehabCosts, arv);
    return newLoan / arv;
  };

  // Helper functions to calculate individual score components
  const calculateRentRatioScore = (rentRatio: number): number => {
    if (rentRatio >= 0.01) return 4; // 1% or higher
    if (rentRatio >= 0.008) return 3; // Close to 1%
    if (rentRatio >= 0.006) return 2; // Getting there
    return 0;
  };

  const calculateARVRatioScore = (arvRatio: number): number => {
    if (arvRatio <= 0.75) return 4; // 75% or lower is good
    if (arvRatio <= 0.80) return 3;
    if (arvRatio <= 0.85) return 2;
    return 0;
  };

  const calculateHomeEquityScore = (homeEquity: number): number => {
    if (homeEquity >= 65000) return 2; // $65k or more equity is good
    if (homeEquity >= 50000) return 1;
    return 0;
  };

  const calculateScore = (property: Omit<Property, 'id'>) => {
    let score = 0;
    
    // Rent to price ratio (4 points)
    const rentRatio = calculateRentRatio(property.potentialRent, property.offerPrice, property.rehabCosts);
    const rentRatioScore = calculateRentRatioScore(rentRatio);
    score += rentRatioScore;

    // ARV ratio (4 points)
    const arvRatio = calculateARVRatio(property.offerPrice, property.rehabCosts, property.arv);
    const arvRatioScore = calculateARVRatioScore(arvRatio);
    score += arvRatioScore;

    // Home Equity (2 points)
    const homeEquity = calculateHomeEquity(property.offerPrice, property.rehabCosts, property.arv);
    const homeEquityScore = calculateHomeEquityScore(homeEquity);
    score += homeEquityScore;

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
    
    // First sort by status
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    
    // Then sort by calculated score in descending order
    const scoreA = calculateScore(a);
    const scoreB = calculateScore(b);
    return scoreB - scoreA;
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

  const getCashRemainingColor = () => {
    // Always return the same color since cash remaining is fixed at $20,000
    return '#FFC107'; // Yellow for $20k
  };

  const getHomeEquityColor = (equity: number) => {
    if (equity >= 65000) return '#4CAF50'; // Green for >= $65k
    if (equity >= 45000) return '#FFC107'; // Yellow for >= $45k
    return '#F44336'; // Red for < $45k
  };

  // Send property data to calculator
  const handleSendToCalculator = (property: Property) => {
    // Calculate new loan percentage for the calculator
    const newLoanPercent = Math.round(calculateNewLoanPercent(property.offerPrice, property.rehabCosts, property.arv) * 100);
    
    const params = new URLSearchParams({
      offerPrice: property.offerPrice.toString(),
      rehabCosts: property.rehabCosts.toString(),
      potentialRent: property.potentialRent.toString(),
      arv: property.arv.toString(),
      newLoanPercent: newLoanPercent.toString()
    });
    navigate(`/calculator?${params.toString()}`);
  };

  // Helper function to format the message template
  const formatMessageTemplate = (property: Property) => {
    return `Got another potential proprety, what are your thoughts?
- Seller says we could offer around ${formatCurrency(property.offerPrice)}
- How much to repair? (Ideally under ${formatCurrency(property.rehabCosts)})
- ARV potential? (Ideally ${formatCurrency(property.arv)}+)
- How much can we rent? (Ideally ${formatCurrency(property.potentialRent)})
- Any concerns with the area? (Should be at least C class)

${property.zillowLink}`;
  };

  // Function to handle copying to clipboard
  const handleCopyMessage = async (property: Property) => {
    try {
      const message = formatMessageTemplate(property);
      await navigator.clipboard.writeText(message);
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Failed to copy message:', error);
    }
  };

  return (
    <Box sx={{ p: { xs: 1, md: 3 }, maxWidth: 1600, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">Properties</Typography>
        <Box>
          <Button
            variant="outlined"
            color="primary"
            onClick={() => navigate('/archived')}
            startIcon={<Icons.Archive />}
            sx={{ mr: 2, borderRadius: 2 }}
          >
            Archived Properties
          </Button>
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
                  <Tooltip title="The equity you have in the property after refinance">
                    <span>Home Equity</span>
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
                          <Typography variant="body2">New Loan: {formatCurrency(calculateNewLoan(property.offerPrice, property.rehabCosts, property.arv))}</Typography>
                          <Typography variant="body2">New Loan %: {formatPercentage(calculateNewLoanPercent(property.offerPrice, property.rehabCosts, property.arv))}</Typography>
                          <Typography variant="body2">Cash to Pull Out: {formatCurrency(calculateCashToPullOut(property.offerPrice, property.rehabCosts, property.arv))}</Typography>
                          <Typography variant="body2">Cash Remaining: {formatCurrency(calculateCashRemaining())}</Typography>
                        </>
                      } 
                      arrow 
                      placement="top"
                    >
                      <Box component="span" sx={{ 
                        color: getHomeEquityColor(calculateHomeEquity(property.offerPrice, property.rehabCosts, property.arv))
                      }}>
                        {formatCurrency(calculateHomeEquity(property.offerPrice, property.rehabCosts, property.arv))}
                      </Box>
                    </Tooltip>
                  </TableCell>
                  <TableCell className="metric">{formatPercentage(calculateDiscount(property.listingPrice, property.offerPrice))}</TableCell>
                  <TableCell className="metric">
                    <Tooltip 
                      title={
                        <>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>Score Breakdown:</Typography>
                          <Typography variant="body2">
                            Rent Ratio: {calculateRentRatioScore(calculateRentRatio(property.potentialRent, property.offerPrice, property.rehabCosts))}/4 points
                            {` (${formatPercentage(calculateRentRatio(property.potentialRent, property.offerPrice, property.rehabCosts))})`}
                          </Typography>
                          <Typography variant="body2">
                            ARV Ratio: {calculateARVRatioScore(calculateARVRatio(property.offerPrice, property.rehabCosts, property.arv))}/4 points
                            {` (${formatPercentage(calculateARVRatio(property.offerPrice, property.rehabCosts, property.arv))})`}
                          </Typography>
                          <Typography variant="body2">
                            Home Equity: {calculateHomeEquityScore(calculateHomeEquity(property.offerPrice, property.rehabCosts, property.arv))}/2 points
                            {` (${formatCurrency(calculateHomeEquity(property.offerPrice, property.rehabCosts, property.arv))})`}
                          </Typography>
                        </>
                      } 
                      arrow 
                      placement="top"
                    >
                      <Box sx={{ 
                        display: 'inline-flex',
                        alignItems: 'center',
                        backgroundColor: getScoreBackgroundColor(calculateScore(property)),
                        color: getScoreColor(calculateScore(property)),
                        p: '4px 8px',
                        borderRadius: 1,
                        fontWeight: 'medium'
                      }}>
                        {calculateScore(property)}/10
                      </Box>
                    </Tooltip>
                  </TableCell>
                  <TableCell className="metric">
                    <Box sx={{ display: 'flex', gap: 1 }}>
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
                      <Tooltip title="Copy Property Message">
                        <ActionIconButton
                          color="primary"
                          onClick={() => handleCopyMessage(property)}
                          size="small"
                        >
                          <Icons.ContentCopy fontSize="small" />
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
                backgroundColor: getScoreBackgroundColor(calculateScore(property)),
                color: getScoreColor(calculateScore(property)),
                p: 0.75,
                px: 1.5,
                borderRadius: 1,
                fontWeight: 'medium'
              }}>
                <Typography sx={{ 
                  fontWeight: 'bold',
                  mr: 0.5
                }}>
                  {calculateScore(property)}/10
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

            {/* Primary Financial Details */}
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(2, 1fr)' },
              gap: 2,
              mb: 3
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
                <Typography variant="caption" color="text.secondary">ARV</Typography>
                <Typography variant="body1" fontWeight="medium">
                  {formatCurrency(property.arv)}
                </Typography>
              </Box>
            </Box>

            {/* Rental Information */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Rental Information</Typography>
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(2, 1fr)' },
                gap: 2
              }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Potential Rent</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {formatCurrency(property.potentialRent)}
                  </Typography>
                </Box>
                {property.hasRentcastData && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">Rentcast Estimate</Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {formatCurrency(property.rentCastEstimates.rent)}
                      <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                        ({formatCurrency(property.rentCastEstimates.rentLow)} - {formatCurrency(property.rentCastEstimates.rentHigh)})
                      </Typography>
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>

            {/* Key Metrics */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Key Metrics</Typography>
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(2, 1fr)' },
                gap: 2
              }}>
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
                <Box>
                  <Typography variant="caption" color="text.secondary">Discount</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {formatPercentage(calculateDiscount(property.listingPrice, property.offerPrice))}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Home Equity</Typography>
                  <Typography 
                    variant="body1" 
                    fontWeight="medium"
                    sx={{ color: getHomeEquityColor(calculateHomeEquity(property.offerPrice, property.rehabCosts, property.arv)) }}
                  >
                    {formatCurrency(calculateHomeEquity(property.offerPrice, property.rehabCosts, property.arv))}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Financing Details */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Financing Details</Typography>
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(2, 1fr)' },
                gap: 2
              }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Down Payment</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {formatCurrency(calculateDownPayment(property.offerPrice, property.rehabCosts))}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Loan Amount</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {formatCurrency(calculateLoanAmount(property.offerPrice, property.rehabCosts))}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">New Loan</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {formatCurrency(calculateNewLoan(property.offerPrice, property.rehabCosts, property.arv))}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">New Loan %</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {formatPercentage(calculateNewLoanPercent(property.offerPrice, property.rehabCosts, property.arv))}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Cash to Pull Out</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {formatCurrency(calculateCashToPullOut(property.offerPrice, property.rehabCosts, property.arv))}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Cash Remaining</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {formatCurrency(calculateCashRemaining())}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Score Breakdown */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Score Breakdown</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="body2">
                  Rent Ratio: {calculateRentRatioScore(calculateRentRatio(property.potentialRent, property.offerPrice, property.rehabCosts))}/4 points
                  {` (${formatPercentage(calculateRentRatio(property.potentialRent, property.offerPrice, property.rehabCosts))})`}
                </Typography>
                <Typography variant="body2">
                  ARV Ratio: {calculateARVRatioScore(calculateARVRatio(property.offerPrice, property.rehabCosts, property.arv))}/4 points
                  {` (${formatPercentage(calculateARVRatio(property.offerPrice, property.rehabCosts, property.arv))})`}
                </Typography>
                <Typography variant="body2">
                  Home Equity: {calculateHomeEquityScore(calculateHomeEquity(property.offerPrice, property.rehabCosts, property.arv))}/2 points
                  {` (${formatCurrency(calculateHomeEquity(property.offerPrice, property.rehabCosts, property.arv))})`}
                </Typography>
              </Box>
            </Box>

            {/* Notes section */}
            {property.notes && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Notes</Typography>
                <Typography variant="body2">
                  {property.notes}
                </Typography>
              </Box>
            )}

            {/* Actions */}
            <Box sx={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: 1,
              mt: 2
            }}>
              <Button
                variant="outlined"
                startIcon={<Icons.Edit />}
                size="small"
                onClick={() => handleEditProperty(property)}
                fullWidth
              >
                Edit
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<Icons.Archive />}
                size="small"
                onClick={() => handleArchive(property.id)}
                fullWidth
              >
                Archive
              </Button>
              <Button
                variant="outlined"
                startIcon={<Icons.Calculate />}
                size="small"
                onClick={() => handleSendToCalculator(property)}
                fullWidth
              >
                Calculator
              </Button>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<Icons.Update />}
                size="small"
                onClick={() => handleUpdateRentcast(property.id)}
                disabled={property.hasRentcastData}
                fullWidth
              >
                {property.hasRentcastData ? 'Updated' : 'Update Data'}
              </Button>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<Icons.ContentCopy />}
                size="small"
                onClick={() => handleCopyMessage(property)}
                fullWidth
              >
                Copy Message
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

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity="success" sx={{ width: '100%' }}>
          Message copied to clipboard!
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PropertiesPage; 
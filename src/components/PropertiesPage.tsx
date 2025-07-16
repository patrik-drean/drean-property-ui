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
  IconButton,
  Box,
  styled,
  Chip,
  ChipProps,
  Snackbar,
  Alert,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import * as Icons from '@mui/icons-material';
import { Property, PropertyStatus } from '../types/property';
import { api } from '../services/apiConfig';
import { useNavigate } from 'react-router-dom';
import { Link as RouterLink } from 'react-router-dom';
import PropertyDialog from './PropertyDialog';

// Styled components for consistent UI elements
const StyledTableCell = styled(TableCell)(({ theme }) => ({
  padding: '6px 8px',
  fontSize: '0.8125rem',
  whiteSpace: 'nowrap',
  '&.header': {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.common.white,
    fontWeight: 'bold',
    height: '38px'
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
    backgroundColor: '#f1f5f9',
    cursor: 'pointer'
  },
  height: '46px'
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

// Add new helper function for score background color
const getScoreBackgroundColor = (score: number): string => {
  if (score >= 9) return '#4CAF50'; // Green for 9-10
  if (score >= 7) return '#FFC107'; // Amber for 7-8
  if (score >= 5) return '#FF9800'; // Orange for 5-6
  return '#F44336'; // Red for < 5
};

// Update the getScoreColor function to ensure text contrast
const getScoreColor = (score: number): string => {
  if (score >= 9) return '#E8F5E9'; // Light green text for green background
  if (score >= 7) return '#212121'; // Dark text for amber background
  if (score >= 5) return '#212121'; // Dark text for orange background
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
  width: '120px',
  padding: '0px',
  height: '24px',
  '& .MuiChip-label': {
    padding: '0 12px',
  }
}));

const PropertiesPage: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [propertyDialogOpen, setPropertyDialogOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const navigate = useNavigate();

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

  // Calculate monthly mortgage payment based on loan amount, interest rate, and loan term
  const calculateMonthlyMortgage = (loanAmount: number, interestRate = 0.07, loanTermYears = 30) => {
    const monthlyRate = interestRate / 12;
    const numberOfPayments = loanTermYears * 12;
    
    if (loanAmount <= 0) return 0;
    
    // Mortgage formula: P * (r(1+r)^n) / ((1+r)^n - 1)
    return loanAmount * 
      (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / 
      (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
  };
  
  // Calculate monthly cashflow
  const calculateCashflow = (rent: number, offerPrice: number, newLoanAmount: number) => {
    // 12% of rent for property management and other fees
    const managementFees = rent * 0.12;
    
    // 2.5% of offer price for taxes (annually), divided by 12 for monthly
    const propertyTaxes = (offerPrice * 0.025) / 12;
    
    // Fixed $130 for insurance and lawn care
    const otherExpenses = 130;
    
    // Monthly mortgage payment on the new loan
    const mortgagePayment = calculateMonthlyMortgage(newLoanAmount);
    
    // Total expenses
    const totalExpenses = managementFees + propertyTaxes + otherExpenses + mortgagePayment;
    
    // Cashflow: rent - expenses
    return rent - totalExpenses;
  };

  // Helper functions to calculate individual score components
  const calculateRentRatioScore = (rentRatio: number): number => {
    if (rentRatio >= 0.01) return 3; // 1% or higher
    if (rentRatio >= 0.008) return 2; // Close to 1%
    if (rentRatio >= 0.006) return 1; // Getting there
    return 0;
  };

  const calculateARVRatioScore = (arvRatio: number): number => {
    if (arvRatio <= 0.75) return 3; // 75% or lower is good
    if (arvRatio <= 0.80) return 2;
    if (arvRatio <= 0.85) return 1;
    return 0;
  };

  const calculateHomeEquityScore = (homeEquity: number): number => {
    if (homeEquity >= 60000) return 1;
    return 0;
  };

  // New function to calculate cashflow score
  const calculateCashflowScore = (cashflow: number): number => {
    if (cashflow >= 200) return 3; // $200 or more monthly cashflow
    if (cashflow >= 100) return 2; // $100-$199 monthly cashflow
    if (cashflow >= 0) return 1; // $0-$99 monthly cashflow
    return 0; // Negative cashflow
  };

  const calculateScore = (property: Omit<Property, 'id'>) => {
    let score = 0;
    
    // Rent to price ratio (3 points)
    const rentRatio = calculateRentRatio(property.potentialRent, property.offerPrice, property.rehabCosts);
    const rentRatioScore = calculateRentRatioScore(rentRatio);
    score += rentRatioScore;

    // ARV ratio (3 points)
    const arvRatio = calculateARVRatio(property.offerPrice, property.rehabCosts, property.arv);
    const arvRatioScore = calculateARVRatioScore(arvRatio);
    score += arvRatioScore;

    // Home Equity (1 point)
    const homeEquity = calculateHomeEquity(property.offerPrice, property.rehabCosts, property.arv);
    const homeEquityScore = calculateHomeEquityScore(homeEquity);
    score += homeEquityScore;
    
    // Cashflow (3 points)
    const cashflow = calculateCashflow(property.potentialRent, property.offerPrice, calculateNewLoan(property.offerPrice, property.rehabCosts, property.arv));
    const cashflowScore = calculateCashflowScore(cashflow);
    score += cashflowScore;

    // Ensure minimum score of 1, maximum of 10
    return Math.min(10, Math.max(1, score));
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
      case 'Selling':
        return 4;
      case 'Needs Tenant':
        return 5;
      case 'Operational':
        return 6;
      default:
        return 7;
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
        const data = await api.getProperties(false); // Explicitly request only non-archived properties
        setProperties(data);
      } catch (error) {
        console.error('Error fetching properties:', error);
      }
    };
    fetchProperties();
  }, []);

  const handleEditProperty = (property: Property) => {
    setEditingProperty(property);
    setPropertyDialogOpen(true);
  };

  const handleSaveProperty = async (propertyData: Omit<Property, 'id'>) => {
    try {
      const propertyWithScore = {
        ...propertyData,
        score: calculateScore(propertyData)
      };

      if (editingProperty) {
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
          },
          todoMetaData: propertyWithScore.todoMetaData || { todoistSectionId: null },
          squareFootage: propertyWithScore.squareFootage,
          units: propertyWithScore.units
        };
        
        console.log('Updating property:', propertyToUpdate);
        const updatedProperty = await api.updateProperty(editingProperty.id, propertyToUpdate);
        
        // Update local state with the returned property
        setProperties(properties.map(p => 
          p.id === editingProperty.id ? updatedProperty : p
        ));
      } else {
        // Add new property
        const addedProperty = await api.addProperty(propertyWithScore);
        setProperties([...properties, addedProperty]);
      }
    } catch (err: any) {
      console.error('Error saving property:', err);
      if (err.response) {
        console.error('Error response:', err.response.data);
      }
      throw err;
    }
  };

  const handleClosePropertyDialog = () => {
    setPropertyDialogOpen(false);
    setEditingProperty(null);
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

  const getHomeEquityColor = (equity: number) => {
    if (equity >= 50000) return '#4CAF50'; // Green for >= 50k
    if (equity >= 25000) return '#FFC107'; // Yellow for >= 25k
    return '#F44336'; // Red for < 25k
  };
  
  // Color for cashflow
  const getCashflowColor = (cashflow: number) => {
    if (cashflow >= 200) return '#4CAF50'; // Green for >= $200
    if (cashflow >= 0) return '#FFC107'; // Yellow for positive but < $200
    return '#F44336'; // Red for negative
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
    return `
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

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, property: Property) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedProperty(property);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedProperty(null);
  };

  const handleMenuAction = (action: string) => {
    if (!selectedProperty) return;
    
    switch (action) {
      case 'edit':
        handleEditProperty(selectedProperty);
        break;
      case 'archive':
        handleArchive(selectedProperty.id);
        break;
      case 'updateRentcast':
        handleUpdateRentcast(selectedProperty.id);
        break;
      case 'calculator':
        handleSendToCalculator(selectedProperty);
        break;
      case 'copyMessage':
        handleCopyMessage(selectedProperty);
        break;
    }
    handleMenuClose();
  };

  return (
    <Box sx={{ 
      p: 0, 
      width: '100%', 
      maxWidth: '100vw',
      overflowX: 'hidden'
    }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 1,
        px: 1
      }}>
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
            onClick={() => setPropertyDialogOpen(true)}
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
          elevation={0} 
          sx={{ 
            borderRadius: 2, 
            mb: 2,
            overflow: 'visible',
            width: '100%',
            border: '1px solid #e0e0e0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            '& .MuiTable-root': {
              borderCollapse: 'collapse',
            },
            '& .MuiTableRow-root:last-child .MuiTableCell-root': {
              borderBottom: 'none'
            }
          }}
        >
          <Table size="small" sx={{ width: '100%', tableLayout: 'fixed' }} padding="none">
            <TableHead>
              <TableRow>
                <StyledTableCell className="header" width="23%" sx={{ pl: 1 }}>
                  <Typography variant="body2" fontWeight="bold" noWrap>Address</Typography>
                </StyledTableCell>
                <StyledTableCell className="header" width="4%" sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" fontWeight="bold" noWrap>Units</Typography>
                </StyledTableCell>
                <StyledTableCell className="header" width="7%">
                  <Typography variant="body2" fontWeight="bold" noWrap>Status</Typography>
                </StyledTableCell>
                <StyledTableCell className="header" width="5%" sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" fontWeight="bold" noWrap>Sq Ft</Typography>
                </StyledTableCell>
                <StyledTableCell className="header" width="6%">
                  <Typography variant="body2" fontWeight="bold" noWrap>Offer</Typography>
                </StyledTableCell>
                <StyledTableCell className="header" width="6%">
                  <Typography variant="body2" fontWeight="bold" noWrap>Rehab</Typography>
                </StyledTableCell>
                <StyledTableCell className="header" width="6%">
                  <Tooltip title="Hover to see Rentcast data">
                    <Typography variant="body2" fontWeight="bold" noWrap>Rent</Typography>
                  </Tooltip>
                </StyledTableCell>
                <StyledTableCell className="header" width="6%">
                  <Typography variant="body2" fontWeight="bold" noWrap>ARV</Typography>
                </StyledTableCell>
                <StyledTableCell className="header metric" width="6%">
                  <Tooltip title="Monthly Rent / (Offer Price + Rehab)">
                    <Typography variant="body2" fontWeight="bold" noWrap>Rent %</Typography>
                  </Tooltip>
                </StyledTableCell>
                <StyledTableCell className="header metric" width="6%">
                  <Tooltip title="(Offer Price + Rehab) / ARV">
                    <Typography variant="body2" fontWeight="bold" noWrap>ARV %</Typography>
                  </Tooltip>
                </StyledTableCell>
                <StyledTableCell className="header metric" width="6%">
                  <Tooltip title="The equity you have in the property after refinance">
                    <Typography variant="body2" fontWeight="bold" noWrap>Equity</Typography>
                  </Tooltip>
                </StyledTableCell>
                <StyledTableCell className="header metric" width="6%">
                  <Tooltip title="Monthly cashflow after expenses and mortgage">
                    <Typography variant="body2" fontWeight="bold" noWrap>Cashflow</Typography>
                  </Tooltip>
                </StyledTableCell>
                <StyledTableCell className="header metric" width="5%">
                  <Typography variant="body2" fontWeight="bold" noWrap>Score</Typography>
                </StyledTableCell>
                <StyledTableCell className="header metric" width="5%">
                  <Typography variant="body2" fontWeight="bold" noWrap>Actions</Typography>
                </StyledTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedProperties.map((property) => (
                <StyledTableRow key={property.id}>
                  <TableCell sx={{ pl: 1 }}>
                    <Tooltip title={property.notes || "No notes available"} arrow placement="top-start">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {property.zillowLink && (
                          <Tooltip title="Open Zillow" arrow>
                            <IconButton
                              href={property.zillowLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              size="small"
                            >
                              <Icons.OpenInNew fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        <RouterLink
                          to={`/properties/${encodeURIComponent(property.address)}`}
                          style={{
                            color: '#1976d2',
                            textDecoration: 'none',
                            fontWeight: 500,
                            display: 'block',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: 280
                          }}
                        >
                          {property.address}
                        </RouterLink>
                      </Box>
                    </Tooltip>
                  </TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>
                    {property.units || ''}
                  </TableCell>
                  <TableCell>
                    <StatusChip 
                      label={property.status} 
                      status={property.status} 
                      size="small"
                    />
                  </TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>
                    {property.squareFootage !== null ? property.squareFootage : ''}
                  </TableCell>
                  <TableCell>
                    <Tooltip 
                      title={
                        <div>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            Listing Price: {formatCurrency(property.listingPrice)}
                          </Typography>
                          <Typography variant="body2">
                            Discount: {formatPercentage(calculateDiscount(property.listingPrice, property.offerPrice))}
                          </Typography>
                        </div>
                      } 
                      arrow 
                      placement="top"
                    >
                      <Box component="span">
                        {formatCurrency(property.offerPrice)}
                      </Box>
                    </Tooltip>
                  </TableCell>
                  <TableCell>{formatCurrency(property.rehabCosts)}</TableCell>
                  <TableCell>
                    <Tooltip 
                      title={
                        property.hasRentcastData ? (
                          <div>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              Rentcast Rent: {formatCurrency(property.rentCastEstimates.rent)}
                            </Typography>
                            <Typography variant="body2">
                              Range: {formatCurrency(property.rentCastEstimates.rentLow)} - {formatCurrency(property.rentCastEstimates.rentHigh)}
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', mt: 1 }}>
                              Rentcast ARV: {formatCurrency(property.rentCastEstimates.price)}
                            </Typography>
                            <Typography variant="body2">
                              Range: {formatCurrency(property.rentCastEstimates.priceLow)} - {formatCurrency(property.rentCastEstimates.priceHigh)}
                            </Typography>
                          </div>
                        ) : (
                          <div>
                            <Typography variant="body2">
                              No Rentcast data available
                            </Typography>
                          </div>
                        )
                      }
                      arrow 
                      placement="top"
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {formatCurrency(property.potentialRent)}
                        {property.hasRentcastData && (
                          <Icons.Check color="success" sx={{ fontSize: 14, ml: 0.5 }} />
                        )}
                      </Box>
                    </Tooltip>
                  </TableCell>
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
                  <TableCell className="metric">
                    <Tooltip 
                      title={
                        <>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>Monthly Cashflow Breakdown:</Typography>
                          <Typography variant="body2">Rent: {formatCurrency(property.potentialRent)}</Typography>
                          <Typography variant="body2">Property Management (12%): -{formatCurrency(property.potentialRent * 0.12)}</Typography>
                          <Typography variant="body2">Property Taxes: -{formatCurrency((property.offerPrice * 0.025) / 12)}</Typography>
                          <Typography variant="body2">Other Expenses: -$130</Typography>
                          <Typography variant="body2">Mortgage Payment: -{formatCurrency(calculateMonthlyMortgage(calculateNewLoan(property.offerPrice, property.rehabCosts, property.arv)))}</Typography>
                        </>
                      } 
                      arrow 
                      placement="top"
                    >
                      <Box component="span" sx={{ 
                        color: getCashflowColor(calculateCashflow(property.potentialRent, property.offerPrice, calculateNewLoan(property.offerPrice, property.rehabCosts, property.arv)))
                      }}>
                        {formatCurrency(calculateCashflow(property.potentialRent, property.offerPrice, calculateNewLoan(property.offerPrice, property.rehabCosts, property.arv)))}
                      </Box>
                    </Tooltip>
                  </TableCell>
                  <TableCell className="metric">
                    <Tooltip 
                      title={
                        <>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>Score Breakdown:</Typography>
                          <Typography variant="body2">
                            Rent Ratio: {calculateRentRatioScore(calculateRentRatio(property.potentialRent, property.offerPrice, property.rehabCosts))}/3 points
                            {` (${formatPercentage(calculateRentRatio(property.potentialRent, property.offerPrice, property.rehabCosts))})`}
                          </Typography>
                          <Typography variant="body2">
                            ARV Ratio: {calculateARVRatioScore(calculateARVRatio(property.offerPrice, property.rehabCosts, property.arv))}/3 points
                            {` (${formatPercentage(calculateARVRatio(property.offerPrice, property.rehabCosts, property.arv))})`}
                          </Typography>
                          <Typography variant="body2">
                            Home Equity: {calculateHomeEquityScore(calculateHomeEquity(property.offerPrice, property.rehabCosts, property.arv))}/1 point
                            {` (${formatCurrency(calculateHomeEquity(property.offerPrice, property.rehabCosts, property.arv))})`}
                          </Typography>
                          <Typography variant="body2">
                            Cashflow: {calculateCashflowScore(calculateCashflow(property.potentialRent, property.offerPrice, calculateNewLoan(property.offerPrice, property.rehabCosts, property.arv)))}/3 points
                            {` (${formatCurrency(calculateCashflow(property.potentialRent, property.offerPrice, calculateNewLoan(property.offerPrice, property.rehabCosts, property.arv)))})`}
                          </Typography>
                          <Typography variant="body2" fontWeight="bold" sx={{ mt: 1, pt: 1, borderTop: '1px solid #eee' }}>
                            Total Score: {calculateScore(property)}/10 points
                          </Typography>
                        </>
                      } 
                      arrow 
                      placement="top"
                    >
                      <Box sx={{ 
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: getScoreBackgroundColor(calculateScore(property)),
                        color: getScoreColor(calculateScore(property)),
                        p: '2px 6px',
                        borderRadius: 2,
                        fontWeight: 'bold',
                        width: '40px',
                        height: '24px'
                      }}>
                        {calculateScore(property)}/10
                      </Box>
                    </Tooltip>
                  </TableCell>
                  <TableCell className="metric">
                    <Tooltip title="Actions">
                      <IconButton
                        onClick={(e) => handleMenuOpen(e, property)}
                        size="small"
                        sx={{
                          backgroundColor: 'rgba(25, 118, 210, 0.08)',
                          padding: 2,
                          width: '20px',
                          height: '20px',
                          '&:hover': { 
                            backgroundColor: 'rgba(25, 118, 210, 0.2)'
                          }
                        }}
                      >
                        <Icons.MoreVert sx={{ fontSize: '0.75rem' }} />
                      </IconButton>
                    </Tooltip>
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
                  <Typography variant="caption" color="text.secondary">Home Equity</Typography>
                  <Typography 
                    variant="body1" 
                    fontWeight="medium"
                    sx={{ color: getHomeEquityColor(calculateHomeEquity(property.offerPrice, property.rehabCosts, property.arv)) }}
                  >
                    {formatCurrency(calculateHomeEquity(property.offerPrice, property.rehabCosts, property.arv))}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Monthly Cashflow</Typography>
                  <Typography 
                    variant="body1" 
                    fontWeight="medium"
                    sx={{ color: getCashflowColor(calculateCashflow(property.potentialRent, property.offerPrice, calculateNewLoan(property.offerPrice, property.rehabCosts, property.arv))) }}
                  >
                    {formatCurrency(calculateCashflow(property.potentialRent, property.offerPrice, calculateNewLoan(property.offerPrice, property.rehabCosts, property.arv)))}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Score</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {calculateScore(property)}/10
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
                  Rent Ratio: {calculateRentRatioScore(calculateRentRatio(property.potentialRent, property.offerPrice, property.rehabCosts))}/3 points
                  {` (${formatPercentage(calculateRentRatio(property.potentialRent, property.offerPrice, property.rehabCosts))})`}
                </Typography>
                <Typography variant="body2">
                  ARV Ratio: {calculateARVRatioScore(calculateARVRatio(property.offerPrice, property.rehabCosts, property.arv))}/3 points
                  {` (${formatPercentage(calculateARVRatio(property.offerPrice, property.rehabCosts, property.arv))})`}
                </Typography>
                <Typography variant="body2">
                  Home Equity: {calculateHomeEquityScore(calculateHomeEquity(property.offerPrice, property.rehabCosts, property.arv))}/1 point
                  {` (${formatCurrency(calculateHomeEquity(property.offerPrice, property.rehabCosts, property.arv))})`}
                </Typography>
                <Typography variant="body2">
                  Cashflow: {calculateCashflowScore(calculateCashflow(property.potentialRent, property.offerPrice, calculateNewLoan(property.offerPrice, property.rehabCosts, property.arv)))}/3 points
                  {` (${formatCurrency(calculateCashflow(property.potentialRent, property.offerPrice, calculateNewLoan(property.offerPrice, property.rehabCosts, property.arv)))})`}
                </Typography>
                <Typography variant="body2" fontWeight="bold" sx={{ mt: 1, pt: 1, borderTop: '1px solid #eee' }}>
                  Total Score: {calculateScore(property)}/10 points
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

            {/* Cashflow Breakdown */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Cashflow Breakdown</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="body2">
                  Rent: {formatCurrency(property.potentialRent)}
                </Typography>
                <Typography variant="body2" color="error">
                  Property Management (12%): -{formatCurrency(property.potentialRent * 0.12)}
                </Typography>
                <Typography variant="body2" color="error">
                  Property Taxes: -{formatCurrency((property.offerPrice * 0.025) / 12)}
                </Typography>
                <Typography variant="body2" color="error">
                  Other Expenses: -$130
                </Typography>
                <Typography variant="body2" color="error">
                  Mortgage Payment: -{formatCurrency(calculateMonthlyMortgage(calculateNewLoan(property.offerPrice, property.rehabCosts, property.arv)))}
                </Typography>
                <Typography variant="body2" fontWeight="bold" sx={{ 
                  color: getCashflowColor(calculateCashflow(property.potentialRent, property.offerPrice, calculateNewLoan(property.offerPrice, property.rehabCosts, property.arv))),
                  borderTop: '1px solid #eee',
                  pt: 1
                }}>
                  Net Cashflow: {formatCurrency(calculateCashflow(property.potentialRent, property.offerPrice, calculateNewLoan(property.offerPrice, property.rehabCosts, property.arv)))}
                </Typography>
              </Box>
            </Box>

            {/* Additional Details */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Additional Details</Typography>
              <Typography variant="body2" color="textSecondary">
                Status: {property.status}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Square Feet: {property.squareFootage !== null ? property.squareFootage : 'N/A'}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Units: {property.units !== null ? property.units : 'N/A'}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Offer Price: {formatCurrency(property.offerPrice)}
              </Typography>
            </Box>

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

      <PropertyDialog
        open={propertyDialogOpen}
        onClose={handleClosePropertyDialog}
        onSave={handleSaveProperty}
        property={editingProperty}
        isEditing={!!editingProperty}
      />

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

      {/* Actions Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            borderRadius: 2,
            minWidth: 180,
          }
        }}
      >
        <MenuItem onClick={() => handleMenuAction('edit')}>
          <ListItemIcon>
            <Icons.Edit fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit Property</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleMenuAction('archive')}>
          <ListItemIcon>
            <Icons.Archive fontSize="small" />
          </ListItemIcon>
          <ListItemText>Archive Property</ListItemText>
        </MenuItem>
        <MenuItem 
          onClick={() => handleMenuAction('updateRentcast')}
          disabled={selectedProperty?.hasRentcastData}
        >
          <ListItemIcon>
            <Icons.Refresh fontSize="small" />
          </ListItemIcon>
          <ListItemText>
            {selectedProperty?.hasRentcastData ? 'Data Updated' : 'Update Rentcast Data'}
          </ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleMenuAction('calculator')}>
          <ListItemIcon>
            <Icons.Calculate fontSize="small" />
          </ListItemIcon>
          <ListItemText>Send to Calculator</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleMenuAction('copyMessage')}>
          <ListItemIcon>
            <Icons.ContentCopy fontSize="small" />
          </ListItemIcon>
          <ListItemText>Copy Property Message</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default PropertiesPage; 
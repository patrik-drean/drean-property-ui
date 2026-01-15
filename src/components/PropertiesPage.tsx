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
  useTheme,
  Fab,
} from '@mui/material';
import * as Icons from '@mui/icons-material';
import { Property, PropertyStatus } from '../types/property';
import { api } from '../services/apiConfig';
import { getPropertyLead } from '../services/api';
import { smsService } from '../services/smsService';
import { SmsConversation } from '../types/sms';
import { useNavigate } from 'react-router-dom';
import { useProperties } from '../contexts/PropertiesContext';
import { Link as RouterLink } from 'react-router-dom';
import PropertyDialog from './PropertyDialog';
import PropertyCardGrid from './shared/PropertyCardGrid';
import { getStatusColor, getStatusOrder } from '../utils/statusColors';
import { useMessagingPopover } from '../contexts/MessagingPopoverContext';
import { UsageLimitBanner } from './shared/UsageLimitBanner';
import { useSubscription } from '../contexts/SubscriptionContext';
import {
  calculateNewLoanPercent,
  calculateHoldScore,
} from '../utils/scoreCalculator';
import {
  StyledTableCell,
  StyledTableRow,
} from './properties';

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

// Helper functions for unit counting
const getOperationalUnitsCount = (property: Property): number => {
  if (!property.propertyUnits || property.propertyUnits.length === 0) {
    return 0;
  }
  return property.propertyUnits.filter(unit => unit.status === 'Operational').length;
};

const getBehindRentUnitsCount = (property: Property): number => {
  if (!property.propertyUnits || property.propertyUnits.length === 0) {
    return 0;
  }
  return property.propertyUnits.filter(unit => unit.status === 'Behind On Rent').length;
};

const getVacantUnitsCount = (property: Property): number => {
  if (!property.propertyUnits || property.propertyUnits.length === 0) {
    return 0;
  }
  return property.propertyUnits.filter(unit => unit.status === 'Vacant').length;
};

const PropertiesPage: React.FC = () => {
  const theme = useTheme();
  const { isPro, createCheckoutSession } = useSubscription();
  const { properties, loading, error, refreshProperties, updateProperty, addProperty, removeProperty } = useProperties();

  const [propertyDialogOpen, setPropertyDialogOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('Message copied to clipboard!');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [conversations, setConversations] = useState<SmsConversation[]>([]);
  const navigate = useNavigate();
  const { openPopover } = useMessagingPopover();

  // Refresh properties when navigating to this page
  useEffect(() => {
    refreshProperties();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch conversations on mount
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const conversationsData = await smsService.getConversations();
        setConversations(conversationsData);
      } catch (error) {
        console.error('Error fetching conversations:', error);
      }
    };
    fetchConversations();
  }, []);

  // Poll conversations every 10 seconds
  useEffect(() => {
    const POLL_INTERVAL = 10000; // 10 seconds
    const intervalId = setInterval(async () => {
      try {
        const conversationsData = await smsService.getConversations();
        setConversations(conversationsData);
      } catch (error) {
        console.error('Error polling conversations:', error);
      }
    }, POLL_INTERVAL);

    return () => clearInterval(intervalId);
  }, []);

  // Helper function to get unread message count for a property's linked lead
  const getUnreadCount = (propertyLeadId: string | null | undefined): number => {
    if (!propertyLeadId) return 0;
    const conversation = conversations.find(c => c.propertyLeadId === propertyLeadId);
    return conversation?.unreadCount || 0;
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

  // Status order function is now imported from utils/statusColors.ts

  const sortedProperties = [...properties].sort((a, b) => {
    const orderA = getStatusOrder(a.status);
    const orderB = getStatusOrder(b.status);

    // First sort by status
    if (orderA !== orderB) {
      return orderA - orderB;
    }

    // Then sort alphabetically by address
    return a.address.localeCompare(b.address);
  });



  // Calculate unit counts by status
  const getUnitCountsByStatus = () => {
    const counts: { [key in PropertyStatus]: { count: number; units: number } } = {
      'Opportunity': { count: 0, units: 0 },
      'Soft Offer': { count: 0, units: 0 },
      'Hard Offer': { count: 0, units: 0 },
      'Selling': { count: 0, units: 0 },
      'Rehab': { count: 0, units: 0 },
      'Needs Tenant': { count: 0, units: 0 },
      'Operational': { count: 0, units: 0 }
    };

    // Add defensive check for properties array
    if (!properties || !Array.isArray(properties)) {
      console.warn('Properties array is not properly initialized');
      return counts;
    }

    properties.forEach(property => {
      // For most statuses, use the property-level status
      if (property.status !== 'Needs Tenant' && property.status !== 'Operational') {
        // Add defensive check to ensure the status exists in counts
        const status = property.status as PropertyStatus;
        if (counts[status]) {
          counts[status].count += 1;
          counts[status].units += property.units || 0;
        }
      } else {
        // For "Needs Tenant" and "Operational" properties, count based on actual unit statuses
        if (property.propertyUnits && property.propertyUnits.length > 0) {
          // Count units by their individual statuses
          property.propertyUnits.forEach(unit => {
            if (unit.status === 'Vacant') {
              counts['Needs Tenant'].units += 1;
            } else if (unit.status === 'Operational') {
              counts['Operational'].units += 1;
            } else if (unit.status === 'Behind On Rent') {
              counts['Needs Tenant'].units += 1;
            }
          });
          
          // Count the property itself (for property count)
          const status = property.status as PropertyStatus;
          if (counts[status]) {
            counts[status].count += 1;
          }
        } else {
          // Fallback to property-level status if no unit data
          const status = property.status as PropertyStatus;
          if (counts[status]) {
            counts[status].count += 1;
            counts[status].units += property.units || 0;
          }
        }
      }
    });

    return counts;
  };

  const unitCounts = getUnitCountsByStatus();
  
  // Add defensive check to ensure unitCounts is properly initialized
  if (!unitCounts || typeof unitCounts !== 'object') {
    console.error('unitCounts is not properly initialized');
  }

  // Properties are now managed by the context

  const handleEditProperty = (property: Property) => {
    setEditingProperty(property);
    setPropertyDialogOpen(true);
  };

  const handleSaveProperty = async (propertyData: Omit<Property, 'id'>) => {
    try {
      const propertyWithScore = {
        ...propertyData,
        score: calculateHoldScore(propertyData) // Use Hold Score as the primary score
      };

      if (editingProperty) {
        // Update existing property - only send the fields that can be updated
        const propertyToUpdate = {
          address: propertyWithScore.address,
          status: propertyWithScore.status,
          propertyLeadId: propertyWithScore.propertyLeadId,
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
          saleComparables: propertyWithScore.saleComparables || [],
          squareFootage: propertyWithScore.squareFootage,
          units: propertyWithScore.units,
          actualRent: propertyWithScore.actualRent,
          currentHouseValue: propertyWithScore.currentHouseValue,
          currentLoanValue: propertyWithScore.currentLoanValue,
          propertyUnits: propertyWithScore.propertyUnits,
          monthlyExpenses: propertyWithScore.monthlyExpenses,
          capitalCosts: propertyWithScore.capitalCosts
        };
        
        const updatedProperty = await api.updateProperty(editingProperty.id, propertyToUpdate);
        
        // Update context with the returned property
        updateProperty(updatedProperty);
      } else {
        // Add new property
        const addedProperty = await api.addProperty(propertyWithScore);
        addProperty(addedProperty);
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
      removeProperty(id);
    } catch (error) {
      console.error('Error archiving property:', error);
    }
  };

  const handleUpdateRentcast = async (id: string) => {
    // Gate RentCast API for Pro users only
    if (!isPro) {
      try {
        await createCheckoutSession();
      } catch (error) {
        setSnackbarMessage('RentCast data requires a Pro subscription. Upgrade to unlock.');
        setSnackbarOpen(true);
      }
      return;
    }

    try {
      const updatedProperty = await api.updatePropertyRentcast(id);
      updateProperty(updatedProperty);
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
      setSnackbarMessage('Message copied to clipboard!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Failed to copy message:', error);
      setSnackbarMessage('Failed to copy message to clipboard.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
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

  const handleMessageProperty = async (property: Property) => {
    if (!property.propertyLeadId) {
      setSnackbarMessage('This property is not linked to a lead. Cannot open messaging.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    try {
      // Fetch the specific lead to get the phone number
      const lead = await getPropertyLead(property.propertyLeadId);

      if (!lead.sellerPhone) {
        setSnackbarMessage('This lead has no phone number.');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        return;
      }

      // Open messaging popover with phone number and lead data
      openPopover({
        phoneNumber: lead.sellerPhone,
        leadId: property.propertyLeadId,
        leadName: property.address,
        leadAddress: property.address,
        leadPrice: property.listingPrice.toString(),
      });
    } catch (error) {
      console.error('Error opening message for property:', error);
      setSnackbarMessage('Failed to open messaging. Please try again.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
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
      case 'message':
        handleMessageProperty(selectedProperty);
        break;
    }
    handleMenuClose();
  };

  // Show loading state
  if (loading && properties.length === 0) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '50vh',
        flexDirection: 'column',
        gap: 2
      }}>
        <Icons.Refresh />
        <Typography variant="h6">Loading properties...</Typography>
      </Box>
    );
  }

  // Show error state
  if (error) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '50vh',
        flexDirection: 'column',
        gap: 2
      }}>
        <Icons.Error color="error" sx={{ fontSize: 48 }} />
        <Typography variant="h6" color="error">Failed to load properties</Typography>
        <Button variant="contained" onClick={refreshProperties}>
          Try Again
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      p: 0, 
      width: '100%', 
      maxWidth: '100vw',
      overflowX: 'hidden'
    }}>
      <Box sx={{
        mb: 3,
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between',
        alignItems: { xs: 'stretch', sm: 'center' },
        gap: { xs: 2, sm: 0 }
      }}>
        <Typography variant="h4" component="h1">Portfolio</Typography>
        <Box sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'center' },
          gap: { xs: 1, sm: 1 },
          justifyContent: { xs: 'stretch', sm: 'flex-end' },
          width: { xs: '100%', sm: 'auto' }
        }}>
          <Button
            variant="outlined"
            component={RouterLink}
            to="/reports?tab=0"
            startIcon={<Icons.Assessment />}
            sx={{
              borderRadius: 2,
              width: { xs: '100%', sm: 'auto' }
            }}
          >
            View P&L Report
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => setPropertyDialogOpen(true)}
            startIcon={<Icons.Add />}
            sx={{
              borderRadius: 2,
              display: { xs: 'none', sm: 'flex' },
              width: { xs: '100%', sm: 'auto' }
            }}
          >
            Add Property
          </Button>
        </Box>
      </Box>

      {/* Usage limit warning for free users */}
      <Box sx={{ px: 1, mb: 1 }}>
        <UsageLimitBanner type="properties" />
      </Box>


      {/* Mobile FAB */}
      <Fab
        color="primary"
        aria-label="add property"
        onClick={() => setPropertyDialogOpen(true)}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          display: { xs: 'flex', md: 'none' },
          zIndex: 1000,
          backgroundColor: theme.palette.primary.main,
          '&:hover': {
            backgroundColor: theme.palette.primary.dark,
          }
        }}
      >
        <Icons.Add />
      </Fab>
      
      {/* Opportunities section moved to Leads page - see /leads?tab=1 */}
      
      {/* Mobile Card View for Properties Held */}
      <PropertyCardGrid
        properties={sortedProperties}
        onEdit={handleEditProperty}
        onViewDetails={(property) => navigate(`/properties/${property.id}`)}
        formatCurrency={formatCurrency}
        formatPercentage={formatPercentage}
        getRentRatioColor={getRentRatioColor}
        getARVRatioColor={getARVRatioColor}
        filterFunction={(property) => ['Operational', 'Selling', 'Needs Tenant', 'Rehab'].includes(property.status)}
        emptyMessage="No properties held"
        variant="portfolio"
      />
      
      {/* Mobile Archived Button */}
      <Box sx={{
        display: { xs: 'flex', md: 'none' },
        justifyContent: 'center',
        mt: 4,
        mb: 8 // Extra margin to account for FAB
      }}>
        <Button
          variant="outlined"
          color="primary"
          component={RouterLink}
          to="/archived"
          startIcon={<Icons.Archive />}
          sx={{ borderRadius: 2 }}
        >
          Archived Properties
        </Button>
      </Box>
      
      {/* Desktop view - Operational Properties Table */}
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
                <StyledTableCell className="header" width="25%" sx={{ pl: 1 }}>
                  <Typography variant="body2" fontWeight="bold" noWrap>Property</Typography>
                </StyledTableCell>
                <StyledTableCell className="header" width="10%">
                  <Typography variant="body2" fontWeight="bold" noWrap>Status</Typography>
                </StyledTableCell>
                <StyledTableCell className="header" width="5%" sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" fontWeight="bold" noWrap>SMS</Typography>
                </StyledTableCell>
                <StyledTableCell className="header" width="12%" sx={{ textAlign: 'right' }}>
                  <Typography variant="body2" fontWeight="bold" noWrap>Monthly Rent</Typography>
                </StyledTableCell>
                <StyledTableCell className="header" width="12%" sx={{ textAlign: 'right' }}>
                  <Typography variant="body2" fontWeight="bold" noWrap>Total Expenses</Typography>
                </StyledTableCell>
                <StyledTableCell className="header" width="12%" sx={{ textAlign: 'right' }}>
                  <Typography variant="body2" fontWeight="bold" noWrap>Net Cash Flow</Typography>
                </StyledTableCell>
                <StyledTableCell className="header" width="9%" sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" fontWeight="bold" noWrap>Operational Units</Typography>
                </StyledTableCell>
                <StyledTableCell className="header" width="9%" sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" fontWeight="bold" noWrap>Behind Rent Units</Typography>
                </StyledTableCell>
                <StyledTableCell className="header" width="9%" sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" fontWeight="bold" noWrap>Vacant Units</Typography>
                </StyledTableCell>
                <StyledTableCell className="header" width="5%" sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" fontWeight="bold" noWrap>Actions</Typography>
                </StyledTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedProperties
                .filter(property => ['Operational', 'Selling', 'Needs Tenant', 'Rehab'].includes(property.status))
                .map((property) => {
                                     // Calculate total expenses
                   const totalExpenses = property.monthlyExpenses?.total || 0;
                   // Use actual rent
                   const rent = property.actualRent || 0;
                   // Calculate cashflow
                   const cashflow = rent - totalExpenses;
                  
                  return (
                    <StyledTableRow key={property.id}>
                      {/* Property */}
                      <TableCell sx={{ pl: 1 }}>
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
                            to={`/properties/${property.id}`}
                            style={{
                              color: theme.palette.primary.main,
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
                          {getUnreadCount(property.propertyLeadId) > 0 && (
                            <Tooltip title={`${getUnreadCount(property.propertyLeadId)} unread message${getUnreadCount(property.propertyLeadId) > 1 ? 's' : ''}`} arrow>
                              <Chip
                                icon={<Icons.Message fontSize="small" />}
                                label={getUnreadCount(property.propertyLeadId)}
                                size="small"
                                color="error"
                                sx={{ height: '20px', fontSize: '0.7rem', flexShrink: 0 }}
                              />
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <StatusChip
                          label={property.status}
                          status={property.status}
                          size="small"
                        />
                      </TableCell>

                      {/* SMS */}
                      <TableCell sx={{ textAlign: 'center' }}>
                        {property.propertyLeadId && (
                          <Tooltip title="Send SMS Message">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMessageProperty(property);
                              }}
                              color="primary"
                              sx={{
                                padding: 0.5,
                              }}
                            >
                              <Icons.Sms fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>

                      {/* Monthly Rent */}
                      <TableCell align="right">
                        <Typography variant="body2">
                          {formatCurrency(rent)}
                        </Typography>
                      </TableCell>

                      {/* Total Expenses */}
                      <TableCell align="right">
                        <Typography variant="body2">
                          {formatCurrency(totalExpenses)}
                        </Typography>
                      </TableCell>

                      {/* Net Cash Flow */}
                      <TableCell align="right">
                        <Typography
                          variant="h6"
                          sx={{
                            color: getCashflowColor(cashflow),
                            fontWeight: 600
                          }}
                        >
                          {formatCurrency(cashflow)}
                        </Typography>
                      </TableCell>

                      {/* Operational Units */}
                      <TableCell align="center">
                        <Typography variant="body2">
                          {getOperationalUnitsCount(property)}
                        </Typography>
                      </TableCell>

                      {/* Behind Rent Units */}
                      <TableCell align="center">
                        <Typography
                          variant="body2"
                          sx={{ color: getBehindRentUnitsCount(property) > 0 ? 'warning.main' : 'text.primary' }}
                        >
                          {getBehindRentUnitsCount(property)}
                        </Typography>
                      </TableCell>

                      {/* Vacant Units */}
                      <TableCell align="center">
                        <Typography
                          variant="body2"
                          sx={{ color: getVacantUnitsCount(property) > 0 ? 'error.main' : 'text.primary' }}
                        >
                          {getVacantUnitsCount(property)}
                        </Typography>
                      </TableCell>

                      {/* Actions */}
                      <TableCell sx={{ textAlign: 'center' }}>
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
                  );
                })}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Desktop Archived Button - Bottom */}
      <Box sx={{
        display: { xs: 'none', md: 'flex' },
        justifyContent: 'center',
        mt: 4,
        mb: 2
      }}>
        <Button
          variant="outlined"
          color="primary"
          component={RouterLink}
          to="/archived"
          startIcon={<Icons.Archive />}
          sx={{ borderRadius: 2 }}
        >
          Archived Properties
        </Button>
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
        <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
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
      </Menu>
    </Box>
  );
};

export default PropertiesPage; 
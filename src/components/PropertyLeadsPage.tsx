import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Tooltip,
  IconButton,
  CircularProgress,
  Snackbar,
  Alert,
  Box,
  styled,
  Checkbox,
  Chip,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import * as Icons from '@mui/icons-material';
import { PropertyLead, CreatePropertyLead } from '../types/property';
import { 
  getPropertyLeadsWithArchivedStatus, 
  addPropertyLead, 
  updatePropertyLead, 
  deletePropertyLead, 
  addProperty, 
  archivePropertyLead
} from '../services/api';
import PropertyLeadDialog from './PropertyLeadDialog';
import { MessageLeadButton } from './messaging/MessageLeadButton';

// Styled components for consistent UI elements
const StyledTableCell = styled(TableCell)(({ theme }) => ({
  padding: '12px 16px',
  '&.header': {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.common.white,
    fontWeight: 'bold',
  },
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

// Add a new styled component for the converted badge
const ConvertedBadge = styled(Box)(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  backgroundColor: theme.palette.success.main,
  color: theme.palette.common.white,
  borderRadius: '4px',
  padding: '2px 6px',
  fontSize: '0.75rem',
  fontWeight: 'bold',
  marginLeft: '8px',
}));

// Styled component for uncontacted leads
const NotContactedText = styled(Typography)(({ theme }) => ({
  color: theme.palette.warning.main,
  fontWeight: 'bold',
}));

const PropertyLeadsPage: React.FC = () => {
  const [propertyLeads, setPropertyLeads] = useState<PropertyLead[]>([]);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  // Add state for custom message dialog
  const [openMessageDialog, setOpenMessageDialog] = useState(false);
  const [customMessage, setCustomMessage] = useState('');
  const messageTextareaRef = useRef<HTMLTextAreaElement>(null);
  // Remove formData and all input handlers from parent
  // Add getInitialFormData helper
  const getInitialFormData = (lead?: PropertyLead) => lead ? {
    address: lead.address,
    zillowLink: lead.zillowLink,
    listingPrice: lead.listingPrice,
    sellerPhone: lead.sellerPhone,
    sellerEmail: lead.sellerEmail,
    lastContactDate: lead.lastContactDate,
    notes: lead.notes || '',
    squareFootage: lead.squareFootage,
    units: lead.units,
  } : {
    address: '',
    zillowLink: '',
    listingPrice: 0,
    sellerPhone: '',
    sellerEmail: '',
    lastContactDate: null,
    notes: '',
    squareFootage: null,
    units: null,
  };

  const [dialogInitialFormData, setDialogInitialFormData] = useState(getInitialFormData());
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });
  const [locallyConvertedLeads, setLocallyConvertedLeads] = useState<Set<string>>(new Set());
  const [expandedLeads, setExpandedLeads] = useState<Set<string>>(new Set());
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(100);
  const [totalItems, setTotalItems] = useState(0);

  // Default message template
  const defaultMessageTemplate = `Hi there! My name is Patrik. I really like this property and believe it has great potential. I'd like to explore an offer around {PRICE}. I'm an experienced investor who is reliable and quick when it comes to closing. If this number is in the ballpark, I'd love to discuss further. Let me know what you and the seller think! Have a great day! 
{ZILLOW_LINK}`;

  // Helper function to extract street address (without city and state)
  const extractStreetAddress = (fullAddress: string): string => {
    // Split by comma and take the first part (street address)
    const parts = fullAddress.split(',');
    return parts[0]?.trim() || fullAddress;
  };

  // Load custom message from localStorage on component mount
  useEffect(() => {
    const savedMessage = localStorage.getItem('customMessageTemplate');
    setCustomMessage(savedMessage || defaultMessageTemplate);
  }, [defaultMessageTemplate]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatCurrencyInK = (value: number) => {
    const inK = Math.round(value / 1000);
    return `$${inK}K`;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) {
      return <NotContactedText>Not contacted</NotContactedText>;
    }
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Removed handleInputChange as it's no longer needed

  const handleCurrencyInput = (value: string) => {
    // Remove dollar signs, commas and convert to number
    const numericValue = parseFloat(value.replace(/[$,]/g, '')) || 0;
    return numericValue;
  };

  const formatInputCurrency = (value: number) => {
    if (!value) return '';
    const result = value.toLocaleString('en-US');
    return result;
  };



  const fetchPropertyLeads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPropertyLeadsWithArchivedStatus(showArchived);
      setPropertyLeads(data);
      setTotalItems(data.length);
      // Reset to first page when data changes
      setCurrentPage(1);
    } catch (err) {
      console.error('Error fetching property leads:', err);
      setError('Failed to load property leads. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [showArchived]);

  useEffect(() => {
    fetchPropertyLeads();
  }, [fetchPropertyLeads]);

  // Add sorting function for property leads - modified to handle archived status
  const sortPropertyLeads = (leads: PropertyLead[]) => {
    return [...leads].sort((a, b) => {
      // First sort by archived status
      if (a.archived !== b.archived) {
        return a.archived ? 1 : -1; // Non-archived leads first
      }

      // Then sort by last contact date (not contacted leads first, then most recent)
      if (!a.lastContactDate && !b.lastContactDate) {
        // Both have no contact date, sort by created date (most recent first)
        const createdDateComparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        if (createdDateComparison !== 0) {
          return createdDateComparison;
        }
      } else if (!a.lastContactDate) {
        return -1; // a has no contact date, put it first
      } else if (!b.lastContactDate) {
        return 1; // b has no contact date, put it first
      } else {
        // Both have contact dates, sort by most recent first
        const dateComparison = new Date(b.lastContactDate).getTime() - new Date(a.lastContactDate).getTime();
        if (dateComparison !== 0) {
          return dateComparison;
        }
      }

      // Then sort by number of units descending (null/undefined units go to the end)
      const aUnits = a.units || 0;
      const bUnits = b.units || 0;
      if (aUnits !== bUnits) {
        return bUnits - aUnits; // Descending order
      }

      // Finally sort alphabetically by address ascending
      return a.address.localeCompare(b.address);
    });
  };

  // Pagination helper functions - now using memoized version
  const getPaginatedLeads = () => paginatedLeads;

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page);
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleItemsPerPageChange = (event: any) => {
    const newItemsPerPage = event.target.value;
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page
  };

  // Performance optimization: Memoize sorted leads to avoid re-sorting on every render
  const sortedLeads = React.useMemo(() => sortPropertyLeads(propertyLeads), [propertyLeads]);
  
  // Performance optimization: Memoize paginated leads
  const paginatedLeads = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedLeads.slice(startIndex, endIndex);
  }, [sortedLeads, currentPage, itemsPerPage]);

  const handleAddLead = () => {
    setIsEditing(false);
    setEditingId(null);
    setDialogInitialFormData(getInitialFormData());
    setOpenDialog(true);
  };

  const handleEditLead = (lead: PropertyLead) => {
    setIsEditing(true);
    setEditingId(lead.id);
    setDialogInitialFormData(getInitialFormData(lead));
    setOpenDialog(true);
  };

  const handleDialogSave = async (formData: any) => {
    try {
      if (isEditing && editingId) {
        await updatePropertyLead(editingId, formData);
        setSnackbar({
          open: true,
          message: 'Property lead updated successfully',
          severity: 'success',
        });
      } else {
        await addPropertyLead(formData as CreatePropertyLead);
        setSnackbar({
          open: true,
          message: 'Property lead added successfully',
          severity: 'success',
        });
      }
      setOpenDialog(false);
      fetchPropertyLeads();
    } catch (err) {
      console.error('Error saving property lead:', err);
      setSnackbar({
        open: true,
        message: 'Failed to save property lead',
        severity: 'error',
      });
    }
  };

  const handleDeleteLead = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this property lead?')) {
      try {
        await deletePropertyLead(id);
        setSnackbar({
          open: true,
          message: 'Property lead deleted successfully',
          severity: 'success',
        });
        fetchPropertyLeads();
      } catch (err) {
        console.error('Error deleting property lead:', err);
        setSnackbar({
          open: true,
          message: 'Failed to delete property lead',
          severity: 'error',
        });
      }
    }
  };

  const handleUpdateLastContact = async (lead: PropertyLead) => {
    const newContactDate = new Date().toISOString();
    
    // Optimistically update the UI immediately
    setPropertyLeads(prevLeads => 
      prevLeads.map(l => l.id === lead.id ? { ...l, lastContactDate: newContactDate } : l)
    );

    try {
      const updatedLead = await updatePropertyLead(lead.id, {
        ...lead,
        lastContactDate: newContactDate,
      });
      
      setSnackbar({
        open: true,
        message: 'Contact date updated successfully',
        severity: 'success',
      });
    } catch (err) {
      console.error('Error updating contact date:', err);
      
      // Revert the optimistic update on error
      setPropertyLeads(prevLeads => 
        prevLeads.map(l => l.id === lead.id ? { ...l, lastContactDate: lead.lastContactDate } : l)
      );
      
      setSnackbar({
        open: true,
        message: 'Failed to update contact date',
        severity: 'error',
      });
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };



  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedLeads(propertyLeads.map(lead => lead.id));
    } else {
      setSelectedLeads([]);
    }
  };

  const handleSelectLead = (id: string) => {
    setSelectedLeads(prev => {
      if (prev.includes(id)) {
        return prev.filter(leadId => leadId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleBulkDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${selectedLeads.length} property leads?`)) {
      try {
        await Promise.all(selectedLeads.map(id => deletePropertyLead(id)));
        setSnackbar({
          open: true,
          message: `Successfully deleted ${selectedLeads.length} property leads`,
          severity: 'success',
        });
        setSelectedLeads([]);
        fetchPropertyLeads();
      } catch (err) {
        console.error('Error deleting property leads:', err);
        setSnackbar({
          open: true,
          message: 'Failed to delete some property leads',
          severity: 'error',
        });
      }
    }
  };

  const copyToClipboard = (text: string, successMessage: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setSnackbar({
        open: true,
        message: successMessage,
        severity: 'success',
      });
    }).catch(err => {
      console.error('Failed to copy text: ', err);
      setSnackbar({
        open: true,
        message: 'Failed to copy to clipboard',
        severity: 'error',
      });
    });
  };

  const copyPhoneNumber = (phone: string) => {
    copyToClipboard(phone, 'Phone number copied to clipboard!');
  };

  // Function to replace template variables
  const replaceTemplateVariables = useCallback((template: string, lead: PropertyLead) => {
    const discountedPrice = Math.round(lead.listingPrice * 0.8);
    const formattedPrice = formatCurrencyInK(discountedPrice);
    const streetAddress = extractStreetAddress(lead.address);
    
    return template
      .replace(/{PRICE}/g, formattedPrice)
      .replace(/{ZILLOW_LINK}/g, lead.zillowLink || '')
      .replace(/{ADDRESS}/g, streetAddress);
  }, []);

  const copyTemplatedMessage = useCallback(async (lead: PropertyLead) => {
    const message = replaceTemplateVariables(customMessage, lead);

    try {
      // First copy the message
      await navigator.clipboard.writeText(message);
      setSnackbar({
        open: true,
        message: 'Message copied to clipboard!',
        severity: 'success',
      });

      // Wait a brief moment before copying the phone number
      setTimeout(async () => {
        if (lead.sellerPhone) {
          await navigator.clipboard.writeText(lead.sellerPhone);
          setSnackbar({
            open: true,
            message: 'Phone number copied to clipboard!',
            severity: 'success',
          });
        }
      }, 1000); // Wait a second before copying phone number
    } catch (err) {
      console.error('Failed to copy: ', err);
      setSnackbar({
        open: true,
        message: 'Failed to copy to clipboard',
        severity: 'error',
      });
    }
  }, [customMessage, replaceTemplateVariables]);

  // Handle opening the message override dialog
  const handleOpenMessageDialog = () => {
    setOpenMessageDialog(true);
  };

  // Handle closing the message override dialog
  const handleCloseMessageDialog = () => {
    setOpenMessageDialog(false);
  };

  // Handle saving the custom message
  const handleSaveCustomMessage = useCallback(() => {
    const messageValue = messageTextareaRef.current?.value || customMessage;
    localStorage.setItem('customMessageTemplate', messageValue);
    setCustomMessage(messageValue);
    setOpenMessageDialog(false);
    setSnackbar({
      open: true,
      message: 'Custom message template saved successfully',
      severity: 'success',
    });
  }, [customMessage]);

  // Handle resetting to default message
  const handleResetToDefault = useCallback(() => {
    setCustomMessage(defaultMessageTemplate);
    localStorage.removeItem('customMessageTemplate');
    setSnackbar({
      open: true,
      message: 'Message template reset to default',
      severity: 'success',
    });
  }, [defaultMessageTemplate]);

  const handleConvertToProperty = async (lead: PropertyLead) => {
    try {
      // Validate required fields are present
      if (!lead.address) {
        setSnackbar({
          open: true,
          message: 'Property address is required',
          severity: 'error',
        });
        return;
      }

      // First create the property
      await addProperty({
        address: lead.address,
        status: 'Opportunity',
        listingPrice: lead.listingPrice,
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
        notes: lead.notes || '',
        score: 0,
        zillowLink: lead.zillowLink,
        squareFootage: lead.squareFootage,
        units: lead.units,
        actualRent: 0,
        currentHouseValue: 0,
        currentLoanValue: null,
        propertyUnits: [],
        monthlyExpenses: null,
        capitalCosts: null
      });
      
      // Create a complete update object with all fields from the original lead
      const updateData = {
        address: lead.address,
        zillowLink: lead.zillowLink || '',
        listingPrice: lead.listingPrice,
        sellerPhone: lead.sellerPhone || '',
        sellerEmail: lead.sellerEmail || '',
        lastContactDate: lead.lastContactDate,
        notes: lead.notes || '',
        // Explicitly set convertedToProperty to true
        convertedToProperty: true,
        // Include other fields to maintain consistency
        archived: lead.archived,
        tags: lead.tags || [],
        squareFootage: lead.squareFootage,
        units: lead.units
      };
      
      // Update the lead with convertedToProperty field
      const updatedLead = await updatePropertyLead(lead.id, updateData);
      
      // Check if the convertedToProperty field was actually updated in the response
      if (!updatedLead.convertedToProperty) {
        console.warn('Warning: The convertedToProperty field was not set to true in the response');
        // Log additional information that might help debug
        console.log('Original lead:', lead);
        console.log('Update data sent:', updateData);
        console.log('Response received:', updatedLead);
        
        // Add to locally tracked conversions
        setLocallyConvertedLeads(prev => {
          const updated = new Set(prev);
          updated.add(lead.id);
          return updated;
        });
      }
      
      // Ensure the local data reflects this change
      setPropertyLeads(prevLeads => 
        prevLeads.map(l => l.id === lead.id ? { ...l, convertedToProperty: true } : l)
      );

      setSnackbar({
        open: true,
        message: 'Successfully converted lead to property',
        severity: 'success',
      });
      
      // After a short delay, refresh the data
      setTimeout(() => {
        fetchPropertyLeads();
      }, 500);
    } catch (err: any) {
      console.error('Error converting lead to property:', err);
      
      // Extract more detailed error message if available
      let errorMessage = 'Failed to convert lead to property';
      if (err.response && err.response.data) {
        if (typeof err.response.data === 'string') {
          errorMessage += `: ${err.response.data}`;
        } else if (err.response.data.message) {
          errorMessage += `: ${err.response.data.message}`;
        } else if (err.response.data.error) {
          errorMessage += `: ${err.response.data.error}`;
        }
      } else if (err.message) {
        errorMessage += `: ${err.message}`;
      }

      // Check for specific error conditions
      if (err.response && err.response.status === 409) {
        errorMessage = `Property with address "${lead.address}" already exists`;
      }
      
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error',
      });
    }
  };

  const handleArchiveLead = async (id: string) => {
    // Optimistically update the UI immediately
    setPropertyLeads(prevLeads => 
      prevLeads.map(l => l.id === id ? { ...l, archived: true } : l)
    );

    try {
      await archivePropertyLead(id);
      
      setSnackbar({
        open: true,
        message: 'Property lead archived successfully',
        severity: 'success',
      });
    } catch (err) {
      console.error('Error archiving property lead:', err);
      
      // Revert the optimistic update on error
      setPropertyLeads(prevLeads => 
        prevLeads.map(l => l.id === id ? { ...l, archived: false } : l)
      );
      
      setSnackbar({
        open: true,
        message: 'Failed to archive property lead',
        severity: 'error',
      });
    }
  };

  const handleUnarchiveLead = async (id: string) => {
    // Optimistically update the UI immediately
    setPropertyLeads(prevLeads => 
      prevLeads.map(l => l.id === id ? { ...l, archived: false } : l)
    );

    try {
      // Unarchive by updating the lead with archived set to false
      await updatePropertyLead(id, { 
        ...propertyLeads.find(lead => lead.id === id)!,
        archived: false
      });
      
      setSnackbar({
        open: true,
        message: 'Property lead unarchived successfully',
        severity: 'success',
      });
    } catch (err) {
      console.error('Error unarchiving property lead:', err);
      
      // Revert the optimistic update on error
      setPropertyLeads(prevLeads => 
        prevLeads.map(l => l.id === id ? { ...l, archived: true } : l)
      );
      
      setSnackbar({
        open: true,
        message: 'Failed to unarchive property lead',
        severity: 'error',
      });
    }
  };

  const handleToggleShowArchived = () => {
    setShowArchived(!showArchived);
  };

  const handleToggleExpanded = (leadId: string) => {
    setExpandedLeads(prev => {
      const newSet = new Set(prev);
      if (newSet.has(leadId)) {
        newSet.delete(leadId);
      } else {
        newSet.add(leadId);
      }
      return newSet;
    });
  };

  // Modify the countConvertedLeads function to include locally tracked conversions
  const countConvertedLeads = (leads: PropertyLead[]) => {
    return leads.filter(lead => lead.convertedToProperty || locallyConvertedLeads.has(lead.id)).length;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <>
      <Box sx={{ 
        mb: 4, 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between', 
        alignItems: { xs: 'stretch', sm: 'center' },
        gap: { xs: 2, sm: 0 }
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="h4" component="h1">Property Leads</Typography>
          {countConvertedLeads(propertyLeads) > 0 && (
            <Tooltip title="Number of leads converted to properties">
              <Box sx={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                backgroundColor: 'success.light',
                color: 'success.contrastText',
                borderRadius: '16px',
                px: 1.5,
                py: 0.5,
              }}>
                <Icons.Transform fontSize="small" sx={{ mr: 0.5 }} />
                {countConvertedLeads(propertyLeads)} Converted
              </Box>
            </Tooltip>
          )}
        </Box>
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
            color="primary"
            onClick={handleOpenMessageDialog}
            startIcon={<Icons.Message />}
            sx={{ 
              borderRadius: 2, 
              width: { xs: '100%', sm: 'auto' }
            }}
          >
            Override Message
          </Button>
          <Button
            variant="outlined"
            color="primary"
            onClick={handleToggleShowArchived}
            startIcon={<Icons.Archive />}
            sx={{ 
              borderRadius: 2, 
              width: { xs: '100%', sm: 'auto' }
            }}
          >
            {showArchived ? 'Hide Archived' : 'Archived Leads'}
          </Button>
          {selectedLeads.length > 0 && (
            <Button
              variant="contained"
              color="error"
              startIcon={<Icons.Delete />}
              onClick={handleBulkDelete}
              sx={{ 
                width: { xs: '100%', sm: 'auto' }
              }}
            >
              Delete Selected ({selectedLeads.length})
            </Button>
          )}
          <Button
            variant="contained"
            color="primary"
            startIcon={<Icons.Add />}
            onClick={handleAddLead}
            sx={{ 
              width: { xs: '100%', sm: 'auto' }
            }}
          >
            Add Lead
          </Button>
        </Box>
      </Box>

      {/* Desktop view - Table */}
      <Box sx={{ display: { xs: 'none', lg: 'block' }, width: '100%' }}>
        <Paper elevation={2} sx={{ position: 'relative' }}>
          {loading && (
            <Box sx={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              right: 0, 
              height: '4px', 
              backgroundColor: 'primary.main',
              zIndex: 1
            }}>
              <Box sx={{
                height: '100%',
                backgroundColor: 'primary.light',
                animation: 'pulse 1.5s ease-in-out infinite',
                '@keyframes pulse': {
                  '0%': { width: '0%' },
                  '50%': { width: '100%' },
                  '100%': { width: '0%' }
                }
              }} />
            </Box>
          )}
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <StyledTableCell className="header" padding="checkbox">
                    <Tooltip title="Select All Leads">
                      <Checkbox
                        color="default"
                        indeterminate={selectedLeads.length > 0 && selectedLeads.length < propertyLeads.length}
                        checked={propertyLeads.length > 0 && selectedLeads.length === propertyLeads.length}
                        onChange={handleSelectAll}
                        sx={{
                          color: 'white',
                          '&.Mui-checked': {
                            color: 'white',
                          },
                          '&.MuiCheckbox-indeterminate': {
                            color: 'white',
                          }
                        }}
                      />
                    </Tooltip>
                  </StyledTableCell>
                  <StyledTableCell className="header">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      Address
                      <Tooltip title="Green highlight and badge indicates leads that have been converted to properties">
                        <Icons.Info fontSize="small" sx={{ ml: 1, opacity: 0.7 }} />
                      </Tooltip>
                    </Box>
                  </StyledTableCell>
                  <StyledTableCell className="header">Units</StyledTableCell>
                  <StyledTableCell className="header">Sq Ft</StyledTableCell>
                  <StyledTableCell className="header">Listing Price</StyledTableCell>
                  <StyledTableCell className="header">Seller Contact</StyledTableCell>
                  <StyledTableCell className="header">Last Contact</StyledTableCell>
                  <StyledTableCell className="header">Notes</StyledTableCell>
                  <StyledTableCell className="header" sx={{ width: '220px' }}>Actions</StyledTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {propertyLeads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      <Typography variant="body1" sx={{ py: 2 }}>
                        No property leads found. Add your first lead.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  getPaginatedLeads().map((lead) => (
                    <StyledTableRow 
                      key={lead.id}
                      sx={{
                        ...(lead.archived ? {
                          opacity: 0.6,
                          backgroundColor: '#f5f5f5',
                          '&:hover': {
                            backgroundColor: '#eeeeee',
                          }
                        } : {}),
                        ...((lead.convertedToProperty || locallyConvertedLeads.has(lead.id)) ? {
                          borderLeft: '6px solid #4caf50',
                          backgroundColor: 'rgba(76, 175, 80, 0.08)',
                          '&:hover': {
                            backgroundColor: 'rgba(76, 175, 80, 0.14)',
                          }
                        } : {})
                      }}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          color="primary"
                          checked={selectedLeads.includes(lead.id)}
                          onChange={() => handleSelectLead(lead.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {lead.zillowLink && (
                            <Tooltip title="Open Zillow" arrow>
                              <IconButton
                                href={lead.zillowLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                size="small"
                              >
                                <Icons.OpenInNew fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {lead.address}
                            {(lead.convertedToProperty || locallyConvertedLeads.has(lead.id)) && (
                              <ConvertedBadge>
                                <Icons.CheckCircle fontSize="inherit" sx={{ mr: 0.5 }} />
                                Converted
                              </ConvertedBadge>
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>{lead.units || ''}</TableCell>
                      <TableCell>
                        {lead.squareFootage !== null ? (
                          <Tooltip
                            title={
                              <Box sx={{ textAlign: 'left' }}>
                                <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                                  Rules of Thumb
                                </Typography>
                                <Typography variant="body2">
                                  ARV Guess: {formatCurrency(160 * lead.squareFootage)}
                                </Typography>
                                <Typography variant="body2">
                                  Rent Guess: {formatCurrency(1.1 * lead.squareFootage)}
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 'bold', mt: 1, mb: 0.5 }}>
                                  Rehab
                                </Typography>
                                <Typography variant="body2">
                                  Light: {formatCurrency(20 * lead.squareFootage)}
                                </Typography>
                                <Typography variant="body2">
                                  Medium: {formatCurrency(40 * lead.squareFootage)}
                                </Typography>
                                <Typography variant="body2">
                                  Heavy: {formatCurrency(75 * lead.squareFootage)}
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 'bold', mt: 1, mb: 0.5 }}>
                                  MAO
                                </Typography>
                                <Typography variant="body2">
                                  Light: {formatCurrency((160 * lead.squareFootage * 0.7) - (20 * lead.squareFootage))}
                                </Typography>
                                <Typography variant="body2">
                                  Medium: {formatCurrency((160 * lead.squareFootage * 0.7) - (40 * lead.squareFootage))}
                                </Typography>
                                <Typography variant="body2">
                                  Heavy: {formatCurrency((160 * lead.squareFootage * 0.7) - (75 * lead.squareFootage))}
                                </Typography>
                              </Box>
                            }
                            arrow
                            placement="top"
                          >
                            <Box component="span" sx={{ cursor: 'help' }}>
                              {lead.squareFootage.toLocaleString()}
                            </Box>
                          </Tooltip>
                        ) : (
                          ''
                        )}
                      </TableCell>
                      <TableCell>{formatCurrency(lead.listingPrice)}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Tooltip title="Copy templated message">
                            <ActionIconButton
                              size="small"
                              onClick={() => copyTemplatedMessage(lead)}
                            >
                              <Icons.Message fontSize="small" />
                            </ActionIconButton>
                          </Tooltip>
                          <MessageLeadButton lead={lead} iconOnly size="small" />
                          {lead.sellerPhone && (
                            <Tooltip title="Copy phone number">
                              <Button
                                variant="text"
                                size="small"
                                onClick={() => copyPhoneNumber(lead.sellerPhone)}
                                sx={{
                                  textTransform: 'none',
                                  minWidth: 'auto',
                                  padding: '4px 8px'
                                }}
                              >
                                {lead.sellerPhone}
                              </Button>
                            </Tooltip>
                          )}
                          {lead.sellerEmail && (
                            <Tooltip title="Copy email address">
                              <Button
                                variant="text"
                                size="small"
                                onClick={() => copyToClipboard(lead.sellerEmail, 'Email address copied to clipboard!')}
                                sx={{
                                  textTransform: 'none',
                                  minWidth: 'auto',
                                  padding: '4px 8px'
                                }}
                              >
                                {lead.sellerEmail}
                              </Button>
                            </Tooltip>
                          )}
                          {!lead.sellerPhone && !lead.sellerEmail && (
                            <Typography variant="body2" color="text.secondary">No phone</Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {formatDate(lead.lastContactDate)}
                          <Tooltip title="Mark as Contacted Today">
                            <ActionIconButton 
                              size="small" 
                              sx={{ ml: 1 }}
                              onClick={() => handleUpdateLastContact(lead)}
                            >
                              <Icons.CheckCircle fontSize="small" />
                            </ActionIconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ 
                          maxWidth: '200px', 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {lead.notes ? (
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                              {lead.notes.length > 50 ? `${lead.notes.substring(0, 50)}...` : lead.notes}
                            </Typography>
                          ) : (
                            <Typography variant="body2" sx={{ color: 'text.disabled', fontStyle: 'italic' }}>
                              No notes
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ width: '220px' }}>
                        <Box sx={{ display: 'flex' }}>
                          {lead.archived ? (
                            <>
                              <Tooltip title="Unarchive Lead">
                                <ActionIconButton 
                                  size="small" 
                                  sx={{ mr: 1 }}
                                  onClick={() => handleUnarchiveLead(lead.id)}
                                >
                                  <Icons.Unarchive fontSize="small" />
                                </ActionIconButton>
                              </Tooltip>
                              <Tooltip title="Delete Lead">
                                <DeleteIconButton 
                                  size="small"
                                  onClick={() => handleDeleteLead(lead.id)}
                                >
                                  <Icons.Delete fontSize="small" />
                                </DeleteIconButton>
                              </Tooltip>
                            </>
                          ) : (
                            <>
                              {!lead.convertedToProperty && !locallyConvertedLeads.has(lead.id) && (
                                <Tooltip title="Convert to Property">
                                  <ActionIconButton 
                                    size="small" 
                                    sx={{ mr: 1 }}
                                    onClick={() => handleConvertToProperty(lead)}
                                  >
                                    <Icons.Transform fontSize="small" />
                                  </ActionIconButton>
                                </Tooltip>
                              )}
                              {(lead.convertedToProperty || locallyConvertedLeads.has(lead.id)) && (
                                <Tooltip title="Already Converted to Property">
                                  <Box 
                                    sx={{ 
                                      display: 'flex', 
                                      alignItems: 'center', 
                                      mr: 1,
                                      color: 'success.main' 
                                    }}
                                  >
                                    <Icons.CheckCircle fontSize="small" />
                                  </Box>
                                </Tooltip>
                              )}
                              <Tooltip title="Archive Lead">
                                <ActionIconButton 
                                  size="small" 
                                  sx={{ mr: 1 }}
                                  onClick={() => handleArchiveLead(lead.id)}
                                >
                                  <Icons.Archive fontSize="small" />
                                </ActionIconButton>
                              </Tooltip>
                              <Tooltip title="Edit Lead">
                                <ActionIconButton 
                                  size="small" 
                                  sx={{ mr: 1 }}
                                  onClick={() => handleEditLead(lead)}
                                >
                                  <Icons.Edit fontSize="small" />
                                </ActionIconButton>
                              </Tooltip>

                            </>
                          )}
                        </Box>
                      </TableCell>
                    </StyledTableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>

      {/* Mobile & Tablet view - Cards */}
      <Box sx={{ display: { xs: 'flex', lg: 'none' }, flexDirection: 'column', gap: 1 }}>
        {propertyLeads.length === 0 ? (
          <Paper sx={{ p: 3, borderRadius: 2, textAlign: 'center' }}>
            <Typography variant="body1" sx={{ py: 2 }}>
              No property leads found. Add your first lead.
            </Typography>
          </Paper>
        ) : (
          getPaginatedLeads().map((lead) => {
            const isExpanded = expandedLeads.has(lead.id);
            return (
              <Paper 
                key={lead.id}
                elevation={2}
                sx={{ 
                  borderRadius: 2, 
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    elevation: 4,
                    transform: 'translateY(-1px)'
                  },
                  ...(lead.archived ? {
                    opacity: 0.6,
                    backgroundColor: '#f5f5f5',
                  } : {}),
                  ...((lead.convertedToProperty || locallyConvertedLeads.has(lead.id)) ? {
                    borderLeft: '6px solid #4caf50',
                    backgroundColor: 'rgba(76, 175, 80, 0.08)',
                  } : {})
                }}
                onClick={() => handleToggleExpanded(lead.id)}
              >
                {/* Condensed Header - Always Visible */}
                <Box sx={{ p: 2, pb: isExpanded ? 1 : 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, minWidth: 0 }}>
                      <Checkbox
                        color="primary"
                        checked={selectedLeads.includes(lead.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleSelectLead(lead.id);
                        }}
                        size="small"
                      />
                      <Typography 
                        variant="body1" 
                        fontWeight="medium"
                        sx={{ 
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          flex: 1
                        }}
                      >
                        {lead.address}
                      </Typography>
                      {(lead.convertedToProperty || locallyConvertedLeads.has(lead.id)) && (
                        <ConvertedBadge>
                          <Icons.CheckCircle fontSize="inherit" sx={{ mr: 0.5 }} />
                          Converted
                        </ConvertedBadge>
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <IconButton
                        size="small"
                        sx={{ 
                          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.2s ease-in-out'
                        }}
                      >
                        <Icons.KeyboardArrowDown />
                      </IconButton>
                    </Box>
                  </Box>

                  {/* Quick Metrics Row */}
                  <Box sx={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 1,
                    fontSize: '0.75rem'
                  }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">Price</Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {formatCurrency(lead.listingPrice)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">Units</Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {lead.units || ''}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">Last Contact</Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {formatDate(lead.lastContactDate)}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Expanded Content */}
                {isExpanded && (
                  <Box sx={{ 
                    borderTop: '1px solid #e0e0e0',
                    p: 2,
                    pt: 1
                  }}>
                    {/* Address with Zillow link */}
                    <Box sx={{ mb: 2 }}>
                      <Typography 
                        variant="h6" 
                        component="a"
                        href={lead.zillowLink}
                        target="_blank" 
                        rel="noopener noreferrer"
                        sx={{
                          color: '#1976d2', 
                          textDecoration: 'none',
                          display: 'block'
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {lead.address}
                      </Typography>
                    </Box>

                    {/* Primary Details */}
                    <Box sx={{ 
                      display: 'grid', 
                      gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, 1fr)' },
                      gap: 2,
                      mb: 3
                    }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Listing Price</Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {formatCurrency(lead.listingPrice)}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Units</Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {lead.units || ''}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Last Contact</Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {formatDate(lead.lastContactDate)}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Seller Contact Information */}
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>Seller Contact</Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {lead.sellerPhone && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Icons.Phone fontSize="small" color="action" />
                            <Button
                              variant="text"
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyPhoneNumber(lead.sellerPhone);
                              }}
                              sx={{ 
                                textTransform: 'none',
                                minWidth: 'auto',
                                padding: '4px 8px',
                                justifyContent: 'flex-start'
                              }}
                            >
                              {lead.sellerPhone}
                            </Button>
                          </Box>
                        )}
                        {lead.sellerEmail && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Icons.Email fontSize="small" color="action" />
                            <Button
                              variant="text"
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(lead.sellerEmail, 'Email address copied to clipboard!');
                              }}
                              sx={{ 
                                textTransform: 'none',
                                minWidth: 'auto',
                                padding: '4px 8px',
                                justifyContent: 'flex-start'
                              }}
                            >
                              {lead.sellerEmail}
                            </Button>
                          </Box>
                        )}
                        {!lead.sellerPhone && !lead.sellerEmail && (
                          <Typography variant="body2" color="text.secondary">No contact information</Typography>
                        )}
                      </Box>
                    </Box>

                    {/* Notes */}
                    {lead.notes && (
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>Notes</Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          {lead.notes.length > 100 ? `${lead.notes.substring(0, 100)}...` : lead.notes}
                        </Typography>
                      </Box>
                    )}

                    {/* Action Buttons */}
                    <Box sx={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                      gap: 1,
                      mt: 2
                    }}>
                      <MessageLeadButton lead={lead} variant="outlined" size="small" />
                      <Button
                        variant="outlined"
                        startIcon={<Icons.Message />}
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyTemplatedMessage(lead);
                        }}
                        fullWidth
                      >
                        Copy Message
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<Icons.CheckCircle />}
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpdateLastContact(lead);
                        }}
                        fullWidth
                      >
                        Mark Contacted
                      </Button>
                    </Box>

                    {/* Action Icons */}
                    <Box sx={{ 
                      display: 'flex', 
                      gap: 1, 
                      mt: 2,
                      justifyContent: 'center'
                    }}>
                      {lead.archived ? (
                        <>
                          <Tooltip title="Unarchive Lead">
                            <ActionIconButton 
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUnarchiveLead(lead.id);
                              }}
                            >
                              <Icons.Unarchive fontSize="small" />
                            </ActionIconButton>
                          </Tooltip>
                          <Tooltip title="Delete Lead">
                            <DeleteIconButton 
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteLead(lead.id);
                              }}
                            >
                              <Icons.Delete fontSize="small" />
                            </DeleteIconButton>
                          </Tooltip>
                        </>
                      ) : (
                        <>
                          {!lead.convertedToProperty && !locallyConvertedLeads.has(lead.id) && (
                            <Tooltip title="Convert to Property">
                              <ActionIconButton 
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleConvertToProperty(lead);
                                }}
                              >
                                <Icons.Transform fontSize="small" />
                              </ActionIconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="Archive Lead">
                            <ActionIconButton 
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleArchiveLead(lead.id);
                              }}
                            >
                              <Icons.Archive fontSize="small" />
                            </ActionIconButton>
                          </Tooltip>
                          <Tooltip title="Edit Lead">
                            <ActionIconButton 
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditLead(lead);
                              }}
                            >
                              <Icons.Edit fontSize="small" />
                            </ActionIconButton>
                          </Tooltip>
                        </>
                      )}
                    </Box>
                  </Box>
                )}
              </Paper>
            );
          })
        )}
      </Box>

      {/* Pagination Controls */}
      {propertyLeads.length > 0 && (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mt: 3,
          mb: 2,
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 2, sm: 0 }
        }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2,
            flexDirection: { xs: 'column', sm: 'row' },
            width: { xs: '100%', sm: 'auto' }
          }}>
            <Typography variant="body2" color="text.secondary">
              Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} leads
            </Typography>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Per page</InputLabel>
              <Select
                value={itemsPerPage}
                label="Per page"
                onChange={handleItemsPerPageChange}
                disabled={loading}
              >
                <MenuItem value={10}>10</MenuItem>
                <MenuItem value={25}>25</MenuItem>
                <MenuItem value={50}>50</MenuItem>
                <MenuItem value={100}>100</MenuItem>
              </Select>
            </FormControl>
          </Box>
          
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={handlePageChange}
            color="primary"
            size="large"
            showFirstButton
            showLastButton
            disabled={loading}
            sx={{
              '& .MuiPaginationItem-root': {
                borderRadius: 2,
              },
              '& .MuiPaginationItem-root.Mui-disabled': {
                opacity: 0.5,
              }
            }}
          />
        </Box>
      )}

      {/* Add/Edit Dialog */}
      <PropertyLeadDialog
        open={openDialog}
        isEditing={isEditing}
        initialFormData={dialogInitialFormData}
        onSave={handleDialogSave}
        onClose={handleCloseDialog}
        handleCurrencyInput={handleCurrencyInput}
        formatInputCurrency={formatInputCurrency}
      />

      {/* Message Override Dialog */}
      <Dialog
        open={openMessageDialog}
        onClose={handleCloseMessageDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            minHeight: '500px'
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>Customize Message Template</Typography>
            <Tooltip title="Reset to default message">
              <IconButton 
                onClick={handleResetToDefault} 
                size="small"
                sx={{ 
                  color: 'text.secondary',
                  '&:hover': { color: 'primary.main' }
                }}
              >
                <Icons.Refresh fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 0 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Customize your message template. Use the following variables:
          </Typography>
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
              Available variables:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <Chip
                label="{PRICE}"
                size="small"
                variant="outlined"
                onClick={() => {
                  const textarea = messageTextareaRef.current;
                  if (textarea) {
                    const start = textarea.selectionStart;
                    const end = textarea.selectionEnd;
                    const text = textarea.value;
                    const before = text.substring(0, start);
                    const after = text.substring(end);
                    const newText = before + '{PRICE}' + after;
                    textarea.value = newText;
                    textarea.focus();
                    textarea.setSelectionRange(start + 7, start + 7);
                  }
                }}
                sx={{ cursor: 'pointer', fontSize: '0.75rem' }}
              />
              <Chip
                label="{ZILLOW_LINK}"
                size="small"
                variant="outlined"
                onClick={() => {
                  const textarea = messageTextareaRef.current;
                  if (textarea) {
                    const start = textarea.selectionStart;
                    const end = textarea.selectionEnd;
                    const text = textarea.value;
                    const before = text.substring(0, start);
                    const after = text.substring(end);
                    const newText = before + '{ZILLOW_LINK}' + after;
                    textarea.value = newText;
                    textarea.focus();
                    textarea.setSelectionRange(start + 13, start + 13);
                  }
                }}
                sx={{ cursor: 'pointer', fontSize: '0.75rem' }}
              />
              <Chip
                label="{ADDRESS}"
                size="small"
                variant="outlined"
                onClick={() => {
                  const textarea = messageTextareaRef.current;
                  if (textarea) {
                    const start = textarea.selectionStart;
                    const end = textarea.selectionEnd;
                    const text = textarea.value;
                    const before = text.substring(0, start);
                    const after = text.substring(end);
                    const newText = before + '{ADDRESS}' + after;
                    textarea.value = newText;
                    textarea.focus();
                    textarea.setSelectionRange(start + 9, start + 9);
                  }
                }}
                sx={{ cursor: 'pointer', fontSize: '0.75rem' }}
              />
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Click any variable to insert it at the cursor position
            </Typography>
          </Box>
          
          <TextField
            autoFocus
            multiline
            rows={10}
            fullWidth
            variant="outlined"
            label="Message Template"
            defaultValue={customMessage}
            inputRef={messageTextareaRef}
            placeholder="Enter your custom message template..."
            sx={{ 
              fontFamily: 'monospace',
              '& .MuiOutlinedInput-root': {
                borderRadius: 1.5
              }
            }}
            inputProps={{
              style: { fontSize: '14px', lineHeight: '1.5' }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={handleCloseMessageDialog} 
            sx={{ 
              color: 'text.secondary',
              '&:hover': { backgroundColor: 'action.hover' }
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSaveCustomMessage} 
            variant="contained" 
            sx={{ 
              borderRadius: 1.5,
              px: 3,
              py: 1
            }}
          >
            Save Template
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success/Error Notification */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default PropertyLeadsPage; 
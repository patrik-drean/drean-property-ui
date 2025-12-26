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
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { PropertyLead, CreatePropertyLead } from '../types/property';
import {
  getPropertyLeadsWithArchivedStatus,
  addPropertyLead,
  updatePropertyLead,
  deletePropertyLead,
  addProperty,
  archivePropertyLead
} from '../services/api';
import { smsService } from '../services/smsService';
import { SmsConversation } from '../types/sms';
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
  borderLeft: '6px solid transparent',
  backgroundColor: '#ffffff !important',
  '&:last-child td, &:last-child th': {
    border: 0,
  },
  '&:hover': {
    backgroundColor: '#f8f9fa !important',
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

// Helper function to calculate ARV Guess for a lead
const calculateARVGuess = (squareFootage: number | null): number => {
  if (!squareFootage) return 0;
  return 160 * squareFootage;
};

// Helper function to calculate lead score based on listing price vs ARV
const calculateLeadScore = (listingPrice: number, squareFootage: number | null): number => {
  const arvGuess = calculateARVGuess(squareFootage);
  if (!arvGuess || arvGuess === 0) return 0;

  const ratio = listingPrice / arvGuess;

  // Calculate score based on ratio thresholds
  if (ratio >= 0.95) return 1;
  if (ratio >= 0.90) return 2;
  if (ratio >= 0.85) return 3;
  if (ratio >= 0.80) return 4;
  if (ratio >= 0.75) return 5;
  if (ratio >= 0.70) return 6;
  if (ratio >= 0.65) return 7;
  if (ratio >= 0.60) return 8;
  if (ratio >= 0.55) return 9;
  // Anything 50% and under is a 10
  return 10;
};

// Helper function to get score background color
const getScoreBackgroundColor = (score: number): string => {
  if (score >= 8) return '#4CAF50'; // Green for 8-10
  if (score >= 5) return '#FFC107'; // Yellow for 5-7
  if (score >= 1) return '#F44336'; // Red for 1-4
  return '#9E9E9E'; // Grey for 0 (no data)
};

// Helper function to get score text color
const getScoreColor = (score: number): string => {
  if (score >= 8) return '#E8F5E9'; // Light green text for green background
  if (score >= 5) return '#212121'; // Dark text for yellow background
  if (score >= 1) return '#FFEBEE'; // Light red text for red background
  return '#FFFFFF'; // White text for grey background
};

const PropertyLeadsPage: React.FC = () => {
  const navigate = useNavigate();
  const [propertyLeads, setPropertyLeads] = useState<PropertyLead[]>([]);
  const [conversations, setConversations] = useState<SmsConversation[]>([]);
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
    id: lead.id,
    address: lead.address,
    zillowLink: lead.zillowLink,
    listingPrice: lead.listingPrice,
    sellerPhone: lead.sellerPhone,
    sellerEmail: lead.sellerEmail,
    lastContactDate: lead.lastContactDate,
    respondedDate: lead.respondedDate || null,
    convertedDate: lead.convertedDate || null,
    underContractDate: lead.underContractDate || null,
    soldDate: lead.soldDate || null,
    notes: lead.notes || '',
    squareFootage: lead.squareFootage,
    units: lead.units,
    convertedToProperty: lead.convertedToProperty || false,
    archived: lead.archived || false,
    tags: lead.tags || [],
  } : {
    address: '',
    zillowLink: '',
    listingPrice: 0,
    sellerPhone: '',
    sellerEmail: '',
    lastContactDate: null,
    respondedDate: null,
    convertedDate: null,
    underContractDate: null,
    soldDate: null,
    notes: '',
    squareFootage: null,
    units: null,
    convertedToProperty: false,
    archived: false,
    tags: [],
  };

  const [dialogInitialFormData, setDialogInitialFormData] = useState(getInitialFormData());
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });
  const [locallyConvertedLeads, setLocallyConvertedLeads] = useState<Set<string>>(new Set());
  const [expandedLeads, setExpandedLeads] = useState<Set<string>>(new Set());
  const [highlightedLeadId, setHighlightedLeadId] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(100);
  const [totalItems, setTotalItems] = useState(0);

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

  // Helper function to format metadata for tooltip display
  const formatMetadataForTooltip = (metadata: Record<string, any>) => {
    const entries = Object.entries(metadata);
    if (entries.length === 0) return null;

    return (
      <Box>
        {entries.map(([key, value], index) => (
          <Typography
            key={index}
            variant="body2"
            sx={{
              fontSize: '0.9rem',
              lineHeight: 1.6
            }}
          >
            {key}: {String(value)}
          </Typography>
        ))}
      </Box>
    );
  };

  // Helper function to format notes and/or metadata for tooltip display
  const formatNotesForTooltip = (lead: PropertyLead) => {
    const notes = lead.notes;
    const metadata = lead.metadata;

    // Check if metadata exists and has content
    const hasMetadata = metadata && Object.keys(metadata).length > 0;

    // Pattern to match the structured data at the end of notes (for backward compatibility)
    const pattern = /(Property Grade:.*?Zestimate:.*?Rent Estimate:.*?Days on Market:.*?)$/;
    const match = notes.match(pattern);

    if (hasMetadata) {
      // Display metadata if available (preferred)
      return (
        <Box>
          {notes && (
            <Typography variant="body1" sx={{ mb: 2, fontSize: '0.95rem' }}>
              {notes}
            </Typography>
          )}
          <Box sx={{
            borderTop: notes ? '1px solid rgba(255, 255, 255, 0.3)' : 'none',
            pt: notes ? 1 : 0
          }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5, fontSize: '0.9rem' }}>
              Metadata:
            </Typography>
            {formatMetadataForTooltip(metadata)}
          </Box>
        </Box>
      );
    }

    if (match) {
      // Fall back to parsing notes if no metadata (backward compatibility)
      const mainText = notes.substring(0, match.index).trim();
      const structuredData = match[1];

      // Split structured data into individual fields
      const fields = structuredData.match(/(Property Grade:|Zestimate:|Rent Estimate:|Days on Market:)[^A-Z]*/g) || [];

      return (
        <Box>
          {mainText && (
            <Typography variant="body1" sx={{ mb: mainText ? 2 : 0, fontSize: '0.95rem' }}>
              {mainText}
            </Typography>
          )}
          {fields.length > 0 && (
            <Box sx={{
              borderTop: mainText ? '1px solid rgba(255, 255, 255, 0.3)' : 'none',
              pt: mainText ? 1 : 0
            }}>
              {fields.map((field, index) => (
                <Typography
                  key={index}
                  variant="body2"
                  sx={{
                    fontSize: '0.9rem',
                    lineHeight: 1.6
                  }}
                >
                  {field.trim()}
                </Typography>
              ))}
            </Box>
          )}
        </Box>
      );
    }

    // If no structured data pattern found, return the notes as is with larger font
    return (
      <Typography variant="body1" sx={{ fontSize: '0.95rem', whiteSpace: 'pre-wrap' }}>
        {notes}
      </Typography>
    );
  };

  // Helper function to get unread message count for a lead
  const getUnreadCount = (leadId: string): number => {
    const conversation = conversations.find(c => c.propertyLeadId === leadId);
    return conversation?.unreadCount || 0;
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



  const fetchPropertyLeads = useCallback(async (isInitialLoad = false) => {
    // Only show loading spinner on initial load, not on background refresh
    if (isInitialLoad) {
      setLoading(true);
      setError(null);
    }
    try {
      // Fetch both leads and conversations in parallel
      const [leadsData, conversationsData] = await Promise.all([
        getPropertyLeadsWithArchivedStatus(showArchived),
        smsService.getConversations().catch(() => []), // Gracefully handle SMS service errors
      ]);

      setPropertyLeads(leadsData);
      setConversations(conversationsData);
      setTotalItems(leadsData.length);

      // Only reset to first page on initial load, not on background refresh
      if (isInitialLoad) {
        setCurrentPage(1);
      }
    } catch (err) {
      console.error('Error fetching property leads:', err);
      if (isInitialLoad) {
        setError('Failed to load property leads. Please try again.');
      }
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      }
    }
  }, [showArchived]);

  useEffect(() => {
    fetchPropertyLeads(true); // Initial load with loading spinner
  }, [fetchPropertyLeads]);

  // Auto-refresh leads every 10 seconds - silently in the background
  useEffect(() => {
    const POLL_INTERVAL = 10000; // 10 seconds
    const intervalId = setInterval(() => {
      fetchPropertyLeads(false); // Background refresh without loading spinner
    }, POLL_INTERVAL);

    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
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
        // Both have no contact date (Not Contacted)
        // Sort by lead score descending (10 -> 1, then null)
        // Use backend score if available, otherwise calculate client-side (same as display logic)
        const aScore = (a.leadScore !== null && a.leadScore !== undefined)
          ? a.leadScore
          : calculateLeadScore(a.listingPrice, a.squareFootage);
        const bScore = (b.leadScore !== null && b.leadScore !== undefined)
          ? b.leadScore
          : calculateLeadScore(b.listingPrice, b.squareFootage);

        if (aScore !== bScore) {
          return bScore - aScore; // Descending order (higher scores first)
        }

        // If scores are equal, sort by created date (most recent first)
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
      // Automatically set convertedToProperty to true if convertedDate is set
      const dataToSave = {
        ...formData,
        convertedToProperty: formData.convertedDate ? true : formData.convertedToProperty
      };

      if (isEditing && editingId) {
        await updatePropertyLead(editingId, dataToSave);
        setSnackbar({
          open: true,
          message: 'Property lead updated successfully',
          severity: 'success',
        });
      } else {
        await addPropertyLead(dataToSave as CreatePropertyLead);
        setSnackbar({
          open: true,
          message: 'Property lead added successfully',
          severity: 'success',
        });
      }
      setOpenDialog(false);
      fetchPropertyLeads(false); // Background refresh after save
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
        fetchPropertyLeads(false); // Background refresh after delete
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

  const handleCloseMessageDialog = () => {
    setOpenMessageDialog(false);
  };

  const handleSaveCustomMessage = () => {
    // Save the custom message if needed
    setOpenMessageDialog(false);
  };

  const handleResetToDefault = () => {
    setCustomMessage('');
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

  const handleRowClick = (leadId: string) => {
    // Toggle highlight: if already highlighted, unhighlight it
    setHighlightedLeadId(prev => prev === leadId ? null : leadId);
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
        fetchPropertyLeads(false); // Background refresh after bulk delete
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
        propertyLeadId: lead.id, // Link property to the lead
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
        // Explicitly set convertedToProperty to true and set the conversion date
        convertedToProperty: true,
        convertedDate: new Date().toISOString(),
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
        fetchPropertyLeads(false); // Background refresh after conversion
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
            component={RouterLink}
            to="/reports?tab=3"
            startIcon={<Icons.Assessment />}
            sx={{
              borderRadius: 2,
              width: { xs: '100%', sm: 'auto' }
            }}
          >
            View Sales Report
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
                  <StyledTableCell className="header" sx={{ maxWidth: '280px' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      Address
                      <Tooltip title="Green highlight and badge indicates leads that have been converted to properties">
                        <Icons.Info fontSize="small" sx={{ ml: 1, opacity: 0.7 }} />
                      </Tooltip>
                    </Box>
                  </StyledTableCell>
                  <StyledTableCell className="header">Units</StyledTableCell>
                  <StyledTableCell className="header">Listing Price</StyledTableCell>
                  <StyledTableCell className="header">Seller Contact</StyledTableCell>
                  <StyledTableCell className="header" sx={{ minWidth: '150px' }}>Last Contact</StyledTableCell>
                  <StyledTableCell className="header">Score</StyledTableCell>
                  <StyledTableCell className="header">Sq Ft</StyledTableCell>
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
                      onClick={() => handleRowClick(lead.id)}
                      sx={{
                        cursor: 'pointer',
                        ...(lead.archived ? {
                          opacity: 0.6,
                          backgroundColor: '#f5f5f5',
                          '&:hover': {
                            backgroundColor: '#eeeeee',
                          }
                        } : {}),
                        ...((lead.convertedToProperty || locallyConvertedLeads.has(lead.id)) ? {
                          borderLeftColor: '#4caf50',
                          backgroundColor: 'rgba(76, 175, 80, 0.08)',
                          '&:hover': {
                            backgroundColor: 'rgba(76, 175, 80, 0.14)',
                          }
                        } : {}),
                        ...(highlightedLeadId === lead.id ? {
                          backgroundColor: 'rgba(25, 118, 210, 0.20) !important',
                          borderLeftColor: '#1976d2 !important',
                          '&:hover': {
                            backgroundColor: 'rgba(25, 118, 210, 0.28) !important',
                          }
                        } : {})
                      }}
                    >
                      <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          color="primary"
                          checked={selectedLeads.includes(lead.id)}
                          onChange={() => handleSelectLead(lead.id)}
                        />
                      </TableCell>
                      <TableCell sx={{ maxWidth: '280px' }}>
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
                          <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            minWidth: 0,
                            flex: 1
                          }}>
                            <Box sx={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              minWidth: 0
                            }}>
                              {lead.address}
                            </Box>
                            {getUnreadCount(lead.id) > 0 && (
                              <Tooltip title={`${getUnreadCount(lead.id)} unread message${getUnreadCount(lead.id) > 1 ? 's' : ''}`} arrow>
                                <Chip
                                  icon={<Icons.Message fontSize="small" />}
                                  label={getUnreadCount(lead.id)}
                                  size="small"
                                  color="error"
                                  sx={{ height: '20px', fontSize: '0.7rem', flexShrink: 0 }}
                                />
                              </Tooltip>
                            )}
                            {(lead.convertedToProperty || locallyConvertedLeads.has(lead.id)) && (
                              <ConvertedBadge sx={{ flexShrink: 0 }}>
                                <Icons.CheckCircle fontSize="inherit" sx={{ mr: 0.5 }} />
                                Converted
                              </ConvertedBadge>
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>{lead.units || ''}</TableCell>
                      <TableCell>{formatCurrency(lead.listingPrice)}</TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <MessageLeadButton
                            lead={lead}
                            iconOnly
                            size="small"
                            onMessageSent={() => setHighlightedLeadId(lead.id)}
                          />
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
                          {!lead.sellerPhone && !lead.sellerEmail && (
                            <Typography variant="body2" color="text.secondary">No phone</Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ minWidth: '150px' }} onClick={(e) => e.stopPropagation()}>
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
                        {(() => {
                          // Use backend score if available, otherwise calculate client-side
                          const hasBackendScore = lead.leadScore !== null && lead.leadScore !== undefined;
                          const score: number = hasBackendScore
                            ? lead.leadScore!
                            : calculateLeadScore(lead.listingPrice, lead.squareFootage);
                          const arvGuess = calculateARVGuess(lead.squareFootage);

                          if (score === 0) {
                            return (
                              <Typography variant="body2" sx={{ color: 'text.disabled', fontStyle: 'italic' }}>
                                N/A
                              </Typography>
                            );
                          }

                          return (
                            <Tooltip
                              title={
                                <>
                                  <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                                    Score Calculation:
                                  </Typography>
                                  <Typography variant="body2">
                                    Listing Price: {formatCurrency(lead.listingPrice)}
                                  </Typography>
                                  <Typography variant="body2">
                                    ARV Guess: {formatCurrency(arvGuess)}
                                  </Typography>
                                  <Typography variant="body2">
                                    Ratio: {((lead.listingPrice / arvGuess) * 100).toFixed(1)}%
                                  </Typography>
                                  {hasBackendScore && (
                                    <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic', opacity: 0.8 }}>
                                      (Backend calculated)
                                    </Typography>
                                  )}
                                </>
                              }
                              arrow
                              placement="top"
                            >
                              <Box sx={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: getScoreBackgroundColor(score),
                                color: getScoreColor(score),
                                p: '4px 12px',
                                borderRadius: 2,
                                fontWeight: 'bold',
                                minWidth: '50px',
                                height: '28px',
                                cursor: 'help',
                                boxShadow: 1
                              }}>
                                {score}/10
                              </Box>
                            </Tooltip>
                          );
                        })()}
                      </TableCell>
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
                      <TableCell>
                        <Box sx={{
                          maxWidth: '200px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {lead.notes || (lead.metadata && Object.keys(lead.metadata).length > 0) ? (
                            <Tooltip
                              title={formatNotesForTooltip(lead)}
                              arrow
                              placement="top"
                              componentsProps={{
                                tooltip: {
                                  sx: {
                                    maxWidth: 500,
                                    fontSize: '0.95rem',
                                    padding: 2
                                  }
                                }
                              }}
                            >
                              <Typography variant="body2" sx={{ color: 'text.secondary', cursor: 'help' }}>
                                {lead.notes ? (lead.notes.length > 50 ? `${lead.notes.substring(0, 50)}...` : lead.notes) : 'View metadata'}
                              </Typography>
                            </Tooltip>
                          ) : (
                            <Typography variant="body2" sx={{ color: 'text.disabled', fontStyle: 'italic' }}>
                              No notes
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ width: '220px' }} onClick={(e) => e.stopPropagation()}>
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
                  borderLeft: '6px solid transparent',
                  '&:hover': {
                    elevation: 4,
                    transform: 'translateY(-1px)'
                  },
                  ...(lead.archived ? {
                    opacity: 0.6,
                    backgroundColor: '#f5f5f5',
                  } : {}),
                  ...((lead.convertedToProperty || locallyConvertedLeads.has(lead.id)) ? {
                    borderLeftColor: '#4caf50',
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
                          flex: 1,
                          minWidth: 0
                        }}
                      >
                        {lead.address}
                      </Typography>
                      {getUnreadCount(lead.id) > 0 && (
                        <Chip
                          icon={<Icons.Message fontSize="small" />}
                          label={getUnreadCount(lead.id)}
                          size="small"
                          color="error"
                          sx={{ height: '20px', fontSize: '0.7rem', flexShrink: 0 }}
                        />
                      )}
                      {(lead.convertedToProperty || locallyConvertedLeads.has(lead.id)) && (
                        <ConvertedBadge sx={{ flexShrink: 0 }}>
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
                      <Typography variant="caption" color="text.secondary" display="block">Score</Typography>
                      {(() => {
                        const score = calculateLeadScore(lead.listingPrice, lead.squareFootage);

                        if (score === 0) {
                          return (
                            <Typography variant="body2" sx={{ color: 'text.disabled', fontStyle: 'italic' }}>
                              N/A
                            </Typography>
                          );
                        }

                        return (
                          <Box sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: getScoreBackgroundColor(score),
                            color: getScoreColor(score),
                            p: '2px 8px',
                            borderRadius: 1,
                            fontWeight: 'bold',
                            fontSize: '0.75rem',
                            minWidth: '40px',
                            height: '24px',
                            boxShadow: 1
                          }}>
                            {score}/10
                          </Box>
                        );
                      })()}
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
                    {(lead.notes || (lead.metadata && Object.keys(lead.metadata).length > 0)) && (
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>Notes</Typography>
                        {lead.notes && lead.notes.length > 100 ? (
                          <Tooltip
                            title={formatNotesForTooltip(lead)}
                            arrow
                            placement="top"
                            componentsProps={{
                              tooltip: {
                                sx: {
                                  maxWidth: 500,
                                  fontSize: '0.95rem',
                                  padding: 2
                                }
                              }
                            }}
                          >
                            <Typography variant="body2" sx={{ color: 'text.secondary', cursor: 'help' }}>
                              {lead.notes.substring(0, 100)}...
                            </Typography>
                          </Tooltip>
                        ) : (
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            {formatNotesForTooltip(lead)}
                          </Typography>
                        )}
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
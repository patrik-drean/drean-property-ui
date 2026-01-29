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
  Tooltip,
  IconButton,
  CircularProgress,
  Snackbar,
  Alert,
  Box,
  Checkbox,
  Chip,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  useTheme,
  TextField,
  InputAdornment,
} from '@mui/material';
import * as Icons from '@mui/icons-material';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import { PropertyLead, CreatePropertyLead, Property } from '../types/property';
import {
  getPropertyLeadsWithArchivedStatus,
  addPropertyLead,
  updatePropertyLead,
  deletePropertyLead,
  addProperty,
  archivePropertyLead,
  getPropertyLead,
  archiveProperty,
  updatePropertyRentcast,
  updateProperty as updatePropertyApi,
} from '../services/api';
import { useProperties } from '../contexts/PropertiesContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { OpportunitiesTable } from './leads';
import { smsService } from '../services/smsService';
import { SmsConversation } from '../types/sms';
import PropertyLeadDialog from './PropertyLeadDialog';
import PropertyDialog from './PropertyDialog';
import { MessageLeadButton } from './messaging/MessageLeadButton';
import {
  StyledTableCell,
  StyledTableRow,
  ActionIconButton,
  DeleteIconButton,
  ConvertedBadge,
  NotContactedText,
} from './leads/leadsStyles';
import {
  calculateARVGuess,
  calculateLeadScore,
  getScoreBackgroundColor,
  getScoreColor,
  hasMetadataContent,
  formatMetadataValue,
  sortPropertyLeads,
  formatCurrency,
} from './leads/leadsHelpers';
import { LeadsToolbar } from './leads/LeadsToolbar';
import { useLeadsFilters } from '../hooks';
import { UsageLimitBanner } from './shared/UsageLimitBanner';
import { useMessagingPopover } from '../contexts/MessagingPopoverContext';
import { calculateHoldScore } from '../utils/scoreCalculator';

// Tab panel component (same pattern as Reports page)
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`leads-tabpanel-${index}`}
    aria-labelledby={`leads-tab-${index}`}
    {...other}
  >
    {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
  </div>
);

const a11yProps = (index: number) => ({
  id: `leads-tab-${index}`,
  'aria-controls': `leads-tabpanel-${index}`,
});

const PropertyLeadsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const { openPopover } = useMessagingPopover();

  // Favorite tab state - persisted to localStorage
  const FAVORITE_TAB_KEY = 'propguide_favorite_leads_tab';
  const [favoriteTab, setFavoriteTab] = useState<number | null>(() => {
    const saved = localStorage.getItem(FAVORITE_TAB_KEY);
    return saved !== null ? parseInt(saved, 10) : null;
  });

  // Tab state - initialize from URL param, then favorite, then default to 0
  const searchParams = new URLSearchParams(location.search);
  const tabParam = searchParams.get('tab');
  const getInitialTab = () => {
    if (tabParam !== null) {
      const parsed = parseInt(tabParam, 10);
      if (parsed >= 0 && parsed <= 1) return parsed;
    }
    if (favoriteTab !== null && favoriteTab >= 0 && favoriteTab <= 1) return favoriteTab;
    return 0;
  };
  const [currentTab, setCurrentTab] = useState(getInitialTab);

  // Properties context for Opportunities tab
  const { properties, refreshProperties, isStale: propertiesStale, updateProperty, removeProperty } = useProperties();
  const { isPro, createCheckoutSession } = useSubscription();

  // Linked leads for Opportunities tooltips (property.propertyLeadId -> PropertyLead)
  const [linkedLeads, setLinkedLeads] = useState<Map<string, PropertyLead>>(new Map());

  const [propertyLeads, setPropertyLeads] = useState<PropertyLead[]>([]);
  const [conversations, setConversations] = useState<SmsConversation[]>([]);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // State for property edit dialog (opportunities)
  const [propertyDialogOpen, setPropertyDialogOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);

  // Use the leads filters hook for filtering and tags
  const { filterLeads, availableTags } = useLeadsFilters(propertyLeads);

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

  // Tab change handler - updates URL
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
    const newSearchParams = new URLSearchParams(window.location.search);
    newSearchParams.set('tab', newValue.toString());
    navigate(`/leads/classic?${newSearchParams.toString()}`, { replace: true });
  };

  // Toggle favorite tab
  const handleToggleFavorite = (tabIndex: number, event: React.MouseEvent) => {
    event.stopPropagation();
    if (favoriteTab === tabIndex) {
      // Unfavorite - remove from localStorage
      localStorage.removeItem(FAVORITE_TAB_KEY);
      setFavoriteTab(null);
    } else {
      // Set as favorite
      localStorage.setItem(FAVORITE_TAB_KEY, tabIndex.toString());
      setFavoriteTab(tabIndex);
    }
  };


  // Sync tab state with URL changes (browser back/forward)
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const tabFromUrl = urlParams.get('tab');
    if (tabFromUrl !== null) {
      const tabIndex = parseInt(tabFromUrl, 10);
      if (tabIndex >= 0 && tabIndex <= 1 && tabIndex !== currentTab) {
        setCurrentTab(tabIndex);
      }
    }
  }, [location.search]);

  // Refresh properties when navigating to Opportunities tab if data is stale
  useEffect(() => {
    if (currentTab === 1 && propertiesStale) {
      refreshProperties();
    }
  }, [currentTab, propertiesStale, refreshProperties]);

  // Fetch linked PropertyLeads for Opportunities tooltips
  useEffect(() => {
    const fetchLinkedLeads = async () => {
      const opportunities = properties.filter(p =>
        ['Opportunity', 'Soft Offer', 'Hard Offer'].includes(p.status)
      );
      const leadIds = opportunities
        .map(p => p.propertyLeadId)
        .filter((id): id is string => !!id);

      if (leadIds.length === 0) {
        setLinkedLeads(new Map());
        return;
      }

      // Fetch leads in parallel
      const leads = await Promise.all(
        leadIds.map(id => getPropertyLead(id).catch(() => null))
      );

      const leadMap = new Map<string, PropertyLead>();
      leads.forEach(lead => {
        if (lead) leadMap.set(lead.id, lead);
      });
      setLinkedLeads(leadMap);
    };

    if (currentTab === 1) {
      fetchLinkedLeads();
    }
  }, [properties, currentTab]);


  // Handle message property for Opportunities tab
  const handleMessageProperty = (property: Property) => {
    if (!property.propertyLeadId) return;
    const linkedLead = linkedLeads.get(property.propertyLeadId);
    if (linkedLead && linkedLead.sellerPhone) {
      openPopover({
        phoneNumber: linkedLead.sellerPhone,
        leadId: linkedLead.id,
        leadName: linkedLead.sellerPhone,
        leadAddress: linkedLead.address,
        leadPrice: linkedLead.listingPrice ? formatCurrency(linkedLead.listingPrice) : undefined,
      });
    }
  };

  // Handle edit opportunity - open property edit dialog
  const handleEditOpportunity = (property: Property) => {
    setEditingProperty(property);
    setPropertyDialogOpen(true);
  };

  // Handle save property from dialog
  const handleSaveProperty = async (propertyData: Omit<Property, 'id'>) => {
    try {
      const propertyWithScore = {
        ...propertyData,
        score: calculateHoldScore(propertyData)
      };

      if (editingProperty) {
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

        const updatedProperty = await updatePropertyApi(editingProperty.id, propertyToUpdate);
        updateProperty(updatedProperty);

        setSnackbar({
          open: true,
          message: 'Property updated successfully',
          severity: 'success'
        });
      }
    } catch (err: any) {
      console.error('Error saving property:', err);
      setSnackbar({
        open: true,
        message: 'Failed to update property',
        severity: 'error'
      });
      throw err;
    }
  };

  // Handle close property dialog
  const handleClosePropertyDialog = () => {
    setPropertyDialogOpen(false);
    setEditingProperty(null);
  };

  // Handle archive opportunity
  const handleArchiveOpportunity = async (property: Property) => {
    try {
      await archiveProperty(property.id);
      removeProperty(property.id);
      setSnackbar({
        open: true,
        message: 'Property archived successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error archiving property:', error);
      setSnackbar({
        open: true,
        message: 'Failed to archive property',
        severity: 'error'
      });
    }
  };

  // Handle update Rentcast data
  const handleUpdateRentcastData = async (property: Property) => {
    // Gate RentCast API for Pro users only
    if (!isPro) {
      try {
        await createCheckoutSession();
      } catch (error) {
        setSnackbar({
          open: true,
          message: 'RentCast data requires a Pro subscription. Upgrade to unlock.',
          severity: 'error'
        });
      }
      return;
    }

    try {
      const updatedProperty = await updatePropertyRentcast(property.id);
      updateProperty(updatedProperty);
      setSnackbar({
        open: true,
        message: 'RentCast data updated successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error updating Rentcast data:', error);
      setSnackbar({
        open: true,
        message: 'Failed to update RentCast data',
        severity: 'error'
      });
    }
  };

  // Handle send to calculator - helper function to calculate new loan percent
  const calculateNewLoanPercent = (offerPrice: number, rehabCosts: number, arv: number): number => {
    if (arv === 0) return 0;
    return (offerPrice + rehabCosts) / arv;
  };

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

  // Helper function to format created date in MST for tooltip
  const formatCreatedDateMST = (dateString: string | null | undefined): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      timeZone: 'America/Denver',
      month: 'numeric',
      day: 'numeric',
      year: '2-digit',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).replace(',', '');
  };

  // Helper function to format metadata for tooltip display
  const formatMetadataForTooltip = (metadata: string | undefined) => {
    if (!hasMetadataContent(metadata)) return null;

    try {
      const parsed: Record<string, any> = JSON.parse(metadata!);
      const entries = Object.entries(parsed);

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
              {key}: {formatMetadataValue(key, value)}
            </Typography>
          ))}
        </Box>
      );
    } catch (error) {
      console.error('Failed to parse metadata JSON:', error);
      return null;
    }
  };

  // Helper function to format notes and/or metadata for tooltip display
  const formatNotesForTooltip = (lead: PropertyLead) => {
    const notes = lead.notes;
    const metadata = lead.metadata;

    // Check if metadata exists and has content
    const hasMetadata = hasMetadataContent(metadata);

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

  // Pagination helper functions - now using memoized version
  const getPaginatedLeads = () => paginatedLeads;

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

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setCurrentPage(1);
  };

  // Performance optimization: Memoize sorted leads using sortPropertyLeads for proper lead score sorting
  const sortedLeads = React.useMemo(() => sortPropertyLeads(propertyLeads), [propertyLeads]);

  // Filter leads by search query
  const filteredLeads = React.useMemo(() => {
    if (!searchQuery.trim()) {
      return sortedLeads;
    }
    const query = searchQuery.toLowerCase().trim();
    return sortedLeads.filter(lead =>
      lead.address.toLowerCase().includes(query)
    );
  }, [sortedLeads, searchQuery]);

  // Performance optimization: Memoize paginated leads
  const paginatedLeads = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredLeads.slice(startIndex, endIndex);
  }, [filteredLeads, currentPage, itemsPerPage]);

  // Use filteredLeads.length for pagination when searching
  const displayedItemsCount = searchQuery.trim() ? filteredLeads.length : totalItems;
  const totalPages = Math.ceil(displayedItemsCount / itemsPerPage);

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
        saleComparables: [],
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
      <LeadsToolbar
        selectedLeads={selectedLeads}
        onAddLead={handleAddLead}
        onBulkDelete={handleBulkDelete}
      />

      {/* Usage limit warning for free users */}
      <UsageLimitBanner type="leads" />

      {/* Tabs Navigation */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          aria-label="leads and opportunities tabs"
        >
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                Leads
                <Tooltip title={favoriteTab === 0 ? "Remove as default tab" : "Set as default tab"}>
                  <Box
                    component="span"
                    onClick={(e: React.MouseEvent) => handleToggleFavorite(0, e)}
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      p: 0.25,
                      ml: 0.5,
                      borderRadius: '50%',
                      cursor: 'pointer',
                      '&:hover': { backgroundColor: 'action.hover' }
                    }}
                  >
                    {favoriteTab === 0 ? (
                      <Icons.Star sx={{ fontSize: 16, color: 'warning.main' }} />
                    ) : (
                      <Icons.StarBorder sx={{ fontSize: 16, color: 'action.disabled' }} />
                    )}
                  </Box>
                </Tooltip>
              </Box>
            }
            {...a11yProps(0)}
          />
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                Opportunities
                <Tooltip title={favoriteTab === 1 ? "Remove as default tab" : "Set as default tab"}>
                  <Box
                    component="span"
                    onClick={(e: React.MouseEvent) => handleToggleFavorite(1, e)}
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      p: 0.25,
                      ml: 0.5,
                      borderRadius: '50%',
                      cursor: 'pointer',
                      '&:hover': { backgroundColor: 'action.hover' }
                    }}
                  >
                    {favoriteTab === 1 ? (
                      <Icons.Star sx={{ fontSize: 16, color: 'warning.main' }} />
                    ) : (
                      <Icons.StarBorder sx={{ fontSize: 16, color: 'action.disabled' }} />
                    )}
                  </Box>
                </Tooltip>
              </Box>
            }
            {...a11yProps(1)}
          />
        </Tabs>
      </Box>

      {/* Leads Tab */}
      <TabPanel value={currentTab} index={0}>
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
                  <StyledTableCell className="header" sx={{ maxWidth: '320px' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        Address
                        <Tooltip title="Green highlight and badge indicates leads that have been converted to properties">
                          <Icons.Info fontSize="small" sx={{ ml: 1, opacity: 0.7 }} />
                        </Tooltip>
                      </Box>
                      <TextField
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        size="small"
                        variant="outlined"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: 'white',
                            borderRadius: 1,
                            height: 28,
                            '& input': {
                              py: 0.5,
                              fontSize: '0.8rem',
                            }
                          }
                        }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Icons.Search sx={{ fontSize: 16, color: 'text.secondary' }} />
                            </InputAdornment>
                          ),
                          endAdornment: searchQuery && (
                            <InputAdornment position="end">
                              <Icons.Close
                                sx={{ cursor: 'pointer', fontSize: 14, color: 'text.secondary' }}
                                onClick={() => handleSearchChange({ target: { value: '' } } as React.ChangeEvent<HTMLInputElement>)}
                              />
                            </InputAdornment>
                          ),
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
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
                          <Tooltip title={`Created ${formatCreatedDateMST(lead.createdAt)}`} arrow placement="top">
                            <Box component="span" sx={{ cursor: 'help' }}>
                              {formatDate(lead.lastContactDate)}
                            </Box>
                          </Tooltip>
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
                        {lead.squareFootage !== null ? lead.squareFootage.toLocaleString() : ''}
                      </TableCell>
                      <TableCell>
                        <Box sx={{
                          maxWidth: '200px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {lead.notes || hasMetadataContent(lead.metadata) ? (
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
                                <Tooltip title="Promote to Opportunity">
                                  <ActionIconButton
                                    size="small"
                                    sx={{ mr: 1 }}
                                    onClick={() => handleConvertToProperty(lead)}
                                  >
                                    <Icons.ArrowCircleUp fontSize="small" />
                                  </ActionIconButton>
                                </Tooltip>
                              )}
                              {(lead.convertedToProperty || locallyConvertedLeads.has(lead.id)) && (
                                <Tooltip title="Already Promoted to Opportunity">
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
        {/* Mobile Search */}
        <TextField
          placeholder="Search by address..."
          value={searchQuery}
          onChange={handleSearchChange}
          size="small"
          fullWidth
          sx={{
            mb: 1,
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
            }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Icons.Search color="action" />
              </InputAdornment>
            ),
            endAdornment: searchQuery && (
              <InputAdornment position="end">
                <Icons.Close
                  sx={{ cursor: 'pointer', fontSize: 20 }}
                  onClick={() => handleSearchChange({ target: { value: '' } } as React.ChangeEvent<HTMLInputElement>)}
                />
              </InputAdornment>
            ),
          }}
        />
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
                    {(lead.notes || hasMetadataContent(lead.metadata)) && (
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
                            <Tooltip title="Promote to Opportunity">
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
                Showing {Math.min((currentPage - 1) * itemsPerPage + 1, displayedItemsCount)} to {Math.min(currentPage * itemsPerPage, displayedItemsCount)} of {displayedItemsCount} leads
                {searchQuery.trim() && ` (filtered from ${totalItems})`}
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

        {/* Archived Leads Button - Bottom of Leads tab */}
        <Box sx={{
          display: 'flex',
          justifyContent: 'center',
          mt: 4,
          mb: 2
        }}>
          <Button
            variant="outlined"
            color="primary"
            onClick={handleToggleShowArchived}
            startIcon={<Icons.Archive />}
            sx={{ borderRadius: 2 }}
          >
            {showArchived ? 'Hide Archived' : 'Archived Leads'}
          </Button>
        </Box>
      </TabPanel>

      {/* Opportunities Tab */}
      <TabPanel value={currentTab} index={1}>
        <OpportunitiesTable
          properties={properties}
          linkedLeads={linkedLeads}
          conversations={conversations}
          onMessageProperty={handleMessageProperty}
          onEditProperty={handleEditOpportunity}
          onArchiveProperty={handleArchiveOpportunity}
          onUpdateRentcast={handleUpdateRentcastData}
          onSendToCalculator={handleSendToCalculator}
        />
      </TabPanel>

      {/* Add/Edit Lead Dialog */}
      <PropertyLeadDialog
        open={openDialog}
        isEditing={isEditing}
        initialFormData={dialogInitialFormData}
        onSave={handleDialogSave}
        onClose={handleCloseDialog}
        handleCurrencyInput={handleCurrencyInput}
        formatInputCurrency={formatInputCurrency}
      />

      {/* Edit Property Dialog (for Opportunities) */}
      <PropertyDialog
        open={propertyDialogOpen}
        onClose={handleClosePropertyDialog}
        onSave={handleSaveProperty}
        property={editingProperty}
        isEditing={!!editingProperty}
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
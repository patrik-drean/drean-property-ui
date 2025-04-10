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
  Link,
  styled,
  Checkbox,
  Switch,
  FormControlLabel,
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

const PropertyLeadsPage: React.FC = () => {
  const [propertyLeads, setPropertyLeads] = useState<PropertyLead[]>([]);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [formData, setFormData] = useState<Omit<PropertyLead, 'id' | 'createdAt' | 'updatedAt' | 'archived' | 'tags' | 'convertedToProperty' | 'squareFootage'>>({
    address: '',
    zillowLink: '',
    listingPrice: 0,
    sellerPhone: '',
    sellerEmail: '',
    lastContactDate: null,
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);

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
    if (!dateString) return 'Not contacted';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'listingPrice') {
      // Handle numeric input
      const numericValue = value === '' ? 0 : parseFloat(value);
      setFormData({ ...formData, [name]: numericValue });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleCurrencyInput = (value: string) => {
    // Remove dollar signs, commas and convert to number
    const numericValue = parseFloat(value.replace(/[$,]/g, '')) || 0;
    return numericValue;
  };

  const formatInputCurrency = (value: number) => {
    return value ? value.toString() : '';
  };

  const fetchPropertyLeads = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPropertyLeadsWithArchivedStatus(showArchived);
      setPropertyLeads(data);
    } catch (err) {
      console.error('Error fetching property leads:', err);
      setError('Failed to load property leads. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPropertyLeads();
  }, [showArchived]);

  // Add sorting function for property leads - modified to handle archived status
  const sortPropertyLeads = (leads: PropertyLead[]) => {
    return [...leads].sort((a, b) => {
      // First sort by archived status
      if (a.archived !== b.archived) {
        return a.archived ? 1 : -1; // Non-archived leads first
      }
      
      // Then sort by last contact date
      if (!a.lastContactDate && !b.lastContactDate) return 0;
      if (!a.lastContactDate) return -1;
      if (!b.lastContactDate) return 1;
      return new Date(b.lastContactDate).getTime() - new Date(a.lastContactDate).getTime();
    });
  };

  const handleAddLead = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormData({
      address: '',
      zillowLink: '',
      listingPrice: 0,
      sellerPhone: '',
      sellerEmail: '',
      lastContactDate: null,
    });
    setOpenDialog(true);
  };

  const handleEditLead = (lead: PropertyLead) => {
    setIsEditing(true);
    setEditingId(lead.id);
    setFormData({
      address: lead.address,
      zillowLink: lead.zillowLink,
      listingPrice: lead.listingPrice,
      sellerPhone: lead.sellerPhone,
      sellerEmail: lead.sellerEmail,
      lastContactDate: lead.lastContactDate,
    });
    setOpenDialog(true);
  };

  const handleSaveLead = async () => {
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
    try {
      await updatePropertyLead(lead.id, {
        ...lead,
        lastContactDate: new Date().toISOString(),
      });
      setSnackbar({
        open: true,
        message: 'Contact date updated successfully',
        severity: 'success',
      });
      fetchPropertyLeads();
    } catch (err) {
      console.error('Error updating contact date:', err);
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

  // Extract domain from URL for display
  const extractDomain = (url: string) => {
    try {
      const domain = new URL(url).hostname.replace('www.', '');
      return domain;
    } catch {
      return url;
    }
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
      setCopiedToClipboard(true);
      setSnackbar({
        open: true,
        message: successMessage,
        severity: 'success',
      });
      
      setTimeout(() => {
        setCopiedToClipboard(false);
      }, 2000);
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

  const copyTemplatedMessage = async (lead: PropertyLead) => {
    const discountedPrice = Math.round(lead.listingPrice * 0.75);
    const formattedPrice = formatCurrencyInK(discountedPrice);
    
    const message = `Hi there! My name is Patrik. I really like this property and believe it has great potential. I'd like to explore an offer of ${formattedPrice}. I'm an experienced investor who is reliable and quick when it comes to closing. If this number is in the ballpark, I'd love to discuss further. Let me know what you and the seller think! Have a great day! 
${lead.zillowLink || ''}`;

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
      }, 500); // Wait half a second before copying phone number
    } catch (err) {
      console.error('Failed to copy: ', err);
      setSnackbar({
        open: true,
        message: 'Failed to copy to clipboard',
        severity: 'error',
      });
    }
  };

  const handleConvertToProperty = async (lead: PropertyLead) => {
    try {
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
        hasRentcastData: false,
        notes: '',
        score: 0,
        zillowLink: lead.zillowLink
      });

      // Then mark the lead as converted
      await updatePropertyLead(lead.id, {
        ...lead,
        convertedToProperty: true
      });

      setSnackbar({
        open: true,
        message: 'Successfully converted lead to property',
        severity: 'success',
      });
      fetchPropertyLeads();
    } catch (err) {
      console.error('Error converting lead to property:', err);
      setSnackbar({
        open: true,
        message: 'Failed to convert lead to property',
        severity: 'error',
      });
    }
  };

  const handleArchiveLead = async (id: string) => {
    try {
      await archivePropertyLead(id);
      setSnackbar({
        open: true,
        message: 'Property lead archived successfully',
        severity: 'success',
      });
      fetchPropertyLeads();
    } catch (err) {
      console.error('Error archiving property lead:', err);
      setSnackbar({
        open: true,
        message: 'Failed to archive property lead',
        severity: 'error',
      });
    }
  };

  const handleUnarchiveLead = async (id: string) => {
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
      fetchPropertyLeads();
    } catch (err) {
      console.error('Error unarchiving property lead:', err);
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
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">Property Leads</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <FormControlLabel
            control={
              <Switch
                checked={showArchived}
                onChange={handleToggleShowArchived}
                color="primary"
              />
            }
            label="Show Archived"
            sx={{ mr: 2 }}
          />
          {selectedLeads.length > 0 && (
            <Button
              variant="contained"
              color="error"
              startIcon={<Icons.Delete />}
              onClick={handleBulkDelete}
              sx={{ mr: 2 }}
            >
              Delete Selected ({selectedLeads.length})
            </Button>
          )}
          <Button
            variant="contained"
            color="primary"
            startIcon={<Icons.Add />}
            onClick={handleAddLead}
          >
            Add Lead
          </Button>
        </Box>
      </Box>

      <Paper elevation={2}>
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
                <StyledTableCell className="header">Address</StyledTableCell>
                <StyledTableCell className="header">Listing Price</StyledTableCell>
                <StyledTableCell className="header">Seller Contact</StyledTableCell>
                <StyledTableCell className="header">Last Contact</StyledTableCell>
                <StyledTableCell className="header">Actions</StyledTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {propertyLeads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography variant="body1" sx={{ py: 2 }}>
                      No property leads found. Add your first lead.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                sortPropertyLeads(propertyLeads).map((lead) => (
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
                      ...(lead.convertedToProperty ? {
                        borderLeft: '4px solid #4caf50',
                        '& td:first-of-type': {
                          position: 'relative',
                          '&::after': {
                            content: '""',
                            position: 'absolute',
                            top: '50%',
                            right: '8px',
                            transform: 'translateY(-50%)',
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: '#4caf50',
                          }
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
                      {lead.zillowLink ? (
                        <Link 
                          href={lead.zillowLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          sx={{ 
                            color: 'primary.main',
                            textDecoration: 'none',
                            '&:hover': {
                              textDecoration: 'underline'
                            }
                          }}
                        >
                          {lead.address}
                        </Link>
                      ) : (
                        lead.address
                      )}
                    </TableCell>
                    <TableCell>{formatCurrency(lead.listingPrice)}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {lead.sellerPhone ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Tooltip title="Copy templated message">
                              <ActionIconButton 
                                size="small"
                                onClick={() => copyTemplatedMessage(lead)}
                              >
                                <Icons.Message fontSize="small" />
                              </ActionIconButton>
                            </Tooltip>
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
                          </Box>
                        ) : (
                          'No phone'
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
                      <Box sx={{ display: 'flex' }}>
                        {lead.archived ? (
                          <Tooltip title="Unarchive Lead">
                            <ActionIconButton 
                              size="small" 
                              sx={{ mr: 1 }}
                              onClick={() => handleUnarchiveLead(lead.id)}
                            >
                              <Icons.Unarchive fontSize="small" />
                            </ActionIconButton>
                          </Tooltip>
                        ) : (
                          <>
                            {!lead.convertedToProperty && (
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
                            {lead.convertedToProperty && (
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
                          </>
                        )}
                        <Tooltip title="Edit Lead">
                          <ActionIconButton 
                            size="small" 
                            sx={{ mr: 1 }}
                            onClick={() => handleEditLead(lead)}
                          >
                            <Icons.Edit fontSize="small" />
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
                      </Box>
                    </TableCell>
                  </StyledTableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Add/Edit Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {isEditing ? 'Edit Property Lead' : 'Add Property Lead'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <TextField
              label="Address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              fullWidth
              margin="normal"
              required
            />
            <TextField
              label="Zillow Link (optional)"
              name="zillowLink"
              value={formData.zillowLink}
              onChange={handleInputChange}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Listing Price"
              name="listingPrice"
              value={formatInputCurrency(formData.listingPrice)}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  listingPrice: handleCurrencyInput(e.target.value),
                });
              }}
              fullWidth
              margin="normal"
              required
              InputProps={{
                startAdornment: <Box component="span" sx={{ mr: 1 }}>$</Box>,
              }}
            />
            <TextField
              label="Seller Phone"
              name="sellerPhone"
              value={formData.sellerPhone}
              onChange={handleInputChange}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Seller Email"
              name="sellerEmail"
              value={formData.sellerEmail}
              onChange={handleInputChange}
              fullWidth
              margin="normal"
              type="email"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSaveLead} variant="contained" color="primary">
            Save
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
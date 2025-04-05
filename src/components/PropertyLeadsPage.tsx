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
} from '@mui/material';
import * as Icons from '@mui/icons-material';
import { PropertyLead, CreatePropertyLead } from '../types/property';
import { getPropertyLeads, addPropertyLead, updatePropertyLead, deletePropertyLead } from '../services/api';

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<PropertyLead, 'id' | 'createdAt' | 'updatedAt'>>({
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
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
      const data = await getPropertyLeads();
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
  }, []);

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
        <Button
          variant="contained"
          color="primary"
          startIcon={<Icons.Add />}
          onClick={handleAddLead}
        >
          Add Lead
        </Button>
      </Box>

      <Paper elevation={2}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <StyledTableCell className="header">Address</StyledTableCell>
                <StyledTableCell className="header">Listing Price</StyledTableCell>
                <StyledTableCell className="header">Listing</StyledTableCell>
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
                propertyLeads.map((lead) => (
                  <StyledTableRow key={lead.id}>
                    <TableCell>{lead.address}</TableCell>
                    <TableCell>{formatCurrency(lead.listingPrice)}</TableCell>
                    <TableCell>
                      {lead.zillowLink ? (
                        <Link href={lead.zillowLink} target="_blank" rel="noopener noreferrer">
                          {extractDomain(lead.zillowLink)}
                        </Link>
                      ) : (
                        'N/A'
                      )}
                    </TableCell>
                    <TableCell>
                      {lead.sellerPhone && (
                        <Tooltip title="Call Seller">
                          <Link href={`tel:${lead.sellerPhone}`} sx={{ mr: 1 }}>
                            <ActionIconButton size="small">
                              <Icons.Phone fontSize="small" />
                            </ActionIconButton>
                          </Link>
                        </Tooltip>
                      )}
                      {lead.sellerEmail && (
                        <Tooltip title="Email Seller">
                          <Link href={`mailto:${lead.sellerEmail}`}>
                            <ActionIconButton size="small">
                              <Icons.Email fontSize="small" />
                            </ActionIconButton>
                          </Link>
                        </Tooltip>
                      )}
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
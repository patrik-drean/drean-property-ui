import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
  Card,
  CardContent,
  Grid,
  Link as MuiLink,
} from '@mui/material';
import * as Icons from '@mui/icons-material';
import { Contact, CreateContact, Property } from '../types/property';
import { getContacts, createContact, updateContact, deleteContact, getProperties } from '../services/api';

const TeamPage: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });
  
  // Form state
  const [formData, setFormData] = useState<CreateContact>({
    name: '',
    email: '',
    phone: '',
    company: '',
    secondaryPhone: '',
    type: '',
    location: '',
    notes: '',
    tags: [],
  });

  const typeOptions = ['Agent', 'Property Manager', 'Lender', 'Contractor', 'Insurance', 'Partner', 'Legal', 'Other'];
  const locationOptions = ['San Antonio, TX', 'Cleveland, OH', 'Other'];

  useEffect(() => {
    fetchContacts();
    fetchProperties();
  }, []);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const data = await getContacts();
      setContacts(data);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      setSnackbar({ open: true, message: 'Error fetching contacts', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchProperties = async () => {
    try {
      const data = await getProperties();
      setProperties(data);
    } catch (error) {
      console.error('Error fetching properties:', error);
    }
  };

  const handleOpenDialog = (contact?: Contact) => {
    if (contact) {
      setEditingContact(contact);
      setFormData({
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        company: contact.company,
        secondaryPhone: contact.secondaryPhone,
        type: contact.type,
        location: contact.location,
        notes: contact.notes,
        tags: contact.tags,
      });
    } else {
      setEditingContact(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        secondaryPhone: '',
        type: '',
        location: '',
        notes: '',
        tags: [],
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingContact(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      company: '',
      secondaryPhone: '',
      type: '',
      location: '',
      notes: '',
      tags: [],
    });
  };

  const handleSaveContact = async () => {
    try {
      if (editingContact) {
        await updateContact(editingContact.id, { ...formData, id: editingContact.id });
        setSnackbar({ open: true, message: 'Contact updated successfully', severity: 'success' });
      } else {
        await createContact(formData);
        setSnackbar({ open: true, message: 'Contact created successfully', severity: 'success' });
      }
      handleCloseDialog();
      fetchContacts();
    } catch (error) {
      console.error('Error saving contact:', error);
      setSnackbar({ open: true, message: 'Error saving contact', severity: 'error' });
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    if (window.confirm('Are you sure you want to delete this contact?')) {
      try {
        await deleteContact(contactId);
        setSnackbar({ open: true, message: 'Contact deleted successfully', severity: 'success' });
        fetchContacts();
      } catch (error) {
        console.error('Error deleting contact:', error);
        setSnackbar({ open: true, message: 'Error deleting contact', severity: 'error' });
      }
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setSnackbar({ open: true, message: `${type} copied to clipboard`, severity: 'success' });
  };

  const getTypeColor = (type: string): string => {
    switch (type) {
      case 'Agent': return '#1976d2';
      case 'Property Manager': return '#009688';
      case 'Lender': return '#388e3c';
      case 'Contractor': return '#f57c00';
      case 'Insurance': return '#d32f2f';
      case 'Partner': return '#7b1fa2';
      case 'Legal': return '#303f9f';
      case 'Other': return '#757575';
      default: return '#757575';
    }
  };

  const getLocationColor = (location: string): string => {
    switch (location) {
      case 'San Antonio, TX': return '#1976d2';
      case 'Cleveland, OH': return '#388e3c';
      case 'Other': return '#757575';
      default: return '#757575';
    }
  };

  const getPropertyById = (propertyId: string): Property | undefined => {
    return properties.find(property => property.id === propertyId);
  };

  // Group contacts by location, then sort by type and name
  const groupedContacts = contacts.reduce((acc, contact) => {
    if (!acc[contact.location]) {
      acc[contact.location] = [];
    }
    acc[contact.location].push(contact);
    return acc;
  }, {} as Record<string, Contact[]>);

  // Sort contacts within each location by type and name
  Object.keys(groupedContacts).forEach(location => {
    groupedContacts[location].sort((a, b) => {
      if (a.type !== b.type) {
        return a.type.localeCompare(b.type);
      }
      return a.name.localeCompare(b.name);
    });
  });

  // Sort locations
  const sortedLocations = Object.keys(groupedContacts).sort();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Loading contacts...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">Team</Typography>
        <Button
          variant="contained"
          startIcon={<Icons.Add />}
          onClick={() => handleOpenDialog()}
          sx={{ borderRadius: 2 }}
        >
          Add Contact
        </Button>
      </Box>

      {sortedLocations.map(location => (
        <Paper key={location} sx={{ p: 3, mb: 3 }}>
          <Box display="flex" alignItems="center" mb={2}>
            <Chip
              label={location}
              sx={{
                backgroundColor: getLocationColor(location),
                color: 'white',
                fontWeight: 500,
                mr: 2,
              }}
            />
            <Typography variant="h6">{groupedContacts[location].length} contacts</Typography>
          </Box>
          
          <Grid container spacing={2}>
            {groupedContacts[location].map(contact => (
              <Grid item xs={12} sm={6} md={4} key={contact.id}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                      <Typography variant="h6" fontWeight="500" sx={{ wordBreak: 'break-word' }}>
                        {contact.name}
                      </Typography>
                      <Box>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(contact)}
                          sx={{ mr: 0.5 }}
                        >
                          <Icons.Edit fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteContact(contact.id)}
                          color="error"
                        >
                          <Icons.Delete fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                    
                    <Chip
                      label={contact.type}
                      size="small"
                      sx={{
                        backgroundColor: getTypeColor(contact.type),
                        color: 'white',
                        mb: 1,
                        fontSize: '0.75rem',
                      }}
                    />
                    
                                         <Box mb={1}>
                       {contact.company && (
                         <Box display="flex" alignItems="center" mb={0.5}>
                           <Icons.Business fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                           <Typography variant="body2" sx={{ flex: 1 }}>
                             {contact.company}
                           </Typography>
                         </Box>
                       )}
                       
                       <Box display="flex" alignItems="center" mb={0.5}>
                         <Icons.Email fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                         <Typography variant="body2" sx={{ flex: 1, wordBreak: 'break-all' }}>
                           {contact.email}
                         </Typography>
                         <IconButton
                           size="small"
                           onClick={() => copyToClipboard(contact.email, 'Email')}
                         >
                           <Icons.ContentCopy fontSize="small" />
                         </IconButton>
                       </Box>
                       
                       <Box display="flex" alignItems="center" mb={0.5}>
                         <Icons.Phone fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                         <Typography variant="body2" sx={{ flex: 1 }}>
                           {contact.phone}
                         </Typography>
                         <IconButton
                           size="small"
                           onClick={() => copyToClipboard(contact.phone, 'Phone')}
                         >
                           <Icons.ContentCopy fontSize="small" />
                         </IconButton>
                       </Box>
                       
                       {contact.secondaryPhone && (
                         <Box display="flex" alignItems="center" mb={0.5}>
                           <Icons.Phone fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                           <Typography variant="body2" sx={{ flex: 1 }}>
                             {contact.secondaryPhone}
                           </Typography>
                           <IconButton
                             size="small"
                             onClick={() => copyToClipboard(contact.secondaryPhone, 'Secondary Phone')}
                           >
                             <Icons.ContentCopy fontSize="small" />
                           </IconButton>
                         </Box>
                       )}
                     </Box>
                    
                    {contact.notes && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {contact.notes}
                      </Typography>
                    )}
                    
                    {contact.tags.length > 0 && (
                      <Box display="flex" flexWrap="wrap" gap={0.5} mb={1}>
                        {contact.tags.map(tag => (
                          <Chip
                            key={tag}
                            label={tag}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.7rem' }}
                          />
                        ))}
                      </Box>
                    )}
                    
                                         {contact.relatedPropertyIds.length > 0 && (
                       <Box>
                         <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                           Properties ({contact.relatedPropertyIds.length}):
                         </Typography>
                         <Box display="flex" flexDirection="column" gap={0.5}>
                           {contact.relatedPropertyIds.map(propertyId => {
                             const property = getPropertyById(propertyId);
                             return property ? (
                               <MuiLink
                                 key={propertyId}
                                 href={`#/properties/${encodeURIComponent(property.address)}`}
                                 sx={{
                                   fontSize: '0.7rem',
                                   color: 'primary.main',
                                   textDecoration: 'none',
                                   '&:hover': {
                                     textDecoration: 'underline',
                                   },
                                   display: 'flex',
                                   alignItems: 'center',
                                   gap: 0.5,
                                 }}
                               >
                                 <Icons.Home fontSize="small" />
                                 {property.address}
                               </MuiLink>
                             ) : (
                               <Typography key={propertyId} variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                 Property ID: {propertyId}
                               </Typography>
                             );
                           })}
                         </Box>
                       </Box>
                     )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
      ))}

      {contacts.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" mb={2}>
            No contacts found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Add your first contact to get started
          </Typography>
        </Paper>
      )}

      {/* Contact Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingContact ? 'Edit Contact' : 'Add Contact'}
        </DialogTitle>
        <DialogContent>
          <TextField
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            fullWidth
            margin="normal"
            required
          />
          
          <TextField
            label="Email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            fullWidth
            margin="normal"
            type="email"
          />
          
          <TextField
            label="Phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            fullWidth
            margin="normal"
          />
          
          <TextField
            label="Company"
            value={formData.company}
            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            fullWidth
            margin="normal"
          />
          
          <TextField
            label="Secondary Phone"
            value={formData.secondaryPhone}
            onChange={(e) => setFormData({ ...formData, secondaryPhone: e.target.value })}
            fullWidth
            margin="normal"
          />
          
          <FormControl fullWidth margin="normal" required>
            <InputLabel>Type</InputLabel>
            <Select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              label="Type"
            >
              {typeOptions.map(option => (
                <MenuItem key={option} value={option}>{option}</MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl fullWidth margin="normal" required>
            <InputLabel>Location</InputLabel>
            <Select
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              label="Location"
            >
              {locationOptions.map(option => (
                <MenuItem key={option} value={option}>{option}</MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <TextField
            label="Notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            fullWidth
            margin="normal"
            multiline
            rows={3}
          />
          
          <TextField
            label="Tags (comma-separated)"
            value={formData.tags.join(', ')}
            onChange={(e) => setFormData({ 
              ...formData, 
              tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
            })}
            fullWidth
            margin="normal"
            helperText="Enter tags separated by commas"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSaveContact} 
            variant="contained"
            disabled={!formData.name || !formData.type || !formData.location}
          >
            {editingContact ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={4000} 
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity} 
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TeamPage; 
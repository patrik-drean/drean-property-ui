import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  Chip,
  Typography,
  Box,
  Divider,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import { Contact } from '../types/property';
import { getContacts, addContactToProperty, removeContactFromProperty } from '../services/api';

interface ContactDialogProps {
  open: boolean;
  onClose: () => void;
  propertyId: string;
  propertyContacts: Contact[];
  onContactsUpdate: () => void;
}

const ContactDialog: React.FC<ContactDialogProps> = ({
  open,
  onClose,
  propertyId,
  propertyContacts,
  onContactsUpdate,
}) => {
  const [allContacts, setAllContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());

  const typeOptions = ['Agent', 'Property Manager', 'Lender', 'Contractor', 'Insurance', 'Partner', 'Legal', 'Other'];

  useEffect(() => {
    if (open) {
      fetchContacts();
      // Initialize selected contacts with current property contacts
      setSelectedContacts(new Set(propertyContacts.map(contact => contact.id)));
    }
  }, [open, propertyContacts]);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const contacts = await getContacts();
      setAllContacts(contacts);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContactToggle = (contactId: string) => {
    const newSelected = new Set(selectedContacts);
    if (newSelected.has(contactId)) {
      newSelected.delete(contactId);
    } else {
      newSelected.add(contactId);
    }
    setSelectedContacts(newSelected);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      // Find contacts to add (selected but not in property contacts)
      const contactsToAdd = allContacts.filter(contact => 
        selectedContacts.has(contact.id) && 
        !propertyContacts.some(pc => pc.id === contact.id)
      );
      
      // Find contacts to remove (in property contacts but not selected)
      const contactsToRemove = propertyContacts.filter(contact => 
        !selectedContacts.has(contact.id)
      );
      
      // Add new contacts
      for (const contact of contactsToAdd) {
        await addContactToProperty(contact.id, propertyId);
      }
      
      // Remove contacts
      for (const contact of contactsToRemove) {
        await removeContactFromProperty(contact.id, propertyId);
      }
      
      onContactsUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating property contacts:', error);
    } finally {
      setLoading(false);
    }
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

  // Group contacts by type
  const groupedContacts = allContacts.reduce((acc, contact) => {
    if (!acc[contact.type]) {
      acc[contact.type] = [];
    }
    acc[contact.type].push(contact);
    return acc;
  }, {} as Record<string, Contact[]>);

  // Sort contacts within each type by name
  Object.keys(groupedContacts).forEach(type => {
    groupedContacts[type].sort((a, b) => a.name.localeCompare(b.name));
  });

  // Sort types according to the predefined order
  const sortedTypes = typeOptions.filter(type => groupedContacts[type]?.length > 0);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        Link Contacts to Property
      </DialogTitle>
      <DialogContent>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <Typography>Loading contacts...</Typography>
          </Box>
        ) : (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Select contacts to link to this property. Contacts already linked are checked.
            </Typography>
            
            {sortedTypes.map(type => (
              <Box key={type} sx={{ mb: 3 }}>
                <Box display="flex" alignItems="center" mb={1}>
                  <Chip
                    label={type}
                    size="small"
                    sx={{
                      backgroundColor: getTypeColor(type),
                      color: 'white',
                      mr: 1,
                      fontSize: '0.75rem',
                    }}
                  />
                  <Typography variant="subtitle2">
                    {groupedContacts[type].length} contact{groupedContacts[type].length !== 1 ? 's' : ''}
                  </Typography>
                </Box>
                
                <List dense>
                  {groupedContacts[type].map(contact => {
                    const isLinked = propertyContacts.some(pc => pc.id === contact.id);
                    const isSelected = selectedContacts.has(contact.id);
                    
                    return (
                      <ListItem
                        key={contact.id}
                        sx={{
                          border: isLinked ? '1px solid #e0e0e0' : 'none',
                          borderRadius: 1,
                          mb: 0.5,
                          backgroundColor: isLinked ? '#f5f5f5' : 'transparent',
                        }}
                      >
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={isSelected}
                              onChange={() => handleContactToggle(contact.id)}
                              size="small"
                            />
                          }
                          label=""
                          sx={{ mr: 0 }}
                        />
                        
                        <ListItemText
                          primary={
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography variant="body2" fontWeight={isLinked ? 500 : 400}>
                                {contact.name}
                              </Typography>
                              {isLinked && (
                                <Chip
                                  label="Linked"
                                  size="small"
                                  variant="outlined"
                                  sx={{ fontSize: '0.6rem', height: '16px' }}
                                />
                              )}
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="caption" display="block">
                                {contact.email}
                              </Typography>
                              <Typography variant="caption" display="block">
                                {contact.phone}
                              </Typography>
                              {contact.location && (
                                <Typography variant="caption" display="block">
                                  {contact.location}
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                      </ListItem>
                    );
                  })}
                </List>
                
                {sortedTypes.indexOf(type) < sortedTypes.length - 1 && (
                  <Divider sx={{ mt: 2 }} />
                )}
              </Box>
            ))}
            
            {allContacts.length === 0 && (
              <Box textAlign="center" py={4}>
                <Typography variant="body2" color="text.secondary">
                  No contacts found. Add contacts in the Team page first.
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleSave} 
          variant="contained"
          disabled={loading}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ContactDialog; 
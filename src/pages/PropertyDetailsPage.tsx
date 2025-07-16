import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Paper, Button, Chip, Card, CardContent, TextField, Dialog, DialogTitle, DialogContent, DialogActions, List, ListItem, ListItemText, IconButton, Tooltip, Link as MuiLink, Divider, Snackbar, Alert, Avatar, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import * as Icons from '@mui/icons-material';
import { Property, Note, Link as PropertyLink, CreateNote, CreateLink } from '../types/property';
import { getProperty } from '../services/api';
import { getNotesByPropertyId, createNote, getLinksByPropertyId, createLink, deleteNote, deleteLink } from '../services/api';
import PropertyDialog from '../components/PropertyDialog';
import TasksSection from '../components/TasksSection';

const PropertyDetailsPage: React.FC = () => {
  const { address } = useParams<{ address: string }>();
  const navigate = useNavigate();
  const [property, setProperty] = useState<Property | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [links, setLinks] = useState<PropertyLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [newNoteCreatedBy, setNewNoteCreatedBy] = useState('Patrik');
  const [newLink, setNewLink] = useState({ url: '', title: '', moreDetails: '' });
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });
  const [propertyDialogOpen, setPropertyDialogOpen] = useState(false);

  const createdByOptions = ['Patrik', 'Dillon', 'Other'];

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getAvatarColor = (name: string) => {
    const colors = ['#1976d2', '#388e3c', '#f57c00', '#d32f2f', '#7b1fa2'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  // Status color helper function from PropertiesPage
  const getStatusColor = (status: string): string => {
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

  // Color helper functions from PropertiesPage
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
    if (equity >= 65000) return '#4CAF50'; // Green for >= $65k
    if (equity >= 45000) return '#FFC107'; // Yellow for >= $45k
    return '#F44336'; // Red for < $45k
  };
  
  const getCashflowColor = (cashflow: number) => {
    if (cashflow >= 200) return '#4CAF50'; // Green for >= $200
    if (cashflow >= 0) return '#FFC107'; // Yellow for positive but < $200
    return '#F44336'; // Red for negative
  };

  const getScoreBackgroundColor = (score: number): string => {
    if (score >= 9) return '#4CAF50'; // Green for 9-10
    if (score >= 7) return '#FFC107'; // Amber for 7-8
    if (score >= 5) return '#FF9800'; // Orange for 5-6
    return '#F44336'; // Red for < 5
  };

  const getScoreColor = (score: number): string => {
    if (score >= 9) return '#E8F5E9'; // Light green text for green background
    if (score >= 7) return '#212121'; // Dark text for amber background
    if (score >= 5) return '#212121'; // Dark text for orange background
    return '#FFEBEE'; // Light red text for red background
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

  const calculateHomeEquity = (offerPrice: number, rehabCosts: number, arv: number) => {
    const newLoan = calculateNewLoan(offerPrice, rehabCosts, arv);
    return arv - newLoan;
  };

  // Separate functions for refinancing calculations (original simple method)
  const calculateRefinancingNewLoan = (offerPrice: number, rehabCosts: number, arv: number) => {
    return arv * 0.75;
  };

  const calculateRefinancingHomeEquity = (offerPrice: number, rehabCosts: number, arv: number) => {
    return arv - calculateRefinancingNewLoan(offerPrice, rehabCosts, arv);
  };

  const calculateRefinancingCashflow = (rent: number, offerPrice: number, arv: number) => {
    const newLoanAmount = calculateRefinancingNewLoan(offerPrice, 0, arv); // Using 0 for rehab costs in refinancing
    const monthlyMortgage = calculateMonthlyMortgage(newLoanAmount);
    const propertyManagement = rent * 0.12;
    const propertyTaxes = (offerPrice * 0.025) / 12;
    const otherExpenses = 130;
    return rent - propertyManagement - propertyTaxes - otherExpenses - monthlyMortgage;
  };

  const calculateMonthlyMortgage = (loanAmount: number, interestRate = 0.07, loanTermYears = 30) => {
    const monthlyRate = interestRate / 12;
    const numberOfPayments = loanTermYears * 12;
    return loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
  };

  const calculateCashflow = (rent: number, offerPrice: number, newLoanAmount: number) => {
    const monthlyMortgage = calculateMonthlyMortgage(newLoanAmount);
    const propertyManagement = rent * 0.12;
    const propertyTaxes = (offerPrice * 0.025) / 12;
    const otherExpenses = 130;
    return rent - propertyManagement - propertyTaxes - otherExpenses - monthlyMortgage;
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

  useEffect(() => {
    if (!address) return;
    setLoading(true);
    const decodedAddress = decodeURIComponent(address);
    getProperty(decodedAddress)
      .then((property) => {
        setProperty(property);
        // Fetch notes and links using property.id, handle 404 as empty
        Promise.all([
          getNotesByPropertyId(property.id).catch(err => {
            if (err.response && err.response.status === 404) return [];
            throw err;
          }),
          getLinksByPropertyId(property.id).catch(err => {
            if (err.response && err.response.status === 404) return [];
            throw err;
          })
        ]).then(([notes, links]) => {
          setNotes(notes.sort((a: Note, b: Note) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
          setLinks(links);
        });
      })
      .catch(() => {
        setSnackbar({ open: true, message: 'Failed to load property details', severity: 'error' });
      })
      .finally(() => setLoading(false));
  }, [address]);

  const handleAddNote = async () => {
    if (!property || !newNote.trim()) return;
    const note: CreateNote = {
      content: newNote,
      createdBy: newNoteCreatedBy,
      propertyId: property.id
    };
    try {
      const saved = await createNote(note);
      setNotes([saved, ...notes]);
      setNewNote('');
      setNewNoteCreatedBy('Patrik');
      setNoteDialogOpen(false);
      setSnackbar({ open: true, message: 'Note added', severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: 'Failed to add note', severity: 'error' });
    }
  };

  const handleAddLink = async () => {
    if (!property || !newLink.url.trim() || !newLink.title.trim()) return;
    const link: CreateLink = {
      ...newLink,
      propertyId: property.id
    };
    try {
      const saved = await createLink(link);
      setLinks([saved, ...links]);
      setNewLink({ url: '', title: '', moreDetails: '' });
      setLinkDialogOpen(false);
      setSnackbar({ open: true, message: 'Link added', severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: 'Failed to add link', severity: 'error' });
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteNote(noteId);
      setNotes(notes.filter(note => note.id !== noteId));
      setSnackbar({ open: true, message: 'Note deleted', severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: 'Failed to delete note', severity: 'error' });
    }
  };

  const handleDeleteLink = async (linkId: string) => {
    try {
      await deleteLink(linkId);
      setLinks(links.filter(link => link.id !== linkId));
      setSnackbar({ open: true, message: 'Link deleted', severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: 'Failed to delete link', severity: 'error' });
    }
  };

  const handleSaveProperty = async (propertyData: Omit<Property, 'id'>) => {
    if (!property) return;
    
    try {
      const { updateProperty } = await import('../services/api');
      const updatedProperty = await updateProperty(property.id, propertyData);
      setProperty(updatedProperty);
      setSnackbar({ open: true, message: 'Property updated successfully', severity: 'success' });
    } catch (error) {
      console.error('Error updating property:', error);
      setSnackbar({ open: true, message: 'Failed to update property', severity: 'error' });
      throw error;
    }
  };

  const handlePropertyUpdate = (updatedProperty: Property) => {
    setProperty(updatedProperty);
  };

  const handleSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  if (loading) return <Box p={4}><Typography>Loading...</Typography></Box>;
  if (!property) return <Box p={4}><Typography>Property not found.</Typography></Box>;

  return (
    <Box p={2}>
      <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} mb={2} gap={2}>
        <Box display="flex" alignItems="center" gap={2}>
          <IconButton
            onClick={() => navigate('/properties')}
            sx={{ mr: 1 }}
          >
            <Icons.ArrowBack />
          </IconButton>
          <Typography variant="h5">Property Details</Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<Icons.Edit />}
          onClick={() => setPropertyDialogOpen(true)}
          sx={{ borderRadius: 2, alignSelf: { xs: 'stretch', sm: 'flex-end' } }}
        >
          Edit Property
        </Button>
      </Box>
      <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
        <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'stretch', sm: 'center' }} gap={2} mb={2}>
          <MuiLink href={property.zillowLink} target="_blank" rel="noopener noreferrer" variant="h6" sx={{ fontWeight: 600, color: 'primary.main', textDecoration: 'none', wordBreak: 'break-word' }}>{property.address}</MuiLink>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip 
              label={property.status} 
              size="small" 
              sx={{ 
                backgroundColor: getStatusColor(property.status),
                color: 'white',
                fontWeight: 500,
                borderRadius: '16px',
                minWidth: '90px',
                height: '24px',
                '& .MuiChip-label': {
                  padding: '0 10px',
                }
              }}
            />
            <Box sx={{ 
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: getScoreBackgroundColor(property.score),
              color: getScoreColor(property.score),
              p: '2px 6px',
              borderRadius: 2,
              fontWeight: 'bold',
              minWidth: '60px',
              height: '24px'
            }}>
              {property.score}/10
            </Box>
          </Box>
        </Box>
        <Box display="grid" gridTemplateColumns={{ xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(4, 1fr)', lg: 'repeat(5, 1fr)' }} gap={{ xs: 2, sm: 4 }} mb={2}>
          <Box><Typography variant="caption">Offer Price</Typography><Typography variant="h6">${property.offerPrice.toLocaleString()}</Typography></Box>
          <Box><Typography variant="caption">Rehab Cost</Typography><Typography variant="h6">${property.rehabCosts.toLocaleString()}</Typography></Box>
          <Box><Typography variant="caption">Monthly Rent</Typography><Typography variant="h6">${property.potentialRent.toLocaleString()}</Typography></Box>
          <Box><Typography variant="caption">ARV</Typography><Typography variant="h6">${property.arv.toLocaleString()}</Typography></Box>
          <Box><Typography variant="caption">Sq Ft</Typography><Typography variant="h6">{property.squareFootage ? property.squareFootage.toLocaleString() : 'N/A'}</Typography></Box>
          <Box><Typography variant="caption">Units</Typography><Typography variant="h6">{property.units ? property.units : 'N/A'}</Typography></Box>
          <Box><Typography variant="caption">Rent Ratio</Typography><Typography variant="h6" sx={{ color: getRentRatioColor(calculateRentRatio(property.potentialRent, property.offerPrice, property.rehabCosts)) }}>{formatPercentage(calculateRentRatio(property.potentialRent, property.offerPrice, property.rehabCosts))}</Typography></Box>
          <Box><Typography variant="caption">ARV Ratio</Typography><Typography variant="h6" sx={{ color: getARVRatioColor(calculateARVRatio(property.offerPrice, property.rehabCosts, property.arv)) }}>{formatPercentage(calculateARVRatio(property.offerPrice, property.rehabCosts, property.arv))}</Typography></Box>
          <Box><Typography variant="caption">Home Equity</Typography><Typography variant="h6" sx={{ color: getHomeEquityColor(calculateHomeEquity(property.offerPrice, property.rehabCosts, property.arv)) }}>{formatCurrency(calculateHomeEquity(property.offerPrice, property.rehabCosts, property.arv))}</Typography></Box>
          <Box><Typography variant="caption">Monthly Cashflow</Typography><Typography variant="h6" sx={{ color: getCashflowColor(calculateCashflow(property.potentialRent, property.offerPrice, calculateNewLoan(property.offerPrice, property.rehabCosts, property.arv))) }}>{formatCurrency(calculateCashflow(property.potentialRent, property.offerPrice, calculateNewLoan(property.offerPrice, property.rehabCosts, property.arv)))}</Typography></Box>
        </Box>
        <Divider sx={{ my: 2 }} />
        <Box display="grid" gridTemplateColumns={{ xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(4, 1fr)', lg: 'repeat(6, 1fr)' }} gap={{ xs: 2, sm: 4 }} mb={2}>
          <Box><Typography variant="caption">Down Payment (25%)</Typography><Typography variant="h6">{formatCurrency(calculateDownPayment(property.offerPrice, property.rehabCosts))}</Typography></Box>
          <Box><Typography variant="caption">Loan Amount (75%)</Typography><Typography variant="h6">{formatCurrency(calculateLoanAmount(property.offerPrice, property.rehabCosts))}</Typography></Box>
          <Box><Typography variant="caption">New Loan (Refinance)</Typography><Typography variant="h6">{formatCurrency(calculateRefinancingNewLoan(property.offerPrice, property.rehabCosts, property.arv))}</Typography></Box>
          <Box><Typography variant="caption">Monthly Mortgage</Typography><Typography variant="h6">{formatCurrency(calculateMonthlyMortgage(calculateRefinancingNewLoan(property.offerPrice, property.rehabCosts, property.arv)))}</Typography></Box>
          <Box><Typography variant="caption">Refinancing Home Equity</Typography><Typography variant="h6">{formatCurrency(calculateRefinancingHomeEquity(property.offerPrice, property.rehabCosts, property.arv))}</Typography></Box>
          <Box><Typography variant="caption">Refinancing Monthly Cashflow</Typography><Typography variant="h6">{formatCurrency(calculateRefinancingCashflow(property.potentialRent, property.offerPrice, property.arv))}</Typography></Box>
        </Box>

        <Card sx={{ background: '#f5f5f5', mb: 2 }}>
          <CardContent>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Description</Typography>
            <Typography variant="body2">{property.notes || 'No notes.'}</Typography>
          </CardContent>
        </Card>
      </Paper>
      <Box display="flex" flexDirection={{ xs: 'column', lg: 'row' }} gap={3}>
        <Box flex={1} minWidth={{ xs: 'auto', lg: 300 }}>
          <TasksSection 
            property={property}
            onPropertyUpdate={handlePropertyUpdate}
            onSnackbar={handleSnackbar}
          />
        </Box>
        <Box flex={1} minWidth={{ xs: 'auto', lg: 300 }}>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} mb={1} gap={1}>
              <Typography variant="subtitle1">Communication Notes</Typography>
              <Button size="small" variant="outlined" onClick={() => setNoteDialogOpen(true)} sx={{ alignSelf: { xs: 'stretch', sm: 'flex-end' } }}>Add Note</Button>
            </Box>
            <Divider sx={{ mb: 1 }} />
            <List>
              {notes.map(note => (
                <ListItem key={note.id} alignItems="flex-start" sx={{ mb: 1, background: '#f6fafd', borderRadius: 1 }}>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem', bgcolor: getAvatarColor(note.createdBy) }}>
                          {getInitials(note.createdBy)}
                        </Avatar>
                        <Typography variant="body2">{note.content}</Typography>
                      </Box>
                    }
                    secondary={<Typography variant="caption" color="text.secondary">{new Date(note.createdAt).toLocaleString('en-US', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric', 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}</Typography>}
                  />
                  <IconButton
                    size="small"
                    onClick={() => handleDeleteNote(note.id)}
                    sx={{ ml: 1 }}
                  >
                    <Icons.Delete fontSize="small" />
                  </IconButton>
                </ListItem>
              ))}
              {notes.length === 0 && <Typography variant="body2" color="text.secondary">No notes yet.</Typography>}
            </List>
          </Paper>
        </Box>
        <Box flex={1} minWidth={{ xs: 'auto', lg: 280 }}>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} mb={1} gap={1}>
              <Typography variant="subtitle1">Links</Typography>
              <Button size="small" variant="outlined" onClick={() => setLinkDialogOpen(true)} sx={{ alignSelf: { xs: 'stretch', sm: 'flex-end' } }}>Add Link</Button>
            </Box>
            <Divider sx={{ mb: 1 }} />
            <List>
              {links.map(link => (
                <ListItem key={link.id} alignItems="flex-start" sx={{ mb: 1 }}>
                  <ListItemText
                    primary={
                      <Tooltip title={link.moreDetails || 'No additional details'} arrow>
                        <MuiLink href={link.url} target="_blank" rel="noopener noreferrer" sx={{ fontWeight: 500 }}>
                          {link.title}
                        </MuiLink>
                      </Tooltip>
                    }
                  />
                  <IconButton
                    size="small"
                    onClick={() => handleDeleteLink(link.id)}
                    sx={{ ml: 1 }}
                  >
                    <Icons.Delete fontSize="small" />
                  </IconButton>
                </ListItem>
              ))}
              {links.length === 0 && <Typography variant="body2" color="text.secondary">No links yet.</Typography>}
            </List>
          </Paper>
        </Box>
      </Box>
      {/* Note Dialog */}
      <Dialog 
        open={noteDialogOpen} 
        onClose={() => setNoteDialogOpen(false)}
        PaperProps={{
          sx: {
            minHeight: '400px',
            width: '400px'
          }
        }}
      >
        <DialogTitle>Add Note</DialogTitle>
        <DialogContent sx={{ minHeight: '300px', display: 'flex', flexDirection: 'column' }}>
          <TextField
            label="Note"
            value={newNote}
            onChange={e => setNewNote(e.target.value)}
            fullWidth
            multiline
            minRows={5}
            sx={{ mb: 2, flexGrow: 1 }}
          />
          <FormControl fullWidth>
            <InputLabel>Created By</InputLabel>
            <Select
              value={newNoteCreatedBy}
              onChange={(e) => setNewNoteCreatedBy(e.target.value)}
              label="Created By"
              MenuProps={{
                PaperProps: {
                  style: {
                    maxHeight: 200
                  }
                }
              }}
            >
              {createdByOptions.map(option => (
                <MenuItem key={option} value={option} sx={{ minHeight: '36px' }}>{option}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNoteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddNote} variant="contained">Add</Button>
        </DialogActions>
      </Dialog>
      {/* Link Dialog */}
      <Dialog open={linkDialogOpen} onClose={() => setLinkDialogOpen(false)}>
        <DialogTitle>Add Link</DialogTitle>
        <DialogContent>
          <TextField
            label="Title"
            value={newLink.title}
            onChange={e => setNewLink({ ...newLink, title: e.target.value })}
            fullWidth
            sx={{ mt: 1 }}
          />
          <TextField
            label="URL"
            value={newLink.url}
            onChange={e => setNewLink({ ...newLink, url: e.target.value })}
            fullWidth
            sx={{ mt: 2 }}
          />
          <TextField
            label="More Details (shown on hover)"
            value={newLink.moreDetails}
            onChange={e => setNewLink({ ...newLink, moreDetails: e.target.value })}
            fullWidth
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLinkDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddLink} variant="contained">Add</Button>
        </DialogActions>
      </Dialog>
      <PropertyDialog
        open={propertyDialogOpen}
        onClose={() => setPropertyDialogOpen(false)}
        onSave={handleSaveProperty}
        property={property}
        isEditing={true}
      />
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PropertyDetailsPage; 
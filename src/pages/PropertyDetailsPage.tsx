import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { Box, Typography, Paper, Button, Chip, Card, TextField, Dialog, DialogTitle, DialogContent, DialogActions, List, ListItem, ListItemText, IconButton, Tooltip, Link as MuiLink, Divider, Snackbar, Alert, Avatar, Select, MenuItem, FormControl, InputLabel, Accordion, AccordionSummary, AccordionDetails, Menu } from '@mui/material';
import * as Icons from '@mui/icons-material';
import { Property, Note, Link as PropertyLink, CreateNote, CreateLink, Contact } from '../types/property';
import { getPropertyById } from '../services/api';
import { getNotesByPropertyId, createNote, getLinksByPropertyId, createLink, deleteNote, deleteLink, getContactsByPropertyId } from '../services/api';
import PropertyDialog from '../components/PropertyDialog';
import TasksSection from '../components/TasksSection';
import ContactDialog from '../components/ContactDialog';
import { MarkdownNoteModal } from '../components/MarkdownNoteModal';
import { FinancingDetailsTooltip, CashflowBreakdownTooltip } from '../components/shared/PropertyTooltips';
import { prepareReportData } from '../services/investmentReportService';
import { createShareableReport } from '../services/reportSharingService';
import {
  calculateRentRatio,
  calculateARVRatio,
  calculateNewLoan,
  calculateHomeEquity,
  calculateCashflow,
  calculateHoldScore,
  calculateFlipScore,
  getHoldScoreBreakdown,
  getFlipScoreBreakdown,
  calculatePerfectRentForHoldScore,
  calculatePerfectARVForFlipScore,
} from '../utils/scoreCalculator';

const PropertyDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
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
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [reportsMenuAnchor, setReportsMenuAnchor] = useState<null | HTMLElement>(null);
  const [notesModalOpen, setNotesModalOpen] = useState(false);

  // Determine which sections should be expanded based on status
  const getInitialExpandedSections = (status: string) => {
    const operationalStatuses = ['Selling', 'Needs Tenant', 'Operational'];
    if (operationalStatuses.includes(status)) {
      return ['operational'];
    } else {
      return ['opportunity'];
    }
  };

  const createdByOptions = ['Patrik', 'Dillon', 'Other'];

  // Helper function to calculate days since last status change
  const getDaysSinceStatusChange = (unit: any) => {
    let referenceDate: Date;
    
    if (unit.statusHistory && unit.statusHistory.length > 0) {
      // Use the last status change date
      const lastStatusChange = unit.statusHistory[unit.statusHistory.length - 1];
      referenceDate = new Date(lastStatusChange.dateStart);
    } else {
      // Fallback to unit creation date for units without status history
      referenceDate = new Date(unit.createdAt || unit.updatedAt);
    }
    
    const today = new Date();
    const diffTime = referenceDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

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
        return '#E91E63'; // Pink
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
    if (!id) return;
    setLoading(true);
    getPropertyById(id)
      .then((property) => {
        setProperty(property);
        // Set initial expanded sections based on property status
        setExpandedSections(getInitialExpandedSections(property.status));
        // Fetch notes, links, and contacts using property.id, handle 404 as empty
        Promise.all([
          getNotesByPropertyId(property.id).catch(err => {
            if (err.response && err.response.status === 404) return [];
            throw err;
          }),
          getLinksByPropertyId(property.id).catch(err => {
            if (err.response && err.response.status === 404) return [];
            throw err;
          }),
          getContactsByPropertyId(property.id).catch(err => {
            if (err.response && err.response.status === 404) return [];
            throw err;
          })
        ]).then(([notes, links, contacts]) => {
          setNotes(notes.sort((a: Note, b: Note) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
          setLinks(links);
          setContacts(contacts);
        });
      })
      .catch(() => {
        setSnackbar({ open: true, message: 'Failed to load property details', severity: 'error' });
      })
      .finally(() => setLoading(false));
  }, [id]);

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

  const handleSaveNotes = async (content: string) => {
    if (!property) return;

    try {
      const { updateProperty } = await import('../services/api');
      const updatedProperty = await updateProperty(property.id, {
        ...property,
        notes: content
      });
      setProperty(updatedProperty);
      setSnackbar({ open: true, message: 'Notes saved successfully', severity: 'success' });
    } catch (error) {
      console.error('Error saving notes:', error);
      setSnackbar({ open: true, message: 'Failed to save notes', severity: 'error' });
      throw error;
    }
  };

  const handlePropertyUpdate = useCallback((updatedProperty: Property) => {
    setProperty(updatedProperty);
    // Update expanded sections when property status changes
    setExpandedSections(getInitialExpandedSections(updatedProperty.status));
  }, []);

  const handleSnackbar = useCallback((message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const handleContactsUpdate = useCallback(async () => {
    if (!property) return;
    try {
      const contactsData = await getContactsByPropertyId(property.id);
      setContacts(contactsData);
    } catch (error) {
      console.error('Error updating contacts:', error);
    }
  }, [property]);

  const handleReportsMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setReportsMenuAnchor(event.currentTarget);
  };

  const handleReportsMenuClose = () => {
    setReportsMenuAnchor(null);
  };

  const handleInvestmentReport = () => {
    if (!property) return;
    try {
      // Prepare report data
      const reportData = prepareReportData(property);

      // Create shareable link
      const shareableLink = createShareableReport(reportData);

      // Open report in new tab
      window.open(shareableLink.url, '_blank', 'noopener,noreferrer');

      handleReportsMenuClose();
    } catch (error) {
      console.error('Error generating investment report:', error);
      handleSnackbar('Failed to generate investment report', 'error');
      handleReportsMenuClose();
    }
  };

  const handleAccordionChange = (section: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedSections(prev =>
      isExpanded
        ? [...prev, section]
        : prev.filter(s => s !== section)
    );
  };

  if (loading) return <Box p={4}><Typography>Loading...</Typography></Box>;
  if (!property) return <Box p={4}><Typography>Property not found.</Typography></Box>;

  return (
    <Box p={2}>
      <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} mb={2} gap={2}>
        <Box display="flex" alignItems="center" gap={2}>
          <IconButton
            component={RouterLink}
            to="/properties"
            sx={{ mr: 1 }}
          >
            <Icons.ArrowBack />
          </IconButton>
          <Typography variant="h5">Property Details</Typography>
        </Box>
        <Box display="flex" gap={2} flexDirection={{ xs: 'column', sm: 'row' }} mb={3}>
          <Button
            variant="contained"
            startIcon={<Icons.Edit />}
            onClick={() => setPropertyDialogOpen(true)}
            size="small"
            sx={{
              flex: 1,
              maxWidth: { sm: '200px' },
              borderRadius: 2,
              py: 0.5,
              fontSize: '0.875rem'
            }}
          >
            Edit
          </Button>
          <Button
            variant="outlined"
            startIcon={<Icons.Description />}
            onClick={() => setNotesModalOpen(true)}
            size="small"
            sx={{
              flex: 1,
              maxWidth: { sm: '200px' },
              borderRadius: 2,
              py: 0.5,
              fontSize: '0.875rem'
            }}
          >
            Notes
          </Button>
          <Button
            variant="outlined"
            startIcon={<Icons.Assessment />}
            endIcon={<Icons.ArrowDropDown />}
            onClick={handleReportsMenuOpen}
            size="small"
            sx={{
              flex: 1,
              maxWidth: { sm: '200px' },
              borderRadius: 2,
              py: 0.5,
              fontSize: '0.875rem'
            }}
          >
            Reports
          </Button>
          <Menu
            anchorEl={reportsMenuAnchor}
            open={Boolean(reportsMenuAnchor)}
            onClose={handleReportsMenuClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'left',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'left',
            }}
          >
            <MenuItem
              onClick={() => {
                // Construct URL with hash routing (works for both local and GitHub Pages)
                const baseUrl = window.location.origin + window.location.pathname;
                const plReportUrl = `${baseUrl}#/reports/property-pl/${property.id}`;
                window.open(plReportUrl, '_blank', 'noopener,noreferrer');
                handleReportsMenuClose();
              }}
            >
              <Icons.Assessment sx={{ mr: 1 }} />
              P&L Report
            </MenuItem>
            <MenuItem onClick={handleInvestmentReport}>
              <Icons.TrendingUp sx={{ mr: 1 }} />
              Investment Report
            </MenuItem>
          </Menu>
        </Box>
      </Box>
      {/* Property Details - takes up full width */}
      <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
        {/* Header with Address and Description */}
        <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'stretch', sm: 'center' }} gap={2} mb={3}>
          <Box flex={1}>
            <MuiLink href={property.zillowLink} target="_blank" rel="noopener noreferrer" variant="h6" sx={{ fontWeight: 600, color: 'primary.main', textDecoration: 'none', wordBreak: 'break-word' }}>{property.address}</MuiLink>
          </Box>
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
          </Box>
        </Box>

        {/* Investment Details Section */}
        <Accordion 
          expanded={expandedSections.includes('opportunity')} 
          onChange={handleAccordionChange('opportunity')}
          sx={{ mb: 2, '&:before': { display: 'none' } }}
        >
          <AccordionSummary
            expandIcon={<Icons.ExpandMore />}
            sx={{
              backgroundColor: 'accent.main',
              borderRadius: 1
            }}
          >
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
              Investment Details
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 2 }}>
            <Box display="grid" gridTemplateColumns={{ xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(4, 1fr)', lg: 'repeat(6, 1fr)' }} gap={{ xs: 2, sm: 3 }} mb={2}>
              <Box><Typography variant="caption">Sq Ft</Typography><Typography variant="h6">{property.squareFootage !== undefined && property.squareFootage !== null ? property.squareFootage.toLocaleString() : 'N/A'}</Typography></Box>
              <Box><Typography variant="caption">Units</Typography><Typography variant="h6">{property.units !== undefined && property.units !== null ? property.units : 'N/A'}</Typography></Box>
              <Box><Typography variant="caption">Offer Price</Typography><Typography variant="h6">${property.offerPrice.toLocaleString()}</Typography></Box>
              <Box><Typography variant="caption">Rehab Cost</Typography><Typography variant="h6">${property.rehabCosts.toLocaleString()}</Typography></Box>
              <Box><Typography variant="caption">Potential Rent</Typography><Typography variant="h6">${property.potentialRent.toLocaleString()}</Typography></Box>
              <Box><Typography variant="caption">ARV</Typography><Typography variant="h6">${property.arv.toLocaleString()}</Typography></Box>
              <Box><Typography variant="caption">Rent Ratio</Typography><Typography variant="h6" sx={{ color: getRentRatioColor(calculateRentRatio(property.potentialRent, property.offerPrice, property.rehabCosts)) }}>{formatPercentage(calculateRentRatio(property.potentialRent, property.offerPrice, property.rehabCosts))}</Typography></Box>
              <Box><Typography variant="caption">ARV Ratio</Typography><Typography variant="h6" sx={{ color: getARVRatioColor(calculateARVRatio(property.offerPrice, property.rehabCosts, property.arv)) }}>{formatPercentage(calculateARVRatio(property.offerPrice, property.rehabCosts, property.arv))}</Typography></Box>
              <Box>
                <Typography variant="caption">Equity</Typography>
                <Tooltip 
                  title={
                    <FinancingDetailsTooltip 
                      property={property} 
                      formatCurrency={formatCurrency} 
                      formatPercentage={formatPercentage} 
                    />
                  } 
                  arrow 
                  placement="top"
                >
                  <Typography variant="h6" sx={{ color: getHomeEquityColor(calculateHomeEquity(property.offerPrice, property.rehabCosts, property.arv)), cursor: 'help' }}>
                    {formatCurrency(calculateHomeEquity(property.offerPrice, property.rehabCosts, property.arv))}
                  </Typography>
                </Tooltip>
              </Box>
              <Box>
                <Typography variant="caption">Monthly Cashflow</Typography>
                <Tooltip 
                  title={
                    <CashflowBreakdownTooltip 
                      property={property} 
                      formatCurrency={formatCurrency} 
                      formatPercentage={formatPercentage} 
                    />
                  } 
                  arrow 
                  placement="top"
                >
                  <Typography variant="h6" sx={{ color: getCashflowColor(calculateCashflow(property.potentialRent, property.offerPrice, calculateNewLoan(property.offerPrice, property.rehabCosts, property.arv))), cursor: 'help' }}>
                    {formatCurrency(calculateCashflow(property.potentialRent, property.offerPrice, calculateNewLoan(property.offerPrice, property.rehabCosts, property.arv)))}
                  </Typography>
                </Tooltip>
              </Box>
            </Box>
            
            {/* Scores Section */}
            <Box sx={{ mt: 3, p: 2, backgroundColor: '#f8f9fa', borderRadius: 2 }}>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>Investment Scores</Typography>
              <Box display="flex" gap={2} flexWrap="wrap">
                <Tooltip 
                  title={
                    <>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>Hold Score Breakdown:</Typography>
                      {(() => {
                        const breakdown = getHoldScoreBreakdown(property);
                        const cashflow = calculateCashflow(property.potentialRent, property.offerPrice, calculateNewLoan(property.offerPrice, property.rehabCosts, property.arv));
                        const cashflowPerUnit = cashflow / (property.units || 1);
                        const perfectRent = calculatePerfectRentForHoldScore(property.offerPrice, property.rehabCosts, property.arv, property.units || 1);
                        return (
                          <>
                            <Typography variant="body2">
                              Cashflow: {breakdown.cashflowScore}/8 points
                              {` (${formatCurrency(cashflowPerUnit)}/unit)`}
                            </Typography>
                            <Typography variant="body2">
                              Rent Ratio: {breakdown.rentRatioScore}/2 points
                              {` (${formatPercentage(calculateRentRatio(property.potentialRent, property.offerPrice, property.rehabCosts))})`}
                            </Typography>
                            <Typography variant="body2" fontWeight="bold" sx={{ mt: 1, pt: 1, borderTop: '1px solid #eee' }}>
                              Total Hold Score: {breakdown.totalScore}/10 points
                            </Typography>
                            <Typography variant="body2" sx={{ 
                              mt: 1, 
                              pt: 1, 
                              borderTop: '1px solid #eee', 
                              color: '#2e7d32', 
                              fontWeight: 'bold',
                              backgroundColor: '#e8f5e9',
                              p: 0.5,
                              borderRadius: 1,
                              textAlign: 'center'
                            }}>
                              Perfect Rent for 10/10: {formatCurrency(perfectRent)}/month
                            </Typography>
                          </>
                        );
                      })()}
                    </>
                  } 
                  arrow 
                  placement="top"
                >
                  <Box sx={{ 
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: getScoreBackgroundColor(calculateHoldScore(property)),
                    color: getScoreColor(calculateHoldScore(property)),
                    p: '8px 16px',
                    borderRadius: 2,
                    fontWeight: 'bold',
                    minWidth: '80px',
                    height: '32px',
                    cursor: 'help',
                    boxShadow: 1
                  }}>
                    Hold: {calculateHoldScore(property)}/10
                  </Box>
                </Tooltip>
                <Tooltip 
                  title={
                    <>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>Flip Score Breakdown:</Typography>
                      {(() => {
                        const breakdown = getFlipScoreBreakdown(property);
                        const perfectARV = calculatePerfectARVForFlipScore(property.offerPrice, property.rehabCosts);
                        return (
                          <>
                            <Typography variant="body2">
                              ARV Ratio: {breakdown.arvRatioScore}/10 points
                              {` (${formatPercentage(calculateARVRatio(property.offerPrice, property.rehabCosts, property.arv))})`}
                            </Typography>
                            <Typography variant="body2" fontWeight="bold" sx={{ mt: 1, pt: 1, borderTop: '1px solid #eee' }}>
                              Total Flip Score: {breakdown.totalScore}/10 points
                            </Typography>
                            <Typography variant="body2" sx={{ 
                              mt: 1, 
                              pt: 1, 
                              borderTop: '1px solid #eee', 
                              color: '#e65100', 
                              fontWeight: 'bold',
                              backgroundColor: '#fff3e0',
                              p: 0.5,
                              borderRadius: 1,
                              textAlign: 'center'
                            }}>
                              Perfect ARV for 10/10: {formatCurrency(perfectARV)}
                            </Typography>
                          </>
                        );
                      })()}
                    </>
                  } 
                  arrow 
                  placement="top"
                >
                  <Box sx={{ 
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: getScoreBackgroundColor(calculateFlipScore(property)),
                    color: getScoreColor(calculateFlipScore(property)),
                    p: '8px 16px',
                    borderRadius: 2,
                    fontWeight: 'bold',
                    minWidth: '80px',
                    height: '32px',
                    cursor: 'help',
                    boxShadow: 1
                  }}>
                    Flip: {calculateFlipScore(property)}/10
                  </Box>
                </Tooltip>
              </Box>
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Operational Details Section */}
        <Accordion 
          expanded={expandedSections.includes('operational')} 
          onChange={handleAccordionChange('operational')}
          sx={{ mb: 2, '&:before': { display: 'none' } }}
        >
          <AccordionSummary
            expandIcon={<Icons.ExpandMore />}
            sx={{
              backgroundColor: 'accent.main',
              borderRadius: 1
            }}
          >
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
              Operational Details
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 2 }}>
            {/* Monthly P&L */}
            <Box mb={3}>
              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>Monthly P&L</Typography>
              <Box display="flex" gap={4}>
                {/* Expenses - Stacked on the left */}
                <Box flex={1}>
                  <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: 'error.main' }}>Expenses</Typography>
                  <Box display="flex" flexDirection="column" gap={1}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2">Mortgage</Typography>
                      <Typography variant="body2" fontWeight={500}>{property.monthlyExpenses?.mortgage !== undefined && property.monthlyExpenses?.mortgage !== null ? formatCurrency(property.monthlyExpenses.mortgage) : 'N/A'}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2">Taxes</Typography>
                      <Typography variant="body2" fontWeight={500}>{property.monthlyExpenses?.taxes !== undefined && property.monthlyExpenses?.taxes !== null ? formatCurrency(property.monthlyExpenses.taxes) : 'N/A'}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2">Insurance</Typography>
                      <Typography variant="body2" fontWeight={500}>{property.monthlyExpenses?.insurance !== undefined && property.monthlyExpenses?.insurance !== null ? formatCurrency(property.monthlyExpenses.insurance) : 'N/A'}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2">Property Management</Typography>
                      <Typography variant="body2" fontWeight={500}>{property.monthlyExpenses?.propertyManagement !== undefined && property.monthlyExpenses?.propertyManagement !== null ? formatCurrency(property.monthlyExpenses.propertyManagement) : 'N/A'}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2">Utilities</Typography>
                      <Typography variant="body2" fontWeight={500}>{property.monthlyExpenses?.utilities !== undefined && property.monthlyExpenses?.utilities !== null ? formatCurrency(property.monthlyExpenses.utilities) : 'N/A'}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2">Vacancy</Typography>
                      <Typography variant="body2" fontWeight={500}>{property.monthlyExpenses?.vacancy !== undefined && property.monthlyExpenses?.vacancy !== null ? formatCurrency(property.monthlyExpenses.vacancy) : 'N/A'}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2">CapEx</Typography>
                      <Typography variant="body2" fontWeight={500}>{property.monthlyExpenses?.capEx !== undefined && property.monthlyExpenses?.capEx !== null ? formatCurrency(property.monthlyExpenses.capEx) : 'N/A'}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2">Other</Typography>
                      <Typography variant="body2" fontWeight={500}>{property.monthlyExpenses?.other !== undefined && property.monthlyExpenses?.other !== null ? formatCurrency(property.monthlyExpenses.other) : 'N/A'}</Typography>
                    </Box>
                    <Divider sx={{ my: 1 }} />
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body1" fontWeight={600}>Total Expenses</Typography>
                      <Typography variant="body1" fontWeight={600} sx={{ color: 'error.main' }}>{property.monthlyExpenses?.total !== undefined && property.monthlyExpenses?.total !== null ? formatCurrency(property.monthlyExpenses.total) : 'N/A'}</Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Rent & Cashflow - On the right */}
                <Box flex={1}>
                  <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: 'success.main' }}>Income & Cashflow</Typography>
                  <Box display="flex" flexDirection="column" gap={2}>
                    {(() => {
                      const vacantUnits = property.propertyUnits?.filter(unit => unit.status === 'Vacant') || [];
                      const potentialCashflow = (property.potentialRent || 0) - (property.monthlyExpenses?.total || 0);
                      
                      return (
                        <>
                          {/* Current Performance */}
                          <Box>
                            {vacantUnits.length > 0 && (
                              <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 500 }}>Current</Typography>
                            )}
                            <Box display="flex" flexDirection="column" gap={1} sx={{ mt: vacantUnits.length > 0 ? 0.5 : 0 }}>
                              <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Typography variant="body2">Rent</Typography>
                                <Typography variant="body2" fontWeight={500} sx={{ color: 'success.main' }}>{property.actualRent !== undefined && property.actualRent !== null ? formatCurrency(property.actualRent) : 'N/A'}</Typography>
                              </Box>
                              <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Typography variant="body1" fontWeight={600}>Cashflow</Typography>
                                <Typography variant="body1" fontWeight={600} sx={{ color: getCashflowColor((property.actualRent || 0) - (property.monthlyExpenses?.total || 0)) }}>{formatCurrency((property.actualRent || 0) - (property.monthlyExpenses?.total || 0))}</Typography>
                              </Box>
                            </Box>
                          </Box>

                          {/* Potential Performance */}
                          {vacantUnits.length > 0 && (
                            <Box sx={{ pt: 1, borderTop: '1px solid #e0e0e0' }}>
                              <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 500 }}>Potential</Typography>
                              <Box display="flex" flexDirection="column" gap={1} sx={{ mt: 0.5 }}>
                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                  <Typography variant="body2">Rent</Typography>
                                  <Typography variant="body2" fontWeight={500} sx={{ color: 'success.main' }}>{formatCurrency(property.potentialRent || 0)}</Typography>
                                </Box>
                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                  <Typography variant="body1" fontWeight={600}>Cashflow</Typography>
                                  <Typography variant="body1" fontWeight={600} sx={{ color: getCashflowColor(potentialCashflow) }}>{formatCurrency(potentialCashflow)}</Typography>
                                </Box>
                              </Box>
                            </Box>
                          )}
                        </>
                      );
                    })()}
                  </Box>
                </Box>
              </Box>
            </Box>

            {/* Units */}
            <Box>
              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>Units ({property.units || 0})</Typography>
              {property.propertyUnits && property.propertyUnits.length > 0 ? (
                <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }} gap={2}>
                  {property.propertyUnits.map((unit, index) => (
                    <Card key={unit.id || index} sx={{ p: 2, border: '1px solid #e0e0e0' }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                        <Typography variant="subtitle2" fontWeight={600}>Unit {unit.unitNumber}</Typography>
                        <Chip
                          label={unit.status} 
                          size="small" 
                          sx={{ 
                            backgroundColor: unit.status === 'Operational' ? '#4caf50' : 
                                           unit.status === 'Vacant' ? '#ff9800' : '#f44336',
                            color: 'white',
                            fontSize: '0.7rem'
                          }}
                        />
                      </Box>
                      <Box>
                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                          <strong>Rent:</strong> {formatCurrency(unit.rent)}
                        </Typography>
                        {unit.leaseDate && (
                          <Typography variant="body2" sx={{ mb: 0.5 }}>
                            <strong>Lease Date:</strong> {new Date(unit.leaseDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}
                          </Typography>
                        )}
                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                          <strong>Last Rent:</strong> {unit.dateOfLastRent ? new Date(unit.dateOfLastRent).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }) : 'Never'}
                        </Typography>
                        {(() => {
                          const daysSinceChange = getDaysSinceStatusChange(unit);
                          const hasStatusHistory = unit.statusHistory && unit.statusHistory.length > 0;
                          const label = hasStatusHistory ? 'Status Duration:' : 'Days in Status:';

                          let displayText;
                          if (daysSinceChange > 0) {
                            displayText = `in ${daysSinceChange} day${daysSinceChange !== 1 ? 's' : ''}`;
                          } else if (daysSinceChange < 0) {
                            displayText = `${Math.abs(daysSinceChange)} day${Math.abs(daysSinceChange) !== 1 ? 's' : ''} ago`;
                          } else {
                            displayText = 'today';
                          }

                          return (
                            <Typography variant="body2" sx={{ mb: 0.5 }}>
                              <strong>{label}</strong> {displayText}
                            </Typography>
                          );
                        })()}
                        {unit.notes && (
                          <Typography variant="caption" color="text.secondary">
                            {unit.notes}
                          </Typography>
                        )}
                      </Box>
                    </Card>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">No unit details available.</Typography>
              )}
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Asset Details Section */}
        <Accordion 
          expanded={expandedSections.includes('asset')} 
          onChange={handleAccordionChange('asset')}
          sx={{ mb: 2, '&:before': { display: 'none' } }}
        >
          <AccordionSummary
            expandIcon={<Icons.ExpandMore />}
            sx={{
              backgroundColor: 'accent.main',
              borderRadius: 1
            }}
          >
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
              Asset Details
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 2 }}>
            {/* Capital Costs */}
            <Box>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>Capital Costs</Typography>
              <Box display="grid" gridTemplateColumns={{ xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(4, 1fr)' }} gap={{ xs: 2, sm: 3 }}>
                <Box><Typography variant="caption">Closing Costs</Typography><Typography variant="h6">{property.capitalCosts?.closingCosts !== undefined && property.capitalCosts?.closingCosts !== null ? formatCurrency(property.capitalCosts.closingCosts) : 'N/A'}</Typography></Box>
                <Box><Typography variant="caption">Upfront Repairs</Typography><Typography variant="h6">{property.capitalCosts?.upfrontRepairs !== undefined && property.capitalCosts?.upfrontRepairs !== null ? formatCurrency(property.capitalCosts.upfrontRepairs) : 'N/A'}</Typography></Box>
                <Box><Typography variant="caption">Down Payment</Typography><Typography variant="h6">{property.capitalCosts?.downPayment !== undefined && property.capitalCosts?.downPayment !== null ? formatCurrency(property.capitalCosts.downPayment) : 'N/A'}</Typography></Box>
                <Box><Typography variant="caption">Other</Typography><Typography variant="h6">{property.capitalCosts?.other !== undefined && property.capitalCosts?.other !== null ? formatCurrency(property.capitalCosts.other) : 'N/A'}</Typography></Box>
                <Box><Typography variant="caption">Total Capital Costs</Typography><Typography variant="h6" sx={{ color: 'primary.main' }}>{property.capitalCosts?.total !== undefined && property.capitalCosts?.total !== null ? formatCurrency(property.capitalCosts.total) : 'N/A'}</Typography></Box>
              </Box>
            </Box>
            
            {/* Property Value */}
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>Property Value</Typography>
              <Box display="grid" gridTemplateColumns={{ xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(4, 1fr)' }} gap={{ xs: 2, sm: 3 }}>
                <Box><Typography variant="caption">Current House Value</Typography><Typography variant="h6">{property.currentHouseValue !== undefined && property.currentHouseValue !== null ? formatCurrency(property.currentHouseValue) : 'N/A'}</Typography></Box>
              </Box>
            </Box>
          </AccordionDetails>
        </Accordion>
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
                      minute: '2-digit',
                      timeZone: 'America/Denver'
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
        <Box flex={1} minWidth={{ xs: 'auto', lg: 280 }}>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} mb={1} gap={1}>
              <Typography variant="subtitle1">Team</Typography>
              <Button size="small" variant="outlined" onClick={() => setContactDialogOpen(true)} sx={{ alignSelf: { xs: 'stretch', sm: 'flex-end' } }}>Link Contacts</Button>
            </Box>
            <Divider sx={{ mb: 1 }} />
            <List>
              {contacts.map(contact => (
                <ListItem key={contact.id} alignItems="flex-start" sx={{ mb: 1 }}>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Chip
                          label={contact.type}
                          size="small"
                          sx={{
                            backgroundColor: getTypeColor(contact.type),
                            color: 'white',
                            fontSize: '0.7rem',
                            height: '20px',
                          }}
                        />
                        <Typography variant="body2" fontWeight={500}>
                          {contact.name}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Box>
                        {contact.company && (
                          <Typography variant="caption" display="block">
                            {contact.company}
                          </Typography>
                        )}
                        <Typography variant="caption" display="block">
                          {contact.email}
                        </Typography>
                        <Typography variant="caption" display="block">
                          {contact.phone}
                        </Typography>
                        {contact.secondaryPhone && (
                          <Typography variant="caption" display="block">
                            {contact.secondaryPhone}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              ))}
              {contacts.length === 0 && <Typography variant="body2" color="text.secondary">No contacts linked.</Typography>}
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
      <ContactDialog
        open={contactDialogOpen}
        onClose={() => setContactDialogOpen(false)}
        propertyId={property.id}
        propertyContacts={contacts}
        onContactsUpdate={handleContactsUpdate}
      />
      <MarkdownNoteModal
        open={notesModalOpen}
        onClose={() => setNotesModalOpen(false)}
        onSave={handleSaveNotes}
        initialContent={property.notes}
        title="Property Notes"
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
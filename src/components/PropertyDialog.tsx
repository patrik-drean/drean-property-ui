import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  styled,
  Typography,
  Chip,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Card,
} from '@mui/material';
import * as Icons from '@mui/icons-material';
import { Property, PropertyStatus } from '../types/property';
import { 
  calculatePerfectRentForHoldScore, 
  calculatePerfectARVForFlipScore 
} from '../utils/scoreCalculator';

// Styled MenuItem for status dropdown
const StyledMenuItem = styled(MenuItem)<{ statuscolor: string }>(({ statuscolor }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  '&::before': {
    content: '""',
    display: 'block',
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    backgroundColor: statuscolor,
  },
}));

interface PropertyDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (property: Omit<Property, 'id'>) => Promise<void>;
  property?: Property | null;
  isEditing: boolean;
}

const PropertyDialog: React.FC<PropertyDialogProps> = ({
  open,
  onClose,
  onSave,
  property,
  isEditing
}) => {
  // Determine which sections should be expanded based on status
  const getInitialExpandedSections = (status: PropertyStatus) => {
    const operationalStatuses = ['Selling', 'Needs Tenant', 'Operational'];
    if (operationalStatuses.includes(status)) {
      return ['operational', 'asset'];
    } else {
      return ['investment'];
    }
  };

  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  const handleAccordionChange = (section: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedSections(prev => 
      isExpanded 
        ? [...prev, section]
        : prev.filter(s => s !== section)
    );
  };

  // Helper functions for updating nested objects
  const updateMonthlyExpenses = (field: string, value: number) => {
    setNewProperty(prev => ({
      ...prev,
      monthlyExpenses: {
        ...prev.monthlyExpenses!,
        [field]: value,
        total: field === 'total' ? value : 
          (field === 'mortgage' ? value : prev.monthlyExpenses!.mortgage) +
          (field === 'taxes' ? value : prev.monthlyExpenses!.taxes) +
          (field === 'insurance' ? value : prev.monthlyExpenses!.insurance) +
          (field === 'propertyManagement' ? value : prev.monthlyExpenses!.propertyManagement) +
          (field === 'utilities' ? value : prev.monthlyExpenses!.utilities) +
          (field === 'vacancy' ? value : prev.monthlyExpenses!.vacancy) +
          (field === 'capEx' ? value : prev.monthlyExpenses!.capEx) +
          (field === 'other' ? value : prev.monthlyExpenses!.other)
      }
    }));
  };

  const updateCapitalCosts = (field: string, value: number) => {
    setNewProperty(prev => ({
      ...prev,
      capitalCosts: {
        ...prev.capitalCosts!,
        [field]: value,
        total: field === 'total' ? value : 
          (field === 'closingCosts' ? value : prev.capitalCosts!.closingCosts) +
          (field === 'upfrontRepairs' ? value : prev.capitalCosts!.upfrontRepairs) +
          (field === 'downPayment' ? value : prev.capitalCosts!.downPayment) +
          (field === 'other' ? value : prev.capitalCosts!.other)
      }
    }));
  };

  const addUnit = () => {
    setNewProperty(prev => ({
      ...prev,
      propertyUnits: [
        ...prev.propertyUnits,
        {
          id: `temp-${Date.now()}`,
          propertyId: '',
          status: 'Vacant',
          rent: 0,
          notes: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]
    }));
  };

  const updateUnit = (index: number, field: string, value: string | number) => {
    setNewProperty(prev => ({
      ...prev,
      propertyUnits: prev.propertyUnits.map((unit, i) => 
        i === index ? { ...unit, [field]: value } : unit
      )
    }));
  };

  const removeUnit = (index: number) => {
    setNewProperty(prev => ({
      ...prev,
      propertyUnits: prev.propertyUnits.filter((_, i) => i !== index)
    }));
  };

  const updateActualRent = () => {
    const totalRent = newProperty.propertyUnits.reduce((sum, unit) => sum + unit.rent, 0);
    setNewProperty(prev => ({ ...prev, actualRent: totalRent }));
  };
  const [newProperty, setNewProperty] = useState<Omit<Property, 'id'>>({
    address: '',
    status: 'Opportunity',
    listingPrice: 0,
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
    notes: '',
    score: 0,
    zillowLink: '',
    squareFootage: null,
    units: null,
    actualRent: 0,
    currentHouseValue: 0,
    propertyUnits: [],
    monthlyExpenses: {
      id: '',
      propertyId: '',
      mortgage: 0,
      taxes: 0,
      insurance: 0,
      propertyManagement: 0,
      utilities: 0,
      vacancy: 0,
      capEx: 0,
      other: 0,
      total: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    capitalCosts: {
      id: '',
      propertyId: '',
      closingCosts: 0,
      upfrontRepairs: 0,
      downPayment: 0,
      other: 0,
      total: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  });

  // Helper function to get status color
  const getStatusColor = (status: PropertyStatus): string => {
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

  const handleCurrencyInput = (value: string) => {
    // Remove any non-digit characters
    const numericValue = value.replace(/[^0-9]/g, '');
    return numericValue ? parseInt(numericValue) : 0;
  };

  const formatInputCurrency = (value: number) => {
    if (value === 0) return '';
    return value.toLocaleString('en-US');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Calculate perfect values for recommendations
  const getPerfectRentRecommendation = () => {
    if (newProperty.offerPrice > 0 || newProperty.rehabCosts > 0) {
      const perfectRent = calculatePerfectRentForHoldScore(
        newProperty.offerPrice, 
        newProperty.rehabCosts, 
        newProperty.arv || 0, 
        newProperty.units || 1
      );
      return perfectRent;
    }
    return null;
  };

  const getPerfectARVRecommendation = () => {
    if (newProperty.offerPrice > 0 || newProperty.rehabCosts > 0) {
      const perfectARV = calculatePerfectARVForFlipScore(
        newProperty.offerPrice, 
        newProperty.rehabCosts
      );
      return perfectARV;
    }
    return null;
  };

  const parseZillowLink = (url: string) => {
    try {
      // Extract address from URL
      const addressMatch = url.match(/\/homedetails\/([^/]+)/);
      if (addressMatch) {
        const address = addressMatch[1]
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        
        // Extract price from URL - try multiple patterns
        let price = 0;
        
        // Try to find price in the URL path
        const pathPriceMatch = url.match(/\$(\d{3}(?:,\d{3})*(?:\.\d{2})?)/);
        if (pathPriceMatch) {
          price = handleCurrencyInput(pathPriceMatch[1]);
        }
        
        // If no price in path, try to find it in the title/description part
        if (!price) {
          const titlePriceMatch = url.match(/title=([^&]+)/);
          if (titlePriceMatch) {
            const title = decodeURIComponent(titlePriceMatch[1]);
            const priceMatch = title.match(/\$(\d{3}(?:,\d{3})*(?:\.\d{2})?)/);
            if (priceMatch) {
              price = handleCurrencyInput(priceMatch[1]);
            }
          }
        }

        return { address, price };
      }
      return null;
    } catch (error) {
      console.error('Error parsing Zillow link:', error);
      return null;
    }
  };

  const handleZillowLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setNewProperty({ ...newProperty, zillowLink: url });
    
    // Only parse if we're not editing and the URL is a valid Zillow link
    if (!isEditing && url.includes('zillow.com')) {
      const parsedData = parseZillowLink(url);
      if (parsedData) {
        setNewProperty(prev => ({
          ...prev,
          address: parsedData.address,
          zillowLink: url
        }));
      }
    }
  };

  const handleSave = async () => {
    try {
      // Update actual rent before saving
      const totalRent = newProperty.propertyUnits.reduce((sum, unit) => sum + unit.rent, 0);
      const propertyToSave = {
        ...newProperty,
        actualRent: totalRent
      };
      await onSave(propertyToSave);
      handleClose();
    } catch (error) {
      console.error('Error saving property:', error);
    }
  };

  const handleClose = () => {
    setNewProperty({
      address: '',
      status: 'Opportunity',
      listingPrice: 0,
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
      notes: '',
      score: 0,
      zillowLink: '',
      squareFootage: null,
      units: null,
      actualRent: 0,
      currentHouseValue: 0,
      propertyUnits: [],
      monthlyExpenses: {
        id: '',
        propertyId: '',
        mortgage: 0,
        taxes: 0,
        insurance: 0,
        propertyManagement: 0,
        utilities: 0,
        vacancy: 0,
        capEx: 0,
        other: 0,
        total: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      capitalCosts: {
        id: '',
        propertyId: '',
        closingCosts: 0,
        upfrontRepairs: 0,
        downPayment: 0,
        other: 0,
        total: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    });
    setExpandedSections(getInitialExpandedSections('Opportunity'));
    onClose();
  };

  // Update form when property prop changes (for editing)
  useEffect(() => {
    if (property && isEditing) {
      setNewProperty({
        address: property.address,
        status: property.status,
        listingPrice: property.listingPrice,
        offerPrice: property.offerPrice,
        rehabCosts: property.rehabCosts,
        potentialRent: property.potentialRent,
        arv: property.arv,
        rentCastEstimates: property.rentCastEstimates,
        todoMetaData: property.todoMetaData || { todoistSectionId: null },
        hasRentcastData: property.hasRentcastData,
        notes: property.notes,
        score: property.score,
        zillowLink: property.zillowLink,
        squareFootage: property.squareFootage,
        units: property.units,
        actualRent: property.actualRent,
        currentHouseValue: property.currentHouseValue,
        propertyUnits: property.propertyUnits,
        monthlyExpenses: property.monthlyExpenses || {
          id: '',
          propertyId: '',
          mortgage: 0,
          taxes: 0,
          insurance: 0,
          propertyManagement: 0,
          utilities: 0,
          vacancy: 0,
          capEx: 0,
          other: 0,
          total: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        capitalCosts: property.capitalCosts || {
          id: '',
          propertyId: '',
          closingCosts: 0,
          upfrontRepairs: 0,
          downPayment: 0,
          other: 0,
          total: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      });
      setExpandedSections(getInitialExpandedSections(property.status));
    }
  }, [property, isEditing]);

  // Update expanded sections when status changes
  useEffect(() => {
    setExpandedSections(getInitialExpandedSections(newProperty.status));
  }, [newProperty.status]);

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="md" 
      fullWidth 
      PaperProps={{ sx: { borderRadius: 2 } }}
    >
      <DialogTitle sx={{ fontSize: '1.25rem', fontWeight: 500, pb: 1 }}>
        {isEditing ? 'Edit Property' : 'Add New Property'}
      </DialogTitle>
      <DialogContent dividers sx={{ maxHeight: '80vh', overflow: 'auto' }}>
        <Box sx={{ p: 1 }}>
          {/* Basic Information */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, color: '#2c3e50', fontWeight: 600 }}>
              Basic Information
            </Typography>
            <TextField
              fullWidth
              label="Zillow Link"
              value={newProperty.zillowLink}
              onChange={handleZillowLinkChange}
              margin="normal"
              placeholder="Paste Zillow link to auto-fill address and price"
              variant="outlined"
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Address"
              value={newProperty.address}
              onChange={(e) => setNewProperty({ ...newProperty, address: e.target.value })}
              margin="normal"
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Status</InputLabel>
              <Select
                value={newProperty.status}
                onChange={(e) => setNewProperty({ ...newProperty, status: e.target.value as PropertyStatus })}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box 
                      sx={{ 
                        width: 16, 
                        height: 16, 
                        borderRadius: '50%', 
                        backgroundColor: getStatusColor(selected as PropertyStatus),
                      }} 
                    />
                    {selected}
                  </Box>
                )}
              >
                <StyledMenuItem value="Opportunity" statuscolor={getStatusColor('Opportunity')}>
                  Opportunity
                </StyledMenuItem>
                <StyledMenuItem value="Soft Offer" statuscolor={getStatusColor('Soft Offer')}>
                  Soft Offer
                </StyledMenuItem>
                <StyledMenuItem value="Hard Offer" statuscolor={getStatusColor('Hard Offer')}>
                  Hard Offer
                </StyledMenuItem>
                <StyledMenuItem value="Rehab" statuscolor={getStatusColor('Rehab')}>
                  Rehab
                </StyledMenuItem>
                <StyledMenuItem value="Operational" statuscolor={getStatusColor('Operational')}>
                  Operational
                </StyledMenuItem>
                <StyledMenuItem value="Needs Tenant" statuscolor={getStatusColor('Needs Tenant')}>
                  Needs Tenant
                </StyledMenuItem>
                <StyledMenuItem value="Selling" statuscolor={getStatusColor('Selling')}>
                  Selling
                </StyledMenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Notes"
              multiline
              rows={3}
              value={newProperty.notes}
              onChange={(e) => setNewProperty({ ...newProperty, notes: e.target.value })}
              margin="normal"
            />
          </Box>

          {/* Investment Details Section */}
          <Accordion 
            expanded={expandedSections.includes('investment')} 
            onChange={handleAccordionChange('investment')}
            sx={{ mb: 2, '&:before': { display: 'none' } }}
          >
            <AccordionSummary 
              expandIcon={<Icons.ExpandMore />}
              sx={{ 
                backgroundColor: '#e3f2fd', 
                borderRadius: 1
              }}
            >
              <Typography variant="h6" sx={{ color: '#2c3e50', fontWeight: 600 }}>
                Investment Details
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 2 }}>
              <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: 'repeat(2, 1fr)' }} gap={2}>
                <TextField
                  fullWidth
                  label="Listing Price"
                  value={formatInputCurrency(newProperty.listingPrice)}
                  onChange={(e) => setNewProperty({ ...newProperty, listingPrice: handleCurrencyInput(e.target.value) })}
                  margin="normal"
                  InputProps={{
                    startAdornment: <span style={{ marginRight: '8px' }}>$</span>,
                  }}
                />
                <TextField
                  fullWidth
                  label="Offer Price"
                  value={formatInputCurrency(newProperty.offerPrice)}
                  onChange={(e) => setNewProperty({ ...newProperty, offerPrice: handleCurrencyInput(e.target.value) })}
                  margin="normal"
                  InputProps={{
                    startAdornment: <span style={{ marginRight: '8px' }}>$</span>,
                  }}
                />
                <TextField
                  fullWidth
                  label="Rehab Costs"
                  value={formatInputCurrency(newProperty.rehabCosts)}
                  onChange={(e) => setNewProperty({ ...newProperty, rehabCosts: handleCurrencyInput(e.target.value) })}
                  margin="normal"
                  InputProps={{
                    startAdornment: <span style={{ marginRight: '8px' }}>$</span>,
                  }}
                />
                                 <TextField
                   fullWidth
                   label="Current House Value"
                   value={formatInputCurrency(newProperty.currentHouseValue)}
                   onChange={(e) => setNewProperty({ ...newProperty, currentHouseValue: handleCurrencyInput(e.target.value) })}
                   margin="normal"
                   InputProps={{
                     startAdornment: <span style={{ marginRight: '8px' }}>$</span>,
                   }}
                 />
                 <TextField
                   fullWidth
                   label="Square Footage"
                   value={newProperty.squareFootage !== null ? newProperty.squareFootage : ''}
                   onChange={(e) => {
                     const value = e.target.value.trim() === '' ? null : parseInt(e.target.value, 10);
                     setNewProperty({ ...newProperty, squareFootage: value });
                   }}
                   margin="normal"
                   type="number"
                 />
              </Box>
              
              <Tooltip
                title={
                  getPerfectRentRecommendation() ? (
                    <Box sx={{ p: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                        Perfect Hold Score (10/10): {formatCurrency(getPerfectRentRecommendation()!)}/month
                      </Typography>
                      <Typography variant="body2">
                        This rent amount will achieve:
                      </Typography>
                      <Typography variant="body2" component="ul" sx={{ mt: 0.5, pl: 2 }}>
                        <li>$200+ cashflow per unit (8/8 points)</li>
                        <li>1%+ rent ratio (2/2 points)</li>
                      </Typography>
                    </Box>
                  ) : (
                    "Enter offer price and rehab costs to see perfect rent recommendation"
                  )
                }
                arrow
                placement="top-start"
              >
                <TextField
                  fullWidth
                  label="Potential Monthly Rent"
                  value={formatInputCurrency(newProperty.potentialRent)}
                  onChange={(e) => setNewProperty({ ...newProperty, potentialRent: handleCurrencyInput(e.target.value) })}
                  margin="normal"
                  InputProps={{
                    startAdornment: <span style={{ marginRight: '8px' }}>$</span>,
                  }}
                  helperText={
                    getPerfectRentRecommendation() ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip 
                          label="Perfect Hold Score (10/10)" 
                          size="small" 
                          color="success" 
                          variant="outlined"
                          sx={{ fontSize: '0.7rem', height: '20px' }}
                        />
                        <Typography variant="caption" color="success.main" fontWeight="medium">
                          {formatCurrency(getPerfectRentRecommendation()!)}/month
                        </Typography>
                      </Box>
                    ) : (
                      "Enter offer price and rehab costs to see perfect rent recommendation"
                    )
                  }
                />
              </Tooltip>
              
              <Tooltip
                title={
                  getPerfectARVRecommendation() ? (
                    <Box sx={{ p: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                        Perfect Flip Score (10/10): {formatCurrency(getPerfectARVRecommendation()!)}
                      </Typography>
                      <Typography variant="body2">
                        This ARV amount will achieve:
                      </Typography>
                      <Typography variant="body2" component="ul" sx={{ mt: 0.5, pl: 2 }}>
                        <li>≤65% ARV ratio (8/8 points)</li>
                        <li>$75k+ home equity (2/2 points)</li>
                      </Typography>
                    </Box>
                  ) : (
                    "Enter offer price and rehab costs to see perfect ARV recommendation"
                  )
                }
                arrow
                placement="top-start"
              >
                <TextField
                  fullWidth
                  label="ARV"
                  value={formatInputCurrency(newProperty.arv)}
                  onChange={(e) => setNewProperty({ ...newProperty, arv: handleCurrencyInput(e.target.value) })}
                  margin="normal"
                  InputProps={{
                    startAdornment: <span style={{ marginRight: '8px' }}>$</span>,
                  }}
                  helperText={
                    getPerfectARVRecommendation() ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip 
                          label="Perfect Flip Score (10/10)" 
                          size="small" 
                          color="warning" 
                          variant="outlined"
                          sx={{ fontSize: '0.7rem', height: '20px' }}
                        />
                        <Typography variant="caption" color="warning.main" fontWeight="medium">
                          {formatCurrency(getPerfectARVRecommendation()!)}
                        </Typography>
                      </Box>
                    ) : (
                      "Enter offer price and rehab costs to see perfect ARV recommendation"
                    )
                  }
                />
              </Tooltip>
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
                backgroundColor: '#e3f2fd', 
                borderRadius: 1
              }}
            >
              <Typography variant="h6" sx={{ color: '#2c3e50', fontWeight: 600 }}>
                Operational Details
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 2 }}>
              {/* Monthly Expenses */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>Monthly Expenses</Typography>
                <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: 'repeat(2, 1fr)' }} gap={2}>
                  <TextField
                    fullWidth
                    label="Mortgage"
                    value={formatInputCurrency(newProperty.monthlyExpenses!.mortgage)}
                    onChange={(e) => updateMonthlyExpenses('mortgage', handleCurrencyInput(e.target.value))}
                    margin="normal"
                    InputProps={{
                      startAdornment: <span style={{ marginRight: '8px' }}>$</span>,
                    }}
                  />
                  <TextField
                    fullWidth
                    label="Taxes"
                    value={formatInputCurrency(newProperty.monthlyExpenses!.taxes)}
                    onChange={(e) => updateMonthlyExpenses('taxes', handleCurrencyInput(e.target.value))}
                    margin="normal"
                    InputProps={{
                      startAdornment: <span style={{ marginRight: '8px' }}>$</span>,
                    }}
                  />
                  <TextField
                    fullWidth
                    label="Insurance"
                    value={formatInputCurrency(newProperty.monthlyExpenses!.insurance)}
                    onChange={(e) => updateMonthlyExpenses('insurance', handleCurrencyInput(e.target.value))}
                    margin="normal"
                    InputProps={{
                      startAdornment: <span style={{ marginRight: '8px' }}>$</span>,
                    }}
                  />
                  <TextField
                    fullWidth
                    label="Property Management"
                    value={formatInputCurrency(newProperty.monthlyExpenses!.propertyManagement)}
                    onChange={(e) => updateMonthlyExpenses('propertyManagement', handleCurrencyInput(e.target.value))}
                    margin="normal"
                    InputProps={{
                      startAdornment: <span style={{ marginRight: '8px' }}>$</span>,
                    }}
                  />
                  <TextField
                    fullWidth
                    label="Utilities"
                    value={formatInputCurrency(newProperty.monthlyExpenses!.utilities)}
                    onChange={(e) => updateMonthlyExpenses('utilities', handleCurrencyInput(e.target.value))}
                    margin="normal"
                    InputProps={{
                      startAdornment: <span style={{ marginRight: '8px' }}>$</span>,
                    }}
                  />
                  <TextField
                    fullWidth
                    label="Vacancy"
                    value={formatInputCurrency(newProperty.monthlyExpenses!.vacancy)}
                    onChange={(e) => updateMonthlyExpenses('vacancy', handleCurrencyInput(e.target.value))}
                    margin="normal"
                    InputProps={{
                      startAdornment: <span style={{ marginRight: '8px' }}>$</span>,
                    }}
                  />
                  <TextField
                    fullWidth
                    label="CapEx"
                    value={formatInputCurrency(newProperty.monthlyExpenses!.capEx)}
                    onChange={(e) => updateMonthlyExpenses('capEx', handleCurrencyInput(e.target.value))}
                    margin="normal"
                    InputProps={{
                      startAdornment: <span style={{ marginRight: '8px' }}>$</span>,
                    }}
                  />
                  <TextField
                    fullWidth
                    label="Other"
                    value={formatInputCurrency(newProperty.monthlyExpenses!.other)}
                    onChange={(e) => updateMonthlyExpenses('other', handleCurrencyInput(e.target.value))}
                    margin="normal"
                    InputProps={{
                      startAdornment: <span style={{ marginRight: '8px' }}>$</span>,
                    }}
                  />
                </Box>
                <Box sx={{ mt: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                  <Typography variant="h6" color="error">
                    Total Monthly Expenses: {formatCurrency(newProperty.monthlyExpenses!.total)}
                  </Typography>
                </Box>
              </Box>

              {/* Units */}
              <Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Units ({newProperty.propertyUnits.length})
                  </Typography>
                  <Button 
                    variant="outlined" 
                    size="small" 
                    onClick={addUnit}
                    startIcon={<Icons.Add />}
                  >
                    Add Unit
                  </Button>
                </Box>
                
                {newProperty.propertyUnits.map((unit, index) => (
                  <Card key={unit.id} sx={{ p: 2, mb: 2, border: '1px solid #e0e0e0' }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="subtitle2" fontWeight={600}>
                        Unit {index + 1}
                      </Typography>
                      <IconButton 
                        size="small" 
                        onClick={() => removeUnit(index)}
                        color="error"
                      >
                        <Icons.Delete />
                      </IconButton>
                    </Box>
                    
                    <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: 'repeat(2, 1fr)' }} gap={2}>
                      <FormControl fullWidth>
                        <InputLabel>Status</InputLabel>
                        <Select
                          value={unit.status}
                          onChange={(e) => updateUnit(index, 'status', e.target.value)}
                          label="Status"
                        >
                          <MenuItem value="Vacant">Vacant</MenuItem>
                          <MenuItem value="Behind On Rent">Behind On Rent</MenuItem>
                          <MenuItem value="Operational">Operational</MenuItem>
                        </Select>
                      </FormControl>
                      
                      <TextField
                        fullWidth
                        label="Monthly Rent"
                        value={formatInputCurrency(unit.rent)}
                        onChange={(e) => updateUnit(index, 'rent', handleCurrencyInput(e.target.value))}
                        InputProps={{
                          startAdornment: <span style={{ marginRight: '8px' }}>$</span>,
                        }}
                      />
                    </Box>
                    
                    <TextField
                      fullWidth
                      label="Notes"
                      value={unit.notes}
                      onChange={(e) => updateUnit(index, 'notes', e.target.value)}
                      margin="normal"
                      multiline
                      rows={2}
                    />
                  </Card>
                ))}
                
                {newProperty.propertyUnits.length === 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                    No units added yet. Click "Add Unit" to get started.
                  </Typography>
                )}
                
                <Box sx={{ mt: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                  <Typography variant="h6" color="success.main">
                    Total Actual Rent: {formatCurrency(newProperty.actualRent)}
                  </Typography>
                </Box>
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
                backgroundColor: '#e3f2fd', 
                borderRadius: 1
              }}
            >
              <Typography variant="h6" sx={{ color: '#2c3e50', fontWeight: 600 }}>
                Asset Details
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 2 }}>
              <Box>
                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>Capital Costs</Typography>
                <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: 'repeat(2, 1fr)' }} gap={2}>
                  <TextField
                    fullWidth
                    label="Closing Costs"
                    value={formatInputCurrency(newProperty.capitalCosts!.closingCosts)}
                    onChange={(e) => updateCapitalCosts('closingCosts', handleCurrencyInput(e.target.value))}
                    margin="normal"
                    InputProps={{
                      startAdornment: <span style={{ marginRight: '8px' }}>$</span>,
                    }}
                  />
                  <TextField
                    fullWidth
                    label="Upfront Repairs"
                    value={formatInputCurrency(newProperty.capitalCosts!.upfrontRepairs)}
                    onChange={(e) => updateCapitalCosts('upfrontRepairs', handleCurrencyInput(e.target.value))}
                    margin="normal"
                    InputProps={{
                      startAdornment: <span style={{ marginRight: '8px' }}>$</span>,
                    }}
                  />
                  <TextField
                    fullWidth
                    label="Down Payment"
                    value={formatInputCurrency(newProperty.capitalCosts!.downPayment)}
                    onChange={(e) => updateCapitalCosts('downPayment', handleCurrencyInput(e.target.value))}
                    margin="normal"
                    InputProps={{
                      startAdornment: <span style={{ marginRight: '8px' }}>$</span>,
                    }}
                  />
                  <TextField
                    fullWidth
                    label="Other"
                    value={formatInputCurrency(newProperty.capitalCosts!.other)}
                    onChange={(e) => updateCapitalCosts('other', handleCurrencyInput(e.target.value))}
                    margin="normal"
                    InputProps={{
                      startAdornment: <span style={{ marginRight: '8px' }}>$</span>,
                    }}
                  />
                </Box>
                <Box sx={{ mt: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                  <Typography variant="h6" color="primary">
                    Total Capital Costs: {formatCurrency(newProperty.capitalCosts!.total)}
                  </Typography>
                </Box>
              </Box>
            </AccordionDetails>
          </Accordion>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} color="inherit" sx={{ borderRadius: 2 }}>
          Cancel
        </Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          color="primary"
          sx={{ borderRadius: 2 }}
        >
          {isEditing ? 'Update' : 'Add'} Property
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PropertyDialog; 
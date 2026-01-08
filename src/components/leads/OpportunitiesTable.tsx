import React, { useState } from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Tooltip,
  IconButton,
  Box,
  Chip,
  ChipProps,
  styled,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import * as Icons from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { Property, PropertyStatus, PropertyLead } from '../../types/property';
import { SmsConversation } from '../../types/sms';
import {
  calculateRentRatio,
  calculateARVRatio,
  calculateNewLoan,
  calculateCashflow,
  calculateHoldScore,
  calculateFlipScore,
  getHoldScoreBreakdown,
  getFlipScoreBreakdown,
  calculatePerfectRentForHoldScore,
  calculatePerfectARVForFlipScore,
} from '../../utils/scoreCalculator';
import { getStatusColor } from '../../utils/statusColors';
import { StyledTableCell, StyledTableRow } from './leadsStyles';
import { hasMetadataContent, formatMetadataValue } from './leadsHelpers';
import { CashflowBreakdownTooltip } from '../shared/PropertyTooltips';
import { useTheme } from '@mui/material';

// Status chip component
interface StatusChipProps extends ChipProps {
  status: PropertyStatus;
}

const StatusChip = styled(Chip, {
  shouldForwardProp: (prop) => prop !== 'status',
})<StatusChipProps>(({ status }) => ({
  backgroundColor: getStatusColor(status),
  color: 'white',
  fontWeight: 500,
  borderRadius: '16px',
  width: '120px',
  padding: '0px',
  height: '24px',
  '& .MuiChip-label': {
    padding: '0 12px',
  }
}));

// Score color helpers
const getScoreBackgroundColor = (score: number): string => {
  if (score >= 9) return '#4CAF50';
  if (score >= 7) return '#FFC107';
  if (score >= 5) return '#FF9800';
  return '#F44336';
};

const getScoreColor = (score: number): string => {
  if (score >= 9) return '#E8F5E9';
  if (score >= 7) return '#212121';
  if (score >= 5) return '#212121';
  return '#FFEBEE';
};

const getRentRatioColor = (ratio: number): string => {
  if (ratio >= 0.01) return '#4CAF50';
  if (ratio >= 0.008) return '#FFC107';
  return '#F44336';
};

const getARVRatioColor = (ratio: number): string => {
  if (ratio <= 0.70) return '#4CAF50';
  if (ratio <= 0.80) return '#FFC107';
  return '#F44336';
};

const getCashflowColor = (cashflow: number): string => {
  if (cashflow >= 500) return '#4CAF50';
  if (cashflow >= 200) return '#FFC107';
  return '#F44336';
};

interface OpportunitiesTableProps {
  properties: Property[];
  linkedLeads: Map<string, PropertyLead>;
  conversations: SmsConversation[];
  onMessageProperty: (property: Property) => void;
  onEditProperty?: (property: Property) => void;
  onArchiveProperty?: (property: Property) => void;
  onUpdateRentcast?: (property: Property) => void;
  onSendToCalculator?: (property: Property) => void;
}

/**
 * OpportunitiesTable component - displays properties with status Opportunity, Soft Offer, or Hard Offer
 * Used in the Leads page Opportunities tab
 */
export const OpportunitiesTable: React.FC<OpportunitiesTableProps> = ({
  properties,
  linkedLeads,
  conversations,
  onMessageProperty,
  onEditProperty,
  onArchiveProperty,
  onUpdateRentcast,
  onSendToCalculator,
}) => {
  const theme = useTheme();
  const navigate = useNavigate();

  // Menu state
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, property: Property) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedProperty(property);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedProperty(null);
  };

  const handleMenuAction = (action: string) => {
    if (!selectedProperty) return;

    switch (action) {
      case 'edit':
        onEditProperty?.(selectedProperty);
        break;
      case 'archive':
        onArchiveProperty?.(selectedProperty);
        break;
      case 'updateRentcast':
        onUpdateRentcast?.(selectedProperty);
        break;
      case 'calculator':
        onSendToCalculator?.(selectedProperty);
        break;
    }
    handleMenuClose();
  };

  // Filter for opportunity statuses only
  const opportunities = properties.filter(p =>
    ['Opportunity', 'Soft Offer', 'Hard Offer'].includes(p.status)
  );

  // Sort by status order then address
  const sortedOpportunities = [...opportunities].sort((a, b) => {
    const statusOrder = { 'Opportunity': 0, 'Soft Offer': 1, 'Hard Offer': 2 };
    const orderA = statusOrder[a.status as keyof typeof statusOrder] ?? 3;
    const orderB = statusOrder[b.status as keyof typeof statusOrder] ?? 3;
    if (orderA !== orderB) return orderA - orderB;
    return a.address.localeCompare(b.address);
  });

  // Helper functions
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

  const calculateDiscount = (listingPrice: number, offerPrice: number) => {
    if (!listingPrice) return 0;
    return (listingPrice - offerPrice) / listingPrice;
  };

  const getUnreadCount = (propertyLeadId: string | null | undefined): number => {
    if (!propertyLeadId) return 0;
    const conversation = conversations.find(c => c.propertyLeadId === propertyLeadId);
    return conversation?.unreadCount || 0;
  };

  // Format metadata for tooltip
  const formatMetadataForTooltip = (metadata: string | undefined) => {
    if (!hasMetadataContent(metadata)) return null;

    try {
      const parsed: Record<string, unknown> = JSON.parse(metadata!);
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

  // Format notes tooltip showing Property.notes + linked PropertyLead.metadata
  const formatNotesForTooltip = (property: Property, linkedLead?: PropertyLead) => {
    const notes = property.notes;
    const metadata = linkedLead?.metadata;

    const hasMetadata = metadata && hasMetadataContent(metadata);

    if (!notes && !hasMetadata) return null;

    return (
      <Box>
        {notes && (
          <Box sx={{ mb: hasMetadata ? 1 : 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5, fontSize: '0.9rem' }}>
              Notes:
            </Typography>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>
              {notes}
            </Typography>
          </Box>
        )}
        {hasMetadata && (
          <Box sx={{
            borderTop: notes ? '1px solid rgba(255, 255, 255, 0.3)' : 'none',
            pt: notes ? 1 : 0
          }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5, fontSize: '0.9rem' }}>
              Lead Metadata:
            </Typography>
            {formatMetadataForTooltip(metadata)}
          </Box>
        )}
      </Box>
    );
  };

  // Check if a property has notes or linked lead metadata
  const hasNotesOrMetadata = (property: Property, linkedLead?: PropertyLead): boolean => {
    return !!(property.notes || (linkedLead?.metadata && hasMetadataContent(linkedLead.metadata)));
  };

  if (sortedOpportunities.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Icons.TrendingUp sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          No opportunities yet
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Promote leads to create opportunities
        </Typography>
      </Paper>
    );
  }

  return (
    <TableContainer
      component={Paper}
      sx={{
        width: '100%',
        border: '1px solid #e0e0e0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        '& .MuiTable-root': {
          borderCollapse: 'collapse',
        },
        '& .MuiTableRow-root:last-child .MuiTableCell-root': {
          borderBottom: 'none'
        }
      }}
    >
      <Table size="small" sx={{ width: '100%', tableLayout: 'fixed' }} padding="none">
        <TableHead>
          <TableRow>
            <StyledTableCell className="header" width="22%" sx={{ pl: 1 }}>
              <Typography variant="body2" fontWeight="bold" noWrap>Address</Typography>
            </StyledTableCell>
            <StyledTableCell className="header" width="4%" sx={{ textAlign: 'center' }}>
              <Typography variant="body2" fontWeight="bold" noWrap>Units</Typography>
            </StyledTableCell>
            <StyledTableCell className="header" width="4%" sx={{ textAlign: 'center' }}>
              <Typography variant="body2" fontWeight="bold" noWrap>SMS</Typography>
            </StyledTableCell>
            <StyledTableCell className="header" width="9%">
              <Typography variant="body2" fontWeight="bold" noWrap>Status</Typography>
            </StyledTableCell>
            <StyledTableCell className="header" width="5%" sx={{ textAlign: 'center' }}>
              <Typography variant="body2" fontWeight="bold" noWrap>Sq Ft</Typography>
            </StyledTableCell>
            <StyledTableCell className="header" width="6%">
              <Typography variant="body2" fontWeight="bold" noWrap>Offer</Typography>
            </StyledTableCell>
            <StyledTableCell className="header" width="6%">
              <Typography variant="body2" fontWeight="bold" noWrap>Rehab</Typography>
            </StyledTableCell>
            <StyledTableCell className="header" width="6%">
              <Tooltip title="Hover to see Rentcast data">
                <Typography variant="body2" fontWeight="bold" noWrap>Rent</Typography>
              </Tooltip>
            </StyledTableCell>
            <StyledTableCell className="header" width="6%">
              <Typography variant="body2" fontWeight="bold" noWrap>ARV</Typography>
            </StyledTableCell>
            <StyledTableCell className="header" width="5%" sx={{ textAlign: 'center' }}>
              <Tooltip title="Monthly Rent / (Offer Price + Rehab)">
                <Typography variant="body2" fontWeight="bold" noWrap>Rent %</Typography>
              </Tooltip>
            </StyledTableCell>
            <StyledTableCell className="header" width="5%" sx={{ textAlign: 'center' }}>
              <Tooltip title="(Offer Price + Rehab) / ARV">
                <Typography variant="body2" fontWeight="bold" noWrap>ARV %</Typography>
              </Tooltip>
            </StyledTableCell>
            <StyledTableCell className="header" width="6%" sx={{ textAlign: 'center' }}>
              <Tooltip title="Monthly cashflow after expenses and mortgage">
                <Typography variant="body2" fontWeight="bold" noWrap>Cashflow</Typography>
              </Tooltip>
            </StyledTableCell>
            <StyledTableCell className="header" width="4%" sx={{ textAlign: 'center' }}>
              <Tooltip title="Property notes and AI-generated lead data">
                <Typography variant="body2" fontWeight="bold" noWrap>Notes</Typography>
              </Tooltip>
            </StyledTableCell>
            <StyledTableCell className="header" width="6%" sx={{ textAlign: 'center' }}>
              <Typography variant="body2" fontWeight="bold" noWrap>Hold</Typography>
            </StyledTableCell>
            <StyledTableCell className="header" width="6%" sx={{ textAlign: 'center' }}>
              <Typography variant="body2" fontWeight="bold" noWrap>Flip</Typography>
            </StyledTableCell>
            <StyledTableCell className="header" width="5%" sx={{ textAlign: 'center' }}>
              <Typography variant="body2" fontWeight="bold" noWrap>Actions</Typography>
            </StyledTableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedOpportunities.map((property) => {
            const linkedLead = property.propertyLeadId
              ? linkedLeads.get(property.propertyLeadId)
              : undefined;

            return (
              <StyledTableRow key={property.id}>
                <TableCell sx={{ pl: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {property.zillowLink && (
                      <Tooltip title="Open Zillow" arrow>
                        <IconButton
                          href={property.zillowLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          size="small"
                        >
                          <Icons.OpenInNew fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    <RouterLink
                      to={`/properties/${property.id}`}
                      style={{
                        color: theme.palette.primary.main,
                        textDecoration: 'none',
                        fontWeight: 500,
                        display: 'block',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: 240
                      }}
                    >
                      {property.address}
                    </RouterLink>
                    {getUnreadCount(property.propertyLeadId) > 0 && (
                      <Tooltip title={`${getUnreadCount(property.propertyLeadId)} unread message${getUnreadCount(property.propertyLeadId) > 1 ? 's' : ''}`} arrow>
                        <Chip
                          icon={<Icons.Message fontSize="small" />}
                          label={getUnreadCount(property.propertyLeadId)}
                          size="small"
                          color="error"
                          sx={{ height: '20px', fontSize: '0.7rem', flexShrink: 0 }}
                        />
                      </Tooltip>
                    )}
                  </Box>
                </TableCell>
                <TableCell sx={{ textAlign: 'center' }}>
                  {property.units || ''}
                </TableCell>
                <TableCell sx={{ textAlign: 'center' }}>
                  {property.propertyLeadId && (
                    <Tooltip title="Send SMS Message">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          onMessageProperty(property);
                        }}
                        color="primary"
                        sx={{ padding: 0.5 }}
                      >
                        <Icons.Sms fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </TableCell>
                <TableCell>
                  <StatusChip
                    label={property.status}
                    status={property.status}
                    size="small"
                  />
                </TableCell>
                <TableCell sx={{ textAlign: 'center' }}>
                  {property.squareFootage !== null ? (
                    <Tooltip
                      title={
                        <Box sx={{ textAlign: 'left' }}>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                            Rules of Thumb
                          </Typography>
                          <Typography variant="body2">
                            ARV Guess: {formatCurrency(160 * property.squareFootage)}
                          </Typography>
                          <Typography variant="body2">
                            Rent Guess: {formatCurrency(1.1 * property.squareFootage)}
                          </Typography>
                        </Box>
                      }
                      arrow
                      placement="top"
                    >
                      <Box component="span" sx={{ cursor: 'help' }}>
                        {property.squareFootage.toLocaleString()}
                      </Box>
                    </Tooltip>
                  ) : (
                    ''
                  )}
                </TableCell>
                <TableCell>
                  <Tooltip
                    title={
                      <div>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          Listing Price: {formatCurrency(property.listingPrice)}
                        </Typography>
                        <Typography variant="body2">
                          Discount: {formatPercentage(calculateDiscount(property.listingPrice, property.offerPrice))}
                        </Typography>
                      </div>
                    }
                    arrow
                    placement="top"
                  >
                    <Box component="span">
                      {formatCurrency(property.offerPrice)}
                    </Box>
                  </Tooltip>
                </TableCell>
                <TableCell>{formatCurrency(property.rehabCosts)}</TableCell>
                <TableCell>
                  <Tooltip
                    title={
                      property.hasRentcastData ? (
                        <div>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            Rentcast Rent: {formatCurrency(property.rentCastEstimates.rent)}
                          </Typography>
                          <Typography variant="body2">
                            Range: {formatCurrency(property.rentCastEstimates.rentLow)} - {formatCurrency(property.rentCastEstimates.rentHigh)}
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', mt: 1 }}>
                            Rentcast ARV: {formatCurrency(property.rentCastEstimates.price)}
                          </Typography>
                          <Typography variant="body2">
                            Range: {formatCurrency(property.rentCastEstimates.priceLow)} - {formatCurrency(property.rentCastEstimates.priceHigh)}
                          </Typography>
                        </div>
                      ) : (
                        <div>
                          <Typography variant="body2">
                            No Rentcast data available
                          </Typography>
                        </div>
                      )
                    }
                    arrow
                    placement="top"
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {formatCurrency(property.potentialRent)}
                      {property.hasRentcastData && (
                        <Icons.Check color="success" sx={{ fontSize: 14, ml: 0.5 }} />
                      )}
                    </Box>
                  </Tooltip>
                </TableCell>
                <TableCell>{formatCurrency(property.arv)}</TableCell>
                <TableCell sx={{ textAlign: 'center' }}>
                  <Typography sx={{
                    color: getRentRatioColor(calculateRentRatio(property.potentialRent, property.offerPrice, property.rehabCosts))
                  }}>
                    {formatPercentage(calculateRentRatio(property.potentialRent, property.offerPrice, property.rehabCosts))}
                  </Typography>
                </TableCell>
                <TableCell sx={{ textAlign: 'center' }}>
                  <Typography sx={{
                    color: getARVRatioColor(calculateARVRatio(property.offerPrice, property.rehabCosts, property.arv))
                  }}>
                    {formatPercentage(calculateARVRatio(property.offerPrice, property.rehabCosts, property.arv))}
                  </Typography>
                </TableCell>
                {/* Cashflow Column */}
                <TableCell sx={{ textAlign: 'center' }}>
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
                    <Box component="span" sx={{
                      color: getCashflowColor(calculateCashflow(property.potentialRent, property.offerPrice, calculateNewLoan(property.offerPrice, property.rehabCosts, property.arv)))
                    }}>
                      {formatCurrency(calculateCashflow(property.potentialRent, property.offerPrice, calculateNewLoan(property.offerPrice, property.rehabCosts, property.arv)))}
                    </Box>
                  </Tooltip>
                </TableCell>
                {/* Notes Column */}
                <TableCell sx={{ textAlign: 'center' }}>
                  {hasNotesOrMetadata(property, linkedLead) ? (
                    <Tooltip
                      title={formatNotesForTooltip(property, linkedLead)}
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
                      <IconButton size="small" sx={{ p: 0.5 }}>
                        <Icons.Notes fontSize="small" color="action" />
                      </IconButton>
                    </Tooltip>
                  ) : (
                    <Typography variant="body2" color="text.secondary">-</Typography>
                  )}
                </TableCell>
                <TableCell sx={{ textAlign: 'center' }}>
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
                      p: '2px 6px',
                      borderRadius: 2,
                      fontWeight: 'bold',
                      width: '40px',
                      height: '24px'
                    }}>
                      {calculateHoldScore(property)}/10
                    </Box>
                  </Tooltip>
                </TableCell>
                <TableCell sx={{ textAlign: 'center' }}>
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
                      p: '2px 6px',
                      borderRadius: 2,
                      fontWeight: 'bold',
                      width: '40px',
                      height: '24px'
                    }}>
                      {calculateFlipScore(property)}/10
                    </Box>
                  </Tooltip>
                </TableCell>
                {/* Actions Column */}
                <TableCell sx={{ textAlign: 'center' }}>
                  <Tooltip title="Actions">
                    <IconButton
                      onClick={(e) => handleMenuOpen(e, property)}
                      size="small"
                      sx={{
                        backgroundColor: 'rgba(25, 118, 210, 0.08)',
                        padding: 2,
                        width: '20px',
                        height: '20px',
                        '&:hover': {
                          backgroundColor: 'rgba(25, 118, 210, 0.2)'
                        }
                      }}
                    >
                      <Icons.MoreVert sx={{ fontSize: '0.75rem' }} />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </StyledTableRow>
            );
          })}
        </TableBody>
      </Table>

      {/* Actions Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={() => handleMenuAction('edit')}>
          <ListItemIcon>
            <Icons.Edit fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit Property</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleMenuAction('archive')}>
          <ListItemIcon>
            <Icons.Archive fontSize="small" />
          </ListItemIcon>
          <ListItemText>Archive Property</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => handleMenuAction('updateRentcast')}
          disabled={selectedProperty?.hasRentcastData}
        >
          <ListItemIcon>
            {selectedProperty?.hasRentcastData ? (
              <Icons.CheckCircle fontSize="small" color="success" />
            ) : (
              <Icons.Refresh fontSize="small" />
            )}
          </ListItemIcon>
          <ListItemText>Update Rentcast Data</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleMenuAction('calculator')}>
          <ListItemIcon>
            <Icons.Calculate fontSize="small" />
          </ListItemIcon>
          <ListItemText>Send to Calculator</ListItemText>
        </MenuItem>
      </Menu>
    </TableContainer>
  );
};

export default OpportunitiesTable;

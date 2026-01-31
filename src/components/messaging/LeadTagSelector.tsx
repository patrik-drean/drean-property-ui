import React, { useState } from 'react';
import {
  Box,
  Chip,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  ListItemText,
  ListItemIcon,
  Typography,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Close as CloseIcon,
  Home as HomeIcon,
  AutoAwesome as AutoIcon,
} from '@mui/icons-material';
import { ConversationLeadTag, SuggestedLead } from '../../types/sms';
import { smsService } from '../../services/smsService';

interface LeadTagSelectorProps {
  conversationId: string;
  taggedLeads: ConversationLeadTag[];
  onTagsChanged: () => void;
  onOpenLeadDetail?: (leadId: string) => void;
}

export const LeadTagSelector: React.FC<LeadTagSelectorProps> = ({
  conversationId,
  taggedLeads,
  onTagsChanged,
  onOpenLeadDetail,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [suggestedLeads, setSuggestedLeads] = useState<SuggestedLead[]>([]);
  const [loading, setLoading] = useState(false);

  const handleOpenMenu = async (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    setLoading(true);
    try {
      const suggestions = await smsService.getSuggestedLeads(conversationId);
      setSuggestedLeads(suggestions);
    } catch (error) {
      console.error('Failed to load suggested leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleTagLead = async (leadId: string) => {
    try {
      await smsService.tagLeadToConversation(conversationId, leadId);
      onTagsChanged();
      handleCloseMenu();
    } catch (error) {
      console.error('Failed to tag lead:', error);
    }
  };

  const handleUntagLead = async (leadId: string) => {
    try {
      await smsService.untagLeadFromConversation(conversationId, leadId);
      onTagsChanged();
    } catch (error) {
      console.error('Failed to untag lead:', error);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  const handleChipDoubleClick = (leadId: string) => {
    onOpenLeadDetail?.(leadId);
  };

  const availableSuggestions = suggestedLeads.filter(s => !s.alreadyTagged);

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, alignItems: 'center' }}>
      {taggedLeads.map((tag) => (
        <Tooltip
          key={tag.leadId}
          title={
            <Box>
              <Typography variant="body2">{formatPrice(tag.listingPrice)}</Typography>
              {tag.isAutoTagged && (
                <Typography variant="caption" sx={{ opacity: 0.7 }}>
                  Auto-tagged by phone match
                </Typography>
              )}
              <Typography variant="caption" sx={{ display: 'block', opacity: 0.7, mt: 0.5 }}>
                Double-click to view details
              </Typography>
            </Box>
          }
          arrow
        >
          <Chip
            size="small"
            icon={tag.isAutoTagged ? <AutoIcon fontSize="small" /> : <HomeIcon fontSize="small" />}
            label={tag.address}
            onDelete={() => handleUntagLead(tag.leadId)}
            deleteIcon={<CloseIcon fontSize="small" />}
            onDoubleClick={() => handleChipDoubleClick(tag.leadId)}
            sx={{
              cursor: 'pointer',
              bgcolor: tag.isAutoTagged ? 'rgba(139, 92, 246, 0.2)' : 'rgba(96, 165, 250, 0.2)',
              color: tag.isAutoTagged ? '#a78bfa' : '#60a5fa',
              borderColor: tag.isAutoTagged ? '#8b5cf6' : '#60a5fa',
              '& .MuiChip-deleteIcon': {
                color: tag.isAutoTagged ? '#a78bfa' : '#60a5fa',
                '&:hover': {
                  color: '#f87171',
                },
              },
              '& .MuiChip-icon': {
                color: tag.isAutoTagged ? '#a78bfa' : '#60a5fa',
              },
            }}
            variant="outlined"
          />
        </Tooltip>
      ))}

      <Tooltip title="Tag a lead to this conversation" arrow>
        <IconButton
          size="small"
          onClick={handleOpenMenu}
          sx={{
            width: 24,
            height: 24,
            bgcolor: 'rgba(96, 165, 250, 0.15)',
            color: '#60a5fa',
            '&:hover': {
              bgcolor: 'rgba(96, 165, 250, 0.25)',
            },
          }}
        >
          <AddIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        PaperProps={{
          sx: {
            bgcolor: '#161b22',
            border: '1px solid #30363d',
            minWidth: 280,
          },
        }}
      >
        {loading ? (
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress size={24} />
          </Box>
        ) : availableSuggestions.length > 0 ? (
          <>
            <Typography
              variant="caption"
              sx={{ px: 2, py: 1, display: 'block', color: '#8b949e' }}
            >
              Suggested leads (matching phone)
            </Typography>
            <Divider sx={{ borderColor: '#30363d' }} />
            {availableSuggestions.map((lead) => (
              <MenuItem
                key={lead.id}
                onClick={() => handleTagLead(lead.id)}
                sx={{
                  color: '#f0f6fc',
                  '&:hover': {
                    bgcolor: 'rgba(96, 165, 250, 0.1)',
                  },
                }}
              >
                <ListItemIcon>
                  <HomeIcon fontSize="small" sx={{ color: '#60a5fa' }} />
                </ListItemIcon>
                <ListItemText
                  primary={lead.address}
                  secondary={
                    <Box component="span" sx={{ display: 'flex', flexDirection: 'column' }}>
                      <span>{formatPrice(lead.listingPrice)}</span>
                      <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>
                        Added {formatDate(lead.createdAt)}
                      </span>
                    </Box>
                  }
                  primaryTypographyProps={{ sx: { color: '#f0f6fc' } }}
                  secondaryTypographyProps={{ sx: { color: '#8b949e' }, component: 'div' }}
                />
              </MenuItem>
            ))}
          </>
        ) : (
          <Box sx={{ p: 2 }}>
            <Typography variant="body2" sx={{ color: '#8b949e' }}>
              No suggested leads found.
            </Typography>
            <Typography variant="caption" sx={{ color: '#6e7681', display: 'block', mt: 1 }}>
              Leads will appear here if their phone number matches this conversation.
            </Typography>
          </Box>
        )}
      </Menu>
    </Box>
  );
};

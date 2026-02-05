import React from 'react';
import { Box, Typography } from '@mui/material';
import { Inbox as EmptyIcon } from '@mui/icons-material';
import { QueueLead, QueueType } from '../../../types/queue';
import { QueueCard } from './QueueCard';

interface QueueCardListProps {
  leads: QueueLead[];
  selectedCardId: string | null;
  queueType: QueueType;
  onCardSelect: (id: string) => void;
  /** Opens detail panel for lead, optionally with gallery shown */
  onViewDetails: (lead: QueueLead, showGallery?: boolean) => void;
  onDone: (lead: QueueLead) => void;
  onFollowUp: (lead: QueueLead) => void;
  onArchive: (lead: QueueLead) => void;
  /** Whether a search is currently active (for empty state messaging) */
  hasActiveSearch?: boolean;
}

const getEmptyStateMessage = (queueType: QueueType, hasActiveSearch: boolean): { title: string; subtitle: string } => {
  // If search is active and no results, show search-specific message
  if (hasActiveSearch && (queueType === 'all' || queueType === 'archived')) {
    return {
      title: 'No leads match your search',
      subtitle: 'Try a different search term or clear the search.',
    };
  }

  switch (queueType) {
    case 'action_now':
      return {
        title: 'No leads need action right now',
        subtitle: 'Great job! Check back later for new high-priority leads.',
      };
    case 'follow_up':
      return {
        title: 'No follow-ups due today',
        subtitle: 'You\'re all caught up on follow-ups!',
      };
    case 'negotiating':
      return {
        title: 'No active negotiations',
        subtitle: 'Start conversations to move leads into negotiation.',
      };
    case 'archived':
      return {
        title: 'No archived leads',
        subtitle: 'Archived leads will appear here.',
      };
    case 'all':
    default:
      return {
        title: 'No leads found',
        subtitle: 'Add new leads to get started.',
      };
  }
};

/**
 * QueueCardList - renders the list of lead cards with empty state handling
 */
export const QueueCardList: React.FC<QueueCardListProps> = ({
  leads,
  selectedCardId,
  queueType,
  onCardSelect,
  onViewDetails,
  onDone,
  onFollowUp,
  onArchive,
  hasActiveSearch = false,
}) => {
  if (leads.length === 0) {
    const emptyState = getEmptyStateMessage(queueType, hasActiveSearch);
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          py: 8,
          px: 4,
          bgcolor: '#161b22',
          borderRadius: 2,
          border: '1px solid #30363d',
        }}
      >
        <EmptyIcon sx={{ fontSize: 48, color: '#30363d', mb: 2 }} />
        <Typography
          variant="h6"
          sx={{ color: '#f0f6fc', fontWeight: 600, textAlign: 'center', mb: 1 }}
        >
          {emptyState.title}
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: '#8b949e', textAlign: 'center', maxWidth: 300 }}
        >
          {emptyState.subtitle}
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          sm: '1fr',
          md: 'repeat(2, 1fr)',
          lg: 'repeat(3, 1fr)',
        },
        gap: 2,
      }}
    >
      {leads.map((lead) => (
        <QueueCard
          key={lead.id}
          lead={lead}
          isSelected={selectedCardId === lead.id}
          onSelect={() => onCardSelect(lead.id)}
          onViewDetails={(showGallery) => onViewDetails(lead, showGallery)}
          onDone={() => onDone(lead)}
          onFollowUp={() => onFollowUp(lead)}
          onArchive={() => onArchive(lead)}
        />
      ))}
    </Box>
  );
};

export default QueueCardList;

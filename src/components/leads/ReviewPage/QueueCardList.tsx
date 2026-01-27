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
  onViewDetails: (lead: QueueLead) => void;
  onDone: (lead: QueueLead) => void;
  onSkip: (lead: QueueLead) => void;
  onArchive: (lead: QueueLead) => void;
}

const getEmptyStateMessage = (queueType: QueueType): { title: string; subtitle: string } => {
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
  onSkip,
  onArchive,
}) => {
  if (leads.length === 0) {
    const emptyState = getEmptyStateMessage(queueType);
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
          onViewDetails={() => onViewDetails(lead)}
          onDone={() => onDone(lead)}
          onSkip={() => onSkip(lead)}
          onArchive={() => onArchive(lead)}
        />
      ))}
    </Box>
  );
};

export default QueueCardList;

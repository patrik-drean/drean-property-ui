import React, { useEffect } from 'react';
import { Tabs, Tab, Box, Typography } from '@mui/material';
import { QueueType, QueueCounts } from '../../../types/queue';

const QUEUE_STORAGE_KEY = 'propguide-selected-queue';

interface TabLabelProps {
  label: string;
  count: number;
  color: string;
}

const TabLabel: React.FC<TabLabelProps> = ({ label, count, color }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
    <Typography variant="body2" sx={{ fontWeight: 500 }}>
      {label}
    </Typography>
    <Box
      sx={{
        bgcolor: color,
        color: '#ffffff',
        borderRadius: '10px',
        px: 1,
        py: 0.25,
        minWidth: 20,
        textAlign: 'center',
      }}
    >
      <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>
        {count}
      </Typography>
    </Box>
  </Box>
);

interface QueueTabsProps {
  selectedQueue: QueueType;
  onQueueChange: (queue: QueueType) => void;
  counts: QueueCounts;
}

/**
 * QueueTabs - navigation tabs for the different lead queues
 *
 * Tabs:
 * - Action Now (red badge): New high-score leads needing immediate action
 * - Follow-Up Today (yellow badge): Leads with follow-ups due
 * - Negotiating (blue badge): Active negotiations
 * - All Leads: Complete lead list
 *
 * Selection persists to localStorage
 */
export const QueueTabs: React.FC<QueueTabsProps> = ({
  selectedQueue,
  onQueueChange,
  counts,
}) => {
  // Load saved queue selection from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(QUEUE_STORAGE_KEY) as QueueType | null;
    if (saved && ['action_now', 'follow_up', 'negotiating', 'all', 'archived'].includes(saved)) {
      onQueueChange(saved);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount - intentionally omit onQueueChange to prevent loops

  // Save queue selection to localStorage
  const handleQueueChange = (_: React.SyntheticEvent, value: QueueType) => {
    localStorage.setItem(QUEUE_STORAGE_KEY, value);
    onQueueChange(value);
  };

  return (
    <Tabs
      value={selectedQueue}
      onChange={handleQueueChange}
      aria-label="Lead queue tabs"
      sx={{
        bgcolor: '#161b22',
        borderRadius: 2,
        p: 0.5,
        mb: 2,
        minHeight: 48,
        '& .MuiTabs-flexContainer': {
          gap: 0.5,
        },
        '& .MuiTab-root': {
          color: '#8b949e',
          fontWeight: 500,
          minHeight: 40,
          borderRadius: 1.5,
          textTransform: 'none',
          px: 2,
          transition: 'all 0.15s ease',
          '&:hover': {
            bgcolor: 'rgba(255, 255, 255, 0.05)',
          },
          '&.Mui-selected': {
            color: '#f0f6fc',
            bgcolor: '#21262d',
          },
        },
        '& .MuiTabs-indicator': {
          display: 'none',
        },
      }}
    >
      <Tab
        value="action_now"
        label={<TabLabel label="Action Now" count={counts.action_now} color="#f87171" />}
        aria-label={`Action Now queue with ${counts.action_now} leads`}
      />
      <Tab
        value="follow_up"
        label={<TabLabel label="Follow-Up Today" count={counts.follow_up} color="#fbbf24" />}
        aria-label={`Follow-up Today queue with ${counts.follow_up} leads`}
      />
      <Tab
        value="negotiating"
        label={<TabLabel label="Negotiating" count={counts.negotiating} color="#60a5fa" />}
        aria-label={`Negotiating queue with ${counts.negotiating} leads`}
      />
      <Tab
        value="all"
        label={
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            All Leads ({counts.all})
          </Typography>
        }
        aria-label={`All leads with ${counts.all} total`}
      />
      <Tab
        value="archived"
        label={
          <Typography variant="body2" sx={{ fontWeight: 500, color: '#6e7681' }}>
            Archived ({counts.archived})
          </Typography>
        }
        aria-label={`Archived leads with ${counts.archived} total`}
      />
    </Tabs>
  );
};

export default QueueTabs;

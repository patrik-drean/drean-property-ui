import React, { useState, useMemo, useCallback } from 'react';
import { Box, Snackbar, Alert } from '@mui/material';
import { QueueType, QueueLead, LeadQueueStatus } from '../../../types/queue';
import { useMockLeadData, filterLeadsByQueue, sortLeadsByPriority } from '../../../hooks/useMockLeadData';
import { useKeyboardShortcuts } from '../../../hooks/useKeyboardShortcuts';
import { PageHeader } from './PageHeader';
import { QueueTabs } from './QueueTabs';
import { QueueCardList } from './QueueCardList';
import { ProgressFooter } from './ProgressFooter';
import { LeadDetailPanel } from '../DetailPanel';

interface ReviewPageProps {}

/**
 * ReviewPage - the main priority queue interface for lead management
 *
 * Features:
 * - Queue tabs for different lead categories (Action Now, Follow-Up, Negotiating, All)
 * - Lead cards with priority badges, metrics, and quick actions
 * - Keyboard navigation (j/k for next/prev, Enter for details, t for template)
 * - Progress tracking for daily goals
 *
 * Note: Currently uses mocked data. Backend integration comes in a later task.
 */
export const ReviewPage: React.FC<ReviewPageProps> = () => {
  const [selectedQueue, setSelectedQueue] = useState<QueueType>('action_now');
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [detailPanelOpen, setDetailPanelOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'info' | 'warning' | 'error';
  }>({ open: false, message: '', severity: 'info' });

  // Mock data hook - will be replaced with real API calls later
  const { leads, queueCounts, todayProgress, markAsDone, markAsSkip, archiveLead } =
    useMockLeadData();

  // Filter and sort leads for the selected queue
  const filteredLeads = useMemo(() => {
    const filtered = filterLeadsByQueue(leads, selectedQueue);
    return sortLeadsByPriority(filtered);
  }, [leads, selectedQueue]);

  // Find the index of the currently selected card
  const selectedCardIndex = useMemo(() => {
    if (!selectedCardId) return -1;
    return filteredLeads.findIndex((l) => l.id === selectedCardId);
  }, [filteredLeads, selectedCardId]);

  // Auto-select first card if none selected and leads exist
  React.useEffect(() => {
    if (filteredLeads.length > 0 && !selectedCardId) {
      setSelectedCardId(filteredLeads[0].id);
    } else if (filteredLeads.length === 0) {
      setSelectedCardId(null);
    }
  }, [filteredLeads, selectedCardId]);

  // Keyboard navigation handlers
  const selectNextCard = useCallback(() => {
    if (filteredLeads.length === 0) return;
    const nextIndex = Math.min(selectedCardIndex + 1, filteredLeads.length - 1);
    setSelectedCardId(filteredLeads[nextIndex].id);
  }, [filteredLeads, selectedCardIndex]);

  const selectPrevCard = useCallback(() => {
    if (filteredLeads.length === 0) return;
    const prevIndex = Math.max(selectedCardIndex - 1, 0);
    setSelectedCardId(filteredLeads[prevIndex].id);
  }, [filteredLeads, selectedCardIndex]);

  // Get the currently selected lead object
  const selectedLead = useMemo(() => {
    if (!selectedCardId) return null;
    return filteredLeads.find((l) => l.id === selectedCardId) || null;
  }, [filteredLeads, selectedCardId]);

  const openDetailPanel = useCallback(() => {
    if (selectedCardId) {
      setDetailPanelOpen(true);
    }
  }, [selectedCardId]);

  const closeDetailPanel = useCallback(() => {
    setDetailPanelOpen(false);
  }, []);

  // Navigate to previous lead in the detail panel
  const navigateToPrevLead = useCallback(() => {
    if (selectedCardIndex > 0) {
      setSelectedCardId(filteredLeads[selectedCardIndex - 1].id);
    }
  }, [filteredLeads, selectedCardIndex]);

  // Navigate to next lead in the detail panel
  const navigateToNextLead = useCallback(() => {
    if (selectedCardIndex < filteredLeads.length - 1) {
      setSelectedCardId(filteredLeads[selectedCardIndex + 1].id);
    }
  }, [filteredLeads, selectedCardIndex]);

  const sendTemplate = useCallback(() => {
    if (selectedCardId) {
      // TODO: Implement template sending with backend
      showSnackbar('Template sent! (mock)', 'success');
    }
  }, [selectedCardId]);

  const handleDone = useCallback(() => {
    if (selectedCardId) {
      markAsDone(selectedCardId);
      showSnackbar('Marked as done', 'success');
    }
  }, [selectedCardId, markAsDone]);

  const handleSkip = useCallback(() => {
    if (selectedCardId) {
      markAsSkip(selectedCardId);
      showSnackbar('Skipped for tomorrow', 'info');
    }
  }, [selectedCardId, markAsSkip]);

  const handleArchive = useCallback(() => {
    if (selectedCardId) {
      archiveLead(selectedCardId);
      showSnackbar('Lead archived', 'info');
    }
  }, [selectedCardId, archiveLead]);

  // Register keyboard shortcuts (disabled when detail panel is open - it handles its own shortcuts)
  useKeyboardShortcuts(
    {
      onNext: selectNextCard,
      onPrev: selectPrevCard,
      onEnter: openDetailPanel,
      onTemplate: sendTemplate,
      onDone: handleDone,
      onSkip: handleSkip,
      onArchive: handleArchive,
    },
    !detailPanelOpen
  );

  // Snackbar helper
  const showSnackbar = (
    message: string,
    severity: 'success' | 'info' | 'warning' | 'error'
  ) => {
    setSnackbar({ open: true, message, severity });
  };

  // Action handlers for individual cards
  const handleViewDetails = (lead: QueueLead) => {
    setSelectedCardId(lead.id);
    setDetailPanelOpen(true);
  };

  // Handle sending message from detail panel
  const handleSendMessage = (message: string) => {
    showSnackbar(`Message sent! (mock)`, 'success');
    if (selectedCardId) {
      markAsDone(selectedCardId);
    }
  };

  // Handle status change from detail panel
  const handleStatusChange = (status: LeadQueueStatus) => {
    showSnackbar(`Status updated to ${status}`, 'success');
  };

  // Handle actions from detail panel
  const handlePanelAction = (action: string) => {
    switch (action) {
      case 'markContacted':
        if (selectedCardId) {
          markAsDone(selectedCardId);
          showSnackbar('Marked as contacted', 'success');
        }
        break;
      case 'scheduleFollowUp':
        showSnackbar('Follow-up scheduled (mock)', 'info');
        break;
      case 'archive':
        if (selectedCardId) {
          archiveLead(selectedCardId);
          showSnackbar('Lead archived', 'info');
          setDetailPanelOpen(false);
        }
        break;
      case 'promote':
        showSnackbar('Promoted to opportunity (mock)', 'success');
        break;
      case 'editArv':
      case 'editRehab':
        showSnackbar('Inline editing coming in TASK-082', 'info');
        break;
      default:
        showSnackbar(`Action: ${action}`, 'info');
    }
  };

  // Handle notes change from detail panel
  const handleNotesChange = (notes: string) => {
    showSnackbar('Notes saved (mock)', 'success');
  };

  const handleCardDone = (lead: QueueLead) => {
    markAsDone(lead.id);
    showSnackbar('Marked as done', 'success');
  };

  const handleCardSkip = (lead: QueueLead) => {
    markAsSkip(lead.id);
    showSnackbar('Skipped for tomorrow', 'info');
  };

  const handleCardArchive = (lead: QueueLead) => {
    archiveLead(lead.id);
    showSnackbar('Lead archived', 'info');
  };

  return (
    <Box
      sx={{
        bgcolor: '#0d1117',
        minHeight: 'calc(100vh - 64px)',
        // Negative margins to extend bg to edges, compensating for Navigation Container padding + Toolbar mb
        mx: { xs: -1, sm: -2, md: -3 },
        mt: { xs: -3, sm: -4, md: -5 },
        p: { xs: 2, sm: 3 },
        pb: '100px', // Space for fixed footer
      }}
    >
      <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
        <PageHeader todayProgress={todayProgress} />

        <QueueTabs
          selectedQueue={selectedQueue}
          onQueueChange={setSelectedQueue}
          counts={queueCounts}
        />

        <QueueCardList
          leads={filteredLeads}
          selectedCardId={selectedCardId}
          queueType={selectedQueue}
          onCardSelect={(id) => setSelectedCardId(id)}
          onViewDetails={handleViewDetails}
          onDone={handleCardDone}
          onSkip={handleCardSkip}
          onArchive={handleCardArchive}
        />
      </Box>

      <ProgressFooter progress={todayProgress} isConnected={true} />

      {/* Lead Detail Panel */}
      <LeadDetailPanel
        open={detailPanelOpen}
        lead={selectedLead}
        onClose={closeDetailPanel}
        onNavigatePrev={navigateToPrevLead}
        onNavigateNext={navigateToNextLead}
        isFirst={selectedCardIndex === 0}
        isLast={selectedCardIndex === filteredLeads.length - 1}
        onSendMessage={handleSendMessage}
        onStatusChange={handleStatusChange}
        onAction={handlePanelAction}
        onNotesChange={handleNotesChange}
      />

      {/* Feedback snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ mb: 8 }} // Above the fixed footer
      >
        <Alert
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          severity={snackbar.severity}
          sx={{
            bgcolor: snackbar.severity === 'success' ? '#238636' : undefined,
            color: snackbar.severity === 'success' ? '#ffffff' : undefined,
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ReviewPage;

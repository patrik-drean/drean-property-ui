import React, { useState, useMemo, useCallback } from 'react';
import { Box, Snackbar, Alert, CircularProgress, Typography } from '@mui/material';
import { QueueLead, LeadQueueStatus } from '../../../types/queue';
import { useLeadQueue } from '../../../hooks/useLeadQueue';
import { sortLeadsByPriority } from '../../../hooks/useMockLeadData';
import { useKeyboardShortcuts } from '../../../hooks/useKeyboardShortcuts';
import { PageHeader } from './PageHeader';
import { QueueTabs } from './QueueTabs';
import { QueueCardList } from './QueueCardList';
import { LeadDetailPanel } from '../DetailPanel';
import { AddLeadModal } from './AddLeadModal';
import { IngestLeadResponse } from '../../../services/leadQueueService';

interface ReviewPageProps {}

/**
 * ReviewPage - the main priority queue interface for lead management
 *
 * Features:
 * - Queue tabs for different lead categories (Action Now, Follow-Up, Negotiating, All)
 * - Lead cards with priority badges, metrics, and quick actions
 * - Keyboard navigation (j/k for next/prev, Enter for details, t for template)
 * - Real-time updates via WebSocket
 * - Optimistic UI updates with error rollback
 */
export const ReviewPage: React.FC<ReviewPageProps> = () => {
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [detailPanelOpen, setDetailPanelOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'info' | 'warning' | 'error';
  }>({ open: false, message: '', severity: 'info' });
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Snackbar helper
  const showSnackbar = useCallback((
    message: string,
    severity: 'success' | 'info' | 'warning' | 'error'
  ) => {
    setSnackbar({ open: true, message, severity });
  }, []);

  // Real API hook with WebSocket integration
  const {
    leads,
    queueCounts,
    selectedQueue,
    loading,
    error,
    changeQueue,
    markAsDone,
    markAsSkip,
    archiveLead,
    deleteLeadPermanently,
    updateEvaluation,
    updateLeadComparables,
    updateNotes,
    scheduleFollowUp,
    cancelFollowUp,
  } = useLeadQueue({
    initialQueueType: 'action_now',
    onNotification: showSnackbar,
  });

  // Sort leads by priority (backend already filters by queue type)
  const filteredLeads = useMemo(() => {
    return sortLeadsByPriority(leads);
  }, [leads]);

  // Find the index of the currently selected card
  const selectedCardIndex = useMemo(() => {
    if (!selectedCardId) return -1;
    return filteredLeads.findIndex((l) => l.id === selectedCardId);
  }, [filteredLeads, selectedCardId]);

  // Track the last valid index for maintaining position when lead is removed
  const lastValidIndexRef = React.useRef<number>(0);

  // Update the last valid index when we have a valid selection
  React.useEffect(() => {
    if (selectedCardIndex >= 0) {
      lastValidIndexRef.current = selectedCardIndex;
    }
  }, [selectedCardIndex]);

  // Auto-select: first card if none selected, or next card if current was removed
  React.useEffect(() => {
    if (filteredLeads.length === 0) {
      setSelectedCardId(null);
      return;
    }

    // If no selection or selected card was removed (not found in list)
    if (!selectedCardId || selectedCardIndex === -1) {
      // Try to select the card at the same position, or the last one if we're past the end
      const targetIndex = Math.min(lastValidIndexRef.current, filteredLeads.length - 1);
      setSelectedCardId(filteredLeads[targetIndex].id);
    }
  }, [filteredLeads, selectedCardId, selectedCardIndex]);

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
  }, [selectedCardId, showSnackbar]);

  const handleDone = useCallback(() => {
    if (selectedCardId) {
      markAsDone(selectedCardId);
      // Notification is shown by the hook via onNotification callback
    }
  }, [selectedCardId, markAsDone]);

  const handleSkip = useCallback(() => {
    if (selectedCardId) {
      markAsSkip(selectedCardId);
      // Notification is shown by the hook via onNotification callback
    }
  }, [selectedCardId, markAsSkip]);

  const handleArchive = useCallback(() => {
    if (selectedCardId) {
      archiveLead(selectedCardId);
      // Notification is shown by the hook via onNotification callback
    }
  }, [selectedCardId, archiveLead]);

  // Handle follow-up shortcut (f) - schedules 2-day follow-up
  const handleFollowUp = useCallback(() => {
    if (selectedCardId) {
      const followUpDate = new Date();
      followUpDate.setDate(followUpDate.getDate() + 2);
      scheduleFollowUp(selectedCardId, followUpDate.toISOString().split('T')[0]);
    }
  }, [selectedCardId, scheduleFollowUp]);

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
      onFollowUp: handleFollowUp,
    },
    !detailPanelOpen
  );

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
  const handlePanelAction = (action: string, data?: any) => {
    switch (action) {
      case 'markContacted':
        if (selectedCardId) {
          markAsDone(selectedCardId);
          // Notification shown by hook via onNotification callback
        }
        break;
      case 'scheduleFollowUp':
        if (selectedCardId && data?.followUpDate) {
          scheduleFollowUp(selectedCardId, data.followUpDate);
          // Notification shown by hook via onNotification callback
        }
        break;
      case 'archive':
        if (selectedCardId) {
          archiveLead(selectedCardId);
          // Notification shown by hook via onNotification callback
          setDetailPanelOpen(false);
        }
        break;
      case 'cancelFollowUp':
        if (selectedCardId) {
          cancelFollowUp(selectedCardId);
          // Notification shown by hook via onNotification callback
        }
        break;
      case 'promote':
        showSnackbar('Promoted to opportunity (mock)', 'success');
        break;
      case 'editArv':
      case 'editRehab':
        // Inline editing is now implemented in EvaluationSection
        break;
      default:
        showSnackbar(`Action: ${action}`, 'info');
    }
  };

  // Handle notes change from detail panel
  const handleNotesChange = (notes: string) => {
    if (selectedCardId) {
      updateNotes(selectedCardId, notes);
    }
  };

  const handleCardDone = (lead: QueueLead) => {
    markAsDone(lead.id);
    // Notification shown by hook via onNotification callback
  };

  const handleCardSkip = (lead: QueueLead) => {
    markAsSkip(lead.id);
    // Notification shown by hook via onNotification callback
  };

  const handleCardArchive = (lead: QueueLead) => {
    archiveLead(lead.id);
    // Notification shown by hook via onNotification callback
  };

  // Handle permanent delete from detail panel
  const handleDeletePermanently = useCallback(async () => {
    if (!selectedCardId) return;
    setDeleteLoading(true);
    try {
      await deleteLeadPermanently(selectedCardId);
      setDetailPanelOpen(false);
    } catch {
      // Error is handled by hook, loading state needs to be reset
    } finally {
      setDeleteLoading(false);
    }
  }, [selectedCardId, deleteLeadPermanently]);

  // Handle successful lead addition
  const handleAddLeadSuccess = useCallback((response: IngestLeadResponse) => {
    if (response.wasConsolidated) {
      const priceInfo = response.consolidation?.isPriceDropped
        ? ` (Price dropped ${Math.abs(response.consolidation.priceChangePercent || 0).toFixed(1)}%)`
        : '';
      showSnackbar(`Lead merged with existing record${priceInfo}`, 'info');
    } else {
      showSnackbar(`Lead added with score ${response.evaluation.score}`, 'success');
    }
    // The lead will appear in the queue via WebSocket update or next fetch
  }, [showSnackbar]);

  return (
    <Box
      sx={{
        bgcolor: '#0d1117',
        minHeight: 'calc(100vh - 64px)',
        // Negative margins to extend bg to edges, compensating for Navigation Container padding + Toolbar mb
        mx: { xs: -1, sm: -2, md: -3 },
        mt: { xs: -3, sm: -4, md: -5 },
        p: { xs: 2, sm: 3 },
      }}
    >
      <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
        <PageHeader onAddLead={() => setAddModalOpen(true)} />

        <QueueTabs
          selectedQueue={selectedQueue}
          onQueueChange={changeQueue}
          counts={queueCounts}
        />

        {/* Loading State */}
        {loading && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              py: 8,
            }}
          >
            <CircularProgress sx={{ color: '#58a6ff', mb: 2 }} />
            <Typography sx={{ color: '#8b949e' }}>Loading leads...</Typography>
          </Box>
        )}

        {/* Error State */}
        {error && !loading && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              py: 8,
            }}
          >
            <Typography sx={{ color: '#f87171', mb: 2 }}>{error}</Typography>
            <Typography
              component="button"
              onClick={() => window.location.reload()}
              sx={{
                color: '#58a6ff',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textDecoration: 'underline',
                fontSize: '0.875rem',
              }}
            >
              Try again
            </Typography>
          </Box>
        )}

        {/* Lead Cards */}
        {!loading && !error && (
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
        )}
      </Box>

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
        onEvaluationSave={updateEvaluation}
        onRentCastSuccess={(leadId, result) => {
          updateLeadComparables(leadId, result.comparables, result.arv, result.arvSource);
          showSnackbar('RentCast ARV updated', 'success');
        }}
        onDeletePermanently={handleDeletePermanently}
        deleteLoading={deleteLoading}
        onFollowUp={handleFollowUp}
      />

      {/* Add Lead Modal */}
      <AddLeadModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSuccess={handleAddLeadSuccess}
      />

      {/* Feedback snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
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

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Box, Snackbar, Alert, CircularProgress, Typography, Pagination } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { QueueLead, LeadQueueStatus } from '../../../types/queue';
import { useLeadQueue } from '../../../hooks/useLeadQueue';
import { sortLeadsByPriority } from '../../../hooks/useMockLeadData';
import { useKeyboardShortcuts } from '../../../hooks/useKeyboardShortcuts';
import { PageHeader } from './PageHeader';
import { QueueTabs } from './QueueTabs';
import { QueueCardList } from './QueueCardList';
import { LeadDetailPanel } from '../DetailPanel';
import { PhotoGalleryPanel } from './PhotoGalleryPanel';
import { AddLeadModal } from './AddLeadModal';
import { IngestLeadResponse } from '../../../services/leadQueueService';
import { smsService } from '../../../services/smsService';
import { promoteListings } from '../../../services/listingsService';

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
  const [showGalleryOnOpen, setShowGalleryOnOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'info' | 'warning' | 'error';
  }>({ open: false, message: '', severity: 'info' });
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [promoteLoading, setPromoteLoading] = useState(false);
  const navigate = useNavigate();

  // Search state - separate for All Leads and Archived tabs
  const [allLeadsSearch, setAllLeadsSearch] = useState('');
  const [archivedSearch, setArchivedSearch] = useState('');
  const [debouncedAllSearch, setDebouncedAllSearch] = useState('');
  const [debouncedArchivedSearch, setDebouncedArchivedSearch] = useState('');
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Snackbar helper
  const showSnackbar = useCallback((
    message: string,
    severity: 'success' | 'info' | 'warning' | 'error'
  ) => {
    setSnackbar({ open: true, message, severity });
  }, []);

  // Debounce effect for All Leads search
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedAllSearch(allLeadsSearch);
    }, 300);
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [allLeadsSearch]);

  // Debounce effect for Archived search
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedArchivedSearch(archivedSearch);
    }, 300);
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [archivedSearch]);

  // Compute current search based on selected queue
  // We need to track selectedQueue to know which search to use
  const [currentQueueType, setCurrentQueueType] = useState<'action_now' | 'follow_up' | 'negotiating' | 'all' | 'archived'>('action_now');

  const currentSearch = useMemo(() => {
    if (currentQueueType === 'all') return debouncedAllSearch;
    if (currentQueueType === 'archived') return debouncedArchivedSearch;
    return ''; // No search for action_now, follow_up, negotiating
  }, [currentQueueType, debouncedAllSearch, debouncedArchivedSearch]);

  // Real API hook with WebSocket integration
  const {
    leads,
    queueCounts,
    selectedQueue,
    page,
    totalPages,
    loading,
    error,
    changeQueue: hookChangeQueue,
    changePage: hookChangePage,
    markAsDone,
    archiveLead,
    deleteLeadPermanently,
    updateEvaluation,
    updateLeadComparables,
    updateNotes,
    updateSellerPhone,
    updateLeadStatus,
    scheduleFollowUp,
    cancelFollowUp,
  } = useLeadQueue({
    initialQueueType: 'action_now',
    search: currentSearch,
    onNotification: showSnackbar,
  });

  // Wrap changeQueue to track current queue type
  const changeQueue = useCallback((queue: typeof currentQueueType) => {
    setCurrentQueueType(queue);
    hookChangeQueue(queue);
  }, [hookChangeQueue]);

  // Wrap changePage and reset to page 1 when search changes
  const changePage = useCallback((newPage: number) => {
    hookChangePage(newPage);
  }, [hookChangePage]);

  // Reset to page 1 when search changes
  useEffect(() => {
    if (currentQueueType === 'all' && debouncedAllSearch !== '') {
      hookChangePage(1);
    }
  }, [debouncedAllSearch, currentQueueType, hookChangePage]);

  useEffect(() => {
    if (currentQueueType === 'archived' && debouncedArchivedSearch !== '') {
      hookChangePage(1);
    }
  }, [debouncedArchivedSearch, currentQueueType, hookChangePage]);

  // Sort leads: backend sorts All/Archived by UpdatedAt, other queues by priority
  const filteredLeads = useMemo(() => {
    // For All and Archived queues, preserve backend's UpdatedAt sorting
    if (currentQueueType === 'all' || currentQueueType === 'archived') {
      return leads;
    }
    // For other queues, sort by priority
    return sortLeadsByPriority(leads);
  }, [leads, currentQueueType]);

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
    setShowGalleryOnOpen(false);
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

  // Navigate to next lead after current one is removed (archive/delete)
  // Returns the ID of the lead to select, or null if pane should close
  const getNextLeadIdAfterRemoval = useCallback((): string | null => {
    // Edge case: only one lead - close the pane
    if (filteredLeads.length <= 1) {
      return null;
    }

    // Edge case: current lead not found (already removed)
    if (selectedCardIndex === -1) {
      return filteredLeads[0].id;
    }

    // If at last position, wrap to first lead
    // Otherwise, stay at same index (next lead will slide up into position)
    const isLastLead = selectedCardIndex === filteredLeads.length - 1;
    const nextIndex = isLastLead ? 0 : selectedCardIndex;

    // Get the lead that will be at nextIndex after removal
    const leadsAfterRemoval = filteredLeads.filter(l => l.id !== selectedCardId);
    if (leadsAfterRemoval.length > 0) {
      const safeIndex = Math.min(nextIndex, leadsAfterRemoval.length - 1);
      return leadsAfterRemoval[safeIndex].id;
    }

    return null;
  }, [filteredLeads, selectedCardIndex, selectedCardId]);

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
      onArchive: handleArchive,
      onFollowUp: handleFollowUp,
    },
    !detailPanelOpen
  );

  // Action handlers for individual cards
  const handleViewDetails = (lead: QueueLead, showGallery = false) => {
    setSelectedCardId(lead.id);
    setShowGalleryOnOpen(showGallery);
    setDetailPanelOpen(true);
  };

  // Handle sending message from detail panel
  const handleSendMessage = async (message: string): Promise<boolean> => {
    if (!selectedLead?.sellerPhone) {
      showSnackbar('No phone number available for this lead', 'error');
      return false;
    }

    try {
      const response = await smsService.sendMessage({
        toPhoneNumber: selectedLead.sellerPhone,
        body: message,
        propertyLeadId: selectedLead.id,
      });

      if (response.success) {
        showSnackbar('Message sent successfully!', 'success');
        return true;
      } else {
        showSnackbar(response.errorMessage || 'Failed to send message', 'error');
        return false;
      }
    } catch (error: any) {
      const errorMessage = error.response?.data || error.message || 'Failed to send message';
      showSnackbar(typeof errorMessage === 'string' ? errorMessage : 'Failed to send message', 'error');
      return false;
    }
  };

  // Handle status change from detail panel
  const handleStatusChange = (status: LeadQueueStatus) => {
    if (selectedCardId) {
      updateLeadStatus(selectedCardId, status);
    }
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
          // Get the next lead to navigate to BEFORE archiving (so we have correct index)
          const nextLeadId = getNextLeadIdAfterRemoval();
          const currentLeadId = selectedCardId;

          if (nextLeadId) {
            // Navigate to next lead (wrap to first if at end)
            setSelectedCardId(nextLeadId);
          } else {
            // No more leads - close the pane
            setDetailPanelOpen(false);
          }

          // Archive the original lead
          archiveLead(currentLeadId);
          // Notification shown by hook via onNotification callback
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

  // Handle seller phone change from detail panel
  const handleSellerPhoneChange = useCallback((phone: string) => {
    if (selectedCardId) {
      updateSellerPhone(selectedCardId, phone || null);
    }
  }, [selectedCardId, updateSellerPhone]);

  const handleCardDone = (lead: QueueLead) => {
    markAsDone(lead.id);
    // Notification shown by hook via onNotification callback
  };

  const handleCardFollowUp = (lead: QueueLead) => {
    const followUpDate = new Date();
    followUpDate.setDate(followUpDate.getDate() + 2);
    scheduleFollowUp(lead.id, followUpDate.toISOString().split('T')[0]);
  };

  const handleCardArchive = (lead: QueueLead) => {
    archiveLead(lead.id);
    // Notification shown by hook via onNotification callback
  };

  // Handle permanent delete from detail panel
  const handleDeletePermanently = useCallback(async () => {
    if (!selectedCardId) return;
    setDeleteLoading(true);

    // Get the next lead to navigate to BEFORE deleting (so we have correct index)
    const nextLeadId = getNextLeadIdAfterRemoval();
    const currentLeadId = selectedCardId;

    try {
      if (nextLeadId) {
        // Navigate to next lead (wrap to first if at end)
        setSelectedCardId(nextLeadId);
      } else {
        // No more leads - close the pane
        setDetailPanelOpen(false);
      }

      await deleteLeadPermanently(currentLeadId);
    } catch {
      // Error is handled by hook, loading state needs to be reset
      // On error, try to restore selection to original lead if it still exists
      setSelectedCardId(currentLeadId);
    } finally {
      setDeleteLoading(false);
    }
  }, [selectedCardId, deleteLeadPermanently, getNextLeadIdAfterRemoval]);

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

  // Handle navigate to sales funnel report
  const handleNavigateToSalesFunnel = useCallback(() => {
    navigate('/reports?tab=3');
  }, [navigate]);

  // Handle promote listings button click
  const handlePromoteListings = useCallback(async () => {
    setPromoteLoading(true);
    try {
      const result = await promoteListings({ minScore: 75, limit: 5 });

      if (result.candidateCount === 0) {
        showSnackbar('No listings available for promotion', 'info');
      } else {
        const parts: string[] = [];
        if (result.promotedCount > 0) {
          parts.push(`Promoted ${result.promotedCount} listing${result.promotedCount !== 1 ? 's' : ''}`);
        }
        if (result.duplicateCount > 0) {
          parts.push(`${result.duplicateCount} duplicate${result.duplicateCount !== 1 ? 's' : ''}`);
        }
        if (result.failedCount > 0) {
          parts.push(`${result.failedCount} failed`);
        }
        const message = parts.length > 0 ? parts.join(', ') : 'Promotion complete';
        showSnackbar(message, result.promotedCount > 0 ? 'success' : 'info');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to promote listings';
      showSnackbar(typeof errorMessage === 'string' ? errorMessage : 'Failed to promote listings', 'error');
    } finally {
      setPromoteLoading(false);
    }
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
        <PageHeader
          onAddLead={() => setAddModalOpen(true)}
          onPromoteListings={handlePromoteListings}
          promoteLoading={promoteLoading}
          onNavigateToSalesFunnel={handleNavigateToSalesFunnel}
          showSearch={selectedQueue === 'all' || selectedQueue === 'archived'}
          searchQuery={selectedQueue === 'all' ? allLeadsSearch : selectedQueue === 'archived' ? archivedSearch : ''}
          onSearchChange={(query) => {
            if (selectedQueue === 'all') {
              setAllLeadsSearch(query);
            } else if (selectedQueue === 'archived') {
              setArchivedSearch(query);
            }
          }}
          onClearSearch={() => {
            if (selectedQueue === 'all') {
              setAllLeadsSearch('');
              setDebouncedAllSearch('');
            } else if (selectedQueue === 'archived') {
              setArchivedSearch('');
              setDebouncedArchivedSearch('');
            }
          }}
        />

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
            onFollowUp={handleCardFollowUp}
            onArchive={handleCardArchive}
            hasActiveSearch={
              (selectedQueue === 'all' && debouncedAllSearch.length > 0) ||
              (selectedQueue === 'archived' && debouncedArchivedSearch.length > 0)
            }
          />
        )}

        {/* Pagination for All Leads and Archived tabs */}
        {!loading && !error && (selectedQueue === 'all' || selectedQueue === 'archived') && totalPages > 1 && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              mt: 3,
              mb: 2,
              gap: 2,
            }}
          >
            <Typography sx={{ color: '#8b949e', fontSize: '0.875rem' }}>
              Page {page} of {totalPages}
            </Typography>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, newPage) => changePage(newPage)}
              sx={{
                '& .MuiPaginationItem-root': {
                  color: '#8b949e',
                  borderColor: '#30363d',
                  '&:hover': {
                    bgcolor: '#21262d',
                  },
                  '&.Mui-selected': {
                    bgcolor: '#238636',
                    color: '#ffffff',
                    '&:hover': {
                      bgcolor: '#2ea043',
                    },
                  },
                },
              }}
              showFirstButton
              showLastButton
            />
          </Box>
        )}
      </Box>

      {/* Photo Gallery Panel - shown on left when gallery is open */}
      {detailPanelOpen && showGalleryOnOpen && selectedLead && (
        <Box
          sx={{
            position: 'fixed',
            top: 64, // Below navbar
            left: 0,
            right: { xs: 0, md: 800 }, // Leave space for detail panel
            bottom: 0,
            zIndex: 1300, // Higher than drawer backdrop (1200)
            bgcolor: '#0d1117',
          }}
        >
          <PhotoGalleryPanel
            lead={selectedLead}
            onClose={() => setShowGalleryOnOpen(false)}
          />
        </Box>
      )}

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
        onSellerPhoneChange={handleSellerPhoneChange}
        onEvaluationSave={updateEvaluation}
        onRentCastSuccess={(leadId, result) => {
          updateLeadComparables(leadId, result.comparables, result.arv, result.arvSource);
          showSnackbar('RentCast ARV updated', 'success');
        }}
        onDeletePermanently={handleDeletePermanently}
        deleteLoading={deleteLoading}
        onFollowUp={handleFollowUp}
        onGalleryToggle={setShowGalleryOnOpen}
        showGallery={showGalleryOnOpen}
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

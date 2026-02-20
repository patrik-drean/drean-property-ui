import { useState, useEffect, useCallback, useRef } from 'react';
import {
  leadQueueService,
  LeadQueueItem,
  QueueCounts as ApiQueueCounts,
  QueueType,
  UpdateEvaluationRequest,
  EnrichmentMetadata,
} from '../services/leadQueueService';
import { useLeadEvents, LeadEventData, ConsolidationEventData } from './useLeadEvents';
import { QueueLead, QueueCounts, Priority, formatTimeSince } from '../types/queue';

interface UseLeadQueueOptions {
  initialQueueType?: QueueType;
  pageSize?: number;
  /** Optional search query to filter leads (only for all/archived queues) */
  search?: string;
  /** Callback for toast notifications */
  onNotification?: (message: string, severity: 'success' | 'info' | 'warning' | 'error') => void;
}

/**
 * Transform API queue counts (camelCase) to frontend queue counts (snake_case).
 */
function transformQueueCounts(apiCounts: ApiQueueCounts): QueueCounts {
  return {
    action_now: apiCounts.actionNow,
    follow_up: apiCounts.followUp,
    negotiating: apiCounts.negotiating,
    all: apiCounts.all,
    archived: apiCounts.archived ?? 0,
  };
}

interface UseLeadQueueReturn {
  leads: QueueLead[];
  queueCounts: QueueCounts;
  selectedQueue: QueueType;
  page: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'reconnecting';
  changeQueue: (queue: QueueType) => void;
  changePage: (page: number) => void;
  updateLeadStatus: (leadId: string, status: string) => Promise<void>;
  archiveLead: (leadId: string) => Promise<void>;
  unarchiveLead: (leadId: string) => Promise<void>;
  deleteLeadPermanently: (leadId: string) => Promise<void>;
  updateEvaluation: (leadId: string, updates: UpdateEvaluationRequest) => Promise<void>;
  updateLeadComparables: (leadId: string, comparables: import('../services/leadQueueService').ComparableSale[], arv?: number, arvSource?: string) => void;
  updateNotes: (leadId: string, notes: string) => Promise<void>;
  updateSellerPhone: (leadId: string, sellerPhone: string | null) => Promise<void>;
  scheduleFollowUp: (leadId: string, followUpDate: string) => Promise<void>;
  cancelFollowUp: (leadId: string) => Promise<void>;
  refetch: () => Promise<void>;
  markAsDone: (leadId: string) => void;
  markAsSkip: (leadId: string) => void;
}

/**
 * Parses enrichment metadata JSON from the API response.
 */
function parseEnrichmentMetadata(metadataJson: string | undefined): EnrichmentMetadata | undefined {
  if (!metadataJson || metadataJson === '{}') return undefined;
  try {
    return JSON.parse(metadataJson);
  } catch {
    return undefined;
  }
}

/**
 * Maps API LeadQueueItem to frontend QueueLead type.
 * Handles the property mapping between backend and frontend models.
 */
export function mapToQueueLead(item: LeadQueueItem): QueueLead {
  return {
    id: item.id,
    address: item.address,
    city: item.city,
    state: item.state,
    zipCode: item.zipCode,
    zillowLink: item.zillowLink || '',
    listingPrice: item.listingPrice,
    sellerPhone: item.contact.sellerPhone || '',
    sellerEmail: item.contact.sellerEmail || '',
    agentName: item.contact.agentName,
    createdAt: item.createdAt,
    updatedAt: item.createdAt, // API doesn't provide updatedAt separately
    archived: false,
    tags: [],
    squareFootage: item.property.sqft ?? null,
    bedrooms: item.property.beds,
    bathrooms: item.property.baths,
    units: item.property.units ?? null,
    notes: item.notes || '',
    leadScore: item.score,
    mao: item.metrics.mao,
    spreadPercent: item.metrics.spreadPercent,
    neighborhoodGrade: item.metrics.neighborhoodGrade,
    status: item.status as any,
    lastContactDate: null,
    followUpDue: item.followUpDue,
    followUpDate: item.followUpDate,
    aiSummary: item.aiSummary,
    aiVerdict: item.aiVerdict,
    aiWeaknesses: item.aiWeaknesses,
    recommendation: item.recommendation,
    priority: item.priority as Priority,
    timeSinceCreated: item.timeAgo || formatTimeSince(item.createdAt),
    // Full metrics data for tooltips
    metrics: item.metrics,
    // Comparables from ARV evaluation
    _comparables: item.comparables,
    // Property photo URL
    photoUrl: item.photoUrl,
    // All property photo URLs (for gallery display)
    photoUrls: item.photoUrls,
    // Enrichment metadata
    enrichmentMetadata: parseEnrichmentMetadata(item.metadata),
  } as QueueLead;
}

/**
 * Maps WebSocket LeadEventData to frontend QueueLead type.
 */
function mapEventToQueueLead(event: LeadEventData): QueueLead {
  return {
    id: event.id,
    address: event.address,
    city: event.city,
    state: event.state,
    zipCode: event.zipCode,
    zillowLink: '',
    listingPrice: event.listingPrice,
    sellerPhone: '',
    sellerEmail: '',
    createdAt: event.createdAt,
    updatedAt: event.createdAt,
    archived: false,
    tags: [],
    squareFootage: null,
    bedrooms: null,
    bathrooms: null,
    units: null,
    notes: '',
    leadScore: event.score,
    mao: event.mao,
    spreadPercent: event.spreadPercent,
    neighborhoodGrade: event.neighborhoodGrade,
    status: event.status as any,
    lastContactDate: null,
    followUpDue: event.needsFollowUp,
    priority: event.isPriority ? 'high' : 'normal',
    timeSinceCreated: formatTimeSince(event.createdAt),
  };
}

/**
 * useLeadQueue - Main hook for the Review Page
 *
 * Features:
 * - Fetches leads from the queue API
 * - Real-time updates via WebSocket events
 * - Optimistic updates for better UX
 * - Error rollback on failures
 * - Queue filtering and pagination
 */
export const useLeadQueue = (options: UseLeadQueueOptions = {}): UseLeadQueueReturn => {
  const { initialQueueType = 'all', pageSize = 20, search, onNotification } = options;

  // Helper to show notifications (does nothing if no callback provided)
  const notify = useCallback(
    (message: string, severity: 'success' | 'info' | 'warning' | 'error') => {
      onNotification?.(message, severity);
    },
    [onNotification]
  );

  // State
  const [leads, setLeads] = useState<QueueLead[]>([]);
  const [queueCounts, setQueueCounts] = useState<QueueCounts>({
    action_now: 0,
    follow_up: 0,
    negotiating: 0,
    all: 0,
    archived: 0,
  });
  const [selectedQueue, setSelectedQueue] = useState<QueueType>(initialQueueType);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ref to track if this is the initial fetch
  const isInitialFetch = useRef(true);

  // Ref to track the current request to avoid race conditions
  const requestIdRef = useRef(0);

  // Fetch queue data
  const fetchQueue = useCallback(async () => {
    // Increment request ID to track this specific request
    const currentRequestId = ++requestIdRef.current;

    try {
      if (isInitialFetch.current) {
        setLoading(true);
      }
      setError(null);

      const response = await leadQueueService.getQueue(selectedQueue, page, pageSize, search);

      // Only update state if this is still the current request (avoid race conditions)
      if (currentRequestId !== requestIdRef.current) {
        return; // A newer request was made, ignore this stale response
      }

      const mapped = response.leads.map(mapToQueueLead);
      // Mark leads as archived when viewing the archived queue
      if (selectedQueue === 'archived') {
        mapped.forEach(l => { l.archived = true; });
      }
      setLeads(mapped);
      setQueueCounts(transformQueueCounts(response.queueCounts));
      setTotalPages(response.pagination.totalPages);

      isInitialFetch.current = false;
    } catch (err) {
      // Only handle errors if this is still the current request
      if (currentRequestId !== requestIdRef.current) {
        return;
      }
      console.error('Failed to fetch lead queue:', err);
      setError('Failed to load leads. Please try again.');
      if (!isInitialFetch.current) {
        notify('Failed to load leads', 'error');
      }
    } finally {
      // Only update loading if this is still the current request
      if (currentRequestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [selectedQueue, page, pageSize, search, notify]);

  // Initial fetch and refetch on queue/page change
  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  // WebSocket event handlers
  const handleLeadCreated = useCallback(
    (newLead: LeadEventData) => {
      // Add to beginning of list with animation flag
      const queueLead = {
        ...mapEventToQueueLead(newLead),
        _isNew: true,
      } as QueueLead & { _isNew: boolean };

      setLeads((prev) => [queueLead, ...prev]);

      notify(`New lead: ${newLead.address}`, 'success');

      // Refetch to get accurate counts (new lead may go to action_now based on score)
      fetchQueue();

      // Remove animation flag after delay
      setTimeout(() => {
        setLeads((prev) =>
          prev.map((l) =>
            l.id === newLead.id ? { ...l, _isNew: false } : l
          )
        );
      }, 2000);
    },
    [notify, fetchQueue]
  );

  const handleLeadUpdated = useCallback((updatedLead: LeadEventData) => {
    setLeads((prev) =>
      prev.map((l) =>
        l.id === updatedLead.id
          ? { ...l, ...mapEventToQueueLead(updatedLead) }
          : l
      )
    );
    // Refetch to get accurate counts (status change may affect queue membership)
    fetchQueue();
  }, [fetchQueue]);

  const handleLeadConsolidated = useCallback(
    ({ lead, priceChange }: ConsolidationEventData) => {
      setLeads((prev) =>
        prev.map((l) =>
          l.id === lead.id ? { ...l, ...mapEventToQueueLead(lead) } : l
        )
      );

      if (priceChange && priceChange.newPrice < priceChange.oldPrice) {
        const pct = (
          ((priceChange.oldPrice - priceChange.newPrice) / priceChange.oldPrice) *
          100
        ).toFixed(0);
        notify(`Price dropped ${pct}% on ${lead.address}!`, 'info');
      }

      // Refetch to get accurate counts (price change may affect queue membership)
      fetchQueue();
    },
    [notify, fetchQueue]
  );

  const handleLeadDeleted = useCallback((leadId: string) => {
    setLeads((prev) => prev.filter((l) => l.id !== leadId));
    // Refetch to get accurate counts
    fetchQueue();
  }, [fetchQueue]);

  // Subscribe to WebSocket events
  const { connectionStatus } = useLeadEvents({
    onLeadCreated: handleLeadCreated,
    onLeadUpdated: handleLeadUpdated,
    onLeadConsolidated: handleLeadConsolidated,
    onLeadDeleted: handleLeadDeleted,
  });

  // Queue actions
  const changeQueue = useCallback((queue: QueueType) => {
    setSelectedQueue(queue);
    setPage(1);
    // Show loading state when changing queues to prevent stale data flash
    setLoading(true);
  }, []);

  const changePage = useCallback((newPage: number) => {
    setPage(newPage);
    // Show loading state when changing pages to prevent stale data flash
    setLoading(true);
  }, []);

  // Lead actions with optimistic updates
  const updateLeadStatus = useCallback(
    async (leadId: string, status: string) => {
      const previousLeads = leads;
      const previousCounts = queueCounts;

      // Optimistic update
      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, status: status as any } : l))
      );

      try {
        await leadQueueService.updateStatus(leadId, status);
        notify('Status updated', 'success');
        // Refetch to get accurate counts (status change may affect queue membership)
        await fetchQueue();
      } catch (err) {
        // Rollback
        setLeads(previousLeads);
        setQueueCounts(previousCounts);
        notify('Failed to update status', 'error');
      }
    },
    [leads, queueCounts, notify, fetchQueue]
  );

  const archiveLead = useCallback(
    async (leadId: string) => {
      const previousLeads = leads;
      const previousCounts = queueCounts;

      // Optimistic update
      setLeads((prev) => prev.filter((l) => l.id !== leadId));
      setQueueCounts((prev) => ({ ...prev, all: Math.max(0, prev.all - 1) }));

      try {
        await leadQueueService.archiveLead(leadId);
        notify('Lead archived', 'success');
        // Refetch to get accurate counts
        await fetchQueue();
      } catch (err) {
        // Rollback
        setLeads(previousLeads);
        setQueueCounts(previousCounts);
        notify('Failed to archive lead', 'error');
      }
    },
    [leads, queueCounts, notify, fetchQueue]
  );

  const unarchiveLead = useCallback(
    async (leadId: string) => {
      const previousLeads = leads;
      const previousCounts = queueCounts;

      // Optimistic update - remove from archived list
      setLeads((prev) => prev.filter((l) => l.id !== leadId));
      setQueueCounts((prev) => ({
        ...prev,
        archived: Math.max(0, prev.archived - 1),
        all: prev.all + 1,
      }));

      try {
        await leadQueueService.unarchiveLead(leadId);
        notify('Lead restored', 'success');
        // Refetch to get accurate counts
        await fetchQueue();
      } catch (err) {
        // Rollback
        setLeads(previousLeads);
        setQueueCounts(previousCounts);
        notify('Failed to restore lead', 'error');
      }
    },
    [leads, queueCounts, notify, fetchQueue]
  );

  const deleteLeadPermanently = useCallback(
    async (leadId: string) => {
      const previousLeads = leads;
      const previousCounts = queueCounts;

      // Optimistic update
      setLeads((prev) => prev.filter((l) => l.id !== leadId));
      setQueueCounts((prev) => ({ ...prev, all: Math.max(0, prev.all - 1) }));

      try {
        await leadQueueService.deleteLeadPermanently(leadId);
        notify('Lead permanently deleted', 'success');
        // Refetch to get accurate counts
        await fetchQueue();
      } catch (err) {
        // Rollback
        setLeads(previousLeads);
        setQueueCounts(previousCounts);
        notify('Failed to delete lead', 'error');
        throw err; // Re-throw so the dialog can handle loading state
      }
    },
    [leads, queueCounts, notify, fetchQueue]
  );

  const scheduleFollowUp = useCallback(
    async (leadId: string, followUpDate: string) => {
      const previousLeads = leads;
      const previousCounts = queueCounts;

      // Determine if the new follow-up is for today or future
      // Compare date strings to avoid timezone issues (followUpDate is YYYY-MM-DD format)
      const todayString = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD format
      const isScheduledForToday = followUpDate === todayString;
      const isScheduledForFuture = followUpDate > todayString;

      // Remove from current list if viewing action_now or follow_up queues
      // (lead will still be in All Leads)
      const shouldRemoveFromList = selectedQueue === 'action_now' || selectedQueue === 'follow_up';

      if (shouldRemoveFromList) {
        setLeads((prev) => prev.filter((l) => l.id !== leadId));
      } else {
        // Update the lead's follow-up status
        // Only set followUpDue: true if scheduled for today (not future)
        setLeads((prev) =>
          prev.map((l) =>
            l.id === leadId
              ? { ...l, followUpDate, followUpDue: isScheduledForToday }
              : l
          )
        );
      }

      // Update queue counts based on scheduling date
      setQueueCounts((prev) => {
        const newCounts = { ...prev };

        // If coming from action_now queue, decrement it
        if (selectedQueue === 'action_now') {
          newCounts.action_now = Math.max(0, prev.action_now - 1);
        }

        // Only add to follow_up count if scheduled for today
        // If scheduled for future, lead won't be in Follow-Up Today queue
        if (isScheduledForToday && selectedQueue !== 'follow_up') {
          // Add to follow_up only if not already in that queue
          newCounts.follow_up = prev.follow_up + 1;
        } else if (isScheduledForFuture && selectedQueue === 'follow_up') {
          // Decrement follow_up if rescheduling from Follow-Up Today to future
          newCounts.follow_up = Math.max(0, prev.follow_up - 1);
        }

        return newCounts;
      });

      try {
        // Only schedule follow-up - do NOT mark as contacted (user hasn't contacted them yet)
        await leadQueueService.scheduleFollowUp(leadId, followUpDate);
        notify('Follow-up scheduled', 'success');
        // Refetch to get accurate counts
        await fetchQueue();
      } catch (err) {
        // Rollback
        setLeads(previousLeads);
        setQueueCounts(previousCounts);
        notify('Failed to schedule follow-up', 'error');
      }
    },
    [leads, queueCounts, selectedQueue, notify, fetchQueue]
  );

  // Cancel a follow-up reminder for a lead
  const cancelFollowUp = useCallback(
    async (leadId: string) => {
      const previousLeads = leads;

      // Optimistic update - clear follow-up date
      setLeads((prev) =>
        prev.map((l) =>
          l.id === leadId
            ? { ...l, followUpDate: undefined, followUpDue: false }
            : l
        )
      );

      try {
        await leadQueueService.cancelFollowUp(leadId);
        notify('Follow-up cancelled', 'success');
        // Refetch to get accurate counts
        await fetchQueue();
      } catch (err) {
        // Rollback
        setLeads(previousLeads);
        notify('Failed to cancel follow-up', 'error');
      }
    },
    [leads, notify, fetchQueue]
  );

  const updateEvaluation = useCallback(
    async (leadId: string, updates: UpdateEvaluationRequest) => {
      const previousLeads = leads;

      // Optimistic update - update the metrics including notes
      setLeads((prev) =>
        prev.map((l) => {
          if (l.id !== leadId) return l;

          // Merge updates into existing metrics
          const existingMetrics = (l as any).metrics || {};
          const updatedMetrics = { ...existingMetrics };

          if (updates.arv !== undefined) {
            updatedMetrics.arv = updates.arv;
            updatedMetrics.arvSource = 'manual';
            updatedMetrics.arvNote = updates.arvNote;
            updatedMetrics.arvConfidence = undefined; // Clear confidence for manual overrides
          }
          if (updates.rehabEstimate !== undefined) {
            updatedMetrics.rehabEstimate = updates.rehabEstimate;
            updatedMetrics.rehabSource = 'manual';
            updatedMetrics.rehabNote = updates.rehabNote;
            updatedMetrics.rehabConfidence = undefined;
          }
          if (updates.rentEstimate !== undefined) {
            updatedMetrics.rentEstimate = updates.rentEstimate;
            updatedMetrics.rentSource = 'manual';
            updatedMetrics.rentNote = updates.rentNote;
            updatedMetrics.rentConfidence = undefined;
          }

          return {
            ...l,
            metrics: updatedMetrics,
          };
        })
      );

      try {
        const result = await leadQueueService.updateEvaluation(leadId, updates);

        // Update with server-calculated values (MAO, spread) and full metrics
        setLeads((prev) =>
          prev.map((l) =>
            l.id === leadId
              ? {
                  ...l,
                  mao: result.metrics.mao,
                  spreadPercent: result.metrics.spreadPercent,
                  metrics: result.metrics,
                }
              : l
          )
        );
        notify('Evaluation saved', 'success');
      } catch (err) {
        // Rollback
        setLeads(previousLeads);
        notify('Failed to save evaluation', 'error');
      }
    },
    [leads, notify]
  );

  // Update lead comparables after RentCast refresh
  const updateLeadComparables = useCallback(
    (leadId: string, comparables: import('../services/leadQueueService').ComparableSale[], arv?: number, arvSource?: string) => {
      setLeads((prev) =>
        prev.map((l) => {
          if (l.id !== leadId) return l;
          const existingMetrics = (l as any).metrics || {};
          return {
            ...l,
            _comparables: comparables,
            metrics: {
              ...existingMetrics,
              arv: arv ?? existingMetrics.arv,
              arvSource: arvSource ?? existingMetrics.arvSource,
            },
          };
        })
      );
    },
    []
  );

  // Update notes for a lead
  const updateNotes = useCallback(
    async (leadId: string, notes: string) => {
      const previousLeads = leads;

      // Optimistic update
      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, notes } : l))
      );

      try {
        await leadQueueService.updateNotes(leadId, notes);
        notify('Notes saved', 'success');
      } catch (err) {
        // Rollback
        setLeads(previousLeads);
        notify('Failed to save notes', 'error');
      }
    },
    [leads, notify]
  );

  // Update seller phone for a lead
  const updateSellerPhone = useCallback(
    async (leadId: string, sellerPhone: string | null) => {
      const previousLeads = leads;

      // Optimistic update
      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, sellerPhone: sellerPhone || '' } : l))
      );

      try {
        await leadQueueService.updateSellerPhone(leadId, sellerPhone);
        notify('Phone updated', 'success');
      } catch (err) {
        // Rollback
        setLeads(previousLeads);
        notify('Failed to update phone', 'error');
      }
    },
    [leads, notify]
  );

  // Mock data compatibility functions (for gradual migration)
  const markAsDone = useCallback(
    async (leadId: string) => {
      const previousLeads = leads;
      const previousCounts = queueCounts;

      // Remove from current list if viewing action_now or follow_up queues
      // (lead will still be in All Leads)
      const shouldRemoveFromList = selectedQueue === 'action_now' || selectedQueue === 'follow_up';

      if (shouldRemoveFromList) {
        setLeads((prev) => prev.filter((l) => l.id !== leadId));
        // Update queue counts
        setQueueCounts((prev) => ({
          ...prev,
          [selectedQueue]: Math.max(0, prev[selectedQueue] - 1),
        }));
      } else {
        // Just update status in place
        setLeads((prev) =>
          prev.map((l) => (l.id === leadId ? { ...l, status: 'Contacted' as any } : l))
        );
      }

      try {
        await leadQueueService.updateStatus(leadId, 'Contacted');
        notify('Marked as done', 'success');
        // Refetch to get accurate counts
        await fetchQueue();
      } catch (err) {
        // Rollback
        setLeads(previousLeads);
        setQueueCounts(previousCounts);
        notify('Failed to update status', 'error');
      }
    },
    [leads, queueCounts, selectedQueue, notify, fetchQueue]
  );

  const markAsSkip = useCallback(
    (leadId: string) => {
      // Skip schedules a follow-up for 2 days from now
      const followUpDate = new Date();
      followUpDate.setDate(followUpDate.getDate() + 2);
      scheduleFollowUp(leadId, followUpDate.toISOString().split('T')[0]);
    },
    [scheduleFollowUp]
  );

  return {
    leads,
    queueCounts,
    selectedQueue,
    page,
    totalPages,
    loading,
    error,
    connectionStatus,
    changeQueue,
    changePage,
    updateLeadStatus,
    archiveLead,
    unarchiveLead,
    deleteLeadPermanently,
    updateEvaluation,
    updateLeadComparables,
    updateNotes,
    updateSellerPhone,
    scheduleFollowUp,
    cancelFollowUp,
    refetch: fetchQueue,
    markAsDone,
    markAsSkip,
  };
};

export default useLeadQueue;

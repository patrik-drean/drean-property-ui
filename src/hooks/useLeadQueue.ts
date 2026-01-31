import { useState, useEffect, useCallback, useRef } from 'react';
import {
  leadQueueService,
  LeadQueueItem,
  QueueCounts as ApiQueueCounts,
  QueueType,
  UpdateEvaluationRequest,
} from '../services/leadQueueService';
import { useLeadEvents, LeadEventData, ConsolidationEventData } from './useLeadEvents';
import { QueueLead, QueueCounts, Priority, formatTimeSince } from '../types/queue';

interface UseLeadQueueOptions {
  initialQueueType?: QueueType;
  pageSize?: number;
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
  deleteLeadPermanently: (leadId: string) => Promise<void>;
  updateEvaluation: (leadId: string, updates: UpdateEvaluationRequest) => Promise<void>;
  updateLeadComparables: (leadId: string, comparables: import('../services/leadQueueService').ComparableSale[], arv?: number, arvSource?: string) => void;
  updateNotes: (leadId: string, notes: string) => Promise<void>;
  scheduleFollowUp: (leadId: string, followUpDate: string) => Promise<void>;
  cancelFollowUp: (leadId: string) => Promise<void>;
  refetch: () => Promise<void>;
  markAsDone: (leadId: string) => void;
  markAsSkip: (leadId: string) => void;
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
    createdAt: item.createdAt,
    updatedAt: item.createdAt, // API doesn't provide updatedAt separately
    archived: false,
    tags: [],
    squareFootage: item.property.sqft ?? null,
    bedrooms: item.property.beds,
    bathrooms: item.property.baths,
    units: item.property.units ?? null,
    notes: '',
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
  const { initialQueueType = 'all', pageSize = 20, onNotification } = options;

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

      const response = await leadQueueService.getQueue(selectedQueue, page, pageSize);

      // Only update state if this is still the current request (avoid race conditions)
      if (currentRequestId !== requestIdRef.current) {
        return; // A newer request was made, ignore this stale response
      }

      setLeads(response.leads.map(mapToQueueLead));
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
  }, [selectedQueue, page, pageSize, notify]);

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
      setQueueCounts((prev) => ({ ...prev, all: prev.all + 1 }));

      notify(`New lead: ${newLead.address}`, 'success');

      // Remove animation flag after delay
      setTimeout(() => {
        setLeads((prev) =>
          prev.map((l) =>
            l.id === newLead.id ? { ...l, _isNew: false } : l
          )
        );
      }, 2000);
    },
    [notify]
  );

  const handleLeadUpdated = useCallback((updatedLead: LeadEventData) => {
    setLeads((prev) =>
      prev.map((l) =>
        l.id === updatedLead.id
          ? { ...l, ...mapEventToQueueLead(updatedLead) }
          : l
      )
    );
  }, []);

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
    },
    [notify]
  );

  const handleLeadDeleted = useCallback((leadId: string) => {
    setLeads((prev) => prev.filter((l) => l.id !== leadId));
    setQueueCounts((prev) => ({ ...prev, all: Math.max(0, prev.all - 1) }));
  }, []);

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
      } catch (err) {
        // Rollback
        setLeads(previousLeads);
        setQueueCounts(previousCounts);
        notify('Failed to update status', 'error');
      }
    },
    [leads, queueCounts, notify]
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
      } catch (err) {
        // Rollback
        setLeads(previousLeads);
        setQueueCounts(previousCounts);
        notify('Failed to archive lead', 'error');
      }
    },
    [leads, queueCounts, notify]
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
      } catch (err) {
        // Rollback
        setLeads(previousLeads);
        setQueueCounts(previousCounts);
        notify('Failed to delete lead', 'error');
        throw err; // Re-throw so the dialog can handle loading state
      }
    },
    [leads, queueCounts, notify]
  );

  const scheduleFollowUp = useCallback(
    async (leadId: string, followUpDate: string) => {
      const previousLeads = leads;
      const previousCounts = queueCounts;

      // Remove from current list if viewing action_now or follow_up queues
      // (lead will still be in All Leads)
      const shouldRemoveFromList = selectedQueue === 'action_now' || selectedQueue === 'follow_up';

      if (shouldRemoveFromList) {
        setLeads((prev) => prev.filter((l) => l.id !== leadId));
      } else {
        // Just update the lead's follow-up status
        setLeads((prev) =>
          prev.map((l) =>
            l.id === leadId
              ? { ...l, followUpDate, followUpDue: true }
              : l
          )
        );
      }

      // Update queue counts (move from action_now to follow_up if applicable)
      setQueueCounts((prev) => ({
        ...prev,
        follow_up: prev.follow_up + 1,
        action_now: Math.max(0, prev.action_now - 1),
      }));

      try {
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
      } catch (err) {
        // Rollback
        setLeads(previousLeads);
        setQueueCounts(previousCounts);
        notify('Failed to update status', 'error');
      }
    },
    [leads, queueCounts, selectedQueue, notify]
  );

  const markAsSkip = useCallback(
    (leadId: string) => {
      // Skip sets a follow-up for tomorrow - update status to indicate pending follow-up
      updateLeadStatus(leadId, 'New'); // Keep as New but would set followUpDate in real implementation
      notify('Skipped for tomorrow', 'info');
    },
    [updateLeadStatus, notify]
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
    deleteLeadPermanently,
    updateEvaluation,
    updateLeadComparables,
    updateNotes,
    scheduleFollowUp,
    cancelFollowUp,
    refetch: fetchQueue,
    markAsDone,
    markAsSkip,
  };
};

export default useLeadQueue;

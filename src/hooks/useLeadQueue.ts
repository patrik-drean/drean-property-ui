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
  updateEvaluation: (leadId: string, updates: UpdateEvaluationRequest) => Promise<void>;
  refetch: () => Promise<void>;
  markAsDone: (leadId: string) => void;
  markAsSkip: (leadId: string) => void;
}

/**
 * Maps API LeadQueueItem to frontend QueueLead type.
 * Handles the property mapping between backend and frontend models.
 */
function mapToQueueLead(item: LeadQueueItem): QueueLead {
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
    aiSummary: item.aiSummary,
    priority: item.priority as Priority,
    timeSinceCreated: item.timeAgo || formatTimeSince(item.createdAt),
    // Store metrics for evaluation section
    _metrics: item.metrics,
  } as QueueLead & { _metrics: typeof item.metrics };
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
  });
  const [selectedQueue, setSelectedQueue] = useState<QueueType>(initialQueueType);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ref to track if this is the initial fetch
  const isInitialFetch = useRef(true);

  // Fetch queue data
  const fetchQueue = useCallback(async () => {
    try {
      if (isInitialFetch.current) {
        setLoading(true);
      }
      setError(null);

      const response = await leadQueueService.getQueue(selectedQueue, page, pageSize);

      setLeads(response.leads.map(mapToQueueLead));
      setQueueCounts(transformQueueCounts(response.queueCounts));
      setTotalPages(response.pagination.totalPages);

      isInitialFetch.current = false;
    } catch (err) {
      console.error('Failed to fetch lead queue:', err);
      setError('Failed to load leads. Please try again.');
      if (!isInitialFetch.current) {
        notify('Failed to load leads', 'error');
      }
    } finally {
      setLoading(false);
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
  }, []);

  const changePage = useCallback((newPage: number) => {
    setPage(newPage);
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

  const updateEvaluation = useCallback(
    async (leadId: string, updates: UpdateEvaluationRequest) => {
      const previousLeads = leads;

      // Optimistic update - update the metrics
      setLeads((prev) =>
        prev.map((l) => {
          if (l.id !== leadId) return l;

          // Merge updates into existing metrics
          const existingMetrics = (l as any)._metrics || {};
          return {
            ...l,
            _metrics: {
              ...existingMetrics,
              ...(updates.arv !== undefined && { arv: updates.arv, arvSource: 'manual' }),
              ...(updates.rehabEstimate !== undefined && { rehabEstimate: updates.rehabEstimate, rehabSource: 'manual' }),
              ...(updates.rentEstimate !== undefined && { rentEstimate: updates.rentEstimate, rentSource: 'manual' }),
            },
          };
        })
      );

      try {
        const result = await leadQueueService.updateEvaluation(leadId, updates);

        // Update with server-calculated values (MAO, spread)
        setLeads((prev) =>
          prev.map((l) =>
            l.id === leadId
              ? {
                  ...l,
                  mao: result.metrics.mao,
                  spreadPercent: result.metrics.spreadPercent,
                  _metrics: result.metrics,
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

  // Mock data compatibility functions (for gradual migration)
  const markAsDone = useCallback(
    (leadId: string) => {
      updateLeadStatus(leadId, 'Contacted');
    },
    [updateLeadStatus]
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
    updateEvaluation,
    refetch: fetchQueue,
    markAsDone,
    markAsSkip,
  };
};

export default useLeadQueue;

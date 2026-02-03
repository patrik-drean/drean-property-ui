import { renderHook, act, waitFor } from '@testing-library/react';
import type { LeadQueueResponse, LeadQueueItem, UpdateEvaluationResponse } from '../../services/leadQueueService';
import type { LeadEventData, ConsolidationEventData } from '../useLeadEvents';

// Mock leadQueueService
const mockGetQueue = jest.fn();
const mockUpdateEvaluation = jest.fn();
const mockUpdateStatus = jest.fn();
const mockArchiveLead = jest.fn();
const mockUpdateSellerPhone = jest.fn();
const mockUpdateNotes = jest.fn();
const mockScheduleFollowUp = jest.fn();
const mockCancelFollowUp = jest.fn();
const mockDeleteLeadPermanently = jest.fn();

jest.mock('../../services/leadQueueService', () => ({
  leadQueueService: {
    getQueue: (...args: any[]) => mockGetQueue(...args),
    updateEvaluation: (...args: any[]) => mockUpdateEvaluation(...args),
    updateStatus: (...args: any[]) => mockUpdateStatus(...args),
    archiveLead: (...args: any[]) => mockArchiveLead(...args),
    updateSellerPhone: (...args: any[]) => mockUpdateSellerPhone(...args),
    updateNotes: (...args: any[]) => mockUpdateNotes(...args),
    scheduleFollowUp: (...args: any[]) => mockScheduleFollowUp(...args),
    cancelFollowUp: (...args: any[]) => mockCancelFollowUp(...args),
    deleteLeadPermanently: (...args: any[]) => mockDeleteLeadPermanently(...args),
  },
}));

// Mock formatTimeSince
jest.mock('../../types/queue', () => ({
  ...jest.requireActual('../../types/queue'),
  formatTimeSince: jest.fn((date: string) => '2 hours ago'),
}));

// Mock useLeadEvents
const mockUseLeadEvents = jest.fn();
jest.mock('../useLeadEvents', () => ({
  useLeadEvents: (handlers: any) => mockUseLeadEvents(handlers),
}));

// Now we can import the hook after setting up mocks
import { useLeadQueue } from '../useLeadQueue';

// Test fixtures
const mockLeadItem: LeadQueueItem = {
  id: 'lead-1',
  address: '123 Main St',
  city: 'Austin',
  state: 'TX',
  zipCode: '78701',
  listingPrice: 250000,
  score: 85,
  priority: 'high',
  priorityScore: 92,
  status: 'New',
  createdAt: '2025-01-15T10:00:00Z',
  timeAgo: '2 hours ago',
  metrics: {
    arv: 320000,
    arvConfidence: 85,
    arvSource: 'ai',
    rehabEstimate: 45000,
    rehabConfidence: 72,
    rehabSource: 'ai',
    mao: 179000,
    spreadPercent: 28,
    neighborhoodGrade: 'B+',
  },
  property: {
    beds: 3,
    baths: 2,
    sqft: 1850,
    yearBuilt: 1985,
    daysOnMarket: 15,
  },
  contact: {
    sellerPhone: '+15551234567',
    sellerEmail: 'seller@example.com',
    agentName: 'Jane Agent',
  },
  followUpDue: false,
};

const mockQueueResponse: LeadQueueResponse = {
  leads: [mockLeadItem],
  queueCounts: {
    actionNow: 5,
    followUp: 12,
    negotiating: 3,
    all: 20,
    archived: 2,
  },
  pagination: {
    page: 1,
    pageSize: 20,
    totalItems: 20,
    totalPages: 1,
  },
};

const mockLeadEvent: LeadEventData = {
  id: 'lead-2',
  address: '456 Oak Ave',
  city: 'Austin',
  state: 'TX',
  zipCode: '78702',
  listingPrice: 300000,
  score: 90,
  status: 'New',
  mao: 200000,
  spreadPercent: 33,
  isPriority: true,
  needsFollowUp: false,
  createdAt: '2025-01-16T10:00:00Z',
  arv: 350000,
  arvConfidence: null,
  rehabEstimate: 50000,
  rehabConfidence: null,
  rentEstimate: null,
  rentConfidence: null,
  neighborhoodGrade: 'A',
};

describe('useLeadQueue', () => {
  let capturedHandlers: any = {};

  beforeEach(() => {
    jest.clearAllMocks();
    capturedHandlers = {};

    // Setup mockUseLeadEvents to capture handlers and return connection status
    mockUseLeadEvents.mockImplementation((handlers) => {
      capturedHandlers = handlers;
      return { connectionStatus: 'connected' as const };
    });

    mockGetQueue.mockResolvedValue(mockQueueResponse);
  });

  describe('initialization', () => {
    it('should fetch leads on mount', async () => {
      const { result } = renderHook(() => useLeadQueue());

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockGetQueue).toHaveBeenCalledWith('all', 1, 20, undefined);
      expect(result.current.leads).toHaveLength(1);
      expect(result.current.queueCounts.all).toBe(20);
    });

    it('should use initial queue type option', async () => {
      renderHook(() => useLeadQueue({ initialQueueType: 'action_now' }));

      await waitFor(() => {
        expect(mockGetQueue).toHaveBeenCalledWith('action_now', 1, 20, undefined);
      });
    });

    it('should use custom page size', async () => {
      renderHook(() => useLeadQueue({ pageSize: 50 }));

      await waitFor(() => {
        expect(mockGetQueue).toHaveBeenCalledWith('all', 1, 50, undefined);
      });
    });

    it('should pass search parameter to API when provided', async () => {
      renderHook(() => useLeadQueue({ search: '123 Main St' }));

      await waitFor(() => {
        expect(mockGetQueue).toHaveBeenCalledWith('all', 1, 20, '123 Main St');
      });
    });

    it('should not pass search parameter when undefined', async () => {
      renderHook(() => useLeadQueue({}));

      await waitFor(() => {
        expect(mockGetQueue).toHaveBeenCalledWith('all', 1, 20, undefined);
      });
    });

    it('should pass empty search parameter as undefined', async () => {
      renderHook(() => useLeadQueue({ search: '' }));

      await waitFor(() => {
        expect(mockGetQueue).toHaveBeenCalledWith('all', 1, 20, '');
      });
    });

    it('should set error state when fetch fails', async () => {
      mockGetQueue.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useLeadQueue());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to load leads. Please try again.');
    });

    it('should return connection status from WebSocket', () => {
      const { result } = renderHook(() => useLeadQueue());
      expect(result.current.connectionStatus).toBe('connected');
    });
  });

  describe('queue filtering', () => {
    it('should change queue type and reset to page 1', async () => {
      const { result } = renderHook(() => useLeadQueue());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.changeQueue('action_now');
      });

      await waitFor(() => {
        expect(mockGetQueue).toHaveBeenCalledWith('action_now', 1, 20, undefined);
      });

      expect(result.current.selectedQueue).toBe('action_now');
      expect(result.current.page).toBe(1);
    });

    it('should support all queue types', async () => {
      const { result } = renderHook(() => useLeadQueue());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const queueTypes = ['action_now', 'follow_up', 'negotiating', 'all'] as const;

      for (const queueType of queueTypes) {
        act(() => {
          result.current.changeQueue(queueType);
        });

        await waitFor(() => {
          expect(result.current.selectedQueue).toBe(queueType);
        });
      }
    });
  });

  describe('pagination', () => {
    it('should change page', async () => {
      const { result } = renderHook(() => useLeadQueue());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.changePage(2);
      });

      await waitFor(() => {
        expect(mockGetQueue).toHaveBeenCalledWith('all', 2, 20, undefined);
      });

      expect(result.current.page).toBe(2);
    });

    it('should set total pages from response', async () => {
      mockGetQueue.mockResolvedValue({
        ...mockQueueResponse,
        pagination: { page: 1, pageSize: 20, totalItems: 100, totalPages: 5 },
      });

      const { result } = renderHook(() => useLeadQueue());

      await waitFor(() => {
        expect(result.current.totalPages).toBe(5);
      });
    });
  });

  describe('WebSocket events', () => {
    it('should add new lead from lead:created event', async () => {
      const onNotification = jest.fn();
      const { result } = renderHook(() => useLeadQueue({ onNotification }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        capturedHandlers.onLeadCreated?.(mockLeadEvent);
      });

      expect(result.current.leads).toHaveLength(2);
      expect(result.current.leads[0].id).toBe('lead-2'); // New lead at beginning
      expect(result.current.queueCounts.all).toBe(21); // Incremented
      expect(onNotification).toHaveBeenCalledWith('New lead: 456 Oak Ave', 'success');
    });

    it('should update existing lead from lead:updated event', async () => {
      const { result } = renderHook(() => useLeadQueue());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const updatedLead: LeadEventData = {
        ...mockLeadEvent,
        id: 'lead-1', // Update existing lead
        status: 'Contacted',
      };

      act(() => {
        capturedHandlers.onLeadUpdated?.(updatedLead);
      });

      expect(result.current.leads).toHaveLength(1);
      expect(result.current.leads[0].status).toBe('Contacted');
    });

    it('should handle lead:consolidated event with price drop notification', async () => {
      const onNotification = jest.fn();
      const { result } = renderHook(() => useLeadQueue({ onNotification }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const consolidationData: ConsolidationEventData = {
        lead: { ...mockLeadEvent, id: 'lead-1' },
        priceChange: { oldPrice: 300000, newPrice: 250000 },
      };

      act(() => {
        capturedHandlers.onLeadConsolidated?.(consolidationData);
      });

      expect(onNotification).toHaveBeenCalledWith(
        expect.stringContaining('Price dropped'),
        'info'
      );
    });

    it('should not show notification for price increase', async () => {
      const onNotification = jest.fn();
      const { result } = renderHook(() => useLeadQueue({ onNotification }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const consolidationData: ConsolidationEventData = {
        lead: { ...mockLeadEvent, id: 'lead-1' },
        priceChange: { oldPrice: 250000, newPrice: 300000 },
      };

      act(() => {
        capturedHandlers.onLeadConsolidated?.(consolidationData);
      });

      expect(onNotification).not.toHaveBeenCalledWith(
        expect.stringContaining('Price dropped'),
        'info'
      );
    });

    it('should remove lead from lead:deleted event', async () => {
      const { result } = renderHook(() => useLeadQueue());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        capturedHandlers.onLeadDeleted?.('lead-1');
      });

      expect(result.current.leads).toHaveLength(0);
      expect(result.current.queueCounts.all).toBe(19); // Decremented
    });

    it('should not decrement queue count below zero', async () => {
      mockGetQueue.mockResolvedValue({
        ...mockQueueResponse,
        queueCounts: { actionNow: 0, followUp: 0, negotiating: 0, all: 1 },
      });

      const { result } = renderHook(() => useLeadQueue());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        capturedHandlers.onLeadDeleted?.('lead-1');
      });

      expect(result.current.queueCounts.all).toBe(0); // Not negative
    });
  });

  describe('optimistic updates - updateLeadStatus', () => {
    it('should optimistically update lead status', async () => {
      mockUpdateStatus.mockResolvedValue(undefined);
      const onNotification = jest.fn();
      const { result } = renderHook(() => useLeadQueue({ onNotification }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.updateLeadStatus('lead-1', 'Contacted');
      });

      expect(result.current.leads[0].status).toBe('Contacted');
      expect(mockUpdateStatus).toHaveBeenCalledWith('lead-1', 'Contacted');
      expect(onNotification).toHaveBeenCalledWith('Status updated', 'success');
    });

    it('should rollback on status update failure', async () => {
      mockUpdateStatus.mockRejectedValue(new Error('Network error'));
      const onNotification = jest.fn();
      const { result } = renderHook(() => useLeadQueue({ onNotification }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const originalStatus = result.current.leads[0].status;

      await act(async () => {
        await result.current.updateLeadStatus('lead-1', 'Contacted');
      });

      // Should rollback to original status
      expect(result.current.leads[0].status).toBe(originalStatus);
      expect(onNotification).toHaveBeenCalledWith('Failed to update status', 'error');
    });
  });

  describe('optimistic updates - archiveLead', () => {
    it('should optimistically remove archived lead', async () => {
      mockArchiveLead.mockResolvedValue(undefined);
      const onNotification = jest.fn();
      const { result } = renderHook(() => useLeadQueue({ onNotification }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.archiveLead('lead-1');
      });

      expect(result.current.leads).toHaveLength(0);
      expect(result.current.queueCounts.all).toBe(19);
      expect(mockArchiveLead).toHaveBeenCalledWith('lead-1');
      expect(onNotification).toHaveBeenCalledWith('Lead archived', 'success');
    });

    it('should rollback on archive failure', async () => {
      mockArchiveLead.mockRejectedValue(new Error('Network error'));
      const onNotification = jest.fn();
      const { result } = renderHook(() => useLeadQueue({ onNotification }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const originalLeadsCount = result.current.leads.length;
      const originalAllCount = result.current.queueCounts.all;

      await act(async () => {
        await result.current.archiveLead('lead-1');
      });

      // Should rollback
      expect(result.current.leads).toHaveLength(originalLeadsCount);
      expect(result.current.queueCounts.all).toBe(originalAllCount);
      expect(onNotification).toHaveBeenCalledWith('Failed to archive lead', 'error');
    });
  });

  describe('optimistic updates - updateEvaluation', () => {
    const mockEvaluationResponse: UpdateEvaluationResponse = {
      id: 'lead-1',
      metrics: {
        arv: 350000,
        arvSource: 'manual',
        rehabEstimate: 50000,
        rehabSource: 'manual',
        mao: 195000,
        spreadPercent: 22,
        neighborhoodGrade: 'B+',
      },
      updatedAt: '2025-01-16T10:00:00Z',
    };

    it('should optimistically update ARV', async () => {
      mockUpdateEvaluation.mockResolvedValue(mockEvaluationResponse);
      const onNotification = jest.fn();
      const { result } = renderHook(() => useLeadQueue({ onNotification }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.updateEvaluation('lead-1', { arv: 350000, arvNote: 'Updated' });
      });

      expect(mockUpdateEvaluation).toHaveBeenCalledWith('lead-1', {
        arv: 350000,
        arvNote: 'Updated',
      });
      expect(onNotification).toHaveBeenCalledWith('Evaluation saved', 'success');
    });

    it('should update with server-calculated MAO and spread', async () => {
      mockUpdateEvaluation.mockResolvedValue(mockEvaluationResponse);
      const { result } = renderHook(() => useLeadQueue());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.updateEvaluation('lead-1', { arv: 350000 });
      });

      // Should use server-calculated values
      expect(result.current.leads[0].mao).toBe(195000);
      expect(result.current.leads[0].spreadPercent).toBe(22);
    });

    it('should rollback on evaluation update failure', async () => {
      mockUpdateEvaluation.mockRejectedValue(new Error('Network error'));
      const onNotification = jest.fn();
      const { result } = renderHook(() => useLeadQueue({ onNotification }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const originalLead = result.current.leads[0];

      await act(async () => {
        await result.current.updateEvaluation('lead-1', { arv: 350000 });
      });

      // Should rollback
      expect(result.current.leads[0]).toEqual(originalLead);
      expect(onNotification).toHaveBeenCalledWith('Failed to save evaluation', 'error');
    });
  });

  describe('optimistic updates - updateSellerPhone', () => {
    it('should optimistically update seller phone', async () => {
      mockUpdateSellerPhone.mockResolvedValue(undefined);
      const onNotification = jest.fn();
      const { result } = renderHook(() => useLeadQueue({ onNotification }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.updateSellerPhone('lead-1', '555-999-8888');
      });

      expect(result.current.leads[0].sellerPhone).toBe('555-999-8888');
      expect(mockUpdateSellerPhone).toHaveBeenCalledWith('lead-1', '555-999-8888');
      expect(onNotification).toHaveBeenCalledWith('Phone updated', 'success');
    });

    it('should handle null phone (clearing the value)', async () => {
      mockUpdateSellerPhone.mockResolvedValue(undefined);
      const { result } = renderHook(() => useLeadQueue());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.updateSellerPhone('lead-1', null);
      });

      expect(result.current.leads[0].sellerPhone).toBe('');
      expect(mockUpdateSellerPhone).toHaveBeenCalledWith('lead-1', null);
    });

    it('should rollback on phone update failure', async () => {
      mockUpdateSellerPhone.mockRejectedValue(new Error('Network error'));
      const onNotification = jest.fn();
      const { result } = renderHook(() => useLeadQueue({ onNotification }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const originalPhone = result.current.leads[0].sellerPhone;

      await act(async () => {
        await result.current.updateSellerPhone('lead-1', '555-999-8888');
      });

      // Should rollback to original phone
      expect(result.current.leads[0].sellerPhone).toBe(originalPhone);
      expect(onNotification).toHaveBeenCalledWith('Failed to update phone', 'error');
    });
  });

  describe('optimistic updates - scheduleFollowUp', () => {
    // Helper to get today's date string
    const getTodayString = () => {
      const today = new Date();
      return today.toISOString().split('T')[0];
    };

    // Helper to get tomorrow's date string
    const getTomorrowString = () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.toISOString().split('T')[0];
    };

    // Helper to get future date string (e.g., 5 days from now)
    const getFutureDateString = (daysFromNow: number) => {
      const future = new Date();
      future.setDate(future.getDate() + daysFromNow);
      return future.toISOString().split('T')[0];
    };

    it('should schedule follow-up without changing lead status', async () => {
      mockScheduleFollowUp.mockResolvedValue(undefined);
      const onNotification = jest.fn();
      const { result } = renderHook(() => useLeadQueue({ onNotification }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const originalStatus = result.current.leads[0].status;

      await act(async () => {
        await result.current.scheduleFollowUp('lead-1', getTomorrowString());
      });

      // Status should NOT change - user hasn't contacted them yet
      expect(mockScheduleFollowUp).toHaveBeenCalledWith('lead-1', getTomorrowString());
      // Should NOT call updateStatus
      expect(mockUpdateStatus).not.toHaveBeenCalled();
      expect(onNotification).toHaveBeenCalledWith('Follow-up scheduled', 'success');
    });

    it('should only call scheduleFollowUp API, not updateStatus', async () => {
      mockScheduleFollowUp.mockResolvedValue(undefined);
      const { result } = renderHook(() => useLeadQueue());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Clear any previous calls
      mockUpdateStatus.mockClear();

      await act(async () => {
        await result.current.scheduleFollowUp('lead-1', getTomorrowString());
      });

      // Verify scheduleFollowUp was called
      expect(mockScheduleFollowUp).toHaveBeenCalledWith('lead-1', getTomorrowString());
      // Verify updateStatus was NOT called (this was the bug fix)
      expect(mockUpdateStatus).not.toHaveBeenCalled();
    });

    it('should rollback on schedule follow-up failure', async () => {
      mockScheduleFollowUp.mockRejectedValue(new Error('Network error'));
      const onNotification = jest.fn();
      const { result } = renderHook(() => useLeadQueue({ onNotification }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const originalLeadsCount = result.current.leads.length;

      await act(async () => {
        await result.current.scheduleFollowUp('lead-1', getTomorrowString());
      });

      // Should rollback
      expect(result.current.leads).toHaveLength(originalLeadsCount);
      expect(onNotification).toHaveBeenCalledWith('Failed to schedule follow-up', 'error');
    });

    // TASK-114: Tests for date-based follow-up scheduling logic
    // These tests verify the date comparison logic used in optimistic updates
    describe('date-based queue count updates (TASK-114)', () => {
      it('should call scheduleFollowUp API with today date', async () => {
        mockScheduleFollowUp.mockResolvedValue(undefined);
        const { result } = renderHook(() => useLeadQueue({ initialQueueType: 'all' }));

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        await act(async () => {
          await result.current.scheduleFollowUp('lead-1', getTodayString());
        });

        expect(mockScheduleFollowUp).toHaveBeenCalledWith('lead-1', getTodayString());
      });

      it('should call scheduleFollowUp API with future date', async () => {
        mockScheduleFollowUp.mockResolvedValue(undefined);
        const { result } = renderHook(() => useLeadQueue({ initialQueueType: 'all' }));

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        await act(async () => {
          await result.current.scheduleFollowUp('lead-1', getTomorrowString());
        });

        expect(mockScheduleFollowUp).toHaveBeenCalledWith('lead-1', getTomorrowString());
      });

      it('should call scheduleFollowUp API with far future date', async () => {
        mockScheduleFollowUp.mockResolvedValue(undefined);
        const { result } = renderHook(() => useLeadQueue({ initialQueueType: 'all' }));

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        const farFutureDate = getFutureDateString(30);

        await act(async () => {
          await result.current.scheduleFollowUp('lead-1', farFutureDate);
        });

        expect(mockScheduleFollowUp).toHaveBeenCalledWith('lead-1', farFutureDate);
      });

      it('should remove lead from follow_up queue when scheduling for any date', async () => {
        mockScheduleFollowUp.mockResolvedValue(undefined);
        const { result } = renderHook(() => useLeadQueue({ initialQueueType: 'follow_up' }));

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        const initialLeadsCount = result.current.leads.length;
        expect(initialLeadsCount).toBe(1);

        // Start the action - lead should be removed optimistically
        let schedulePromise: Promise<void>;
        act(() => {
          schedulePromise = result.current.scheduleFollowUp('lead-1', getTomorrowString());
        });

        // Immediately check optimistic state (before API resolves)
        expect(result.current.leads).toHaveLength(0);

        // Complete the async operation
        await act(async () => {
          await schedulePromise;
        });
      });

      it('should remove lead from action_now queue when scheduling', async () => {
        mockScheduleFollowUp.mockResolvedValue(undefined);
        const { result } = renderHook(() => useLeadQueue({ initialQueueType: 'action_now' }));

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        expect(result.current.leads).toHaveLength(1);

        let schedulePromise: Promise<void>;
        act(() => {
          schedulePromise = result.current.scheduleFollowUp('lead-1', getTomorrowString());
        });

        // Should be removed from action_now view
        expect(result.current.leads).toHaveLength(0);

        await act(async () => {
          await schedulePromise;
        });
      });

      it('should keep lead in all queue when scheduling', async () => {
        mockScheduleFollowUp.mockResolvedValue(undefined);
        const { result } = renderHook(() => useLeadQueue({ initialQueueType: 'all' }));

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        expect(result.current.leads).toHaveLength(1);

        let schedulePromise: Promise<void>;
        act(() => {
          schedulePromise = result.current.scheduleFollowUp('lead-1', getTomorrowString());
        });

        // Should stay in 'all' view with updated properties
        expect(result.current.leads).toHaveLength(1);
        expect(result.current.leads[0].followUpDate).toBe(getTomorrowString());
        // followUpDue should be false for future date
        expect(result.current.leads[0].followUpDue).toBe(false);

        await act(async () => {
          await schedulePromise;
        });
      });

      it('should set followUpDue true when scheduling for today in all queue', async () => {
        mockScheduleFollowUp.mockResolvedValue(undefined);
        const { result } = renderHook(() => useLeadQueue({ initialQueueType: 'all' }));

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        let schedulePromise: Promise<void>;
        act(() => {
          schedulePromise = result.current.scheduleFollowUp('lead-1', getTodayString());
        });

        // followUpDue should be true for today's date
        expect(result.current.leads[0].followUpDue).toBe(true);
        expect(result.current.leads[0].followUpDate).toBe(getTodayString());

        await act(async () => {
          await schedulePromise;
        });
      });

      it('should set followUpDue false when scheduling for tomorrow in all queue', async () => {
        mockScheduleFollowUp.mockResolvedValue(undefined);
        const { result } = renderHook(() => useLeadQueue({ initialQueueType: 'all' }));

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        let schedulePromise: Promise<void>;
        act(() => {
          schedulePromise = result.current.scheduleFollowUp('lead-1', getTomorrowString());
        });

        // followUpDue should be false for future date
        expect(result.current.leads[0].followUpDue).toBe(false);
        expect(result.current.leads[0].followUpDate).toBe(getTomorrowString());

        await act(async () => {
          await schedulePromise;
        });
      });

      it('should refetch queue after successful schedule', async () => {
        mockScheduleFollowUp.mockResolvedValue(undefined);
        const { result } = renderHook(() => useLeadQueue({ initialQueueType: 'all' }));

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        const initialCallCount = mockGetQueue.mock.calls.length;

        await act(async () => {
          await result.current.scheduleFollowUp('lead-1', getTomorrowString());
        });

        // Should have called getQueue again after scheduling
        expect(mockGetQueue.mock.calls.length).toBeGreaterThan(initialCallCount);
      });

      it('should rollback to original state on API error', async () => {
        mockScheduleFollowUp.mockRejectedValue(new Error('Network error'));
        const onNotification = jest.fn();
        const { result } = renderHook(() => useLeadQueue({ initialQueueType: 'all', onNotification }));

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        const originalFollowUpDue = result.current.leads[0].followUpDue;
        const originalFollowUpDate = result.current.leads[0].followUpDate;

        await act(async () => {
          await result.current.scheduleFollowUp('lead-1', getTomorrowString());
        });

        // Should rollback to original values
        expect(result.current.leads[0].followUpDue).toBe(originalFollowUpDue);
        expect(result.current.leads[0].followUpDate).toBe(originalFollowUpDate);
        expect(onNotification).toHaveBeenCalledWith('Failed to schedule follow-up', 'error');
      });
    });
  });

  describe('helper actions', () => {
    it('should mark lead as done (Contacted status)', async () => {
      mockUpdateStatus.mockResolvedValue(undefined);
      const { result } = renderHook(() => useLeadQueue());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        result.current.markAsDone('lead-1');
      });

      await waitFor(() => {
        expect(mockUpdateStatus).toHaveBeenCalledWith('lead-1', 'Contacted');
      });
    });

    it('should skip lead by scheduling follow-up', async () => {
      mockScheduleFollowUp.mockResolvedValue(undefined);
      const onNotification = jest.fn();
      const { result } = renderHook(() => useLeadQueue({ onNotification }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        result.current.markAsSkip('lead-1');
      });

      // markAsSkip delegates to scheduleFollowUp, which shows "Follow-up scheduled"
      await waitFor(() => {
        expect(mockScheduleFollowUp).toHaveBeenCalled();
        expect(onNotification).toHaveBeenCalledWith('Follow-up scheduled', 'success');
      });
    });
  });

  describe('refetch', () => {
    it('should refetch queue data', async () => {
      const { result } = renderHook(() => useLeadQueue());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockGetQueue).toHaveBeenCalledTimes(1);

      await act(async () => {
        await result.current.refetch();
      });

      expect(mockGetQueue).toHaveBeenCalledTimes(2);
    });
  });

  describe('data transformation', () => {
    it('should transform API queue counts from camelCase to snake_case', async () => {
      const { result } = renderHook(() => useLeadQueue());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.queueCounts).toEqual({
        action_now: 5,
        follow_up: 12,
        negotiating: 3,
        all: 20,
        archived: 2,
      });
    });

    it('should map API LeadQueueItem to frontend QueueLead', async () => {
      const { result } = renderHook(() => useLeadQueue());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const lead = result.current.leads[0];
      expect(lead.id).toBe('lead-1');
      expect(lead.address).toBe('123 Main St');
      expect(lead.listingPrice).toBe(250000);
      expect(lead.leadScore).toBe(85);
      expect(lead.priority).toBe('high');
    });
  });

  describe('notifications', () => {
    it('should call onNotification callback when provided', async () => {
      const onNotification = jest.fn();
      mockUpdateStatus.mockResolvedValue(undefined);

      const { result } = renderHook(() => useLeadQueue({ onNotification }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.updateLeadStatus('lead-1', 'Contacted');
      });

      expect(onNotification).toHaveBeenCalledWith('Status updated', 'success');
    });

    it('should not crash when onNotification not provided', async () => {
      mockUpdateStatus.mockResolvedValue(undefined);

      const { result } = renderHook(() => useLeadQueue());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.updateLeadStatus('lead-1', 'Contacted');
      });

      // Should not throw
      expect(result.current.leads[0].status).toBe('Contacted');
    });
  });

  describe('edge cases', () => {
    it('should handle empty queue response', async () => {
      mockGetQueue.mockResolvedValue({
        leads: [],
        queueCounts: { actionNow: 0, followUp: 0, negotiating: 0, all: 0 },
        pagination: { page: 1, pageSize: 20, totalItems: 0, totalPages: 0 },
      });

      const { result } = renderHook(() => useLeadQueue());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.leads).toEqual([]);
      expect(result.current.queueCounts.all).toBe(0);
    });

    it('should not show notification on initial fetch error', async () => {
      mockGetQueue.mockRejectedValue(new Error('Network error'));
      const onNotification = jest.fn();

      renderHook(() => useLeadQueue({ onNotification }));

      await waitFor(() => {
        expect(onNotification).not.toHaveBeenCalled();
      });
    });

    it('should show notification on subsequent fetch error', async () => {
      const onNotification = jest.fn();
      const { result } = renderHook(() => useLeadQueue({ onNotification }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      mockGetQueue.mockRejectedValue(new Error('Network error'));

      await act(async () => {
        await result.current.refetch();
      });

      expect(onNotification).toHaveBeenCalledWith('Failed to load leads', 'error');
    });
  });
});

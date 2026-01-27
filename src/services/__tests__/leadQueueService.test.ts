import {
  LeadQueueResponse,
  LeadQueueItem,
  QueueCounts,
  UpdateEvaluationRequest,
  UpdateEvaluationResponse,
  QueueType,
} from '../leadQueueService';

// Mock axios module
const mockGet = jest.fn();
const mockPut = jest.fn();

jest.mock('../api', () => ({
  axiosInstance: {
    get: (...args: any[]) => mockGet(...args),
    put: (...args: any[]) => mockPut(...args),
  },
}));

// Import service AFTER setting up mocks
import { leadQueueService } from '../leadQueueService';

// Test fixtures
const mockLeadQueueItem: LeadQueueItem = {
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
  suggestedTemplate: {
    name: 'Initial Outreach',
    preview: 'Hi, I noticed your property at...',
  },
  zillowLink: 'https://zillow.com/123-main-st',
  followUpDue: false,
};

const mockQueueCounts: QueueCounts = {
  actionNow: 5,
  followUp: 12,
  negotiating: 3,
  all: 20,
};

const mockQueueResponse: LeadQueueResponse = {
  leads: [mockLeadQueueItem],
  queueCounts: mockQueueCounts,
  pagination: {
    page: 1,
    pageSize: 20,
    totalItems: 1,
    totalPages: 1,
  },
};

describe('leadQueueService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getQueue', () => {
    it('should fetch queue with default parameters', async () => {
      mockGet.mockResolvedValue({ data: mockQueueResponse });

      const result = await leadQueueService.getQueue();

      expect(mockGet).toHaveBeenCalledWith('/api/leads/queue?type=all&page=1&pageSize=20');
      expect(result).toEqual(mockQueueResponse);
      expect(result.leads).toHaveLength(1);
    });

    it('should fetch queue with custom queue type', async () => {
      mockGet.mockResolvedValue({ data: mockQueueResponse });

      await leadQueueService.getQueue('action_now');

      expect(mockGet).toHaveBeenCalledWith('/api/leads/queue?type=action_now&page=1&pageSize=20');
    });

    it('should fetch queue with custom pagination', async () => {
      mockGet.mockResolvedValue({ data: mockQueueResponse });

      await leadQueueService.getQueue('all', 2, 50);

      expect(mockGet).toHaveBeenCalledWith('/api/leads/queue?type=all&page=2&pageSize=50');
    });

    it('should support all queue types', async () => {
      mockGet.mockResolvedValue({ data: mockQueueResponse });

      const queueTypes: QueueType[] = ['action_now', 'follow_up', 'negotiating', 'all'];

      for (const type of queueTypes) {
        await leadQueueService.getQueue(type);
        expect(mockGet).toHaveBeenCalledWith(expect.stringContaining(`type=${type}`));
      }
    });

    it('should return empty leads array when no leads exist', async () => {
      const emptyResponse: LeadQueueResponse = {
        leads: [],
        queueCounts: { actionNow: 0, followUp: 0, negotiating: 0, all: 0 },
        pagination: { page: 1, pageSize: 20, totalItems: 0, totalPages: 0 },
      };
      mockGet.mockResolvedValue({ data: emptyResponse });

      const result = await leadQueueService.getQueue();

      expect(result.leads).toEqual([]);
      expect(result.queueCounts.all).toBe(0);
    });

    it('should throw error when API request fails', async () => {
      mockGet.mockRejectedValue(new Error('Network error'));

      await expect(leadQueueService.getQueue()).rejects.toThrow('Network error');
    });

    it('should throw error for unauthorized access', async () => {
      mockGet.mockRejectedValue({ response: { status: 401 } });

      await expect(leadQueueService.getQueue()).rejects.toEqual({
        response: { status: 401 },
      });
    });
  });

  describe('updateEvaluation', () => {
    const mockEvaluationResponse: UpdateEvaluationResponse = {
      id: 'lead-1',
      metrics: {
        arv: 350000,
        arvConfidence: undefined,
        arvSource: 'manual',
        arvNote: 'Updated based on recent comps',
        rehabEstimate: 50000,
        rehabConfidence: undefined,
        rehabSource: 'manual',
        mao: 195000,
        spreadPercent: 22,
        neighborhoodGrade: 'B+',
      },
      updatedAt: '2025-01-16T10:00:00Z',
    };

    it('should update evaluation with ARV only', async () => {
      const request: UpdateEvaluationRequest = {
        arv: 350000,
        arvNote: 'Updated based on recent comps',
      };
      mockPut.mockResolvedValue({ data: mockEvaluationResponse });

      const result = await leadQueueService.updateEvaluation('lead-1', request);

      expect(mockPut).toHaveBeenCalledWith('/api/leads/lead-1/evaluation', request);
      expect(result.metrics.arv).toBe(350000);
      expect(result.metrics.arvSource).toBe('manual');
    });

    it('should update evaluation with rehab estimate only', async () => {
      const request: UpdateEvaluationRequest = {
        rehabEstimate: 50000,
        rehabNote: 'Needs new roof and HVAC',
      };
      mockPut.mockResolvedValue({ data: mockEvaluationResponse });

      await leadQueueService.updateEvaluation('lead-1', request);

      expect(mockPut).toHaveBeenCalledWith('/api/leads/lead-1/evaluation', request);
    });

    it('should update evaluation with rent estimate', async () => {
      const request: UpdateEvaluationRequest = {
        rentEstimate: 2500,
        rentNote: 'Based on local market',
      };
      mockPut.mockResolvedValue({ data: mockEvaluationResponse });

      await leadQueueService.updateEvaluation('lead-1', request);

      expect(mockPut).toHaveBeenCalledWith('/api/leads/lead-1/evaluation', request);
    });

    it('should update multiple evaluation fields at once', async () => {
      const request: UpdateEvaluationRequest = {
        arv: 350000,
        arvNote: 'Updated ARV',
        rehabEstimate: 50000,
        rehabNote: 'Updated rehab',
        rentEstimate: 2500,
        rentNote: 'Updated rent',
      };
      mockPut.mockResolvedValue({ data: mockEvaluationResponse });

      await leadQueueService.updateEvaluation('lead-1', request);

      expect(mockPut).toHaveBeenCalledWith('/api/leads/lead-1/evaluation', request);
    });

    it('should return server-calculated MAO and spread', async () => {
      const request: UpdateEvaluationRequest = { arv: 350000 };
      mockPut.mockResolvedValue({ data: mockEvaluationResponse });

      const result = await leadQueueService.updateEvaluation('lead-1', request);

      // Server should recalculate these values
      expect(result.metrics.mao).toBe(195000);
      expect(result.metrics.spreadPercent).toBe(22);
    });

    it('should throw error when lead not found', async () => {
      const request: UpdateEvaluationRequest = { arv: 350000 };
      mockPut.mockRejectedValue({ response: { status: 404 } });

      await expect(leadQueueService.updateEvaluation('invalid-id', request)).rejects.toEqual({
        response: { status: 404 },
      });
    });

    it('should throw error when API request fails', async () => {
      const request: UpdateEvaluationRequest = { arv: 350000 };
      mockPut.mockRejectedValue(new Error('Network error'));

      await expect(leadQueueService.updateEvaluation('lead-1', request)).rejects.toThrow(
        'Network error'
      );
    });
  });

  describe('updateStatus', () => {
    it('should update lead status successfully', async () => {
      mockPut.mockResolvedValue({});

      await leadQueueService.updateStatus('lead-1', 'Contacted');

      expect(mockPut).toHaveBeenCalledWith('/api/PropertyLeads/lead-1', { status: 'Contacted' });
    });

    it('should support various status values', async () => {
      mockPut.mockResolvedValue({});

      const statuses = ['New', 'Contacted', 'Negotiating', 'Closed', 'Lost'];

      for (const status of statuses) {
        await leadQueueService.updateStatus('lead-1', status);
        expect(mockPut).toHaveBeenCalledWith('/api/PropertyLeads/lead-1', { status });
      }
    });

    it('should throw error when lead not found', async () => {
      mockPut.mockRejectedValue({ response: { status: 404 } });

      await expect(leadQueueService.updateStatus('invalid-id', 'Contacted')).rejects.toEqual({
        response: { status: 404 },
      });
    });

    it('should throw error when API request fails', async () => {
      mockPut.mockRejectedValue(new Error('Network error'));

      await expect(leadQueueService.updateStatus('lead-1', 'Contacted')).rejects.toThrow(
        'Network error'
      );
    });
  });

  describe('archiveLead', () => {
    it('should archive lead successfully', async () => {
      mockPut.mockResolvedValue({});

      await leadQueueService.archiveLead('lead-1');

      expect(mockPut).toHaveBeenCalledWith('/api/PropertyLeads/lead-1/archive');
    });

    it('should throw error when lead not found', async () => {
      mockPut.mockRejectedValue({ response: { status: 404 } });

      await expect(leadQueueService.archiveLead('invalid-id')).rejects.toEqual({
        response: { status: 404 },
      });
    });

    it('should throw error when API request fails', async () => {
      mockPut.mockRejectedValue(new Error('Network error'));

      await expect(leadQueueService.archiveLead('lead-1')).rejects.toThrow('Network error');
    });

    it('should throw error for unauthorized access', async () => {
      mockPut.mockRejectedValue({ response: { status: 403 } });

      await expect(leadQueueService.archiveLead('lead-1')).rejects.toEqual({
        response: { status: 403 },
      });
    });
  });
});

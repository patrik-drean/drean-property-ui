import { PromoteResponse } from '../listingsService';

// Mock axios module
const mockPost = jest.fn();

jest.mock('axios', () => {
  return {
    create: () => ({
      get: jest.fn(),
      post: (...args: any[]) => mockPost(...args),
      put: jest.fn(),
      delete: jest.fn(),
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() },
      },
    }),
  };
});

// Import service AFTER setting up mocks
import { promoteListings } from '../listingsService';

// Test fixtures
const mockPromoteResponse: PromoteResponse = {
  promotedCount: 3,
  duplicateCount: 1,
  failedCount: 0,
  totalEvaluationCost: 1.50,
  minScoreUsed: 75,
  limitUsed: 5,
  maxAgeHoursUsed: null,
  dryRun: false,
  candidateCount: 4,
  results: [
    {
      listingId: 'listing-1',
      externalId: 'zpid-1',
      status: 'promoted',
      leadId: 'lead-1',
      leadScore: 8,
      evaluationCost: 0.50,
      error: null,
    },
    {
      listingId: 'listing-2',
      externalId: 'zpid-2',
      status: 'promoted',
      leadId: 'lead-2',
      leadScore: 7,
      evaluationCost: 0.50,
      error: null,
    },
    {
      listingId: 'listing-3',
      externalId: 'zpid-3',
      status: 'promoted',
      leadId: 'lead-3',
      leadScore: 9,
      evaluationCost: 0.50,
      error: null,
    },
    {
      listingId: 'listing-4',
      externalId: 'zpid-4',
      status: 'duplicate',
      leadId: 'existing-lead',
      leadScore: 7,
      evaluationCost: null,
      error: null,
    },
  ],
  message: 'Promoted 3 listings to leads (score >= 75)',
};

describe('listingsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('promoteListings', () => {
    it('should call API with default parameters', async () => {
      mockPost.mockResolvedValue({ data: mockPromoteResponse });

      await promoteListings();

      expect(mockPost).toHaveBeenCalledWith(
        '/api/listings/promote?minScore=75&dryRun=false'
      );
    });

    it('should call API with custom minScore and limit', async () => {
      mockPost.mockResolvedValue({ data: mockPromoteResponse });

      await promoteListings({ minScore: 80, limit: 10 });

      expect(mockPost).toHaveBeenCalledWith(
        '/api/listings/promote?minScore=80&limit=10&dryRun=false'
      );
    });

    it('should call API with all parameters', async () => {
      mockPost.mockResolvedValue({ data: mockPromoteResponse });

      await promoteListings({ minScore: 70, limit: 5, maxAgeHours: 24, dryRun: true });

      expect(mockPost).toHaveBeenCalledWith(
        '/api/listings/promote?minScore=70&limit=5&maxAgeHours=24&dryRun=true'
      );
    });

    it('should return promote response on success', async () => {
      mockPost.mockResolvedValue({ data: mockPromoteResponse });

      const result = await promoteListings({ minScore: 75, limit: 5 });

      expect(result).toEqual(mockPromoteResponse);
      expect(result.promotedCount).toBe(3);
      expect(result.duplicateCount).toBe(1);
      expect(result.results).toHaveLength(4);
    });

    it('should handle empty results (no candidates)', async () => {
      const emptyResponse: PromoteResponse = {
        ...mockPromoteResponse,
        promotedCount: 0,
        duplicateCount: 0,
        candidateCount: 0,
        results: [],
        message: 'No listings found with score >= 75',
      };
      mockPost.mockResolvedValue({ data: emptyResponse });

      const result = await promoteListings();

      expect(result.candidateCount).toBe(0);
      expect(result.results).toHaveLength(0);
    });

    it('should handle dry run mode', async () => {
      const dryRunResponse: PromoteResponse = {
        ...mockPromoteResponse,
        dryRun: true,
        promotedCount: 0,
        results: mockPromoteResponse.results.map(r => ({ ...r, status: 'candidate' as const })),
        message: 'Dry run: found 4 candidates with score >= 75',
      };
      mockPost.mockResolvedValue({ data: dryRunResponse });

      const result = await promoteListings({ dryRun: true });

      expect(result.dryRun).toBe(true);
      expect(result.promotedCount).toBe(0);
    });

    it('should throw error when API request fails', async () => {
      mockPost.mockRejectedValue(new Error('Network error'));

      await expect(promoteListings()).rejects.toThrow('Network error');
    });

    it('should throw error for server errors', async () => {
      mockPost.mockRejectedValue({
        response: { status: 500, data: { message: 'Internal server error' } },
      });

      await expect(promoteListings()).rejects.toEqual({
        response: { status: 500, data: { message: 'Internal server error' } },
      });
    });

    it('should throw error for unauthorized requests', async () => {
      mockPost.mockRejectedValue({
        response: { status: 401, data: { message: 'Unauthorized' } },
      });

      await expect(promoteListings()).rejects.toEqual({
        response: { status: 401, data: { message: 'Unauthorized' } },
      });
    });
  });
});

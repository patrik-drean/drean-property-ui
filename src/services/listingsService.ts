import { axiosInstance } from './api';

export interface PromotionResult {
  listingId: string;
  externalId: string;
  status: 'promoted' | 'duplicate' | 'failed' | 'candidate';
  leadId: string | null;
  leadScore: number | null;
  evaluationCost: number | null;
  error: string | null;
  address?: string;
  listingPrice?: number;
  listingScore?: number;
}

export interface PromoteResponse {
  promotedCount: number;
  duplicateCount: number;
  failedCount: number;
  totalEvaluationCost: number;
  minScoreUsed: number;
  limitUsed: number | null;
  maxAgeHoursUsed: number | null;
  dryRun: boolean;
  candidateCount: number;
  results: PromotionResult[];
  message: string;
}

export interface PromoteListingsOptions {
  minScore?: number;
  limit?: number;
  maxAgeHours?: number;
  dryRun?: boolean;
}

/**
 * Promote high-scoring listings to leads.
 * Listings with score >= minScore that aren't already promoted will be converted to leads.
 */
export const promoteListings = async (
  options: PromoteListingsOptions = {}
): Promise<PromoteResponse> => {
  const { minScore = 75, limit, maxAgeHours, dryRun = false } = options;

  const params = new URLSearchParams();
  params.append('minScore', minScore.toString());
  if (limit !== undefined) params.append('limit', limit.toString());
  if (maxAgeHours !== undefined) params.append('maxAgeHours', maxAgeHours.toString());
  params.append('dryRun', dryRun.toString());

  const response = await axiosInstance.post<PromoteResponse>(
    `/api/listings/promote?${params.toString()}`
  );
  return response.data;
};

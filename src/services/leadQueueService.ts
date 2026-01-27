import { axiosInstance } from './api';

// Types matching backend API contracts
export interface LeadMetrics {
  arv?: number;
  arvConfidence?: number;
  arvSource?: string;
  arvNote?: string;
  rehabEstimate?: number;
  rehabConfidence?: number;
  rehabSource?: string;
  rehabNote?: string;
  rentEstimate?: number;
  rentConfidence?: number;
  rentSource?: string;
  rentNote?: string;
  mao?: number;
  spreadPercent?: number;
  neighborhoodGrade?: string;
}

export interface PropertyInfo {
  beds?: number;
  baths?: number;
  sqft?: number;
  yearBuilt?: number;
  units?: number;
  daysOnMarket?: number;
}

export interface ContactInfo {
  sellerPhone?: string;
  sellerEmail?: string;
  agentName?: string;
}

export interface SuggestedTemplate {
  name: string;
  preview: string;
}

export interface LeadQueueItem {
  id: string;
  address: string;
  city?: string;
  state?: string;
  zipCode?: string;
  listingPrice: number;
  score: number;
  priority: 'urgent' | 'high' | 'medium' | 'normal';
  priorityScore: number;
  status: string;
  createdAt: string;
  timeAgo: string;
  metrics: LeadMetrics;
  property: PropertyInfo;
  contact: ContactInfo;
  suggestedTemplate?: SuggestedTemplate;
  zillowLink?: string;
  photoUrl?: string;
  followUpDue: boolean;
  aiSummary?: string;
}

export interface QueueCounts {
  actionNow: number;
  followUp: number;
  negotiating: number;
  all: number;
}

export interface PaginationInfo {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface LeadQueueResponse {
  leads: LeadQueueItem[];
  queueCounts: QueueCounts;
  pagination: PaginationInfo;
}

export type QueueType = 'action_now' | 'follow_up' | 'negotiating' | 'all';

export interface UpdateEvaluationRequest {
  arv?: number;
  arvNote?: string;
  rehabEstimate?: number;
  rehabNote?: string;
  rentEstimate?: number;
  rentNote?: string;
}

export interface UpdateEvaluationResponse {
  id: string;
  metrics: LeadMetrics;
  updatedAt: string;
}

/**
 * Lead Queue Service
 * Provides API functions for the Review Page queue operations.
 */
export const leadQueueService = {
  /**
   * Fetch leads for the queue with priority sorting and filtering.
   * @param type Queue type filter (action_now, follow_up, negotiating, all)
   * @param page Page number (1-based)
   * @param pageSize Number of items per page
   */
  async getQueue(
    type: QueueType = 'all',
    page = 1,
    pageSize = 20
  ): Promise<LeadQueueResponse> {
    const params = new URLSearchParams({
      type,
      page: String(page),
      pageSize: String(pageSize),
    });
    const response = await axiosInstance.get<LeadQueueResponse>(
      `/api/leads/queue?${params}`
    );
    return response.data;
  },

  /**
   * Update lead evaluation metrics (ARV, Rehab, Rent) with optional notes.
   * Server recalculates MAO and spread based on new values.
   * @param leadId The lead ID to update
   * @param updates The evaluation updates
   */
  async updateEvaluation(
    leadId: string,
    updates: UpdateEvaluationRequest
  ): Promise<UpdateEvaluationResponse> {
    const response = await axiosInstance.put<UpdateEvaluationResponse>(
      `/api/leads/${leadId}/evaluation`,
      updates
    );
    return response.data;
  },

  /**
   * Update lead status.
   * @param leadId The lead ID to update
   * @param status The new status
   */
  async updateStatus(leadId: string, status: string): Promise<void> {
    await axiosInstance.put(`/api/PropertyLeads/${leadId}`, { status });
  },

  /**
   * Archive a lead (soft delete).
   * @param leadId The lead ID to archive
   */
  async archiveLead(leadId: string): Promise<void> {
    await axiosInstance.put(`/api/PropertyLeads/${leadId}/archive`);
  },
};

export default leadQueueService;

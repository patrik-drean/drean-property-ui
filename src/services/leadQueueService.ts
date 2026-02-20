import { axiosInstance } from './api';

// Raw evaluation types for tooltip display
export interface RawArvEstimate {
  arv: number;
  arvPerSqft: number;
  arvLow?: number;
  arvHigh?: number;
  confidence: number;
  source: string;
  estimatedAt: string;
  // Quality metadata from comp filtering (TASK-106)
  averageCompAgeDays?: number;
  searchRadiusUsed?: string;
  filterTierUsed?: string;
  wasExpanded?: boolean;
}

export interface RawRehabEstimate {
  lowEstimate: number;
  midEstimate: number;
  highEstimate: number;
  tier: string;
  confidence: number;
  source: string;
  estimatedAt: string;
}

export interface RawRentEstimate {
  rent: number;
  rentLow?: number;
  rentHigh?: number;
  confidence: number;
  source: string;
  estimatedAt: string;
}

export interface RawNeighborhoodGrade {
  grade: string;
  gradeDescription: string;
  confidence: number;
  source: string;
  gradedAt: string;
}

export interface RawScore {
  score: number;
  maoSpreadScore: number;
  neighborhoodScore: number;
  confidenceScore: number;
  mao: number;
  maoSpreadPercent: number;
  recommendation: string;
  aiSummary?: string;
  aiVerdict?: string;
  aiWeaknesses?: string[];
  isDisqualified: boolean;
  disqualifyReason?: string;
}

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
  // Raw evaluation objects for tooltip display
  rawArvEstimate?: RawArvEstimate;
  rawRehabEstimate?: RawRehabEstimate;
  rawRentEstimate?: RawRentEstimate;
  rawNeighborhoodGrade?: RawNeighborhoodGrade;
  rawScore?: RawScore;
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
  photoUrls?: string[];
  followUpDue: boolean;
  followUpDate?: string;
  // AI evaluation fields
  aiSummary?: string;
  aiVerdict?: string;
  aiWeaknesses?: string[];
  recommendation?: string;
  // Comparables from ARV evaluation
  comparables?: ComparableSale[];
  // Enrichment metadata JSON
  metadata?: string;
  // Consolidation tracking (TASK-107)
  lastConsolidatedAt?: string;
  lastConsolidatedSource?: string;
  consolidationCount?: number;
  // User notes
  notes?: string;
}

export interface QueueCounts {
  actionNow: number;
  followUp: number;
  negotiating: number;
  all: number;
  archived: number;
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

export type QueueType = 'action_now' | 'follow_up' | 'negotiating' | 'all' | 'archived';

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

// RentCast API types
export interface ComparableSale {
  id: string;
  address: string;
  city?: string;
  state?: string;
  zipCode?: string;
  salePrice: number;
  pricePerSqft: number;
  squareFeet?: number;
  bedrooms?: number;
  bathrooms?: number;
  saleDate: string;
  distanceMiles: number;
  zillowUrl?: string;
  propertyType?: string;
  // Filtering metadata (TASK-106)
  daysAgo?: number;
  status?: 'used' | 'excluded';
  exclusionReason?: string;
}

export interface RentCastArvResult {
  arv: number;
  arvSource: 'rentcast';
  arvConfidence: number;
  comparables: ComparableSale[];
  requestsRemaining: number;
  updatedAt: string;
}

// Lead Ingestion types
export interface IngestLeadRequest {
  address: string;
  listingPrice: number;
  city?: string;
  state?: string;
  zipCode?: string;
  squareFootage?: number;
  yearBuilt?: number;
  bedrooms?: number;
  bathrooms?: number;
  units?: number;
  zillowLink?: string;
  photoUrls?: string[];
  zestimate?: number;
  rentZestimate?: number;
  sellerPhone?: string;
  sellerEmail?: string;
  agentName?: string;
  agentPhone?: string;
  source?: string;
  sendFirstMessage?: boolean;
  metadata?: string;  // JSON string of EnrichmentMetadata
}

export interface LeadDto {
  id: string;
  address: string;
  listingPrice: number;
  score?: number;
  mao?: number;
  status: string;
  createdAt: string;
}

export interface EvaluationSummary {
  score: number;
  mao: number;
  maoSpreadPercent: number;
  isDisqualified: boolean;
  disqualifyReason?: string;
  tier: string;
}

export interface ConsolidationInfo {
  oldPrice?: number;
  newPrice?: number;
  priceChangePercent?: number;
  isPriceDropped: boolean;
  oldScore?: number;
  newScore?: number;
}

export interface IngestLeadResponse {
  lead: LeadDto;
  evaluation: EvaluationSummary;
  autoSmsTriggered: boolean;
  autoSmsError?: string;
  correlationId: string;
  wasConsolidated: boolean;
  consolidation?: ConsolidationInfo;
}

// Listing Enrichment types
export interface EnrichedAgentInfo {
  name?: string;
  phone?: string;
  email?: string;
  agency?: string;
}

// Enrichment metadata for investment analysis
export interface EnrichmentMetadata {
  taxAssessedValue?: number;
  propertyTaxRate?: number;
  monthlyHoaFee?: number;
  lotSize?: string;
  propertyCondition?: string;
  isNewConstruction?: boolean;
  bathroomsFull?: number;
  bathroomsHalf?: number;
  pricePerSquareFoot?: number;
  zestimate?: number;
  rentZestimate?: number;
  daysOnMarket?: number;
  description?: string;
}

export interface EnrichedListingData {
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  listingPrice?: number;
  squareFootage?: number;
  bedrooms?: number;
  bathrooms?: number;
  yearBuilt?: number;
  units?: number;
  propertyType?: string;
  daysOnMarket?: number;
  zestimate?: number;
  rentZestimate?: number;
  description?: string;
  photoUrls: string[];
  agent?: EnrichedAgentInfo;
  zillowLink?: string;
  zpid?: string;
  metadata?: EnrichmentMetadata;
}

export interface EnrichListingResponse {
  success: boolean;
  data?: EnrichedListingData;
  error?: string;
  partialData?: EnrichedListingData;
}

// Debug and Evaluation Transparency types (TASK-086)
export interface ProviderSnapshot {
  prompt?: string;
  rawResponse?: string;
  parsedResult?: unknown;
  cost?: number;
  durationMs?: number;
  error?: string;
  providerName?: string;
}

export interface ProviderError {
  provider: string;
  error: string;
  stackTrace?: string;
}

export interface EvaluationHistoryItem {
  id: string;
  leadId: string;
  evaluatedAt: string;
  tier: string;
  triggerSource: string;
  triggeredBy?: string;
  correlationId?: string;
  totalCost?: number;
  durationMs?: number;
  arvSnapshot?: ProviderSnapshot;
  rehabSnapshot?: ProviderSnapshot;
  rentSnapshot?: ProviderSnapshot;
  neighborhoodSnapshot?: ProviderSnapshot;
  summarySnapshot?: ProviderSnapshot;
  scoreSnapshot?: ProviderSnapshot;
  errors: ProviderError[];
}

export interface LeadActivityItem {
  id: string;
  leadId: string;
  occurredAt: string;
  eventType: string;
  eventData: Record<string, unknown>;
  triggeredBy?: string;
  correlationId?: string;
}

export interface LeadDebugDto {
  id: string;
  userId: string;
  address: string;
  city?: string;
  state?: string;
  zipCode?: string;
  listingPrice: number;
  originalListingPrice?: number;
  hasPriceDropped: boolean;
  squareFootage?: number;
  yearBuilt?: number;
  bedrooms?: number;
  bathrooms?: number;
  units?: number;
  zillowLink?: string;
  photoUrls: string[];
  status: string;
  createdAt: string;
  updatedAt?: string;
  lastEvaluatedAt?: string;
  evaluationTier?: string;
  isDisqualified: boolean;
  disqualifyReason?: string;
  calculatedMao?: number;
  maoSpreadPercent?: number;
  isPriority: boolean;
  isArchived: boolean;
  notes?: string;
  tags: string[];
  source?: string;
  sourceId?: string;
  sources: string[];
  normalizedAddress?: string;
  metadata: string;
  evaluationNotes?: string;
}

export interface EvaluationDataDto {
  arvEstimate?: unknown;
  rehabEstimate?: unknown;
  rentEstimate?: unknown;
  neighborhoodGrade?: unknown;
  score?: unknown;
  evaluationNotes?: unknown;
}

export interface EvaluationMetadataDto {
  correlationId?: string;
  lastEvaluatedAt?: string;
  evaluationTier?: string;
  totalCost?: number;
  durationMs?: number;
}

export interface LeadDebugResponse {
  lead: LeadDebugDto;
  evaluationData: EvaluationDataDto;
  latestEvaluation?: EvaluationHistoryItem;
  recentActivity: LeadActivityItem[];
  metadata: EvaluationMetadataDto;
}

export interface EvaluationHistoryListResponse {
  items: EvaluationHistoryItem[];
  total: number;
}

export interface ActivityLogListResponse {
  items: LeadActivityItem[];
  total: number;
}

export interface RerunFieldEvaluationResponse {
  success: boolean;
  result?: unknown;
  snapshot?: ProviderSnapshot;
  activityId?: string;
  error?: string;
}

/**
 * Lead Queue Service
 * Provides API functions for the Review Page queue operations.
 */
export interface ScheduleFollowUpRequest {
  followUpDate: string; // ISO date string
}

export const leadQueueService = {
  /**
   * Fetch leads for the queue with priority sorting and filtering.
   * @param type Queue type filter (action_now, follow_up, negotiating, all, archived)
   * @param page Page number (1-based)
   * @param pageSize Number of items per page
   * @param search Optional search query to filter by address, phone, or email (only for all/archived queues)
   */
  async getQueue(
    type: QueueType = 'all',
    page = 1,
    pageSize = 20,
    search?: string
  ): Promise<LeadQueueResponse> {
    const params = new URLSearchParams({
      type,
      page: String(page),
      pageSize: String(pageSize),
    });

    // Add search parameter if provided (truncate to 100 chars)
    if (search?.trim()) {
      params.append('search', search.trim().substring(0, 100));
    }

    const response = await axiosInstance.get<LeadQueueResponse>(
      `/api/leads/queue?${params}`
    );
    return response.data;
  },

  /**
   * Fetch a single lead by ID with all queue data.
   * @param leadId The lead ID to fetch
   */
  async getLeadById(leadId: string): Promise<LeadQueueItem> {
    const response = await axiosInstance.get<LeadQueueItem>(
      `/api/leads/${leadId}`
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
    await axiosInstance.put(`/api/leads/${leadId}/status`, { status });
  },

  /**
   * Archive a lead (soft delete).
   * @param leadId The lead ID to archive
   */
  async archiveLead(leadId: string): Promise<void> {
    await axiosInstance.put(`/api/leads/${leadId}/archive`);
  },

  /**
   * Restore an archived lead back to active status.
   * @param leadId The lead ID to unarchive
   */
  async unarchiveLead(leadId: string): Promise<void> {
    await axiosInstance.put(`/api/leads/${leadId}/unarchive`);
  },

  /**
   * Permanently delete a lead (hard delete).
   * This action cannot be undone. All associated messages, reminders, and notes will be deleted.
   * @param leadId The lead ID to delete
   */
  async deleteLeadPermanently(leadId: string): Promise<void> {
    await axiosInstance.delete(`/api/leads/${leadId}`);
  },

  /**
   * Schedule a follow-up for a lead.
   * Sets the follow-up date and moves the lead to the follow_up queue.
   * @param leadId The lead ID
   * @param followUpDate ISO date string for the follow-up
   * @param reason Optional reason for the follow-up
   */
  async scheduleFollowUp(leadId: string, followUpDate: string, reason?: string): Promise<void> {
    await axiosInstance.put(`/api/leads/${leadId}/follow-up`, {
      followUpDate,
      reason,
    });
  },

  /**
   * Update notes for a lead.
   * @param leadId The lead ID
   * @param notes The new notes text
   */
  async updateNotes(leadId: string, notes: string): Promise<void> {
    await axiosInstance.put(`/api/leads/${leadId}/notes`, { notes });
  },

  /**
   * Update seller phone number for a lead.
   * @param leadId The lead ID
   * @param sellerPhone The new phone number (null to clear)
   */
  async updateSellerPhone(leadId: string, sellerPhone: string | null): Promise<void> {
    await axiosInstance.patch(`/api/leads/${leadId}/phone`, { sellerPhone });
  },

  /**
   * Cancel a scheduled follow-up for a lead.
   * @param leadId The lead ID
   */
  async cancelFollowUp(leadId: string): Promise<void> {
    await axiosInstance.delete(`/api/leads/${leadId}/follow-up`);
  },

  /**
   * Ingest a new lead with automatic evaluation.
   * Handles duplicate detection via normalized address - duplicates are consolidated.
   * @param request The lead data to ingest
   */
  async ingestLead(request: IngestLeadRequest): Promise<IngestLeadResponse> {
    const response = await axiosInstance.post<IngestLeadResponse>(
      '/api/leads/ingest',
      {
        ...request,
        sendFirstMessage: request.sendFirstMessage ?? false,
        source: request.source ?? 'manual',
      }
    );
    return response.data;
  },

  /**
   * Fetch RentCast ARV and comparable sales for a lead.
   * This triggers a paid RentCast API call (~$1/request).
   * Updates the lead's ARV value and stores comparables.
   * @param leadId The lead ID to fetch RentCast data for
   */
  async getRentCastArv(leadId: string): Promise<RentCastArvResult> {
    const response = await axiosInstance.post<RentCastArvResult>(
      `/api/leads/${leadId}/rentcast-arv`
    );
    return response.data;
  },

  /**
   * Enrich a listing from a Zillow URL.
   * Fetches property details, photos, and agent info via Apify.
   * @param url The Zillow listing URL
   */
  async enrichListing(url: string): Promise<EnrichListingResponse> {
    const response = await axiosInstance.post<EnrichListingResponse>(
      '/api/listings/enrich',
      { url }
    );
    return response.data;
  },

  // Debug and Evaluation Transparency API (TASK-086)

  /**
   * Get full debug data for a lead including raw evaluation data, activity log, and AI reasoning.
   * @param leadId The lead ID
   */
  async getDebugData(leadId: string): Promise<LeadDebugResponse> {
    const response = await axiosInstance.get<LeadDebugResponse>(
      `/api/leads/${leadId}/debug`
    );
    return response.data;
  },

  /**
   * Get evaluation history for a lead with pagination.
   * @param leadId The lead ID
   * @param limit Number of items to return
   * @param offset Number of items to skip
   */
  async getEvaluationHistory(
    leadId: string,
    limit = 20,
    offset = 0
  ): Promise<EvaluationHistoryListResponse> {
    const params = new URLSearchParams({
      limit: String(limit),
      offset: String(offset),
    });
    const response = await axiosInstance.get<EvaluationHistoryListResponse>(
      `/api/leads/${leadId}/evaluation-history?${params}`
    );
    return response.data;
  },

  /**
   * Get activity log for a lead with pagination and optional filtering.
   * @param leadId The lead ID
   * @param limit Number of items to return
   * @param offset Number of items to skip
   * @param eventTypes Optional comma-separated list of event types to filter
   */
  async getActivityLog(
    leadId: string,
    limit = 50,
    offset = 0,
    eventTypes?: string
  ): Promise<ActivityLogListResponse> {
    const params = new URLSearchParams({
      limit: String(limit),
      offset: String(offset),
    });
    if (eventTypes) {
      params.set('eventTypes', eventTypes);
    }
    const response = await axiosInstance.get<ActivityLogListResponse>(
      `/api/leads/${leadId}/activity?${params}`
    );
    return response.data;
  },

  /**
   * Re-run evaluation for a specific field or all fields.
   * @param leadId The lead ID
   * @param field The field to re-evaluate (arv, rehab, rent, neighborhood, summary, all)
   * @param tier The evaluation tier (quick or full)
   */
  async rerunFieldEvaluation(
    leadId: string,
    field: 'arv' | 'rehab' | 'rent' | 'neighborhood' | 'summary' | 'all',
    tier: 'quick' | 'full' = 'quick'
  ): Promise<RerunFieldEvaluationResponse> {
    const params = new URLSearchParams({ tier });
    const response = await axiosInstance.post<RerunFieldEvaluationResponse>(
      `/api/leads/${leadId}/evaluate/${field}?${params}`
    );
    return response.data;
  },
};

export default leadQueueService;

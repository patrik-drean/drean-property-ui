// Queue types for the Review Page priority queue
import { LeadMetrics, ComparableSale, EnrichmentMetadata } from '../services/leadQueueService';

export type QueueType = 'action_now' | 'follow_up' | 'negotiating' | 'all' | 'archived';

export type Priority = 'urgent' | 'high' | 'medium' | 'normal';

export interface QueueCounts {
  action_now: number;
  follow_up: number;
  negotiating: number;
  all: number;
  archived: number;
}

export interface TodayProgress {
  contacted: { current: number; total: number };
  followUps: { current: number; total: number };
}

export interface AiSuggestion {
  templateName: string;
  messagePreview: string;
  confidence: number;
}

// Extended Lead type for the Review Page with queue-specific fields
export interface QueueLead {
  id: string;
  address: string;
  city?: string;
  state?: string;
  zipCode?: string;
  zillowLink: string;
  listingPrice: number;
  sellerPhone: string;
  sellerEmail: string;
  agentName?: string;
  createdAt: string;
  updatedAt: string;
  archived: boolean;
  tags: string[];
  squareFootage: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  units: number | null;
  notes: string;

  // Lead scoring fields
  leadScore: number | null;
  mao?: number | null;
  spreadPercent?: number | null;
  neighborhoodGrade?: string | null;

  // Status tracking
  status: LeadQueueStatus;
  lastContactDate: string | null;
  respondedDate?: string | null;
  followUpDate?: string | null;
  followUpDue?: boolean;

  // AI evaluation summary (from lead evaluation pipeline)
  aiSummary?: string;
  aiVerdict?: string;
  aiWeaknesses?: string[];
  recommendation?: string;

  // AI suggestions (deprecated - replaced by aiSummary)
  aiSuggestion?: AiSuggestion;

  // Computed priority
  priority: Priority;
  timeSinceCreated: string;

  // Full metrics data for tooltips (populated from API)
  metrics?: LeadMetrics;

  // Comparables from ARV evaluation (AI or RentCast)
  _comparables?: ComparableSale[];

  // Property photo URL (first image from Apify scrape)
  photoUrl?: string;

  // All property photo URLs (for gallery display)
  photoUrls?: string[];

  // Enrichment metadata from Apify (stored in Lead.Metadata JSON)
  enrichmentMetadata?: EnrichmentMetadata;

  // Consolidation tracking (TASK-107)
  lastConsolidatedAt?: string;
  lastConsolidatedSource?: string;
  consolidationCount?: number;
}

export type LeadQueueStatus =
  | 'New'
  | 'Contacted'
  | 'Responding'
  | 'Negotiating'
  | 'UnderContract'
  | 'Closed'
  | 'Lost'
  | 'Archived';

// Helper to get priority color styles
export const getPriorityStyles = (priority: Priority) => ({
  urgent: { color: '#f87171', bg: 'rgba(248, 113, 113, 0.15)', border: '#f87171' },
  high: { color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.15)', border: '#fbbf24' },
  medium: { color: '#60a5fa', bg: 'rgba(96, 165, 250, 0.15)', border: '#60a5fa' },
  normal: { color: '#8b949e', bg: 'rgba(139, 148, 158, 0.15)', border: '#30363d' },
})[priority];

// Helper to get neighborhood grade color
export const getNeighborhoodGradeColor = (grade: string | null | undefined): string => {
  switch (grade?.toUpperCase()) {
    case 'A': return '#4ade80';
    case 'B': return '#60a5fa';
    case 'C': return '#fbbf24';
    case 'D': return '#f87171';
    case 'F': return '#ef4444';
    default: return '#8b949e';
  }
};

// Helper to get score color
// Based on simplified MAO Spread scoring:
// 9-10: Amazing (Green), 7-8: Great (Light Green), 5-6: Good (Yellow), 3-4: Fair (Orange), 1-2: Poor (Red)
export const getScoreColor = (score: number | null | undefined): string => {
  if (score === null || score === undefined) return '#8b949e';
  if (score >= 9) return '#4ade80';  // Amazing - bright green
  if (score >= 7) return '#86efac';  // Great - light green
  if (score >= 5) return '#fbbf24';  // Good - yellow
  if (score >= 3) return '#fb923c';  // Fair - orange
  return '#f87171';                   // Poor - red
};

// Helper to get score label based on MAO spread thresholds
export const getScoreLabel = (score: number | null | undefined): string => {
  if (score === null || score === undefined) return 'Unknown';
  if (score >= 9) return 'Amazing';
  if (score >= 7) return 'Great';
  if (score >= 5) return 'Good';
  if (score >= 3) return 'Fair';
  return 'Poor';
};

// Helper to get spread color (lower spread = better deal, aligned with MAO spread scoring)
// Thresholds correspond to score boundaries from simplified scoring algorithm
export const getSpreadColor = (spread: number | null | undefined): string => {
  if (spread === null || spread === undefined) return '#8b949e';
  if (spread <= 15) return '#4ade80';   // Amazing/Great spread - bright green
  if (spread <= 25) return '#86efac';   // Good spread - light green
  if (spread <= 40) return '#fbbf24';   // Fair spread - yellow
  if (spread <= 60) return '#fb923c';   // Moderate spread - orange
  return '#f87171';                      // High spread - red
};

// Calculate score from MAO spread percentage (matches backend CompositeLeadScorer algorithm)
// Spread = (ListingPrice - MAO) / ListingPrice × 100%
// Lower spread = better deal = higher score
export const calculateScoreFromSpread = (spread: number | null | undefined): number => {
  if (spread === null || spread === undefined) return 5; // Neutral score when no data

  // Negative spread means listing is below MAO - excellent deal
  if (spread <= 10) return 10;  // ≤10% spread - amazing
  if (spread <= 15) return 9;   // ≤15% spread - amazing
  if (spread <= 20) return 8;   // ≤20% spread - great
  if (spread <= 25) return 7;   // ≤25% spread - great
  if (spread <= 30) return 6;   // ≤30% spread - good
  if (spread <= 40) return 5;   // ≤40% spread - good
  if (spread <= 50) return 4;   // ≤50% spread - fair
  if (spread <= 60) return 3;   // ≤60% spread - fair
  if (spread <= 75) return 2;   // ≤75% spread - poor
  return 1;                      // >75% spread - poor
};

// Helper to format time since (Mountain Time aware)
export const formatTimeSince = (dateString: string): string => {
  try {
    // Ensure the timestamp is treated as UTC by appending 'Z' if not present
    const utcString = dateString.endsWith('Z') ? dateString : `${dateString}Z`;
    const date = new Date(utcString);
    const now = new Date();

    // Validate date
    if (isNaN(date.getTime())) {
      console.warn('Invalid timestamp:', dateString);
      return dateString;
    }

    // Calculate difference in days in Mountain Time for accurate "Yesterday" logic
    const mtDate = new Date(date.toLocaleString('en-US', { timeZone: 'America/Denver' }));
    const mtNow = new Date(now.toLocaleString('en-US', { timeZone: 'America/Denver' }));

    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    // For "Yesterday" comparison, use Mountain Time dates
    const mtDateDay = new Date(mtDate.getFullYear(), mtDate.getMonth(), mtDate.getDate());
    const mtNowDay = new Date(mtNow.getFullYear(), mtNow.getMonth(), mtNow.getDate());
    const diffDays = Math.floor((mtNowDay.getTime() - mtDateDay.getTime()) / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24 && diffDays === 0) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;

    // For older dates, format in Mountain Time
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Denver',
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
    });
    return formatter.format(date);
  } catch (error) {
    console.error('Error formatting time since:', error);
    return dateString;
  }
};

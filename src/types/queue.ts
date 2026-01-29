// Queue types for the Review Page priority queue

export type QueueType = 'action_now' | 'follow_up' | 'negotiating' | 'all';

export type Priority = 'urgent' | 'high' | 'medium' | 'normal';

export interface QueueCounts {
  action_now: number;
  follow_up: number;
  negotiating: number;
  all: number;
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

  // AI suggestions (deprecated - replaced by aiSummary)
  aiSuggestion?: AiSuggestion;

  // Computed priority
  priority: Priority;
  timeSinceCreated: string;
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
export const getScoreColor = (score: number | null | undefined): string => {
  if (score === null || score === undefined) return '#8b949e';
  if (score >= 8) return '#4ade80';
  if (score >= 6) return '#fbbf24';
  if (score >= 4) return '#f97316';
  return '#f87171';
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

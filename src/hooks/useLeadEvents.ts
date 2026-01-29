import { useEffect } from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';

export interface LeadEventData {
  id: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  listingPrice: number;
  score: number | null;
  status: string;
  mao: number | null;
  spreadPercent: number | null;
  isPriority: boolean;
  needsFollowUp: boolean;
  createdAt: string;
  arv: number | null;
  arvConfidence: string | null;
  rehabEstimate: number | null;
  rehabConfidence: string | null;
  rentEstimate: number | null;
  rentConfidence: string | null;
  neighborhoodGrade: string | null;
}

export interface ConsolidationEventData {
  lead: LeadEventData;
  priceChange?: { oldPrice: number; newPrice: number };
  scoreChange?: { oldScore: number; newScore: number };
  mergedFromSource?: string;
}

export interface UseLeadEventsOptions {
  onLeadCreated?: (lead: LeadEventData) => void;
  onLeadUpdated?: (lead: LeadEventData) => void;
  onLeadConsolidated?: (data: ConsolidationEventData) => void;
  onLeadDeleted?: (leadId: string) => void;
}

export const useLeadEvents = (options: UseLeadEventsOptions) => {
  const { subscribe, connectionStatus } = useWebSocket();

  useEffect(() => {
    const unsubscribers: (() => void)[] = [];

    if (options.onLeadCreated) {
      unsubscribers.push(subscribe<LeadEventData>('lead:created', options.onLeadCreated));
    }
    if (options.onLeadUpdated) {
      unsubscribers.push(subscribe<LeadEventData>('lead:updated', options.onLeadUpdated));
    }
    if (options.onLeadConsolidated) {
      unsubscribers.push(subscribe<ConsolidationEventData>('lead:consolidated', options.onLeadConsolidated));
    }
    if (options.onLeadDeleted) {
      unsubscribers.push(subscribe<{ leadId: string }>('lead:deleted', ({ leadId }) => options.onLeadDeleted!(leadId)));
    }

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [subscribe, options.onLeadCreated, options.onLeadUpdated, options.onLeadConsolidated, options.onLeadDeleted]);

  return { connectionStatus };
};

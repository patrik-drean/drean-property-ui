import { renderHook, act } from '@testing-library/react';
import {
  useMockLeadData,
  generateMockLeads,
  filterLeadsByQueue,
  sortLeadsByPriority,
} from '../useMockLeadData';
import { QueueLead, Priority } from '../../types/queue';

describe('useMockLeadData', () => {
  describe('generateMockLeads', () => {
    it('should generate the specified number of leads', () => {
      const leads = generateMockLeads(5);
      expect(leads).toHaveLength(5);
    });

    it('should generate leads with unique IDs', () => {
      const leads = generateMockLeads(10);
      const ids = leads.map((l) => l.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(10);
    });

    it('should generate leads with valid addresses', () => {
      const leads = generateMockLeads(3);
      leads.forEach((lead) => {
        expect(lead.address).toBeTruthy();
        expect(lead.address).toContain('San Antonio');
      });
    });

    it('should generate leads with valid listing prices', () => {
      const leads = generateMockLeads(10);
      leads.forEach((lead) => {
        expect(lead.listingPrice).toBeGreaterThan(0);
        expect(lead.listingPrice).toBeLessThanOrEqual(280000); // max is 80000 + 200000
        expect(lead.listingPrice).toBeGreaterThanOrEqual(80000); // min
      });
    });

    it('should generate leads with valid scores', () => {
      const leads = generateMockLeads(20);
      leads.forEach((lead) => {
        expect(lead.leadScore).toBeGreaterThanOrEqual(1);
        expect(lead.leadScore).toBeLessThanOrEqual(10);
      });
    });

    it('should generate leads with valid priorities', () => {
      const validPriorities: Priority[] = ['urgent', 'high', 'medium', 'normal'];
      const leads = generateMockLeads(20);
      leads.forEach((lead) => {
        expect(validPriorities).toContain(lead.priority);
      });
    });

    it('should generate leads with square footage', () => {
      const leads = generateMockLeads(5);
      leads.forEach((lead) => {
        expect(lead.squareFootage).toBeGreaterThan(0);
      });
    });

    it('should generate AI suggestions for New or Contacted leads', () => {
      const leads = generateMockLeads(50);
      const newOrContactedLeads = leads.filter(
        (l) => l.status === 'New' || l.status === 'Contacted'
      );
      newOrContactedLeads.forEach((lead) => {
        expect(lead.aiSuggestion).toBeDefined();
        expect(lead.aiSuggestion?.templateName).toBeTruthy();
        expect(lead.aiSuggestion?.messagePreview).toBeTruthy();
        expect(lead.aiSuggestion?.confidence).toBeGreaterThanOrEqual(70);
        expect(lead.aiSuggestion?.confidence).toBeLessThanOrEqual(100);
      });
    });

    it('should not generate AI suggestions for other status leads', () => {
      const leads = generateMockLeads(50);
      const otherLeads = leads.filter(
        (l) =>
          l.status !== 'New' &&
          l.status !== 'Contacted' &&
          l.status !== 'Archived' // Archived can have various prior statuses
      );
      otherLeads.forEach((lead) => {
        expect(lead.aiSuggestion).toBeUndefined();
      });
    });
  });

  describe('filterLeadsByQueue', () => {
    const createMockLead = (overrides: Partial<QueueLead>): QueueLead => ({
      id: 'test-id',
      address: 'Test Address',
      city: 'San Antonio',
      state: 'TX',
      zipCode: '78209',
      zillowLink: 'https://zillow.com',
      listingPrice: 100000,
      sellerPhone: '555-1234',
      sellerEmail: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      archived: false,
      tags: [],
      squareFootage: 1500,
      bedrooms: 3,
      bathrooms: 2,
      units: 1,
      notes: '',
      leadScore: 7,
      mao: 70000,
      spreadPercent: 30,
      neighborhoodGrade: 'B',
      status: 'New',
      lastContactDate: null,
      priority: 'high',
      timeSinceCreated: '1h ago',
      ...overrides,
    });

    it('should filter action_now queue for new leads with score >= 5', () => {
      const leads = [
        createMockLead({ id: '1', status: 'New', leadScore: 8 }),
        createMockLead({ id: '2', status: 'New', leadScore: 5 }),
        createMockLead({ id: '3', status: 'New', leadScore: 4 }), // excluded
        createMockLead({ id: '4', status: 'Contacted', leadScore: 8 }), // excluded
        createMockLead({ id: '5', status: 'New', leadScore: 6, archived: true }), // excluded
      ];

      const filtered = filterLeadsByQueue(leads, 'action_now');
      expect(filtered).toHaveLength(2);
      expect(filtered.map((l) => l.id)).toEqual(['1', '2']);
    });

    it('should filter follow_up queue for leads with followUpDue', () => {
      const leads = [
        createMockLead({ id: '1', followUpDue: true }),
        createMockLead({ id: '2', followUpDue: false }),
        createMockLead({ id: '3', followUpDue: true }),
        createMockLead({ id: '4', followUpDue: true, archived: true }), // excluded
      ];

      const filtered = filterLeadsByQueue(leads, 'follow_up');
      expect(filtered).toHaveLength(2);
      expect(filtered.map((l) => l.id)).toEqual(['1', '3']);
    });

    it('should filter negotiating queue for Negotiating and Responding status', () => {
      const leads = [
        createMockLead({ id: '1', status: 'Negotiating' }),
        createMockLead({ id: '2', status: 'Responding' }),
        createMockLead({ id: '3', status: 'New' }), // excluded
        createMockLead({ id: '4', status: 'Contacted' }), // excluded
        createMockLead({ id: '5', status: 'Negotiating', archived: true }), // excluded
      ];

      const filtered = filterLeadsByQueue(leads, 'negotiating');
      expect(filtered).toHaveLength(2);
      expect(filtered.map((l) => l.id)).toEqual(['1', '2']);
    });

    it('should filter all queue for non-archived leads', () => {
      const leads = [
        createMockLead({ id: '1', archived: false }),
        createMockLead({ id: '2', archived: true }), // excluded
        createMockLead({ id: '3', archived: false }),
      ];

      const filtered = filterLeadsByQueue(leads, 'all');
      expect(filtered).toHaveLength(2);
      expect(filtered.map((l) => l.id)).toEqual(['1', '3']);
    });

    it('should return empty array when no leads match', () => {
      const leads = [
        createMockLead({ id: '1', status: 'Contacted', leadScore: 8 }),
      ];

      const filtered = filterLeadsByQueue(leads, 'action_now');
      expect(filtered).toHaveLength(0);
    });
  });

  describe('sortLeadsByPriority', () => {
    const createMockLead = (
      id: string,
      priority: Priority,
      leadScore: number
    ): QueueLead => ({
      id,
      address: 'Test Address',
      city: 'San Antonio',
      state: 'TX',
      zipCode: '78209',
      zillowLink: 'https://zillow.com',
      listingPrice: 100000,
      sellerPhone: '555-1234',
      sellerEmail: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      archived: false,
      tags: [],
      squareFootage: 1500,
      bedrooms: 3,
      bathrooms: 2,
      units: 1,
      notes: '',
      leadScore,
      mao: 70000,
      spreadPercent: 30,
      neighborhoodGrade: 'B',
      status: 'New',
      lastContactDate: null,
      priority,
      timeSinceCreated: '1h ago',
    });

    it('should sort by priority first (urgent > high > medium > normal)', () => {
      const leads = [
        createMockLead('1', 'normal', 10),
        createMockLead('2', 'urgent', 5),
        createMockLead('3', 'medium', 8),
        createMockLead('4', 'high', 7),
      ];

      const sorted = sortLeadsByPriority(leads);
      expect(sorted.map((l) => l.priority)).toEqual([
        'urgent',
        'high',
        'medium',
        'normal',
      ]);
    });

    it('should sort by score (descending) when priority is the same', () => {
      const leads = [
        createMockLead('1', 'high', 5),
        createMockLead('2', 'high', 9),
        createMockLead('3', 'high', 7),
      ];

      const sorted = sortLeadsByPriority(leads);
      expect(sorted.map((l) => l.leadScore)).toEqual([9, 7, 5]);
    });

    it('should combine priority and score sorting correctly', () => {
      const leads = [
        createMockLead('1', 'medium', 9),
        createMockLead('2', 'urgent', 5),
        createMockLead('3', 'medium', 7),
        createMockLead('4', 'urgent', 8),
      ];

      const sorted = sortLeadsByPriority(leads);
      expect(sorted.map((l) => l.id)).toEqual(['4', '2', '1', '3']);
    });

    it('should not mutate the original array', () => {
      const leads = [
        createMockLead('1', 'normal', 5),
        createMockLead('2', 'urgent', 8),
      ];

      const originalOrder = [...leads.map((l) => l.id)];
      sortLeadsByPriority(leads);
      expect(leads.map((l) => l.id)).toEqual(originalOrder);
    });

    it('should handle null scores', () => {
      const leads = [
        { ...createMockLead('1', 'high', 5), leadScore: null as any },
        createMockLead('2', 'high', 8),
      ];

      const sorted = sortLeadsByPriority(leads);
      expect(sorted[0].id).toBe('2');
      expect(sorted[1].id).toBe('1');
    });
  });

  describe('useMockLeadData hook', () => {
    it('should return leads array', () => {
      const { result } = renderHook(() => useMockLeadData());
      expect(result.current.leads).toBeDefined();
      expect(Array.isArray(result.current.leads)).toBe(true);
      expect(result.current.leads.length).toBeGreaterThan(0);
    });

    it('should return queueCounts', () => {
      const { result } = renderHook(() => useMockLeadData());
      expect(result.current.queueCounts).toBeDefined();
      expect(result.current.queueCounts).toHaveProperty('action_now');
      expect(result.current.queueCounts).toHaveProperty('follow_up');
      expect(result.current.queueCounts).toHaveProperty('negotiating');
      expect(result.current.queueCounts).toHaveProperty('all');
    });

    it('should return todayProgress', () => {
      const { result } = renderHook(() => useMockLeadData());
      expect(result.current.todayProgress).toBeDefined();
      expect(result.current.todayProgress.contacted).toHaveProperty('current');
      expect(result.current.todayProgress.contacted).toHaveProperty('total');
      expect(result.current.todayProgress.followUps).toHaveProperty('current');
      expect(result.current.todayProgress.followUps).toHaveProperty('total');
    });

    it('should provide markAsDone function that updates lead status', () => {
      const { result } = renderHook(() => useMockLeadData());

      const newLead = result.current.leads.find((l) => l.status === 'New');
      if (!newLead) return; // Skip if no new leads generated

      act(() => {
        result.current.markAsDone(newLead.id);
      });

      const updatedLead = result.current.leads.find((l) => l.id === newLead.id);
      expect(updatedLead?.status).toBe('Contacted');
      expect(updatedLead?.lastContactDate).toBeTruthy();
    });

    it('should provide markAsSkip function that updates followUp date', () => {
      const { result } = renderHook(() => useMockLeadData());

      const leadId = result.current.leads[0].id;

      act(() => {
        result.current.markAsSkip(leadId);
      });

      const updatedLead = result.current.leads.find((l) => l.id === leadId);
      expect(updatedLead?.followUpDue).toBe(false);
      expect(updatedLead?.followUpDate).toBeTruthy();
    });

    it('should provide archiveLead function that archives the lead', () => {
      const { result } = renderHook(() => useMockLeadData());

      const lead = result.current.leads.find((l) => !l.archived);
      if (!lead) return; // Skip if all leads already archived

      act(() => {
        result.current.archiveLead(lead.id);
      });

      const updatedLead = result.current.leads.find((l) => l.id === lead.id);
      expect(updatedLead?.archived).toBe(true);
      expect(updatedLead?.status).toBe('Archived');
    });

    it('should update queueCounts when leads change', () => {
      const { result } = renderHook(() => useMockLeadData());

      const initialActionNow = result.current.queueCounts.action_now;
      const newLead = result.current.leads.find(
        (l) => l.status === 'New' && (l.leadScore ?? 0) >= 5 && !l.archived
      );

      if (!newLead) return; // Skip if no matching lead

      act(() => {
        result.current.archiveLead(newLead.id);
      });

      expect(result.current.queueCounts.action_now).toBeLessThan(initialActionNow);
    });
  });
});

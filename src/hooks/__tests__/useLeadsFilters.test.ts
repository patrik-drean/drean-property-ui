import { renderHook, act } from '@testing-library/react';
import { useLeadsFilters } from '../useLeadsFilters';
import { PropertyLead } from '../../types/property';

const createMockLead = (overrides: Partial<PropertyLead> = {}): PropertyLead => ({
  id: '1',
  address: '123 Test St',
  zillowLink: 'https://zillow.com/test',
  listingPrice: 200000,
  sellerPhone: '555-1234',
  sellerEmail: 'test@test.com',
  lastContactDate: null,
  respondedDate: null,
  convertedDate: null,
  underContractDate: null,
  soldDate: null,
  notes: '',
  squareFootage: 1500,
  units: 1,
  convertedToProperty: false,
  archived: false,
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-15T10:00:00Z',
  leadScore: null,
  tags: [],
  ...overrides,
});

describe('useLeadsFilters', () => {
  describe('initialization', () => {
    it('should initialize with default filter values', () => {
      const { result } = renderHook(() => useLeadsFilters([]));

      expect(result.current.filters.searchQuery).toBe('');
      expect(result.current.filters.statusFilter).toBe('all');
      expect(result.current.filters.tagFilter).toEqual([]);
      expect(result.current.filters.sortField).toBe('createdAt');
      expect(result.current.filters.sortDirection).toBe('desc');
    });
  });

  describe('setSearchQuery', () => {
    it('should update search query', () => {
      const { result } = renderHook(() => useLeadsFilters([]));

      act(() => {
        result.current.setSearchQuery('test search');
      });

      expect(result.current.filters.searchQuery).toBe('test search');
    });
  });

  describe('setStatusFilter', () => {
    it('should update status filter', () => {
      const { result } = renderHook(() => useLeadsFilters([]));

      act(() => {
        result.current.setStatusFilter('contacted');
      });

      expect(result.current.filters.statusFilter).toBe('contacted');
    });
  });

  describe('setTagFilter', () => {
    it('should update tag filter', () => {
      const { result } = renderHook(() => useLeadsFilters([]));

      act(() => {
        result.current.setTagFilter(['hot', 'urgent']);
      });

      expect(result.current.filters.tagFilter).toEqual(['hot', 'urgent']);
    });
  });

  describe('toggleTag', () => {
    it('should add tag when not present', () => {
      const { result } = renderHook(() => useLeadsFilters([]));

      act(() => {
        result.current.toggleTag('hot');
      });

      expect(result.current.filters.tagFilter).toContain('hot');
    });

    it('should remove tag when already present', () => {
      const { result } = renderHook(() => useLeadsFilters([]));

      act(() => {
        result.current.toggleTag('hot');
        result.current.toggleTag('urgent');
      });

      expect(result.current.filters.tagFilter).toEqual(['hot', 'urgent']);

      act(() => {
        result.current.toggleTag('hot');
      });

      expect(result.current.filters.tagFilter).toEqual(['urgent']);
    });
  });

  describe('setSortField', () => {
    it('should update sort field', () => {
      const { result } = renderHook(() => useLeadsFilters([]));

      act(() => {
        result.current.setSortField('address');
      });

      expect(result.current.filters.sortField).toBe('address');
    });

    it('should toggle sort direction when same field is selected', () => {
      const { result } = renderHook(() => useLeadsFilters([]));

      // Initial: createdAt desc
      act(() => {
        result.current.setSortField('address');
      });
      expect(result.current.filters.sortDirection).toBe('asc');

      act(() => {
        result.current.setSortField('address');
      });
      expect(result.current.filters.sortDirection).toBe('desc');
    });
  });

  describe('toggleSortDirection', () => {
    it('should toggle between asc and desc', () => {
      const { result } = renderHook(() => useLeadsFilters([]));

      expect(result.current.filters.sortDirection).toBe('desc');

      act(() => {
        result.current.toggleSortDirection();
      });

      expect(result.current.filters.sortDirection).toBe('asc');

      act(() => {
        result.current.toggleSortDirection();
      });

      expect(result.current.filters.sortDirection).toBe('desc');
    });
  });

  describe('resetFilters', () => {
    it('should reset all filters to default values', () => {
      const { result } = renderHook(() => useLeadsFilters([]));

      act(() => {
        result.current.setSearchQuery('test');
        result.current.setStatusFilter('contacted');
        result.current.setTagFilter(['hot']);
        result.current.setSortField('address');
      });

      act(() => {
        result.current.resetFilters();
      });

      expect(result.current.filters.searchQuery).toBe('');
      expect(result.current.filters.statusFilter).toBe('all');
      expect(result.current.filters.tagFilter).toEqual([]);
      expect(result.current.filters.sortField).toBe('createdAt');
      expect(result.current.filters.sortDirection).toBe('desc');
    });
  });

  describe('filterLeads', () => {
    it('should return all leads when no filters are applied', () => {
      const leads = [
        createMockLead({ id: '1', address: '123 Test St' }),
        createMockLead({ id: '2', address: '456 Other St' }),
      ];

      const { result } = renderHook(() => useLeadsFilters(leads));
      const filtered = result.current.filterLeads(leads);

      expect(filtered).toHaveLength(2);
    });

    it('should filter by address search query', () => {
      const leads = [
        createMockLead({ id: '1', address: '123 Main St' }),
        createMockLead({ id: '2', address: '456 Oak Ave' }),
      ];

      const { result } = renderHook(() => useLeadsFilters(leads));

      act(() => {
        result.current.setSearchQuery('main');
      });

      const filtered = result.current.filterLeads(leads);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].address).toBe('123 Main St');
    });

    it('should filter by email search query', () => {
      const leads = [
        createMockLead({ id: '1', sellerEmail: 'john@test.com' }),
        createMockLead({ id: '2', sellerEmail: 'jane@other.com' }),
      ];

      const { result } = renderHook(() => useLeadsFilters(leads));

      act(() => {
        result.current.setSearchQuery('john');
      });

      const filtered = result.current.filterLeads(leads);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].sellerEmail).toBe('john@test.com');
    });

    it('should filter by phone search query', () => {
      const leads = [
        createMockLead({ id: '1', sellerPhone: '555-1234' }),
        createMockLead({ id: '2', sellerPhone: '555-5678' }),
      ];

      const { result } = renderHook(() => useLeadsFilters(leads));

      act(() => {
        result.current.setSearchQuery('1234');
      });

      const filtered = result.current.filterLeads(leads);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].sellerPhone).toBe('555-1234');
    });

    it('should filter by contacted status', () => {
      const leads = [
        createMockLead({ id: '1', lastContactDate: '2024-01-10' }),
        createMockLead({ id: '2', lastContactDate: null }),
      ];

      const { result } = renderHook(() => useLeadsFilters(leads));

      act(() => {
        result.current.setStatusFilter('contacted');
      });

      const filtered = result.current.filterLeads(leads);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('1');
    });

    it('should filter by not_contacted status', () => {
      const leads = [
        createMockLead({ id: '1', lastContactDate: '2024-01-10' }),
        createMockLead({ id: '2', lastContactDate: null }),
      ];

      const { result } = renderHook(() => useLeadsFilters(leads));

      act(() => {
        result.current.setStatusFilter('not_contacted');
      });

      const filtered = result.current.filterLeads(leads);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('2');
    });

    it('should filter by converted status', () => {
      const leads = [
        createMockLead({ id: '1', convertedToProperty: true }),
        createMockLead({ id: '2', convertedToProperty: false }),
      ];

      const { result } = renderHook(() => useLeadsFilters(leads));

      act(() => {
        result.current.setStatusFilter('converted');
      });

      const filtered = result.current.filterLeads(leads);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('1');
    });

    it('should filter by archived status', () => {
      const leads = [
        createMockLead({ id: '1', archived: true }),
        createMockLead({ id: '2', archived: false }),
      ];

      const { result } = renderHook(() => useLeadsFilters(leads));

      act(() => {
        result.current.setStatusFilter('archived');
      });

      const filtered = result.current.filterLeads(leads);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('1');
    });

    it('should filter by tags', () => {
      const leads = [
        createMockLead({ id: '1', tags: ['hot', 'urgent'] }),
        createMockLead({ id: '2', tags: ['cold'] }),
        createMockLead({ id: '3', tags: ['hot'] }),
      ];

      const { result } = renderHook(() => useLeadsFilters(leads));

      act(() => {
        result.current.setTagFilter(['hot']);
      });

      const filtered = result.current.filterLeads(leads);
      expect(filtered).toHaveLength(2);
      expect(filtered.map(l => l.id)).toEqual(['1', '3']);
    });
  });

  describe('sortLeads', () => {
    it('should sort by string field ascending', () => {
      const leads = [
        createMockLead({ id: '1', address: 'Zebra St' }),
        createMockLead({ id: '2', address: 'Apple St' }),
      ];

      const { result } = renderHook(() => useLeadsFilters(leads));

      act(() => {
        result.current.setSortField('address');
      });

      const sorted = result.current.sortLeads(leads);
      expect(sorted[0].address).toBe('Apple St');
      expect(sorted[1].address).toBe('Zebra St');
    });

    it('should sort by string field descending', () => {
      const leads = [
        createMockLead({ id: '1', address: 'Apple St' }),
        createMockLead({ id: '2', address: 'Zebra St' }),
      ];

      const { result } = renderHook(() => useLeadsFilters(leads));

      act(() => {
        result.current.setSortField('address');
        result.current.setSortField('address'); // Toggle to desc
      });

      const sorted = result.current.sortLeads(leads);
      expect(sorted[0].address).toBe('Zebra St');
      expect(sorted[1].address).toBe('Apple St');
    });

    it('should sort by number field', () => {
      const leads = [
        createMockLead({ id: '1', listingPrice: 500000 }),
        createMockLead({ id: '2', listingPrice: 200000 }),
      ];

      const { result } = renderHook(() => useLeadsFilters(leads));

      act(() => {
        result.current.setSortField('listingPrice');
      });

      const sorted = result.current.sortLeads(leads);
      expect(sorted[0].listingPrice).toBe(200000);
      expect(sorted[1].listingPrice).toBe(500000);
    });

    it('should sort by date field', () => {
      const leads = [
        createMockLead({ id: '1', createdAt: '2024-01-15T10:00:00Z' }),
        createMockLead({ id: '2', createdAt: '2024-01-10T10:00:00Z' }),
      ];

      const { result } = renderHook(() => useLeadsFilters(leads));

      act(() => {
        result.current.setSortField('createdAt');
      });

      const sorted = result.current.sortLeads(leads);
      expect(sorted[0].createdAt).toBe('2024-01-10T10:00:00Z');
      expect(sorted[1].createdAt).toBe('2024-01-15T10:00:00Z');
    });

    it('should handle null values in sorting', () => {
      const leads = [
        createMockLead({ id: '1', lastContactDate: null }),
        createMockLead({ id: '2', lastContactDate: '2024-01-10' }),
      ];

      const { result } = renderHook(() => useLeadsFilters(leads));

      act(() => {
        result.current.setSortField('lastContactDate');
      });

      const sorted = result.current.sortLeads(leads);
      // Null values should go to the end in ascending order
      expect(sorted[0].lastContactDate).toBe('2024-01-10');
      expect(sorted[1].lastContactDate).toBeNull();
    });
  });

  describe('availableTags', () => {
    it('should return unique sorted tags from all leads', () => {
      const leads = [
        createMockLead({ id: '1', tags: ['urgent', 'hot'] }),
        createMockLead({ id: '2', tags: ['cold', 'urgent'] }),
        createMockLead({ id: '3', tags: ['hot'] }),
      ];

      const { result } = renderHook(() => useLeadsFilters(leads));

      expect(result.current.availableTags).toEqual(['cold', 'hot', 'urgent']);
    });

    it('should return empty array when no leads have tags', () => {
      const leads = [
        createMockLead({ id: '1', tags: [] }),
        createMockLead({ id: '2', tags: undefined as any }),
      ];

      const { result } = renderHook(() => useLeadsFilters(leads));

      expect(result.current.availableTags).toEqual([]);
    });
  });
});

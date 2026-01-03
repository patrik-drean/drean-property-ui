import { renderHook, act } from '@testing-library/react';
import { usePropertiesFilters } from '../usePropertiesFilters';
import { Property, PropertyStatus } from '../../types/property';

const createMockProperty = (overrides: Partial<Property> = {}): Property => ({
  id: '1',
  address: '123 Test St',
  status: 'Opportunity' as PropertyStatus,
  listingPrice: 200000,
  offerPrice: 180000,
  rehabCosts: 25000,
  potentialRent: 1800,
  arv: 250000,
  notes: '',
  zillowLink: 'https://zillow.com/test',
  squareFootage: 2000,
  units: 1,
  actualRent: 1500,
  currentHouseValue: 200000,
  currentLoanValue: 150000,
  monthlyExpenses: null,
  capitalCosts: null,
  rentCastEstimates: { price: 0, priceLow: 0, priceHigh: 0, rent: 0, rentLow: 0, rentHigh: 0 },
  todoMetaData: { todoistSectionId: null },
  hasRentcastData: false,
  saleComparables: [],
  score: 0,
  propertyUnits: [],
  archived: false,
  ...overrides,
});

describe('usePropertiesFilters', () => {
  describe('initialization', () => {
    it('should initialize with default filter values', () => {
      const { result } = renderHook(() => usePropertiesFilters([]));

      expect(result.current.filters.searchQuery).toBe('');
      expect(result.current.filters.statusFilter).toBe('all');
      expect(result.current.filters.sortField).toBe('address');
      expect(result.current.filters.sortDirection).toBe('asc');
      expect(result.current.filters.showArchived).toBe(false);
    });
  });

  describe('setSearchQuery', () => {
    it('should update search query', () => {
      const { result } = renderHook(() => usePropertiesFilters([]));

      act(() => {
        result.current.setSearchQuery('test search');
      });

      expect(result.current.filters.searchQuery).toBe('test search');
    });
  });

  describe('setStatusFilter', () => {
    it('should update status filter', () => {
      const { result } = renderHook(() => usePropertiesFilters([]));

      act(() => {
        result.current.setStatusFilter('Operational');
      });

      expect(result.current.filters.statusFilter).toBe('Operational');
    });

    it('should allow setting to "all"', () => {
      const { result } = renderHook(() => usePropertiesFilters([]));

      act(() => {
        result.current.setStatusFilter('Operational');
        result.current.setStatusFilter('all');
      });

      expect(result.current.filters.statusFilter).toBe('all');
    });
  });

  describe('setSortField', () => {
    it('should update sort field and set ascending direction', () => {
      const { result } = renderHook(() => usePropertiesFilters([]));

      act(() => {
        result.current.setSortField('listingPrice');
      });

      expect(result.current.filters.sortField).toBe('listingPrice');
      expect(result.current.filters.sortDirection).toBe('asc');
    });

    it('should toggle sort direction when same field is selected', () => {
      const { result } = renderHook(() => usePropertiesFilters([]));

      act(() => {
        result.current.setSortField('address');
      });
      expect(result.current.filters.sortDirection).toBe('desc'); // Was asc, now desc

      act(() => {
        result.current.setSortField('address');
      });
      expect(result.current.filters.sortDirection).toBe('asc');
    });
  });

  describe('toggleSortDirection', () => {
    it('should toggle between asc and desc', () => {
      const { result } = renderHook(() => usePropertiesFilters([]));

      expect(result.current.filters.sortDirection).toBe('asc');

      act(() => {
        result.current.toggleSortDirection();
      });

      expect(result.current.filters.sortDirection).toBe('desc');

      act(() => {
        result.current.toggleSortDirection();
      });

      expect(result.current.filters.sortDirection).toBe('asc');
    });
  });

  describe('setShowArchived', () => {
    it('should update show archived state', () => {
      const { result } = renderHook(() => usePropertiesFilters([]));

      act(() => {
        result.current.setShowArchived(true);
      });

      expect(result.current.filters.showArchived).toBe(true);
    });
  });

  describe('toggleShowArchived', () => {
    it('should toggle show archived state', () => {
      const { result } = renderHook(() => usePropertiesFilters([]));

      expect(result.current.filters.showArchived).toBe(false);

      act(() => {
        result.current.toggleShowArchived();
      });

      expect(result.current.filters.showArchived).toBe(true);

      act(() => {
        result.current.toggleShowArchived();
      });

      expect(result.current.filters.showArchived).toBe(false);
    });
  });

  describe('resetFilters', () => {
    it('should reset all filters to default values', () => {
      const { result } = renderHook(() => usePropertiesFilters([]));

      act(() => {
        result.current.setSearchQuery('test');
        result.current.setStatusFilter('Operational');
        result.current.setSortField('listingPrice');
        result.current.setShowArchived(true);
      });

      act(() => {
        result.current.resetFilters();
      });

      expect(result.current.filters.searchQuery).toBe('');
      expect(result.current.filters.statusFilter).toBe('all');
      expect(result.current.filters.sortField).toBe('address');
      expect(result.current.filters.sortDirection).toBe('asc');
      expect(result.current.filters.showArchived).toBe(false);
    });
  });

  describe('filterProperties', () => {
    it('should return all properties when no filters are applied', () => {
      const properties = [
        createMockProperty({ id: '1', address: '123 Test St' }),
        createMockProperty({ id: '2', address: '456 Other St' }),
      ];

      const { result } = renderHook(() => usePropertiesFilters(properties));
      const filtered = result.current.filterProperties(properties);

      expect(filtered).toHaveLength(2);
    });

    it('should filter by address search query', () => {
      const properties = [
        createMockProperty({ id: '1', address: '123 Main St' }),
        createMockProperty({ id: '2', address: '456 Oak Ave' }),
      ];

      const { result } = renderHook(() => usePropertiesFilters(properties));

      act(() => {
        result.current.setSearchQuery('main');
      });

      const filtered = result.current.filterProperties(properties);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].address).toBe('123 Main St');
    });

    it('should filter by status', () => {
      const properties = [
        createMockProperty({ id: '1', status: 'Opportunity' }),
        createMockProperty({ id: '2', status: 'Operational' }),
        createMockProperty({ id: '3', status: 'Opportunity' }),
      ];

      const { result } = renderHook(() => usePropertiesFilters(properties));

      act(() => {
        result.current.setStatusFilter('Opportunity');
      });

      const filtered = result.current.filterProperties(properties);
      expect(filtered).toHaveLength(2);
      expect(filtered.every(p => p.status === 'Opportunity')).toBe(true);
    });

    it('should exclude archived properties by default', () => {
      const properties = [
        createMockProperty({ id: '1', archived: false }),
        createMockProperty({ id: '2', archived: true }),
      ];

      const { result } = renderHook(() => usePropertiesFilters(properties));
      const filtered = result.current.filterProperties(properties);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('1');
    });

    it('should include archived properties when showArchived is true', () => {
      const properties = [
        createMockProperty({ id: '1', archived: false }),
        createMockProperty({ id: '2', archived: true }),
      ];

      const { result } = renderHook(() => usePropertiesFilters(properties));

      act(() => {
        result.current.setShowArchived(true);
      });

      const filtered = result.current.filterProperties(properties);
      expect(filtered).toHaveLength(2);
    });

    it('should combine multiple filters', () => {
      const properties = [
        createMockProperty({ id: '1', address: '123 Main St', status: 'Opportunity' }),
        createMockProperty({ id: '2', address: '456 Main Ave', status: 'Operational' }),
        createMockProperty({ id: '3', address: '789 Oak St', status: 'Opportunity' }),
      ];

      const { result } = renderHook(() => usePropertiesFilters(properties));

      act(() => {
        result.current.setSearchQuery('main');
        result.current.setStatusFilter('Opportunity');
      });

      const filtered = result.current.filterProperties(properties);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('1');
    });
  });

  describe('sortProperties', () => {
    it('should sort by string field ascending', () => {
      const properties = [
        createMockProperty({ id: '1', address: 'Zebra St' }),
        createMockProperty({ id: '2', address: 'Apple St' }),
      ];

      const { result } = renderHook(() => usePropertiesFilters(properties));

      const sorted = result.current.sortProperties(properties);
      expect(sorted[0].address).toBe('Apple St');
      expect(sorted[1].address).toBe('Zebra St');
    });

    it('should sort by string field descending', () => {
      const properties = [
        createMockProperty({ id: '1', address: 'Apple St' }),
        createMockProperty({ id: '2', address: 'Zebra St' }),
      ];

      const { result } = renderHook(() => usePropertiesFilters(properties));

      act(() => {
        result.current.setSortField('address'); // Toggle to desc
      });

      const sorted = result.current.sortProperties(properties);
      expect(sorted[0].address).toBe('Zebra St');
      expect(sorted[1].address).toBe('Apple St');
    });

    it('should sort by number field', () => {
      const properties = [
        createMockProperty({ id: '1', listingPrice: 500000 }),
        createMockProperty({ id: '2', listingPrice: 200000 }),
      ];

      const { result } = renderHook(() => usePropertiesFilters(properties));

      act(() => {
        result.current.setSortField('listingPrice');
      });

      const sorted = result.current.sortProperties(properties);
      expect(sorted[0].listingPrice).toBe(200000);
      expect(sorted[1].listingPrice).toBe(500000);
    });

    it('should handle null values in sorting', () => {
      const properties = [
        createMockProperty({ id: '1', squareFootage: null }),
        createMockProperty({ id: '2', squareFootage: 2000 }),
      ];

      const { result } = renderHook(() => usePropertiesFilters(properties));

      act(() => {
        result.current.setSortField('squareFootage');
      });

      const sorted = result.current.sortProperties(properties);
      // Null values should go to the end in ascending order
      expect(sorted[0].squareFootage).toBe(2000);
      expect(sorted[1].squareFootage).toBeNull();
    });
  });

  describe('availableStatuses', () => {
    it('should return statuses present in properties', () => {
      const properties = [
        createMockProperty({ id: '1', status: 'Opportunity' }),
        createMockProperty({ id: '2', status: 'Operational' }),
        createMockProperty({ id: '3', status: 'Opportunity' }),
      ];

      const { result } = renderHook(() => usePropertiesFilters(properties));

      expect(result.current.availableStatuses).toContain('Opportunity');
      expect(result.current.availableStatuses).toContain('Operational');
    });

    it('should return empty array when no properties', () => {
      const { result } = renderHook(() => usePropertiesFilters([]));

      expect(result.current.availableStatuses).toEqual([]);
    });

    it('should only include statuses that exist in properties', () => {
      const properties = [
        createMockProperty({ id: '1', status: 'Opportunity' }),
        createMockProperty({ id: '2', status: 'Rehab' }),
      ];

      const { result } = renderHook(() => usePropertiesFilters(properties));

      expect(result.current.availableStatuses).toContain('Opportunity');
      expect(result.current.availableStatuses).toContain('Rehab');
      expect(result.current.availableStatuses).not.toContain('Selling');
      expect(result.current.availableStatuses).not.toContain('Operational');
    });
  });
});

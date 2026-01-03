import { useState, useCallback, useMemo } from 'react';
import { Property, PropertyStatus } from '../types/property';

export interface PropertiesFiltersState {
  searchQuery: string;
  statusFilter: PropertyStatus | 'all';
  sortField: keyof Property | string;
  sortDirection: 'asc' | 'desc';
  showArchived: boolean;
}

export interface UsePropertiesFiltersReturn {
  filters: PropertiesFiltersState;
  setSearchQuery: (query: string) => void;
  setStatusFilter: (status: PropertyStatus | 'all') => void;
  setSortField: (field: string) => void;
  toggleSortDirection: () => void;
  setShowArchived: (show: boolean) => void;
  toggleShowArchived: () => void;
  resetFilters: () => void;
  filterProperties: (properties: Property[]) => Property[];
  sortProperties: (properties: Property[]) => Property[];
  availableStatuses: PropertyStatus[];
}

const ALL_STATUSES: PropertyStatus[] = [
  'Opportunity',
  'Soft Offer',
  'Hard Offer',
  'Rehab',
  'Operational',
  'Needs Tenant',
  'Selling'
];

const initialFilters: PropertiesFiltersState = {
  searchQuery: '',
  statusFilter: 'all',
  sortField: 'address',
  sortDirection: 'asc',
  showArchived: false
};

export const usePropertiesFilters = (properties: Property[]): UsePropertiesFiltersReturn => {
  const [filters, setFilters] = useState<PropertiesFiltersState>(initialFilters);

  const setSearchQuery = useCallback((query: string) => {
    setFilters(prev => ({ ...prev, searchQuery: query }));
  }, []);

  const setStatusFilter = useCallback((status: PropertyStatus | 'all') => {
    setFilters(prev => ({ ...prev, statusFilter: status }));
  }, []);

  const setSortField = useCallback((field: string) => {
    setFilters(prev => ({
      ...prev,
      sortField: field,
      sortDirection: prev.sortField === field && prev.sortDirection === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  const toggleSortDirection = useCallback(() => {
    setFilters(prev => ({
      ...prev,
      sortDirection: prev.sortDirection === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  const setShowArchived = useCallback((show: boolean) => {
    setFilters(prev => ({ ...prev, showArchived: show }));
  }, []);

  const toggleShowArchived = useCallback(() => {
    setFilters(prev => ({ ...prev, showArchived: !prev.showArchived }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
  }, []);

  const filterProperties = useCallback((propertiesToFilter: Property[]): Property[] => {
    return propertiesToFilter.filter(property => {
      // Search filter - check address
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        if (!property.address.toLowerCase().includes(query)) {
          return false;
        }
      }

      // Status filter
      if (filters.statusFilter !== 'all' && property.status !== filters.statusFilter) {
        return false;
      }

      // Archived filter
      if (!filters.showArchived && property.archived) {
        return false;
      }

      return true;
    });
  }, [filters.searchQuery, filters.statusFilter, filters.showArchived]);

  const sortProperties = useCallback((propertiesToSort: Property[]): Property[] => {
    return [...propertiesToSort].sort((a, b) => {
      const aValue = a[filters.sortField as keyof Property];
      const bValue = b[filters.sortField as keyof Property];

      // Handle null/undefined values
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return filters.sortDirection === 'asc' ? 1 : -1;
      if (bValue == null) return filters.sortDirection === 'asc' ? -1 : 1;

      // Handle different types
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return filters.sortDirection === 'asc' ? comparison : -comparison;
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return filters.sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      // Fallback comparison
      if (aValue < bValue) return filters.sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return filters.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filters.sortField, filters.sortDirection]);

  const availableStatuses = useMemo(() => {
    const statusSet = new Set<PropertyStatus>();
    properties.forEach(property => {
      statusSet.add(property.status);
    });
    // Return all statuses but sorted to show existing ones first
    return ALL_STATUSES.filter(status => statusSet.has(status));
  }, [properties]);

  return {
    filters,
    setSearchQuery,
    setStatusFilter,
    setSortField,
    toggleSortDirection,
    setShowArchived,
    toggleShowArchived,
    resetFilters,
    filterProperties,
    sortProperties,
    availableStatuses
  };
};

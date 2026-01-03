import { useState, useCallback, useMemo } from 'react';
import { PropertyLead } from '../types/property';

export interface LeadsFiltersState {
  searchQuery: string;
  statusFilter: 'all' | 'contacted' | 'not_contacted' | 'converted' | 'archived';
  tagFilter: string[];
  sortField: keyof PropertyLead | string;
  sortDirection: 'asc' | 'desc';
}

export interface UseLeadsFiltersReturn {
  filters: LeadsFiltersState;
  setSearchQuery: (query: string) => void;
  setStatusFilter: (status: LeadsFiltersState['statusFilter']) => void;
  setTagFilter: (tags: string[]) => void;
  toggleTag: (tag: string) => void;
  setSortField: (field: string) => void;
  toggleSortDirection: () => void;
  resetFilters: () => void;
  filterLeads: (leads: PropertyLead[]) => PropertyLead[];
  sortLeads: (leads: PropertyLead[]) => PropertyLead[];
  availableTags: string[];
}

const initialFilters: LeadsFiltersState = {
  searchQuery: '',
  statusFilter: 'all',
  tagFilter: [],
  sortField: 'createdAt',
  sortDirection: 'desc'
};

export const useLeadsFilters = (leads: PropertyLead[]): UseLeadsFiltersReturn => {
  const [filters, setFilters] = useState<LeadsFiltersState>(initialFilters);

  const setSearchQuery = useCallback((query: string) => {
    setFilters(prev => ({ ...prev, searchQuery: query }));
  }, []);

  const setStatusFilter = useCallback((status: LeadsFiltersState['statusFilter']) => {
    setFilters(prev => ({ ...prev, statusFilter: status }));
  }, []);

  const setTagFilter = useCallback((tags: string[]) => {
    setFilters(prev => ({ ...prev, tagFilter: tags }));
  }, []);

  const toggleTag = useCallback((tag: string) => {
    setFilters(prev => ({
      ...prev,
      tagFilter: prev.tagFilter.includes(tag)
        ? prev.tagFilter.filter(t => t !== tag)
        : [...prev.tagFilter, tag]
    }));
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

  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
  }, []);

  const filterLeads = useCallback((leadsToFilter: PropertyLead[]): PropertyLead[] => {
    return leadsToFilter.filter(lead => {
      // Search filter - check address, sellerEmail, sellerPhone
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const matchesAddress = lead.address.toLowerCase().includes(query);
        const matchesEmail = lead.sellerEmail?.toLowerCase().includes(query) || false;
        const matchesPhone = lead.sellerPhone?.toLowerCase().includes(query) || false;

        if (!matchesAddress && !matchesEmail && !matchesPhone) {
          return false;
        }
      }

      // Status filter
      if (filters.statusFilter !== 'all') {
        switch (filters.statusFilter) {
          case 'contacted':
            if (!lead.lastContactDate) return false;
            break;
          case 'not_contacted':
            if (lead.lastContactDate) return false;
            break;
          case 'converted':
            if (!lead.convertedToProperty) return false;
            break;
          case 'archived':
            if (!lead.archived) return false;
            break;
        }
      }

      // Tag filter
      if (filters.tagFilter.length > 0) {
        if (!filters.tagFilter.some(tag => lead.tags?.includes(tag))) {
          return false;
        }
      }

      return true;
    });
  }, [filters.searchQuery, filters.statusFilter, filters.tagFilter]);

  const sortLeads = useCallback((leadsToSort: PropertyLead[]): PropertyLead[] => {
    return [...leadsToSort].sort((a, b) => {
      const aValue = a[filters.sortField as keyof PropertyLead];
      const bValue = b[filters.sortField as keyof PropertyLead];

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

      // Handle dates (stored as strings)
      if (filters.sortField.includes('Date') || filters.sortField === 'createdAt' || filters.sortField === 'updatedAt') {
        const aDate = new Date(aValue as string).getTime();
        const bDate = new Date(bValue as string).getTime();
        return filters.sortDirection === 'asc' ? aDate - bDate : bDate - aDate;
      }

      // Fallback comparison
      if (aValue < bValue) return filters.sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return filters.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filters.sortField, filters.sortDirection]);

  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();
    leads.forEach(lead => {
      lead.tags?.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [leads]);

  return {
    filters,
    setSearchQuery,
    setStatusFilter,
    setTagFilter,
    toggleTag,
    setSortField,
    toggleSortDirection,
    resetFilters,
    filterLeads,
    sortLeads,
    availableTags
  };
};

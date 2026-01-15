import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Property } from '../types/property';
import { getProperties } from '../services/api';

interface PropertiesContextType {
  properties: Property[];
  loading: boolean;
  error: string | null;
  refreshProperties: () => Promise<void>;
  updateProperty: (property: Property) => void;
  addProperty: (property: Property) => void;
  removeProperty: (propertyId: string) => void;
  lastFetched: Date | null;
  isStale: boolean;
}

const PropertiesContext = createContext<PropertiesContextType | undefined>(undefined);

interface PropertiesProviderProps {
  children: ReactNode;
}

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

export const PropertiesProvider: React.FC<PropertiesProviderProps> = ({ children }) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const isStale = lastFetched ? Date.now() - lastFetched.getTime() > CACHE_DURATION : true;

  const fetchProperties = async (forceRefresh = false) => {
    // If we have cached data and it's not stale, don't fetch
    if (!forceRefresh && properties.length > 0 && !isStale) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getProperties(false); // Explicitly request only non-archived properties
      console.log('Fetched properties:', data);
      
      // Deduplicate properties by ID to handle backend duplicates
      const uniqueProperties = data.filter((property, index, self) => 
        index === self.findIndex(p => p.id === property.id)
      );
      
      console.log('Unique properties after deduplication:', uniqueProperties.length);
      setProperties(uniqueProperties);
      setLastFetched(new Date());
    } catch (error) {
      console.error('Error fetching properties:', error);
      setError('Failed to fetch properties');
    } finally {
      setLoading(false);
    }
  };

  const refreshProperties = async () => {
    await fetchProperties(true);
  };

  const updateProperty = (updatedProperty: Property) => {
    setProperties(prev => 
      prev.map(property => 
        property.id === updatedProperty.id ? updatedProperty : property
      )
    );
  };

  const addProperty = (newProperty: Property) => {
    setProperties(prev => [...prev, newProperty]);
  };

  const removeProperty = (propertyId: string) => {
    setProperties(prev => prev.filter(property => property.id !== propertyId));
  };

  // Initial fetch on mount
  useEffect(() => {
    fetchProperties();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value: PropertiesContextType = {
    properties,
    loading,
    error,
    refreshProperties,
    updateProperty,
    addProperty,
    removeProperty,
    lastFetched,
    isStale,
  };

  return (
    <PropertiesContext.Provider value={value}>
      {children}
    </PropertiesContext.Provider>
  );
};

export const useProperties = (): PropertiesContextType => {
  const context = useContext(PropertiesContext);
  if (context === undefined) {
    throw new Error('useProperties must be used within a PropertiesProvider');
  }
  return context;
};

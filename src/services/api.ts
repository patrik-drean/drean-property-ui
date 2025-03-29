import axios from 'axios';
import { Property } from '../types/property';

const API_BASE_URL = 'http://localhost:5271';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getProperties = async (): Promise<Property[]> => {
  const response = await api.get<Property[]>('/api/Properties');
  return response.data;
};

export const getProperty = async (address: string): Promise<Property> => {
  const response = await api.get<Property>(`/api/Properties/property?address=${encodeURIComponent(address)}`);
  return response.data;
};

export const addProperty = async (property: Omit<Property, 'id'>): Promise<Property> => {
  const response = await api.post<Property>('/api/Properties', property);
  return response.data;
};

export const updateProperty = async (id: string, property: Omit<Property, 'id'>): Promise<Property> => {
  const response = await api.put<Property>(`/api/Properties/${id}`, property);
  return response.data;
};

export const archiveProperty = async (id: string): Promise<void> => {
  await api.put(`/api/Properties/${id}/archive`);
};

export const updatePropertyRentcast = async (id: string): Promise<Property> => {
  const response = await api.put<Property>(`/api/Properties/${id}/rentcast`);
  return response.data;
};

export const getZillowData = async (url: string): Promise<{ address: string; price: number }> => {
  const response = await api.get<{ address: string; price: number }>(`/api/Properties/zillow?url=${encodeURIComponent(url)}`);
  return response.data;
};

export const getArchivedProperties = async (): Promise<Property[]> => {
  const response = await api.get<Property[]>('/api/Properties', {
    params: { showArchived: true }
  });
  return response.data;
};

export const restoreProperty = async (id: string, property: Property): Promise<void> => {
  // Use the update endpoint to update the property
  // This should reset any internal archived flag when sent back to the server
  await api.put(`/api/Properties/${id}`, {
    address: property.address,
    status: property.status,
    listingPrice: property.listingPrice,
    offerPrice: property.offerPrice,
    rehabCosts: property.rehabCosts,
    potentialRent: property.potentialRent,
    arv: property.arv,
    rentCastEstimates: property.rentCastEstimates,
    hasRentcastData: property.hasRentcastData,
    notes: property.notes,
    score: property.score,
    zillowLink: property.zillowLink
  });
}; 
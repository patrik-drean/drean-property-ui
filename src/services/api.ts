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

export const getZillowData = async (url: string): Promise<{ address: string; price: number }> => {
  const response = await api.get<{ address: string; price: number }>(`/api/Properties/zillow?url=${encodeURIComponent(url)}`);
  return response.data;
}; 
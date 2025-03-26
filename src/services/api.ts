import axios from 'axios';
import { Property } from '../types/property';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getProperties = async (): Promise<Property[]> => {
  const response = await api.get('/properties');
  return response.data;
};

export const getProperty = async (address: string): Promise<Property> => {
  const response = await api.get(`/property?address=${encodeURIComponent(address)}`);
  return response.data;
};

export const addProperty = async (property: Partial<Property>): Promise<Property> => {
  const response = await api.post('/properties', property);
  return response.data;
};

export const updateProperty = async (id: string, property: Partial<Property>): Promise<Property> => {
  const response = await api.put(`/properties/${id}`, property);
  return response.data;
};

export const archiveProperty = async (id: string): Promise<void> => {
  await api.put(`/properties/${id}/archive`);
}; 
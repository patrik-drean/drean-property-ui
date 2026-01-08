import axios from 'axios';
import { Property, PropertyLead, CreatePropertyLead, UpdatePropertyLead, BatchCreatePropertyLeads, BatchCreateResponse, Note, CreateNote, Link, CreateLink, Contact, CreateContact, UpdateContact } from '../types/property';

// Use environment variables if available, otherwise use default local development URL
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

const AUTH_TOKEN_KEY = 'authToken';

// Export axios instance for use by other services (e.g., smsService)
// Named 'axiosInstance' to avoid conflict with apiConfig.ts 'api' export
export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token to requests
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors and 401 redirects
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log error details for debugging
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.response?.data?.message || error.message
    });

    if (error.response?.status === 401) {
      // Clear auth state and redirect to login
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem('authUser');
      window.location.href = '/#/login';
    }
    return Promise.reject(error);
  }
);

export const getProperties = async (showArchived?: boolean): Promise<Property[]> => {
  const response = await axiosInstance.get<Property[]>('/api/Properties', {
    params: { showArchived }
  });
  return response.data;
};

export const getProperty = async (address: string): Promise<Property> => {
  const response = await axiosInstance.get<Property>(`/api/Properties/property?address=${encodeURIComponent(address)}`);
  return response.data;
};

export const addProperty = async (property: Omit<Property, 'id'>): Promise<Property> => {
  const response = await axiosInstance.post<Property>('/api/Properties', property);
  return response.data;
};

export const updateProperty = async (id: string, property: Omit<Property, 'id'>): Promise<Property> => {
  const response = await axiosInstance.put<Property>(`/api/Properties/${id}`, property);
  return response.data;
};

export const archiveProperty = async (id: string): Promise<void> => {
  await axiosInstance.put(`/api/Properties/${id}/archive`);
};

export const updatePropertyRentcast = async (id: string): Promise<Property> => {
  const response = await axiosInstance.put<Property>(`/api/Properties/${id}/rentcast`);
  return response.data;
};

export const getZillowData = async (url: string): Promise<{ address: string; price: number }> => {
  const response = await axiosInstance.get<{ address: string; price: number }>(`/api/Properties/zillow?url=${encodeURIComponent(url)}`);
  return response.data;
};

export const getArchivedProperties = async (): Promise<Property[]> => {
  return getProperties(true);
};

export const restoreProperty = async (id: string): Promise<void> => {
  await axiosInstance.put(`/api/Properties/${id}/restore`);
};

export const getPropertyById = async (id: string): Promise<Property> => {
  const response = await axiosInstance.get<Property>(`/api/Properties/${id}`);
  return response.data;
};

// Property Lead API Methods
export const getPropertyLeads = async (): Promise<PropertyLead[]> => {
  const response = await axiosInstance.get<PropertyLead[]>('/api/PropertyLeads');
  return response.data;
};

export const getPropertyLead = async (id: string): Promise<PropertyLead> => {
  const response = await axiosInstance.get<PropertyLead>(`/api/PropertyLeads/${id}`);
  return response.data;
};

export const addPropertyLead = async (propertyLead: CreatePropertyLead): Promise<PropertyLead> => {
  const response = await axiosInstance.post<PropertyLead>('/api/PropertyLeads', propertyLead);
  return response.data;
};

export const addPropertyLeadsBatch = async (batch: BatchCreatePropertyLeads): Promise<BatchCreateResponse> => {
  const response = await axiosInstance.post<BatchCreateResponse>('/api/PropertyLeads/batch', batch);
  return response.data;
};

export const updatePropertyLead = async (id: string, propertyLead: UpdatePropertyLead): Promise<PropertyLead> => {
  console.log(`Sending update for lead ${id}:`, propertyLead);
  const response = await axiosInstance.put<PropertyLead>(`/api/PropertyLeads/${id}`, propertyLead);
  console.log(`Update response for lead ${id}:`, response.data);
  return response.data;
};

export const deletePropertyLead = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/api/PropertyLeads/${id}`);
};

export const archivePropertyLead = async (id: string): Promise<void> => {
  await axiosInstance.put(`/api/PropertyLeads/${id}/archive`);
};

export const convertPropertyLead = async (id: string): Promise<void> => {
  await axiosInstance.put(`/api/PropertyLeads/${id}/convert`);
};

// Score Property Lead from Zillow URL
export interface ScoredPropertyData {
  address: string;
  listingPrice: number;
  zillowLink: string;
  sqft?: number;
  units?: number;
  agentInfo?: {
    name: string;
    email: string;
    phone: string;
    agency: string;
  };
  note?: string;
  leadScore?: number;
  metadata?: Record<string, any>;
}

export const scorePropertyLead = async (zillowUrl: string): Promise<ScoredPropertyData> => {
  const response = await axiosInstance.post<ScoredPropertyData>('/api/leads/score', { zillowUrl });
  return response.data;
};

export const getPropertyLeadsWithArchivedStatus = async (showArchived?: boolean): Promise<PropertyLead[]> => {
  const response = await axiosInstance.get<PropertyLead[]>('/api/PropertyLeads', {
    params: { showArchived }
  });
  return response.data;
};

// Enhanced version with pagination support
export const getPropertyLeadsPaginated = async (
  showArchived?: boolean,
  page?: number,
  pageSize?: number,
  tags?: string[],
  converted?: boolean
): Promise<{ data: PropertyLead[]; total: number; page: number; pageSize: number }> => {
  const params: any = { showArchived };
  
  if (page !== undefined) params.page = page;
  if (pageSize !== undefined) params.pageSize = pageSize;
  if (tags && tags.length > 0) params.tags = tags.join(',');
  if (converted !== undefined) params.converted = converted;
  
  const response = await axiosInstance.get<{ data: PropertyLead[]; total: number; page: number; pageSize: number }>('/api/PropertyLeads', {
    params
  });
  return response.data;
};

// Note API Methods
export const getNotesByPropertyId = async (propertyId: string): Promise<Note[]> => {
  const response = await axiosInstance.get<Note[]>(`/api/Notes/property/${propertyId}`);
  return response.data;
};

export const createNote = async (note: CreateNote): Promise<Note> => {
  const response = await axiosInstance.post<Note>('/api/Notes', note);
  return response.data;
};

export const updateNote = async (id: string, note: CreateNote): Promise<Note> => {
  const response = await axiosInstance.put<Note>(`/api/Notes/${id}`, note);
  return response.data;
};

export const deleteNote = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/api/Notes/${id}`);
};

// Link API Methods
export const getLinksByPropertyId = async (propertyId: string): Promise<Link[]> => {
  const response = await axiosInstance.get<Link[]>(`/api/Links/property/${propertyId}`);
  return response.data;
};

export const createLink = async (link: CreateLink): Promise<Link> => {
  const response = await axiosInstance.post<Link>('/api/Links', link);
  return response.data;
};

export const updateLink = async (id: string, link: CreateLink): Promise<Link> => {
  const response = await axiosInstance.put<Link>(`/api/Links/${id}`, link);
  return response.data;
};

export const deleteLink = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/api/Links/${id}`);
};

// Contact API Methods
export const getContacts = async (): Promise<Contact[]> => {
  const response = await axiosInstance.get<Contact[]>('/api/Contacts');
  return response.data;
};

export const getContact = async (id: string): Promise<Contact> => {
  const response = await axiosInstance.get<Contact>(`/api/Contacts/${id}`);
  return response.data;
};

export const getContactsByPropertyId = async (propertyId: string): Promise<Contact[]> => {
  const response = await axiosInstance.get<Contact[]>(`/api/Contacts/property/${propertyId}`);
  return response.data;
};

export const createContact = async (contact: CreateContact): Promise<Contact> => {
  const response = await axiosInstance.post<Contact>('/api/Contacts', contact);
  return response.data;
};

export const updateContact = async (id: string, contact: UpdateContact): Promise<Contact> => {
  const response = await axiosInstance.put<Contact>(`/api/Contacts/${id}`, contact);
  return response.data;
};

export const deleteContact = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/api/Contacts/${id}`);
};

export const addContactToProperty = async (contactId: string, propertyId: string): Promise<void> => {
  await axiosInstance.post(`/api/Contacts/${contactId}/properties/${propertyId}`);
};

export const removeContactFromProperty = async (contactId: string, propertyId: string): Promise<void> => {
  await axiosInstance.delete(`/api/Contacts/${contactId}/properties/${propertyId}`);
};

// Export the axios instance for direct use
export default axiosInstance; 
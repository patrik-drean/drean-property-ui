import axios from 'axios';
import { Property, PropertyLead, CreatePropertyLead, UpdatePropertyLead, BatchCreatePropertyLeads, BatchCreateResponse, Note, CreateNote, Link, CreateLink, Contact, CreateContact, UpdateContact } from '../types/property';

// Use environment variables if available, otherwise use default local development URL
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getProperties = async (showArchived?: boolean): Promise<Property[]> => {
  const response = await api.get<Property[]>('/api/Properties', {
    params: { showArchived }
  });
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
  return getProperties(true);
};

export const restoreProperty = async (id: string): Promise<void> => {
  await api.put(`/api/Properties/${id}/restore`);
};

export const getPropertyById = async (id: string): Promise<Property> => {
  const response = await api.get<Property>(`/api/Properties/${id}`);
  return response.data;
};

// Property Lead API Methods
export const getPropertyLeads = async (): Promise<PropertyLead[]> => {
  const response = await api.get<PropertyLead[]>('/api/PropertyLeads');
  return response.data;
};

export const getPropertyLead = async (id: string): Promise<PropertyLead> => {
  const response = await api.get<PropertyLead>(`/api/PropertyLeads/${id}`);
  return response.data;
};

export const addPropertyLead = async (propertyLead: CreatePropertyLead): Promise<PropertyLead> => {
  const response = await api.post<PropertyLead>('/api/PropertyLeads', propertyLead);
  return response.data;
};

export const addPropertyLeadsBatch = async (batch: BatchCreatePropertyLeads): Promise<BatchCreateResponse> => {
  const response = await api.post<BatchCreateResponse>('/api/PropertyLeads/batch', batch);
  return response.data;
};

export const updatePropertyLead = async (id: string, propertyLead: UpdatePropertyLead): Promise<PropertyLead> => {
  console.log(`Sending update for lead ${id}:`, propertyLead);
  const response = await api.put<PropertyLead>(`/api/PropertyLeads/${id}`, propertyLead);
  console.log(`Update response for lead ${id}:`, response.data);
  return response.data;
};

export const deletePropertyLead = async (id: string): Promise<void> => {
  await api.delete(`/api/PropertyLeads/${id}`);
};

export const archivePropertyLead = async (id: string): Promise<void> => {
  await api.put(`/api/PropertyLeads/${id}/archive`);
};

export const convertPropertyLead = async (id: string): Promise<void> => {
  await api.put(`/api/PropertyLeads/${id}/convert`);
};

export const getPropertyLeadsWithArchivedStatus = async (showArchived?: boolean): Promise<PropertyLead[]> => {
  const response = await api.get<PropertyLead[]>('/api/PropertyLeads', {
    params: { showArchived }
  });
  return response.data;
};

// Note API Methods
export const getNotesByPropertyId = async (propertyId: string): Promise<Note[]> => {
  const response = await api.get<Note[]>(`/api/Notes/property/${propertyId}`);
  return response.data;
};

export const createNote = async (note: CreateNote): Promise<Note> => {
  const response = await api.post<Note>('/api/Notes', note);
  return response.data;
};

export const updateNote = async (id: string, note: CreateNote): Promise<Note> => {
  const response = await api.put<Note>(`/api/Notes/${id}`, note);
  return response.data;
};

export const deleteNote = async (id: string): Promise<void> => {
  await api.delete(`/api/Notes/${id}`);
};

// Link API Methods
export const getLinksByPropertyId = async (propertyId: string): Promise<Link[]> => {
  const response = await api.get<Link[]>(`/api/Links/property/${propertyId}`);
  return response.data;
};

export const createLink = async (link: CreateLink): Promise<Link> => {
  const response = await api.post<Link>('/api/Links', link);
  return response.data;
};

export const updateLink = async (id: string, link: CreateLink): Promise<Link> => {
  const response = await api.put<Link>(`/api/Links/${id}`, link);
  return response.data;
};

export const deleteLink = async (id: string): Promise<void> => {
  await api.delete(`/api/Links/${id}`);
};

// Contact API Methods
export const getContacts = async (): Promise<Contact[]> => {
  const response = await api.get<Contact[]>('/api/Contacts');
  return response.data;
};

export const getContact = async (id: string): Promise<Contact> => {
  const response = await api.get<Contact>(`/api/Contacts/${id}`);
  return response.data;
};

export const getContactsByPropertyId = async (propertyId: string): Promise<Contact[]> => {
  const response = await api.get<Contact[]>(`/api/Contacts/property/${propertyId}`);
  return response.data;
};

export const createContact = async (contact: CreateContact): Promise<Contact> => {
  const response = await api.post<Contact>('/api/Contacts', contact);
  return response.data;
};

export const updateContact = async (id: string, contact: UpdateContact): Promise<Contact> => {
  const response = await api.put<Contact>(`/api/Contacts/${id}`, contact);
  return response.data;
};

export const deleteContact = async (id: string): Promise<void> => {
  await api.delete(`/api/Contacts/${id}`);
};

export const addContactToProperty = async (contactId: string, propertyId: string): Promise<void> => {
  await api.post(`/api/Contacts/${contactId}/properties/${propertyId}`);
};

export const removeContactFromProperty = async (contactId: string, propertyId: string): Promise<void> => {
  await api.delete(`/api/Contacts/${contactId}/properties/${propertyId}`);
}; 
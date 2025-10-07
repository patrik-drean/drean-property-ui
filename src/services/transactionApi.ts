import axios from 'axios';
import { Transaction, TransactionCreate, TransactionUpdate, TransactionCategory } from '../types/transaction';

// Use environment variables if available, otherwise use default local development URL
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const transactionApi = {
  // List all transactions
  getAll: async (): Promise<Transaction[]> => {
    const response = await api.get<Transaction[]>('/api/transactions');
    return response.data;
  },

  // Get transaction by ID
  getById: async (id: string): Promise<Transaction> => {
    const response = await api.get<Transaction>(`/api/transactions/${id}`);
    return response.data;
  },

  // Get transactions by property
  getByProperty: async (propertyId: string): Promise<Transaction[]> => {
    const response = await api.get<Transaction[]>(`/api/transactions/property/${propertyId}`);
    return response.data;
  },

  // Create transaction
  create: async (transaction: TransactionCreate): Promise<Transaction> => {
    const response = await api.post<Transaction>('/api/transactions', transaction);
    return response.data;
  },

  // Update transaction
  update: async (id: string, transaction: TransactionUpdate): Promise<Transaction> => {
    const response = await api.put<Transaction>(`/api/transactions/${id}`, transaction);
    return response.data;
  },

  // Delete transaction
  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/transactions/${id}`);
  },

  // Get all categories
  getCategories: async (): Promise<TransactionCategory[]> => {
    const response = await api.get<TransactionCategory[]>('/api/transactions/categories');
    return response.data;
  },

  // Validate CSV import data
  validateImport: async (csvText: string): Promise<any> => {
    const response = await api.post('/api/transactions/import/validate', { csvText });
    return response.data;
  },

  // Import CSV data
  import: async (csvText: string): Promise<Transaction[]> => {
    const response = await api.post<Transaction[]>('/api/transactions/import', { csvText });
    return response.data;
  },
};

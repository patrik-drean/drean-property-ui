// Mock axios before importing anything - use inline object to avoid hoisting issues
jest.mock('axios', () => {
  const mockAxiosInstance = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  };
  return {
    __esModule: true,
    default: {
      create: jest.fn(() => mockAxiosInstance),
    },
  };
});

import axios from 'axios';
import { transactionApi } from '../transactionApi';
import { Transaction, TransactionCreate, TransactionUpdate } from '../../types/transaction';

// Get the mock instance after import
const mockAxiosInstance = (axios.create as jest.Mock)();
const mockGet = mockAxiosInstance.get as jest.Mock;
const mockPost = mockAxiosInstance.post as jest.Mock;
const mockPut = mockAxiosInstance.put as jest.Mock;
const mockDelete = mockAxiosInstance.delete as jest.Mock;

describe('transactionApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('fetches all transactions', async () => {
      const mockTransactions: Transaction[] = [
        {
          id: '1',
          date: '2025-01-15',
          amount: 1500,
          category: 'Rent',
          expenseType: 'Operating',
          createdAt: '2025-01-15T00:00:00Z',
          updatedAt: '2025-01-15T00:00:00Z',
        },
      ];

      mockGet.mockResolvedValue({ data: mockTransactions });

      const result = await transactionApi.getAll();

      expect(mockGet).toHaveBeenCalledWith('/api/transactions');
      expect(result).toEqual(mockTransactions);
    });
  });

  describe('getById', () => {
    it('fetches a transaction by ID', async () => {
      const mockTransaction: Transaction = {
        id: '1',
        date: '2025-01-15',
        amount: 1500,
        category: 'Rent',
        expenseType: 'Operating',
        createdAt: '2025-01-15T00:00:00Z',
        updatedAt: '2025-01-15T00:00:00Z',
      };

      mockGet.mockResolvedValue({ data: mockTransaction });

      const result = await transactionApi.getById('1');

      expect(mockGet).toHaveBeenCalledWith('/api/transactions/1');
      expect(result).toEqual(mockTransaction);
    });
  });

  describe('getByProperty', () => {
    it('fetches transactions for a specific property', async () => {
      const mockTransactions: Transaction[] = [
        {
          id: '1',
          date: '2025-01-15',
          amount: 1500,
          category: 'Rent',
          propertyId: 'prop-1',
          expenseType: 'Operating',
          createdAt: '2025-01-15T00:00:00Z',
          updatedAt: '2025-01-15T00:00:00Z',
        },
      ];

      mockGet.mockResolvedValue({ data: mockTransactions });

      const result = await transactionApi.getByProperty('prop-1');

      expect(mockGet).toHaveBeenCalledWith('/api/transactions/property/prop-1');
      expect(result).toEqual(mockTransactions);
    });
  });

  describe('create', () => {
    it('creates a new transaction', async () => {
      const newTransaction: TransactionCreate = {
        date: '2025-01-15',
        amount: 1500,
        category: 'Rent',
      };

      const createdTransaction: Transaction = {
        id: '1',
        ...newTransaction,
        expenseType: 'Operating',
        createdAt: '2025-01-15T00:00:00Z',
        updatedAt: '2025-01-15T00:00:00Z',
      };

      mockPost.mockResolvedValue({ data: createdTransaction });

      const result = await transactionApi.create(newTransaction);

      expect(mockPost).toHaveBeenCalledWith('/api/transactions', newTransaction);
      expect(result).toEqual(createdTransaction);
    });
  });

  describe('update', () => {
    it('updates an existing transaction', async () => {
      const updateData: TransactionUpdate = {
        date: '2025-01-16',
        amount: 1600,
        category: 'Rent',
      };

      const updatedTransaction: Transaction = {
        id: '1',
        ...updateData,
        expenseType: 'Operating',
        createdAt: '2025-01-15T00:00:00Z',
        updatedAt: '2025-01-16T00:00:00Z',
      };

      mockPut.mockResolvedValue({ data: updatedTransaction });

      const result = await transactionApi.update('1', updateData);

      expect(mockPut).toHaveBeenCalledWith('/api/transactions/1', updateData);
      expect(result).toEqual(updatedTransaction);
    });
  });

  describe('delete', () => {
    it('deletes a transaction', async () => {
      mockDelete.mockResolvedValue({});

      await transactionApi.delete('1');

      expect(mockDelete).toHaveBeenCalledWith('/api/transactions/1');
    });
  });

  describe('getCategories', () => {
    it('fetches all transaction categories', async () => {
      const mockCategories = [
        {
          id: '1',
          name: 'Rent',
          type: 'Income',
          displayOrder: 1,
        },
        {
          id: '2',
          name: 'Utilities',
          type: 'Expense',
          defaultExpenseType: 'Operating',
          displayOrder: 2,
        },
      ];

      mockGet.mockResolvedValue({ data: mockCategories });

      const result = await transactionApi.getCategories();

      expect(mockGet).toHaveBeenCalledWith('/api/transactions/categories');
      expect(result).toEqual(mockCategories);
    });
  });

  describe('validateImport', () => {
    it('validates CSV import data', async () => {
      const csvText = 'date,amount,category\n2025-01-15,1500,Rent';
      const validationResult = {
        validTransactions: [{ date: '2025-01-15', amount: 1500, category: 'Rent' }],
        errors: [],
        validCount: 1,
        errorCount: 0,
      };

      mockPost.mockResolvedValue({ data: validationResult });

      const result = await transactionApi.validateImport(csvText);

      expect(mockPost).toHaveBeenCalledWith('/api/transactions/import/validate', {
        csvText,
      });
      expect(result).toEqual(validationResult);
    });

    it('returns validation errors', async () => {
      const csvText = 'date,amount,category\nbad-date,1500,Rent';
      const validationResult = {
        validTransactions: [],
        errors: [{ line: 2, message: 'Invalid date format' }],
        validCount: 0,
        errorCount: 1,
      };

      mockPost.mockResolvedValue({ data: validationResult });

      const result = await transactionApi.validateImport(csvText);

      expect(result.errors).toHaveLength(1);
      expect(result.errorCount).toBe(1);
    });
  });

  describe('import', () => {
    it('imports transactions from CSV', async () => {
      const csvText = 'date,amount,category\n2025-01-15,1500,Rent';
      const importedTransactions: Transaction[] = [
        {
          id: '1',
          date: '2025-01-15',
          amount: 1500,
          category: 'Rent',
          expenseType: 'Operating',
          createdAt: '2025-01-15T00:00:00Z',
          updatedAt: '2025-01-15T00:00:00Z',
        },
      ];

      mockPost.mockResolvedValue({ data: importedTransactions });

      const result = await transactionApi.import(csvText);

      expect(mockPost).toHaveBeenCalledWith('/api/transactions/import', {
        csvText,
      });
      expect(result).toEqual(importedTransactions);
    });
  });

  describe('error handling', () => {
    it('throws error when API request fails', async () => {
      mockGet.mockRejectedValue(new Error('Network error'));

      await expect(transactionApi.getAll()).rejects.toThrow('Network error');
    });
  });
});

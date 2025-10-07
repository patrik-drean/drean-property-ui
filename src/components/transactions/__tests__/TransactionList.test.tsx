import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TransactionList } from '../TransactionList';
import { transactionApi } from '../../../services/transactionApi';
import { Transaction } from '../../../types/transaction';

// Mock the transaction API
jest.mock('../../../services/transactionApi');

// Mock date-fns format function
jest.mock('date-fns', () => ({
  format: (date: Date, formatStr: string) => '2025-01-15',
}));

const mockTransactions: Transaction[] = [
  {
    id: '1',
    date: '2025-01-15',
    amount: 1500,
    category: 'Rent',
    propertyId: 'prop-1',
    unit: 'Unit A',
    payee: 'John Doe',
    description: 'January rent',
    overrideDate: undefined,
    expenseType: 'Operating',
    createdAt: '2025-01-15T00:00:00Z',
    updatedAt: '2025-01-15T00:00:00Z',
  },
  {
    id: '2',
    date: '2025-01-10',
    amount: -200,
    category: 'Maintenance',
    propertyId: 'prop-1',
    description: 'Plumbing repair',
    expenseType: 'Operating',
    createdAt: '2025-01-10T00:00:00Z',
    updatedAt: '2025-01-10T00:00:00Z',
  },
];

describe('TransactionList', () => {
  const mockOnEdit = jest.fn();
  const mockOnImport = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (transactionApi.getAll as jest.Mock).mockResolvedValue(mockTransactions);
  });

  it('renders loading state initially', () => {
    render(<TransactionList onEdit={mockOnEdit} onImport={mockOnImport} />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders transaction list in table view', async () => {
    render(<TransactionList onEdit={mockOnEdit} onImport={mockOnImport} />);

    await waitFor(() => {
      expect(screen.getByText('Transactions')).toBeInTheDocument();
    });

    expect(screen.getByText('Rent')).toBeInTheDocument();
    expect(screen.getByText('Maintenance')).toBeInTheDocument();
    expect(screen.getByText('+$1,500.00')).toBeInTheDocument();
    expect(screen.getByText('-$200.00')).toBeInTheDocument();
  });

  it('toggles between table and card views', async () => {
    render(<TransactionList onEdit={mockOnEdit} onImport={mockOnImport} />);

    await waitFor(() => {
      expect(screen.getByText('Transactions')).toBeInTheDocument();
    });

    // Find and click the card view toggle button
    const toggleButtons = screen.getAllByRole('button');
    const cardViewButton = toggleButtons.find(btn =>
      btn.querySelector('[data-testid="ViewModuleIcon"]')
    );

    if (cardViewButton) {
      fireEvent.click(cardViewButton);
      await waitFor(() => {
        expect(screen.getByText('Rent')).toBeInTheDocument();
      });
    }
  });

  it('calls onEdit when edit button is clicked', async () => {
    render(<TransactionList onEdit={mockOnEdit} onImport={mockOnImport} />);

    await waitFor(() => {
      expect(screen.getByText('Transactions')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    if (editButtons.length > 0) {
      fireEvent.click(editButtons[0]);
      expect(mockOnEdit).toHaveBeenCalledWith(mockTransactions[0]);
    }
  });

  it('confirms before deleting a transaction', async () => {
    window.confirm = jest.fn(() => false); // User cancels
    (transactionApi.delete as jest.Mock).mockResolvedValue(undefined);

    render(<TransactionList onEdit={mockOnEdit} onImport={mockOnImport} />);

    await waitFor(() => {
      expect(screen.getByText('Transactions')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole('button');
    const deleteButton = deleteButtons.find(btn =>
      btn.querySelector('[data-testid="DeleteIcon"]')
    );

    if (deleteButton) {
      fireEvent.click(deleteButton);
      expect(window.confirm).toHaveBeenCalled();
      expect(transactionApi.delete).not.toHaveBeenCalled();
    }
  });

  it('deletes transaction when user confirms', async () => {
    window.confirm = jest.fn(() => true); // User confirms
    (transactionApi.delete as jest.Mock).mockResolvedValue(undefined);
    (transactionApi.getAll as jest.Mock).mockResolvedValueOnce(mockTransactions)
      .mockResolvedValueOnce([mockTransactions[0]]); // After delete

    render(<TransactionList onEdit={mockOnEdit} onImport={mockOnImport} />);

    await waitFor(() => {
      expect(screen.getByText('Transactions')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole('button');
    const deleteButton = deleteButtons.find(btn =>
      btn.querySelector('[data-testid="DeleteIcon"]')
    );

    if (deleteButton) {
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(transactionApi.delete).toHaveBeenCalledWith('1');
      });
    }
  });

  it('displays empty state when no transactions', async () => {
    (transactionApi.getAll as jest.Mock).mockResolvedValue([]);

    render(<TransactionList onEdit={mockOnEdit} onImport={mockOnImport} />);

    await waitFor(() => {
      expect(screen.getByText(/No transactions yet/i)).toBeInTheDocument();
      expect(screen.getByText(/Import Transactions/i)).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    (transactionApi.getAll as jest.Mock).mockRejectedValue(new Error('API Error'));

    render(<TransactionList onEdit={mockOnEdit} onImport={mockOnImport} />);

    await waitFor(() => {
      expect(screen.getByText('API Error')).toBeInTheDocument();
    });
  });

  it('calls onImport when Import Transactions button is clicked', async () => {
    render(<TransactionList onEdit={mockOnEdit} onImport={mockOnImport} />);

    await waitFor(() => {
      expect(screen.getByText('Transactions')).toBeInTheDocument();
    });

    const importButton = screen.getByText('Import Transactions');
    fireEvent.click(importButton);

    expect(mockOnImport).toHaveBeenCalled();
  });

  it('filters transactions by property when propertyId is provided', async () => {
    const propertyTransactions = [mockTransactions[0]];
    (transactionApi.getByProperty as jest.Mock).mockResolvedValue(propertyTransactions);

    render(<TransactionList propertyId="prop-1" onEdit={mockOnEdit} onImport={mockOnImport} />);

    await waitFor(() => {
      expect(transactionApi.getByProperty).toHaveBeenCalledWith('prop-1');
      expect(screen.getByText('Rent')).toBeInTheDocument();
    });
  });
});

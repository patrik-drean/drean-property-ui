import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TransactionImport } from '../TransactionImport';
import { transactionApi } from '../../../services/transactionApi';

// Mock the transaction API
jest.mock('../../../services/transactionApi');

const mockValidationResult = {
  validTransactions: [
    {
      date: '2025-01-15',
      amount: 1500,
      category: 'Rent',
      propertyId: 'prop-1',
      unit: 'Unit A',
      description: 'January rent',
    },
  ],
  errors: [],
  validCount: 1,
  errorCount: 0,
};

const mockValidationWithErrors = {
  validTransactions: [],
  errors: [
    { line: 2, message: 'Invalid date format' },
    { line: 3, message: 'Category not found' },
  ],
  validCount: 0,
  errorCount: 2,
};

describe('TransactionImport', () => {
  const mockOnClose = jest.fn();
  const mockOnImport = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the import dialog', () => {
    render(<TransactionImport open={true} onClose={mockOnClose} onImport={mockOnImport} />);

    expect(screen.getByText('Import Transactions from CSV')).toBeInTheDocument();
    expect(screen.getByLabelText('CSV Data')).toBeInTheDocument();
    expect(screen.getByText('Download Sample CSV Template')).toBeInTheDocument();
  });

  it('does not render when open is false', () => {
    render(<TransactionImport open={false} onClose={mockOnClose} onImport={mockOnImport} />);

    expect(screen.queryByText('Import Transactions from CSV')).not.toBeInTheDocument();
  });

  it('allows user to enter CSV data', () => {
    render(<TransactionImport open={true} onClose={mockOnClose} onImport={mockOnImport} />);

    const csvInput = screen.getByLabelText('CSV Data') as HTMLTextAreaElement;
    const csvData = 'date,amount,category\n2025-01-15,1500,Rent';

    fireEvent.change(csvInput, { target: { value: csvData } });

    expect(csvInput.value).toBe(csvData);
  });

  it('validates CSV data when Validate button is clicked', async () => {
    (transactionApi.validateImport as jest.Mock).mockResolvedValue(mockValidationResult);

    render(<TransactionImport open={true} onClose={mockOnClose} onImport={mockOnImport} />);

    const csvInput = screen.getByLabelText('CSV Data');
    const csvData = 'date,amount,category\n2025-01-15,1500,Rent';

    fireEvent.change(csvInput, { target: { value: csvData } });

    const validateButton = screen.getByText('Validate Data');
    fireEvent.click(validateButton);

    await waitFor(() => {
      expect(transactionApi.validateImport).toHaveBeenCalledWith(csvData);
      expect(screen.getByText(/1 valid transactions, 0 errors/i)).toBeInTheDocument();
    });
  });

  it('displays validation errors in a table', async () => {
    (transactionApi.validateImport as jest.Mock).mockResolvedValue(mockValidationWithErrors);

    render(<TransactionImport open={true} onClose={mockOnClose} onImport={mockOnImport} />);

    const csvInput = screen.getByLabelText('CSV Data');
    const csvData = 'date,amount,category\nbad-date,1500,Rent\n2025-01-15,1500,BadCategory';

    fireEvent.change(csvInput, { target: { value: csvData } });

    const validateButton = screen.getByText('Validate Data');
    fireEvent.click(validateButton);

    await waitFor(() => {
      expect(screen.getByText(/0 valid transactions, 2 errors/i)).toBeInTheDocument();
      expect(screen.getByText('Errors to Fix:')).toBeInTheDocument();
      expect(screen.getByText('Invalid date format')).toBeInTheDocument();
      expect(screen.getByText('Category not found')).toBeInTheDocument();
    });
  });

  it('shows preview of valid transactions', async () => {
    (transactionApi.validateImport as jest.Mock).mockResolvedValue(mockValidationResult);

    render(<TransactionImport open={true} onClose={mockOnClose} onImport={mockOnImport} />);

    const csvInput = screen.getByLabelText('CSV Data');
    fireEvent.change(csvInput, { target: { value: 'date,amount,category\n2025-01-15,1500,Rent' } });

    const validateButton = screen.getByText('Validate Data');
    fireEvent.click(validateButton);

    await waitFor(() => {
      expect(screen.getByText(/Valid Transactions \(1\)/i)).toBeInTheDocument();
      expect(screen.getByText('2025-01-15')).toBeInTheDocument();
      expect(screen.getByText('$1500')).toBeInTheDocument();
      expect(screen.getByText('Rent')).toBeInTheDocument();
    });
  });

  it('enables import button only when there are valid transactions', async () => {
    (transactionApi.validateImport as jest.Mock).mockResolvedValue(mockValidationResult);

    render(<TransactionImport open={true} onClose={mockOnClose} onImport={mockOnImport} />);

    // Import button should be disabled initially
    let importButton = screen.getByText(/Import 0 Transactions/i);
    expect(importButton).toBeDisabled();

    // Enter and validate CSV
    const csvInput = screen.getByLabelText('CSV Data');
    fireEvent.change(csvInput, { target: { value: 'date,amount,category\n2025-01-15,1500,Rent' } });

    const validateButton = screen.getByText('Validate Data');
    fireEvent.click(validateButton);

    await waitFor(() => {
      importButton = screen.getByText(/Import 1 Transactions/i);
      expect(importButton).not.toBeDisabled();
    });
  });

  it('calls onImport and closes dialog when import is successful', async () => {
    (transactionApi.validateImport as jest.Mock).mockResolvedValue(mockValidationResult);

    render(<TransactionImport open={true} onClose={mockOnClose} onImport={mockOnImport} />);

    // Validate CSV
    const csvInput = screen.getByLabelText('CSV Data');
    fireEvent.change(csvInput, { target: { value: 'date,amount,category\n2025-01-15,1500,Rent' } });

    const validateButton = screen.getByText('Validate Data');
    fireEvent.click(validateButton);

    await waitFor(() => {
      expect(screen.getByText(/Import 1 Transactions/i)).toBeInTheDocument();
    });

    // Import
    const importButton = screen.getByText(/Import 1 Transactions/i);
    fireEvent.click(importButton);

    await waitFor(() => {
      expect(mockOnImport).toHaveBeenCalledWith(mockValidationResult.validTransactions);
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('downloads CSV template when link is clicked', () => {
    // Mock URL.createObjectURL and document.createElement
    global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = jest.fn();

    const mockLink = document.createElement('a');
    const clickSpy = jest.spyOn(mockLink, 'click');
    jest.spyOn(document, 'createElement').mockReturnValue(mockLink);

    render(<TransactionImport open={true} onClose={mockOnClose} onImport={mockOnImport} />);

    const downloadLink = screen.getByText('Download Sample CSV Template');
    fireEvent.click(downloadLink);

    expect(document.createElement).toHaveBeenCalledWith('a');
    expect(mockLink.href).toBe('blob:mock-url');
    expect(mockLink.download).toBe('transaction_template.csv');
    expect(clickSpy).toHaveBeenCalled();
  });

  it('handles validation API errors gracefully', async () => {
    (transactionApi.validateImport as jest.Mock).mockRejectedValue(new Error('Validation failed'));

    render(<TransactionImport open={true} onClose={mockOnClose} onImport={mockOnImport} />);

    const csvInput = screen.getByLabelText('CSV Data');
    fireEvent.change(csvInput, { target: { value: 'date,amount,category\n2025-01-15,1500,Rent' } });

    const validateButton = screen.getByText('Validate Data');
    fireEvent.click(validateButton);

    await waitFor(() => {
      // Should show error result
      expect(screen.getByText(/Validation failed/i)).toBeInTheDocument();
    });
  });

  it('closes and resets when Cancel is clicked', async () => {
    (transactionApi.validateImport as jest.Mock).mockResolvedValue(mockValidationResult);

    render(<TransactionImport open={true} onClose={mockOnClose} onImport={mockOnImport} />);

    const csvInput = screen.getByLabelText('CSV Data');
    fireEvent.change(csvInput, { target: { value: 'date,amount,category\n2025-01-15,1500,Rent' } });

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });
});

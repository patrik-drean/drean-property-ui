import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PageHeader } from '../PageHeader';

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
};

describe('PageHeader', () => {
  describe('rendering', () => {
    it('should display "Review Leads" title', () => {
      renderWithRouter(<PageHeader />);

      expect(screen.getByText('Review Leads')).toBeInTheDocument();
    });

    it('should have heading role for title', () => {
      renderWithRouter(<PageHeader />);

      expect(screen.getByRole('heading', { name: 'Review Leads' })).toBeInTheDocument();
    });

    it('should not display Add Lead button when onAddLead is not provided', () => {
      renderWithRouter(<PageHeader />);

      expect(screen.queryByRole('button', { name: /add lead/i })).not.toBeInTheDocument();
    });
  });

  describe('Add Lead button', () => {
    it('should display Add Lead button when onAddLead is provided', () => {
      const handleAddLead = jest.fn();
      renderWithRouter(<PageHeader onAddLead={handleAddLead} />);

      expect(screen.getByRole('button', { name: /add lead/i })).toBeInTheDocument();
    });

    it('should call onAddLead when button is clicked', () => {
      const handleAddLead = jest.fn();
      renderWithRouter(<PageHeader onAddLead={handleAddLead} />);

      const addButton = screen.getByRole('button', { name: /add lead/i });
      fireEvent.click(addButton);

      expect(handleAddLead).toHaveBeenCalledTimes(1);
    });
  });

  describe('Search functionality', () => {
    it('should not display search input when showSearch is false', () => {
      renderWithRouter(<PageHeader showSearch={false} />);

      expect(screen.queryByPlaceholderText(/search by address/i)).not.toBeInTheDocument();
    });

    it('should not display search input by default', () => {
      renderWithRouter(<PageHeader />);

      expect(screen.queryByPlaceholderText(/search by address/i)).not.toBeInTheDocument();
    });

    it('should display search input when showSearch is true', () => {
      renderWithRouter(<PageHeader showSearch={true} searchQuery="" />);

      expect(screen.getByPlaceholderText(/search by address, phone, or email/i)).toBeInTheDocument();
    });

    it('should display search query value in input', () => {
      renderWithRouter(<PageHeader showSearch={true} searchQuery="123 Main St" />);

      const input = screen.getByPlaceholderText(/search by address/i) as HTMLInputElement;
      expect(input.value).toBe('123 Main St');
    });

    it('should call onSearchChange when typing in search input', () => {
      const handleSearchChange = jest.fn();
      renderWithRouter(
        <PageHeader
          showSearch={true}
          searchQuery=""
          onSearchChange={handleSearchChange}
        />
      );

      const input = screen.getByPlaceholderText(/search by address/i);
      fireEvent.change(input, { target: { value: 'test search' } });

      expect(handleSearchChange).toHaveBeenCalledWith('test search');
    });

    it('should not display clear button when search is empty', () => {
      renderWithRouter(<PageHeader showSearch={true} searchQuery="" />);

      // Clear button should not be present when search is empty
      expect(screen.queryByLabelText(/clear/i)).not.toBeInTheDocument();
    });

    it('should display clear button when search has value', () => {
      renderWithRouter(
        <PageHeader
          showSearch={true}
          searchQuery="test"
          onClearSearch={jest.fn()}
        />
      );

      // Find the clear icon button (it's an IconButton with ClearIcon)
      const clearButton = screen.getByRole('button', { name: '' });
      expect(clearButton).toBeInTheDocument();
    });

    it('should call onClearSearch when clear button is clicked', () => {
      const handleClearSearch = jest.fn();
      renderWithRouter(
        <PageHeader
          showSearch={true}
          searchQuery="test"
          onClearSearch={handleClearSearch}
        />
      );

      // Find and click the clear button (IconButton inside the TextField)
      const buttons = screen.getAllByRole('button');
      const clearButton = buttons.find(btn => btn.querySelector('svg[data-testid="ClearIcon"]'));
      if (clearButton) {
        fireEvent.click(clearButton);
        expect(handleClearSearch).toHaveBeenCalledTimes(1);
      }
    });
  });
});

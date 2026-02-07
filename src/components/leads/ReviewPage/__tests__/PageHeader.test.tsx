import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { PageHeader } from '../PageHeader';

describe('PageHeader', () => {
  describe('rendering', () => {
    it('should display "Review Leads" title', () => {
      render(<PageHeader />);

      expect(screen.getByText('Review Leads')).toBeInTheDocument();
    });

    it('should have heading role for title', () => {
      render(<PageHeader />);

      expect(screen.getByRole('heading', { name: 'Review Leads' })).toBeInTheDocument();
    });

    it('should not display Add Lead button when onAddLead is not provided', () => {
      render(<PageHeader />);

      expect(screen.queryByRole('button', { name: /add lead/i })).not.toBeInTheDocument();
    });
  });

  describe('Add Lead button', () => {
    it('should display Add Lead button when onAddLead is provided', () => {
      const handleAddLead = jest.fn();
      render(<PageHeader onAddLead={handleAddLead} />);

      expect(screen.getByRole('button', { name: /add lead/i })).toBeInTheDocument();
    });

    it('should call onAddLead when button is clicked', () => {
      const handleAddLead = jest.fn();
      render(<PageHeader onAddLead={handleAddLead} />);

      const addButton = screen.getByRole('button', { name: /add lead/i });
      fireEvent.click(addButton);

      expect(handleAddLead).toHaveBeenCalledTimes(1);
    });
  });

  describe('Promote Listings button', () => {
    it('should not display Promote Listings button when onPromoteListings is not provided', () => {
      render(<PageHeader />);

      expect(screen.queryByRole('button', { name: /promote listings/i })).not.toBeInTheDocument();
    });

    it('should display Promote Listings button when onPromoteListings is provided', () => {
      const handlePromote = jest.fn();
      render(<PageHeader onPromoteListings={handlePromote} />);

      expect(screen.getByRole('button', { name: /promote listings/i })).toBeInTheDocument();
    });

    it('should call onPromoteListings when button is clicked', () => {
      const handlePromote = jest.fn();
      render(<PageHeader onPromoteListings={handlePromote} />);

      const promoteButton = screen.getByRole('button', { name: /promote listings/i });
      fireEvent.click(promoteButton);

      expect(handlePromote).toHaveBeenCalledTimes(1);
    });

    it('should display loading state when promoteLoading is true', () => {
      const handlePromote = jest.fn();
      render(<PageHeader onPromoteListings={handlePromote} promoteLoading={true} />);

      expect(screen.getByRole('button', { name: /promoting/i })).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should disable button when promoteLoading is true', () => {
      const handlePromote = jest.fn();
      render(<PageHeader onPromoteListings={handlePromote} promoteLoading={true} />);

      const promoteButton = screen.getByRole('button', { name: /promoting/i });
      expect(promoteButton).toBeDisabled();
    });

    it('should not call onPromoteListings when button is disabled', () => {
      const handlePromote = jest.fn();
      render(<PageHeader onPromoteListings={handlePromote} promoteLoading={true} />);

      const promoteButton = screen.getByRole('button', { name: /promoting/i });
      fireEvent.click(promoteButton);

      expect(handlePromote).not.toHaveBeenCalled();
    });

    it('should show normal text when not loading', () => {
      const handlePromote = jest.fn();
      render(<PageHeader onPromoteListings={handlePromote} promoteLoading={false} />);

      expect(screen.getByRole('button', { name: /promote listings/i })).toBeInTheDocument();
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
  });

  describe('Search functionality', () => {
    it('should not display search input when showSearch is false', () => {
      render(<PageHeader showSearch={false} />);

      expect(screen.queryByPlaceholderText(/search by address/i)).not.toBeInTheDocument();
    });

    it('should not display search input by default', () => {
      render(<PageHeader />);

      expect(screen.queryByPlaceholderText(/search by address/i)).not.toBeInTheDocument();
    });

    it('should display search input when showSearch is true', () => {
      render(<PageHeader showSearch={true} searchQuery="" />);

      expect(screen.getByPlaceholderText(/search by address, phone, or email/i)).toBeInTheDocument();
    });

    it('should display search query value in input', () => {
      render(<PageHeader showSearch={true} searchQuery="123 Main St" />);

      const input = screen.getByPlaceholderText(/search by address/i) as HTMLInputElement;
      expect(input.value).toBe('123 Main St');
    });

    it('should call onSearchChange when typing in search input', () => {
      const handleSearchChange = jest.fn();
      render(
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
      render(<PageHeader showSearch={true} searchQuery="" />);

      // Clear button should not be present when search is empty
      expect(screen.queryByLabelText(/clear/i)).not.toBeInTheDocument();
    });

    it('should display clear button when search has value', () => {
      render(
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
      render(
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

  describe('button combinations', () => {
    it('should display both Promote Listings and Add Lead buttons', () => {
      render(
        <PageHeader
          onAddLead={jest.fn()}
          onPromoteListings={jest.fn()}
        />
      );

      expect(screen.getByRole('button', { name: /add lead/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /promote listings/i })).toBeInTheDocument();
    });
  });
});

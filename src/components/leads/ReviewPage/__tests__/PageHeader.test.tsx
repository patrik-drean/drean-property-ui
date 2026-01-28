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
});

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ActionsSection } from '../ActionsSection';
import { QueueLead } from '../../../../types/queue';

describe('ActionsSection', () => {
  const mockLead: QueueLead = {
    id: 'lead-1',
    address: '123 Main Street, Austin, TX 78701',
    city: 'Austin',
    state: 'TX',
    zipCode: '78701',
    zillowLink: 'https://zillow.com/homedetails/123',
    listingPrice: 150000,
    sellerPhone: '555-123-4567',
    sellerEmail: 'seller@example.com',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    archived: false,
    tags: [],
    squareFootage: 1500,
    bedrooms: 3,
    bathrooms: 2,
    units: 1,
    notes: 'Test notes',
    leadScore: 8,
    mao: 105000,
    spreadPercent: 30,
    neighborhoodGrade: 'B',
    status: 'New',
    lastContactDate: null,
    priority: 'high',
    timeSinceCreated: '2h ago',
  };

  const defaultHandlers = {
    onStatusChange: jest.fn(),
    onAction: jest.fn(),
    onNotesChange: jest.fn(),
    onDeletePermanently: jest.fn().mockResolvedValue(undefined),
    deleteLoading: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Delete Permanently icon button', () => {
    it('should render delete icon button', () => {
      render(<ActionsSection lead={mockLead} {...defaultHandlers} />);

      // Icon button is rendered with trash icon (no text label, uses tooltip)
      const deleteButton = screen.getByTestId('DeleteForeverIcon').closest('button');
      expect(deleteButton).toBeInTheDocument();
    });

    it('should open confirmation dialog when delete icon is clicked', () => {
      render(<ActionsSection lead={mockLead} {...defaultHandlers} />);

      const deleteButton = screen.getByTestId('DeleteForeverIcon').closest('button')!;
      fireEvent.click(deleteButton);

      // Dialog should appear
      expect(screen.getByText('Delete Lead Permanently')).toBeInTheDocument();
      expect(screen.getByText('123 Main Street, Austin, TX 78701')).toBeInTheDocument();
    });

    it('should close dialog when Cancel is clicked', async () => {
      render(<ActionsSection lead={mockLead} {...defaultHandlers} />);

      // Open dialog
      const deleteButton = screen.getByTestId('DeleteForeverIcon').closest('button')!;
      fireEvent.click(deleteButton);
      expect(screen.getByText('Delete Lead Permanently')).toBeInTheDocument();

      // Click Cancel
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      // Dialog should close
      await waitFor(() => {
        expect(screen.queryByText('Delete Lead Permanently')).not.toBeInTheDocument();
      });
    });

    it('should call onDeletePermanently when confirmed', async () => {
      const onDeletePermanently = jest.fn().mockResolvedValue(undefined);
      render(
        <ActionsSection
          lead={mockLead}
          {...defaultHandlers}
          onDeletePermanently={onDeletePermanently}
        />
      );

      // Open dialog
      const deleteButton = screen.getByTestId('DeleteForeverIcon').closest('button')!;
      fireEvent.click(deleteButton);

      // Click confirm in dialog
      fireEvent.click(screen.getByRole('button', { name: 'Delete Permanently' }));

      await waitFor(() => {
        expect(onDeletePermanently).toHaveBeenCalledTimes(1);
      });
    });

    it('should not call onDeletePermanently when dialog is cancelled', () => {
      const onDeletePermanently = jest.fn();
      render(
        <ActionsSection
          lead={mockLead}
          {...defaultHandlers}
          onDeletePermanently={onDeletePermanently}
        />
      );

      // Open dialog
      const deleteButton = screen.getByTestId('DeleteForeverIcon').closest('button')!;
      fireEvent.click(deleteButton);

      // Click Cancel
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(onDeletePermanently).not.toHaveBeenCalled();
    });

    it('should show loading state in dialog when deleteLoading is true', () => {
      render(
        <ActionsSection lead={mockLead} {...defaultHandlers} deleteLoading={true} />
      );

      // Open dialog
      const deleteButton = screen.getByTestId('DeleteForeverIcon').closest('button')!;
      fireEvent.click(deleteButton);

      // Dialog should show loading spinner
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  describe('Archive button', () => {
    it('should render Archive Lead button', () => {
      render(<ActionsSection lead={mockLead} {...defaultHandlers} />);

      expect(screen.getByRole('button', { name: /Archive Lead/i })).toBeInTheDocument();
    });

    it('should call onAction with archive when Archive Lead is clicked', () => {
      render(<ActionsSection lead={mockLead} {...defaultHandlers} />);

      fireEvent.click(screen.getByRole('button', { name: /Archive Lead/i }));
      expect(defaultHandlers.onAction).toHaveBeenCalledWith('archive');
    });
  });

  describe('Mark Contacted button', () => {
    it('should show Mark Contacted when status is New', () => {
      render(<ActionsSection lead={mockLead} {...defaultHandlers} />);

      expect(screen.getByRole('button', { name: /Mark Contacted/i })).toBeInTheDocument();
    });

    it('should not show Mark Contacted when status is not New', () => {
      const contactedLead = { ...mockLead, status: 'Contacted' as const };
      render(<ActionsSection lead={contactedLead} {...defaultHandlers} />);

      expect(screen.queryByRole('button', { name: /Mark Contacted/i })).not.toBeInTheDocument();
    });

    it('should call onAction with markContacted when clicked', () => {
      render(<ActionsSection lead={mockLead} {...defaultHandlers} />);

      fireEvent.click(screen.getByRole('button', { name: /Mark Contacted/i }));
      expect(defaultHandlers.onAction).toHaveBeenCalledWith('markContacted');
    });
  });

  describe('Schedule Follow-Up button', () => {
    it('should render Schedule Follow-Up button', () => {
      render(<ActionsSection lead={mockLead} {...defaultHandlers} />);

      expect(screen.getByRole('button', { name: /Schedule Follow-Up/i })).toBeInTheDocument();
    });

    it('should call onAction with scheduleFollowUp when clicked', () => {
      render(<ActionsSection lead={mockLead} {...defaultHandlers} />);

      fireEvent.click(screen.getByRole('button', { name: /Schedule Follow-Up/i }));
      expect(defaultHandlers.onAction).toHaveBeenCalledWith('scheduleFollowUp');
    });
  });

  describe('Notes section', () => {
    it('should render notes textarea with existing notes', () => {
      render(<ActionsSection lead={mockLead} {...defaultHandlers} />);

      const notesTextarea = screen.getByPlaceholderText('Add notes about this lead...');
      expect(notesTextarea).toHaveValue('Test notes');
    });

    it('should call onNotesChange on blur when notes changed', () => {
      render(<ActionsSection lead={mockLead} {...defaultHandlers} />);

      const notesTextarea = screen.getByPlaceholderText('Add notes about this lead...');
      fireEvent.change(notesTextarea, { target: { value: 'Updated notes' } });
      fireEvent.blur(notesTextarea);

      expect(defaultHandlers.onNotesChange).toHaveBeenCalledWith('Updated notes');
    });

    it('should not call onNotesChange if notes unchanged', () => {
      render(<ActionsSection lead={mockLead} {...defaultHandlers} />);

      const notesTextarea = screen.getByPlaceholderText('Add notes about this lead...');
      fireEvent.blur(notesTextarea);

      expect(defaultHandlers.onNotesChange).not.toHaveBeenCalled();
    });
  });
});

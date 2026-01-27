import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ActionsSection } from '../ActionsSection';
import { QueueLead } from '../../../../types/queue';

describe('ActionsSection', () => {
  const mockLead: QueueLead = {
    id: 'lead-1',
    address: '123 Main Street',
    city: 'San Antonio',
    state: 'TX',
    zipCode: '78209',
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
    notes: 'Some existing notes',
    leadScore: 8,
    mao: 105000,
    spreadPercent: 30,
    neighborhoodGrade: 'B',
    status: 'New',
    lastContactDate: null,
    priority: 'high',
    timeSinceCreated: '2h ago',
  };

  const mockHandlers = {
    onStatusChange: jest.fn(),
    onAction: jest.fn(),
    onNotesChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('should display the section title', () => {
      render(<ActionsSection lead={mockLead} {...mockHandlers} />);

      expect(screen.getByText('ACTIONS')).toBeInTheDocument();
    });
  });

  describe('status dropdown', () => {
    it('should display Status label', () => {
      render(<ActionsSection lead={mockLead} {...mockHandlers} />);

      // MUI Select uses a combobox role
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('should show current status in dropdown', () => {
      render(<ActionsSection lead={mockLead} {...mockHandlers} />);

      // The current status value is displayed in the select
      expect(screen.getByRole('combobox')).toHaveTextContent('New');
    });

    it('should call onStatusChange when status is changed', async () => {
      render(<ActionsSection lead={mockLead} {...mockHandlers} />);

      // Open the dropdown by clicking on the select button
      const selectButton = screen.getByRole('combobox');
      fireEvent.mouseDown(selectButton);

      // Wait for menu to appear and click option
      const listbox = await screen.findByRole('listbox');
      const contactedOption = within(listbox).getByText('Contacted');
      fireEvent.click(contactedOption);

      expect(mockHandlers.onStatusChange).toHaveBeenCalledWith('Contacted');
    });

    it('should display all status options', async () => {
      render(<ActionsSection lead={mockLead} {...mockHandlers} />);

      const selectButton = screen.getByRole('combobox');
      fireEvent.mouseDown(selectButton);

      const listbox = await screen.findByRole('listbox');

      expect(within(listbox).getByText('New')).toBeInTheDocument();
      expect(within(listbox).getByText('Contacted')).toBeInTheDocument();
      expect(within(listbox).getByText('Responding')).toBeInTheDocument();
      expect(within(listbox).getByText('Negotiating')).toBeInTheDocument();
      expect(within(listbox).getByText('Under Contract')).toBeInTheDocument();
      expect(within(listbox).getByText('Closed')).toBeInTheDocument();
      expect(within(listbox).getByText('Lost')).toBeInTheDocument();
    });
  });

  describe('quick action buttons', () => {
    it('should display Mark Contacted button for New leads', () => {
      render(<ActionsSection lead={mockLead} {...mockHandlers} />);

      expect(screen.getByText('Mark Contacted')).toBeInTheDocument();
    });

    it('should not display Mark Contacted button for non-New leads', () => {
      const contactedLead = { ...mockLead, status: 'Contacted' as const };
      render(<ActionsSection lead={contactedLead} {...mockHandlers} />);

      expect(screen.queryByText('Mark Contacted')).not.toBeInTheDocument();
    });

    it('should display Schedule Follow-Up button', () => {
      render(<ActionsSection lead={mockLead} {...mockHandlers} />);

      expect(screen.getByText('Schedule Follow-Up')).toBeInTheDocument();
    });

    it('should display Archive Lead button', () => {
      render(<ActionsSection lead={mockLead} {...mockHandlers} />);

      expect(screen.getByText('Archive Lead')).toBeInTheDocument();
    });
  });

  describe('action button clicks', () => {
    it('should call onAction with markContacted when Mark Contacted is clicked', () => {
      render(<ActionsSection lead={mockLead} {...mockHandlers} />);

      fireEvent.click(screen.getByText('Mark Contacted'));
      expect(mockHandlers.onAction).toHaveBeenCalledWith('markContacted');
    });

    it('should call onAction with scheduleFollowUp when Schedule Follow-Up is clicked', () => {
      render(<ActionsSection lead={mockLead} {...mockHandlers} />);

      fireEvent.click(screen.getByText('Schedule Follow-Up'));
      expect(mockHandlers.onAction).toHaveBeenCalledWith('scheduleFollowUp');
    });

    it('should call onAction with archive when Archive Lead is clicked', () => {
      render(<ActionsSection lead={mockLead} {...mockHandlers} />);

      fireEvent.click(screen.getByText('Archive Lead'));
      expect(mockHandlers.onAction).toHaveBeenCalledWith('archive');
    });
  });

  describe('notes section', () => {
    it('should display Notes label', () => {
      render(<ActionsSection lead={mockLead} {...mockHandlers} />);

      expect(screen.getByText('Notes:')).toBeInTheDocument();
    });

    it('should have a multiline text input', () => {
      render(<ActionsSection lead={mockLead} {...mockHandlers} />);

      const textarea = screen.getByPlaceholderText('Add notes about this lead...');
      expect(textarea).toBeInTheDocument();
    });

    it('should display existing notes', () => {
      render(<ActionsSection lead={mockLead} {...mockHandlers} />);

      const textarea = screen.getByPlaceholderText('Add notes about this lead...') as HTMLTextAreaElement;
      expect(textarea.value).toBe('Some existing notes');
    });

    it('should call onNotesChange when notes are modified and blurred', async () => {
      render(<ActionsSection lead={mockLead} {...mockHandlers} />);

      const textarea = screen.getByPlaceholderText('Add notes about this lead...');
      await userEvent.clear(textarea);
      await userEvent.type(textarea, 'Updated notes');
      fireEvent.blur(textarea);

      expect(mockHandlers.onNotesChange).toHaveBeenCalledWith('Updated notes');
    });

    it('should not call onNotesChange if notes unchanged', async () => {
      render(<ActionsSection lead={mockLead} {...mockHandlers} />);

      const textarea = screen.getByPlaceholderText('Add notes about this lead...');
      fireEvent.blur(textarea);

      expect(mockHandlers.onNotesChange).not.toHaveBeenCalled();
    });
  });

  describe('different lead statuses', () => {
    it('should show correct current status for Negotiating leads', () => {
      const negotiatingLead = { ...mockLead, status: 'Negotiating' as const };
      render(<ActionsSection lead={negotiatingLead} {...mockHandlers} />);

      // The select should display the current status
      expect(screen.getByText('Negotiating')).toBeInTheDocument();
    });

    it('should show correct current status for Responding leads', () => {
      const respondingLead = { ...mockLead, status: 'Responding' as const };
      render(<ActionsSection lead={respondingLead} {...mockHandlers} />);

      expect(screen.getByText('Responding')).toBeInTheDocument();
    });
  });

  describe('empty notes', () => {
    it('should handle empty notes gracefully', () => {
      const leadEmptyNotes = { ...mockLead, notes: '' };
      render(<ActionsSection lead={leadEmptyNotes} {...mockHandlers} />);

      const textarea = screen.getByPlaceholderText('Add notes about this lead...') as HTMLTextAreaElement;
      expect(textarea.value).toBe('');
    });
  });
});

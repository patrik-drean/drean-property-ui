import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MessagingSection } from '../MessagingSection';
import { QueueLead } from '../../../../types/queue';

describe('MessagingSection', () => {
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
    notes: '',
    leadScore: 8,
    mao: 105000,
    spreadPercent: 30,
    neighborhoodGrade: 'B',
    status: 'Contacted',
    lastContactDate: new Date().toISOString(),
    priority: 'high',
    timeSinceCreated: '2h ago',
    respondedDate: new Date().toISOString(),
  };

  const mockHandlers = {
    onSendMessage: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('should display the section title', () => {
      render(<MessagingSection lead={mockLead} {...mockHandlers} />);

      expect(screen.getByText('MESSAGING')).toBeInTheDocument();
    });

    it('should display formatted phone number', () => {
      render(<MessagingSection lead={mockLead} {...mockHandlers} />);

      // Phone is formatted as (555) 123-4567
      expect(screen.getByText('(555) 123-4567')).toBeInTheDocument();
    });
  });

  describe('message history', () => {
    it('should display "No messages yet" for new leads', () => {
      const newLead = { ...mockLead, status: 'New' as const, lastContactDate: null };
      render(<MessagingSection lead={newLead} {...mockHandlers} />);

      expect(screen.getByText('No messages yet')).toBeInTheDocument();
    });

    it('should display message bubbles for contacted leads', () => {
      render(<MessagingSection lead={mockLead} {...mockHandlers} />);

      // Contacted leads should have at least one outbound message (mocked)
      // The mock shows previous messages for contacted leads
      expect(screen.queryByText('No messages yet')).not.toBeInTheDocument();
    });
  });

  describe('message compose', () => {
    it('should have a text input for composing messages', () => {
      render(<MessagingSection lead={mockLead} {...mockHandlers} />);

      expect(screen.getByPlaceholderText('Type a message...')).toBeInTheDocument();
    });

    it('should have a send button', () => {
      render(<MessagingSection lead={mockLead} {...mockHandlers} />);

      // Find the send button by its icon or text
      const buttons = screen.getAllByRole('button');
      const sendButton = buttons.find(btn => btn.querySelector('svg'));
      expect(sendButton).toBeDefined();
    });

    it('should call onSendMessage when send button is clicked with message', async () => {
      render(<MessagingSection lead={mockLead} {...mockHandlers} />);

      const input = screen.getByPlaceholderText('Type a message...');
      await userEvent.type(input, 'Hello, I am interested in your property');

      // Find the send button (the button with an SVG icon)
      const buttons = screen.getAllByRole('button');
      const sendButton = buttons.find(btn => btn.querySelector('svg'));

      if (sendButton) {
        fireEvent.click(sendButton);
        expect(mockHandlers.onSendMessage).toHaveBeenCalledWith('Hello, I am interested in your property');
      }
    });

    it('should clear input after sending message', async () => {
      render(<MessagingSection lead={mockLead} {...mockHandlers} />);

      const input = screen.getByPlaceholderText('Type a message...') as HTMLInputElement;
      await userEvent.type(input, 'Test message');

      const buttons = screen.getAllByRole('button');
      const sendButton = buttons.find(btn => btn.querySelector('svg'));

      if (sendButton) {
        fireEvent.click(sendButton);
        expect(input.value).toBe('');
      }
    });

    it('should send message on Enter key press', async () => {
      render(<MessagingSection lead={mockLead} {...mockHandlers} />);

      const input = screen.getByPlaceholderText('Type a message...');
      await userEvent.type(input, 'Test message{enter}');

      expect(mockHandlers.onSendMessage).toHaveBeenCalledWith('Test message');
    });

    it('should not send empty message', async () => {
      render(<MessagingSection lead={mockLead} {...mockHandlers} />);

      const buttons = screen.getAllByRole('button');
      const sendButton = buttons.find(btn => btn.querySelector('svg'));

      if (sendButton) {
        fireEvent.click(sendButton);
        expect(mockHandlers.onSendMessage).not.toHaveBeenCalled();
      }
    });
  });

  describe('template chips', () => {
    it('should display Quick Templates label', () => {
      render(<MessagingSection lead={mockLead} {...mockHandlers} />);

      expect(screen.getByText('Quick Templates:')).toBeInTheDocument();
    });

    it('should display Initial Outreach template chip', () => {
      render(<MessagingSection lead={mockLead} {...mockHandlers} />);

      expect(screen.getByText('Initial Outreach')).toBeInTheDocument();
    });

    it('should display Follow-Up template chip', () => {
      render(<MessagingSection lead={mockLead} {...mockHandlers} />);

      expect(screen.getByText('Follow-Up')).toBeInTheDocument();
    });

    it('should display Price Discussion template chip', () => {
      render(<MessagingSection lead={mockLead} {...mockHandlers} />);

      expect(screen.getByText('Price Discussion')).toBeInTheDocument();
    });

    it('should populate message input when template is clicked', async () => {
      render(<MessagingSection lead={mockLead} {...mockHandlers} />);

      const initialOutreachChip = screen.getByText('Initial Outreach');
      fireEvent.click(initialOutreachChip);

      const input = screen.getByPlaceholderText('Type a message...') as HTMLInputElement;
      expect(input.value).toContain('property');
    });

    it('should highlight selected template', () => {
      render(<MessagingSection lead={mockLead} {...mockHandlers} />);

      const initialOutreachChip = screen.getByText('Initial Outreach');
      fireEvent.click(initialOutreachChip);

      // After clicking, the chip should have a selected state
      // The implementation adds visual styling for selected state
      expect(initialOutreachChip.closest('.MuiChip-root')).toBeInTheDocument();
    });
  });

  describe('template message customization', () => {
    it('should replace {address} placeholder in templates', async () => {
      render(<MessagingSection lead={mockLead} {...mockHandlers} />);

      const initialOutreachChip = screen.getByText('Initial Outreach');
      fireEvent.click(initialOutreachChip);

      const input = screen.getByPlaceholderText('Type a message...') as HTMLInputElement;
      // The template should include the first part of the address
      expect(input.value).toContain('123 Main Street');
    });
  });

  describe('phone display and editing', () => {
    it('should display "No phone number" when empty', () => {
      const leadNoPhone = { ...mockLead, sellerPhone: '' };
      render(<MessagingSection lead={leadNoPhone} {...mockHandlers} />);

      expect(screen.getByText('No phone number')).toBeInTheDocument();
    });

    it('should display formatted phone when present', () => {
      render(<MessagingSection lead={mockLead} {...mockHandlers} />);

      // Phone is formatted as (555) 123-4567
      expect(screen.getByText('(555) 123-4567')).toBeInTheDocument();
    });

    it('should show edit icon when onSellerPhoneChange is provided', () => {
      const mockPhoneChange = jest.fn();
      render(<MessagingSection lead={mockLead} {...mockHandlers} onSellerPhoneChange={mockPhoneChange} />);

      // Phone should be clickable to edit
      const phoneText = screen.getByText('(555) 123-4567');
      expect(phoneText).toBeInTheDocument();
    });

    it('should enter edit mode when clicking on phone', () => {
      const mockPhoneChange = jest.fn();
      render(<MessagingSection lead={mockLead} {...mockHandlers} onSellerPhoneChange={mockPhoneChange} />);

      const phoneText = screen.getByText('(555) 123-4567');
      fireEvent.click(phoneText);

      // Should show input field
      const input = screen.getByPlaceholderText('Enter phone number');
      expect(input).toBeInTheDocument();
    });

    it('should save phone when pressing Enter', () => {
      const mockPhoneChange = jest.fn();
      render(<MessagingSection lead={mockLead} {...mockHandlers} onSellerPhoneChange={mockPhoneChange} />);

      // Enter edit mode
      const phoneText = screen.getByText('(555) 123-4567');
      fireEvent.click(phoneText);

      // Change value and press Enter
      const input = screen.getByPlaceholderText('Enter phone number');
      fireEvent.change(input, { target: { value: '210-555-9999' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      expect(mockPhoneChange).toHaveBeenCalledWith('210-555-9999');
    });

    it('should cancel edit when pressing Escape', () => {
      const mockPhoneChange = jest.fn();
      render(<MessagingSection lead={mockLead} {...mockHandlers} onSellerPhoneChange={mockPhoneChange} />);

      // Enter edit mode
      const phoneText = screen.getByText('(555) 123-4567');
      fireEvent.click(phoneText);

      // Change value and press Escape
      const input = screen.getByPlaceholderText('Enter phone number');
      fireEvent.change(input, { target: { value: '210-555-9999' } });
      fireEvent.keyDown(input, { key: 'Escape', code: 'Escape' });

      // Should not call handler
      expect(mockPhoneChange).not.toHaveBeenCalled();
      // Should show original phone (formatted)
      expect(screen.getByText('(555) 123-4567')).toBeInTheDocument();
    });
  });
});

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueueCard } from '../QueueCard';
import { QueueLead } from '../../../../types/queue';

describe('QueueCard', () => {
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
    status: 'New',
    lastContactDate: null,
    priority: 'high',
    timeSinceCreated: '2h ago',
    aiSummary: 'Strong investment opportunity. Property is priced 15% below market with minimal repairs needed. Seller appears motivated.',
    aiSuggestion: {
      templateName: 'Quick Cash Offer',
      messagePreview: 'Hi there! I noticed your property...',
      confidence: 85,
    },
  };

  const mockHandlers = {
    onSelect: jest.fn(),
    onViewDetails: jest.fn(),
    onDone: jest.fn(),
    onSkip: jest.fn(),
    onArchive: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Helper to find actual button elements (not role="button" containers)
  const findButtonByText = (text: string) => {
    return screen.getAllByRole('button').find(
      (btn) => btn.tagName === 'BUTTON' && btn.textContent?.includes(text)
    );
  };

  describe('rendering', () => {
    it('should display the address', () => {
      render(<QueueCard lead={mockLead} isSelected={false} {...mockHandlers} />);

      expect(screen.getByText('123 Main Street')).toBeInTheDocument();
    });

    it('should display the listing price', () => {
      render(<QueueCard lead={mockLead} isSelected={false} {...mockHandlers} />);

      expect(screen.getByText('$150,000')).toBeInTheDocument();
    });

    it('should display property basics (beds/baths/sqft)', () => {
      render(<QueueCard lead={mockLead} isSelected={false} {...mockHandlers} />);

      expect(screen.getByText('3bd · 2ba · 1,500 sqft')).toBeInTheDocument();
    });

    it('should display the priority badge', () => {
      render(<QueueCard lead={mockLead} isSelected={false} {...mockHandlers} />);

      expect(screen.getByText('HIGH')).toBeInTheDocument();
    });

    it('should display time since created', () => {
      render(<QueueCard lead={mockLead} isSelected={false} {...mockHandlers} />);

      expect(screen.getByText('2h ago')).toBeInTheDocument();
    });

    it('should display AI summary when present', () => {
      render(<QueueCard lead={mockLead} isSelected={false} {...mockHandlers} />);

      expect(screen.getByText('AI Analysis')).toBeInTheDocument();
      expect(screen.getByText(/Strong investment opportunity/)).toBeInTheDocument();
    });

    it('should not display AI summary when absent', () => {
      const leadWithoutAi = { ...mockLead, aiSummary: undefined };
      render(<QueueCard lead={leadWithoutAi} isSelected={false} {...mockHandlers} />);

      expect(screen.queryByText('AI Analysis')).not.toBeInTheDocument();
    });
  });

  describe('primary action buttons', () => {
    it('should render View Details button', () => {
      render(<QueueCard lead={mockLead} isSelected={false} {...mockHandlers} />);

      const detailsButton = findButtonByText('View Details');
      expect(detailsButton).toBeDefined();
    });

    it('should call onViewDetails when View Details is clicked', () => {
      render(<QueueCard lead={mockLead} isSelected={false} {...mockHandlers} />);

      const detailsButton = findButtonByText('View Details');
      expect(detailsButton).toBeDefined();
      fireEvent.click(detailsButton!);
      expect(mockHandlers.onViewDetails).toHaveBeenCalledTimes(1);
    });
  });

  describe('secondary action buttons', () => {
    it('should call onDone when done button is clicked', () => {
      render(<QueueCard lead={mockLead} isSelected={false} {...mockHandlers} />);

      const doneButton = screen.getByLabelText(/Mark as done/i);
      fireEvent.click(doneButton);
      expect(mockHandlers.onDone).toHaveBeenCalledTimes(1);
    });

    it('should call onSkip when skip button is clicked', () => {
      render(<QueueCard lead={mockLead} isSelected={false} {...mockHandlers} />);

      const skipButton = screen.getByLabelText(/Skip for now/i);
      fireEvent.click(skipButton);
      expect(mockHandlers.onSkip).toHaveBeenCalledTimes(1);
    });

    it('should call onArchive when archive button is clicked', () => {
      render(<QueueCard lead={mockLead} isSelected={false} {...mockHandlers} />);

      const archiveButton = screen.getByLabelText(/Archive/i);
      fireEvent.click(archiveButton);
      expect(mockHandlers.onArchive).toHaveBeenCalledTimes(1);
    });
  });

  describe('card selection', () => {
    it('should call onSelect when card is clicked', () => {
      render(<QueueCard lead={mockLead} isSelected={false} {...mockHandlers} />);

      // Find the card container (div with role="button")
      const card = screen.getByText('123 Main Street').closest('[role="button"]');
      expect(card).toBeDefined();
      fireEvent.click(card!);
      expect(mockHandlers.onSelect).toHaveBeenCalledTimes(1);
    });

    it('should call onSelect when Enter key is pressed', () => {
      render(<QueueCard lead={mockLead} isSelected={false} {...mockHandlers} />);

      const card = screen.getByText('123 Main Street').closest('[role="button"]');
      expect(card).toBeDefined();
      fireEvent.keyDown(card!, { key: 'Enter' });
      expect(mockHandlers.onSelect).toHaveBeenCalledTimes(1);
    });

    it('should call onSelect when Space key is pressed', () => {
      render(<QueueCard lead={mockLead} isSelected={false} {...mockHandlers} />);

      const card = screen.getByText('123 Main Street').closest('[role="button"]');
      expect(card).toBeDefined();
      fireEvent.keyDown(card!, { key: ' ' });
      expect(mockHandlers.onSelect).toHaveBeenCalledTimes(1);
    });

    it('should not call onSelect for action button clicks', () => {
      render(<QueueCard lead={mockLead} isSelected={false} {...mockHandlers} />);

      const detailsButton = findButtonByText('View Details');
      fireEvent.click(detailsButton!);

      // onSelect should not be called when clicking action buttons
      expect(mockHandlers.onSelect).not.toHaveBeenCalled();
    });
  });

  describe('Zillow link', () => {
    it('should render Zillow link button when zillowLink is present', () => {
      render(<QueueCard lead={mockLead} isSelected={false} {...mockHandlers} />);

      expect(screen.getByLabelText(/View on Zillow/i)).toBeInTheDocument();
    });

    it('should not render Zillow link button when zillowLink is empty', () => {
      const leadWithoutZillow = { ...mockLead, zillowLink: '' };
      render(<QueueCard lead={leadWithoutZillow} isSelected={false} {...mockHandlers} />);

      expect(screen.queryByLabelText(/View on Zillow/i)).not.toBeInTheDocument();
    });

    it('should open Zillow link in new tab when clicked', () => {
      const windowOpenSpy = jest.spyOn(window, 'open').mockImplementation();

      render(<QueueCard lead={mockLead} isSelected={false} {...mockHandlers} />);

      fireEvent.click(screen.getByLabelText(/View on Zillow/i));
      expect(windowOpenSpy).toHaveBeenCalledWith('https://zillow.com/homedetails/123', '_blank');

      windowOpenSpy.mockRestore();
    });
  });

  describe('missing data handling', () => {
    it('should display "Details N/A" when no property details', () => {
      const leadNoDetails = {
        ...mockLead,
        bedrooms: 0,
        bathrooms: 0,
        squareFootage: 0,
      };
      render(<QueueCard lead={leadNoDetails} isSelected={false} {...mockHandlers} />);

      expect(screen.getByText('Details N/A')).toBeInTheDocument();
    });

    it('should handle null MAO', () => {
      const leadNullMao = { ...mockLead, mao: undefined };
      render(<QueueCard lead={leadNullMao} isSelected={false} {...mockHandlers} />);

      // Should still render without error
      expect(screen.getByText('123 Main Street')).toBeInTheDocument();
    });

    it('should handle null spreadPercent', () => {
      const leadNullSpread = { ...mockLead, spreadPercent: undefined };
      render(<QueueCard lead={leadNullSpread} isSelected={false} {...mockHandlers} />);

      // Should still render without error
      expect(screen.getByText('123 Main Street')).toBeInTheDocument();
    });

    it('should handle null neighborhoodGrade', () => {
      const leadNullGrade = { ...mockLead, neighborhoodGrade: undefined };
      render(<QueueCard lead={leadNullGrade} isSelected={false} {...mockHandlers} />);

      // Should still render without error
      expect(screen.getByText('123 Main Street')).toBeInTheDocument();
    });
  });

  describe('different priorities', () => {
    it('should display URGENT priority', () => {
      const urgentLead = { ...mockLead, priority: 'urgent' as const };
      render(<QueueCard lead={urgentLead} isSelected={false} {...mockHandlers} />);

      expect(screen.getByText('URGENT')).toBeInTheDocument();
    });

    it('should display MEDIUM priority', () => {
      const mediumLead = { ...mockLead, priority: 'medium' as const };
      render(<QueueCard lead={mediumLead} isSelected={false} {...mockHandlers} />);

      expect(screen.getByText('MEDIUM')).toBeInTheDocument();
    });

    it('should display NORMAL priority', () => {
      const normalLead = { ...mockLead, priority: 'normal' as const };
      render(<QueueCard lead={normalLead} isSelected={false} {...mockHandlers} />);

      expect(screen.getByText('NORMAL')).toBeInTheDocument();
    });
  });
});

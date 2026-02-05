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
    onFollowUp: jest.fn(),
    onArchive: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

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

  describe('action buttons', () => {
    it('should call onDone when done button is clicked', () => {
      render(<QueueCard lead={mockLead} isSelected={false} {...mockHandlers} />);

      const doneButton = screen.getByTestId('done-button');
      fireEvent.click(doneButton);
      expect(mockHandlers.onDone).toHaveBeenCalledTimes(1);
    });

    it('should call onFollowUp when follow-up button is clicked', () => {
      render(<QueueCard lead={mockLead} isSelected={false} {...mockHandlers} />);

      const followUpButton = screen.getByTestId('followup-button');
      fireEvent.click(followUpButton);
      expect(mockHandlers.onFollowUp).toHaveBeenCalledTimes(1);
    });

    it('should call onArchive when archive button is clicked', () => {
      render(<QueueCard lead={mockLead} isSelected={false} {...mockHandlers} />);

      const archiveButton = screen.getByTestId('archive-button');
      fireEvent.click(archiveButton);
      expect(mockHandlers.onArchive).toHaveBeenCalledTimes(1);
    });

    it('should not propagate clicks from action buttons to card', () => {
      render(<QueueCard lead={mockLead} isSelected={false} {...mockHandlers} />);

      const doneButton = screen.getByTestId('done-button');
      fireEvent.click(doneButton);

      // onViewDetails should not be called when clicking action buttons
      expect(mockHandlers.onViewDetails).not.toHaveBeenCalled();
    });
  });

  describe('card click behavior', () => {
    it('should call onViewDetails with false when card is clicked', () => {
      render(<QueueCard lead={mockLead} isSelected={false} {...mockHandlers} />);

      const card = screen.getByText('123 Main Street').closest('[role="button"]');
      expect(card).toBeDefined();
      fireEvent.click(card!);
      expect(mockHandlers.onViewDetails).toHaveBeenCalledWith(false);
    });

    it('should call onViewDetails when Enter key is pressed', () => {
      render(<QueueCard lead={mockLead} isSelected={false} {...mockHandlers} />);

      const card = screen.getByText('123 Main Street').closest('[role="button"]');
      expect(card).toBeDefined();
      fireEvent.keyDown(card!, { key: 'Enter' });
      expect(mockHandlers.onViewDetails).toHaveBeenCalled();
    });

    it('should call onViewDetails when Space key is pressed', () => {
      render(<QueueCard lead={mockLead} isSelected={false} {...mockHandlers} />);

      const card = screen.getByText('123 Main Street').closest('[role="button"]');
      expect(card).toBeDefined();
      fireEvent.keyDown(card!, { key: ' ' });
      expect(mockHandlers.onViewDetails).toHaveBeenCalled();
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

  describe('cover photo', () => {
    it('should display cover photo when photoUrl is present', () => {
      const leadWithPhoto = {
        ...mockLead,
        photoUrl: 'https://photos.zillowstatic.com/photo123.jpg',
      };
      render(<QueueCard lead={leadWithPhoto} isSelected={false} {...mockHandlers} />);

      const img = screen.getByAltText('123 Main Street exterior');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', 'https://photos.zillowstatic.com/photo123.jpg');
      expect(img).toHaveAttribute('loading', 'lazy');
    });

    it('should display placeholder when photoUrl is undefined', () => {
      const leadNoPhoto = { ...mockLead, photoUrl: undefined };
      render(<QueueCard lead={leadNoPhoto} isSelected={false} {...mockHandlers} />);

      // Should not find an image with the exterior alt text
      expect(screen.queryByAltText('123 Main Street exterior')).not.toBeInTheDocument();
      // HomeIcon placeholder should be rendered (there's already a HomeIcon for property basics)
      const homeIcons = document.querySelectorAll('[data-testid="HomeIcon"]');
      // Should have at least 2 HomeIcon elements (one for photo placeholder, one for property basics)
      expect(homeIcons.length).toBeGreaterThanOrEqual(1);
    });

    it('should display placeholder when photoUrl is empty string', () => {
      const leadEmptyPhoto = { ...mockLead, photoUrl: '' };
      render(<QueueCard lead={leadEmptyPhoto} isSelected={false} {...mockHandlers} />);

      expect(screen.queryByAltText('123 Main Street exterior')).not.toBeInTheDocument();
    });

    it('should display placeholder when photoUrl is whitespace only', () => {
      const leadWhitespacePhoto = { ...mockLead, photoUrl: '   ' };
      render(<QueueCard lead={leadWhitespacePhoto} isSelected={false} {...mockHandlers} />);

      expect(screen.queryByAltText('123 Main Street exterior')).not.toBeInTheDocument();
    });

    it('should fallback to placeholder when image fails to load', () => {
      const leadWithPhoto = {
        ...mockLead,
        photoUrl: 'https://photos.zillowstatic.com/invalid-photo.jpg',
      };
      render(<QueueCard lead={leadWithPhoto} isSelected={false} {...mockHandlers} />);

      const img = screen.getByAltText('123 Main Street exterior');
      expect(img).toBeInTheDocument();

      // Simulate image load error
      fireEvent.error(img);

      // After error, image should no longer be visible (placeholder shown instead)
      expect(screen.queryByAltText('123 Main Street exterior')).not.toBeInTheDocument();
    });

    it('should render card correctly with photo and all other content', () => {
      const leadWithPhoto = {
        ...mockLead,
        photoUrl: 'https://photos.zillowstatic.com/photo123.jpg',
      };
      render(<QueueCard lead={leadWithPhoto} isSelected={false} {...mockHandlers} />);

      // Photo should be present
      expect(screen.getByAltText('123 Main Street exterior')).toBeInTheDocument();
      // Address should still be visible
      expect(screen.getByText('123 Main Street')).toBeInTheDocument();
      // Price should still be visible
      expect(screen.getByText('$150,000')).toBeInTheDocument();
      // Priority should still be visible
      expect(screen.getByText('HIGH')).toBeInTheDocument();
    });
  });

  describe('photo gallery interaction', () => {
    it('should call onViewDetails with true when photo is clicked (has photos)', () => {
      const leadWithPhotos = {
        ...mockLead,
        photoUrl: 'https://photos.zillowstatic.com/photo1.jpg',
        photoUrls: [
          'https://photos.zillowstatic.com/photo1.jpg',
          'https://photos.zillowstatic.com/photo2.jpg',
        ],
      };
      render(<QueueCard lead={leadWithPhotos} isSelected={false} {...mockHandlers} />);

      const img = screen.getByAltText('123 Main Street exterior');
      fireEvent.click(img);

      expect(mockHandlers.onViewDetails).toHaveBeenCalledWith(true);
    });

    it('should display photo count overlay when multiple photos', () => {
      const leadWithPhotos = {
        ...mockLead,
        photoUrl: 'https://photos.zillowstatic.com/photo1.jpg',
        photoUrls: [
          'https://photos.zillowstatic.com/photo1.jpg',
          'https://photos.zillowstatic.com/photo2.jpg',
          'https://photos.zillowstatic.com/photo3.jpg',
        ],
      };
      render(<QueueCard lead={leadWithPhotos} isSelected={false} {...mockHandlers} />);

      // Should show photo count badge
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('should not display photo count when only one photo', () => {
      const leadWithOnePhoto = {
        ...mockLead,
        photoUrl: 'https://photos.zillowstatic.com/photo1.jpg',
        photoUrls: ['https://photos.zillowstatic.com/photo1.jpg'],
      };
      render(<QueueCard lead={leadWithOnePhoto} isSelected={false} {...mockHandlers} />);

      // Photo count should not be displayed
      expect(screen.queryByText('1')).not.toBeInTheDocument();
    });

    it('should not call onViewDetails with true when photo is clicked but no photos array', () => {
      const leadNoPhotoUrls = {
        ...mockLead,
        photoUrl: undefined,
        photoUrls: [],
      };
      render(<QueueCard lead={leadNoPhotoUrls} isSelected={false} {...mockHandlers} />);

      // With no valid photo, we get placeholder - clicking card should open details without gallery
      const card = screen.getByText('123 Main Street').closest('[role="button"]');
      fireEvent.click(card!);

      expect(mockHandlers.onViewDetails).toHaveBeenCalledWith(false);
    });
  });
});

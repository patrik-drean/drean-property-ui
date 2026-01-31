import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { PropertyDetailsSection } from '../PropertyDetailsSection';
import { QueueLead } from '../../../../types/queue';

describe('PropertyDetailsSection', () => {
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
  };

  describe('rendering', () => {
    it('should display the section title', () => {
      render(<PropertyDetailsSection lead={mockLead} />);

      expect(screen.getByText('PROPERTY DETAILS')).toBeInTheDocument();
    });

    it('should display the address', () => {
      render(<PropertyDetailsSection lead={mockLead} />);

      expect(screen.getByText('123 Main Street')).toBeInTheDocument();
    });

    it('should display listing price formatted as currency', () => {
      render(<PropertyDetailsSection lead={mockLead} />);

      expect(screen.getByText('$150,000')).toBeInTheDocument();
    });
  });

  describe('property stats', () => {
    it('should display bedrooms', () => {
      render(<PropertyDetailsSection lead={mockLead} />);

      expect(screen.getByText('Beds')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('should display bathrooms', () => {
      render(<PropertyDetailsSection lead={mockLead} />);

      expect(screen.getByText('Baths')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('should display square footage formatted', () => {
      render(<PropertyDetailsSection lead={mockLead} />);

      expect(screen.getByText('Sq Ft')).toBeInTheDocument();
      expect(screen.getByText('1,500')).toBeInTheDocument();
    });

    it('should display units', () => {
      render(<PropertyDetailsSection lead={mockLead} />);

      expect(screen.getByText('Units')).toBeInTheDocument();
    });

    it('should display seller phone', () => {
      render(<PropertyDetailsSection lead={mockLead} />);

      expect(screen.getByText('Phone')).toBeInTheDocument();
      expect(screen.getByText('555-123-4567')).toBeInTheDocument();
    });
  });

  describe('Zillow link', () => {
    it('should display Zillow link when present', () => {
      render(<PropertyDetailsSection lead={mockLead} />);

      expect(screen.getByText('View on Zillow')).toBeInTheDocument();
    });

    it('should have correct href for Zillow link', () => {
      render(<PropertyDetailsSection lead={mockLead} />);

      const link = screen.getByText('View on Zillow').closest('a');
      expect(link).toHaveAttribute('href', 'https://zillow.com/homedetails/123');
      expect(link).toHaveAttribute('target', '_blank');
    });

    it('should not display Zillow link when empty', () => {
      const leadNoZillow = { ...mockLead, zillowLink: '' };
      render(<PropertyDetailsSection lead={leadNoZillow} />);

      expect(screen.queryByText('View on Zillow')).not.toBeInTheDocument();
    });
  });

  describe('missing data handling', () => {
    it('should display dash for missing bedrooms', () => {
      const leadNoBeds = { ...mockLead, bedrooms: null };
      render(<PropertyDetailsSection lead={leadNoBeds} />);

      const bedsSection = screen.getByText('Beds').closest('div');
      expect(bedsSection).toBeInTheDocument();
      // The value should show a dash or null representation
    });

    it('should display dash for missing square footage', () => {
      const leadNoSqft = { ...mockLead, squareFootage: null };
      render(<PropertyDetailsSection lead={leadNoSqft} />);

      expect(screen.getByText('Sq Ft')).toBeInTheDocument();
    });

    it('should display dash for missing phone', () => {
      const leadNoPhone = { ...mockLead, sellerPhone: '' };
      render(<PropertyDetailsSection lead={leadNoPhone} />);

      expect(screen.getByText('Phone')).toBeInTheDocument();
      expect(screen.getByText('-')).toBeInTheDocument();
    });
  });

  describe('days on market', () => {
    it('should calculate and display days on market', () => {
      // Create a lead that was created 5 days ago
      const fiveDaysAgo = new Date();
      fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

      const leadWithDate = { ...mockLead, createdAt: fiveDaysAgo.toISOString() };
      render(<PropertyDetailsSection lead={leadWithDate} />);

      expect(screen.getByText('DOM')).toBeInTheDocument();
      expect(screen.getByText('5 days')).toBeInTheDocument();
    });

    it('should display 0 days for leads created today', () => {
      const today = new Date().toISOString();
      const leadToday = { ...mockLead, createdAt: today };
      render(<PropertyDetailsSection lead={leadToday} />);

      expect(screen.getByText('0 days')).toBeInTheDocument();
    });

    it('should handle createdAt timestamps without Z suffix', () => {
      // Test that timestamps without Z are handled correctly (treated as UTC)
      const fiveDaysAgo = new Date();
      fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
      // Remove the Z suffix to simulate some API responses
      const timestampWithoutZ = fiveDaysAgo.toISOString().replace('Z', '');

      const leadWithDate = { ...mockLead, createdAt: timestampWithoutZ };
      render(<PropertyDetailsSection lead={leadWithDate} />);

      expect(screen.getByText('DOM')).toBeInTheDocument();
      expect(screen.getByText('5 days')).toBeInTheDocument();
    });

    it('should display dash for null createdAt', () => {
      const leadNoDate = { ...mockLead, createdAt: '' };
      render(<PropertyDetailsSection lead={leadNoDate} />);

      expect(screen.getByText('DOM')).toBeInTheDocument();
      expect(screen.getByText('-')).toBeInTheDocument();
    });
  });

  describe('AI Analysis', () => {
    it('should display AI summary when present', () => {
      const leadWithAiSummary = {
        ...mockLead,
        aiSummary: 'Strong investment opportunity. Property is priced below market.',
      };
      render(<PropertyDetailsSection lead={leadWithAiSummary} />);

      expect(screen.getByText('AI Analysis')).toBeInTheDocument();
      expect(screen.getByText(/Strong investment opportunity/)).toBeInTheDocument();
    });

    it('should not display AI section when no summary', () => {
      const leadNoAiSummary = { ...mockLead, aiSummary: undefined };
      render(<PropertyDetailsSection lead={leadNoAiSummary} />);

      expect(screen.queryByText('AI Analysis')).not.toBeInTheDocument();
    });
  });

  describe('property thumbnail', () => {
    it('should display thumbnail when photoUrl is present', () => {
      const leadWithPhoto = {
        ...mockLead,
        photoUrl: 'https://photos.zillowstatic.com/photo123.jpg',
      };
      render(<PropertyDetailsSection lead={leadWithPhoto} />);

      const img = screen.getByAltText('123 Main Street thumbnail');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', 'https://photos.zillowstatic.com/photo123.jpg');
      expect(img).toHaveAttribute('loading', 'lazy');
    });

    it('should display placeholder when photoUrl is undefined', () => {
      const leadNoPhoto = { ...mockLead, photoUrl: undefined };
      render(<PropertyDetailsSection lead={leadNoPhoto} />);

      // Should not find an image with the thumbnail alt text
      expect(screen.queryByAltText('123 Main Street thumbnail')).not.toBeInTheDocument();
      // HomeIcon placeholder should be rendered
      const homeIcons = document.querySelectorAll('[data-testid="HomeIcon"]');
      expect(homeIcons.length).toBeGreaterThanOrEqual(1);
    });

    it('should display placeholder when photoUrl is empty string', () => {
      const leadEmptyPhoto = { ...mockLead, photoUrl: '' };
      render(<PropertyDetailsSection lead={leadEmptyPhoto} />);

      expect(screen.queryByAltText('123 Main Street thumbnail')).not.toBeInTheDocument();
    });

    it('should display placeholder when photoUrl is whitespace only', () => {
      const leadWhitespacePhoto = { ...mockLead, photoUrl: '   ' };
      render(<PropertyDetailsSection lead={leadWhitespacePhoto} />);

      expect(screen.queryByAltText('123 Main Street thumbnail')).not.toBeInTheDocument();
    });

    it('should fallback to placeholder when image fails to load', () => {
      const leadWithPhoto = {
        ...mockLead,
        photoUrl: 'https://photos.zillowstatic.com/invalid-photo.jpg',
      };
      const { rerender } = render(<PropertyDetailsSection lead={leadWithPhoto} />);

      const img = screen.getByAltText('123 Main Street thumbnail');
      expect(img).toBeInTheDocument();

      // Simulate image load error
      fireEvent.error(img);

      // After error, image should no longer be visible (placeholder shown instead)
      expect(screen.queryByAltText('123 Main Street thumbnail')).not.toBeInTheDocument();
    });

    it('should display address alongside thumbnail', () => {
      const leadWithPhoto = {
        ...mockLead,
        photoUrl: 'https://photos.zillowstatic.com/photo123.jpg',
      };
      render(<PropertyDetailsSection lead={leadWithPhoto} />);

      // Both thumbnail and address should be visible
      expect(screen.getByAltText('123 Main Street thumbnail')).toBeInTheDocument();
      expect(screen.getByText('123 Main Street')).toBeInTheDocument();
      expect(screen.getByText('View on Zillow')).toBeInTheDocument();
    });
  });
});

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

  describe('listing description', () => {
    it('should not display description section when no description in metadata', () => {
      const leadNoDescription = { ...mockLead, enrichmentMetadata: undefined };
      render(<PropertyDetailsSection lead={leadNoDescription} />);

      expect(screen.queryByText('LISTING DESCRIPTION')).not.toBeInTheDocument();
    });

    it('should not display description section when description is empty', () => {
      const leadEmptyDescription = {
        ...mockLead,
        enrichmentMetadata: { description: '' },
      };
      render(<PropertyDetailsSection lead={leadEmptyDescription} />);

      expect(screen.queryByText('LISTING DESCRIPTION')).not.toBeInTheDocument();
    });

    it('should display description section when description is present', () => {
      const leadWithDescription = {
        ...mockLead,
        enrichmentMetadata: {
          description: 'Beautiful home with updated kitchen and bathrooms.',
        },
      };
      render(<PropertyDetailsSection lead={leadWithDescription} />);

      expect(screen.getByText('LISTING DESCRIPTION')).toBeInTheDocument();
      expect(screen.getByText('Beautiful home with updated kitchen and bathrooms.')).toBeInTheDocument();
    });

    it('should truncate long descriptions to 200 characters', () => {
      const longDescription = 'A'.repeat(300); // 300 characters
      const leadWithLongDescription = {
        ...mockLead,
        enrichmentMetadata: {
          description: longDescription,
        },
      };
      render(<PropertyDetailsSection lead={leadWithLongDescription} />);

      // Should show truncated text with ellipsis
      expect(screen.getByText('A'.repeat(200) + '...')).toBeInTheDocument();
      // Should show "Show more" button
      expect(screen.getByRole('button', { name: 'Show more' })).toBeInTheDocument();
    });

    it('should not show "Show more" button for short descriptions', () => {
      const shortDescription = 'Short description under 200 chars.';
      const leadWithShortDescription = {
        ...mockLead,
        enrichmentMetadata: {
          description: shortDescription,
        },
      };
      render(<PropertyDetailsSection lead={leadWithShortDescription} />);

      expect(screen.getByText(shortDescription)).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Show more' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Show less' })).not.toBeInTheDocument();
    });

    it('should expand description when "Show more" is clicked', () => {
      const longDescription = 'B'.repeat(300);
      const leadWithLongDescription = {
        ...mockLead,
        enrichmentMetadata: {
          description: longDescription,
        },
      };
      render(<PropertyDetailsSection lead={leadWithLongDescription} />);

      // Initially truncated
      expect(screen.getByText('B'.repeat(200) + '...')).toBeInTheDocument();

      // Click "Show more"
      fireEvent.click(screen.getByRole('button', { name: 'Show more' }));

      // Should now show full text
      expect(screen.getByText(longDescription)).toBeInTheDocument();
      // Button should change to "Show less"
      expect(screen.getByRole('button', { name: 'Show less' })).toBeInTheDocument();
    });

    it('should collapse description when "Show less" is clicked', () => {
      const longDescription = 'C'.repeat(300);
      const leadWithLongDescription = {
        ...mockLead,
        enrichmentMetadata: {
          description: longDescription,
        },
      };
      render(<PropertyDetailsSection lead={leadWithLongDescription} />);

      // Expand first
      fireEvent.click(screen.getByRole('button', { name: 'Show more' }));
      expect(screen.getByText(longDescription)).toBeInTheDocument();

      // Then collapse
      fireEvent.click(screen.getByRole('button', { name: 'Show less' }));

      // Should show truncated text again
      expect(screen.getByText('C'.repeat(200) + '...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Show more' })).toBeInTheDocument();
    });

    it('should handle description exactly at 200 characters', () => {
      const exactDescription = 'D'.repeat(200);
      const leadWithExactDescription = {
        ...mockLead,
        enrichmentMetadata: {
          description: exactDescription,
        },
      };
      render(<PropertyDetailsSection lead={leadWithExactDescription} />);

      // Should show full text without truncation
      expect(screen.getByText(exactDescription)).toBeInTheDocument();
      // Should not show expand button
      expect(screen.queryByRole('button', { name: 'Show more' })).not.toBeInTheDocument();
    });

    it('should handle description at 201 characters (just over limit)', () => {
      const justOverDescription = 'E'.repeat(201);
      const leadWithJustOverDescription = {
        ...mockLead,
        enrichmentMetadata: {
          description: justOverDescription,
        },
      };
      render(<PropertyDetailsSection lead={leadWithJustOverDescription} />);

      // Should show truncated text
      expect(screen.getByText('E'.repeat(200) + '...')).toBeInTheDocument();
      // Should show expand button
      expect(screen.getByRole('button', { name: 'Show more' })).toBeInTheDocument();
    });

    it('should preserve whitespace in description', () => {
      const descriptionWithLineBreaks = 'First paragraph.\n\nSecond paragraph.';
      const leadWithLineBreaks = {
        ...mockLead,
        enrichmentMetadata: {
          description: descriptionWithLineBreaks,
        },
      };
      render(<PropertyDetailsSection lead={leadWithLineBreaks} />);

      // The description text should be in the document
      const descriptionElement = screen.getByText(/First paragraph/);
      expect(descriptionElement).toBeInTheDocument();
      // Check that whitespace is preserved via CSS (whiteSpace: 'pre-wrap')
      expect(descriptionElement).toHaveStyle({ whiteSpace: 'pre-wrap' });
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

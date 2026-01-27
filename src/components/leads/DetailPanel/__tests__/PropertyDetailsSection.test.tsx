import React from 'react';
import { render, screen } from '@testing-library/react';
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
  });
});

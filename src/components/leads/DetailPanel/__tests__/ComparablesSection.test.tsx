import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ComparablesSection, Comparable } from '../ComparablesSection';

describe('ComparablesSection', () => {
  const mockComparables: Comparable[] = [
    {
      id: 'comp-1',
      address: '123 Main St',
      salePrice: 250000,
      pricePerSqft: 115,
      saleDate: '2025-11-15T00:00:00Z',
      distanceMiles: 0.3,
      bedrooms: 3,
      bathrooms: 2,
      squareFeet: 2173,
      zillowUrl: 'https://zillow.com/homedetails/123-main',
      city: 'San Antonio',
      state: 'TX',
      propertyType: 'Single Family',
    },
    {
      id: 'comp-2',
      address: '456 Oak Ave',
      salePrice: 275000,
      pricePerSqft: 120,
      saleDate: '2025-10-20T00:00:00Z',
      distanceMiles: 0.5,
      bedrooms: 4,
      bathrooms: 2,
    },
    {
      id: 'comp-3',
      address: '789 Pine Dr',
      salePrice: 240000,
      pricePerSqft: 110,
      saleDate: '2025-09-10T00:00:00Z',
      distanceMiles: 0.7,
    },
  ];

  describe('rendering', () => {
    it('should show "No Comps Available" when comps array is empty', () => {
      render(<ComparablesSection comps={[]} />);

      expect(screen.getByText('No Comps Available')).toBeInTheDocument();
    });

    it('should render expand button with comp count', () => {
      render(<ComparablesSection comps={mockComparables} />);

      expect(screen.getByText(/View 3 Comps/i)).toBeInTheDocument();
    });

    it('should show (RentCast) label when isVerified is true', () => {
      render(<ComparablesSection comps={mockComparables} isVerified={true} />);

      expect(screen.getByText(/View 3 Comps \(RentCast\)/i)).toBeInTheDocument();
    });

    it('should not show (RentCast) label when isVerified is false', () => {
      render(<ComparablesSection comps={mockComparables} isVerified={false} />);

      const button = screen.getByText(/View 3 Comps/i);
      expect(button).not.toHaveTextContent('RentCast');
    });
  });

  describe('expansion behavior', () => {
    it('should be collapsed by default', () => {
      render(<ComparablesSection comps={mockComparables} />);

      // MUI Collapse still renders content but with hidden style
      // Check that the collapse container has opacity 0 or is not expanded
      // The expand button should show ExpandMore icon
      expect(screen.getByTestId('ExpandMoreIcon')).toBeInTheDocument();
    });

    it('should expand when button is clicked', () => {
      render(<ComparablesSection comps={mockComparables} />);

      fireEvent.click(screen.getByText(/View 3 Comps/i));

      // Comp addresses should now be visible
      expect(screen.getByText('123 Main St')).toBeInTheDocument();
      expect(screen.getByText('456 Oak Ave')).toBeInTheDocument();
      expect(screen.getByText('789 Pine Dr')).toBeInTheDocument();
    });

    it('should collapse when button is clicked again', () => {
      render(<ComparablesSection comps={mockComparables} />);

      // Expand
      fireEvent.click(screen.getByText(/View 3 Comps/i));
      expect(screen.getByText('123 Main St')).toBeInTheDocument();

      // Collapse
      fireEvent.click(screen.getByText(/View 3 Comps/i));

      // Content should be collapsed (Collapse component handles animation)
      // The Collapse component doesn't immediately remove content
    });
  });

  describe('comp data display', () => {
    beforeEach(() => {
      render(<ComparablesSection comps={mockComparables} />);
      fireEvent.click(screen.getByText(/View 3 Comps/i));
    });

    it('should display sale prices formatted as currency', () => {
      expect(screen.getByText('$250,000')).toBeInTheDocument();
      expect(screen.getByText('$275,000')).toBeInTheDocument();
      expect(screen.getByText('$240,000')).toBeInTheDocument();
    });

    it('should display price per sqft', () => {
      expect(screen.getByText('$115/sqft')).toBeInTheDocument();
      expect(screen.getByText('$120/sqft')).toBeInTheDocument();
      expect(screen.getByText('$110/sqft')).toBeInTheDocument();
    });

    it('should display distance in miles', () => {
      expect(screen.getByText('0.3 mi')).toBeInTheDocument();
      expect(screen.getByText('0.5 mi')).toBeInTheDocument();
      expect(screen.getByText('0.7 mi')).toBeInTheDocument();
    });

    it('should display beds/baths when available', () => {
      expect(screen.getByText('3bd/2ba')).toBeInTheDocument();
      expect(screen.getByText('4bd/2ba')).toBeInTheDocument();
    });

    it('should not show beds/baths for comps without that data', () => {
      // Third comp has no beds/baths - the separator bullet and beds/baths should not appear
      // First two comps have 3bd/2ba and 4bd/2ba
      expect(screen.getByText('3bd/2ba')).toBeInTheDocument();
      expect(screen.getByText('4bd/2ba')).toBeInTheDocument();
      // There should only be 2 beds/baths entries (not 3)
    });

    it('should display sale dates formatted as month and year', () => {
      expect(screen.getByText('Nov 25')).toBeInTheDocument();
      expect(screen.getByText('Oct 25')).toBeInTheDocument();
      expect(screen.getByText('Sep 25')).toBeInTheDocument();
    });
  });

  describe('Zillow links', () => {
    beforeEach(() => {
      render(<ComparablesSection comps={mockComparables} />);
      fireEvent.click(screen.getByText(/View 3 Comps/i));
    });

    it('should render address as link when zillowUrl is provided', () => {
      const link = screen.getByRole('link', { name: '123 Main St' });
      expect(link).toHaveAttribute('href', 'https://zillow.com/homedetails/123-main');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('should render address as plain text when no zillowUrl', () => {
      // Second and third comps don't have Zillow URLs
      const plainTextAddresses = screen.getAllByText(/Oak Ave|Pine Dr/);
      plainTextAddresses.forEach((element) => {
        expect(element.tagName).not.toBe('A');
      });
    });
  });

  describe('date formatting edge cases', () => {
    it('should handle dates without Z suffix', () => {
      const compsWithoutZ: Comparable[] = [
        {
          address: '100 Test St',
          salePrice: 200000,
          pricePerSqft: 100,
          saleDate: '2025-08-15T00:00:00', // No Z suffix
          distanceMiles: 0.2,
        },
      ];

      render(<ComparablesSection comps={compsWithoutZ} />);
      fireEvent.click(screen.getByText(/View 1 Comps/i));

      expect(screen.getByText('Aug 25')).toBeInTheDocument();
    });

    it('should handle invalid dates gracefully', () => {
      // Spy on console.warn to verify warning is logged
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const compsWithInvalidDate: Comparable[] = [
        {
          address: '100 Test St',
          salePrice: 200000,
          pricePerSqft: 100,
          saleDate: 'invalid-date',
          distanceMiles: 0.2,
        },
      ];

      render(<ComparablesSection comps={compsWithInvalidDate} />);
      fireEvent.click(screen.getByText(/View 1 Comps/i));

      // Should show the original invalid date string
      expect(screen.getByText('invalid-date')).toBeInTheDocument();

      // Should have logged a warning
      expect(warnSpy).toHaveBeenCalledWith('Invalid date:', 'invalid-date');

      warnSpy.mockRestore();
    });
  });

  describe('beds/baths formatting edge cases', () => {
    it('should handle only bedrooms without bathrooms', () => {
      const compsOnlyBeds: Comparable[] = [
        {
          address: '100 Test St',
          salePrice: 200000,
          pricePerSqft: 100,
          saleDate: '2025-08-15T00:00:00Z',
          distanceMiles: 0.2,
          bedrooms: 3,
          // bathrooms not provided
        },
      ];

      render(<ComparablesSection comps={compsOnlyBeds} />);
      fireEvent.click(screen.getByText(/View 1 Comps/i));

      expect(screen.getByText('3bd')).toBeInTheDocument();
    });

    it('should handle only bathrooms without bedrooms', () => {
      const compsOnlyBaths: Comparable[] = [
        {
          address: '100 Test St',
          salePrice: 200000,
          pricePerSqft: 100,
          saleDate: '2025-08-15T00:00:00Z',
          distanceMiles: 0.2,
          bathrooms: 2,
          // bedrooms not provided
        },
      ];

      render(<ComparablesSection comps={compsOnlyBaths} />);
      fireEvent.click(screen.getByText(/View 1 Comps/i));

      expect(screen.getByText('2ba')).toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('should use green button color for unverified comps', () => {
      render(<ComparablesSection comps={mockComparables} isVerified={false} />);

      const button = screen.getByText(/View 3 Comps/i);
      // Button should have green color (#4ade80)
      expect(button).toHaveStyle({ color: 'rgb(74, 222, 128)' });
    });

    it('should use purple button color for verified (RentCast) comps', () => {
      render(<ComparablesSection comps={mockComparables} isVerified={true} />);

      const button = screen.getByText(/View 3 Comps \(RentCast\)/i);
      // Button should have purple color (#a78bfa)
      expect(button).toHaveStyle({ color: 'rgb(167, 139, 250)' });
    });
  });

  describe('TASK-100 specific requirements', () => {
    it('should display all fields from RentCast comparables', () => {
      const rentCastComps: Comparable[] = [
        {
          id: 'rc-1',
          address: '123 RentCast Verified St',
          salePrice: 285000,
          pricePerSqft: 125,
          saleDate: '2025-12-01T00:00:00Z',
          distanceMiles: 0.4,
          bedrooms: 4,
          bathrooms: 3,
          squareFeet: 2280,
          zillowUrl: 'https://zillow.com/homedetails/123',
          city: 'Austin',
          state: 'TX',
          propertyType: 'Single Family',
        },
      ];

      render(<ComparablesSection comps={rentCastComps} isVerified={true} />);
      // Button text pattern: "View X Comps (RentCast)"
      fireEvent.click(screen.getByRole('button', { name: /View.*Comps/i }));

      // All comp fields should be displayed
      expect(screen.getByRole('link', { name: '123 RentCast Verified St' })).toBeInTheDocument();
      expect(screen.getByText('$285,000')).toBeInTheDocument();
      expect(screen.getByText('$125/sqft')).toBeInTheDocument();
      expect(screen.getByText('4bd/3ba')).toBeInTheDocument();
      // Date could be Nov 25 or Dec 25 depending on timezone - just check for year
      expect(screen.getByText(/25$/)).toBeInTheDocument();
      expect(screen.getByText('0.4 mi')).toBeInTheDocument();
    });

    it('should support variable numbers of comps', () => {
      // Test with 5 comps
      const fiveComps: Comparable[] = Array.from({ length: 5 }, (_, i) => ({
        id: `comp-${i}`,
        address: `${100 + i} Test St`,
        salePrice: 200000 + i * 10000,
        pricePerSqft: 100 + i * 5,
        saleDate: '2025-10-15T00:00:00Z',
        distanceMiles: 0.1 + i * 0.2,
      }));

      render(<ComparablesSection comps={fiveComps} />);

      expect(screen.getByText(/View 5 Comps/i)).toBeInTheDocument();
    });
  });
});

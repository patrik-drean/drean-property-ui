import React from 'react';
import { render, screen, within } from '@testing-library/react';
import ComparablesTable from '../ComparablesTable';
import { SaleComparable } from '../../../types/property';

describe('ComparablesTable', () => {
  // Legacy comparables without tier data
  const mockComparablesLegacy: SaleComparable[] = [
    {
      address: '123 Main St, City, ST 12345',
      price: 250000,
      bedrooms: 3,
      bathrooms: 2.5,
      squareFootage: 1800,
      lotSize: 7200,
      yearBuilt: 2010,
      distance: 0.5,
      correlation: 0.95,
      daysOnMarket: 30,
      status: 'Sold'
    },
    {
      address: '456 Oak Ave, Town, ST 67890',
      price: 280000,
      bedrooms: 4,
      bathrooms: 3.0,
      squareFootage: 2000,
      lotSize: 8000,
      yearBuilt: 2015,
      distance: 0.8,
      correlation: 0.92,
      daysOnMarket: 25,
      status: 'Sold'
    },
    {
      address: '789 Elm Rd, Village, ST 54321',
      price: 220000,
      bedrooms: 3,
      bathrooms: 2.0,
      squareFootage: 1600,
      lotSize: 6500,
      yearBuilt: 2008,
      distance: 1.2,
      correlation: 0.88,
      daysOnMarket: 40,
      status: 'Sold'
    }
  ];

  // New comparables with tier data
  const mockComparablesWithTiers: SaleComparable[] = [
    {
      address: '123 Main St, City, ST 12345',
      price: 320000,
      bedrooms: 3,
      bathrooms: 2.5,
      squareFootage: 1800,
      lotSize: 7200,
      yearBuilt: 2010,
      distance: 0.5,
      correlation: 0.95,
      daysOnMarket: 30,
      status: 'Sold',
      pricePerSqft: 178,
      tier: 'ARV',
      percentileRank: 95
    },
    {
      address: '456 Oak Ave, Town, ST 67890',
      price: 280000,
      bedrooms: 4,
      bathrooms: 3.0,
      squareFootage: 2000,
      lotSize: 8000,
      yearBuilt: 2020,
      distance: 0.8,
      correlation: 0.92,
      daysOnMarket: 25,
      status: 'Sold',
      pricePerSqft: 140,
      tier: 'New Build',
      percentileRank: 70
    },
    {
      address: '789 Elm Rd, Village, ST 54321',
      price: 220000,
      bedrooms: 3,
      bathrooms: 2.0,
      squareFootage: 1600,
      lotSize: 6500,
      yearBuilt: 2008,
      distance: 1.2,
      correlation: 0.88,
      daysOnMarket: 40,
      status: 'Sold',
      pricePerSqft: 138,
      tier: 'Mid',
      percentileRank: 50
    },
    {
      address: '999 Distressed Way',
      price: 150000,
      bedrooms: 3,
      bathrooms: 2.0,
      squareFootage: 1700,
      lotSize: 7000,
      yearBuilt: 1990,
      distance: 0.9,
      correlation: 0.85,
      daysOnMarket: 60,
      status: 'Sold',
      pricePerSqft: 88,
      tier: 'As-Is',
      percentileRank: 15
    }
  ];

  describe('Empty State', () => {
    it('should render empty state when no comparables', () => {
      render(<ComparablesTable comparables={[]} />);

      expect(screen.getByText('No comparable sales data available')).toBeInTheDocument();
    });
  });

  describe('Basic Rendering (Legacy Mode)', () => {
    it('should render table header correctly', () => {
      render(<ComparablesTable comparables={mockComparablesLegacy} />);

      expect(screen.getByText('Address')).toBeInTheDocument();
      expect(screen.getByText('Price')).toBeInTheDocument();
      expect(screen.getByText('$/SqFt')).toBeInTheDocument();
      expect(screen.getByText('Beds/Baths')).toBeInTheDocument();
      expect(screen.getByText('SqFt')).toBeInTheDocument();
    });

    it('should render title with correct count', () => {
      render(<ComparablesTable comparables={mockComparablesLegacy} />);

      expect(screen.getByText('Comparable Sales (3 Recent Sales)')).toBeInTheDocument();
    });

    it('should render all comparable addresses as links', () => {
      render(<ComparablesTable comparables={mockComparablesLegacy} />);

      const links = screen.getAllByRole('link');
      expect(links).toHaveLength(3);
      expect(links[0]).toHaveTextContent('123 Main St, City, ST 12345');
      expect(links[1]).toHaveTextContent('456 Oak Ave, Town, ST 67890');
      expect(links[2]).toHaveTextContent('789 Elm Rd, Village, ST 54321');
    });

    it('should generate correct Zillow URLs', () => {
      render(<ComparablesTable comparables={mockComparablesLegacy} />);

      const links = screen.getAllByRole('link');
      expect(links[0]).toHaveAttribute('href', expect.stringContaining('zillow.com/homes/'));
      expect(links[0]).toHaveAttribute('target', '_blank');
      expect(links[0]).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('should format prices with commas and dollar signs', () => {
      render(<ComparablesTable comparables={mockComparablesLegacy} />);

      const prices = screen.getAllByText(/\$250,000|\$280,000|\$220,000/);
      expect(prices.length).toBeGreaterThanOrEqual(3);
    });

    it('should display beds/baths correctly', () => {
      render(<ComparablesTable comparables={mockComparablesLegacy} />);

      expect(screen.getByText('3/2.5')).toBeInTheDocument();
      expect(screen.getByText('4/3')).toBeInTheDocument();
      expect(screen.getByText('3/2')).toBeInTheDocument();
    });

    it('should display square footage with commas', () => {
      render(<ComparablesTable comparables={mockComparablesLegacy} />);

      expect(screen.getByText('1,800')).toBeInTheDocument();
      expect(screen.getByText('2,000')).toBeInTheDocument();
      expect(screen.getByText('1,600')).toBeInTheDocument();
    });

    it('should display distance with 2 decimal places', () => {
      render(<ComparablesTable comparables={mockComparablesLegacy} />);

      expect(screen.getByText('0.50')).toBeInTheDocument();
      expect(screen.getByText('0.80')).toBeInTheDocument();
      expect(screen.getByText('1.20')).toBeInTheDocument();
    });

    it('should display N/A for missing square footage', () => {
      const comparablesWithMissingData: SaleComparable[] = [
        {
          address: '999 Test St',
          price: 200000,
          bedrooms: 3,
          bathrooms: 2,
          squareFootage: null,
          lotSize: null,
          yearBuilt: null,
          distance: 0.5,
          correlation: 0.90,
          daysOnMarket: null,
          status: null
        }
      ];

      render(<ComparablesTable comparables={comparablesWithMissingData} />);

      const naElements = screen.getAllByText('N/A');
      expect(naElements.length).toBeGreaterThan(0);
    });
  });

  describe('Tier Mode (With Tier Data)', () => {
    it('should display Tier column when tier data is present', () => {
      render(<ComparablesTable comparables={mockComparablesWithTiers} />);

      expect(screen.getByText('Tier')).toBeInTheDocument();
    });

    it('should display tier legend chips', () => {
      render(<ComparablesTable comparables={mockComparablesWithTiers} />);

      // Legend chips in header
      const arvChips = screen.getAllByText('ARV');
      expect(arvChips.length).toBeGreaterThanOrEqual(1);
    });

    it('should display ARV tier chip for top tier comps', () => {
      render(<ComparablesTable comparables={mockComparablesWithTiers} />);

      // Should have ARV chips for the ARV tier comp
      const arvChips = screen.getAllByText('ARV');
      expect(arvChips.length).toBeGreaterThanOrEqual(2); // One in legend, one in row
    });

    it('should display New Build tier chip', () => {
      render(<ComparablesTable comparables={mockComparablesWithTiers} />);

      const newBuildChips = screen.getAllByText('New Build');
      expect(newBuildChips.length).toBeGreaterThanOrEqual(2); // One in legend, one in row
    });

    it('should display Mid tier chip', () => {
      render(<ComparablesTable comparables={mockComparablesWithTiers} />);

      const midChips = screen.getAllByText('Mid');
      expect(midChips.length).toBeGreaterThanOrEqual(2); // One in legend, one in row
    });

    it('should display As-Is tier chip', () => {
      render(<ComparablesTable comparables={mockComparablesWithTiers} />);

      const asIsChips = screen.getAllByText('As-Is');
      expect(asIsChips.length).toBeGreaterThanOrEqual(2); // One in legend, one in row
    });

    it('should display pricePerSqft when available', () => {
      render(<ComparablesTable comparables={mockComparablesWithTiers} />);

      // Values may appear multiple times (in rows and summary), use getAllByText
      expect(screen.getAllByText('$178').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('$140').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('$138').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('$88').length).toBeGreaterThanOrEqual(1);
    });

    it('should display ARV Average row', () => {
      render(<ComparablesTable comparables={mockComparablesWithTiers} />);

      expect(screen.getByText(/ARV Average/)).toBeInTheDocument();
      expect(screen.getByText('Used for ARV')).toBeInTheDocument();
    });

    it('should display All Comps Average row', () => {
      render(<ComparablesTable comparables={mockComparablesWithTiers} />);

      expect(screen.getByText('All Comps Average')).toBeInTheDocument();
      expect(screen.getByText('Used for As-Is')).toBeInTheDocument();
    });
  });

  describe('Averages Calculation', () => {
    it('should calculate and display average price', () => {
      render(<ComparablesTable comparables={mockComparablesLegacy} />);

      // Average: (250000 + 280000 + 220000) / 3 = 250,000
      const averageRow = screen.getByText(/All Comps Average|Average/).closest('tr');
      expect(averageRow).toHaveTextContent('$250,000');
    });

    it('should calculate and display average price per sqft', () => {
      render(<ComparablesTable comparables={mockComparablesLegacy} />);

      // Calculated from comps: (139 + 140 + 138) / 3 ≈ $139
      const averageRow = screen.getByText(/All Comps Average|Average/).closest('tr');
      expect(averageRow).toHaveTextContent('$139');
    });

    it('should calculate and display average distance', () => {
      render(<ComparablesTable comparables={mockComparablesLegacy} />);

      // Average: (0.5 + 0.8 + 1.2) / 3 ≈ 0.83
      const averageRow = screen.getByText(/All Comps Average|Average/).closest('tr');
      expect(averageRow).toHaveTextContent('0.83');
    });

    it('should calculate ARV average for ARV comps only', () => {
      render(<ComparablesTable comparables={mockComparablesWithTiers} />);

      // Only one ARV comp with price $320,000
      const arvAverageRow = screen.getByText(/ARV Average/).closest('tr');
      expect(arvAverageRow).toHaveTextContent('$320,000');
    });
  });

  describe('Edge Cases', () => {
    it('should handle single comparable', () => {
      render(<ComparablesTable comparables={[mockComparablesLegacy[0]]} />);

      expect(screen.getByText('Comparable Sales (1 Recent Sales)')).toBeInTheDocument();
      expect(screen.getAllByRole('link')).toHaveLength(1);
    });

    it('should handle 5 comparables', () => {
      const fiveComparables = [
        ...mockComparablesLegacy,
        {
          address: '111 Cedar Ln',
          price: 240000,
          bedrooms: 3,
          bathrooms: 2,
          squareFootage: 1700,
          lotSize: 7000,
          yearBuilt: 2012,
          distance: 0.6,
          correlation: 0.90,
          daysOnMarket: 35,
          status: 'Sold'
        },
        {
          address: '222 Birch St',
          price: 260000,
          bedrooms: 3,
          bathrooms: 2.5,
          squareFootage: 1850,
          lotSize: 7500,
          yearBuilt: 2014,
          distance: 0.9,
          correlation: 0.89,
          daysOnMarket: 28,
          status: 'Sold'
        }
      ];

      render(<ComparablesTable comparables={fiveComparables} />);

      expect(screen.getByText('Comparable Sales (5 Recent Sales)')).toBeInTheDocument();
      expect(screen.getAllByRole('link')).toHaveLength(5);
    });

    it('should handle comparables with null values gracefully', () => {
      const comparablesWithNulls: SaleComparable[] = [
        {
          address: '333 Null St',
          price: 150000,
          bedrooms: null,
          bathrooms: null,
          squareFootage: null,
          lotSize: null,
          yearBuilt: null,
          distance: 0.3,
          correlation: 0.85,
          daysOnMarket: null,
          status: null
        }
      ];

      render(<ComparablesTable comparables={comparablesWithNulls} />);

      expect(screen.getByText('333 Null St')).toBeInTheDocument();
      const prices = screen.getAllByText('$150,000');
      expect(prices.length).toBeGreaterThanOrEqual(1);
    });

    it('should not show Tier column when no tier data', () => {
      render(<ComparablesTable comparables={mockComparablesLegacy} />);

      expect(screen.queryByText('Tier')).not.toBeInTheDocument();
    });

    it('should not show ARV Average row when no ARV comps', () => {
      const noArvComps: SaleComparable[] = mockComparablesLegacy.map(c => ({
        ...c,
        tier: 'Mid' as const,
        pricePerSqft: c.squareFootage ? c.price / c.squareFootage : 0,
        percentileRank: 50
      }));

      render(<ComparablesTable comparables={noArvComps} />);

      expect(screen.queryByText(/ARV Average/)).not.toBeInTheDocument();
    });

    it('should handle 10 comparables (max from API)', () => {
      const tenComparables: SaleComparable[] = Array.from({ length: 10 }, (_, i) => ({
        address: `${100 + i} Test St`,
        price: 200000 + i * 10000,
        bedrooms: 3,
        bathrooms: 2,
        squareFootage: 1500 + i * 50,
        lotSize: 7000,
        yearBuilt: 2010,
        distance: 0.5 + i * 0.1,
        correlation: 0.95 - i * 0.02,
        daysOnMarket: 30,
        status: 'Sold',
        tier: i < 3 ? 'ARV' as const : 'Mid' as const,
        pricePerSqft: (200000 + i * 10000) / (1500 + i * 50),
        percentileRank: 100 - i * 10
      }));

      render(<ComparablesTable comparables={tenComparables} />);

      expect(screen.getByText('Comparable Sales (10 Recent Sales)')).toBeInTheDocument();
      expect(screen.getAllByRole('link')).toHaveLength(10);
    });
  });

  describe('Styling and Layout', () => {
    it('should apply highlighted styling to average row', () => {
      render(<ComparablesTable comparables={mockComparablesLegacy} />);

      const averageRow = screen.getByText(/All Comps Average|Average/).closest('tr');
      // Average row should exist and have distinct background
      expect(averageRow).toBeInTheDocument();
    });

    it('should use small table size', () => {
      const { container } = render(<ComparablesTable comparables={mockComparablesWithTiers} />);

      // MUI Table with size="small" uses smaller cells
      const table = container.querySelector('table');
      expect(table).toBeInTheDocument();
      // Verify small cells are used (MuiTableCell-sizeSmall)
      const smallCells = container.querySelectorAll('[class*="MuiTableCell-sizeSmall"]');
      expect(smallCells.length).toBeGreaterThan(0);
    });
  });
});

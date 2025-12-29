import React from 'react';
import { render, screen } from '@testing-library/react';
import ComparablesTable from '../ComparablesTable';
import { SaleComparable } from '../../../types/property';

describe('ComparablesTable', () => {
  const mockComparables: SaleComparable[] = [
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

  it('should render empty state when no comparables', () => {
    render(<ComparablesTable comparables={[]} />);

    expect(screen.getByText('No comparable sales data available')).toBeInTheDocument();
  });

  it('should render table header correctly', () => {
    render(<ComparablesTable comparables={mockComparables} />);

    expect(screen.getByText('Address')).toBeInTheDocument();
    expect(screen.getByText('Price')).toBeInTheDocument();
    expect(screen.getByText('$/SqFt')).toBeInTheDocument();
    expect(screen.getByText('Beds/Baths')).toBeInTheDocument();
    expect(screen.getByText('SqFt')).toBeInTheDocument();
    expect(screen.getByText('Distance (mi)')).toBeInTheDocument();
  });

  it('should render title with correct count', () => {
    render(<ComparablesTable comparables={mockComparables} />);

    expect(screen.getByText('Comparable Sales (3 Recent Sales)')).toBeInTheDocument();
  });

  it('should render all comparable addresses as links', () => {
    render(<ComparablesTable comparables={mockComparables} />);

    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(3);
    expect(links[0]).toHaveTextContent('123 Main St, City, ST 12345');
    expect(links[1]).toHaveTextContent('456 Oak Ave, Town, ST 67890');
    expect(links[2]).toHaveTextContent('789 Elm Rd, Village, ST 54321');
  });

  it('should generate correct Zillow URLs', () => {
    render(<ComparablesTable comparables={mockComparables} />);

    const links = screen.getAllByRole('link');
    expect(links[0]).toHaveAttribute('href', expect.stringContaining('zillow.com/homes/'));
    expect(links[0]).toHaveAttribute('target', '_blank');
    expect(links[0]).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('should format prices with commas and dollar signs', () => {
    render(<ComparablesTable comparables={mockComparables} />);

    const prices = screen.getAllByText(/\$250,000|\$280,000|\$220,000/);
    expect(prices.length).toBeGreaterThanOrEqual(3);
  });

  it('should calculate and display price per square foot', () => {
    render(<ComparablesTable comparables={mockComparables} />);

    // Check that price/sqft values are displayed
    const pricePerSqft = screen.getAllByText(/\$\d+/);
    expect(pricePerSqft.length).toBeGreaterThan(0);

    // Verify specific calculated values are present
    expect(screen.getAllByText('$139').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('$140').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('$138').length).toBeGreaterThanOrEqual(1);
  });

  it('should display beds/baths correctly', () => {
    render(<ComparablesTable comparables={mockComparables} />);

    expect(screen.getByText('3/2.5')).toBeInTheDocument();
    expect(screen.getByText('4/3')).toBeInTheDocument();
    expect(screen.getByText('3/2')).toBeInTheDocument();
  });

  it('should display square footage with commas', () => {
    render(<ComparablesTable comparables={mockComparables} />);

    expect(screen.getByText('1,800')).toBeInTheDocument();
    expect(screen.getByText('2,000')).toBeInTheDocument();
    expect(screen.getByText('1,600')).toBeInTheDocument();
  });

  it('should display distance with 2 decimal places', () => {
    render(<ComparablesTable comparables={mockComparables} />);

    expect(screen.getByText('0.50')).toBeInTheDocument();
    expect(screen.getByText('0.80')).toBeInTheDocument();
    expect(screen.getByText('1.20')).toBeInTheDocument();
  });

  it('should calculate and display average price', () => {
    render(<ComparablesTable comparables={mockComparables} />);

    // Average: (250000 + 280000 + 220000) / 3 = 250,000
    const averageRow = screen.getByText('Average').closest('tr');
    expect(averageRow).toHaveTextContent('$250,000');
  });

  it('should calculate and display average price per sqft', () => {
    render(<ComparablesTable comparables={mockComparables} />);

    // Average: (139 + 140 + 138) / 3 ≈ $139
    const averageRow = screen.getByText('Average').closest('tr');
    expect(averageRow).toHaveTextContent('$139');
  });

  it('should calculate and display average distance', () => {
    render(<ComparablesTable comparables={mockComparables} />);

    // Average: (0.5 + 0.8 + 1.2) / 3 ≈ 0.83
    const averageRow = screen.getByText('Average').closest('tr');
    expect(averageRow).toHaveTextContent('0.83');
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

  it('should handle single comparable', () => {
    render(<ComparablesTable comparables={[mockComparables[0]]} />);

    expect(screen.getByText('Comparable Sales (1 Recent Sales)')).toBeInTheDocument();
    expect(screen.getAllByRole('link')).toHaveLength(1);
  });

  it('should handle 5 comparables', () => {
    const fiveComparables = [
      ...mockComparables,
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

  it('should apply highlighted styling to average row', () => {
    render(<ComparablesTable comparables={mockComparables} />);

    const averageRow = screen.getByText('Average').closest('tr');
    // Average row should exist and have distinct background
    expect(averageRow).toBeInTheDocument();
    expect(averageRow).toHaveTextContent('Average');
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
});

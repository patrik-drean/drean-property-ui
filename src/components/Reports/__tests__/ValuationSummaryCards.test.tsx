import React from 'react';
import { render, screen } from '@testing-library/react';
import ValuationSummaryCards from '../ValuationSummaryCards';
import { RentCastEstimates } from '../../../types/property';

describe('ValuationSummaryCards', () => {
  const mockRentCastEstimates: RentCastEstimates = {
    price: 250000,
    priceLow: 230000,
    priceHigh: 270000,
    rent: 1800,
    rentLow: 1650,
    rentHigh: 1950
  };

  it('should render ARV (Price) card', () => {
    render(<ValuationSummaryCards rentCastEstimates={mockRentCastEstimates} />);

    expect(screen.getByText(/After Repair Value/)).toBeInTheDocument();
  });

  it('should render Rent Estimate card', () => {
    render(<ValuationSummaryCards rentCastEstimates={mockRentCastEstimates} />);

    expect(screen.getByText(/Monthly Rent Estimate/)).toBeInTheDocument();
  });

  it('should display ARV price correctly formatted', () => {
    render(<ValuationSummaryCards rentCastEstimates={mockRentCastEstimates} />);

    expect(screen.getByText('$250,000')).toBeInTheDocument();
  });

  it('should display rent correctly formatted', () => {
    render(<ValuationSummaryCards rentCastEstimates={mockRentCastEstimates} />);

    expect(screen.getByText('$1,800/month')).toBeInTheDocument();
  });

  it('should display ARV low and high range', () => {
    render(<ValuationSummaryCards rentCastEstimates={mockRentCastEstimates} />);

    expect(screen.getByText(/Low: \$230,000/)).toBeInTheDocument();
    expect(screen.getByText(/High: \$270,000/)).toBeInTheDocument();
  });

  it('should display rent low and high range', () => {
    render(<ValuationSummaryCards rentCastEstimates={mockRentCastEstimates} />);

    expect(screen.getByText(/Low: \$1,650/)).toBeInTheDocument();
    expect(screen.getByText(/High: \$1,950/)).toBeInTheDocument();
  });

  it('should render two cards side by side', () => {
    const { container } = render(<ValuationSummaryCards rentCastEstimates={mockRentCastEstimates} />);

    const papers = container.querySelectorAll('.MuiPaper-root');
    expect(papers.length).toBe(2);
  });

  it('should handle zero values', () => {
    const zeroEstimates: RentCastEstimates = {
      price: 0,
      priceLow: 0,
      priceHigh: 0,
      rent: 0,
      rentLow: 0,
      rentHigh: 0
    };

    render(<ValuationSummaryCards rentCastEstimates={zeroEstimates} />);

    expect(screen.getByText('$0')).toBeInTheDocument();
  });

  it('should handle large numbers correctly', () => {
    const largeEstimates: RentCastEstimates = {
      price: 1500000,
      priceLow: 1400000,
      priceHigh: 1600000,
      rent: 5000,
      rentLow: 4500,
      rentHigh: 5500
    };

    render(<ValuationSummaryCards rentCastEstimates={largeEstimates} />);

    expect(screen.getByText('$1,500,000')).toBeInTheDocument();
    expect(screen.getByText('$5,000/month')).toBeInTheDocument();
  });

  it('should display range with proper formatting', () => {
    render(<ValuationSummaryCards rentCastEstimates={mockRentCastEstimates} />);

    // Check that low and high are displayed
    expect(screen.getByText(/Low: \$230,000/)).toBeInTheDocument();
    expect(screen.getByText(/High: \$270,000/)).toBeInTheDocument();
    expect(screen.getByText(/Low: \$1,650/)).toBeInTheDocument();
    expect(screen.getByText(/High: \$1,950/)).toBeInTheDocument();
  });

  it('should handle decimal rent values', () => {
    const decimalEstimates: RentCastEstimates = {
      price: 250000,
      priceLow: 230000,
      priceHigh: 270000,
      rent: 1850.50,
      rentLow: 1700.25,
      rentHigh: 2000.75
    };

    render(<ValuationSummaryCards rentCastEstimates={decimalEstimates} />);

    // Numbers should be formatted (may be rounded)
    expect(screen.getByText(/\$1,850/)).toBeInTheDocument();
  });

  it('should render ARV card before rent card', () => {
    const { container } = render(<ValuationSummaryCards rentCastEstimates={mockRentCastEstimates} />);

    const papers = container.querySelectorAll('.MuiPaper-root');
    const firstCard = papers[0];
    const secondCard = papers[1];

    expect(firstCard).toHaveTextContent('After Repair Value');
    expect(secondCard).toHaveTextContent('Monthly Rent Estimate');
  });

  it('should have proper visual hierarchy with typography variants', () => {
    const { container } = render(<ValuationSummaryCards rentCastEstimates={mockRentCastEstimates} />);

    // Check for Typography components with proper variants
    const h4Elements = container.querySelectorAll('.MuiTypography-h4');
    expect(h4Elements.length).toBeGreaterThan(0);
  });

  it('should handle negative low values gracefully', () => {
    const negativeEstimates: RentCastEstimates = {
      price: 250000,
      priceLow: -10000, // Invalid but should handle
      priceHigh: 270000,
      rent: 1800,
      rentLow: -100,
      rentHigh: 1950
    };

    render(<ValuationSummaryCards rentCastEstimates={negativeEstimates} />);

    // Should render without crashing
    expect(screen.getByText('$250,000')).toBeInTheDocument();
  });

  it('should handle when low > high (invalid data)', () => {
    const invalidEstimates: RentCastEstimates = {
      price: 250000,
      priceLow: 270000, // Higher than priceHigh
      priceHigh: 230000, // Lower than priceLow
      rent: 1800,
      rentLow: 1950,
      rentHigh: 1650
    };

    render(<ValuationSummaryCards rentCastEstimates={invalidEstimates} />);

    // Should still render the values as provided
    expect(screen.getByText('$250,000')).toBeInTheDocument();
    expect(screen.getByText('$1,800/month')).toBeInTheDocument();
  });
});

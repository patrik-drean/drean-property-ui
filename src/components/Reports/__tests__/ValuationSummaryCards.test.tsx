import React from 'react';
import { render, screen } from '@testing-library/react';
import ValuationSummaryCards from '../ValuationSummaryCards';
import { RentCastEstimates, SaleComparable } from '../../../types/property';

describe('ValuationSummaryCards', () => {
  // Backward-compatible mode: no ARV data
  const mockRentCastEstimatesLegacy: RentCastEstimates = {
    price: 250000,
    priceLow: 230000,
    priceHigh: 270000,
    rent: 1800,
    rentLow: 1650,
    rentHigh: 1950
  };

  // New dual-estimate mode: with ARV data
  const mockRentCastEstimatesWithARV: RentCastEstimates = {
    price: 250000,
    priceLow: 230000,
    priceHigh: 270000,
    rent: 1800,
    rentLow: 1650,
    rentHigh: 1950,
    arv: 285000,
    arvPerSqft: 190,
    asIsValue: 245000,
    asIsValuePerSqft: 163,
    arvConfidence: 85,
    arvCompsUsed: 3
  };

  const mockComparables: SaleComparable[] = [
    {
      address: '123 Main St',
      price: 280000,
      bedrooms: 3,
      bathrooms: 2,
      squareFootage: 1500,
      lotSize: 7000,
      yearBuilt: 2015,
      distance: 0.5,
      correlation: 0.92,
      daysOnMarket: 30,
      status: 'Sold',
      pricePerSqft: 187,
      tier: 'ARV',
      percentileRank: 90
    },
    {
      address: '456 Oak Ave',
      price: 250000,
      bedrooms: 3,
      bathrooms: 2,
      squareFootage: 1600,
      lotSize: 6500,
      yearBuilt: 2010,
      distance: 0.8,
      correlation: 0.88,
      daysOnMarket: 45,
      status: 'Sold',
      pricePerSqft: 156,
      tier: 'Mid',
      percentileRank: 50
    }
  ];

  describe('Backward Compatible Mode (No ARV Data)', () => {
    it('should render Sales Comps card when no ARV data', () => {
      render(<ValuationSummaryCards rentCastEstimates={mockRentCastEstimatesLegacy} />);

      expect(screen.getByText('Sales Comps')).toBeInTheDocument();
    });

    it('should render Rent Comps card when no ARV data', () => {
      render(<ValuationSummaryCards rentCastEstimates={mockRentCastEstimatesLegacy} />);

      expect(screen.getByText('Rent Comps')).toBeInTheDocument();
    });

    it('should display price correctly formatted', () => {
      render(<ValuationSummaryCards rentCastEstimates={mockRentCastEstimatesLegacy} />);

      expect(screen.getByText('$250,000')).toBeInTheDocument();
    });

    it('should display rent correctly formatted', () => {
      render(<ValuationSummaryCards rentCastEstimates={mockRentCastEstimatesLegacy} />);

      expect(screen.getByText('$1,800/month')).toBeInTheDocument();
    });

    it('should display price low and high range', () => {
      render(<ValuationSummaryCards rentCastEstimates={mockRentCastEstimatesLegacy} />);

      expect(screen.getByText(/Low: \$230,000/)).toBeInTheDocument();
      expect(screen.getByText(/High: \$270,000/)).toBeInTheDocument();
    });

    it('should display rent low and high range', () => {
      render(<ValuationSummaryCards rentCastEstimates={mockRentCastEstimatesLegacy} />);

      expect(screen.getByText(/Low: \$1,650/)).toBeInTheDocument();
      expect(screen.getByText(/High: \$1,950/)).toBeInTheDocument();
    });

    it('should render two cards side by side when no ARV data', () => {
      const { container } = render(<ValuationSummaryCards rentCastEstimates={mockRentCastEstimatesLegacy} />);

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
  });

  describe('Dual Estimate Mode (With ARV Data)', () => {
    it('should render As-Is Value card when ARV data present', () => {
      render(<ValuationSummaryCards rentCastEstimates={mockRentCastEstimatesWithARV} comparables={mockComparables} />);

      expect(screen.getByText('As-Is Value')).toBeInTheDocument();
    });

    it('should render ARV card when ARV data present', () => {
      render(<ValuationSummaryCards rentCastEstimates={mockRentCastEstimatesWithARV} comparables={mockComparables} />);

      expect(screen.getByText('ARV (After Repair Value)')).toBeInTheDocument();
    });

    it('should render Rent Estimate card when ARV data present', () => {
      render(<ValuationSummaryCards rentCastEstimates={mockRentCastEstimatesWithARV} comparables={mockComparables} />);

      expect(screen.getByText('Rent Estimate')).toBeInTheDocument();
    });

    it('should display ARV value correctly', () => {
      render(<ValuationSummaryCards rentCastEstimates={mockRentCastEstimatesWithARV} comparables={mockComparables} />);

      expect(screen.getByText('$285,000')).toBeInTheDocument();
    });

    it('should display As-Is value correctly', () => {
      render(<ValuationSummaryCards rentCastEstimates={mockRentCastEstimatesWithARV} comparables={mockComparables} />);

      expect(screen.getByText('$245,000')).toBeInTheDocument();
    });

    it('should display ARV per sqft', () => {
      render(<ValuationSummaryCards rentCastEstimates={mockRentCastEstimatesWithARV} comparables={mockComparables} />);

      expect(screen.getByText('$190/sqft')).toBeInTheDocument();
    });

    it('should display As-Is per sqft', () => {
      render(<ValuationSummaryCards rentCastEstimates={mockRentCastEstimatesWithARV} comparables={mockComparables} />);

      expect(screen.getByText('$163/sqft')).toBeInTheDocument();
    });

    it('should display confidence indicator', () => {
      render(<ValuationSummaryCards rentCastEstimates={mockRentCastEstimatesWithARV} comparables={mockComparables} />);

      expect(screen.getByText('85% conf')).toBeInTheDocument();
    });

    it('should display ARV comps used count', () => {
      render(<ValuationSummaryCards rentCastEstimates={mockRentCastEstimatesWithARV} comparables={mockComparables} />);

      expect(screen.getByText(/Based on top 3 renovated comps/)).toBeInTheDocument();
    });

    it('should display total comps count', () => {
      render(<ValuationSummaryCards rentCastEstimates={mockRentCastEstimatesWithARV} comparables={mockComparables} />);

      expect(screen.getByText(/Based on all 2 comps/)).toBeInTheDocument();
    });

    it('should render three cards when ARV data present', () => {
      const { container } = render(<ValuationSummaryCards rentCastEstimates={mockRentCastEstimatesWithARV} comparables={mockComparables} />);

      const papers = container.querySelectorAll('.MuiPaper-root');
      expect(papers.length).toBe(3);
    });

    it('should display rent in dual estimate mode', () => {
      render(<ValuationSummaryCards rentCastEstimates={mockRentCastEstimatesWithARV} comparables={mockComparables} />);

      expect(screen.getByText('$1,800/mo')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle large ARV values', () => {
      const largeEstimates: RentCastEstimates = {
        price: 1500000,
        priceLow: 1400000,
        priceHigh: 1600000,
        rent: 5000,
        rentLow: 4500,
        rentHigh: 5500,
        arv: 1750000,
        arvPerSqft: 350,
        asIsValue: 1450000,
        asIsValuePerSqft: 290,
        arvConfidence: 92,
        arvCompsUsed: 4
      };

      render(<ValuationSummaryCards rentCastEstimates={largeEstimates} />);

      expect(screen.getByText('$1,750,000')).toBeInTheDocument();
      expect(screen.getByText('$1,450,000')).toBeInTheDocument();
    });

    it('should handle zero ARV confidence', () => {
      const lowConfidence: RentCastEstimates = {
        price: 250000,
        priceLow: 230000,
        priceHigh: 270000,
        rent: 1800,
        rentLow: 1650,
        rentHigh: 1950,
        arv: 280000,
        arvPerSqft: 175,
        asIsValue: 240000,
        asIsValuePerSqft: 150,
        arvConfidence: 0,
        arvCompsUsed: 1
      };

      render(<ValuationSummaryCards rentCastEstimates={lowConfidence} />);

      expect(screen.getByText('0% conf')).toBeInTheDocument();
    });

    it('should handle missing comparables array', () => {
      render(<ValuationSummaryCards rentCastEstimates={mockRentCastEstimatesWithARV} />);

      // Should still render ARV mode since ARV data exists
      expect(screen.getByText('ARV (After Repair Value)')).toBeInTheDocument();
      // But comps count will be 0
      expect(screen.getByText(/Based on all 0 comps/)).toBeInTheDocument();
    });

    it('should handle ARV = 0 and AsIs > 0 (should show dual mode)', () => {
      const onlyAsIs: RentCastEstimates = {
        price: 250000,
        priceLow: 230000,
        priceHigh: 270000,
        rent: 1800,
        rentLow: 1650,
        rentHigh: 1950,
        arv: 0,
        arvPerSqft: 0,
        asIsValue: 240000,
        asIsValuePerSqft: 150,
        arvConfidence: 50,
        arvCompsUsed: 0
      };

      render(<ValuationSummaryCards rentCastEstimates={onlyAsIs} />);

      expect(screen.getByText('As-Is Value')).toBeInTheDocument();
    });

    it('should display progress bar for confidence', () => {
      const { container } = render(<ValuationSummaryCards rentCastEstimates={mockRentCastEstimatesWithARV} comparables={mockComparables} />);

      const progressBar = container.querySelector('.MuiLinearProgress-root');
      expect(progressBar).toBeInTheDocument();
    });
  });
});

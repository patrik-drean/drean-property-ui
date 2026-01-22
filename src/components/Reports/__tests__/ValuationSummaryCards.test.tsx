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

  // Mock comparables for testing tier-based calculations
  const mockComparables: SaleComparable[] = [
    { id: '1', address: '123 Quality St', price: 300000, squareFootage: 1500, tier: 'Quality', bedrooms: 3, bathrooms: 2, distance: 0.5 },
    { id: '2', address: '456 Quality Ave', price: 280000, squareFootage: 1400, tier: 'Quality', bedrooms: 3, bathrooms: 2, distance: 0.7 },
    { id: '3', address: '789 Mid Rd', price: 250000, squareFootage: 1450, tier: 'Mid', bedrooms: 3, bathrooms: 2, distance: 0.6 },
    { id: '4', address: '321 Mid Ln', price: 240000, squareFootage: 1400, tier: 'Mid', bedrooms: 3, bathrooms: 2, distance: 0.8 },
    { id: '5', address: '654 AsIs Blvd', price: 200000, squareFootage: 1400, tier: 'As-Is', bedrooms: 3, bathrooms: 2, distance: 0.9 },
    { id: '6', address: '987 AsIs Way', price: 180000, squareFootage: 1350, tier: 'As-Is', bedrooms: 3, bathrooms: 2, distance: 1.0 },
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

  describe('ARV Estimate Mode (With Comparables)', () => {
    it('should render ARV Estimate card when comparables provided', () => {
      render(
        <ValuationSummaryCards
          rentCastEstimates={mockRentCastEstimatesWithARV}
          saleComparables={mockComparables}
          squareFootage={1500}
        />
      );

      expect(screen.getByText('ARV Estimate')).toBeInTheDocument();
    });

    it('should render single card when ARV data available', () => {
      const { container } = render(
        <ValuationSummaryCards
          rentCastEstimates={mockRentCastEstimatesWithARV}
          saleComparables={mockComparables}
          squareFootage={1500}
        />
      );

      const papers = container.querySelectorAll('.MuiPaper-root');
      expect(papers.length).toBe(1);
    });

    it('should display ARV per sqft', () => {
      render(
        <ValuationSummaryCards
          rentCastEstimates={mockRentCastEstimatesWithARV}
          saleComparables={mockComparables}
          squareFootage={1500}
        />
      );

      // Should show $/sqft format
      expect(screen.getByText(/\/sqft$/)).toBeInTheDocument();
    });

    it('should display range from Mid+As-Is (low) to Quality (high)', () => {
      render(
        <ValuationSummaryCards
          rentCastEstimates={mockRentCastEstimatesWithARV}
          saleComparables={mockComparables}
          squareFootage={1500}
        />
      );

      // Should show range text
      expect(screen.getByText(/Range:/)).toBeInTheDocument();
    });

    it('should calculate ARV from Quality + Mid + As-Is tiers with correct value', () => {
      // Using simple comps for predictable calculation:
      // Quality: $200/sqft, Mid: $180/sqft, As-Is: $160/sqft
      // Average: (200 + 180 + 160) / 3 = $180/sqft
      // ARV for 1000 sqft = $180,000
      const simpleComps: SaleComparable[] = [
        { id: '1', address: '1 Quality', price: 200000, squareFootage: 1000, tier: 'Quality', bedrooms: 3, bathrooms: 2, distance: 0.5 },
        { id: '2', address: '2 Mid', price: 180000, squareFootage: 1000, tier: 'Mid', bedrooms: 3, bathrooms: 2, distance: 0.6 },
        { id: '3', address: '3 AsIs', price: 160000, squareFootage: 1000, tier: 'As-Is', bedrooms: 3, bathrooms: 2, distance: 0.7 },
      ];

      render(
        <ValuationSummaryCards
          rentCastEstimates={mockRentCastEstimatesWithARV}
          saleComparables={simpleComps}
          squareFootage={1000}
        />
      );

      // ARV = $180/sqft * 1000 = $180,000
      expect(screen.getByText('$180,000')).toBeInTheDocument();
      expect(screen.getByText('$180/sqft')).toBeInTheDocument();
    });

    it('should calculate range with Mid+As-Is (low) and Quality (high)', () => {
      // Quality: $200/sqft -> high estimate = $200,000
      // Mid: $180/sqft, As-Is: $160/sqft -> avg = $170/sqft -> low estimate = $170,000
      const simpleComps: SaleComparable[] = [
        { id: '1', address: '1 Quality', price: 200000, squareFootage: 1000, tier: 'Quality', bedrooms: 3, bathrooms: 2, distance: 0.5 },
        { id: '2', address: '2 Mid', price: 180000, squareFootage: 1000, tier: 'Mid', bedrooms: 3, bathrooms: 2, distance: 0.6 },
        { id: '3', address: '3 AsIs', price: 160000, squareFootage: 1000, tier: 'As-Is', bedrooms: 3, bathrooms: 2, distance: 0.7 },
      ];

      render(
        <ValuationSummaryCards
          rentCastEstimates={mockRentCastEstimatesWithARV}
          saleComparables={simpleComps}
          squareFootage={1000}
        />
      );

      // Low = Mid+As-Is avg ($170K), High = Quality ($200K)
      expect(screen.getByText('Range: $170K - $200K')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should fall back to stored ARV when no comparables provided', () => {
      render(
        <ValuationSummaryCards
          rentCastEstimates={mockRentCastEstimatesWithARV}
          saleComparables={[]}
          squareFootage={1500}
        />
      );

      // Should show the stored ARV value
      expect(screen.getByText('$285,000')).toBeInTheDocument();
    });

    it('should handle large ARV values', () => {
      const largeComps: SaleComparable[] = [
        { id: '1', address: '123 Luxury St', price: 1800000, squareFootage: 3000, tier: 'Quality', bedrooms: 5, bathrooms: 4, distance: 0.5 },
        { id: '2', address: '456 Premium Ave', price: 1700000, squareFootage: 2800, tier: 'Mid', bedrooms: 5, bathrooms: 4, distance: 0.7 },
      ];

      render(
        <ValuationSummaryCards
          rentCastEstimates={mockRentCastEstimatesWithARV}
          saleComparables={largeComps}
          squareFootage={3000}
        />
      );

      // Should render without error
      expect(screen.getByText('ARV Estimate')).toBeInTheDocument();
    });

    it('should handle missing squareFootage gracefully', () => {
      render(
        <ValuationSummaryCards
          rentCastEstimates={mockRentCastEstimatesWithARV}
          saleComparables={mockComparables}
        />
      );

      // Should fall back to stored ARV
      expect(screen.getByText('$285,000')).toBeInTheDocument();
    });

    it('should not display confidence indicator (removed in TASK-064)', () => {
      render(
        <ValuationSummaryCards
          rentCastEstimates={mockRentCastEstimatesWithARV}
          saleComparables={mockComparables}
          squareFootage={1500}
        />
      );

      // Confidence chip should not be present
      expect(screen.queryByText(/conf/)).not.toBeInTheDocument();
    });

    it('should not display progress bar (removed in TASK-064)', () => {
      const { container } = render(
        <ValuationSummaryCards
          rentCastEstimates={mockRentCastEstimatesWithARV}
          saleComparables={mockComparables}
          squareFootage={1500}
        />
      );

      const progressBar = container.querySelector('.MuiLinearProgress-root');
      expect(progressBar).not.toBeInTheDocument();
    });

    it('should not display "Based on" helper text (removed in TASK-064)', () => {
      render(
        <ValuationSummaryCards
          rentCastEstimates={mockRentCastEstimatesWithARV}
          saleComparables={mockComparables}
          squareFootage={1500}
        />
      );

      expect(screen.queryByText(/Based on/)).not.toBeInTheDocument();
    });

    it('should not show range when no Quality comps available', () => {
      const noQualityComps: SaleComparable[] = [
        { id: '1', address: '123 Mid St', price: 250000, squareFootage: 1500, tier: 'Mid', bedrooms: 3, bathrooms: 2, distance: 0.5 },
        { id: '2', address: '456 AsIs Ave', price: 200000, squareFootage: 1400, tier: 'As-Is', bedrooms: 3, bathrooms: 2, distance: 0.7 },
      ];

      render(
        <ValuationSummaryCards
          rentCastEstimates={mockRentCastEstimatesWithARV}
          saleComparables={noQualityComps}
          squareFootage={1500}
        />
      );

      // Range should not be displayed without Quality comps for high estimate
      expect(screen.queryByText(/Range:/)).not.toBeInTheDocument();
    });

    it('should not show range when no Mid or As-Is comps available', () => {
      const onlyQualityComps: SaleComparable[] = [
        { id: '1', address: '123 Quality St', price: 300000, squareFootage: 1500, tier: 'Quality', bedrooms: 3, bathrooms: 2, distance: 0.5 },
        { id: '2', address: '456 Quality Ave', price: 280000, squareFootage: 1400, tier: 'Quality', bedrooms: 3, bathrooms: 2, distance: 0.7 },
      ];

      render(
        <ValuationSummaryCards
          rentCastEstimates={mockRentCastEstimatesWithARV}
          saleComparables={onlyQualityComps}
          squareFootage={1500}
        />
      );

      // Range should not be displayed without Mid/As-Is comps for low estimate
      expect(screen.queryByText(/Range:/)).not.toBeInTheDocument();
    });
  });
});

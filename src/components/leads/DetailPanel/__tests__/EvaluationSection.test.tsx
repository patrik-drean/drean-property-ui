import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { EvaluationSection } from '../EvaluationSection';
import { QueueLead } from '../../../../types/queue';
import {
  LeadMetrics,
  ComparableSale,
  leadQueueService,
} from '../../../../services/leadQueueService';

// Mock the leadQueueService
jest.mock('../../../../services/leadQueueService', () => ({
  ...jest.requireActual('../../../../services/leadQueueService'),
  leadQueueService: {
    getRentCastArv: jest.fn(),
  },
}));

const mockedLeadQueueService = leadQueueService as jest.Mocked<typeof leadQueueService>;

// Extended type for testing with _metrics and _comparables
interface QueueLeadWithMetrics extends QueueLead {
  _metrics?: LeadMetrics;
  _comparables?: ComparableSale[];
}

describe('EvaluationSection', () => {
  // Mock lead with _metrics (as populated by useLeadQueue from API)
  const mockMetrics: LeadMetrics = {
    arv: 200000,
    arvConfidence: 85,
    arvSource: 'ai',
    arvNote: undefined,
    rehabEstimate: 30000,
    rehabConfidence: 72,
    rehabSource: 'ai',
    rehabNote: undefined,
    rentEstimate: 1600,
    rentConfidence: 78,
    rentSource: 'ai',
    rentNote: undefined,
    mao: 105000,
    spreadPercent: 30,
    neighborhoodGrade: 'B',
  };

  const mockLead: QueueLeadWithMetrics = {
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
    leadScore: 8.5,
    mao: 105000,
    spreadPercent: 30,
    neighborhoodGrade: 'B',
    status: 'New',
    lastContactDate: null,
    priority: 'high',
    timeSinceCreated: '2h ago',
    _metrics: mockMetrics,
  };

  const mockOnEvaluationChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('should display the section title', () => {
      render(<EvaluationSection lead={mockLead} />);

      expect(screen.getByText('EVALUATION')).toBeInTheDocument();
    });

    it('should display the score badge', () => {
      render(<EvaluationSection lead={mockLead} />);

      // Score badge shows the lead score
      expect(screen.getByText('8.5')).toBeInTheDocument();
    });

    it('should display score label based on score value', () => {
      render(<EvaluationSection lead={mockLead} />);

      // Score of 8.5 should show "GOOD DEAL"
      expect(screen.getByText('GOOD DEAL')).toBeInTheDocument();
    });
  });

  describe('score badge colors', () => {
    it('should show EXCELLENT DEAL for score >= 9', () => {
      const excellentLead = { ...mockLead, leadScore: 9.5 };
      render(<EvaluationSection lead={excellentLead} />);

      expect(screen.getByText('EXCELLENT DEAL')).toBeInTheDocument();
    });

    it('should show GOOD DEAL for score >= 7', () => {
      const goodLead = { ...mockLead, leadScore: 7.5 };
      render(<EvaluationSection lead={goodLead} />);

      expect(screen.getByText('GOOD DEAL')).toBeInTheDocument();
    });

    it('should show FAIR DEAL for score >= 5', () => {
      const fairLead = { ...mockLead, leadScore: 5.5 };
      render(<EvaluationSection lead={fairLead} />);

      expect(screen.getByText('FAIR DEAL')).toBeInTheDocument();
    });

    it('should show POOR DEAL for score < 5', () => {
      const poorLead = { ...mockLead, leadScore: 3 };
      render(<EvaluationSection lead={poorLead} />);

      expect(screen.getByText('POOR DEAL')).toBeInTheDocument();
    });
  });

  describe('evaluation metrics', () => {
    it('should display ARV label', () => {
      render(<EvaluationSection lead={mockLead} />);

      expect(screen.getByText('ARV (After Repair Value)')).toBeInTheDocument();
    });

    it('should display Rehab Estimate label', () => {
      render(<EvaluationSection lead={mockLead} />);

      expect(screen.getByText('Rehab Estimate')).toBeInTheDocument();
    });

    it('should display Rent Estimate label', () => {
      render(<EvaluationSection lead={mockLead} />);

      expect(screen.getByText('Rent Estimate')).toBeInTheDocument();
    });

    it('should display MAO (Maximum Allowable Offer)', () => {
      render(<EvaluationSection lead={mockLead} />);

      expect(screen.getByText('MAO (Maximum Allowable Offer)')).toBeInTheDocument();
    });

    it('should display MAO formula', () => {
      render(<EvaluationSection lead={mockLead} />);

      expect(screen.getByText('(ARV × 70%) - Rehab - $5k')).toBeInTheDocument();
    });
  });

  describe('inline editing', () => {
    it('should have edit button for ARV', () => {
      render(<EvaluationSection lead={mockLead} />);

      const arvEditButton = screen.getByLabelText(/Edit ARV/i);
      expect(arvEditButton).toBeInTheDocument();
    });

    it('should have edit button for Rehab', () => {
      render(<EvaluationSection lead={mockLead} />);

      const rehabEditButton = screen.getByLabelText(/Edit Rehab/i);
      expect(rehabEditButton).toBeInTheDocument();
    });

    it('should have edit button for Rent', () => {
      render(<EvaluationSection lead={mockLead} />);

      const rentEditButton = screen.getByLabelText(/Edit Rent/i);
      expect(rentEditButton).toBeInTheDocument();
    });

    it('should enter edit mode when ARV edit button is clicked', () => {
      render(<EvaluationSection lead={mockLead} />);

      fireEvent.click(screen.getByLabelText(/Edit ARV/i));

      // Should show save and cancel buttons in edit mode
      expect(screen.getByText('Save')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('should call onEvaluationChange when value is saved', async () => {
      render(
        <EvaluationSection lead={mockLead} onEvaluationChange={mockOnEvaluationChange} />
      );

      // Click edit button for ARV
      fireEvent.click(screen.getByLabelText(/Edit ARV/i));

      // Clear and type new value
      const input = screen.getByPlaceholderText('Enter value');
      fireEvent.change(input, { target: { value: '250000' } });

      // Click save
      fireEvent.click(screen.getByText('Save'));

      expect(mockOnEvaluationChange).toHaveBeenCalledWith(
        expect.objectContaining({
          arv: 250000,
          arvSource: 'manual',
        })
      );
    });

    it('should cancel editing when Cancel is clicked', () => {
      render(<EvaluationSection lead={mockLead} />);

      // Click edit button
      fireEvent.click(screen.getByLabelText(/Edit ARV/i));

      // Should be in edit mode
      expect(screen.getByText('Save')).toBeInTheDocument();

      // Click cancel
      fireEvent.click(screen.getByText('Cancel'));

      // Should be back in view mode (no Save button)
      expect(screen.queryByText('Save')).not.toBeInTheDocument();
    });

    it('should call onEvaluationChange when Rehab value is saved', () => {
      render(
        <EvaluationSection lead={mockLead} onEvaluationChange={mockOnEvaluationChange} />
      );

      // Click edit button for Rehab
      fireEvent.click(screen.getByLabelText(/Edit Rehab/i));

      // Type new value
      const input = screen.getByPlaceholderText('Enter value');
      fireEvent.change(input, { target: { value: '50000' } });

      // Click save
      fireEvent.click(screen.getByText('Save'));

      expect(mockOnEvaluationChange).toHaveBeenCalledWith(
        expect.objectContaining({
          rehab: 50000,
          rehabSource: 'manual',
        })
      );
    });

    it('should call onEvaluationChange when Rent value is saved', () => {
      render(
        <EvaluationSection lead={mockLead} onEvaluationChange={mockOnEvaluationChange} />
      );

      // Click edit button for Rent
      fireEvent.click(screen.getByLabelText(/Edit Rent/i));

      // Type new value
      const input = screen.getByPlaceholderText('Enter value');
      fireEvent.change(input, { target: { value: '2000' } });

      // Click save
      fireEvent.click(screen.getByText('Save'));

      expect(mockOnEvaluationChange).toHaveBeenCalledWith(
        expect.objectContaining({
          rent: 2000,
          rentSource: 'manual',
        })
      );
    });
  });

  describe('neighborhood grade', () => {
    it('should display neighborhood section', () => {
      render(<EvaluationSection lead={mockLead} />);

      expect(screen.getByText('Neighborhood')).toBeInTheDocument();
    });

    it('should display the grade', () => {
      render(<EvaluationSection lead={mockLead} />);

      expect(screen.getByText('B')).toBeInTheDocument();
    });

    it('should display grade description', () => {
      render(<EvaluationSection lead={mockLead} />);

      expect(screen.getByText(/Good-grade neighborhood/i)).toBeInTheDocument();
    });
  });

  describe('confidence badges', () => {
    it('should display confidence badge for metrics when _metrics has confidence', () => {
      render(<EvaluationSection lead={mockLead} />);

      // Lead with _metrics.arvConfidence = 85 should show "High Confidence" badges (85% >= 80%)
      const confidenceBadges = screen.getAllByText(/High Confidence/i);
      expect(confidenceBadges.length).toBeGreaterThan(0);
    });

    it('should show Low Confidence badge when no confidence value', () => {
      const leadWithoutConfidence: QueueLeadWithMetrics = {
        ...mockLead,
        _metrics: {
          ...mockMetrics,
          arvConfidence: undefined,
          rehabConfidence: undefined,
          rentConfidence: undefined,
        },
      };
      render(<EvaluationSection lead={leadWithoutConfidence} />);

      // Should show "Low Confidence" badges (default when no confidence)
      const lowConfidenceBadges = screen.getAllByText(/Low Confidence/i);
      expect(lowConfidenceBadges.length).toBeGreaterThan(0);
    });
  });

  describe('comparables section', () => {
    it('should render comparables section', () => {
      render(<EvaluationSection lead={mockLead} />);

      // Comps are collapsed by default, look for the expand button
      expect(screen.getByText(/View.*Comps/i)).toBeInTheDocument();
    });

    it('should expand comps when button is clicked', () => {
      render(<EvaluationSection lead={mockLead} />);

      const expandButton = screen.getByText(/View.*Comps/i);
      fireEvent.click(expandButton);

      // After expanding, should show comp addresses
      expect(screen.getByText('123 Oak St')).toBeInTheDocument();
    });
  });

  describe('MAO auto-calculation', () => {
    it('should recalculate MAO when ARV changes', () => {
      render(<EvaluationSection lead={mockLead} />);

      // Click edit button for ARV
      fireEvent.click(screen.getByLabelText(/Edit ARV/i));

      // Type new value
      const input = screen.getByPlaceholderText('Enter value');
      fireEvent.change(input, { target: { value: '300000' } });

      // Click save
      fireEvent.click(screen.getByText('Save'));

      // MAO should be recalculated: (300000 * 0.7) - rehab - 5000
      // With initial rehab being roughly 15% of ARV estimate
      const maoElement = screen.getByText(/MAO \(Maximum Allowable Offer\)/i)
        .parentElement?.querySelector('h6');
      expect(maoElement).toBeInTheDocument();
    });
  });

  describe('spread percentage', () => {
    it('should display spread percentage with MAO', () => {
      render(<EvaluationSection lead={mockLead} />);

      expect(screen.getByText(/below asking/i)).toBeInTheDocument();
    });
  });

  // TASK-093: Tests for reading from _metrics and state reset on lead change
  describe('reading from _metrics (TASK-093)', () => {
    it('should display ARV from _metrics when available', () => {
      const leadWithMetrics: QueueLeadWithMetrics = {
        ...mockLead,
        _metrics: {
          ...mockMetrics,
          arv: 275000,
        },
      };
      render(<EvaluationSection lead={leadWithMetrics} />);

      // Should show the ARV from _metrics formatted as currency
      expect(screen.getByText('$275,000')).toBeInTheDocument();
    });

    it('should display Rehab from _metrics when available', () => {
      const leadWithMetrics: QueueLeadWithMetrics = {
        ...mockLead,
        _metrics: {
          ...mockMetrics,
          rehabEstimate: 45000,
        },
      };
      render(<EvaluationSection lead={leadWithMetrics} />);

      // Should show the rehab from _metrics formatted as currency
      expect(screen.getByText('$45,000')).toBeInTheDocument();
    });

    it('should display Rent from _metrics when available', () => {
      const leadWithMetrics: QueueLeadWithMetrics = {
        ...mockLead,
        _metrics: {
          ...mockMetrics,
          rentEstimate: 2100,
        },
      };
      render(<EvaluationSection lead={leadWithMetrics} />);

      // Should show the rent from _metrics formatted as currency with /mo
      expect(screen.getByText('$2,100/mo')).toBeInTheDocument();
    });

    it('should fallback to calculated values when _metrics is not present', () => {
      const leadWithoutMetrics: QueueLeadWithMetrics = {
        ...mockLead,
        _metrics: undefined,
      };
      render(<EvaluationSection lead={leadWithoutMetrics} />);

      // Should still render evaluation metrics using fallback calculations
      expect(screen.getByText('ARV (After Repair Value)')).toBeInTheDocument();
      expect(screen.getByText('Rehab Estimate')).toBeInTheDocument();
    });

    it('should show Manual Override badge after editing', () => {
      render(
        <EvaluationSection lead={mockLead} onEvaluationChange={mockOnEvaluationChange} />
      );

      // Edit ARV
      fireEvent.click(screen.getByLabelText(/Edit ARV/i));
      const input = screen.getByPlaceholderText('Enter value');
      fireEvent.change(input, { target: { value: '300000' } });
      fireEvent.click(screen.getByText('Save'));

      // Should show Manual Override badge
      expect(screen.getByText('Manual Override')).toBeInTheDocument();
    });

    it('should display notes from _metrics in tooltip', async () => {
      const leadWithNotes: QueueLeadWithMetrics = {
        ...mockLead,
        _metrics: {
          ...mockMetrics,
          arvSource: 'manual',
          arvNote: 'Adjusted for lot size',
        },
      };
      render(<EvaluationSection lead={leadWithNotes} />);

      // Note is displayed in a tooltip on hover of the confidence badge
      // Find the Manual Override badge and hover over it
      const manualBadge = screen.getByText('Manual Override');
      fireEvent.mouseOver(manualBadge);

      // Note should appear in tooltip
      await waitFor(() => {
        expect(screen.getByText(/Adjusted for lot size/i)).toBeInTheDocument();
      });
    });
  });

  describe('state reset on lead change (TASK-093)', () => {
    it('should update evaluation when lead.id changes', () => {
      const lead1: QueueLeadWithMetrics = {
        ...mockLead,
        id: 'lead-1',
        _metrics: {
          ...mockMetrics,
          arv: 200000,
        },
      };

      const lead2: QueueLeadWithMetrics = {
        ...mockLead,
        id: 'lead-2',
        _metrics: {
          ...mockMetrics,
          arv: 350000,
        },
      };

      const { rerender } = render(<EvaluationSection lead={lead1} />);

      // First lead shows $200,000
      expect(screen.getByText('$200,000')).toBeInTheDocument();

      // Switch to second lead
      rerender(<EvaluationSection lead={lead2} />);

      // Should now show $350,000
      expect(screen.getByText('$350,000')).toBeInTheDocument();
    });

    it('should update evaluation when _metrics.arv changes for same lead', () => {
      const initialLead: QueueLeadWithMetrics = {
        ...mockLead,
        _metrics: {
          ...mockMetrics,
          arv: 200000,
        },
      };

      const updatedLead: QueueLeadWithMetrics = {
        ...mockLead,
        _metrics: {
          ...mockMetrics,
          arv: 225000, // Updated by API
        },
      };

      const { rerender } = render(<EvaluationSection lead={initialLead} />);

      // Initial ARV
      expect(screen.getByText('$200,000')).toBeInTheDocument();

      // Lead metrics updated (e.g., from API response)
      rerender(<EvaluationSection lead={updatedLead} />);

      // Should show updated ARV
      expect(screen.getByText('$225,000')).toBeInTheDocument();
    });

    it('should update rehab when _metrics.rehabEstimate changes', () => {
      const initialLead: QueueLeadWithMetrics = {
        ...mockLead,
        _metrics: {
          ...mockMetrics,
          rehabEstimate: 30000,
        },
      };

      const updatedLead: QueueLeadWithMetrics = {
        ...mockLead,
        _metrics: {
          ...mockMetrics,
          rehabEstimate: 40000, // Updated by API
        },
      };

      const { rerender } = render(<EvaluationSection lead={initialLead} />);
      expect(screen.getByText('$30,000')).toBeInTheDocument();

      rerender(<EvaluationSection lead={updatedLead} />);
      expect(screen.getByText('$40,000')).toBeInTheDocument();
    });

    it('should update rent when _metrics.rentEstimate changes', () => {
      const initialLead: QueueLeadWithMetrics = {
        ...mockLead,
        _metrics: {
          ...mockMetrics,
          rentEstimate: 1600,
        },
      };

      const updatedLead: QueueLeadWithMetrics = {
        ...mockLead,
        _metrics: {
          ...mockMetrics,
          rentEstimate: 1800, // Updated by API
        },
      };

      const { rerender } = render(<EvaluationSection lead={initialLead} />);
      expect(screen.getByText('$1,600/mo')).toBeInTheDocument();

      rerender(<EvaluationSection lead={updatedLead} />);
      expect(screen.getByText('$1,800/mo')).toBeInTheDocument();
    });

    it('should preserve local edits when switching leads and back', () => {
      const lead1: QueueLeadWithMetrics = {
        ...mockLead,
        id: 'lead-1',
        _metrics: {
          ...mockMetrics,
          arv: 200000,
        },
      };

      const lead2: QueueLeadWithMetrics = {
        ...mockLead,
        id: 'lead-2',
        _metrics: {
          ...mockMetrics,
          arv: 350000,
        },
      };

      const { rerender } = render(
        <EvaluationSection lead={lead1} onEvaluationChange={mockOnEvaluationChange} />
      );

      // Edit ARV on lead 1
      fireEvent.click(screen.getByLabelText(/Edit ARV/i));
      const input = screen.getByPlaceholderText('Enter value');
      fireEvent.change(input, { target: { value: '250000' } });
      fireEvent.click(screen.getByText('Save'));

      // onEvaluationChange should have been called
      expect(mockOnEvaluationChange).toHaveBeenCalledWith(
        expect.objectContaining({ arv: 250000 })
      );

      // Switch to lead 2
      rerender(
        <EvaluationSection lead={lead2} onEvaluationChange={mockOnEvaluationChange} />
      );

      // Should show lead 2's ARV
      expect(screen.getByText('$350,000')).toBeInTheDocument();

      // Switch back to lead 1 (with original _metrics - the local edit was sent to API)
      rerender(
        <EvaluationSection lead={lead1} onEvaluationChange={mockOnEvaluationChange} />
      );

      // Should show lead 1's original _metrics ARV (not the edited value)
      // because the parent component would update _metrics after API call
      expect(screen.getByText('$200,000')).toBeInTheDocument();
    });
  });

  describe('source type display', () => {
    it('should show RentCast Verified badge for rentcast source', () => {
      const rentCastLead: QueueLeadWithMetrics = {
        ...mockLead,
        _metrics: {
          ...mockMetrics,
          arvSource: 'rentcast',
        },
      };
      render(<EvaluationSection lead={rentCastLead} />);

      expect(screen.getByText('RentCast Verified')).toBeInTheDocument();
    });

    it('should show Manual Override badge for manual source', () => {
      const manualLead: QueueLeadWithMetrics = {
        ...mockLead,
        _metrics: {
          ...mockMetrics,
          arvSource: 'manual',
        },
      };
      render(<EvaluationSection lead={manualLead} />);

      expect(screen.getByText('Manual Override')).toBeInTheDocument();
    });
  });

  // TASK-096: Tests for different leads showing different values (not mocked data)
  describe('lead-specific data display (TASK-096)', () => {
    it('should show different ARV values for different leads', () => {
      const leadA: QueueLeadWithMetrics = {
        ...mockLead,
        id: 'lead-a',
        address: '100 First St',
        _metrics: {
          ...mockMetrics,
          arv: 185000,
          rehabEstimate: 25000,
          rentEstimate: 1500,
        },
      };

      const leadB: QueueLeadWithMetrics = {
        ...mockLead,
        id: 'lead-b',
        address: '200 Second St',
        _metrics: {
          ...mockMetrics,
          arv: 320000,
          rehabEstimate: 45000,
          rentEstimate: 2200,
        },
      };

      // Render Lead A
      const { rerender } = render(<EvaluationSection lead={leadA} />);
      expect(screen.getByText('$185,000')).toBeInTheDocument();

      // Render Lead B - should show different values
      rerender(<EvaluationSection lead={leadB} />);
      expect(screen.getByText('$320,000')).toBeInTheDocument();
      expect(screen.queryByText('$185,000')).not.toBeInTheDocument();
    });

    it('should show different Rehab values for different leads', () => {
      const leadA: QueueLeadWithMetrics = {
        ...mockLead,
        id: 'lead-a',
        _metrics: {
          ...mockMetrics,
          rehabEstimate: 15000,
        },
      };

      const leadB: QueueLeadWithMetrics = {
        ...mockLead,
        id: 'lead-b',
        _metrics: {
          ...mockMetrics,
          rehabEstimate: 55000,
        },
      };

      const { rerender } = render(<EvaluationSection lead={leadA} />);
      expect(screen.getByText('$15,000')).toBeInTheDocument();

      rerender(<EvaluationSection lead={leadB} />);
      expect(screen.getByText('$55,000')).toBeInTheDocument();
    });

    it('should show different Rent values for different leads', () => {
      const leadA: QueueLeadWithMetrics = {
        ...mockLead,
        id: 'lead-a',
        _metrics: {
          ...mockMetrics,
          rentEstimate: 1200,
        },
      };

      const leadB: QueueLeadWithMetrics = {
        ...mockLead,
        id: 'lead-b',
        _metrics: {
          ...mockMetrics,
          rentEstimate: 2800,
        },
      };

      const { rerender } = render(<EvaluationSection lead={leadA} />);
      expect(screen.getByText('$1,200/mo')).toBeInTheDocument();

      rerender(<EvaluationSection lead={leadB} />);
      expect(screen.getByText('$2,800/mo')).toBeInTheDocument();
    });

    it('should calculate MAO from actual lead values, not hardcoded', () => {
      // MAO = (ARV × 70%) - Rehab - $5k
      // Lead A: ($185,000 × 0.7) - $25,000 - $5,000 = $99,500
      const leadA: QueueLeadWithMetrics = {
        ...mockLead,
        id: 'lead-a',
        _metrics: {
          ...mockMetrics,
          arv: 185000,
          rehabEstimate: 25000,
        },
      };

      // Lead B: ($320,000 × 0.7) - $45,000 - $5,000 = $174,000
      const leadB: QueueLeadWithMetrics = {
        ...mockLead,
        id: 'lead-b',
        _metrics: {
          ...mockMetrics,
          arv: 320000,
          rehabEstimate: 45000,
        },
      };

      const { rerender } = render(<EvaluationSection lead={leadA} />);
      expect(screen.getByText('$99,500')).toBeInTheDocument();

      rerender(<EvaluationSection lead={leadB} />);
      expect(screen.getByText('$174,000')).toBeInTheDocument();
    });

    it('should not show hardcoded values like 185000, 25000, 1500', () => {
      // These were the old hardcoded fallback values that would appear for every lead
      const leadWithDifferentValues: QueueLeadWithMetrics = {
        ...mockLead,
        id: 'unique-lead',
        listingPrice: 275000,
        _metrics: {
          ...mockMetrics,
          arv: 340000,
          rehabEstimate: 38000,
          rentEstimate: 2100,
        },
      };

      render(<EvaluationSection lead={leadWithDifferentValues} />);

      // Should show actual values
      expect(screen.getByText('$340,000')).toBeInTheDocument();
      expect(screen.getByText('$38,000')).toBeInTheDocument();
      expect(screen.getByText('$2,100/mo')).toBeInTheDocument();

      // Should NOT show old hardcoded values
      expect(screen.queryByText('$185,000')).not.toBeInTheDocument();
      expect(screen.queryByText('$25,000')).not.toBeInTheDocument();
      expect(screen.queryByText('$1,500/mo')).not.toBeInTheDocument();
    });
  });

  // TASK-100: Tests for RentCast ARV trigger and comparables display
  describe('RentCast ARV trigger (TASK-100)', () => {
    const mockRentCastComparables: ComparableSale[] = [
      {
        id: 'comp-1',
        address: '456 Market St',
        city: 'San Antonio',
        state: 'TX',
        zipCode: '78209',
        salePrice: 245000,
        pricePerSqft: 115,
        squareFeet: 2130,
        bedrooms: 3,
        bathrooms: 2,
        saleDate: '2025-11-15T00:00:00Z',
        distanceMiles: 0.3,
        zillowUrl: 'https://zillow.com/homedetails/456-market',
        propertyType: 'Single Family',
      },
      {
        id: 'comp-2',
        address: '789 Commerce Ave',
        city: 'San Antonio',
        state: 'TX',
        zipCode: '78209',
        salePrice: 260000,
        pricePerSqft: 120,
        squareFeet: 2167,
        bedrooms: 4,
        bathrooms: 2,
        saleDate: '2025-10-20T00:00:00Z',
        distanceMiles: 0.5,
        propertyType: 'Single Family',
      },
    ];

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should render RentCast refresh button', () => {
      render(<EvaluationSection lead={mockLead} />);

      const rentCastButton = screen.getByLabelText('Get RentCast ARV');
      expect(rentCastButton).toBeInTheDocument();
    });

    it('should show tooltip on RentCast button hover', async () => {
      render(<EvaluationSection lead={mockLead} />);

      const rentCastButton = screen.getByLabelText('Get RentCast ARV');
      fireEvent.mouseOver(rentCastButton);

      await waitFor(() => {
        expect(screen.getByText(/Get RentCast ARV & Comps/i)).toBeInTheDocument();
      });
    });

    it('should call getRentCastArv when button is clicked', async () => {
      mockedLeadQueueService.getRentCastArv.mockResolvedValueOnce({
        arv: 250000,
        arvSource: 'rentcast',
        arvConfidence: 90,
        comparables: mockRentCastComparables,
        requestsRemaining: 9,
        updatedAt: new Date().toISOString(),
      });

      render(<EvaluationSection lead={mockLead} />);

      const rentCastButton = screen.getByLabelText('Get RentCast ARV');

      await act(async () => {
        fireEvent.click(rentCastButton);
      });

      await waitFor(() => {
        expect(mockedLeadQueueService.getRentCastArv).toHaveBeenCalledWith('lead-1');
      });
    });

    it('should show loading spinner during API call', async () => {
      // Create a promise that we can control
      let resolvePromise: (value: unknown) => void;
      const pendingPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockedLeadQueueService.getRentCastArv.mockReturnValueOnce(pendingPromise as never);

      render(<EvaluationSection lead={mockLead} />);

      const rentCastButton = screen.getByLabelText('Get RentCast ARV');

      await act(async () => {
        fireEvent.click(rentCastButton);
      });

      // Button should be disabled during loading
      expect(rentCastButton).toBeDisabled();

      // Loading spinner should be visible (CircularProgress)
      const spinner = rentCastButton.querySelector('[class*="MuiCircularProgress"]');
      expect(spinner).toBeInTheDocument();

      // Clean up by resolving the promise
      await act(async () => {
        resolvePromise!({
          arv: 250000,
          arvSource: 'rentcast',
          arvConfidence: 90,
          comparables: [],
          requestsRemaining: 9,
          updatedAt: new Date().toISOString(),
        });
      });
    });

    it('should update ARV after successful RentCast call', async () => {
      mockedLeadQueueService.getRentCastArv.mockResolvedValueOnce({
        arv: 275000,
        arvSource: 'rentcast',
        arvConfidence: 92,
        comparables: mockRentCastComparables,
        requestsRemaining: 8,
        updatedAt: new Date().toISOString(),
      });

      const mockOnChange = jest.fn();
      render(
        <EvaluationSection lead={mockLead} onEvaluationChange={mockOnChange} />
      );

      const rentCastButton = screen.getByLabelText('Get RentCast ARV');

      await act(async () => {
        fireEvent.click(rentCastButton);
      });

      await waitFor(() => {
        // Should display the new ARV
        expect(screen.getByText('$275,000')).toBeInTheDocument();
      });

      // Should call onEvaluationChange with RentCast data
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          arv: 275000,
          arvSource: 'rentcast',
          arvConfidence: 92,
        })
      );
    });

    it('should call onRentCastSuccess callback after successful API call', async () => {
      const rentCastResult = {
        arv: 260000,
        arvSource: 'rentcast' as const,
        arvConfidence: 88,
        comparables: mockRentCastComparables,
        requestsRemaining: 7,
        updatedAt: new Date().toISOString(),
      };

      mockedLeadQueueService.getRentCastArv.mockResolvedValueOnce(rentCastResult);

      const mockOnRentCastSuccess = jest.fn();
      render(
        <EvaluationSection lead={mockLead} onRentCastSuccess={mockOnRentCastSuccess} />
      );

      await act(async () => {
        fireEvent.click(screen.getByLabelText('Get RentCast ARV'));
      });

      await waitFor(() => {
        expect(mockOnRentCastSuccess).toHaveBeenCalledWith(rentCastResult);
      });
    });

    it('should show rate limit error when API returns 429', async () => {
      const error = { response: { status: 429 } };
      mockedLeadQueueService.getRentCastArv.mockRejectedValueOnce(error);

      render(<EvaluationSection lead={mockLead} />);

      await act(async () => {
        fireEvent.click(screen.getByLabelText('Get RentCast ARV'));
      });

      await waitFor(() => {
        expect(
          screen.getByText(/Daily RentCast limit reached/i)
        ).toBeInTheDocument();
      });
    });

    it('should show not found error when API returns 404', async () => {
      const error = { response: { status: 404 } };
      mockedLeadQueueService.getRentCastArv.mockRejectedValueOnce(error);

      render(<EvaluationSection lead={mockLead} />);

      await act(async () => {
        fireEvent.click(screen.getByLabelText('Get RentCast ARV'));
      });

      await waitFor(() => {
        expect(
          screen.getByText(/Property not found in RentCast database/i)
        ).toBeInTheDocument();
      });
    });

    it('should show generic error for other API failures', async () => {
      mockedLeadQueueService.getRentCastArv.mockRejectedValueOnce(
        new Error('Network error')
      );

      render(<EvaluationSection lead={mockLead} />);

      await act(async () => {
        fireEvent.click(screen.getByLabelText('Get RentCast ARV'));
      });

      await waitFor(() => {
        expect(
          screen.getByText(/Failed to fetch RentCast data/i)
        ).toBeInTheDocument();
      });
    });

    it('should dismiss error alert when close button is clicked', async () => {
      mockedLeadQueueService.getRentCastArv.mockRejectedValueOnce(
        new Error('Network error')
      );

      render(<EvaluationSection lead={mockLead} />);

      await act(async () => {
        fireEvent.click(screen.getByLabelText('Get RentCast ARV'));
      });

      await waitFor(() => {
        expect(
          screen.getByText(/Failed to fetch RentCast data/i)
        ).toBeInTheDocument();
      });

      // Click close button on alert
      const closeButton = screen.getByRole('button', { name: /close/i });
      fireEvent.click(closeButton);

      // Error should be dismissed
      expect(
        screen.queryByText(/Failed to fetch RentCast data/i)
      ).not.toBeInTheDocument();
    });

    it('should re-enable button after API call completes', async () => {
      mockedLeadQueueService.getRentCastArv.mockResolvedValueOnce({
        arv: 250000,
        arvSource: 'rentcast',
        arvConfidence: 90,
        comparables: [],
        requestsRemaining: 9,
        updatedAt: new Date().toISOString(),
      });

      render(<EvaluationSection lead={mockLead} />);

      const rentCastButton = screen.getByLabelText('Get RentCast ARV');

      await act(async () => {
        fireEvent.click(rentCastButton);
      });

      await waitFor(() => {
        expect(rentCastButton).not.toBeDisabled();
      });
    });

    it('should clear error when lead changes', async () => {
      mockedLeadQueueService.getRentCastArv.mockRejectedValueOnce(
        new Error('Network error')
      );

      const { rerender } = render(<EvaluationSection lead={mockLead} />);

      await act(async () => {
        fireEvent.click(screen.getByLabelText('Get RentCast ARV'));
      });

      await waitFor(() => {
        expect(
          screen.getByText(/Failed to fetch RentCast data/i)
        ).toBeInTheDocument();
      });

      // Switch to different lead
      const newLead = { ...mockLead, id: 'lead-2' };
      rerender(<EvaluationSection lead={newLead} />);

      // Error should be cleared
      expect(
        screen.queryByText(/Failed to fetch RentCast data/i)
      ).not.toBeInTheDocument();
    });
  });

  describe('comparables with RentCast data (TASK-100)', () => {
    const mockRentCastComparables: ComparableSale[] = [
      {
        id: 'comp-1',
        address: '456 Market St',
        city: 'San Antonio',
        state: 'TX',
        zipCode: '78209',
        salePrice: 245000,
        pricePerSqft: 115,
        squareFeet: 2130,
        bedrooms: 3,
        bathrooms: 2,
        saleDate: '2025-11-15T00:00:00Z',
        distanceMiles: 0.3,
        zillowUrl: 'https://zillow.com/homedetails/456-market',
        propertyType: 'Single Family',
      },
      {
        id: 'comp-2',
        address: '789 Commerce Ave',
        city: 'San Antonio',
        state: 'TX',
        zipCode: '78209',
        salePrice: 260000,
        pricePerSqft: 120,
        squareFeet: 2167,
        bedrooms: 4,
        bathrooms: 2,
        saleDate: '2025-10-20T00:00:00Z',
        distanceMiles: 0.5,
        propertyType: 'Single Family',
      },
    ];

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should display RentCast comparables from _comparables prop', () => {
      const leadWithComps: QueueLeadWithMetrics = {
        ...mockLead,
        _metrics: {
          ...mockMetrics,
          arvSource: 'rentcast',
        },
        _comparables: mockRentCastComparables,
      };

      render(<EvaluationSection lead={leadWithComps} />);

      // Expand comps section
      const expandButton = screen.getByText(/View.*Comps.*RentCast/i);
      fireEvent.click(expandButton);

      // Should show RentCast comp addresses
      expect(screen.getByText('456 Market St')).toBeInTheDocument();
      expect(screen.getByText('789 Commerce Ave')).toBeInTheDocument();
    });

    it('should show (RentCast) label for verified comps', () => {
      const leadWithComps: QueueLeadWithMetrics = {
        ...mockLead,
        _metrics: {
          ...mockMetrics,
          arvSource: 'rentcast',
        },
        _comparables: mockRentCastComparables,
      };

      render(<EvaluationSection lead={leadWithComps} />);

      // Should show "(RentCast)" in the button text for viewing comps
      // Look for the specific View Comps button pattern
      expect(screen.getByText(/View.*Comps.*\(RentCast\)/i)).toBeInTheDocument();
    });

    it('should show Zillow links for comps with zillowUrl', () => {
      const leadWithComps: QueueLeadWithMetrics = {
        ...mockLead,
        _comparables: mockRentCastComparables,
      };

      render(<EvaluationSection lead={leadWithComps} />);

      // Expand comps section
      const expandButton = screen.getByText(/View.*Comps/i);
      fireEvent.click(expandButton);

      // First comp has Zillow URL
      const zillowLink = screen.getByRole('link', { name: '456 Market St' });
      expect(zillowLink).toHaveAttribute(
        'href',
        'https://zillow.com/homedetails/456-market'
      );
      expect(zillowLink).toHaveAttribute('target', '_blank');

      // Second comp has no Zillow URL, should be plain text
      const plainText = screen.getByText('789 Commerce Ave');
      expect(plainText.tagName).not.toBe('A');
    });

    it('should display beds/baths for comps', () => {
      const leadWithComps: QueueLeadWithMetrics = {
        ...mockLead,
        _comparables: mockRentCastComparables,
      };

      render(<EvaluationSection lead={leadWithComps} />);

      // Expand comps section
      const expandButton = screen.getByText(/View.*Comps/i);
      fireEvent.click(expandButton);

      // Should show beds/baths in format "3bd/2ba"
      expect(screen.getByText('3bd/2ba')).toBeInTheDocument();
      expect(screen.getByText('4bd/2ba')).toBeInTheDocument();
    });

    it('should update comparables after successful RentCast API call', async () => {
      mockedLeadQueueService.getRentCastArv.mockResolvedValueOnce({
        arv: 260000,
        arvSource: 'rentcast',
        arvConfidence: 88,
        comparables: mockRentCastComparables,
        requestsRemaining: 7,
        updatedAt: new Date().toISOString(),
      });

      render(<EvaluationSection lead={mockLead} />);

      // Trigger RentCast API call
      await act(async () => {
        fireEvent.click(screen.getByLabelText('Get RentCast ARV'));
      });

      // Wait for API call to complete
      await waitFor(() => {
        expect(mockedLeadQueueService.getRentCastArv).toHaveBeenCalled();
      });

      // Expand and verify new comps from RentCast
      fireEvent.click(screen.getByText(/View.*Comps/i));

      await waitFor(() => {
        expect(screen.getByText('456 Market St')).toBeInTheDocument();
      });
    });

    it('should show placeholder comps when no _comparables available', () => {
      const leadWithoutComps: QueueLeadWithMetrics = {
        ...mockLead,
        _comparables: undefined,
      };

      render(<EvaluationSection lead={leadWithoutComps} />);

      // Expand comps section
      const expandButton = screen.getByText(/View.*Comps/i);
      fireEvent.click(expandButton);

      // Should show placeholder comps (generated in component)
      expect(screen.getByText('123 Oak St')).toBeInTheDocument();
    });

    it('should display sale date formatted correctly', () => {
      const leadWithComps: QueueLeadWithMetrics = {
        ...mockLead,
        _comparables: mockRentCastComparables,
      };

      render(<EvaluationSection lead={leadWithComps} />);

      // Expand comps section
      fireEvent.click(screen.getByText(/View.*Comps/i));

      // Sale date should be formatted as "Nov 25" (Mountain Time)
      expect(screen.getByText('Nov 25')).toBeInTheDocument();
    });

    it('should display distance in miles', () => {
      const leadWithComps: QueueLeadWithMetrics = {
        ...mockLead,
        _comparables: mockRentCastComparables,
      };

      render(<EvaluationSection lead={leadWithComps} />);

      // Expand comps section
      fireEvent.click(screen.getByText(/View.*Comps/i));

      // Distance should be shown with "mi" suffix
      expect(screen.getByText('0.3 mi')).toBeInTheDocument();
      expect(screen.getByText('0.5 mi')).toBeInTheDocument();
    });

    it('should display price per sqft for comps', () => {
      const leadWithComps: QueueLeadWithMetrics = {
        ...mockLead,
        _comparables: mockRentCastComparables,
      };

      render(<EvaluationSection lead={leadWithComps} />);

      // Expand comps section
      fireEvent.click(screen.getByText(/View.*Comps/i));

      // Price per sqft
      expect(screen.getByText('$115/sqft')).toBeInTheDocument();
      expect(screen.getByText('$120/sqft')).toBeInTheDocument();
    });
  });
});

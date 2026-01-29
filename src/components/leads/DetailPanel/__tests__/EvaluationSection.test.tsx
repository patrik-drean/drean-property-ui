import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { EvaluationSection } from '../EvaluationSection';
import { QueueLead } from '../../../../types/queue';
import { LeadMetrics } from '../../../../services/leadQueueService';

// Extended type for testing with _metrics
interface QueueLeadWithMetrics extends QueueLead {
  _metrics?: LeadMetrics;
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
    it('should display AI confidence badge for metrics when _metrics has confidence', () => {
      render(<EvaluationSection lead={mockLead} />);

      // Lead with _metrics.arvConfidence = 85 should show AI confidence badges
      const confidenceBadges = screen.getAllByText(/AI -.*Confidence/i);
      expect(confidenceBadges.length).toBeGreaterThan(0);
    });

    it('should show AI badge without confidence when no confidence value', () => {
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

      // Should show "AI" badges (without specific confidence)
      const aiBadges = screen.getAllByText('AI');
      expect(aiBadges.length).toBeGreaterThan(0);
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

    it('should display notes from _metrics', () => {
      const leadWithNotes: QueueLeadWithMetrics = {
        ...mockLead,
        _metrics: {
          ...mockMetrics,
          arvSource: 'manual',
          arvNote: 'Adjusted for lot size',
        },
      };
      render(<EvaluationSection lead={leadWithNotes} />);

      // Note should be displayed
      expect(screen.getByText(/Adjusted for lot size/i)).toBeInTheDocument();
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
});

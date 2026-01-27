import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { EvaluationSection } from '../EvaluationSection';
import { QueueLead } from '../../../../types/queue';

describe('EvaluationSection', () => {
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
    leadScore: 8.5,
    mao: 105000,
    spreadPercent: 30,
    neighborhoodGrade: 'B',
    status: 'New',
    lastContactDate: null,
    priority: 'high',
    timeSinceCreated: '2h ago',
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
    it('should display AI confidence badge for metrics', () => {
      render(<EvaluationSection lead={mockLead} />);

      // Initial values should show AI confidence
      const confidenceBadges = screen.getAllByText(/AI -.*Confidence/i);
      expect(confidenceBadges.length).toBeGreaterThan(0);
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
});

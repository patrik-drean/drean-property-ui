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

  const mockHandlers = {
    onEditArv: jest.fn(),
    onEditRehab: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('should display the section title', () => {
      render(<EvaluationSection lead={mockLead} {...mockHandlers} />);

      expect(screen.getByText('EVALUATION')).toBeInTheDocument();
    });

    it('should display the score badge', () => {
      render(<EvaluationSection lead={mockLead} {...mockHandlers} />);

      // Score badge shows the lead score
      expect(screen.getByText('8.5')).toBeInTheDocument();
    });

    it('should display score label based on score value', () => {
      render(<EvaluationSection lead={mockLead} {...mockHandlers} />);

      // Score of 8.5 should show "GOOD DEAL"
      expect(screen.getByText('GOOD DEAL')).toBeInTheDocument();
    });
  });

  describe('score badge colors', () => {
    it('should show EXCELLENT DEAL for score >= 9', () => {
      const excellentLead = { ...mockLead, leadScore: 9.5 };
      render(<EvaluationSection lead={excellentLead} {...mockHandlers} />);

      expect(screen.getByText('EXCELLENT DEAL')).toBeInTheDocument();
    });

    it('should show GOOD DEAL for score >= 7', () => {
      const goodLead = { ...mockLead, leadScore: 7.5 };
      render(<EvaluationSection lead={goodLead} {...mockHandlers} />);

      expect(screen.getByText('GOOD DEAL')).toBeInTheDocument();
    });

    it('should show FAIR DEAL for score >= 5', () => {
      const fairLead = { ...mockLead, leadScore: 5.5 };
      render(<EvaluationSection lead={fairLead} {...mockHandlers} />);

      expect(screen.getByText('FAIR DEAL')).toBeInTheDocument();
    });

    it('should show POOR DEAL for score < 5', () => {
      const poorLead = { ...mockLead, leadScore: 3 };
      render(<EvaluationSection lead={poorLead} {...mockHandlers} />);

      expect(screen.getByText('POOR DEAL')).toBeInTheDocument();
    });
  });

  describe('evaluation metrics', () => {
    it('should display ARV label', () => {
      render(<EvaluationSection lead={mockLead} {...mockHandlers} />);

      expect(screen.getByText('ARV (After Repair Value)')).toBeInTheDocument();
    });

    it('should display Rehab Estimate label', () => {
      render(<EvaluationSection lead={mockLead} {...mockHandlers} />);

      expect(screen.getByText('Rehab Estimate')).toBeInTheDocument();
    });

    it('should display MAO (Maximum Allowable Offer)', () => {
      render(<EvaluationSection lead={mockLead} {...mockHandlers} />);

      expect(screen.getByText('MAO (Maximum Allowable Offer)')).toBeInTheDocument();
      expect(screen.getByText('$105,000')).toBeInTheDocument();
    });

    it('should display MAO formula', () => {
      render(<EvaluationSection lead={mockLead} {...mockHandlers} />);

      expect(screen.getByText('(ARV x 70%) - Rehab')).toBeInTheDocument();
    });

    it('should display spread percentage', () => {
      render(<EvaluationSection lead={mockLead} {...mockHandlers} />);

      expect(screen.getByText('Spread')).toBeInTheDocument();
      expect(screen.getByText('30% below asking')).toBeInTheDocument();
    });
  });

  describe('edit buttons', () => {
    it('should have edit button for ARV', () => {
      render(<EvaluationSection lead={mockLead} {...mockHandlers} />);

      const arvEditButton = screen.getByLabelText(/Edit ARV/i);
      expect(arvEditButton).toBeInTheDocument();
    });

    it('should have edit button for Rehab', () => {
      render(<EvaluationSection lead={mockLead} {...mockHandlers} />);

      const rehabEditButton = screen.getByLabelText(/Edit Rehab/i);
      expect(rehabEditButton).toBeInTheDocument();
    });

    it('should call onEditArv when ARV edit button is clicked', () => {
      render(<EvaluationSection lead={mockLead} {...mockHandlers} />);

      fireEvent.click(screen.getByLabelText(/Edit ARV/i));
      expect(mockHandlers.onEditArv).toHaveBeenCalledTimes(1);
    });

    it('should call onEditRehab when Rehab edit button is clicked', () => {
      render(<EvaluationSection lead={mockLead} {...mockHandlers} />);

      fireEvent.click(screen.getByLabelText(/Edit Rehab/i));
      expect(mockHandlers.onEditRehab).toHaveBeenCalledTimes(1);
    });
  });

  describe('neighborhood grade', () => {
    it('should display neighborhood section', () => {
      render(<EvaluationSection lead={mockLead} {...mockHandlers} />);

      expect(screen.getByText('Neighborhood')).toBeInTheDocument();
    });

    it('should display the grade', () => {
      render(<EvaluationSection lead={mockLead} {...mockHandlers} />);

      expect(screen.getByText('B')).toBeInTheDocument();
    });

    it('should display grade description', () => {
      render(<EvaluationSection lead={mockLead} {...mockHandlers} />);

      expect(screen.getByText(/Good-grade neighborhood/i)).toBeInTheDocument();
    });
  });

  describe('confidence badges', () => {
    it('should display AI confidence badge for ARV', () => {
      render(<EvaluationSection lead={mockLead} {...mockHandlers} />);

      // Look for confidence badge text (High/Medium/Low format)
      expect(screen.getByText(/AI - High Confidence/i)).toBeInTheDocument();
    });
  });

  describe('comparables section', () => {
    it('should render comparables section', () => {
      render(<EvaluationSection lead={mockLead} {...mockHandlers} />);

      // Comps are collapsed by default, look for the expand button
      expect(screen.getByText(/View.*Comps/i)).toBeInTheDocument();
    });

    it('should expand comps when button is clicked', () => {
      render(<EvaluationSection lead={mockLead} {...mockHandlers} />);

      const expandButton = screen.getByText(/View.*Comps/i);
      fireEvent.click(expandButton);

      // After expanding, should show comp addresses
      expect(screen.getByText('123 Oak St')).toBeInTheDocument();
    });
  });

  describe('null MAO handling', () => {
    it('should display N/A when MAO is null', () => {
      const leadNullMao = { ...mockLead, mao: null };
      render(<EvaluationSection lead={leadNullMao} {...mockHandlers} />);

      expect(screen.getByText('N/A')).toBeInTheDocument();
    });
  });

  describe('spread percentage colors', () => {
    // Note: Lower spread = better deal (listing price closer to MAO)
    it('should apply green color for excellent spread (<=5%)', () => {
      const excellentSpread = { ...mockLead, spreadPercent: 3 };
      render(<EvaluationSection lead={excellentSpread} {...mockHandlers} />);

      expect(screen.getByText('3% below asking')).toBeInTheDocument();
    });

    it('should apply yellow color for good spread (<=15%)', () => {
      const goodSpread = { ...mockLead, spreadPercent: 10 };
      render(<EvaluationSection lead={goodSpread} {...mockHandlers} />);

      expect(screen.getByText('10% below asking')).toBeInTheDocument();
    });

    it('should apply orange color for moderate spread (<=25%)', () => {
      const moderateSpread = { ...mockLead, spreadPercent: 20 };
      render(<EvaluationSection lead={moderateSpread} {...mockHandlers} />);

      expect(screen.getByText('20% below asking')).toBeInTheDocument();
    });

    it('should apply red color for high spread (>25%)', () => {
      const highSpread = { ...mockLead, spreadPercent: 35 };
      render(<EvaluationSection lead={highSpread} {...mockHandlers} />);

      expect(screen.getByText('35% below asking')).toBeInTheDocument();
    });
  });
});

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LeadDetailPanel } from '../LeadDetailPanel';
import { QueueLead } from '../../../../types/queue';

describe('LeadDetailPanel', () => {
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
    notes: 'Test notes',
    leadScore: 8,
    mao: 105000,
    spreadPercent: 30,
    neighborhoodGrade: 'B',
    status: 'New',
    lastContactDate: null,
    priority: 'high',
    timeSinceCreated: '2h ago',
  };

  const mockHandlers = {
    onClose: jest.fn(),
    onNavigatePrev: jest.fn(),
    onNavigateNext: jest.fn(),
    onSendMessage: jest.fn(),
    onStatusChange: jest.fn(),
    onAction: jest.fn(),
    onNotesChange: jest.fn(),
    onRetry: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('panel visibility', () => {
    it('should render when open is true', () => {
      render(
        <LeadDetailPanel
          open={true}
          lead={mockLead}
          {...mockHandlers}
        />
      );

      // Address appears in header and property details
      expect(screen.getAllByText('123 Main Street').length).toBeGreaterThanOrEqual(1);
    });

    it('should not render content when open is false', () => {
      render(
        <LeadDetailPanel
          open={false}
          lead={mockLead}
          {...mockHandlers}
        />
      );

      // MUI Drawer keeps content in DOM but hidden, so we check for visibility
      const drawer = screen.queryByRole('presentation');
      expect(drawer).not.toBeInTheDocument();
    });

    it('should show "No lead selected" when lead is null', () => {
      render(
        <LeadDetailPanel
          open={true}
          lead={null}
          {...mockHandlers}
        />
      );

      expect(screen.getByText('No lead selected')).toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    it('should display loading spinner when loading is true', () => {
      render(
        <LeadDetailPanel
          open={true}
          lead={null}
          loading={true}
          {...mockHandlers}
        />
      );

      expect(screen.getByText('Loading lead details...')).toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('should display error message when error is provided', () => {
      render(
        <LeadDetailPanel
          open={true}
          lead={null}
          error="Failed to load lead"
          {...mockHandlers}
        />
      );

      expect(screen.getByText('Failed to load lead')).toBeInTheDocument();
    });

    it('should display retry button when onRetry is provided', () => {
      render(
        <LeadDetailPanel
          open={true}
          lead={null}
          error="Failed to load lead"
          {...mockHandlers}
        />
      );

      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    it('should call onRetry when retry button is clicked', () => {
      render(
        <LeadDetailPanel
          open={true}
          lead={null}
          error="Failed to load lead"
          {...mockHandlers}
        />
      );

      fireEvent.click(screen.getByText('Retry'));
      expect(mockHandlers.onRetry).toHaveBeenCalledTimes(1);
    });
  });

  describe('header navigation', () => {
    it('should display address in header', () => {
      render(
        <LeadDetailPanel
          open={true}
          lead={mockLead}
          {...mockHandlers}
        />
      );

      // Address appears in multiple places (header and property details)
      expect(screen.getAllByText('123 Main Street').length).toBeGreaterThanOrEqual(1);
    });

    it('should display city, state, zip in header', () => {
      render(
        <LeadDetailPanel
          open={true}
          lead={mockLead}
          {...mockHandlers}
        />
      );

      expect(screen.getByText('San Antonio, TX, 78209')).toBeInTheDocument();
    });

    it('should call onClose when close button is clicked', () => {
      render(
        <LeadDetailPanel
          open={true}
          lead={mockLead}
          {...mockHandlers}
        />
      );

      fireEvent.click(screen.getByLabelText('Close panel'));
      expect(mockHandlers.onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onNavigatePrev when prev button is clicked', () => {
      render(
        <LeadDetailPanel
          open={true}
          lead={mockLead}
          isFirst={false}
          {...mockHandlers}
        />
      );

      fireEvent.click(screen.getByLabelText('Previous lead'));
      expect(mockHandlers.onNavigatePrev).toHaveBeenCalledTimes(1);
    });

    it('should call onNavigateNext when next button is clicked', () => {
      render(
        <LeadDetailPanel
          open={true}
          lead={mockLead}
          isLast={false}
          {...mockHandlers}
        />
      );

      fireEvent.click(screen.getByLabelText('Next lead'));
      expect(mockHandlers.onNavigateNext).toHaveBeenCalledTimes(1);
    });

    it('should disable prev button when isFirst is true', () => {
      render(
        <LeadDetailPanel
          open={true}
          lead={mockLead}
          isFirst={true}
          {...mockHandlers}
        />
      );

      expect(screen.getByLabelText('Previous lead')).toBeDisabled();
    });

    it('should disable next button when isLast is true', () => {
      render(
        <LeadDetailPanel
          open={true}
          lead={mockLead}
          isLast={true}
          {...mockHandlers}
        />
      );

      expect(screen.getByLabelText('Next lead')).toBeDisabled();
    });
  });

  describe('keyboard navigation', () => {
    it('should call onClose when Escape is pressed', () => {
      render(
        <LeadDetailPanel
          open={true}
          lead={mockLead}
          {...mockHandlers}
        />
      );

      fireEvent.keyDown(window, { key: 'Escape' });
      expect(mockHandlers.onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onNavigatePrev when k is pressed', () => {
      render(
        <LeadDetailPanel
          open={true}
          lead={mockLead}
          isFirst={false}
          {...mockHandlers}
        />
      );

      fireEvent.keyDown(window, { key: 'k' });
      expect(mockHandlers.onNavigatePrev).toHaveBeenCalledTimes(1);
    });

    it('should call onNavigateNext when j is pressed', () => {
      render(
        <LeadDetailPanel
          open={true}
          lead={mockLead}
          isLast={false}
          {...mockHandlers}
        />
      );

      fireEvent.keyDown(window, { key: 'j' });
      expect(mockHandlers.onNavigateNext).toHaveBeenCalledTimes(1);
    });

    it('should not call navigation when panel is closed', () => {
      render(
        <LeadDetailPanel
          open={false}
          lead={mockLead}
          {...mockHandlers}
        />
      );

      fireEvent.keyDown(window, { key: 'j' });
      fireEvent.keyDown(window, { key: 'k' });
      fireEvent.keyDown(window, { key: 'Escape' });

      expect(mockHandlers.onNavigateNext).not.toHaveBeenCalled();
      expect(mockHandlers.onNavigatePrev).not.toHaveBeenCalled();
      expect(mockHandlers.onClose).not.toHaveBeenCalled();
    });

    it('should not call onNavigatePrev when isFirst is true', () => {
      render(
        <LeadDetailPanel
          open={true}
          lead={mockLead}
          isFirst={true}
          {...mockHandlers}
        />
      );

      fireEvent.keyDown(window, { key: 'k' });
      expect(mockHandlers.onNavigatePrev).not.toHaveBeenCalled();
    });

    it('should not call onNavigateNext when isLast is true', () => {
      render(
        <LeadDetailPanel
          open={true}
          lead={mockLead}
          isLast={true}
          {...mockHandlers}
        />
      );

      fireEvent.keyDown(window, { key: 'j' });
      expect(mockHandlers.onNavigateNext).not.toHaveBeenCalled();
    });
  });

  describe('2x2 grid sections', () => {
    it('should render Property Details section', () => {
      render(
        <LeadDetailPanel
          open={true}
          lead={mockLead}
          {...mockHandlers}
        />
      );

      expect(screen.getByText('PROPERTY DETAILS')).toBeInTheDocument();
    });

    it('should render Evaluation section', () => {
      render(
        <LeadDetailPanel
          open={true}
          lead={mockLead}
          {...mockHandlers}
        />
      );

      expect(screen.getByText('EVALUATION')).toBeInTheDocument();
    });

    it('should render Messaging section', () => {
      render(
        <LeadDetailPanel
          open={true}
          lead={mockLead}
          {...mockHandlers}
        />
      );

      expect(screen.getByText('MESSAGING')).toBeInTheDocument();
    });

    it('should render Actions section', () => {
      render(
        <LeadDetailPanel
          open={true}
          lead={mockLead}
          {...mockHandlers}
        />
      );

      expect(screen.getByText('ACTIONS')).toBeInTheDocument();
    });
  });

  describe('keyboard shortcuts hint', () => {
    it('should display keyboard shortcuts hint', () => {
      render(
        <LeadDetailPanel
          open={true}
          lead={mockLead}
          {...mockHandlers}
        />
      );

      expect(screen.getByText(/Keyboard:/)).toBeInTheDocument();
      expect(screen.getByText(/Close \(ESC\)/)).toBeInTheDocument();
    });
  });
});

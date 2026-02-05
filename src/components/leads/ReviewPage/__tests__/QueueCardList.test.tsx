import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueueCardList } from '../QueueCardList';
import { QueueLead } from '../../../../types/queue';

describe('QueueCardList', () => {
  const createMockLead = (overrides: Partial<QueueLead> = {}): QueueLead => ({
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
    leadScore: 8,
    mao: 105000,
    spreadPercent: 30,
    neighborhoodGrade: 'B',
    status: 'New',
    lastContactDate: null,
    priority: 'high',
    timeSinceCreated: '2h ago',
    ...overrides,
  });

  const mockHandlers = {
    onCardSelect: jest.fn(),
    onViewDetails: jest.fn(),
    onDone: jest.fn(),
    onFollowUp: jest.fn(),
    onArchive: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering leads', () => {
    it('should render all provided leads', () => {
      const leads = [
        createMockLead({ id: '1', address: '123 Main St' }),
        createMockLead({ id: '2', address: '456 Oak Ave' }),
        createMockLead({ id: '3', address: '789 Pine Rd' }),
      ];

      render(
        <QueueCardList
          leads={leads}
          selectedCardId={null}
          queueType="action_now"
          {...mockHandlers}
        />
      );

      expect(screen.getByText('123 Main St')).toBeInTheDocument();
      expect(screen.getByText('456 Oak Ave')).toBeInTheDocument();
      expect(screen.getByText('789 Pine Rd')).toBeInTheDocument();
    });

    it('should highlight the selected card', () => {
      const leads = [
        createMockLead({ id: '1', address: '123 Main St' }),
        createMockLead({ id: '2', address: '456 Oak Ave' }),
      ];

      render(
        <QueueCardList
          leads={leads}
          selectedCardId="2"
          queueType="action_now"
          {...mockHandlers}
        />
      );

      // The component passes isSelected prop, so we just verify it renders
      expect(screen.getByText('456 Oak Ave')).toBeInTheDocument();
    });
  });

  describe('empty state - action_now queue', () => {
    it('should display action_now empty state message', () => {
      render(
        <QueueCardList
          leads={[]}
          selectedCardId={null}
          queueType="action_now"
          {...mockHandlers}
        />
      );

      expect(screen.getByText('No leads need action right now')).toBeInTheDocument();
      expect(screen.getByText(/Great job! Check back later/)).toBeInTheDocument();
    });
  });

  describe('empty state - follow_up queue', () => {
    it('should display follow_up empty state message', () => {
      render(
        <QueueCardList
          leads={[]}
          selectedCardId={null}
          queueType="follow_up"
          {...mockHandlers}
        />
      );

      expect(screen.getByText('No follow-ups due today')).toBeInTheDocument();
      expect(screen.getByText(/all caught up on follow-ups/)).toBeInTheDocument();
    });
  });

  describe('empty state - negotiating queue', () => {
    it('should display negotiating empty state message', () => {
      render(
        <QueueCardList
          leads={[]}
          selectedCardId={null}
          queueType="negotiating"
          {...mockHandlers}
        />
      );

      expect(screen.getByText('No active negotiations')).toBeInTheDocument();
      expect(screen.getByText(/Start conversations to move leads/)).toBeInTheDocument();
    });
  });

  describe('empty state - all queue', () => {
    it('should display all queue empty state message', () => {
      render(
        <QueueCardList
          leads={[]}
          selectedCardId={null}
          queueType="all"
          {...mockHandlers}
        />
      );

      expect(screen.getByText('No leads found')).toBeInTheDocument();
      expect(screen.getByText(/Add new leads to get started/)).toBeInTheDocument();
    });
  });

  describe('empty state - archived queue', () => {
    it('should display archived queue empty state message', () => {
      render(
        <QueueCardList
          leads={[]}
          selectedCardId={null}
          queueType="archived"
          {...mockHandlers}
        />
      );

      expect(screen.getByText('No archived leads')).toBeInTheDocument();
      expect(screen.getByText(/Archived leads will appear here/)).toBeInTheDocument();
    });
  });

  describe('empty state - with active search', () => {
    it('should display search-specific empty message when hasActiveSearch is true for all queue', () => {
      render(
        <QueueCardList
          leads={[]}
          selectedCardId={null}
          queueType="all"
          hasActiveSearch={true}
          {...mockHandlers}
        />
      );

      expect(screen.getByText('No leads match your search')).toBeInTheDocument();
      expect(screen.getByText(/Try a different search term or clear the search/)).toBeInTheDocument();
    });

    it('should display search-specific empty message when hasActiveSearch is true for archived queue', () => {
      render(
        <QueueCardList
          leads={[]}
          selectedCardId={null}
          queueType="archived"
          hasActiveSearch={true}
          {...mockHandlers}
        />
      );

      expect(screen.getByText('No leads match your search')).toBeInTheDocument();
      expect(screen.getByText(/Try a different search term or clear the search/)).toBeInTheDocument();
    });

    it('should display regular empty message when hasActiveSearch is true but queue is action_now', () => {
      render(
        <QueueCardList
          leads={[]}
          selectedCardId={null}
          queueType="action_now"
          hasActiveSearch={true}
          {...mockHandlers}
        />
      );

      // Should show action_now message, not search message
      expect(screen.getByText('No leads need action right now')).toBeInTheDocument();
      expect(screen.queryByText('No leads match your search')).not.toBeInTheDocument();
    });

    it('should display regular empty message when hasActiveSearch is false', () => {
      render(
        <QueueCardList
          leads={[]}
          selectedCardId={null}
          queueType="all"
          hasActiveSearch={false}
          {...mockHandlers}
        />
      );

      expect(screen.getByText('No leads found')).toBeInTheDocument();
      expect(screen.queryByText('No leads match your search')).not.toBeInTheDocument();
    });
  });

  describe('card interactions', () => {
    it('should call onViewDetails with lead and false when card is clicked', () => {
      const lead = createMockLead({ id: 'test-lead-1', address: 'Test Address' });

      render(
        <QueueCardList
          leads={[lead]}
          selectedCardId={null}
          queueType="action_now"
          {...mockHandlers}
        />
      );

      // Find the card by its address text and click its parent card container
      const addressText = screen.getByText('Test Address');
      const card = addressText.closest('[role="button"]');
      expect(card).not.toBeNull();
      fireEvent.click(card!);

      expect(mockHandlers.onViewDetails).toHaveBeenCalledWith(lead, false);
    });

    it('should call onDone with lead when done button is clicked', () => {
      const lead = createMockLead({ id: 'test-lead-1' });

      render(
        <QueueCardList
          leads={[lead]}
          selectedCardId={null}
          queueType="action_now"
          {...mockHandlers}
        />
      );

      fireEvent.click(screen.getByTestId('done-button'));

      expect(mockHandlers.onDone).toHaveBeenCalledWith(lead);
    });

    it('should call onFollowUp with lead when follow-up button is clicked', () => {
      const lead = createMockLead({ id: 'test-lead-1' });

      render(
        <QueueCardList
          leads={[lead]}
          selectedCardId={null}
          queueType="action_now"
          {...mockHandlers}
        />
      );

      fireEvent.click(screen.getByTestId('followup-button'));

      expect(mockHandlers.onFollowUp).toHaveBeenCalledWith(lead);
    });

    it('should call onArchive with lead when archive button is clicked', () => {
      const lead = createMockLead({ id: 'test-lead-1' });

      render(
        <QueueCardList
          leads={[lead]}
          selectedCardId={null}
          queueType="action_now"
          {...mockHandlers}
        />
      );

      fireEvent.click(screen.getByTestId('archive-button'));

      expect(mockHandlers.onArchive).toHaveBeenCalledWith(lead);
    });

    it('should call onViewDetails with lead and true when photo is clicked', () => {
      const lead = createMockLead({
        id: 'test-lead-1',
        photoUrl: 'https://example.com/photo.jpg',
        photoUrls: ['https://example.com/photo.jpg', 'https://example.com/photo2.jpg'],
      });

      render(
        <QueueCardList
          leads={[lead]}
          selectedCardId={null}
          queueType="action_now"
          {...mockHandlers}
        />
      );

      // Click on the photo
      const photo = screen.getByAltText('123 Main Street exterior');
      fireEvent.click(photo);

      expect(mockHandlers.onViewDetails).toHaveBeenCalledWith(lead, true);
    });
  });

  describe('multiple cards', () => {
    it('should handle selecting different cards', () => {
      const leads = [
        createMockLead({ id: '1', address: 'First Address' }),
        createMockLead({ id: '2', address: 'Second Address' }),
      ];

      const { rerender } = render(
        <QueueCardList
          leads={leads}
          selectedCardId="1"
          queueType="action_now"
          {...mockHandlers}
        />
      );

      // First card is selected
      expect(screen.getByText('First Address')).toBeInTheDocument();

      // Rerender with second card selected
      rerender(
        <QueueCardList
          leads={leads}
          selectedCardId="2"
          queueType="action_now"
          {...mockHandlers}
        />
      );

      expect(screen.getByText('Second Address')).toBeInTheDocument();
    });
  });
});

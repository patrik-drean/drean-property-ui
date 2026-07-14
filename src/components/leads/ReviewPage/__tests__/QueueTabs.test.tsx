import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueueTabs } from '../QueueTabs';
import { QueueCounts } from '../../../../types/queue';

describe('QueueTabs', () => {
  const defaultCounts: QueueCounts = {
    action_now: 5,
    follow_up: 3,
    negotiating: 2,
    all: 15,
    archived: 0,
  };

  const mockOnQueueChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render all four tabs', () => {
      render(
        <QueueTabs
          selectedQueue="action_now"
          onQueueChange={mockOnQueueChange}
          counts={defaultCounts}
        />
      );

      expect(screen.getByText('Action Now')).toBeInTheDocument();
      expect(screen.getByText('Follow-Up Today')).toBeInTheDocument();
      expect(screen.getByText('Negotiating')).toBeInTheDocument();
      expect(screen.getByText(/All Leads/)).toBeInTheDocument();
    });

    it('should display badge counts for each tab', () => {
      render(
        <QueueTabs
          selectedQueue="action_now"
          onQueueChange={mockOnQueueChange}
          counts={defaultCounts}
        />
      );

      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText(/15/)).toBeInTheDocument();
    });

    it('should show correct tab as selected', () => {
      render(
        <QueueTabs
          selectedQueue="follow_up"
          onQueueChange={mockOnQueueChange}
          counts={defaultCounts}
        />
      );

      const followUpTab = screen.getByRole('tab', { name: /Follow-up Today queue/i });
      expect(followUpTab).toHaveAttribute('aria-selected', 'true');
    });

    it('should have aria-labels for accessibility', () => {
      render(
        <QueueTabs
          selectedQueue="action_now"
          onQueueChange={mockOnQueueChange}
          counts={defaultCounts}
        />
      );

      expect(screen.getByLabelText(/Action Now queue with 5 leads/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Follow-up Today queue with 3 leads/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Negotiating queue with 2 leads/)).toBeInTheDocument();
      expect(screen.getByLabelText(/All leads with 15 total/)).toBeInTheDocument();
    });
  });

  describe('tab selection', () => {
    it('should call onQueueChange when a tab is clicked', () => {
      render(
        <QueueTabs
          selectedQueue="action_now"
          onQueueChange={mockOnQueueChange}
          counts={defaultCounts}
        />
      );

      const followUpTab = screen.getByRole('tab', { name: /Follow-up Today/i });
      fireEvent.click(followUpTab);

      expect(mockOnQueueChange).toHaveBeenCalledWith('follow_up');
    });

  });

  describe('zero counts', () => {
    it('should display zero counts correctly', () => {
      const zeroCounts: QueueCounts = {
        action_now: 0,
        follow_up: 0,
        negotiating: 0,
        all: 0,
        archived: 0,
      };

      render(
        <QueueTabs
          selectedQueue="action_now"
          onQueueChange={mockOnQueueChange}
          counts={zeroCounts}
        />
      );

      // Should have zeros in badges (3 color badges) and one in "All Leads (0)"
      const zeros = screen.getAllByText('0');
      expect(zeros.length).toBe(3); // 3 colored badges have separate "0" text

      // All Leads tab displays count differently: "All Leads (0)"
      expect(screen.getByText(/All Leads \(0\)/)).toBeInTheDocument();
    });
  });
});

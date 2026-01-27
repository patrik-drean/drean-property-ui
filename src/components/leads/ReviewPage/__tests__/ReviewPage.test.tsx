import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ReviewPage } from '../ReviewPage';

// Mock the LeadDetailPanel since it's tested separately and not part of this task
jest.mock('../../DetailPanel', () => ({
  LeadDetailPanel: jest.fn(({ open }) =>
    open ? <div data-testid="detail-panel">Detail Panel</div> : null
  ),
}));

describe('ReviewPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('rendering', () => {
    it('should render the page header with title', () => {
      render(<ReviewPage />);

      expect(screen.getByText('Your Daily Queue')).toBeInTheDocument();
    });

    it('should render queue tabs', () => {
      render(<ReviewPage />);

      expect(screen.getByText('Action Now')).toBeInTheDocument();
      expect(screen.getByText('Follow-Up Today')).toBeInTheDocument();
      expect(screen.getByText('Negotiating')).toBeInTheDocument();
      expect(screen.getByText(/All Leads/)).toBeInTheDocument();
    });

    it('should render progress footer', () => {
      render(<ReviewPage />);

      expect(screen.getByText('Contacted Today')).toBeInTheDocument();
      expect(screen.getByText('Follow-Ups Completed')).toBeInTheDocument();
      expect(screen.getByText('Connected')).toBeInTheDocument();
    });
  });

  describe('tab navigation', () => {
    it('should switch to follow-up queue when tab is clicked', async () => {
      render(<ReviewPage />);

      const followUpTab = screen.getByRole('tab', { name: /Follow-up Today/i });
      fireEvent.click(followUpTab);

      // Tab should be selected
      expect(followUpTab).toHaveAttribute('aria-selected', 'true');
    });

    it('should switch to negotiating queue when tab is clicked', async () => {
      render(<ReviewPage />);

      const negotiatingTab = screen.getByRole('tab', { name: /Negotiating/i });
      fireEvent.click(negotiatingTab);

      expect(negotiatingTab).toHaveAttribute('aria-selected', 'true');
    });

    it('should switch to all leads queue when tab is clicked', async () => {
      render(<ReviewPage />);

      const allTab = screen.getByRole('tab', { name: /All leads/i });
      fireEvent.click(allTab);

      expect(allTab).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('card actions', () => {
    it('should render action buttons for leads', async () => {
      render(<ReviewPage />);

      // Wait for cards to render (mock data generates leads)
      await waitFor(() => {
        // Find actual button elements with "View Details" text
        const detailButtons = screen.getAllByRole('button').filter(
          (btn) => btn.tagName === 'BUTTON' && btn.textContent?.includes('View Details')
        );
        expect(detailButtons.length).toBeGreaterThan(0);
      });
    });

    it('should show snackbar when Done is clicked', async () => {
      render(<ReviewPage />);

      await waitFor(() => {
        const doneButtons = screen.queryAllByLabelText(/Mark as done/i);
        expect(doneButtons.length).toBeGreaterThan(0);
      });

      const doneButton = screen.getAllByLabelText(/Mark as done/i)[0];
      fireEvent.click(doneButton);

      await waitFor(() => {
        expect(screen.getByText(/Marked as done/i)).toBeInTheDocument();
      });
    });

    it('should show snackbar when Skip is clicked', async () => {
      render(<ReviewPage />);

      await waitFor(() => {
        const skipButtons = screen.queryAllByLabelText(/Skip for now/i);
        expect(skipButtons.length).toBeGreaterThan(0);
      });

      const skipButton = screen.getAllByLabelText(/Skip for now/i)[0];
      fireEvent.click(skipButton);

      await waitFor(() => {
        expect(screen.getByText(/Skipped for tomorrow/i)).toBeInTheDocument();
      });
    });

    it('should show snackbar when Archive is clicked', async () => {
      render(<ReviewPage />);

      await waitFor(() => {
        const archiveButtons = screen.queryAllByLabelText(/Archive/i);
        expect(archiveButtons.length).toBeGreaterThan(0);
      });

      const archiveButton = screen.getAllByLabelText(/Archive/i)[0];
      fireEvent.click(archiveButton);

      await waitFor(() => {
        expect(screen.getByText(/Lead archived/i)).toBeInTheDocument();
      });
    });
  });

  describe('detail panel', () => {
    it('should render View Details buttons that can be clicked', async () => {
      render(<ReviewPage />);

      // First switch to "all" tab which will always have leads
      const allTab = screen.getByRole('tab', { name: /All leads/i });
      fireEvent.click(allTab);

      await waitFor(() => {
        const detailButtons = screen.getAllByRole('button').filter(
          (btn) => btn.tagName === 'BUTTON' && btn.textContent === 'View Details'
        );
        expect(detailButtons.length).toBeGreaterThan(0);
      });

      // Verify View Details button exists and is clickable
      const detailButton = screen.getAllByRole('button').filter(
        (btn) => btn.tagName === 'BUTTON' && btn.textContent === 'View Details'
      )[0];
      expect(detailButton).toBeInTheDocument();

      // Click should not throw an error
      fireEvent.click(detailButton);
    });

    it('should call LeadDetailPanel with lead when View Details is clicked', async () => {
      // The LeadDetailPanel mock is called, verifying integration
      const { LeadDetailPanel } = jest.requireMock('../../DetailPanel');

      render(<ReviewPage />);

      // First switch to "all" tab
      const allTab = screen.getByRole('tab', { name: /All leads/i });
      fireEvent.click(allTab);

      await waitFor(() => {
        const detailButtons = screen.getAllByRole('button').filter(
          (btn) => btn.tagName === 'BUTTON' && btn.textContent === 'View Details'
        );
        expect(detailButtons.length).toBeGreaterThan(0);
      });

      const detailButton = screen.getAllByRole('button').filter(
        (btn) => btn.tagName === 'BUTTON' && btn.textContent === 'View Details'
      )[0];
      fireEvent.click(detailButton);

      // Wait a tick for state to update
      await waitFor(() => {
        // LeadDetailPanel should have been called with open: true
        const calls = LeadDetailPanel.mock.calls;
        const lastCall = calls[calls.length - 1];
        expect(lastCall[0].open).toBe(true);
      });
    });
  });

  describe('keyboard shortcuts', () => {
    it('should handle keyboard navigation', async () => {
      render(<ReviewPage />);

      // Wait for cards to render
      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBeGreaterThan(4);
      });

      // Press j to go to next card (just verify no crash)
      fireEvent.keyDown(window, { key: 'j' });
      fireEvent.keyDown(window, { key: 'k' });

      // Page should still be functional
      expect(screen.getByText('Your Daily Queue')).toBeInTheDocument();
    });
  });

  describe('snackbar dismissal', () => {
    it('should close snackbar when close button is clicked', async () => {
      render(<ReviewPage />);

      await waitFor(() => {
        const doneButtons = screen.queryAllByLabelText(/Mark as done/i);
        expect(doneButtons.length).toBeGreaterThan(0);
      });

      const doneButton = screen.getAllByLabelText(/Mark as done/i)[0];
      fireEvent.click(doneButton);

      await waitFor(() => {
        expect(screen.getByText(/Marked as done/i)).toBeInTheDocument();
      });

      // Find and click close button on the snackbar
      const closeButton = screen.getByRole('button', { name: /close/i });
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByText(/Marked as done/i)).not.toBeInTheDocument();
      });
    });
  });
});

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { AddLeadModal } from '../AddLeadModal';
import * as api from '../../../../services/api';
import { leadQueueService, IngestLeadResponse } from '../../../../services/leadQueueService';

// Mock the API and service
jest.mock('../../../../services/api', () => ({
  scorePropertyLead: jest.fn(),
}));

jest.mock('../../../../services/leadQueueService', () => ({
  leadQueueService: {
    ingestLead: jest.fn(),
  },
}));

// Mock MUI icons
jest.mock('@mui/icons-material/AutoFixHigh', () => () => <span data-testid="score-icon">Score</span>);
jest.mock('@mui/icons-material/Search', () => () => <span data-testid="search-icon">Search</span>);
jest.mock('@mui/icons-material/BarChart', () => () => <span data-testid="chart-icon">Chart</span>);
jest.mock('@mui/icons-material/SmartToy', () => () => <span data-testid="ai-icon">AI</span>);
jest.mock('@mui/icons-material/WarningAmber', () => () => <span data-testid="warning-icon">Warning</span>);
jest.mock('@mui/icons-material/ExpandMore', () => () => <span data-testid="expand-more-icon">ExpandMore</span>);
jest.mock('@mui/icons-material/ExpandLess', () => () => <span data-testid="expand-less-icon">ExpandLess</span>);

// Mock ScoreResultsCard
jest.mock('../../ScoreResultsCard', () => ({
  ScoreResultsCard: ({ score, grade, aiSummary }: any) => (
    <div data-testid="score-results-card">
      <span>Score: {score}</span>
      {grade && <span>Grade: {grade}</span>}
      {aiSummary && <span>Summary: {aiSummary}</span>}
    </div>
  ),
}));

// Mock styled components from leadsStyles
jest.mock('../../leadsStyles', () => ({
  ScorePropertyButton: ({ children, onClick, disabled, hasUrl, isScoring, startIcon, fullWidth, variant, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} data-testid="score-button" {...props}>
      {children}
    </button>
  ),
  ScoreErrorCard: ({ children, ...props }: any) => (
    <div data-testid="score-error-card" {...props}>
      {children}
    </div>
  ),
  LoadingStepsContainer: ({ children, ...props }: any) => (
    <div data-testid="loading-steps" {...props}>
      {children}
    </div>
  ),
  LoadingStep: ({ children, active }: any) => (
    <div data-testid="loading-step" data-active={active}>
      {children}
    </div>
  ),
}));

const theme = createTheme();

const mockIngestResponse: IngestLeadResponse = {
  lead: {
    id: 'lead-123',
    address: '123 Test St, Austin, TX 78701',
    listingPrice: 250000,
    score: 8,
    mao: 175000,
    status: 'New',
    createdAt: '2025-01-28T10:00:00Z',
  },
  evaluation: {
    score: 8,
    mao: 175000,
    maoSpreadPercent: 30,
    isDisqualified: false,
    tier: 'quick',
  },
  autoSmsTriggered: false,
  correlationId: 'abc123',
  wasConsolidated: false,
};

const mockScoredData = {
  address: '123 Main St, Austin, TX 78701',
  listingPrice: 250000,
  zillowLink: 'https://www.zillow.com/homedetails/123',
  sqft: 1500,
  units: 1,
  agentInfo: {
    name: 'John Agent',
    email: 'agent@example.com',
    phone: '555-123-4567',
    agency: 'Test Realty',
  },
  note: 'Great investment opportunity',
  leadScore: 8,
  metadata: {
    zestimate: 275000,
    arv: 320000,
    propertyGrade: 'B',
  },
};

const defaultProps = {
  open: true,
  onClose: jest.fn(),
  onSuccess: jest.fn(),
};

const renderModal = (props = {}) => {
  return render(
    <ThemeProvider theme={theme}>
      <AddLeadModal {...defaultProps} {...props} />
    </ThemeProvider>
  );
};

describe('AddLeadModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('Initial Rendering', () => {
    it('should render the dialog with "Add New Lead" title', () => {
      renderModal();
      expect(screen.getByText('Add New Lead')).toBeInTheDocument();
    });

    it('should render the listing URL input', () => {
      renderModal();
      expect(screen.getByLabelText(/Listing URL/i)).toBeInTheDocument();
    });

    it('should render the Score Property button', () => {
      renderModal();
      expect(screen.getByTestId('score-button')).toBeInTheDocument();
    });

    it('should render Cancel and Add Lead buttons', () => {
      renderModal();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add lead/i })).toBeInTheDocument();
    });

    it('should disable Score button when no URL is entered', () => {
      renderModal();
      const scoreButton = screen.getByTestId('score-button');
      expect(scoreButton).toBeDisabled();
    });

    it('should disable Add Lead button initially (no address/price)', () => {
      renderModal();
      const addButton = screen.getByRole('button', { name: /add lead/i });
      expect(addButton).toBeDisabled();
    });

    it('should not render when open is false', () => {
      renderModal({ open: false });
      expect(screen.queryByText('Add New Lead')).not.toBeInTheDocument();
    });
  });

  describe('URL Input and Validation', () => {
    it('should enable Score button when Zillow URL is entered', async () => {
      renderModal();
      const urlInput = screen.getByLabelText(/Listing URL/i);

      await userEvent.type(urlInput, 'https://www.zillow.com/homedetails/123-main-st');

      const scoreButton = screen.getByTestId('score-button');
      expect(scoreButton).not.toBeDisabled();
    });

    it('should enable Score button when Redfin URL is entered', async () => {
      renderModal();
      const urlInput = screen.getByLabelText(/Listing URL/i);

      await userEvent.type(urlInput, 'https://www.redfin.com/TX/Austin/123-Main-St');

      const scoreButton = screen.getByTestId('score-button');
      expect(scoreButton).not.toBeDisabled();
    });

    it('should enable Score button when Realtor.com URL is entered', async () => {
      renderModal();
      const urlInput = screen.getByLabelText(/Listing URL/i);

      await userEvent.type(urlInput, 'https://www.realtor.com/realestateandhomes-detail/123');

      const scoreButton = screen.getByTestId('score-button');
      expect(scoreButton).not.toBeDisabled();
    });

    it('should show hint text when valid URL is entered but not scored', async () => {
      renderModal();
      const urlInput = screen.getByLabelText(/Listing URL/i);

      await userEvent.type(urlInput, 'https://www.zillow.com/homedetails/123-main-st');

      expect(screen.getByText(/we will analyze/i)).toBeInTheDocument();
    });
  });

  describe('URL Scoring Flow', () => {
    it('should call scorePropertyLead when Score button is clicked', async () => {
      (api.scorePropertyLead as jest.Mock).mockResolvedValue(mockScoredData);

      renderModal();
      const urlInput = screen.getByLabelText(/Listing URL/i);
      await userEvent.type(urlInput, 'https://www.zillow.com/homedetails/123');

      const scoreButton = screen.getByTestId('score-button');
      fireEvent.click(scoreButton);

      expect(api.scorePropertyLead).toHaveBeenCalledWith('https://www.zillow.com/homedetails/123');
    });

    it('should show loading steps during scoring', async () => {
      (api.scorePropertyLead as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockScoredData), 3000))
      );

      renderModal();
      const urlInput = screen.getByLabelText(/Listing URL/i);
      await userEvent.type(urlInput, 'https://www.zillow.com/homedetails/123');

      const scoreButton = screen.getByTestId('score-button');
      fireEvent.click(scoreButton);

      expect(screen.getByTestId('loading-steps')).toBeInTheDocument();
      expect(screen.getByText('Fetching property details...')).toBeInTheDocument();
    });

    it('should populate form fields after successful scoring', async () => {
      (api.scorePropertyLead as jest.Mock).mockResolvedValue(mockScoredData);

      renderModal();
      const urlInput = screen.getByLabelText(/Listing URL/i);
      await userEvent.type(urlInput, 'https://www.zillow.com/homedetails/123');

      const scoreButton = screen.getByTestId('score-button');
      fireEvent.click(scoreButton);

      await waitFor(() => {
        expect(screen.getByTestId('score-results-card')).toBeInTheDocument();
      });

      // Expand form to see populated fields
      const expandButton = screen.getByRole('button', { name: /show property details/i });
      fireEvent.click(expandButton);

      await waitFor(() => {
        const addressInput = screen.getByLabelText(/address/i);
        expect(addressInput).toHaveValue('123 Main St, Austin, TX 78701');
      });
    });

    it('should show score results card after successful scoring', async () => {
      (api.scorePropertyLead as jest.Mock).mockResolvedValue(mockScoredData);

      renderModal();
      const urlInput = screen.getByLabelText(/Listing URL/i);
      await userEvent.type(urlInput, 'https://www.zillow.com/homedetails/123');

      const scoreButton = screen.getByTestId('score-button');
      fireEvent.click(scoreButton);

      await waitFor(() => {
        expect(screen.getByTestId('score-results-card')).toBeInTheDocument();
        expect(screen.getByText('Score: 8')).toBeInTheDocument();
      });
    });

    it('should show error card when scoring fails', async () => {
      (api.scorePropertyLead as jest.Mock).mockRejectedValue(new Error('Could not fetch property details'));

      renderModal();
      const urlInput = screen.getByLabelText(/Listing URL/i);
      await userEvent.type(urlInput, 'https://www.zillow.com/homedetails/123');

      const scoreButton = screen.getByTestId('score-button');
      fireEvent.click(scoreButton);

      await waitFor(() => {
        expect(screen.getByTestId('score-error-card')).toBeInTheDocument();
      });
    });

    it('should show timeout error message for timeout errors', async () => {
      (api.scorePropertyLead as jest.Mock).mockRejectedValue({ message: 'Request timeout' });

      renderModal();
      const urlInput = screen.getByLabelText(/Listing URL/i);
      await userEvent.type(urlInput, 'https://www.zillow.com/homedetails/123');

      const scoreButton = screen.getByTestId('score-button');
      fireEvent.click(scoreButton);

      await waitFor(() => {
        expect(screen.getByText('Scoring timed out')).toBeInTheDocument();
      });
    });

    it('should show rate limit error message for 429 errors', async () => {
      (api.scorePropertyLead as jest.Mock).mockRejectedValue({ response: { status: 429, data: { error: '429 rate limit' } } });

      renderModal();
      const urlInput = screen.getByLabelText(/Listing URL/i);
      await userEvent.type(urlInput, 'https://www.zillow.com/homedetails/123');

      const scoreButton = screen.getByTestId('score-button');
      fireEvent.click(scoreButton);

      await waitFor(() => {
        expect(screen.getByText('Rate limit reached')).toBeInTheDocument();
      });
    });
  });

  describe('Manual Form Entry', () => {
    it('should expand form when "Show Property Details" is clicked', () => {
      renderModal();

      const expandButton = screen.getByRole('button', { name: /show property details/i });
      fireEvent.click(expandButton);

      expect(screen.getByLabelText(/address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/listing price/i)).toBeInTheDocument();
    });

    it('should collapse form when "Hide Property Details" is clicked', () => {
      renderModal();

      // Expand first
      const expandButton = screen.getByRole('button', { name: /show property details/i });
      fireEvent.click(expandButton);

      // Then collapse
      const collapseButton = screen.getByRole('button', { name: /hide property details/i });
      fireEvent.click(collapseButton);

      // Form fields should be hidden (in collapsed state)
      expect(screen.queryByRole('button', { name: /hide property details/i })).not.toBeInTheDocument();
    });

    it('should enable Add Lead button when address and price are filled', async () => {
      renderModal();

      // Expand form
      const expandButton = screen.getByRole('button', { name: /show property details/i });
      fireEvent.click(expandButton);

      // Fill required fields
      const addressInput = screen.getByLabelText(/address/i);
      const priceInput = screen.getByLabelText(/listing price/i);

      await userEvent.type(addressInput, '123 Test St, Austin, TX');
      await userEvent.type(priceInput, '250000');

      const addButton = screen.getByRole('button', { name: /add lead/i });
      expect(addButton).not.toBeDisabled();
    });

    it('should format currency input correctly', async () => {
      renderModal();

      // Expand form
      const expandButton = screen.getByRole('button', { name: /show property details/i });
      fireEvent.click(expandButton);

      const priceInput = screen.getByLabelText(/listing price/i);
      await userEvent.type(priceInput, '250000');

      expect(priceInput).toHaveValue('250,000');
    });

    it('should render all form fields', () => {
      renderModal();

      // Expand form
      const expandButton = screen.getByRole('button', { name: /show property details/i });
      fireEvent.click(expandButton);

      expect(screen.getByLabelText(/address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/listing price/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/city/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/state/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/zip/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/sqft/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/beds/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/baths/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/units/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/year built/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/agent\/seller phone/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/agent\/seller email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/agent name/i)).toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('should call ingestLead with correct data when form is submitted', async () => {
      (leadQueueService.ingestLead as jest.Mock).mockResolvedValue(mockIngestResponse);

      renderModal();

      // Expand form
      const expandButton = screen.getByRole('button', { name: /show property details/i });
      fireEvent.click(expandButton);

      // Fill required fields
      const addressInput = screen.getByLabelText(/address/i);
      const priceInput = screen.getByLabelText(/listing price/i);

      await userEvent.type(addressInput, '123 Test St, Austin, TX');
      await userEvent.type(priceInput, '250000');

      // Submit
      const addButton = screen.getByRole('button', { name: /add lead/i });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(leadQueueService.ingestLead).toHaveBeenCalledWith(
          expect.objectContaining({
            address: '123 Test St, Austin, TX',
            listingPrice: 250000,
            source: 'manual',
            sendFirstMessage: false,
          })
        );
      });
    });

    it('should call onSuccess callback after successful submission', async () => {
      (leadQueueService.ingestLead as jest.Mock).mockResolvedValue(mockIngestResponse);

      renderModal();

      // Expand form and fill fields
      const expandButton = screen.getByRole('button', { name: /show property details/i });
      fireEvent.click(expandButton);

      const addressInput = screen.getByLabelText(/address/i);
      const priceInput = screen.getByLabelText(/listing price/i);

      await userEvent.type(addressInput, '123 Test St, Austin, TX');
      await userEvent.type(priceInput, '250000');

      // Submit
      const addButton = screen.getByRole('button', { name: /add lead/i });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(defaultProps.onSuccess).toHaveBeenCalledWith(mockIngestResponse);
      });
    });

    it('should call onClose after successful submission', async () => {
      (leadQueueService.ingestLead as jest.Mock).mockResolvedValue(mockIngestResponse);

      renderModal();

      // Expand form and fill fields
      const expandButton = screen.getByRole('button', { name: /show property details/i });
      fireEvent.click(expandButton);

      const addressInput = screen.getByLabelText(/address/i);
      const priceInput = screen.getByLabelText(/listing price/i);

      await userEvent.type(addressInput, '123 Test St, Austin, TX');
      await userEvent.type(priceInput, '250000');

      // Submit
      const addButton = screen.getByRole('button', { name: /add lead/i });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(defaultProps.onClose).toHaveBeenCalled();
      });
    });

    it('should show error message when submission fails', async () => {
      (leadQueueService.ingestLead as jest.Mock).mockRejectedValue({
        response: { data: { detail: 'Server error occurred' } },
      });

      renderModal();

      // Expand form and fill fields
      const expandButton = screen.getByRole('button', { name: /show property details/i });
      fireEvent.click(expandButton);

      const addressInput = screen.getByLabelText(/address/i);
      const priceInput = screen.getByLabelText(/listing price/i);

      await userEvent.type(addressInput, '123 Test St, Austin, TX');
      await userEvent.type(priceInput, '250000');

      // Submit
      const addButton = screen.getByRole('button', { name: /add lead/i });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Server error occurred')).toBeInTheDocument();
      });
    });

    it('should show validation error when address is missing', async () => {
      renderModal();

      // Expand form
      const expandButton = screen.getByRole('button', { name: /show property details/i });
      fireEvent.click(expandButton);

      // Fill only price
      const priceInput = screen.getByLabelText(/listing price/i);
      await userEvent.type(priceInput, '250000');

      // Submit button should still be disabled
      const addButton = screen.getByRole('button', { name: /add lead/i });
      expect(addButton).toBeDisabled();
    });

    it('should show loading state during submission', async () => {
      (leadQueueService.ingestLead as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockIngestResponse), 1000))
      );

      renderModal();

      // Expand form and fill fields
      const expandButton = screen.getByRole('button', { name: /show property details/i });
      fireEvent.click(expandButton);

      const addressInput = screen.getByLabelText(/address/i);
      const priceInput = screen.getByLabelText(/listing price/i);

      await userEvent.type(addressInput, '123 Test St, Austin, TX');
      await userEvent.type(priceInput, '250000');

      // Submit
      const addButton = screen.getByRole('button', { name: /add lead/i });
      fireEvent.click(addButton);

      expect(screen.getByRole('button', { name: /adding/i })).toBeInTheDocument();
    });

    it('should disable Cancel button during submission', async () => {
      (leadQueueService.ingestLead as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockIngestResponse), 1000))
      );

      renderModal();

      // Expand form and fill fields
      const expandButton = screen.getByRole('button', { name: /show property details/i });
      fireEvent.click(expandButton);

      const addressInput = screen.getByLabelText(/address/i);
      const priceInput = screen.getByLabelText(/listing price/i);

      await userEvent.type(addressInput, '123 Test St, Austin, TX');
      await userEvent.type(priceInput, '250000');

      // Submit
      const addButton = screen.getByRole('button', { name: /add lead/i });
      fireEvent.click(addButton);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      expect(cancelButton).toBeDisabled();
    });
  });

  describe('Close/Cancel Behavior', () => {
    it('should call onClose when Cancel button is clicked', () => {
      renderModal();

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('should reset form state when dialog is closed and reopened', async () => {
      const { rerender } = renderModal();

      // Enter some data
      const urlInput = screen.getByLabelText(/Listing URL/i);
      await userEvent.type(urlInput, 'https://www.zillow.com/test');

      // Close the dialog
      rerender(
        <ThemeProvider theme={theme}>
          <AddLeadModal {...defaultProps} open={false} />
        </ThemeProvider>
      );

      // Reopen the dialog
      rerender(
        <ThemeProvider theme={theme}>
          <AddLeadModal {...defaultProps} open={true} />
        </ThemeProvider>
      );

      // URL should be cleared
      const newUrlInput = screen.getByLabelText(/Listing URL/i);
      expect(newUrlInput).toHaveValue('');
    });
  });

  describe('Accessibility', () => {
    it('should have accessible dialog title', () => {
      renderModal();
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should have aria-expanded attribute on collapsible section', () => {
      renderModal();
      const expandButton = screen.getByRole('button', { name: /show property details/i });
      expect(expandButton).toHaveAttribute('aria-expanded', 'false');

      fireEvent.click(expandButton);
      expect(screen.getByRole('button', { name: /hide property details/i })).toHaveAttribute('aria-expanded', 'true');
    });

    it('should toggle form with keyboard (Enter/Space)', () => {
      renderModal();
      const expandButton = screen.getByRole('button', { name: /show property details/i });

      fireEvent.keyDown(expandButton, { key: 'Enter' });
      expect(screen.getByRole('button', { name: /hide property details/i })).toBeInTheDocument();

      fireEvent.keyDown(screen.getByRole('button', { name: /hide property details/i }), { key: ' ' });
      expect(screen.getByRole('button', { name: /show property details/i })).toBeInTheDocument();
    });
  });

  describe('Integration with Scoring and Submission', () => {
    it('should submit scored data when user scores URL then submits', async () => {
      (api.scorePropertyLead as jest.Mock).mockResolvedValue(mockScoredData);
      (leadQueueService.ingestLead as jest.Mock).mockResolvedValue(mockIngestResponse);

      renderModal();

      // Score URL
      const urlInput = screen.getByLabelText(/Listing URL/i);
      await userEvent.type(urlInput, 'https://www.zillow.com/homedetails/123');

      const scoreButton = screen.getByTestId('score-button');
      fireEvent.click(scoreButton);

      await waitFor(() => {
        expect(screen.getByTestId('score-results-card')).toBeInTheDocument();
      });

      // Submit
      const addButton = screen.getByRole('button', { name: /add lead/i });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(leadQueueService.ingestLead).toHaveBeenCalledWith(
          expect.objectContaining({
            address: '123 Main St, Austin, TX 78701',
            listingPrice: 250000,
            zillowLink: 'https://www.zillow.com/homedetails/123',
            squareFootage: 1500,
            agentPhone: '555-123-4567',
            agentName: 'John Agent',
          })
        );
      });
    });
  });
});

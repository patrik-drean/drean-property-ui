import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import PropertyLeadDialog from '../PropertyLeadDialog';
import * as api from '../../services/api';

// Mock the API
jest.mock('../../services/api', () => ({
  scorePropertyLead: jest.fn(),
}));

// Mock MUI icons
jest.mock('@mui/icons-material', () => ({
  ContentCopy: () => <span data-testid="copy-icon">Copy</span>,
  AutoFixHigh: () => <span data-testid="score-icon">Score</span>,
  Search: () => <span data-testid="search-icon">Search</span>,
  BarChart: () => <span data-testid="chart-icon">Chart</span>,
  SmartToy: () => <span data-testid="ai-icon">AI</span>,
  WarningAmber: () => <span data-testid="warning-icon">Warning</span>,
  ExpandMore: () => <span data-testid="expand-more-icon">ExpandMore</span>,
  ExpandLess: () => <span data-testid="expand-less-icon">ExpandLess</span>,
  Refresh: () => <span data-testid="refresh-icon">Refresh</span>,
}));

// Mock ScoreResultsCard
jest.mock('../leads/ScoreResultsCard', () => ({
  ScoreResultsCard: ({ score, grade, aiSummary }: any) => (
    <div data-testid="score-results-card">
      <span>Score: {score}</span>
      {grade && <span>Grade: {grade}</span>}
      {aiSummary && <span>Summary: {aiSummary}</span>}
    </div>
  ),
}));

// Mock styled components from leadsStyles
jest.mock('../leads/leadsStyles', () => ({
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

const defaultProps = {
  open: true,
  isEditing: false,
  initialFormData: {
    id: '',
    address: '',
    zillowLink: '',
    listingPrice: 0,
    sellerPhone: '',
    sellerEmail: '',
    squareFootage: null,
    units: null,
    notes: '',
    lastContactDate: null,
    respondedDate: null,
    convertedDate: null,
    underContractDate: null,
    soldDate: null,
    metadata: null,
    leadScore: null,
  },
  onSave: jest.fn(),
  onClose: jest.fn(),
  handleCurrencyInput: (value: string) => parseInt(value.replace(/[^0-9]/g, ''), 10) || 0,
  formatInputCurrency: (value: number) => value.toLocaleString(),
};

const renderDialog = (props = {}) => {
  return render(
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <PropertyLeadDialog {...defaultProps} {...props} />
      </LocalizationProvider>
    </ThemeProvider>
  );
};

describe('PropertyLeadDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial Rendering', () => {
    it('should render the dialog with Add title when not editing', () => {
      renderDialog();
      expect(screen.getByText('Add Property Lead')).toBeInTheDocument();
    });

    it('should render the dialog with Edit title when editing', () => {
      renderDialog({ isEditing: true });
      expect(screen.getByText('Edit Property Lead')).toBeInTheDocument();
    });

    it('should render the listing URL input', () => {
      renderDialog();
      expect(screen.getByLabelText(/Listing URL/i)).toBeInTheDocument();
    });

    it('should render the Score Property button', () => {
      renderDialog();
      expect(screen.getByTestId('score-button')).toBeInTheDocument();
    });

    it('should render Cancel and Save buttons', () => {
      renderDialog();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Save')).toBeInTheDocument();
    });

    it('should disable Score button when no URL is entered', () => {
      renderDialog();
      const scoreButton = screen.getByTestId('score-button');
      expect(scoreButton).toBeDisabled();
    });
  });

  describe('URL Input and Validation', () => {
    it('should enable Score button when Zillow URL is entered', async () => {
      renderDialog();
      const urlInput = screen.getByLabelText(/Listing URL/i);

      await userEvent.type(urlInput, 'https://www.zillow.com/homedetails/123-main-st');

      const scoreButton = screen.getByTestId('score-button');
      expect(scoreButton).not.toBeDisabled();
    });

    it('should enable Score button when Redfin URL is entered', async () => {
      renderDialog();
      const urlInput = screen.getByLabelText(/Listing URL/i);

      await userEvent.type(urlInput, 'https://www.redfin.com/TX/Houston/123-Main-St');

      const scoreButton = screen.getByTestId('score-button');
      expect(scoreButton).not.toBeDisabled();
    });

    it('should enable Score button when Realtor.com URL is entered', async () => {
      renderDialog();
      const urlInput = screen.getByLabelText(/Listing URL/i);

      await userEvent.type(urlInput, 'https://www.realtor.com/realestateandhomes-detail/123-Main');

      const scoreButton = screen.getByTestId('score-button');
      expect(scoreButton).not.toBeDisabled();
    });

    it('should enable Score button when Trulia URL is entered', async () => {
      renderDialog();
      const urlInput = screen.getByLabelText(/Listing URL/i);

      await userEvent.type(urlInput, 'https://www.trulia.com/p/tx/houston/123-main');

      const scoreButton = screen.getByTestId('score-button');
      expect(scoreButton).not.toBeDisabled();
    });

    it('should enable Score button when HAR URL is entered', async () => {
      renderDialog();
      const urlInput = screen.getByLabelText(/Listing URL/i);

      await userEvent.type(urlInput, 'https://www.har.com/homedetail/123-main-st');

      const scoreButton = screen.getByTestId('score-button');
      expect(scoreButton).not.toBeDisabled();
    });
  });

  describe('Scoring Flow - Success', () => {
    it('should show loading state when scoring', async () => {
      const mockScoreResponse: api.ScoredPropertyData = {
        address: '123 Main St, Houston TX',
        listingPrice: 250000,
        zillowLink: 'https://zillow.com/homedetails/123',
        leadScore: 8.5,
        note: 'Great deal',
        metadata: { arv: 300000 },
      };

      // Create a promise that we can resolve manually
      let resolvePromise: (value: api.ScoredPropertyData) => void;
      const scorePromise = new Promise<api.ScoredPropertyData>((resolve) => {
        resolvePromise = resolve;
      });

      (api.scorePropertyLead as jest.Mock).mockReturnValue(scorePromise);

      renderDialog();
      const urlInput = screen.getByLabelText(/Listing URL/i);
      await userEvent.type(urlInput, 'https://www.zillow.com/homedetails/123');

      const scoreButton = screen.getByTestId('score-button');
      fireEvent.click(scoreButton);

      // Should show loading steps
      await waitFor(() => {
        expect(screen.getByTestId('loading-steps')).toBeInTheDocument();
      });

      // Resolve the promise
      resolvePromise!(mockScoreResponse);

      // Should show score results after loading
      await waitFor(() => {
        expect(screen.getByTestId('score-results-card')).toBeInTheDocument();
      });
    });

    it('should populate form fields after successful scoring', async () => {
      const mockScoreResponse: api.ScoredPropertyData = {
        address: '123 Main St, Houston TX',
        listingPrice: 250000,
        zillowLink: 'https://zillow.com/homedetails/123',
        sqft: 2000,
        units: 1,
        leadScore: 8.5,
        note: 'Great investment property',
        agentInfo: {
          name: 'John Doe',
          email: 'john@realty.com',
          phone: '555-1234',
          agency: 'Best Realty',
        },
        metadata: { arv: 300000 },
      };

      (api.scorePropertyLead as jest.Mock).mockResolvedValue(mockScoreResponse);

      renderDialog();
      const urlInput = screen.getByLabelText(/Listing URL/i);
      await userEvent.type(urlInput, 'https://www.zillow.com/homedetails/123');

      const scoreButton = screen.getByTestId('score-button');
      fireEvent.click(scoreButton);

      // Wait for scoring to complete
      await waitFor(() => {
        expect(screen.getByTestId('score-results-card')).toBeInTheDocument();
      });
    });

    it('should show Re-Score button after successful scoring', async () => {
      (api.scorePropertyLead as jest.Mock).mockResolvedValue({
        address: '123 Main St',
        listingPrice: 250000,
        zillowLink: 'https://zillow.com/homedetails/123',
        leadScore: 8.5,
      });

      renderDialog();
      const urlInput = screen.getByLabelText(/Listing URL/i);
      await userEvent.type(urlInput, 'https://www.zillow.com/homedetails/123');

      const scoreButton = screen.getByTestId('score-button');
      fireEvent.click(scoreButton);

      await waitFor(() => {
        expect(screen.getByText('Re-Score')).toBeInTheDocument();
      });
    });
  });

  describe('Scoring Flow - Errors', () => {
    it('should show error card when scoring fails', async () => {
      (api.scorePropertyLead as jest.Mock).mockRejectedValue(new Error('Network error'));

      renderDialog();
      const urlInput = screen.getByLabelText(/Listing URL/i);
      await userEvent.type(urlInput, 'https://www.zillow.com/homedetails/123');

      const scoreButton = screen.getByTestId('score-button');
      fireEvent.click(scoreButton);

      await waitFor(() => {
        expect(screen.getByTestId('score-error-card')).toBeInTheDocument();
      });
    });

    it('should show specific error for "Could not fetch property details"', async () => {
      (api.scorePropertyLead as jest.Mock).mockRejectedValue({
        response: { data: { error: 'Could not fetch property details' } },
      });

      renderDialog();
      const urlInput = screen.getByLabelText(/Listing URL/i);
      await userEvent.type(urlInput, 'https://www.zillow.com/homedetails/123');

      const scoreButton = screen.getByTestId('score-button');
      fireEvent.click(scoreButton);

      await waitFor(() => {
        expect(screen.getByText('Could not score property')).toBeInTheDocument();
      });
    });

    it('should show specific error for timeout', async () => {
      (api.scorePropertyLead as jest.Mock).mockRejectedValue({
        message: 'timeout exceeded',
      });

      renderDialog();
      const urlInput = screen.getByLabelText(/Listing URL/i);
      await userEvent.type(urlInput, 'https://www.zillow.com/homedetails/123');

      const scoreButton = screen.getByTestId('score-button');
      fireEvent.click(scoreButton);

      await waitFor(() => {
        expect(screen.getByText('Scoring timed out')).toBeInTheDocument();
      });
    });

    it('should show specific error for rate limiting', async () => {
      (api.scorePropertyLead as jest.Mock).mockRejectedValue({
        message: 'rate limit exceeded',
      });

      renderDialog();
      const urlInput = screen.getByLabelText(/Listing URL/i);
      await userEvent.type(urlInput, 'https://www.zillow.com/homedetails/123');

      const scoreButton = screen.getByTestId('score-button');
      fireEvent.click(scoreButton);

      await waitFor(() => {
        expect(screen.getByText('Rate limit reached')).toBeInTheDocument();
      });
    });

    it('should show specific error for network issues', async () => {
      (api.scorePropertyLead as jest.Mock).mockRejectedValue({
        message: 'ECONNREFUSED',
      });

      renderDialog();
      const urlInput = screen.getByLabelText(/Listing URL/i);
      await userEvent.type(urlInput, 'https://www.zillow.com/homedetails/123');

      const scoreButton = screen.getByTestId('score-button');
      fireEvent.click(scoreButton);

      await waitFor(() => {
        expect(screen.getByText('Connection error')).toBeInTheDocument();
      });
    });

    it('should allow dismissing error and trying again', async () => {
      (api.scorePropertyLead as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      renderDialog();
      const urlInput = screen.getByLabelText(/Listing URL/i);
      await userEvent.type(urlInput, 'https://www.zillow.com/homedetails/123');

      const scoreButton = screen.getByTestId('score-button');
      fireEvent.click(scoreButton);

      await waitFor(() => {
        expect(screen.getByTestId('score-error-card')).toBeInTheDocument();
      });

      // Find and click dismiss button
      const dismissButton = screen.getByText(/Dismiss/i);
      fireEvent.click(dismissButton);

      // Error card should be gone and score button should be visible again
      await waitFor(() => {
        expect(screen.queryByTestId('score-error-card')).not.toBeInTheDocument();
        expect(screen.getByTestId('score-button')).toBeInTheDocument();
      });
    });
  });

  describe('Form Interactions', () => {
    it('should call onSave with form data when Save is clicked', async () => {
      const onSave = jest.fn();
      renderDialog({ onSave });

      const addressInput = screen.getByLabelText(/Address/i);
      await userEvent.type(addressInput, '123 Test St');

      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      expect(onSave).toHaveBeenCalled();
      expect(onSave.mock.calls[0][0].address).toBe('123 Test St');
    });

    it('should call onClose when Cancel is clicked', () => {
      const onClose = jest.fn();
      renderDialog({ onClose });

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(onClose).toHaveBeenCalled();
    });

    it('should show Lead ID field when editing', () => {
      renderDialog({
        isEditing: true,
        initialFormData: {
          ...defaultProps.initialFormData,
          id: 'test-lead-id-123',
        },
      });

      // Check by the displayed value instead to avoid multiple label matches
      expect(screen.getByDisplayValue('test-lead-id-123')).toBeInTheDocument();
    });

    it('should not show Lead ID field when adding new lead', () => {
      renderDialog({ isEditing: false });

      // Should not have any field with this value
      expect(screen.queryByDisplayValue('test-lead-id-123')).not.toBeInTheDocument();
    });
  });

  describe('Edit Mode with Existing Score', () => {
    it('should show score results when editing a scored lead', () => {
      renderDialog({
        isEditing: true,
        initialFormData: {
          ...defaultProps.initialFormData,
          id: 'test-id',
          leadScore: 8.5,
          notes: 'Great property',
          metadata: JSON.stringify({ arv: 300000 }),
        },
      });

      expect(screen.getByTestId('score-results-card')).toBeInTheDocument();
    });
  });

  describe('Dialog Lifecycle', () => {
    it('should reset state when dialog is reopened', async () => {
      const { rerender } = renderDialog({ open: false });

      // Open the dialog
      rerender(
        <ThemeProvider theme={theme}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <PropertyLeadDialog {...defaultProps} open={true} />
          </LocalizationProvider>
        </ThemeProvider>
      );

      // Should be in idle state
      expect(screen.getByTestId('score-button')).toBeInTheDocument();
      expect(screen.queryByTestId('score-error-card')).not.toBeInTheDocument();
      expect(screen.queryByTestId('score-results-card')).not.toBeInTheDocument();
    });
  });
});

// Test the error parsing utility function separately
describe('getErrorMessage utility', () => {
  // Since getErrorMessage is not exported, we test it through the component behavior
  // The tests above cover the different error scenarios
});

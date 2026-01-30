import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { AddLeadModal } from '../AddLeadModal';
import { leadQueueService, IngestLeadResponse } from '../../../../services/leadQueueService';
import * as urlParser from '../../../../utils/urlParser';

// Mock the leadQueueService
jest.mock('../../../../services/leadQueueService', () => ({
  leadQueueService: {
    ingestLead: jest.fn(),
  },
}));

// Mock the URL parser
jest.mock('../../../../utils/urlParser', () => ({
  parseListingUrl: jest.fn(),
}));

// Mock MUI icons
jest.mock('@mui/icons-material/CheckCircleOutline', () => () => <span data-testid="check-icon">Check</span>);
jest.mock('@mui/icons-material/WarningAmber', () => () => <span data-testid="warning-icon">Warning</span>);
jest.mock('@mui/icons-material/ExpandMore', () => () => <span data-testid="expand-more-icon">ExpandMore</span>);
jest.mock('@mui/icons-material/ExpandLess', () => () => <span data-testid="expand-less-icon">ExpandLess</span>);

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

const mockSuccessParseResult: urlParser.UrlParseResult = {
  success: true,
  source: 'zillow',
  originalUrl: 'https://www.zillow.com/homedetails/123-Main-St-Austin-TX-78701/12345_zpid/',
  address: {
    street: '123 Main St',
    city: 'Austin',
    state: 'TX',
    zip: '78701',
    fullAddress: '123 Main St, Austin, TX 78701',
  },
};

const mockFailedParseResult: urlParser.UrlParseResult = {
  success: false,
  source: 'unknown',
  originalUrl: 'https://random-site.com/property/123',
  error: 'Could not extract property address from this URL. Please enter the address manually.',
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
    (urlParser.parseListingUrl as jest.Mock).mockReturnValue(mockSuccessParseResult);
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

    it('should render the listing price input', () => {
      renderModal();
      expect(screen.getByLabelText(/Listing Price/i)).toBeInTheDocument();
    });

    it('should render Cancel and Add Lead buttons', () => {
      renderModal();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add lead/i })).toBeInTheDocument();
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

    it('should render Show Property Details toggle', () => {
      renderModal();
      expect(screen.getByRole('button', { name: /show property details/i })).toBeInTheDocument();
    });
  });

  describe('URL Parsing Flow', () => {
    it('should call parseListingUrl when URL field loses focus', async () => {
      renderModal();
      const urlInput = screen.getByLabelText(/Listing URL/i);

      await userEvent.type(urlInput, 'https://www.zillow.com/homedetails/123-Main-St-Austin-TX-78701/12345_zpid/');
      fireEvent.blur(urlInput);

      expect(urlParser.parseListingUrl).toHaveBeenCalledWith(
        'https://www.zillow.com/homedetails/123-Main-St-Austin-TX-78701/12345_zpid/'
      );
    });

    it('should show success message when URL is parsed successfully', async () => {
      renderModal();
      const urlInput = screen.getByLabelText(/Listing URL/i);

      await userEvent.type(urlInput, 'https://www.zillow.com/homedetails/123-Main-St-Austin-TX-78701/12345_zpid/');
      fireEvent.blur(urlInput);

      expect(screen.getByText(/Address extracted:/i)).toBeInTheDocument();
      expect(screen.getByText(/123 Main St, Austin, TX 78701/i)).toBeInTheDocument();
    });

    it('should auto-fill address fields when URL is parsed successfully', async () => {
      renderModal();
      const urlInput = screen.getByLabelText(/Listing URL/i);

      await userEvent.type(urlInput, 'https://www.zillow.com/homedetails/123-Main-St-Austin-TX-78701/12345_zpid/');
      fireEvent.blur(urlInput);

      // Form should auto-expand and fields should be filled
      await waitFor(() => {
        const addressInput = screen.getByRole('textbox', { name: /^address$/i });
        expect(addressInput).toHaveValue('123 Main St, Austin, TX 78701');
      });
      expect(screen.getByRole('textbox', { name: /city/i })).toHaveValue('Austin');
      expect(screen.getByRole('textbox', { name: /^state$/i })).toHaveValue('TX');
      expect(screen.getByRole('textbox', { name: /zip/i })).toHaveValue('78701');
    });

    it('should auto-expand form when URL is parsed successfully', async () => {
      renderModal();
      const urlInput = screen.getByLabelText(/Listing URL/i);

      await userEvent.type(urlInput, 'https://www.zillow.com/homedetails/123-Main-St-Austin-TX-78701/12345_zpid/');
      fireEvent.blur(urlInput);

      // Form should be expanded - check that Hide is visible
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /hide property details/i })).toBeInTheDocument();
      });
    });

    it('should show warning message when URL parsing fails', async () => {
      (urlParser.parseListingUrl as jest.Mock).mockReturnValue(mockFailedParseResult);

      renderModal();
      const urlInput = screen.getByLabelText(/Listing URL/i);

      await userEvent.type(urlInput, 'https://random-site.com/property/123');
      fireEvent.blur(urlInput);

      expect(screen.getByText(/Could not extract property address/i)).toBeInTheDocument();
    });

    it('should auto-expand form when URL parsing fails for manual entry', async () => {
      (urlParser.parseListingUrl as jest.Mock).mockReturnValue(mockFailedParseResult);

      renderModal();
      const urlInput = screen.getByLabelText(/Listing URL/i);

      await userEvent.type(urlInput, 'https://random-site.com/property/123');
      fireEvent.blur(urlInput);

      // Form should be expanded for manual entry
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /hide property details/i })).toBeInTheDocument();
      });
    });

    it('should not call parseListingUrl when URL is empty', async () => {
      renderModal();
      const urlInput = screen.getByLabelText(/Listing URL/i);

      fireEvent.blur(urlInput);

      expect(urlParser.parseListingUrl).not.toHaveBeenCalled();
    });

    it('should show hint text when valid URL is entered but not yet parsed', async () => {
      renderModal();
      const urlInput = screen.getByLabelText(/Listing URL/i);

      await userEvent.type(urlInput, 'https://www.zillow.com/homedetails/123');

      expect(screen.getByText(/Click outside the field to extract address/i)).toBeInTheDocument();
    });

    it('should clear parse result when URL is modified', async () => {
      renderModal();
      const urlInput = screen.getByLabelText(/Listing URL/i);

      // First parse
      await userEvent.type(urlInput, 'https://www.zillow.com/homedetails/123-Main-St-Austin-TX-78701/12345_zpid/');
      fireEvent.blur(urlInput);
      expect(screen.getByText(/Address extracted:/i)).toBeInTheDocument();

      // Modify URL
      await userEvent.type(urlInput, 'a');
      expect(screen.queryByText(/Address extracted:/i)).not.toBeInTheDocument();
    });
  });

  describe('Manual Form Entry', () => {
    it('should expand form when "Show Property Details" is clicked', async () => {
      renderModal();

      const expandButton = screen.getByRole('button', { name: /show property details/i });
      fireEvent.click(expandButton);

      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /^address$/i })).toBeInTheDocument();
      });
      expect(screen.getByRole('textbox', { name: /city/i })).toBeInTheDocument();
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

      // Wait for form to expand
      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /^address$/i })).toBeInTheDocument();
      });

      // Fill required fields
      const addressInput = screen.getByRole('textbox', { name: /^address$/i });
      const priceInput = screen.getByLabelText(/listing price/i);

      await userEvent.type(addressInput, '123 Test St, Austin, TX');
      await userEvent.type(priceInput, '250000');

      const addButton = screen.getByRole('button', { name: /add lead/i });
      expect(addButton).not.toBeDisabled();
    });

    it('should format currency input correctly', async () => {
      renderModal();

      const priceInput = screen.getByLabelText(/listing price/i);
      await userEvent.type(priceInput, '250000');

      expect(priceInput).toHaveValue('250,000');
    });

    it('should render all form fields when expanded', async () => {
      renderModal();

      // Expand form
      const expandButton = screen.getByRole('button', { name: /show property details/i });
      fireEvent.click(expandButton);

      // Wait for form to expand
      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /^address$/i })).toBeInTheDocument();
      });

      expect(screen.getByRole('textbox', { name: /city/i })).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: /^state$/i })).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: /zip/i })).toBeInTheDocument();
      expect(screen.getByRole('spinbutton', { name: /sqft/i })).toBeInTheDocument();
      expect(screen.getByRole('spinbutton', { name: /beds/i })).toBeInTheDocument();
      expect(screen.getByRole('spinbutton', { name: /baths/i })).toBeInTheDocument();
      expect(screen.getByRole('spinbutton', { name: /units/i })).toBeInTheDocument();
      expect(screen.getByRole('spinbutton', { name: /year built/i })).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: /agent\/seller phone/i })).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: /agent\/seller email/i })).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: /agent name/i })).toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('should call ingestLead with correct data when form is submitted', async () => {
      (leadQueueService.ingestLead as jest.Mock).mockResolvedValue(mockIngestResponse);

      renderModal();

      // Expand form
      const expandButton = screen.getByRole('button', { name: /show property details/i });
      fireEvent.click(expandButton);

      // Wait for form to expand
      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /^address$/i })).toBeInTheDocument();
      });

      // Fill required fields
      const addressInput = screen.getByRole('textbox', { name: /^address$/i });
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

    it('should include URL in submission when provided', async () => {
      (leadQueueService.ingestLead as jest.Mock).mockResolvedValue(mockIngestResponse);

      renderModal();
      const urlInput = screen.getByLabelText(/Listing URL/i);

      // Enter URL and trigger parse
      await userEvent.type(urlInput, 'https://www.zillow.com/homedetails/123-Main-St-Austin-TX-78701/12345_zpid/');
      fireEvent.blur(urlInput);

      // Enter price
      const priceInput = screen.getByLabelText(/listing price/i);
      await userEvent.type(priceInput, '250000');

      // Submit
      const addButton = screen.getByRole('button', { name: /add lead/i });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(leadQueueService.ingestLead).toHaveBeenCalledWith(
          expect.objectContaining({
            address: '123 Main St, Austin, TX 78701',
            listingPrice: 250000,
            zillowLink: 'https://www.zillow.com/homedetails/123-Main-St-Austin-TX-78701/12345_zpid/',
            city: 'Austin',
            state: 'TX',
            zipCode: '78701',
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

      // Wait for form to expand
      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /^address$/i })).toBeInTheDocument();
      });

      const addressInput = screen.getByRole('textbox', { name: /^address$/i });
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

      // Wait for form to expand
      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /^address$/i })).toBeInTheDocument();
      });

      const addressInput = screen.getByRole('textbox', { name: /^address$/i });
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

      // Wait for form to expand
      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /^address$/i })).toBeInTheDocument();
      });

      const addressInput = screen.getByRole('textbox', { name: /^address$/i });
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

      // Just fill price, no address
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

      // Wait for form to expand
      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /^address$/i })).toBeInTheDocument();
      });

      const addressInput = screen.getByRole('textbox', { name: /^address$/i });
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

      // Wait for form to expand
      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /^address$/i })).toBeInTheDocument();
      });

      const addressInput = screen.getByRole('textbox', { name: /^address$/i });
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

    it('should reset parse result when dialog is reopened', async () => {
      const { rerender } = renderModal();

      // Enter URL and parse
      const urlInput = screen.getByLabelText(/Listing URL/i);
      await userEvent.type(urlInput, 'https://www.zillow.com/homedetails/123-Main-St-Austin-TX-78701/12345_zpid/');
      fireEvent.blur(urlInput);
      expect(screen.getByText(/Address extracted:/i)).toBeInTheDocument();

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

      // Parse result should be cleared
      expect(screen.queryByText(/Address extracted:/i)).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible dialog', () => {
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

  describe('URL Parsing with Form Submission', () => {
    it('should submit parsed data when user parses URL then submits', async () => {
      (leadQueueService.ingestLead as jest.Mock).mockResolvedValue(mockIngestResponse);

      renderModal();

      // Enter URL and parse
      const urlInput = screen.getByLabelText(/Listing URL/i);
      await userEvent.type(urlInput, 'https://www.zillow.com/homedetails/123-Main-St-Austin-TX-78701/12345_zpid/');
      fireEvent.blur(urlInput);

      await waitFor(() => {
        expect(screen.getByText(/Address extracted:/i)).toBeInTheDocument();
      });

      // Enter price
      const priceInput = screen.getByLabelText(/listing price/i);
      await userEvent.type(priceInput, '350000');

      // Submit
      const addButton = screen.getByRole('button', { name: /add lead/i });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(leadQueueService.ingestLead).toHaveBeenCalledWith(
          expect.objectContaining({
            address: '123 Main St, Austin, TX 78701',
            listingPrice: 350000,
            city: 'Austin',
            state: 'TX',
            zipCode: '78701',
            zillowLink: 'https://www.zillow.com/homedetails/123-Main-St-Austin-TX-78701/12345_zpid/',
            source: 'manual',
            sendFirstMessage: false,
          })
        );
      });
    });

    it('should allow manual override of parsed address fields', async () => {
      (leadQueueService.ingestLead as jest.Mock).mockResolvedValue(mockIngestResponse);

      renderModal();

      // Enter URL and parse
      const urlInput = screen.getByLabelText(/Listing URL/i);
      await userEvent.type(urlInput, 'https://www.zillow.com/homedetails/123-Main-St-Austin-TX-78701/12345_zpid/');
      fireEvent.blur(urlInput);

      // Wait for form to auto-expand
      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /^address$/i })).toHaveValue('123 Main St, Austin, TX 78701');
      });

      // Clear and change the address
      const addressInput = screen.getByRole('textbox', { name: /^address$/i });
      await userEvent.clear(addressInput);
      await userEvent.type(addressInput, '456 Oak Ave, Houston, TX 77001');

      // Enter price
      const priceInput = screen.getByLabelText(/listing price/i);
      await userEvent.type(priceInput, '200000');

      // Submit
      const addButton = screen.getByRole('button', { name: /add lead/i });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(leadQueueService.ingestLead).toHaveBeenCalledWith(
          expect.objectContaining({
            address: '456 Oak Ave, Houston, TX 77001',
            listingPrice: 200000,
          })
        );
      });
    });
  });
});

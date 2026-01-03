import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { MemoryRouter } from 'react-router-dom';
import PropertyLeadsPage from '../PropertyLeadsPage';
import * as api from '../../services/api';
import { smsService } from '../../services/smsService';

// Mock the dependencies
jest.mock('../../services/api');
jest.mock('../../services/smsService');

// Mock the MessageLeadButton component
jest.mock('../messaging/MessageLeadButton', () => ({
  MessageLeadButton: () => null,
}));

// Mock the MessagingPopover context
jest.mock('../../contexts/MessagingPopoverContext', () => ({
  useMessagingPopover: () => ({
    openPopover: jest.fn(),
    isPopoverOpen: false,
  }),
  MessagingPopoverProvider: ({ children }: any) => <div>{children}</div>,
}));

const theme = createTheme();

const mockPropertyLeads = [
  {
    id: '1',
    address: '123 Test St, City, State',
    zillowLink: 'https://zillow.com/test',
    listingPrice: 200000,
    sellerPhone: '555-1234',
    sellerEmail: 'seller@test.com',
    lastContactDate: '2024-01-15T10:00:00Z',
    notes: 'Test notes',
    squareFootage: 1800,
    units: 2,
    convertedToProperty: false,
    archived: false,
    tags: [],
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
];

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <MemoryRouter>
      <ThemeProvider theme={theme}>{ui}</ThemeProvider>
    </MemoryRouter>
  );
};

describe('PropertyLeadsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mocks
    (api.getPropertyLeadsWithArchivedStatus as jest.Mock).mockResolvedValue(mockPropertyLeads);
    (smsService.getConversations as jest.Mock).mockResolvedValue([]);
  });

  it('should render PropertyLeadsPage with toolbar', async () => {
    renderWithProviders(<PropertyLeadsPage />);

    await waitFor(() => {
      expect(screen.getByText('Property Leads')).toBeInTheDocument();
    });
  });

  it('should render Add Lead button', async () => {
    renderWithProviders(<PropertyLeadsPage />);

    await waitFor(() => {
      expect(screen.getByText('Add Lead')).toBeInTheDocument();
    });
  });

  it('should render View Sales Report link in toolbar', async () => {
    renderWithProviders(<PropertyLeadsPage />);

    await waitFor(() => {
      expect(screen.getByText('View Sales Report')).toBeInTheDocument();
    });
  });

  it('should render property leads in the table', async () => {
    renderWithProviders(<PropertyLeadsPage />);

    await waitFor(() => {
      // Address may appear multiple times (in table cell and tooltip), so we use getAllByText
      const elements = screen.getAllByText('123 Test St, City, State');
      expect(elements.length).toBeGreaterThan(0);
    });
  });

  it('should show loading state initially', () => {
    renderWithProviders(<PropertyLeadsPage />);

    // Loading indicator should be present initially
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should display lead details correctly', async () => {
    renderWithProviders(<PropertyLeadsPage />);

    await waitFor(() => {
      // Address may appear multiple times (in table cell and tooltip)
      const addressElements = screen.getAllByText('123 Test St, City, State');
      expect(addressElements.length).toBeGreaterThan(0);
      // Price may also appear multiple times
      const priceElements = screen.getAllByText(/200,000/);
      expect(priceElements.length).toBeGreaterThan(0);
    });
  });

  it('should open add lead dialog when Add Lead button is clicked', async () => {
    renderWithProviders(<PropertyLeadsPage />);

    await waitFor(() => {
      expect(screen.getByText('Add Lead')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Add Lead'));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('should toggle archived leads visibility', async () => {
    renderWithProviders(<PropertyLeadsPage />);

    await waitFor(() => {
      expect(screen.getByText('Archived Leads')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Archived Leads'));

    await waitFor(() => {
      expect(screen.getByText('Hide Archived')).toBeInTheDocument();
    });
  });
});

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
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

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => {
  const mockReact = require('react');
  return {
    Link: mockReact.forwardRef(
      ({ children, to }: { children: any; to: string }, ref: any) =>
        mockReact.createElement('a', { href: to, ref }, children)
    ),
    useNavigate: () => mockNavigate,
    BrowserRouter: ({ children }: any) => mockReact.createElement('div', {}, children),
  };
}, { virtual: true });

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

const renderWithTheme = (ui: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
};

describe('PropertyLeadsPage - Sales Funnel Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mocks
    (api.getPropertyLeadsWithArchivedStatus as jest.Mock).mockResolvedValue(mockPropertyLeads);
    (smsService.getConversations as jest.Mock).mockResolvedValue([]);
  });

  it('should render View Sales Report button', async () => {
    renderWithTheme(<PropertyLeadsPage />);

    await waitFor(() => {
      expect(screen.getByText('View Sales Report')).toBeInTheDocument();
    });
  });

  it('should display Assessment icon in View Sales Report button', async () => {
    renderWithTheme(<PropertyLeadsPage />);

    await waitFor(() => {
      const button = screen.getByRole('button', { name: /View Sales Report/i });
      expect(button).toBeInTheDocument();
      // The button should have the Assessment icon
      const icon = button.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });
  });

  it('should navigate to /reports?tab=3 when View Sales Report button is clicked', async () => {
    renderWithTheme(<PropertyLeadsPage />);

    await waitFor(() => {
      const button = screen.getByRole('button', { name: /View Sales Report/i });
      fireEvent.click(button);
    });

    expect(mockNavigate).toHaveBeenCalledWith('/reports?tab=3');
  });

  it('should position View Sales Report button before Override Message button', async () => {
    renderWithTheme(<PropertyLeadsPage />);

    await waitFor(() => {
      const buttons = screen.getAllByRole('button');
      const viewSalesReportIndex = buttons.findIndex(
        (btn) => btn.textContent === 'View Sales Report'
      );
      const overrideMessageIndex = buttons.findIndex(
        (btn) => btn.textContent === 'Override Message'
      );

      expect(viewSalesReportIndex).toBeGreaterThan(-1);
      expect(overrideMessageIndex).toBeGreaterThan(-1);
      expect(viewSalesReportIndex).toBeLessThan(overrideMessageIndex);
    });
  });

  it('should have outlined variant for View Sales Report button', async () => {
    renderWithTheme(<PropertyLeadsPage />);

    await waitFor(() => {
      const button = screen.getByRole('button', { name: /View Sales Report/i });
      expect(button).toHaveClass('MuiButton-outlined');
    });
  });
});

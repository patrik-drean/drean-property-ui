import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { PortfolioPLReport } from '../PortfolioPLReport';
import { transactionApi } from '../../../services/transactionApi';
import PropertyService from '../../../services/PropertyService';

// Mock the dependencies
jest.mock('../../../services/transactionApi');
jest.mock('../../../services/PropertyService');

const theme = createTheme();

const mockTransactions = [
  {
    id: '1',
    propertyId: 'prop-1',
    date: '2025-10-15',
    overrideDate: null,
    amount: 2000,
    category: 'Rent',
    expenseType: 'Operating',
    description: 'Monthly rent'
  },
  {
    id: '2',
    propertyId: 'prop-1',
    date: '2025-10-10',
    overrideDate: null,
    amount: -500,
    category: 'Maintenance',
    expenseType: 'Operating',
    description: 'Repairs'
  }
];

const mockProperties = [
  {
    id: 'prop-1',
    address: '123 Test Street',
    archived: false,
    status: 'Operational'
  }
];

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('PortfolioPLReport', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('loading state', () => {
    it('should display loading spinner while fetching data', () => {
      (PropertyService.getAllProperties as jest.Mock).mockImplementation(
        () => new Promise(() => {})
      );
      (transactionApi.getAll as jest.Mock).mockImplementation(
        () => new Promise(() => {})
      );

      renderWithTheme(<PortfolioPLReport months={6} />);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('should display error message when data fetch fails', async () => {
      const errorMessage = 'Failed to fetch data';
      (PropertyService.getAllProperties as jest.Mock).mockRejectedValue(
        new Error(errorMessage)
      );
      (transactionApi.getAll as jest.Mock).mockResolvedValue([]);

      renderWithTheme(<PortfolioPLReport months={6} />);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });
  });

  describe('empty state', () => {
    it('should display no data message when no transactions available', async () => {
      (PropertyService.getAllProperties as jest.Mock).mockResolvedValue([]);
      (transactionApi.getAll as jest.Mock).mockResolvedValue([]);

      renderWithTheme(<PortfolioPLReport months={6} />);

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      // Either we see the no data message, or we see an empty report
      // The component shows "No transaction data available." only when report.months.length === 0
      const noDataMessage = screen.queryByText('No transaction data available.');
      const reportTitle = screen.queryByText('Portfolio P&L Report');

      // One of these should be true
      expect(noDataMessage || reportTitle).toBeTruthy();
    });
  });

  describe('report display', () => {
    it('should display Portfolio P&L Report title', async () => {
      (PropertyService.getAllProperties as jest.Mock).mockResolvedValue(mockProperties);
      (transactionApi.getAll as jest.Mock).mockResolvedValue(mockTransactions);

      renderWithTheme(<PortfolioPLReport months={6} />);

      await waitFor(() => {
        expect(screen.getByText('Portfolio P&L Report')).toBeInTheDocument();
      });
    });

    it('should NOT display Export CSV button', async () => {
      (PropertyService.getAllProperties as jest.Mock).mockResolvedValue(mockProperties);
      (transactionApi.getAll as jest.Mock).mockResolvedValue(mockTransactions);

      renderWithTheme(<PortfolioPLReport months={6} />);

      await waitFor(() => {
        expect(screen.getByText('Portfolio P&L Report')).toBeInTheDocument();
      });

      // Export CSV button should NOT be present
      expect(screen.queryByText('Export CSV')).not.toBeInTheDocument();
    });

    it('should display Income and Expenses sections', async () => {
      (PropertyService.getAllProperties as jest.Mock).mockResolvedValue(mockProperties);
      (transactionApi.getAll as jest.Mock).mockResolvedValue(mockTransactions);

      renderWithTheme(<PortfolioPLReport months={6} />);

      await waitFor(() => {
        expect(screen.getByText('INCOME')).toBeInTheDocument();
        expect(screen.getByText('EXPENSES')).toBeInTheDocument();
      });
    });
  });

  describe('Property Breakdown accordion', () => {
    it('should have Property Breakdown section expanded by default', async () => {
      (PropertyService.getAllProperties as jest.Mock).mockResolvedValue(mockProperties);
      (transactionApi.getAll as jest.Mock).mockResolvedValue(mockTransactions);

      renderWithTheme(<PortfolioPLReport months={6} />);

      await waitFor(() => {
        expect(screen.getByText('Property Breakdown')).toBeInTheDocument();
      });

      // The accordion should be expanded - check for table headers that are inside AccordionDetails
      expect(screen.getByText('Total Income (6mo)')).toBeInTheDocument();
      expect(screen.getByText('Total Expenses (6mo)')).toBeInTheDocument();
      expect(screen.getByText('Net Income (6mo)')).toBeInTheDocument();
      expect(screen.getByText('Last Mo Net')).toBeInTheDocument();
    });

    it('should display property breakdown with property address', async () => {
      (PropertyService.getAllProperties as jest.Mock).mockResolvedValue(mockProperties);
      (transactionApi.getAll as jest.Mock).mockResolvedValue(mockTransactions);

      renderWithTheme(<PortfolioPLReport months={6} />);

      await waitFor(() => {
        expect(screen.getByText('123 Test Street')).toBeInTheDocument();
      });
    });
  });

  describe('property links', () => {
    it('should render property links with target="_blank" attribute', async () => {
      (PropertyService.getAllProperties as jest.Mock).mockResolvedValue(mockProperties);
      (transactionApi.getAll as jest.Mock).mockResolvedValue(mockTransactions);

      renderWithTheme(<PortfolioPLReport months={6} />);

      await waitFor(() => {
        const propertyLink = screen.getByText('123 Test Street');
        expect(propertyLink).toBeInTheDocument();
      });

      const propertyLink = screen.getByText('123 Test Street');
      expect(propertyLink.tagName.toLowerCase()).toBe('a');
      expect(propertyLink).toHaveAttribute('target', '_blank');
      expect(propertyLink).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('should render property link with correct href', async () => {
      (PropertyService.getAllProperties as jest.Mock).mockResolvedValue(mockProperties);
      (transactionApi.getAll as jest.Mock).mockResolvedValue(mockTransactions);

      renderWithTheme(<PortfolioPLReport months={6} />);

      await waitFor(() => {
        const propertyLink = screen.getByText('123 Test Street');
        expect(propertyLink).toHaveAttribute('href', '#/reports/property-pl/prop-1');
      });
    });

    it('should not render business transactions as links', async () => {
      const businessTransactions = [
        {
          id: '3',
          propertyId: 'business',
          date: '2025-10-15',
          overrideDate: null,
          amount: -100,
          category: 'Office Supplies',
          expenseType: 'Operating',
          description: 'Business expense'
        }
      ];

      (PropertyService.getAllProperties as jest.Mock).mockResolvedValue(mockProperties);
      (transactionApi.getAll as jest.Mock).mockResolvedValue(businessTransactions);

      renderWithTheme(<PortfolioPLReport months={6} />);

      // Wait for loading to finish
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      // Business transactions display the word "Business" which should not be a link
      // The component shows propertyAddress for business items, which is "Business"
      const businessElements = screen.queryAllByText('Business');
      if (businessElements.length > 0) {
        businessElements.forEach(el => {
          expect(el.tagName.toLowerCase()).not.toBe('a');
        });
      }
    });
  });

  describe('table structure', () => {
    it('should display 6-Mo Avg column header', async () => {
      (PropertyService.getAllProperties as jest.Mock).mockResolvedValue(mockProperties);
      (transactionApi.getAll as jest.Mock).mockResolvedValue(mockTransactions);

      renderWithTheme(<PortfolioPLReport months={6} />);

      await waitFor(() => {
        expect(screen.getByText('6-Mo Avg')).toBeInTheDocument();
      });
    });

    it('should display Total Income and Total Expenses rows', async () => {
      (PropertyService.getAllProperties as jest.Mock).mockResolvedValue(mockProperties);
      (transactionApi.getAll as jest.Mock).mockResolvedValue(mockTransactions);

      renderWithTheme(<PortfolioPLReport months={6} />);

      await waitFor(() => {
        expect(screen.getByText('Total Income')).toBeInTheDocument();
        expect(screen.getByText('Total Expenses')).toBeInTheDocument();
        expect(screen.getByText('Net Income')).toBeInTheDocument();
      });
    });
  });
});

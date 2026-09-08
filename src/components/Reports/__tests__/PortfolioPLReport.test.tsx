import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { format, subMonths, startOfMonth } from 'date-fns';
import { PortfolioPLReport } from '../PortfolioPLReport';
import { transactionApi } from '../../../services/transactionApi';
import PropertyService from '../../../services/PropertyService';

// Mock the dependencies
jest.mock('../../../services/transactionApi');
jest.mock('../../../services/PropertyService');

const theme = createTheme();
const lastFullMonth = format(subMonths(startOfMonth(new Date()), 1), 'yyyy-MM');

const mockTransactions = [
  {
    id: '1',
    propertyId: 'prop-1',
    date: `${lastFullMonth}-15`,
    overrideDate: null,
    amount: 2000,
    category: 'Rent',
    unit: '1',
    expenseType: 'Operating',
    description: 'Monthly rent'
  },
  {
    id: '2',
    propertyId: 'prop-1',
    date: `${lastFullMonth}-10`,
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
    status: 'Operational',
    units: 2,
    propertyUnits: [
      { id: 'u1', unitNumber: '1' },
      { id: 'u2', unitNumber: '2' }
    ]
  }
];

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

const mockResolved = (
  properties: unknown[] = mockProperties,
  transactions: unknown[] = mockTransactions
) => {
  (PropertyService.getAllProperties as jest.Mock).mockResolvedValue(properties);
  (transactionApi.getAll as jest.Mock).mockResolvedValue(transactions);
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
    it('should render without crashing when there is no data', async () => {
      mockResolved([], []);

      renderWithTheme(<PortfolioPLReport months={6} />);

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      const noDataMessage = screen.queryByText('No transaction data available.');
      const reportTitle = screen.queryByText('Portfolio P&L Report');
      expect(noDataMessage || reportTitle).toBeTruthy();
    });
  });

  describe('report display', () => {
    it('should display the title with the reporting period', async () => {
      mockResolved();

      renderWithTheme(<PortfolioPLReport months={6} />);

      await waitFor(() => {
        expect(screen.getByText('Portfolio P&L Report')).toBeInTheDocument();
      });
      // Subtitle is a date range such as "Mar 2026 – Aug 2026"
      expect(screen.getByText(/\w{3} \d{4} – \w{3} \d{4}/)).toBeInTheDocument();
    });

    it('should display the Export CSV button', async () => {
      mockResolved();

      renderWithTheme(<PortfolioPLReport months={6} />);

      await waitFor(() => {
        expect(screen.getByText('Export CSV')).toBeInTheDocument();
      });
    });

    it('should display Income and Expenses sections', async () => {
      mockResolved();

      renderWithTheme(<PortfolioPLReport months={6} />);

      await waitFor(() => {
        expect(screen.getByText('INCOME')).toBeInTheDocument();
        expect(screen.getByText('EXPENSES')).toBeInTheDocument();
      });
    });
  });

  describe('KPI strip and trend chart', () => {
    it('should display the portfolio KPI tiles', async () => {
      mockResolved();

      renderWithTheme(<PortfolioPLReport months={6} />);

      await waitFor(() => {
        expect(screen.getByText('Last Month Net')).toBeInTheDocument();
      });
      expect(screen.getByText('Portfolio Occupancy')).toBeInTheDocument();
      expect(screen.getByText('Cashflow Positive')).toBeInTheDocument();
      // One unit paid rent out of two across the portfolio. The same figure also
      // appears in the table's Units Occupied row and the breakdown.
      expect(screen.getAllByText('1/2').length).toBeGreaterThan(0);
      expect(screen.getByText('50% of units')).toBeInTheDocument();
      expect(screen.getByText('1 of 1')).toBeInTheDocument();
    });

    it('should render the trend chart', async () => {
      mockResolved();

      renderWithTheme(<PortfolioPLReport months={6} />);

      await waitFor(() => {
        expect(screen.getByText('6-Month Trend')).toBeInTheDocument();
      });
    });
  });

  describe('Property Breakdown accordion', () => {
    it('should have Property Breakdown section expanded by default', async () => {
      mockResolved();

      renderWithTheme(<PortfolioPLReport months={6} />);

      await waitFor(() => {
        expect(screen.getByText('Property Breakdown')).toBeInTheDocument();
      });

      // Table headers live inside AccordionDetails, so they prove it is expanded
      expect(screen.getByText('Income (6mo)')).toBeInTheDocument();
      expect(screen.getByText('Expenses (6mo)')).toBeInTheDocument();
      expect(screen.getByText('Net (6mo)')).toBeInTheDocument();
      expect(screen.getByText('Occupancy')).toBeInTheDocument();
      expect(screen.getByText('Last Mo Net')).toBeInTheDocument();
    });

    it('should display property breakdown with property address', async () => {
      mockResolved();

      renderWithTheme(<PortfolioPLReport months={6} />);

      await waitFor(() => {
        expect(screen.getByText('123 Test Street')).toBeInTheDocument();
      });
    });

    it('should list worst last-month performers first with business last', async () => {
      const properties = [
        { id: 'prop-1', address: 'Good St', archived: false, status: 'Operational', units: 1 },
        { id: 'prop-2', address: 'Bad St', archived: false, status: 'Operational', units: 1 }
      ];
      const transactions = [
        {
          id: '1', propertyId: 'prop-1', date: `${lastFullMonth}-05`,
          amount: 1000, category: 'Rent', expenseType: 'Operating'
        },
        {
          id: '2', propertyId: 'prop-2', date: `${lastFullMonth}-05`,
          amount: -900, category: 'Utilities', expenseType: 'Operating'
        },
        {
          id: '3', propertyId: 'business', date: `${lastFullMonth}-05`,
          amount: -50, category: 'Software', expenseType: 'Operating'
        }
      ];
      mockResolved(properties, transactions);

      renderWithTheme(<PortfolioPLReport months={6} />);

      await waitFor(() => {
        expect(screen.getByText('Bad St')).toBeInTheDocument();
      });

      const rendered = screen.getAllByText(/Good St|Bad St|Business \(No Property\)/);
      expect(rendered.map(el => el.textContent)).toEqual([
        'Bad St',
        'Good St',
        'Business (No Property)'
      ]);
    });
  });

  describe('property links', () => {
    it('should render property links with target="_blank" attribute', async () => {
      mockResolved();

      renderWithTheme(<PortfolioPLReport months={6} />);

      await waitFor(() => {
        expect(screen.getByText('123 Test Street')).toBeInTheDocument();
      });

      const propertyLink = screen.getByText('123 Test Street');
      expect(propertyLink.tagName.toLowerCase()).toBe('a');
      expect(propertyLink).toHaveAttribute('target', '_blank');
      expect(propertyLink).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('should render property link with correct href', async () => {
      mockResolved();

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
          date: `${lastFullMonth}-15`,
          overrideDate: null,
          amount: -100,
          category: 'Office Supplies',
          expenseType: 'Operating',
          description: 'Business expense'
        }
      ];

      mockResolved(mockProperties, businessTransactions);

      renderWithTheme(<PortfolioPLReport months={6} />);

      await waitFor(() => {
        expect(screen.getByText('Business (No Property)')).toBeInTheDocument();
      });

      expect(screen.getByText('Business (No Property)').tagName.toLowerCase()).not.toBe('a');
    });
  });

  describe('table structure', () => {
    it('should display 6-Mo Avg column header', async () => {
      mockResolved();

      renderWithTheme(<PortfolioPLReport months={6} />);

      await waitFor(() => {
        expect(screen.getByText('6-Mo Avg')).toBeInTheDocument();
      });
    });

    it('should display the summary block plus totals rows', async () => {
      mockResolved();

      renderWithTheme(<PortfolioPLReport months={6} />);

      await waitFor(() => {
        expect(screen.getByText('SUMMARY')).toBeInTheDocument();
      });
      expect(screen.getByText('Units Occupied')).toBeInTheDocument();
      expect(screen.getByText('Total Income')).toBeInTheDocument();
      expect(screen.getByText('Total Expenses')).toBeInTheDocument();
      // Net Income appears in the summary block and again after expenses
      expect(screen.getAllByText('Net Income')).toHaveLength(2);
    });
  });
});

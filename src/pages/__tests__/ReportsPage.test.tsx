import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { ReportsPage } from '../ReportsPage';
import { portfolioReportService } from '../../services/portfolioReportService';

// Mock the dependencies
jest.mock('../../services/portfolioReportService');
jest.mock('../../services/salesFunnelService');

// Mock the responsive layout hook
jest.mock('../../hooks/useResponsiveLayout', () => ({
  useResponsiveLayout: () => ({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
  }),
}));

// Mock react-router-dom
const mockNavigate = jest.fn();
const mockLocation = { search: '', pathname: '/reports', state: null, hash: '', key: 'default' };
jest.mock('react-router-dom', () => {
  const mockReact = require('react');
  return {
    Link: mockReact.forwardRef(
      ({ children, to }: { children: any; to: string }, ref: any) =>
        mockReact.createElement('a', { href: to, ref }, children)
    ),
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocation,
    BrowserRouter: ({ children }: any) => mockReact.createElement('div', {}, children),
  };
}, { virtual: true });

const theme = createTheme();

const mockProperties = [
  {
    id: '1',
    address: '123 Test St',
    status: 'Operational',
    listingPrice: 200000,
    offerPrice: 180000,
    rehabCosts: 20000,
    potentialRent: 1800,
    arv: 250000,
    hasRentcastData: true,
    notes: '',
    score: 7,
    zillowLink: '',
    squareFootage: 1800,
    units: 1,
    actualRent: 1850,
    currentHouseValue: 245000,
    currentLoanValue: 150000,
    propertyUnits: [],
    monthlyExpenses: null,
    capitalCosts: null
  }
];

const mockCashFlowReport = {
  properties: [],
  summary: {
    currentTotalRentIncome: 1850,
    currentTotalExpenses: { total: 2208, mortgage: 0, propertyTax: 0, insurance: 0, propertyManagement: 0, maintenance: 0, vacancy: 0, other: 0 },
    currentTotalNetCashFlow: -358,
    potentialTotalRentIncome: 1800,
    potentialTotalExpenses: { total: 2196, mortgage: 0, propertyTax: 0, insurance: 0, propertyManagement: 0, maintenance: 0, vacancy: 0, other: 0 },
    potentialTotalNetCashFlow: -396,
    propertiesCount: 1,
    operationalPropertiesCount: 1,
    totalOperationalUnits: 1,
    totalBehindRentUnits: 0,
    totalVacantUnits: 0
  },
  generatedAt: new Date()
};

const mockAssetReport = {
  properties: [],
  summary: {
    totalProperties: 1,
    totalMarketValue: 245000,
    totalDebt: 150000,
    totalEquity: 95000,
    totalPurchasePrice: 180000,
    totalAppreciation: 65000
  },
  generatedAt: new Date()
};

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('ReportsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mocks
    (portfolioReportService.getPropertiesForReports as jest.Mock).mockResolvedValue(mockProperties);
    (portfolioReportService.generateAllReports as jest.Mock).mockResolvedValue({
      cashFlow: { data: mockCashFlowReport, errors: [] },
      assets: { data: mockAssetReport, errors: [] }
    });
  });

  describe('tab order', () => {
    // Portfolio P&L now lives on /properties, not here
    it('should display all 3 tabs in correct order', async () => {
      renderWithProviders(<ReportsPage />);

      await waitFor(() => {
        const tabs = screen.getAllByRole('tab');
        expect(tabs).toHaveLength(3);
        expect(tabs[0]).toHaveTextContent('Cash Flow Analysis');
        expect(tabs[1]).toHaveTextContent('Asset Analysis');
        expect(tabs[2]).toHaveTextContent('Sales Funnel');
      });
    });

    it('should not offer a Portfolio P&L tab', async () => {
      renderWithProviders(<ReportsPage />);

      await waitFor(() => {
        expect(screen.getAllByRole('tab').length).toBeGreaterThan(0);
      });
      expect(screen.queryByRole('tab', { name: /Portfolio P&L/i })).not.toBeInTheDocument();
    });

    it('should have Cash Flow Analysis selected by default', async () => {
      renderWithProviders(<ReportsPage />);

      await waitFor(() => {
        const cashFlowTab = screen.getByRole('tab', { name: /Cash Flow Analysis/i });
        expect(cashFlowTab).toHaveAttribute('aria-selected', 'true');
      });
    });
  });

  describe('loading state', () => {
    it('should display loading state initially', () => {
      (portfolioReportService.getPropertiesForReports as jest.Mock).mockImplementation(
        () => new Promise(() => {})
      );
      (portfolioReportService.generateAllReports as jest.Mock).mockImplementation(
        () => new Promise(() => {})
      );

      renderWithProviders(<ReportsPage />);

      expect(screen.getByText('Loading portfolio reports...')).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  describe('page header', () => {
    it('should display Portfolio Reports heading', async () => {
      renderWithProviders(<ReportsPage />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Portfolio Reports' })).toBeInTheDocument();
      });
    });

    it('should display refresh button', async () => {
      renderWithProviders(<ReportsPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Refresh Reports/i })).toBeInTheDocument();
      });
    });
  });

  describe('default tab content', () => {
    it('should load Cash Flow report content by default', async () => {
      renderWithProviders(<ReportsPage />);

      await waitFor(() => {
        // The first tab panel should be visible (index 0)
        const tabPanels = screen.getAllByRole('tabpanel', { hidden: true });
        // First tabpanel should be visible (not hidden)
        expect(tabPanels[0]).not.toHaveAttribute('hidden');
      });
    });
  });

  describe('no properties state', () => {
    it('should display no properties message when no properties exist', async () => {
      (portfolioReportService.getPropertiesForReports as jest.Mock).mockResolvedValue([]);
      (portfolioReportService.generateAllReports as jest.Mock).mockResolvedValue({
        cashFlow: { data: undefined, errors: [] },
        assets: { data: undefined, errors: [] }
      });

      renderWithProviders(<ReportsPage />);

      await waitFor(() => {
        expect(screen.getByText('No Properties Found')).toBeInTheDocument();
      });
    });
  });

  describe('Sales Funnel Integration', () => {
    it('should render Sales Funnel tab as the last tab', async () => {
      renderWithProviders(<ReportsPage />);

      await waitFor(() => {
        const tabs = screen.getAllByRole('tab');
        expect(tabs[tabs.length - 1]).toHaveTextContent('Sales Funnel');
      });
    });

    it('should update URL when Sales Funnel tab is clicked', async () => {
      renderWithProviders(<ReportsPage />);

      await waitFor(() => {
        const salesFunnelTab = screen.getByRole('tab', { name: /Sales Funnel/i });
        fireEvent.click(salesFunnelTab);
      });

      expect(mockNavigate).toHaveBeenCalledWith('/reports?tab=2', { replace: true });
    });

    it('should select Sales Funnel tab when URL has tab=2 parameter', async () => {
      mockLocation.search = '?tab=2';

      renderWithProviders(<ReportsPage />);

      await waitFor(() => {
        const salesFunnelTab = screen.getByRole('tab', { name: /Sales Funnel/i });
        expect(salesFunnelTab).toHaveAttribute('aria-selected', 'true');
      });

      // Reset location for other tests
      mockLocation.search = '';
    });

    it('should NOT show export button when Sales Funnel tab is selected', async () => {
      renderWithProviders(<ReportsPage />);

      await waitFor(() => {
        const salesFunnelTab = screen.getByRole('tab', { name: /Sales Funnel/i });
        fireEvent.click(salesFunnelTab);
      });

      await waitFor(() => {
        const exportButtons = screen.queryAllByRole('button', { name: /Export.*Report/i });
        expect(exportButtons.length).toBe(0);
      });
    });
  });
});

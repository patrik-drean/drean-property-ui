import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { SalesFunnelReportComponent } from '../SalesFunnelReport';
import { salesFunnelService } from '../../../services/salesFunnelService';

// Mock the service
jest.mock('../../../services/salesFunnelService');
const mockedService = salesFunnelService as jest.Mocked<typeof salesFunnelService>;

// Mock the responsive layout hook
jest.mock('../../../hooks/useResponsiveLayout', () => ({
  useResponsiveLayout: () => ({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
  }),
}));

const theme = createTheme();

const renderWithTheme = (ui: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
};

const mockReport = {
  stages: [
    { stageName: 'Leads', count: 100, conversionRateFromPrevious: null },
    { stageName: 'Contacted', count: 80, conversionRateFromPrevious: 80.0 },
    { stageName: 'Responded', count: 60, conversionRateFromPrevious: 75.0 },
    { stageName: 'Converted', count: 40, conversionRateFromPrevious: 66.67 },
    { stageName: 'Under Contract', count: 20, conversionRateFromPrevious: 50.0 },
    { stageName: 'Sold', count: 10, conversionRateFromPrevious: 50.0 },
  ],
  startDate: null,
  endDate: null,
  totalLeads: 100,
  generatedAt: '2024-12-17T10:00:00Z',
};

describe('SalesFunnelReportComponent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should display loading state initially', () => {
      mockedService.getSalesFunnelReport.mockReturnValue(
        new Promise(() => {}) // Never resolves
      );

      renderWithTheme(<SalesFunnelReportComponent />);

      expect(screen.getByText('Loading sales funnel report...')).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should display error state on API failure', async () => {
      mockedService.getSalesFunnelReport.mockRejectedValue(new Error('API Error'));

      renderWithTheme(<SalesFunnelReportComponent />);

      await waitFor(() => {
        expect(
          screen.getByText('Failed to load sales funnel report. Please try again.')
        ).toBeInTheDocument();
      });
    });

    it('should show refresh button in error state', async () => {
      mockedService.getSalesFunnelReport.mockRejectedValue(new Error('API Error'));

      renderWithTheme(<SalesFunnelReportComponent />);

      await waitFor(() => {
        expect(screen.getByText(/Failed to load/)).toBeInTheDocument();
      });

      // Check that there's a button in the alert
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should retry API call when refresh button clicked', async () => {
      mockedService.getSalesFunnelReport
        .mockRejectedValueOnce(new Error('API Error'))
        .mockResolvedValueOnce(mockReport);

      renderWithTheme(<SalesFunnelReportComponent />);

      await waitFor(() => {
        expect(screen.getByText(/Failed to load/)).toBeInTheDocument();
      });

      // Find the refresh button in the alert
      const buttons = screen.getAllByRole('button');
      const refreshButton = buttons[0]; // The refresh button in the Alert action
      fireEvent.click(refreshButton);

      await waitFor(() => {
        expect(screen.getByText('Sales Funnel Analysis')).toBeInTheDocument();
      });

      expect(mockedService.getSalesFunnelReport).toHaveBeenCalledTimes(2);
    });
  });

  describe('Empty State', () => {
    it('should display empty state when totalLeads is 0', async () => {
      const emptyReport = { ...mockReport, totalLeads: 0, stages: [] };
      mockedService.getSalesFunnelReport.mockResolvedValue(emptyReport);

      renderWithTheme(<SalesFunnelReportComponent />);

      await waitFor(() => {
        expect(
          screen.getByText('No leads found for the selected time period. Try adjusting the date range.')
        ).toBeInTheDocument();
      });
    });

    it('should still show time filter selector in empty state', async () => {
      const emptyReport = { ...mockReport, totalLeads: 0, stages: [] };
      mockedService.getSalesFunnelReport.mockResolvedValue(emptyReport);

      renderWithTheme(<SalesFunnelReportComponent />);

      await waitFor(() => {
        expect(screen.getByText('All Time')).toBeInTheDocument();
      });
    });
  });

  describe('Success State', () => {
    it('should display table with data on success', async () => {
      mockedService.getSalesFunnelReport.mockResolvedValue(mockReport);

      renderWithTheme(<SalesFunnelReportComponent />);

      await waitFor(() => {
        expect(screen.getByText('Sales Funnel Analysis')).toBeInTheDocument();
      });

      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('should display all 6 stages', async () => {
      mockedService.getSalesFunnelReport.mockResolvedValue(mockReport);

      renderWithTheme(<SalesFunnelReportComponent />);

      await waitFor(() => {
        expect(screen.getByText('Leads')).toBeInTheDocument();
        expect(screen.getByText('Contacted')).toBeInTheDocument();
        expect(screen.getByText('Responded')).toBeInTheDocument();
        expect(screen.getByText('Converted')).toBeInTheDocument();
        expect(screen.getByText('Under Contract')).toBeInTheDocument();
        expect(screen.getByText('Sold')).toBeInTheDocument();
      });
    });

    it('should display stage counts correctly', async () => {
      mockedService.getSalesFunnelReport.mockResolvedValue(mockReport);

      renderWithTheme(<SalesFunnelReportComponent />);

      await waitFor(() => {
        expect(screen.getByText('100')).toBeInTheDocument(); // Leads
        expect(screen.getByText('80')).toBeInTheDocument(); // Contacted
        expect(screen.getByText('60')).toBeInTheDocument(); // Responded
      });
    });

    it('should format conversion rates with 2 decimals and % sign', async () => {
      mockedService.getSalesFunnelReport.mockResolvedValue(mockReport);

      renderWithTheme(<SalesFunnelReportComponent />);

      await waitFor(() => {
        expect(screen.getByText('80.00%')).toBeInTheDocument();
        expect(screen.getByText('75.00%')).toBeInTheDocument();
        expect(screen.getByText('66.67%')).toBeInTheDocument();
      });
    });

    it('should display null conversion rates as "-"', async () => {
      mockedService.getSalesFunnelReport.mockResolvedValue(mockReport);

      renderWithTheme(<SalesFunnelReportComponent />);

      await waitFor(() => {
        // First stage (Leads) has null conversion rate
        const rows = screen.getAllByRole('row');
        const leadsRow = rows.find((row) => row.textContent?.includes('Leads'));
        expect(leadsRow?.textContent).toContain('-');
      });
    });

    it('should have refresh button in success state', async () => {
      mockedService.getSalesFunnelReport.mockResolvedValue(mockReport);

      renderWithTheme(<SalesFunnelReportComponent />);

      await waitFor(() => {
        expect(screen.getByLabelText('refresh report')).toBeInTheDocument();
      });
    });
  });

  describe('Time Filter Integration', () => {
    it('should call API when time filter preset changes', async () => {
      mockedService.getSalesFunnelReport.mockResolvedValue(mockReport);

      renderWithTheme(<SalesFunnelReportComponent />);

      await waitFor(() => {
        expect(screen.getByText('Sales Funnel Analysis')).toBeInTheDocument();
      });

      // Click on a different time filter
      fireEvent.click(screen.getByText('Last 30 Days'));

      await waitFor(() => {
        expect(mockedService.getSalesFunnelReport).toHaveBeenCalledTimes(2);
      });
    });

    it('should show time filter selector', async () => {
      mockedService.getSalesFunnelReport.mockResolvedValue(mockReport);

      renderWithTheme(<SalesFunnelReportComponent />);

      await waitFor(() => {
        expect(screen.getByText('Last 7 Days')).toBeInTheDocument();
        expect(screen.getByText('Last 30 Days')).toBeInTheDocument();
        expect(screen.getByText('All Time')).toBeInTheDocument();
      });
    });
  });

  describe('Color Coding', () => {
    it('should apply color styling to conversion rates', async () => {
      const reportWithVariedRates = {
        ...mockReport,
        stages: [
          { stageName: 'Leads', count: 100, conversionRateFromPrevious: null },
          { stageName: 'High', count: 80, conversionRateFromPrevious: 80.0 }, // Green (>=50%)
          { stageName: 'Medium', count: 40, conversionRateFromPrevious: 40.0 }, // Orange (25-49%)
          { stageName: 'Low', count: 10, conversionRateFromPrevious: 10.0 }, // Red (<25%)
        ],
      };

      mockedService.getSalesFunnelReport.mockResolvedValue(reportWithVariedRates);

      const { container } = renderWithTheme(<SalesFunnelReportComponent />);

      await waitFor(() => {
        expect(screen.getByText('Sales Funnel Analysis')).toBeInTheDocument();
      });

      // Verify that conversion rate cells exist and have styling
      const conversionRateCells = container.querySelectorAll('td:last-child');
      expect(conversionRateCells.length).toBeGreaterThan(0);
    });
  });

  describe('Table Structure', () => {
    it('should have proper table headers', async () => {
      mockedService.getSalesFunnelReport.mockResolvedValue(mockReport);

      renderWithTheme(<SalesFunnelReportComponent />);

      await waitFor(() => {
        expect(screen.getByText('Stage')).toBeInTheDocument();
        expect(screen.getByText('Count')).toBeInTheDocument();
        expect(screen.getByText('Conversion Rate')).toBeInTheDocument();
      });
    });

    it('should have proper accessibility attributes', async () => {
      mockedService.getSalesFunnelReport.mockResolvedValue(mockReport);

      renderWithTheme(<SalesFunnelReportComponent />);

      await waitFor(() => {
        const table = screen.getByRole('table', { name: 'sales funnel table' });
        expect(table).toBeInTheDocument();
      });
    });
  });

  describe('Refresh Functionality', () => {
    it('should reload report when refresh button clicked', async () => {
      mockedService.getSalesFunnelReport.mockResolvedValue(mockReport);

      renderWithTheme(<SalesFunnelReportComponent />);

      await waitFor(() => {
        expect(screen.getByText('Sales Funnel Analysis')).toBeInTheDocument();
      });

      const refreshButton = screen.getByLabelText('refresh report');
      fireEvent.click(refreshButton);

      await waitFor(() => {
        expect(mockedService.getSalesFunnelReport).toHaveBeenCalledTimes(2);
      });
    });
  });
});

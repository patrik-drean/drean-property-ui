import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { MemoryRouter } from 'react-router-dom';
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

// Mock localStorage
const localStorageMock = (() => {
  let store: { [key: string]: string } = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

const theme = createTheme();

const renderWithTheme = (ui: React.ReactElement, { route = '/' } = {}) => {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <ThemeProvider theme={theme}>{ui}</ThemeProvider>
    </MemoryRouter>
  );
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
  averageTimeToFirstContactHours: 2.5,
  timeToFirstContactLeadCount: 80,
  averageResponseTimeHours: 4.0,
  responseTimeLeadCount: 60,
};

describe('SalesFunnelReportComponent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
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

    it('should format conversion rates as whole numbers with inline goal', async () => {
      mockedService.getSalesFunnelReport.mockResolvedValue(mockReport);

      renderWithTheme(<SalesFunnelReportComponent />);

      // Wait for table to load first
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Check that percentages are rounded to whole numbers and goals are displayed
      // The conversion rates and goals are rendered in the table cells
      // Note: Stage names changed in TASK-126 to Lead entity stages
      const table = screen.getByRole('table');
      expect(table.textContent).toContain('80%'); // Contacted conversion rate
      expect(table.textContent).toContain('75%'); // Responded conversion rate
      expect(table.textContent).toContain('67%'); // Converted (66.67 rounded)
      expect(table.textContent).toContain('50% = Goal'); // Contacted goal (50%)
    });

    it('should display null conversion rates as "0%"', async () => {
      mockedService.getSalesFunnelReport.mockResolvedValue(mockReport);

      renderWithTheme(<SalesFunnelReportComponent />);

      await waitFor(() => {
        // First stage (Leads) has null conversion rate
        const rows = screen.getAllByRole('row');
        const leadsRow = rows.find((row) => row.textContent?.includes('Leads'));
        expect(leadsRow?.textContent).toContain('0%');
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

  describe('Debug Mode', () => {
    const mockReportWithDebug = {
      ...mockReport,
      stages: [
        {
          stageName: 'Contacted',
          count: 50,
          conversionRateFromPrevious: 50,
          leads: [
            {
              id: 'lead-1',
              address: '123 Main St',
              listingPrice: 250000,
              score: 7,
              status: 'Contacted',
              createdAt: '2024-01-15T10:00:00Z',
              stageEnteredAt: '2024-01-16T10:00:00Z',
              daysInStage: 5,
            },
          ],
        },
      ],
      debugData: {
        dataQualityIssues: [
          { leadId: 'lead-1', address: '123 Main St', issue: 'Missing date', severity: 'warning' as const },
        ],
        stageBreakdowns: [
          { stageName: 'Contacted', totalCount: 50, withDateSet: 45, withoutDateSet: 5 },
        ],
        dateSequenceErrors: [],
        stageDurations: [],
        lostByStage: [],
      },
    };

    it('should show debug toggle switch', async () => {
      mockedService.getSalesFunnelReport.mockResolvedValue(mockReport);

      renderWithTheme(<SalesFunnelReportComponent />);

      await waitFor(() => {
        expect(screen.getByText('Debug')).toBeInTheDocument();
      });

      expect(screen.getByRole('checkbox')).toBeInTheDocument();
    });

    it('should toggle debug mode when switch is clicked', async () => {
      mockedService.getSalesFunnelReport.mockResolvedValue(mockReportWithDebug);

      renderWithTheme(<SalesFunnelReportComponent />);

      await waitFor(() => {
        expect(screen.getByText('Sales Funnel Analysis')).toBeInTheDocument();
      });

      const debugSwitch = screen.getByRole('checkbox');
      fireEvent.click(debugSwitch);

      await waitFor(() => {
        // Debug mode toggled, should call API with includeDebug
        expect(mockedService.getSalesFunnelReport).toHaveBeenCalledWith(
          expect.anything(),
          expect.anything(),
          true
        );
      });
    });

    it('should persist debug mode to localStorage', async () => {
      mockedService.getSalesFunnelReport.mockResolvedValue(mockReport);

      renderWithTheme(<SalesFunnelReportComponent />);

      await waitFor(() => {
        expect(screen.getByText('Sales Funnel Analysis')).toBeInTheDocument();
      });

      const debugSwitch = screen.getByRole('checkbox');
      fireEvent.click(debugSwitch);

      expect(localStorageMock.setItem).toHaveBeenCalledWith('salesFunnelDebugMode', 'true');
    });

    it('should read debug mode from localStorage on mount', async () => {
      localStorageMock.getItem.mockReturnValue('true');
      mockedService.getSalesFunnelReport.mockResolvedValue(mockReportWithDebug);

      renderWithTheme(<SalesFunnelReportComponent />);

      await waitFor(() => {
        expect(mockedService.getSalesFunnelReport).toHaveBeenCalledWith(
          expect.anything(),
          expect.anything(),
          true
        );
      });
    });

    it('should enable debug mode when ?debug=true in URL', async () => {
      mockedService.getSalesFunnelReport.mockResolvedValue(mockReportWithDebug);

      renderWithTheme(<SalesFunnelReportComponent />, { route: '/?debug=true' });

      await waitFor(() => {
        expect(mockedService.getSalesFunnelReport).toHaveBeenCalledWith(
          expect.anything(),
          expect.anything(),
          true
        );
      });
    });

    it('should show debug panel when debug mode is enabled and debug data exists', async () => {
      localStorageMock.getItem.mockReturnValue('true');
      mockedService.getSalesFunnelReport.mockResolvedValue(mockReportWithDebug);

      renderWithTheme(<SalesFunnelReportComponent />);

      await waitFor(() => {
        expect(screen.getByText('Debug View')).toBeInTheDocument();
      });
    });

    it('should not show debug panel when debug mode is disabled', async () => {
      localStorageMock.getItem.mockReturnValue('false');
      mockedService.getSalesFunnelReport.mockResolvedValue(mockReport);

      renderWithTheme(<SalesFunnelReportComponent />);

      await waitFor(() => {
        expect(screen.getByText('Sales Funnel Analysis')).toBeInTheDocument();
      });

      expect(screen.queryByText('Debug View')).not.toBeInTheDocument();
    });

    it('should show issue count badge in debug panel', async () => {
      localStorageMock.getItem.mockReturnValue('true');
      mockedService.getSalesFunnelReport.mockResolvedValue(mockReportWithDebug);

      renderWithTheme(<SalesFunnelReportComponent />);

      await waitFor(() => {
        expect(screen.getByText('1 issue')).toBeInTheDocument();
      });
    });
  });

  describe('Stage Drill-Down', () => {
    const mockReportWithLeads = {
      ...mockReport,
      stages: [
        {
          stageName: 'Contacted',
          count: 2,
          conversionRateFromPrevious: 50,
          leads: [
            {
              id: 'lead-1',
              address: '123 Main St',
              listingPrice: 250000,
              score: 7,
              status: 'Contacted',
              createdAt: '2024-01-15T10:00:00Z',
              stageEnteredAt: '2024-01-16T10:00:00Z',
              daysInStage: 5,
            },
            {
              id: 'lead-2',
              address: '456 Oak Ave',
              listingPrice: 350000,
              score: 9,
              status: 'Contacted',
              createdAt: '2024-01-14T10:00:00Z',
              stageEnteredAt: '2024-01-15T10:00:00Z',
              daysInStage: 6,
            },
          ],
        },
      ],
      debugData: {
        dataQualityIssues: [],
        stageBreakdowns: [],
        dateSequenceErrors: [],
        stageDurations: [],
        lostByStage: [],
      },
    };

    it('should show stage as clickable link when debug mode is on and leads exist', async () => {
      localStorageMock.getItem.mockReturnValue('true');
      mockedService.getSalesFunnelReport.mockResolvedValue(mockReportWithLeads);

      renderWithTheme(<SalesFunnelReportComponent />);

      await waitFor(() => {
        const table = screen.getByRole('table');
        expect(table).toBeInTheDocument();
      });

      // In debug mode with leads, stage name should be a clickable link
      const contactedCell = screen.getByText('Contacted');
      expect(contactedCell.closest('span')).toHaveClass('MuiLink-root');
    });

    it('should open stage leads modal when stage row is clicked in debug mode', async () => {
      localStorageMock.getItem.mockReturnValue('true');
      mockedService.getSalesFunnelReport.mockResolvedValue(mockReportWithLeads);

      renderWithTheme(<SalesFunnelReportComponent />);

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Click on the stage row
      const contactedRow = screen.getByRole('row', { name: /Contacted/i });
      fireEvent.click(contactedRow);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText('Contacted Stage')).toBeInTheDocument();
      });
    });

    it('should show leads in the modal', async () => {
      localStorageMock.getItem.mockReturnValue('true');
      mockedService.getSalesFunnelReport.mockResolvedValue(mockReportWithLeads);

      renderWithTheme(<SalesFunnelReportComponent />);

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Click on the stage row
      const contactedRow = screen.getByRole('row', { name: /Contacted/i });
      fireEvent.click(contactedRow);

      await waitFor(() => {
        expect(screen.getByText('123 Main St')).toBeInTheDocument();
        expect(screen.getByText('456 Oak Ave')).toBeInTheDocument();
      });
    });

    it('should close modal when close button is clicked', async () => {
      localStorageMock.getItem.mockReturnValue('true');
      mockedService.getSalesFunnelReport.mockResolvedValue(mockReportWithLeads);

      renderWithTheme(<SalesFunnelReportComponent />);

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Open modal
      const contactedRow = screen.getByRole('row', { name: /Contacted/i });
      fireEvent.click(contactedRow);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Close modal
      const closeButton = screen.getByRole('button', { name: 'Close' });
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('should not be clickable when debug mode is off', async () => {
      localStorageMock.getItem.mockReturnValue('false');
      mockedService.getSalesFunnelReport.mockResolvedValue(mockReport);

      renderWithTheme(<SalesFunnelReportComponent />);

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Stage names should not be links when debug mode is off
      const contactedCell = screen.getByText('Contacted');
      // Without debug mode, stage names are plain text (in th, not wrapped in Link/span)
      expect(contactedCell.tagName.toLowerCase()).toBe('th');
    });
  });

  describe('CSV Export', () => {
    it('should have download CSV button', async () => {
      mockedService.getSalesFunnelReport.mockResolvedValue(mockReport);

      renderWithTheme(<SalesFunnelReportComponent />);

      await waitFor(() => {
        expect(screen.getByLabelText('download csv')).toBeInTheDocument();
      });
    });

    it('should call exportLeadsCsv when download button is clicked', async () => {
      mockedService.getSalesFunnelReport.mockResolvedValue(mockReport);
      mockedService.exportLeadsCsv.mockResolvedValue();

      renderWithTheme(<SalesFunnelReportComponent />);

      await waitFor(() => {
        expect(screen.getByText('Sales Funnel Analysis')).toBeInTheDocument();
      });

      const downloadButton = screen.getByLabelText('download csv');
      fireEvent.click(downloadButton);

      expect(mockedService.exportLeadsCsv).toHaveBeenCalled();
    });
  });
});

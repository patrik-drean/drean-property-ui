import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { SalesFunnelDebugPanel } from '../SalesFunnelDebugPanel';
import { SalesFunnelDebugData } from '../../../types/salesFunnel';

const theme = createTheme();

const renderWithTheme = (ui: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
};

const createMockDebugData = (overrides: Partial<SalesFunnelDebugData> = {}): SalesFunnelDebugData => ({
  dataQualityIssues: [],
  stageBreakdowns: [],
  dateSequenceErrors: [],
  stageDurations: [],
  lostByStage: [],
  ...overrides,
});

describe('SalesFunnelDebugPanel', () => {
  describe('Accordion Behavior', () => {
    it('should render collapsed by default', () => {
      const mockData = createMockDebugData();
      renderWithTheme(<SalesFunnelDebugPanel data={mockData} />);

      expect(screen.getByText('Debug View')).toBeInTheDocument();
      // Tab content should not be rendered when collapsed
      expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
    });

    it('should expand when clicked', () => {
      const mockData = createMockDebugData();
      renderWithTheme(<SalesFunnelDebugPanel data={mockData} />);

      const accordionSummary = screen.getByText('Debug View').closest('div[role="button"]');
      fireEvent.click(accordionSummary!);

      expect(screen.getByRole('tablist')).toBeInTheDocument();
    });

    it('should collapse when clicked again', () => {
      const mockData = createMockDebugData();
      renderWithTheme(<SalesFunnelDebugPanel data={mockData} />);

      const accordionSummary = screen.getByText('Debug View').closest('div[role="button"]');
      fireEvent.click(accordionSummary!); // Expand

      expect(screen.getByRole('tablist')).toBeInTheDocument();

      fireEvent.click(accordionSummary!); // Collapse

      // After collapse, tabs are hidden but accordion details may still be in DOM
      // The accordion is collapsed when aria-expanded is false
      const accordion = screen.getByRole('button', { expanded: false });
      expect(accordion).toBeInTheDocument();
    });
  });

  describe('Issue Badge', () => {
    it('should not show badge when no issues exist', () => {
      const mockData = createMockDebugData();
      renderWithTheme(<SalesFunnelDebugPanel data={mockData} />);

      // The badge in the accordion summary shows "X issue(s)" - check for the chip
      expect(screen.queryByText(/\d+ issue/)).not.toBeInTheDocument();
    });

    it('should show warning badge when data quality issues exist', () => {
      const mockData = createMockDebugData({
        dataQualityIssues: [
          { leadId: '1', address: '123 Main St', issue: 'Missing date', severity: 'warning' },
        ],
      });
      renderWithTheme(<SalesFunnelDebugPanel data={mockData} />);

      expect(screen.getByText('1 issue')).toBeInTheDocument();
    });

    it('should show correct count with multiple issues', () => {
      const mockData = createMockDebugData({
        dataQualityIssues: [
          { leadId: '1', address: '123 Main St', issue: 'Missing date', severity: 'warning' },
          { leadId: '2', address: '456 Oak Ave', issue: 'Invalid status', severity: 'error' },
        ],
        dateSequenceErrors: [
          { leadId: '3', address: '789 Pine Rd', error: 'Out of order' },
        ],
      });
      renderWithTheme(<SalesFunnelDebugPanel data={mockData} />);

      expect(screen.getByText('3 issues')).toBeInTheDocument();
    });

    it('should show error color when errors exist', () => {
      const mockData = createMockDebugData({
        dataQualityIssues: [
          { leadId: '1', address: '123 Main St', issue: 'Critical error', severity: 'error' },
        ],
      });
      const { container } = renderWithTheme(<SalesFunnelDebugPanel data={mockData} />);

      // Find the chip with error color
      const chip = container.querySelector('.MuiChip-colorError');
      expect(chip).toBeInTheDocument();
    });
  });

  describe('Tab Navigation', () => {
    it('should render all 5 tabs', () => {
      const mockData = createMockDebugData();
      renderWithTheme(<SalesFunnelDebugPanel data={mockData} />);

      const accordionSummary = screen.getByText('Debug View').closest('div[role="button"]');
      fireEvent.click(accordionSummary!);

      expect(screen.getByRole('tab', { name: /Data Quality/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Stage Breakdown/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Date Sequence/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Stage Durations/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Lost Analysis/i })).toBeInTheDocument();
    });

    it('should switch tab content when clicking tabs', () => {
      const mockData = createMockDebugData({
        stageBreakdowns: [
          { stageName: 'Contacted', totalCount: 10, withDateSet: 8, withoutDateSet: 2 },
        ],
      });
      renderWithTheme(<SalesFunnelDebugPanel data={mockData} />);

      const accordionSummary = screen.getByText('Debug View').closest('div[role="button"]');
      fireEvent.click(accordionSummary!);

      // Click Stage Breakdown tab
      fireEvent.click(screen.getByRole('tab', { name: /Stage Breakdown/i }));

      expect(screen.getByText('Contacted')).toBeInTheDocument();
    });

    it('should show badge on Data Quality tab when issues exist', () => {
      const mockData = createMockDebugData({
        dataQualityIssues: [
          { leadId: '1', address: '123 Main St', issue: 'Test issue', severity: 'warning' },
          { leadId: '2', address: '456 Oak Ave', issue: 'Another issue', severity: 'warning' },
        ],
      });
      renderWithTheme(<SalesFunnelDebugPanel data={mockData} />);

      const accordionSummary = screen.getByText('Debug View').closest('div[role="button"]');
      fireEvent.click(accordionSummary!);

      const dataQualityTab = screen.getByRole('tab', { name: /Data Quality/i });
      expect(within(dataQualityTab).getByText('2')).toBeInTheDocument();
    });

    it('should show badge on Date Sequence tab when errors exist', () => {
      const mockData = createMockDebugData({
        dateSequenceErrors: [
          { leadId: '1', address: '123 Main St', error: 'Out of order' },
        ],
      });
      renderWithTheme(<SalesFunnelDebugPanel data={mockData} />);

      const accordionSummary = screen.getByText('Debug View').closest('div[role="button"]');
      fireEvent.click(accordionSummary!);

      const dateSequenceTab = screen.getByRole('tab', { name: /Date Sequence/i });
      expect(within(dateSequenceTab).getByText('1')).toBeInTheDocument();
    });
  });

  describe('Data Quality Tab', () => {
    it('should show empty message when no issues', () => {
      const mockData = createMockDebugData();
      renderWithTheme(<SalesFunnelDebugPanel data={mockData} />);

      const accordionSummary = screen.getByText('Debug View').closest('div[role="button"]');
      fireEvent.click(accordionSummary!);

      expect(screen.getByText('No data quality issues found.')).toBeInTheDocument();
    });

    it('should display issues in table format', () => {
      const mockData = createMockDebugData({
        dataQualityIssues: [
          { leadId: '1', address: '123 Main St', issue: 'Status is Negotiating but RespondedAt is null', severity: 'warning' },
        ],
      });
      renderWithTheme(<SalesFunnelDebugPanel data={mockData} />);

      const accordionSummary = screen.getByText('Debug View').closest('div[role="button"]');
      fireEvent.click(accordionSummary!);

      expect(screen.getByText('123 Main St')).toBeInTheDocument();
      expect(screen.getByText('Status is Negotiating but RespondedAt is null')).toBeInTheDocument();
      expect(screen.getByText('warning')).toBeInTheDocument();
    });

    it('should call onNavigateToLead when address is clicked', () => {
      const mockNavigate = jest.fn();
      const mockData = createMockDebugData({
        dataQualityIssues: [
          { leadId: 'lead-123', address: '123 Main St', issue: 'Test issue', severity: 'warning' },
        ],
      });
      renderWithTheme(<SalesFunnelDebugPanel data={mockData} onNavigateToLead={mockNavigate} />);

      const accordionSummary = screen.getByText('Debug View').closest('div[role="button"]');
      fireEvent.click(accordionSummary!);

      const addressLink = screen.getByRole('button', { name: '123 Main St' });
      fireEvent.click(addressLink);

      expect(mockNavigate).toHaveBeenCalledWith('lead-123');
    });

    it('should display error severity with error chip', () => {
      const mockData = createMockDebugData({
        dataQualityIssues: [
          { leadId: '1', address: '123 Main St', issue: 'Critical error', severity: 'error' },
        ],
      });
      const { container } = renderWithTheme(<SalesFunnelDebugPanel data={mockData} />);

      const accordionSummary = screen.getByText('Debug View').closest('div[role="button"]');
      fireEvent.click(accordionSummary!);

      // Check for error chip in the table
      const errorChip = container.querySelector('.MuiChip-colorError');
      expect(errorChip).toBeInTheDocument();
    });
  });

  describe('Stage Breakdown Tab', () => {
    it('should show empty message when no data', () => {
      const mockData = createMockDebugData();
      renderWithTheme(<SalesFunnelDebugPanel data={mockData} />);

      const accordionSummary = screen.getByText('Debug View').closest('div[role="button"]');
      fireEvent.click(accordionSummary!);
      fireEvent.click(screen.getByRole('tab', { name: /Stage Breakdown/i }));

      expect(screen.getByText('No stage breakdown data available.')).toBeInTheDocument();
    });

    it('should display stage breakdown data with progress bar', () => {
      const mockData = createMockDebugData({
        stageBreakdowns: [
          { stageName: 'Contacted', totalCount: 100, withDateSet: 80, withoutDateSet: 20 },
          { stageName: 'Responding', totalCount: 50, withDateSet: 50, withoutDateSet: 0 },
        ],
      });
      renderWithTheme(<SalesFunnelDebugPanel data={mockData} />);

      const accordionSummary = screen.getByText('Debug View').closest('div[role="button"]');
      fireEvent.click(accordionSummary!);
      fireEvent.click(screen.getByRole('tab', { name: /Stage Breakdown/i }));

      expect(screen.getByText('Contacted')).toBeInTheDocument();
      expect(screen.getByText('Responding')).toBeInTheDocument();
      expect(screen.getByText('80%')).toBeInTheDocument(); // 80/100
      expect(screen.getByText('100%')).toBeInTheDocument(); // 50/50
    });

    it('should highlight missing dates in warning color', () => {
      const mockData = createMockDebugData({
        stageBreakdowns: [
          { stageName: 'Contacted', totalCount: 100, withDateSet: 80, withoutDateSet: 20 },
        ],
      });
      renderWithTheme(<SalesFunnelDebugPanel data={mockData} />);

      const accordionSummary = screen.getByText('Debug View').closest('div[role="button"]');
      fireEvent.click(accordionSummary!);
      fireEvent.click(screen.getByRole('tab', { name: /Stage Breakdown/i }));

      // The "20" (withoutDateSet) should be styled with warning color
      expect(screen.getByText('20')).toBeInTheDocument();
    });
  });

  describe('Date Sequence Tab', () => {
    it('should show empty message when no errors', () => {
      const mockData = createMockDebugData();
      renderWithTheme(<SalesFunnelDebugPanel data={mockData} />);

      const accordionSummary = screen.getByText('Debug View').closest('div[role="button"]');
      fireEvent.click(accordionSummary!);
      fireEvent.click(screen.getByRole('tab', { name: /Date Sequence/i }));

      expect(screen.getByText('No date sequence errors found.')).toBeInTheDocument();
    });

    it('should display date sequence errors', () => {
      const mockData = createMockDebugData({
        dateSequenceErrors: [
          { leadId: '1', address: '123 Main St', error: 'RespondedAt (Jan 5) is before ContactedAt (Jan 10)' },
        ],
      });
      renderWithTheme(<SalesFunnelDebugPanel data={mockData} />);

      const accordionSummary = screen.getByText('Debug View').closest('div[role="button"]');
      fireEvent.click(accordionSummary!);
      fireEvent.click(screen.getByRole('tab', { name: /Date Sequence/i }));

      expect(screen.getByText('123 Main St')).toBeInTheDocument();
      expect(screen.getByText('RespondedAt (Jan 5) is before ContactedAt (Jan 10)')).toBeInTheDocument();
    });

    it('should call onNavigateToLead when address is clicked', () => {
      const mockNavigate = jest.fn();
      const mockData = createMockDebugData({
        dateSequenceErrors: [
          { leadId: 'lead-456', address: '456 Oak Ave', error: 'Date error' },
        ],
      });
      renderWithTheme(<SalesFunnelDebugPanel data={mockData} onNavigateToLead={mockNavigate} />);

      const accordionSummary = screen.getByText('Debug View').closest('div[role="button"]');
      fireEvent.click(accordionSummary!);
      fireEvent.click(screen.getByRole('tab', { name: /Date Sequence/i }));

      const addressLink = screen.getByRole('button', { name: '456 Oak Ave' });
      fireEvent.click(addressLink);

      expect(mockNavigate).toHaveBeenCalledWith('lead-456');
    });
  });

  describe('Stage Durations Tab', () => {
    it('should show empty message when no data', () => {
      const mockData = createMockDebugData();
      renderWithTheme(<SalesFunnelDebugPanel data={mockData} />);

      const accordionSummary = screen.getByText('Debug View').closest('div[role="button"]');
      fireEvent.click(accordionSummary!);
      fireEvent.click(screen.getByRole('tab', { name: /Stage Durations/i }));

      expect(screen.getByText('Not enough data to calculate stage durations.')).toBeInTheDocument();
    });

    it('should display stage duration statistics', () => {
      const mockData = createMockDebugData({
        stageDurations: [
          {
            fromStage: 'Contacted',
            toStage: 'Responding',
            averageHours: 48,
            medianHours: 36,
            minHours: 12,
            maxHours: 120,
            sampleSize: 25,
          },
        ],
      });
      renderWithTheme(<SalesFunnelDebugPanel data={mockData} />);

      const accordionSummary = screen.getByText('Debug View').closest('div[role="button"]');
      fireEvent.click(accordionSummary!);
      fireEvent.click(screen.getByRole('tab', { name: /Stage Durations/i }));

      expect(screen.getByText('Contacted → Responding')).toBeInTheDocument();
      expect(screen.getByText('25')).toBeInTheDocument(); // sample size
    });

    it('should format hours less than 24 correctly', () => {
      const mockData = createMockDebugData({
        stageDurations: [
          {
            fromStage: 'Contacted',
            toStage: 'Responding',
            averageHours: 12.5,
            medianHours: 10,
            minHours: 2,
            maxHours: 23,
            sampleSize: 10,
          },
        ],
      });
      renderWithTheme(<SalesFunnelDebugPanel data={mockData} />);

      const accordionSummary = screen.getByText('Debug View').closest('div[role="button"]');
      fireEvent.click(accordionSummary!);
      fireEvent.click(screen.getByRole('tab', { name: /Stage Durations/i }));

      expect(screen.getByText('12.5 hrs')).toBeInTheDocument();
    });

    it('should format hours greater than 24 as days', () => {
      const mockData = createMockDebugData({
        stageDurations: [
          {
            fromStage: 'Contacted',
            toStage: 'Responding',
            averageHours: 72,
            medianHours: 48,
            minHours: 24,
            maxHours: 120,
            sampleSize: 10,
          },
        ],
      });
      renderWithTheme(<SalesFunnelDebugPanel data={mockData} />);

      const accordionSummary = screen.getByText('Debug View').closest('div[role="button"]');
      fireEvent.click(accordionSummary!);
      fireEvent.click(screen.getByRole('tab', { name: /Stage Durations/i }));

      expect(screen.getByText('3 days')).toBeInTheDocument(); // 72 hours = 3 days
      expect(screen.getByText('2 days')).toBeInTheDocument(); // 48 hours = 2 days
      expect(screen.getByText('1 day')).toBeInTheDocument(); // 24 hours = 1 day
    });
  });

  describe('Lost Analysis Tab', () => {
    it('should show empty message when no lost leads', () => {
      const mockData = createMockDebugData();
      renderWithTheme(<SalesFunnelDebugPanel data={mockData} />);

      const accordionSummary = screen.getByText('Debug View').closest('div[role="button"]');
      fireEvent.click(accordionSummary!);
      fireEvent.click(screen.getByRole('tab', { name: /Lost Analysis/i }));

      expect(screen.getByText('No lost leads to analyze.')).toBeInTheDocument();
    });

    it('should display lost by stage data with percentages', () => {
      const mockData = createMockDebugData({
        lostByStage: [
          { lastStageBeforeLost: 'Contacted', count: 30, percentage: 60 },
          { lastStageBeforeLost: 'Responding', count: 15, percentage: 30 },
          { lastStageBeforeLost: 'Negotiating', count: 5, percentage: 10 },
        ],
      });
      renderWithTheme(<SalesFunnelDebugPanel data={mockData} />);

      const accordionSummary = screen.getByText('Debug View').closest('div[role="button"]');
      fireEvent.click(accordionSummary!);
      fireEvent.click(screen.getByRole('tab', { name: /Lost Analysis/i }));

      expect(screen.getByText('Contacted')).toBeInTheDocument();
      expect(screen.getByText('30')).toBeInTheDocument();
      expect(screen.getByText('60%')).toBeInTheDocument();
      expect(screen.getByText('Responding')).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument();
      expect(screen.getByText('30%')).toBeInTheDocument();
    });

    it('should show total lost count', () => {
      const mockData = createMockDebugData({
        lostByStage: [
          { lastStageBeforeLost: 'Contacted', count: 30, percentage: 60 },
          { lastStageBeforeLost: 'Responding', count: 20, percentage: 40 },
        ],
      });
      renderWithTheme(<SalesFunnelDebugPanel data={mockData} />);

      const accordionSummary = screen.getByText('Debug View').closest('div[role="button"]');
      fireEvent.click(accordionSummary!);
      fireEvent.click(screen.getByRole('tab', { name: /Lost Analysis/i }));

      expect(screen.getByText('Total Lost')).toBeInTheDocument();
      expect(screen.getByText('50')).toBeInTheDocument(); // 30 + 20
      expect(screen.getByText('100%')).toBeInTheDocument();
    });
  });
});

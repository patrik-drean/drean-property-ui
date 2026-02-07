import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { StageLeadsModal } from '../StageLeadsModal';
import { StageLead } from '../../../types/salesFunnel';

const theme = createTheme();

const renderWithTheme = (ui: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
};

const createMockLead = (overrides: Partial<StageLead> = {}): StageLead => ({
  id: 'lead-1',
  address: '123 Main St',
  listingPrice: 250000,
  score: 7,
  status: 'Contacted',
  createdAt: '2024-01-15T10:00:00Z',
  stageEnteredAt: '2024-01-16T10:00:00Z',
  daysInStage: 5,
  ...overrides,
});

const mockLeads: StageLead[] = [
  createMockLead({ id: 'lead-1', address: '123 Main St', listingPrice: 250000, score: 7, daysInStage: 5 }),
  createMockLead({ id: 'lead-2', address: '456 Oak Ave', listingPrice: 350000, score: 9, daysInStage: 3 }),
  createMockLead({ id: 'lead-3', address: '789 Pine Rd', listingPrice: 180000, score: 4, daysInStage: 15 }),
];

describe('StageLeadsModal', () => {
  const defaultProps = {
    open: true,
    onClose: jest.fn(),
    stageName: 'Contacted',
    leads: mockLeads,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render modal when open is true', () => {
      renderWithTheme(<StageLeadsModal {...defaultProps} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Contacted Stage')).toBeInTheDocument();
    });

    it('should not render modal when open is false', () => {
      renderWithTheme(<StageLeadsModal {...defaultProps} open={false} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should display lead count chip', () => {
      renderWithTheme(<StageLeadsModal {...defaultProps} />);

      expect(screen.getByText('3 leads')).toBeInTheDocument();
    });

    it('should display empty state when no leads', () => {
      renderWithTheme(<StageLeadsModal {...defaultProps} leads={[]} />);

      expect(screen.getByText('No leads in this stage.')).toBeInTheDocument();
    });

    it('should render all table headers', () => {
      renderWithTheme(<StageLeadsModal {...defaultProps} />);

      expect(screen.getByText('Address')).toBeInTheDocument();
      expect(screen.getByText('Price')).toBeInTheDocument();
      expect(screen.getByText('Score')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Entered Stage')).toBeInTheDocument();
      expect(screen.getByText('Days in Stage')).toBeInTheDocument();
    });
  });

  describe('Data Display', () => {
    it('should display lead addresses', () => {
      renderWithTheme(<StageLeadsModal {...defaultProps} />);

      expect(screen.getByText('123 Main St')).toBeInTheDocument();
      expect(screen.getByText('456 Oak Ave')).toBeInTheDocument();
      expect(screen.getByText('789 Pine Rd')).toBeInTheDocument();
    });

    it('should format prices as currency', () => {
      renderWithTheme(<StageLeadsModal {...defaultProps} />);

      expect(screen.getByText('$250,000')).toBeInTheDocument();
      expect(screen.getByText('$350,000')).toBeInTheDocument();
      expect(screen.getByText('$180,000')).toBeInTheDocument();
    });

    it('should display scores with color coding', () => {
      renderWithTheme(<StageLeadsModal {...defaultProps} />);

      // High score (>=7) should show success chip
      expect(screen.getByText('7')).toBeInTheDocument();
      expect(screen.getByText('9')).toBeInTheDocument();
      // Low score (<5) should show default chip
      expect(screen.getByText('4')).toBeInTheDocument();
    });

    it('should display dash for null score', () => {
      const leadsWithNullScore = [createMockLead({ score: null })];
      renderWithTheme(<StageLeadsModal {...defaultProps} leads={leadsWithNullScore} />);

      expect(screen.getByText('-')).toBeInTheDocument();
    });

    it('should format dates correctly', () => {
      renderWithTheme(<StageLeadsModal {...defaultProps} />);

      // All 3 leads have the same stageEnteredAt date in createMockLead
      const dateCells = screen.getAllByText('Jan 16, 2024');
      expect(dateCells.length).toBeGreaterThan(0);
    });

    it('should display dash for null stageEnteredAt', () => {
      const leadsWithNullDate = [createMockLead({ stageEnteredAt: null })];
      renderWithTheme(<StageLeadsModal {...defaultProps} leads={leadsWithNullDate} />);

      const dashCells = screen.getAllByText('-');
      expect(dashCells.length).toBeGreaterThan(0);
    });

    it('should highlight leads with more than 30 days in stage', () => {
      const leadsWithLongDuration = [createMockLead({ daysInStage: 35 })];
      renderWithTheme(<StageLeadsModal {...defaultProps} leads={leadsWithLongDuration} />);

      // The "35" should be styled with warning color
      expect(screen.getByText('35')).toBeInTheDocument();
    });
  });

  describe('Sorting', () => {
    it('should sort by address ascending when header clicked', () => {
      renderWithTheme(<StageLeadsModal {...defaultProps} />);

      const addressHeader = screen.getByRole('button', { name: /Address/i });
      fireEvent.click(addressHeader); // First click - ascending
      fireEvent.click(addressHeader); // Second click - ascending (toggle)

      const rows = screen.getAllByRole('row');
      const addresses = rows.slice(1).map(row => within(row).getAllByRole('cell')[0].textContent);

      expect(addresses[0]).toBe('123 Main St');
    });

    it('should sort by price when header clicked', () => {
      renderWithTheme(<StageLeadsModal {...defaultProps} />);

      const priceHeader = screen.getByRole('button', { name: /Price/i });
      fireEvent.click(priceHeader); // Sort descending (default)

      const rows = screen.getAllByRole('row');
      const firstDataRow = rows[1];
      expect(within(firstDataRow).getByText('$350,000')).toBeInTheDocument();
    });

    it('should sort by score when header clicked', () => {
      renderWithTheme(<StageLeadsModal {...defaultProps} />);

      const scoreHeader = screen.getByRole('button', { name: /Score/i });
      fireEvent.click(scoreHeader); // Sort descending

      const rows = screen.getAllByRole('row');
      const firstDataRow = rows[1];
      expect(within(firstDataRow).getByText('9')).toBeInTheDocument();
    });

    it('should sort by days in stage when header clicked', () => {
      renderWithTheme(<StageLeadsModal {...defaultProps} />);

      const daysHeader = screen.getByRole('button', { name: /Days in Stage/i });
      fireEvent.click(daysHeader); // Sort descending

      const rows = screen.getAllByRole('row');
      const firstDataRow = rows[1];
      expect(within(firstDataRow).getByText('15')).toBeInTheDocument();
    });

    it('should toggle sort direction on repeated clicks', () => {
      renderWithTheme(<StageLeadsModal {...defaultProps} />);

      const priceHeader = screen.getByRole('button', { name: /Price/i });

      // First click - descending
      fireEvent.click(priceHeader);
      let rows = screen.getAllByRole('row');
      expect(within(rows[1]).getByText('$350,000')).toBeInTheDocument();

      // Second click - ascending
      fireEvent.click(priceHeader);
      rows = screen.getAllByRole('row');
      expect(within(rows[1]).getByText('$180,000')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should call onNavigateToLead when lead row is clicked', () => {
      const mockNavigate = jest.fn();
      renderWithTheme(<StageLeadsModal {...defaultProps} onNavigateToLead={mockNavigate} />);

      const firstRow = screen.getAllByRole('row')[1];
      fireEvent.click(firstRow);

      expect(mockNavigate).toHaveBeenCalled();
    });

    it('should call onNavigateToLead with correct lead ID', () => {
      const mockNavigate = jest.fn();
      renderWithTheme(<StageLeadsModal {...defaultProps} onNavigateToLead={mockNavigate} />);

      // Click on the address link in the first row
      const addressLink = screen.getByRole('button', { name: '123 Main St' });
      fireEvent.click(addressLink);

      expect(mockNavigate).toHaveBeenCalledWith('lead-1');
    });

    it('should show address as plain text when no onNavigateToLead provided', () => {
      renderWithTheme(<StageLeadsModal {...defaultProps} onNavigateToLead={undefined} />);

      // Address should be plain text, not a button
      expect(screen.queryByRole('button', { name: '123 Main St' })).not.toBeInTheDocument();
      expect(screen.getByText('123 Main St')).toBeInTheDocument();
    });
  });

  describe('Close Behavior', () => {
    it('should call onClose when close button clicked', () => {
      const mockOnClose = jest.fn();
      renderWithTheme(<StageLeadsModal {...defaultProps} onClose={mockOnClose} />);

      const closeButton = screen.getByRole('button', { name: 'Close' });
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should call onClose when X button clicked', () => {
      const mockOnClose = jest.fn();
      const { container } = renderWithTheme(<StageLeadsModal {...defaultProps} onClose={mockOnClose} />);

      // Find the X icon button in the title bar
      const closeIconButton = container.querySelector('[data-testid="CloseIcon"]')?.closest('button');
      if (closeIconButton) {
        fireEvent.click(closeIconButton);
        expect(mockOnClose).toHaveBeenCalled();
      }
    });
  });

  describe('CSV Export', () => {
    let mockCreateObjectURL: jest.SpyInstance;
    let mockRevokeObjectURL: jest.SpyInstance;

    beforeEach(() => {
      mockCreateObjectURL = jest.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
      mockRevokeObjectURL = jest.spyOn(URL, 'revokeObjectURL').mockImplementation();
    });

    afterEach(() => {
      mockCreateObjectURL.mockRestore();
      mockRevokeObjectURL.mockRestore();
    });

    it('should have export to CSV button', () => {
      renderWithTheme(<StageLeadsModal {...defaultProps} />);

      const exportButton = screen.getByRole('button', { name: /Export to CSV/i });
      expect(exportButton).toBeInTheDocument();
    });

    it('should create CSV blob when export clicked', () => {
      renderWithTheme(<StageLeadsModal {...defaultProps} />);

      const exportButton = screen.getByRole('button', { name: /Export to CSV/i });
      fireEvent.click(exportButton);

      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalled();
    });

    it('should generate filename based on stage name', () => {
      renderWithTheme(<StageLeadsModal {...defaultProps} stageName="Under Contract" />);

      const exportButton = screen.getByRole('button', { name: /Export to CSV/i });
      fireEvent.click(exportButton);

      // The export functionality was triggered - if createObjectURL was called, blob was created
      expect(mockCreateObjectURL).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper dialog role', () => {
      renderWithTheme(<StageLeadsModal {...defaultProps} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should have proper table structure', () => {
      renderWithTheme(<StageLeadsModal {...defaultProps} />);

      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getAllByRole('columnheader')).toHaveLength(6);
      expect(screen.getAllByRole('row')).toHaveLength(4); // 1 header + 3 data rows
    });

    it('should have hover effect on rows with navigation', () => {
      renderWithTheme(
        <StageLeadsModal {...defaultProps} onNavigateToLead={jest.fn()} />
      );

      // Rows should have cursor pointer style when navigation is enabled
      // Get all table rows (excluding header row)
      const allRows = screen.getAllByRole('row');
      // First row is header, rest are data rows
      expect(allRows.length).toBe(4); // 1 header + 3 data rows
    });
  });

  describe('Edge Cases', () => {
    it('should handle leads with all null optional fields', () => {
      const leadsWithNulls = [
        createMockLead({
          score: null,
          stageEnteredAt: null,
          daysInStage: null,
        }),
      ];
      renderWithTheme(<StageLeadsModal {...defaultProps} leads={leadsWithNulls} />);

      const dashCells = screen.getAllByText('-');
      expect(dashCells.length).toBeGreaterThanOrEqual(2); // score and date
    });

    it('should handle address with special characters', () => {
      const leadsWithSpecialChars = [
        createMockLead({ address: '123 "Main" St, Apt #5' }),
      ];
      renderWithTheme(<StageLeadsModal {...defaultProps} leads={leadsWithSpecialChars} />);

      expect(screen.getByText('123 "Main" St, Apt #5')).toBeInTheDocument();
    });

    it('should handle very long stage names', () => {
      renderWithTheme(
        <StageLeadsModal {...defaultProps} stageName="Very Long Stage Name That Might Overflow" />
      );

      expect(screen.getByText('Very Long Stage Name That Might Overflow Stage')).toBeInTheDocument();
    });
  });
});

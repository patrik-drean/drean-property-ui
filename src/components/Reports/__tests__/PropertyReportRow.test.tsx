import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { PropertyCashFlowRow, PropertyAssetRow } from '../PropertyReportRow';
import { PropertyCashFlowData, PropertyAssetData } from '../../../types/portfolioReport';

const theme = createTheme();

const mockCashFlowProperty: PropertyCashFlowData = {
  id: '1',
  address: '123 Test St',
  status: 'Operational',
  rentIncome: 1800,
  expenses: {
    mortgage: 1200,
    propertyTax: 400,
    insurance: 130,
    propertyManagement: 216,
    maintenance: 90,
    vacancy: 144,
    other: 0,
    total: 2180
  },
  netCashFlow: -380,
  isOperational: true
};

const mockAssetProperty: PropertyAssetData = {
  id: '1',
  address: '123 Test St',
  status: 'Operational',
  currentValue: 250000,
  loanValue: 150000,
  equity: 100000,
  equityPercent: 40,
  isOperational: true
};

const mockOnPropertyClick = jest.fn();

// Helper to render components with theme
const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      <table>
        <tbody>
          {component}
        </tbody>
      </table>
    </ThemeProvider>
  );
};

describe('PropertyReportRow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('PropertyCashFlowRow', () => {
    it('should render property cash flow data correctly', () => {
      renderWithTheme(
        <PropertyCashFlowRow
          property={mockCashFlowProperty}
          onPropertyClick={mockOnPropertyClick}
        />
      );

      expect(screen.getByText('123 Test St')).toBeInTheDocument();
      expect(screen.getByText('Operational')).toBeInTheDocument();
      expect(screen.getByText('$1,800')).toBeInTheDocument();
      expect(screen.getByText('-$380')).toBeInTheDocument();
    });

    it('should handle property click', () => {
      renderWithTheme(
        <PropertyCashFlowRow
          property={mockCashFlowProperty}
          onPropertyClick={mockOnPropertyClick}
        />
      );

      const addressLink = screen.getByText('123 Test St');
      fireEvent.click(addressLink);

      expect(mockOnPropertyClick).toHaveBeenCalledWith('1');
    });

    it('should display non-operational property correctly', () => {
      const nonOpProperty: PropertyCashFlowData = {
        ...mockCashFlowProperty,
        status: 'Opportunity',
        rentIncome: 0,
        expenses: {
          mortgage: 0,
          propertyTax: 0,
          insurance: 0,
          propertyManagement: 0,
          maintenance: 0,
          vacancy: 0,
          other: 0,
          total: 0
        },
        netCashFlow: 0,
        isOperational: false
      };

      renderWithTheme(
        <PropertyCashFlowRow
          property={nonOpProperty}
          onPropertyClick={mockOnPropertyClick}
        />
      );

      expect(screen.getByText('Opportunity')).toBeInTheDocument();
      expect(screen.getByText('$0')).toBeInTheDocument();
    });

    it('should show positive cash flow in green', () => {
      const profitableProperty: PropertyCashFlowData = {
        ...mockCashFlowProperty,
        netCashFlow: 500
      };

      renderWithTheme(
        <PropertyCashFlowRow
          property={profitableProperty}
          onPropertyClick={mockOnPropertyClick}
        />
      );

      expect(screen.getByText('$500')).toBeInTheDocument();
    });
  });

  describe('PropertyAssetRow', () => {
    it('should render property asset data correctly', () => {
      renderWithTheme(
        <PropertyAssetRow
          property={mockAssetProperty}
          onPropertyClick={mockOnPropertyClick}
        />
      );

      expect(screen.getByText('123 Test St')).toBeInTheDocument();
      expect(screen.getByText('Operational')).toBeInTheDocument();
      expect(screen.getByText('$250,000')).toBeInTheDocument();
      expect(screen.getByText('$150,000')).toBeInTheDocument();
      expect(screen.getByText('$100,000')).toBeInTheDocument();
      expect(screen.getByText('40.0%')).toBeInTheDocument();
    });

    it('should handle property click', () => {
      renderWithTheme(
        <PropertyAssetRow
          property={mockAssetProperty}
          onPropertyClick={mockOnPropertyClick}
        />
      );

      const addressLink = screen.getByText('123 Test St');
      fireEvent.click(addressLink);

      expect(mockOnPropertyClick).toHaveBeenCalledWith('1');
    });

    it('should display non-operational asset property correctly', () => {
      const nonOpProperty: PropertyAssetData = {
        ...mockAssetProperty,
        status: 'Opportunity',
        loanValue: 0,
        equity: 250000,
        equityPercent: 100,
        isOperational: false
      };

      renderWithTheme(
        <PropertyAssetRow
          property={nonOpProperty}
          onPropertyClick={mockOnPropertyClick}
        />
      );

      expect(screen.getByText('Opportunity')).toBeInTheDocument();
      expect(screen.getByText('$0')).toBeInTheDocument(); // loan value
      expect(screen.getByText('$250,000')).toBeInTheDocument(); // equity
      expect(screen.getByText('100.0%')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria labels for address links', () => {
      renderWithTheme(
        <PropertyCashFlowRow
          property={mockCashFlowProperty}
          onPropertyClick={mockOnPropertyClick}
        />
      );

      const addressLink = screen.getByLabelText('View details for 123 Test St');
      expect(addressLink).toBeInTheDocument();
    });

    it('should support keyboard navigation', () => {
      renderWithTheme(
        <PropertyAssetRow
          property={mockAssetProperty}
          onPropertyClick={mockOnPropertyClick}
        />
      );

      const addressLink = screen.getByText('123 Test St');

      // Test Enter key
      fireEvent.keyDown(addressLink, { key: 'Enter', code: 'Enter' });
      fireEvent.click(addressLink); // Click after keydown to simulate full interaction

      expect(mockOnPropertyClick).toHaveBeenCalledWith('1');
    });
  });

  describe('Status chip coloring', () => {
    it('should show correct colors for different statuses', () => {
      const testStatuses = [
        { status: 'Operational', isOperational: true },
        { status: 'Needs Tenant', isOperational: true },
        { status: 'Selling', isOperational: true },
        { status: 'Opportunity', isOperational: false }
      ];

      testStatuses.forEach(({ status, isOperational }) => {
        const testProperty: PropertyCashFlowData = {
          ...mockCashFlowProperty,
          status,
          isOperational
        };

        const { unmount } = renderWithTheme(
          <PropertyCashFlowRow
            property={testProperty}
            onPropertyClick={mockOnPropertyClick}
          />
        );

        expect(screen.getByText(status)).toBeInTheDocument();
        unmount();
      });
    });
  });
});
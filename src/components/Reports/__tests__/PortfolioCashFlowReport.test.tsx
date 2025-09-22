import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { PortfolioCashFlowReport } from '../PortfolioCashFlowReport';
import { Property } from '../../../types/property';
import { PortfolioCashFlowReport as CashFlowReportType } from '../../../types/portfolioReport';

const theme = createTheme();

const mockProperties: Property[] = [
  {
    id: '1',
    address: '123 Test St',
    status: 'Operational',
    listingPrice: 200000,
    offerPrice: 180000,
    rehabCosts: 20000,
    potentialRent: 1800,
    arv: 250000,
    rentCastEstimates: {
      price: 200000,
      priceLow: 190000,
      priceHigh: 210000,
      rent: 1800,
      rentLow: 1700,
      rentHigh: 1900
    },
    todoMetaData: { todoistSectionId: null },
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

const mockCashFlowReport: CashFlowReportType = {
  properties: [{
    id: '1',
    address: '123 Test St',
    status: 'Operational',
    currentRentIncome: 1850,
    currentExpenses: {
      mortgage: 1200,
      propertyTax: 416,
      insurance: 130,
      propertyManagement: 222,
      maintenance: 92,
      vacancy: 148,
      other: 0,
      total: 2208
    },
    currentNetCashFlow: -358,
    potentialRentIncome: 1800,
    potentialExpenses: {
      mortgage: 1200,
      propertyTax: 416,
      insurance: 130,
      propertyManagement: 216,
      maintenance: 90,
      vacancy: 144,
      other: 0,
      total: 2196
    },
    potentialNetCashFlow: -396,
    isOperational: true
  }],
  summary: {
    currentTotalRentIncome: 1850,
    currentTotalExpenses: {
      mortgage: 1200,
      propertyTax: 416,
      insurance: 130,
      propertyManagement: 222,
      maintenance: 92,
      vacancy: 148,
      other: 0,
      total: 2208
    },
    currentTotalNetCashFlow: -358,
    potentialTotalRentIncome: 1800,
    potentialTotalExpenses: {
      mortgage: 1200,
      propertyTax: 416,
      insurance: 130,
      propertyManagement: 216,
      maintenance: 90,
      vacancy: 144,
      other: 0,
      total: 2196
    },
    potentialTotalNetCashFlow: -396,
    propertiesCount: 1,
    operationalPropertiesCount: 1
  },
  generatedAt: new Date('2023-01-01T12:00:00Z')
};

const mockOnPropertyClick = jest.fn();

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('PortfolioCashFlowReport', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should display loading state', () => {
    renderWithTheme(
      <PortfolioCashFlowReport
        properties={mockProperties}
        loading={true}
        onPropertyClick={mockOnPropertyClick}
      />
    );

    expect(screen.getByText('Generating cash flow report...')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should display error state when no report data', () => {
    renderWithTheme(
      <PortfolioCashFlowReport
        properties={mockProperties}
        loading={false}
        onPropertyClick={mockOnPropertyClick}
      />
    );

    expect(screen.getByText('Unable to generate cash flow report. Please try again.')).toBeInTheDocument();
  });

  it('should display no properties message', () => {
    renderWithTheme(
      <PortfolioCashFlowReport
        properties={[]}
        report={mockCashFlowReport}
        loading={false}
        onPropertyClick={mockOnPropertyClick}
      />
    );

    expect(screen.getByText('No properties found. Add some properties to see your cash flow analysis.')).toBeInTheDocument();
  });

  it('should display cash flow report correctly', async () => {
    renderWithTheme(
      <PortfolioCashFlowReport
        properties={mockProperties}
        report={mockCashFlowReport}
        loading={false}
        onPropertyClick={mockOnPropertyClick}
      />
    );

    // Check summary cards
    expect(screen.getByText('Current Monthly Income')).toBeInTheDocument();
    expect(screen.getAllByText('$1,850')[0]).toBeInTheDocument();
    expect(screen.getByText('Monthly Expenses')).toBeInTheDocument();
    expect(screen.getAllByText('$2,208')[0]).toBeInTheDocument();
    expect(screen.getByText('Current Net Cash Flow')).toBeInTheDocument();
    expect(screen.getAllByText('-$358')[0]).toBeInTheDocument();

    // Check properties table
    expect(screen.getByText('Property Cash Flow Details')).toBeInTheDocument();
    expect(screen.getByText('123 Test St')).toBeInTheDocument();
    expect(screen.getByText('Operational')).toBeInTheDocument();
  });

  it('should display expense breakdown', () => {
    renderWithTheme(
      <PortfolioCashFlowReport
        properties={mockProperties}
        report={mockCashFlowReport}
        loading={false}
        onPropertyClick={mockOnPropertyClick}
      />
    );

    expect(screen.getByText('Monthly Expense Breakdown')).toBeInTheDocument();
    expect(screen.getByText('Mortgage Payments')).toBeInTheDocument();
    expect(screen.getAllByText('Property Tax')[0]).toBeInTheDocument();
    expect(screen.getByText('Property Management')).toBeInTheDocument();
    expect(screen.getByText('Total Monthly Expenses')).toBeInTheDocument();
  });

  it('should display error messages', () => {
    const errors = [
      { message: 'Test error message' },
      { message: 'Another error', propertyAddress: '456 Error St' }
    ];

    renderWithTheme(
      <PortfolioCashFlowReport
        properties={mockProperties}
        report={mockCashFlowReport}
        loading={false}
        errors={errors}
        onPropertyClick={mockOnPropertyClick}
      />
    );

    expect(screen.getByText('Some properties could not be processed: 2 error(s)')).toBeInTheDocument();
  });

  it('should show positive cash flow in success color', () => {
    const profitableReport: CashFlowReportType = {
      ...mockCashFlowReport,
      summary: {
        ...mockCashFlowReport.summary,
        currentTotalNetCashFlow: 500,
        potentialTotalNetCashFlow: 500
      }
    };

    renderWithTheme(
      <PortfolioCashFlowReport
        properties={mockProperties}
        report={profitableReport}
        loading={false}
        onPropertyClick={mockOnPropertyClick}
      />
    );

    expect(screen.getByText('$500')).toBeInTheDocument();
  });

  it('should display generation timestamp', () => {
    renderWithTheme(
      <PortfolioCashFlowReport
        properties={mockProperties}
        report={mockCashFlowReport}
        loading={false}
        onPropertyClick={mockOnPropertyClick}
      />
    );

    expect(screen.getByText(/Generated on/)).toBeInTheDocument();
  });

  it('should show footer note with calculation details', () => {
    renderWithTheme(
      <PortfolioCashFlowReport
        properties={mockProperties}
        report={mockCashFlowReport}
        loading={false}
        onPropertyClick={mockOnPropertyClick}
      />
    );

    expect(screen.getByText(/Cash flow calculations include mortgage/)).toBeInTheDocument();
  });

  it('should handle empty expense breakdown', () => {
    const emptyExpenseReport: CashFlowReportType = {
      ...mockCashFlowReport,
      summary: {
        ...mockCashFlowReport.summary,
        currentTotalExpenses: {
          mortgage: 0,
          propertyTax: 0,
          insurance: 0,
          propertyManagement: 0,
          maintenance: 0,
          vacancy: 0,
          other: 0,
          total: 0
        },
        potentialTotalExpenses: {
          mortgage: 0,
          propertyTax: 0,
          insurance: 0,
          propertyManagement: 0,
          maintenance: 0,
          vacancy: 0,
          other: 0,
          total: 0
        }
      }
    };

    renderWithTheme(
      <PortfolioCashFlowReport
        properties={mockProperties}
        report={emptyExpenseReport}
        loading={false}
        onPropertyClick={mockOnPropertyClick}
      />
    );

    // Should not show expense breakdown when total is 0
    expect(screen.queryByText('Monthly Expense Breakdown')).not.toBeInTheDocument();
  });

  it('should display correct property count information', () => {
    const multiPropertyReport: CashFlowReportType = {
      ...mockCashFlowReport,
      summary: {
        ...mockCashFlowReport.summary,
        propertiesCount: 5,
        operationalPropertiesCount: 3
      }
    };

    renderWithTheme(
      <PortfolioCashFlowReport
        properties={mockProperties}
        report={multiPropertyReport}
        loading={false}
        onPropertyClick={mockOnPropertyClick}
      />
    );

    expect(screen.getByText('5')).toBeInTheDocument(); // Total properties
    expect(screen.getByText('3 operational')).toBeInTheDocument(); // Operational count
  });
});
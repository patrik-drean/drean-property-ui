import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import InvestmentSummaryGenerator from '../InvestmentSummaryGenerator';
import { Property } from '../../../types/property';
import * as investmentReportService from '../../../services/investmentReportService';

// Mock the PDF generation service
jest.mock('../../../services/investmentReportService', () => ({
  generateInvestmentSummary: jest.fn(),
  validatePropertyData: jest.fn(),
  prepareReportData: jest.fn(),
  formatCurrency: jest.fn((value) => `$${value.toLocaleString()}`),
  formatPercentage: jest.fn((value) => `${(value * 100).toFixed(1)}%`),
}));

const mockProperty: Property = {
  id: '1',
  address: '123 Test St, Test City, TS 12345',
  status: 'Opportunity',
  listingPrice: 180000,
  offerPrice: 150000,
  rehabCosts: 25000,
  potentialRent: 1800,
  arv: 220000,
  rentCastEstimates: {
    price: 215000,
    priceLow: 200000,
    priceHigh: 230000,
    rent: 1750,
    rentLow: 1650,
    rentHigh: 1850,
  },
  hasRentcastData: true,
  notes: 'Test property for investment analysis',
  score: 8,
  zillowLink: 'https://zillow.com/test',
  squareFootage: 1200,
  units: 1,
  actualRent: 1650,
  currentHouseValue: 200000,
  currentLoanValue: 120000,
  propertyUnits: [],
  monthlyExpenses: {
    id: '1',
    propertyId: '1',
    mortgage: 800,
    taxes: 250,
    insurance: 150,
    propertyManagement: 165,
    utilities: 100,
    vacancy: 90,
    capEx: 100,
    other: 50,
    total: 1705,
    createdAt: '2023-01-01',
    updatedAt: '2023-01-01',
  },
  capitalCosts: {
    id: '1',
    propertyId: '1',
    closingCosts: 3000,
    upfrontRepairs: 25000,
    downPayment: 30000,
    other: 2000,
    total: 60000,
    createdAt: '2023-01-01',
    updatedAt: '2023-01-01',
  },
};

const mockCalculations = {
  rentRatio: 0.012,
  arvRatio: 0.795,
  holdScore: 8,
  flipScore: 7,
  holdScoreBreakdown: { totalScore: 8, cashflowScore: 6, rentRatioScore: 2 },
  flipScoreBreakdown: { totalScore: 7, arvRatioScore: 6, equityScore: 1 },
  homeEquity: 45000,
  monthlyCashflow: 95,
  newLoan: 154000,
  totalCapitalRequired: 60000,
  downPayment: 30000,
  closingCosts: 3000,
  upfrontRepairs: 25000,
  otherCapitalCosts: 2000,
  annualCashflow: 1140,
  monthlyIncome: 1800,
  monthlyExpenses: 1705,
  roiProjection: 0.019,
};

describe('InvestmentSummaryGenerator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (investmentReportService.validatePropertyData as jest.Mock).mockReturnValue([]);
    (investmentReportService.prepareReportData as jest.Mock).mockReturnValue({
      property: mockProperty,
      calculations: mockCalculations,
      generatedAt: new Date('2023-12-01'),
    });
  });

  it('renders the generate button', () => {
    render(<InvestmentSummaryGenerator property={mockProperty} />);

    expect(screen.getByText('Generate Investment Summary')).toBeInTheDocument();
  });

  it('opens preview dialog when button is clicked', async () => {
    render(<InvestmentSummaryGenerator property={mockProperty} />);

    fireEvent.click(screen.getByText('Generate Investment Summary'));

    await waitFor(() => {
      expect(screen.getByText('Investment Summary Preview')).toBeInTheDocument();
    });
  });

  it('displays property information in preview', async () => {
    render(<InvestmentSummaryGenerator property={mockProperty} />);

    fireEvent.click(screen.getByText('Generate Investment Summary'));

    await waitFor(() => {
      expect(screen.getByText('123 Test St, Test City, TS 12345')).toBeInTheDocument();
      expect(screen.getByText('Status: Opportunity')).toBeInTheDocument();
    });
  });

  it('displays investment metrics in preview', async () => {
    render(<InvestmentSummaryGenerator property={mockProperty} />);

    fireEvent.click(screen.getByText('Generate Investment Summary'));

    await waitFor(() => {
      expect(screen.getByText('Investment Scores')).toBeInTheDocument();
      expect(screen.getByText('Monthly Cashflow')).toBeInTheDocument();
      expect(screen.getByText('Home Equity')).toBeInTheDocument();
    });
  });

  it('calls PDF generation when download button is clicked', async () => {
    (investmentReportService.generateInvestmentSummary as jest.Mock).mockResolvedValue(undefined);

    render(<InvestmentSummaryGenerator property={mockProperty} />);

    fireEvent.click(screen.getByText('Generate Investment Summary'));

    await waitFor(() => {
      expect(screen.getByText('Download PDF Report')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Download PDF Report'));

    await waitFor(() => {
      expect(investmentReportService.generateInvestmentSummary).toHaveBeenCalledWith(mockProperty);
    });
  });

  it('displays errors when property data is invalid', async () => {
    const errors = [
      { field: 'offerPrice', message: 'Valid offer price is required', severity: 'error' as const }
    ];
    (investmentReportService.validatePropertyData as jest.Mock).mockReturnValue(errors);

    render(<InvestmentSummaryGenerator property={mockProperty} />);

    fireEvent.click(screen.getByText('Generate Investment Summary'));

    await waitFor(() => {
      expect(screen.getByText('Cannot generate report due to missing required data:')).toBeInTheDocument();
      expect(screen.getByText('Valid offer price is required')).toBeInTheDocument();
    });
  });

  it('displays warnings when optional data is missing', async () => {
    const warnings = [
      { field: 'capitalCosts', message: 'Capital costs data missing - will use defaults', severity: 'warning' as const }
    ];
    (investmentReportService.validatePropertyData as jest.Mock).mockReturnValue(warnings);

    render(<InvestmentSummaryGenerator property={mockProperty} />);

    fireEvent.click(screen.getByText('Generate Investment Summary'));

    await waitFor(() => {
      expect(screen.getByText('Report will use default values for missing data:')).toBeInTheDocument();
      expect(screen.getByText('Capital costs data missing - will use defaults')).toBeInTheDocument();
    });
  });

  it('disables download button when there are errors', async () => {
    const errors = [
      { field: 'offerPrice', message: 'Valid offer price is required', severity: 'error' as const }
    ];
    (investmentReportService.validatePropertyData as jest.Mock).mockReturnValue(errors);

    render(<InvestmentSummaryGenerator property={mockProperty} />);

    fireEvent.click(screen.getByText('Generate Investment Summary'));

    await waitFor(() => {
      expect(screen.getByText('Download PDF Report')).toBeDisabled();
    });
  });

  it('renders icon variant correctly', () => {
    render(<InvestmentSummaryGenerator property={mockProperty} variant="icon" />);

    const button = screen.getByRole('button');
    expect(button).toHaveStyle('border-radius: 50%');
  });

  it('handles PDF generation errors gracefully', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    (investmentReportService.generateInvestmentSummary as jest.Mock).mockRejectedValue(
      new Error('PDF generation failed')
    );

    render(<InvestmentSummaryGenerator property={mockProperty} />);

    fireEvent.click(screen.getByText('Generate Investment Summary'));

    await waitFor(() => {
      expect(screen.getByText('Download PDF Report')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Download PDF Report'));

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith('Error generating investment summary:', expect.any(Error));
    });

    consoleError.mockRestore();
  });
});
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { format, subMonths, startOfMonth } from 'date-fns';
import { PropertyPLReport } from '../PropertyPLReport';
import { transactionApi } from '../../../services/transactionApi';
import PropertyService from '../../../services/PropertyService';

jest.mock('../../../services/transactionApi');
jest.mock('../../../services/PropertyService');

const theme = createTheme();
const propertyId = 'prop-1';
const lastFullMonth = format(subMonths(startOfMonth(new Date()), 1), 'yyyy-MM');

const mockProperty = {
  id: propertyId,
  address: '1109 Rivas St San Antonio TX',
  units: 2,
  propertyUnits: [
    { id: 'u1', propertyId, unitNumber: '1', status: 'Occupied', rent: 1000 },
    { id: 'u2', propertyId, unitNumber: '2', status: 'Vacant', rent: 1000 },
  ],
};

const mockTransactions = [
  {
    id: '1',
    propertyId,
    date: `${lastFullMonth}-05`,
    amount: 1000,
    category: 'Rent',
    unit: '1',
    expenseType: 'Operating',
  },
  {
    id: '2',
    propertyId,
    date: `${lastFullMonth}-10`,
    amount: -300,
    category: 'Utilities',
    expenseType: 'Operating',
  },
];

const renderWithTheme = (component: React.ReactElement) =>
  render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);

describe('PropertyPLReport', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (PropertyService.getPropertyById as jest.Mock).mockResolvedValue(mockProperty);
    (transactionApi.getByProperty as jest.Mock).mockResolvedValue(mockTransactions);
  });

  it('shows the address as the heading with the reporting period', async () => {
    renderWithTheme(<PropertyPLReport propertyId={propertyId} />);

    await waitFor(() => {
      expect(screen.getByText('1109 Rivas St San Antonio TX')).toBeInTheDocument();
    });
    expect(screen.getByText(/Property P&L Report ·/)).toBeInTheDocument();
  });

  it('no longer renders the urgent items alerts', async () => {
    renderWithTheme(<PropertyPLReport propertyId={propertyId} />);

    await waitFor(() => {
      expect(screen.getByText('SUMMARY')).toBeInTheDocument();
    });
    expect(screen.queryByText('Urgent Items')).not.toBeInTheDocument();
    expect(screen.queryByText(/Negative Cashflow:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Vacancy:/)).not.toBeInTheDocument();
  });

  it('renders the summary block with occupancy and net income', async () => {
    renderWithTheme(<PropertyPLReport propertyId={propertyId} />);

    await waitFor(() => {
      expect(screen.getByText('Units Occupied')).toBeInTheDocument();
    });

    // One unit paid rent last month, out of two units
    expect(screen.getByText('1/2')).toBeInTheDocument();

    // Net income appears in the summary block and again after expenses
    expect(screen.getAllByText('Net Income')).toHaveLength(2);
    expect(screen.getAllByText('$700.00').length).toBeGreaterThan(0);
  });

  it('renders the KPI strip instead of separate summary sections', async () => {
    renderWithTheme(<PropertyPLReport propertyId={propertyId} />);

    await waitFor(() => {
      expect(screen.getByText('Last Month Cashflow')).toBeInTheDocument();
    });
    expect(screen.getByText('Occupancy Rate')).toBeInTheDocument();
    expect(screen.getByText('Top Expense')).toBeInTheDocument();
    expect(screen.queryByText('Performance Metrics')).not.toBeInTheDocument();
  });

  it('renders the trend chart', async () => {
    renderWithTheme(<PropertyPLReport propertyId={propertyId} />);

    await waitFor(() => {
      expect(screen.getByText('6-Month Trend')).toBeInTheDocument();
    });
  });
});

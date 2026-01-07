import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LeadsToolbar } from '../LeadsToolbar';
import { PropertyLead } from '../../../types/property';

// Mock MUI icons
jest.mock('@mui/icons-material', () => ({
  Add: () => <span data-testid="add-icon">Add</span>,
  Delete: () => <span data-testid="delete-icon">Delete</span>,
  Archive: () => <span data-testid="archive-icon">Archive</span>,
  Assessment: () => <span data-testid="assessment-icon">Assessment</span>,
  Transform: () => <span data-testid="transform-icon">Transform</span>,
  Search: () => <span data-testid="search-icon">Search</span>,
  Close: () => <span data-testid="close-icon">Close</span>,
}));

const createMockLead = (overrides: Partial<PropertyLead> = {}): PropertyLead => ({
  id: '1',
  address: 'Test Address',
  zillowLink: 'http://test.com',
  listingPrice: 100000,
  sellerPhone: '555-1234',
  sellerEmail: 'test@test.com',
  lastContactDate: null,
  respondedDate: null,
  convertedDate: null,
  underContractDate: null,
  soldDate: null,
  notes: '',
  squareFootage: 1000,
  units: 1,
  convertedToProperty: false,
  archived: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  leadScore: null,
  tags: [],
  ...overrides,
});

const defaultProps = {
  propertyLeads: [] as PropertyLead[],
  selectedLeads: [] as string[],
  showArchived: false,
  locallyConvertedLeads: new Set<string>(),
  searchQuery: '',
  onSearchChange: jest.fn(),
  onAddLead: jest.fn(),
  onToggleShowArchived: jest.fn(),
  onBulkDelete: jest.fn(),
};

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
};

describe('LeadsToolbar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the title "Property Leads"', () => {
    renderWithRouter(<LeadsToolbar {...defaultProps} />);
    expect(screen.getByText('Property Leads')).toBeInTheDocument();
  });

  it('should render Add Lead button', () => {
    renderWithRouter(<LeadsToolbar {...defaultProps} />);
    expect(screen.getByText('Add Lead')).toBeInTheDocument();
  });

  it('should call onAddLead when Add Lead button is clicked', () => {
    const onAddLead = jest.fn();
    renderWithRouter(<LeadsToolbar {...defaultProps} onAddLead={onAddLead} />);

    fireEvent.click(screen.getByText('Add Lead'));
    expect(onAddLead).toHaveBeenCalledTimes(1);
  });

  it('should render View Sales Report link', () => {
    renderWithRouter(<LeadsToolbar {...defaultProps} />);
    expect(screen.getByText('View Sales Report')).toBeInTheDocument();
  });

  it('should show "Archived Leads" when showArchived is false', () => {
    renderWithRouter(<LeadsToolbar {...defaultProps} showArchived={false} />);
    expect(screen.getByText('Archived Leads')).toBeInTheDocument();
  });

  it('should show "Hide Archived" when showArchived is true', () => {
    renderWithRouter(<LeadsToolbar {...defaultProps} showArchived={true} />);
    expect(screen.getByText('Hide Archived')).toBeInTheDocument();
  });

  it('should call onToggleShowArchived when archive button is clicked', () => {
    const onToggleShowArchived = jest.fn();
    renderWithRouter(
      <LeadsToolbar {...defaultProps} onToggleShowArchived={onToggleShowArchived} />
    );

    fireEvent.click(screen.getByText('Archived Leads'));
    expect(onToggleShowArchived).toHaveBeenCalledTimes(1);
  });

  it('should not show delete button when no leads are selected', () => {
    renderWithRouter(<LeadsToolbar {...defaultProps} selectedLeads={[]} />);
    expect(screen.queryByText(/Delete Selected/)).not.toBeInTheDocument();
  });

  it('should show delete button with count when leads are selected', () => {
    renderWithRouter(
      <LeadsToolbar {...defaultProps} selectedLeads={['1', '2', '3']} />
    );
    expect(screen.getByText('Delete Selected (3)')).toBeInTheDocument();
  });

  it('should call onBulkDelete when delete button is clicked', () => {
    const onBulkDelete = jest.fn();
    renderWithRouter(
      <LeadsToolbar {...defaultProps} selectedLeads={['1']} onBulkDelete={onBulkDelete} />
    );

    fireEvent.click(screen.getByText('Delete Selected (1)'));
    expect(onBulkDelete).toHaveBeenCalledTimes(1);
  });

  it('should render search input', () => {
    renderWithRouter(<LeadsToolbar {...defaultProps} />);
    expect(screen.getByPlaceholderText('Search by address...')).toBeInTheDocument();
  });

  it('should call onSearchChange when typing in search', () => {
    const onSearchChange = jest.fn();
    renderWithRouter(<LeadsToolbar {...defaultProps} onSearchChange={onSearchChange} />);

    const searchInput = screen.getByPlaceholderText('Search by address...');
    fireEvent.change(searchInput, { target: { value: 'test' } });
    expect(onSearchChange).toHaveBeenCalled();
  });
});

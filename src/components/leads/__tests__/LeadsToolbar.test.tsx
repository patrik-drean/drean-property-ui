import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LeadsToolbar } from '../LeadsToolbar';

// Mock MUI icons
jest.mock('@mui/icons-material', () => ({
  Add: () => <span data-testid="add-icon">Add</span>,
  Delete: () => <span data-testid="delete-icon">Delete</span>,
  Assessment: () => <span data-testid="assessment-icon">Assessment</span>,
  AutoAwesome: () => <span data-testid="auto-awesome-icon">AutoAwesome</span>,
}));

const defaultProps = {
  selectedLeads: [] as string[],
  onAddLead: jest.fn(),
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

  it('should render Try New View button', () => {
    renderWithRouter(<LeadsToolbar {...defaultProps} />);
    expect(screen.getByText('Try New View')).toBeInTheDocument();
  });
});

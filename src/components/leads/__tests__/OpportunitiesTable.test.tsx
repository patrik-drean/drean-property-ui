import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { MemoryRouter } from 'react-router-dom';
import { OpportunitiesTable } from '../OpportunitiesTable';
import { Property, PropertyLead, PropertyStatus } from '../../../types/property';
import { SmsConversation } from '../../../types/sms';

const theme = createTheme();

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Helper to create mock property
const createMockProperty = (overrides: Partial<Property> = {}): Property => ({
  id: '1',
  address: '123 Test St, City, State',
  status: 'Opportunity' as PropertyStatus,
  propertyLeadId: 'lead-1',
  listingPrice: 200000,
  offerPrice: 180000,
  rehabCosts: 20000,
  potentialRent: 2000,
  arv: 250000,
  rentCastEstimates: {
    price: 250000,
    priceLow: 230000,
    priceHigh: 270000,
    rent: 2000,
    rentLow: 1800,
    rentHigh: 2200,
  },
  hasRentcastData: true,
  saleComparables: [],
  notes: '',
  score: 7,
  zillowLink: 'https://zillow.com/test',
  squareFootage: 1800,
  units: 2,
  actualRent: 0,
  currentHouseValue: 200000,
  currentLoanValue: null,
  propertyUnits: [],
  monthlyExpenses: null,
  capitalCosts: null,
  ...overrides,
});

// Helper to create mock property lead
const createMockPropertyLead = (overrides: Partial<PropertyLead> = {}): PropertyLead => ({
  id: 'lead-1',
  address: '123 Test St, City, State',
  zillowLink: 'https://zillow.com/test',
  listingPrice: 200000,
  sellerPhone: '555-1234',
  sellerEmail: 'seller@test.com',
  lastContactDate: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  archived: false,
  tags: [],
  convertedToProperty: true,
  squareFootage: 1800,
  units: 2,
  notes: '',
  ...overrides,
});

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <MemoryRouter>
      <ThemeProvider theme={theme}>{ui}</ThemeProvider>
    </MemoryRouter>
  );
};

describe('OpportunitiesTable', () => {
  const mockOnMessageProperty = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Empty State', () => {
    it('should show empty state when no opportunities exist', () => {
      renderWithProviders(
        <OpportunitiesTable
          properties={[]}
          linkedLeads={new Map()}
          conversations={[]}
          onMessageProperty={mockOnMessageProperty}
        />
      );

      expect(screen.getByText('No opportunities yet')).toBeInTheDocument();
      expect(screen.getByText('Promote leads to create opportunities')).toBeInTheDocument();
    });

    it('should show empty state when properties exist but none are opportunities', () => {
      const rehabProperty = createMockProperty({
        id: '2',
        status: 'Rehab',
      });

      renderWithProviders(
        <OpportunitiesTable
          properties={[rehabProperty]}
          linkedLeads={new Map()}
          conversations={[]}
          onMessageProperty={mockOnMessageProperty}
        />
      );

      expect(screen.getByText('No opportunities yet')).toBeInTheDocument();
    });
  });

  describe('Filtering', () => {
    it('should only display properties with Opportunity status', () => {
      const properties = [
        createMockProperty({ id: '1', address: 'Opportunity Property', status: 'Opportunity' }),
        createMockProperty({ id: '2', address: 'Rehab Property', status: 'Rehab' }),
      ];

      renderWithProviders(
        <OpportunitiesTable
          properties={properties}
          linkedLeads={new Map()}
          conversations={[]}
          onMessageProperty={mockOnMessageProperty}
        />
      );

      expect(screen.getByText('Opportunity Property')).toBeInTheDocument();
      expect(screen.queryByText('Rehab Property')).not.toBeInTheDocument();
    });

    it('should display properties with Soft Offer status', () => {
      const properties = [
        createMockProperty({ id: '1', address: 'Soft Offer Property', status: 'Soft Offer' }),
      ];

      renderWithProviders(
        <OpportunitiesTable
          properties={properties}
          linkedLeads={new Map()}
          conversations={[]}
          onMessageProperty={mockOnMessageProperty}
        />
      );

      expect(screen.getByText('Soft Offer Property')).toBeInTheDocument();
    });

    it('should display properties with Hard Offer status', () => {
      const properties = [
        createMockProperty({ id: '1', address: 'Hard Offer Property', status: 'Hard Offer' }),
      ];

      renderWithProviders(
        <OpportunitiesTable
          properties={properties}
          linkedLeads={new Map()}
          conversations={[]}
          onMessageProperty={mockOnMessageProperty}
        />
      );

      expect(screen.getByText('Hard Offer Property')).toBeInTheDocument();
    });

    it('should filter out post-acquisition statuses (Operational, Needs Tenant, Selling)', () => {
      const properties = [
        createMockProperty({ id: '1', address: 'Operational Property', status: 'Operational' }),
        createMockProperty({ id: '2', address: 'Needs Tenant Property', status: 'Needs Tenant' }),
        createMockProperty({ id: '3', address: 'Selling Property', status: 'Selling' }),
        createMockProperty({ id: '4', address: 'Opportunity Property', status: 'Opportunity' }),
      ];

      renderWithProviders(
        <OpportunitiesTable
          properties={properties}
          linkedLeads={new Map()}
          conversations={[]}
          onMessageProperty={mockOnMessageProperty}
        />
      );

      expect(screen.queryByText('Operational Property')).not.toBeInTheDocument();
      expect(screen.queryByText('Needs Tenant Property')).not.toBeInTheDocument();
      expect(screen.queryByText('Selling Property')).not.toBeInTheDocument();
      expect(screen.getByText('Opportunity Property')).toBeInTheDocument();
    });
  });

  describe('Sorting', () => {
    it('should sort by status order (Opportunity, Soft Offer, Hard Offer)', () => {
      const properties = [
        createMockProperty({ id: '3', address: 'Hard Offer Property', status: 'Hard Offer' }),
        createMockProperty({ id: '1', address: 'Opportunity Property', status: 'Opportunity' }),
        createMockProperty({ id: '2', address: 'Soft Offer Property', status: 'Soft Offer' }),
      ];

      renderWithProviders(
        <OpportunitiesTable
          properties={properties}
          linkedLeads={new Map()}
          conversations={[]}
          onMessageProperty={mockOnMessageProperty}
        />
      );

      const rows = screen.getAllByRole('row');
      // First row is header, so data starts at index 1
      expect(rows[1]).toHaveTextContent('Opportunity Property');
      expect(rows[2]).toHaveTextContent('Soft Offer Property');
      expect(rows[3]).toHaveTextContent('Hard Offer Property');
    });
  });

  describe('Table Columns', () => {
    it('should render all required table headers', () => {
      const properties = [createMockProperty()];

      renderWithProviders(
        <OpportunitiesTable
          properties={properties}
          linkedLeads={new Map()}
          conversations={[]}
          onMessageProperty={mockOnMessageProperty}
        />
      );

      expect(screen.getByText('Address')).toBeInTheDocument();
      expect(screen.getByText('Units')).toBeInTheDocument();
      expect(screen.getByText('SMS')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Sq Ft')).toBeInTheDocument();
      expect(screen.getByText('Offer')).toBeInTheDocument();
      expect(screen.getByText('Rehab')).toBeInTheDocument();
      expect(screen.getByText('Rent')).toBeInTheDocument();
      expect(screen.getByText('ARV')).toBeInTheDocument();
      expect(screen.getByText('Rent %')).toBeInTheDocument();
      expect(screen.getByText('ARV %')).toBeInTheDocument();
      expect(screen.getByText('Notes')).toBeInTheDocument();
      expect(screen.getByText('Cashflow')).toBeInTheDocument();
      expect(screen.getByText('Hold')).toBeInTheDocument();
      expect(screen.getByText('Flip')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });

    it('should NOT have an Equity column', () => {
      const properties = [createMockProperty()];

      renderWithProviders(
        <OpportunitiesTable
          properties={properties}
          linkedLeads={new Map()}
          conversations={[]}
          onMessageProperty={mockOnMessageProperty}
        />
      );

      expect(screen.queryByText('Equity')).not.toBeInTheDocument();
    });

    it('should display property data correctly', () => {
      const property = createMockProperty({
        address: '456 Main St',
        units: 3,
        squareFootage: 2000,
      });

      renderWithProviders(
        <OpportunitiesTable
          properties={[property]}
          linkedLeads={new Map()}
          conversations={[]}
          onMessageProperty={mockOnMessageProperty}
        />
      );

      expect(screen.getByText('456 Main St')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('2,000')).toBeInTheDocument();
    });
  });

  describe('Notes Column', () => {
    it('should show notes icon when property has notes', () => {
      const property = createMockProperty({
        notes: 'This is a test note',
      });

      renderWithProviders(
        <OpportunitiesTable
          properties={[property]}
          linkedLeads={new Map()}
          conversations={[]}
          onMessageProperty={mockOnMessageProperty}
        />
      );

      // The Notes icon button should be visible
      expect(screen.getByTestId('NotesIcon')).toBeInTheDocument();
    });

    it('should show notes icon when linked lead has metadata', () => {
      const property = createMockProperty({
        notes: '',
        propertyLeadId: 'lead-1',
      });
      const linkedLead = createMockPropertyLead({
        id: 'lead-1',
        metadata: JSON.stringify({ source: 'Zillow', beds: 3 }),
      });
      const linkedLeadsMap = new Map([['lead-1', linkedLead]]);

      renderWithProviders(
        <OpportunitiesTable
          properties={[property]}
          linkedLeads={linkedLeadsMap}
          conversations={[]}
          onMessageProperty={mockOnMessageProperty}
        />
      );

      expect(screen.getByTestId('NotesIcon')).toBeInTheDocument();
    });

    it('should show dash when no notes or metadata', () => {
      const property = createMockProperty({
        notes: '',
        propertyLeadId: null,
      });

      renderWithProviders(
        <OpportunitiesTable
          properties={[property]}
          linkedLeads={new Map()}
          conversations={[]}
          onMessageProperty={mockOnMessageProperty}
        />
      );

      expect(screen.getByText('-')).toBeInTheDocument();
    });

    it('should show notes icon when both notes and metadata exist', () => {
      const property = createMockProperty({
        notes: 'Property notes',
        propertyLeadId: 'lead-1',
      });
      const linkedLead = createMockPropertyLead({
        id: 'lead-1',
        metadata: JSON.stringify({ source: 'Zillow' }),
      });
      const linkedLeadsMap = new Map([['lead-1', linkedLead]]);

      renderWithProviders(
        <OpportunitiesTable
          properties={[property]}
          linkedLeads={linkedLeadsMap}
          conversations={[]}
          onMessageProperty={mockOnMessageProperty}
        />
      );

      expect(screen.getByTestId('NotesIcon')).toBeInTheDocument();
    });
  });

  describe('SMS Messaging', () => {
    it('should show SMS button when property has propertyLeadId', () => {
      const property = createMockProperty({
        propertyLeadId: 'lead-1',
      });

      renderWithProviders(
        <OpportunitiesTable
          properties={[property]}
          linkedLeads={new Map()}
          conversations={[]}
          onMessageProperty={mockOnMessageProperty}
        />
      );

      expect(screen.getByTestId('SmsIcon')).toBeInTheDocument();
    });

    it('should not show SMS button when property has no propertyLeadId', () => {
      const property = createMockProperty({
        propertyLeadId: null,
      });

      renderWithProviders(
        <OpportunitiesTable
          properties={[property]}
          linkedLeads={new Map()}
          conversations={[]}
          onMessageProperty={mockOnMessageProperty}
        />
      );

      expect(screen.queryByTestId('SmsIcon')).not.toBeInTheDocument();
    });

    it('should call onMessageProperty when SMS button is clicked', () => {
      const property = createMockProperty({
        propertyLeadId: 'lead-1',
      });

      renderWithProviders(
        <OpportunitiesTable
          properties={[property]}
          linkedLeads={new Map()}
          conversations={[]}
          onMessageProperty={mockOnMessageProperty}
        />
      );

      const smsButton = screen.getByTestId('SmsIcon').closest('button');
      fireEvent.click(smsButton!);

      expect(mockOnMessageProperty).toHaveBeenCalledWith(property);
    });

    it('should show unread count badge when there are unread messages', () => {
      const property = createMockProperty({
        propertyLeadId: 'lead-1',
      });
      const conversations: SmsConversation[] = [{
        id: 'conv-1',
        phoneNumber: '555-1234',
        propertyLeadId: 'lead-1',
        unreadCount: 3,
        lastMessage: 'Test message',
        lastMessageAt: new Date().toISOString(),
      }];

      renderWithProviders(
        <OpportunitiesTable
          properties={[property]}
          linkedLeads={new Map()}
          conversations={conversations}
          onMessageProperty={mockOnMessageProperty}
        />
      );

      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should open actions menu when menu button is clicked', async () => {
      const property = createMockProperty({ id: 'prop-123', hasRentcastData: false });

      renderWithProviders(
        <OpportunitiesTable
          properties={[property]}
          linkedLeads={new Map()}
          conversations={[]}
          onMessageProperty={mockOnMessageProperty}
        />
      );

      const menuButton = screen.getByTestId('MoreVertIcon').closest('button');
      fireEvent.click(menuButton!);

      // Check that key menu items appear
      await waitFor(() => {
        expect(screen.getByText('Edit Property')).toBeInTheDocument();
      });
      expect(screen.getByText('Archive Property')).toBeInTheDocument();
      expect(screen.getByText('Send to Calculator')).toBeInTheDocument();
    });

    it('should render Zillow link when available', () => {
      const property = createMockProperty({
        zillowLink: 'https://zillow.com/test-property',
      });

      renderWithProviders(
        <OpportunitiesTable
          properties={[property]}
          linkedLeads={new Map()}
          conversations={[]}
          onMessageProperty={mockOnMessageProperty}
        />
      );

      const zillowLink = screen.getByTestId('OpenInNewIcon').closest('a');
      expect(zillowLink).toHaveAttribute('href', 'https://zillow.com/test-property');
      expect(zillowLink).toHaveAttribute('target', '_blank');
    });

    it('should link to property details page from address', () => {
      const property = createMockProperty({ id: 'prop-456' });

      renderWithProviders(
        <OpportunitiesTable
          properties={[property]}
          linkedLeads={new Map()}
          conversations={[]}
          onMessageProperty={mockOnMessageProperty}
        />
      );

      const addressLink = screen.getByRole('link', { name: property.address });
      expect(addressLink).toHaveAttribute('href', '/properties/prop-456');
    });
  });

  describe('Status Display', () => {
    it('should display status chip with correct label', () => {
      const property = createMockProperty({ status: 'Soft Offer' });

      renderWithProviders(
        <OpportunitiesTable
          properties={[property]}
          linkedLeads={new Map()}
          conversations={[]}
          onMessageProperty={mockOnMessageProperty}
        />
      );

      expect(screen.getByText('Soft Offer')).toBeInTheDocument();
    });
  });
});

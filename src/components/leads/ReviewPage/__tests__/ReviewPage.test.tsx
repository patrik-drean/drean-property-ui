import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ReviewPage } from '../ReviewPage';

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Define mocks at module level for hoisting
const mockMarkAsDone = jest.fn();
const mockMarkAsSkip = jest.fn();
const mockArchiveLead = jest.fn();
const mockChangeQueue = jest.fn();
const mockUpdateEvaluation = jest.fn();

const testLeads = [
  {
    id: 'lead-1',
    address: '123 Main Street',
    city: 'San Antonio',
    state: 'TX',
    zipCode: '78209',
    zillowLink: 'https://zillow.com/homedetails/123',
    listingPrice: 150000,
    sellerPhone: '555-123-4567',
    sellerEmail: 'seller@example.com',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    archived: false,
    tags: [],
    squareFootage: 1500,
    bedrooms: 3,
    bathrooms: 2,
    units: 1,
    notes: '',
    leadScore: 8,
    mao: 105000,
    spreadPercent: 30,
    neighborhoodGrade: 'B',
    status: 'New',
    lastContactDate: null,
    priority: 'high',
    timeSinceCreated: '2h ago',
    aiSummary: 'Strong investment opportunity.',
  },
  {
    id: 'lead-2',
    address: '456 Oak Avenue',
    city: 'Austin',
    state: 'TX',
    zipCode: '78701',
    zillowLink: 'https://zillow.com/homedetails/456',
    listingPrice: 200000,
    sellerPhone: '555-987-6543',
    sellerEmail: 'seller2@example.com',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    archived: false,
    tags: [],
    squareFootage: 1800,
    bedrooms: 4,
    bathrooms: 2,
    units: 1,
    notes: '',
    leadScore: 7,
    mao: 140000,
    spreadPercent: 25,
    neighborhoodGrade: 'B+',
    status: 'New',
    lastContactDate: null,
    priority: 'medium',
    timeSinceCreated: '4h ago',
    aiSummary: 'Good potential with some repairs needed.',
  },
];

// Mock the useLeadQueue hook - must define leads inside the mock factory
jest.mock('../../../../hooks/useLeadQueue', () => ({
  useLeadQueue: () => ({
    leads: [
      {
        id: 'lead-1',
        address: '123 Main Street',
        city: 'San Antonio',
        state: 'TX',
        zipCode: '78209',
        zillowLink: 'https://zillow.com/homedetails/123',
        listingPrice: 150000,
        sellerPhone: '555-123-4567',
        sellerEmail: 'seller@example.com',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        archived: false,
        tags: [],
        squareFootage: 1500,
        bedrooms: 3,
        bathrooms: 2,
        units: 1,
        notes: '',
        leadScore: 8,
        mao: 105000,
        spreadPercent: 30,
        neighborhoodGrade: 'B',
        status: 'New',
        lastContactDate: null,
        priority: 'high',
        timeSinceCreated: '2h ago',
        aiSummary: 'Strong investment opportunity.',
      },
      {
        id: 'lead-2',
        address: '456 Oak Avenue',
        city: 'Austin',
        state: 'TX',
        zipCode: '78701',
        zillowLink: 'https://zillow.com/homedetails/456',
        listingPrice: 200000,
        sellerPhone: '555-987-6543',
        sellerEmail: 'seller2@example.com',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        archived: false,
        tags: [],
        squareFootage: 1800,
        bedrooms: 4,
        bathrooms: 2,
        units: 1,
        notes: '',
        leadScore: 7,
        mao: 140000,
        spreadPercent: 25,
        neighborhoodGrade: 'B+',
        status: 'New',
        lastContactDate: null,
        priority: 'medium',
        timeSinceCreated: '4h ago',
        aiSummary: 'Good potential with some repairs needed.',
      },
    ],
    queueCounts: {
      action_now: 5,
      follow_up: 3,
      negotiating: 2,
      all: 10,
    },
    selectedQueue: 'action_now',
    page: 1,
    totalPages: 1,
    loading: false,
    error: null,
    connectionStatus: 'connected',
    changeQueue: (...args: unknown[]) => mockChangeQueue(...args),
    changePage: jest.fn(),
    updateLeadStatus: jest.fn(),
    archiveLead: (...args: unknown[]) => mockArchiveLead(...args),
    updateEvaluation: (...args: unknown[]) => mockUpdateEvaluation(...args),
    refetch: jest.fn(),
    markAsDone: (...args: unknown[]) => mockMarkAsDone(...args),
    markAsSkip: (...args: unknown[]) => mockMarkAsSkip(...args),
  }),
}));

// Mock the filtering functions to return leads as-is
jest.mock('../../../../hooks/useMockLeadData', () => ({
  filterLeadsByQueue: (leads: unknown[]) => leads,
  sortLeadsByPriority: (leads: unknown[]) => leads,
}));

// Mock the LeadDetailPanel since it's tested separately
jest.mock('../../DetailPanel', () => ({
  LeadDetailPanel: ({ open, lead }: { open: boolean; lead: { address: string } | null }) =>
    open ? <div data-testid="detail-panel">Detail Panel for {lead?.address}</div> : null,
}));

// Mock the AddLeadModal
jest.mock('../AddLeadModal', () => ({
  AddLeadModal: ({ open, onClose }: { open: boolean; onClose: () => void }) =>
    open ? (
      <div data-testid="add-lead-modal">
        Add Lead Modal
        <button onClick={onClose}>Close Modal</button>
      </div>
    ) : null,
}));

// Helper to render with router context
const renderWithRouter = (ui: React.ReactElement) => {
  return render(
    <MemoryRouter>
      {ui}
    </MemoryRouter>
  );
};

describe('ReviewPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    // Mock window.open to prevent jsdom errors
    jest.spyOn(window, 'open').mockImplementation(() => null);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('rendering', () => {
    it('should render the page header with title', () => {
      renderWithRouter(<ReviewPage />);

      expect(screen.getByText('Review Leads')).toBeInTheDocument();
    });

    it('should render the Add Lead button', () => {
      renderWithRouter(<ReviewPage />);

      expect(screen.getByRole('button', { name: /add lead/i })).toBeInTheDocument();
    });

    it('should render queue tabs', () => {
      renderWithRouter(<ReviewPage />);

      expect(screen.getByText('Action Now')).toBeInTheDocument();
      expect(screen.getByText(/Follow-Up/i)).toBeInTheDocument();
      expect(screen.getByText('Negotiating')).toBeInTheDocument();
      expect(screen.getByText(/All/)).toBeInTheDocument();
    });

    it('should render lead cards', () => {
      renderWithRouter(<ReviewPage />);

      expect(screen.getByText('123 Main Street')).toBeInTheDocument();
      expect(screen.getByText('456 Oak Avenue')).toBeInTheDocument();
    });
  });

  describe('Add Lead Modal', () => {
    it('should open Add Lead modal when button is clicked', async () => {
      renderWithRouter(<ReviewPage />);

      const addLeadButton = screen.getByRole('button', { name: /add lead/i });
      fireEvent.click(addLeadButton);

      await waitFor(() => {
        expect(screen.getByTestId('add-lead-modal')).toBeInTheDocument();
      });
    });

    it('should close Add Lead modal when close is triggered', async () => {
      renderWithRouter(<ReviewPage />);

      // Open modal
      const addLeadButton = screen.getByRole('button', { name: /add lead/i });
      fireEvent.click(addLeadButton);

      await waitFor(() => {
        expect(screen.getByTestId('add-lead-modal')).toBeInTheDocument();
      });

      // Close modal
      const closeButton = screen.getByText('Close Modal');
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByTestId('add-lead-modal')).not.toBeInTheDocument();
      });
    });
  });

  describe('tab navigation', () => {
    it('should call changeQueue when follow-up tab is clicked', () => {
      renderWithRouter(<ReviewPage />);

      const followUpTab = screen.getByRole('tab', { name: /Follow-Up/i });
      fireEvent.click(followUpTab);

      expect(mockChangeQueue).toHaveBeenCalledWith('follow_up');
    });

    it('should call changeQueue when negotiating tab is clicked', () => {
      renderWithRouter(<ReviewPage />);

      const negotiatingTab = screen.getByRole('tab', { name: /Negotiating/i });
      fireEvent.click(negotiatingTab);

      expect(mockChangeQueue).toHaveBeenCalledWith('negotiating');
    });

    it('should call changeQueue when all tab is clicked', () => {
      renderWithRouter(<ReviewPage />);

      const allTab = screen.getByRole('tab', { name: /All/i });
      fireEvent.click(allTab);

      expect(mockChangeQueue).toHaveBeenCalledWith('all');
    });
  });

  describe('card actions', () => {
    it('should render View Details buttons for leads', () => {
      renderWithRouter(<ReviewPage />);

      // Find View Details buttons - should have at least one per lead
      const detailButtons = screen.getAllByRole('button', { name: /view details/i });
      expect(detailButtons.length).toBeGreaterThanOrEqual(2);
    });

    it('should call markAsDone when Done button is clicked', () => {
      renderWithRouter(<ReviewPage />);

      // Find the first Done button using data-testid
      const doneButtons = screen.getAllByTestId('done-button');
      expect(doneButtons.length).toBeGreaterThanOrEqual(2);
      fireEvent.click(doneButtons[0]);

      expect(mockMarkAsDone).toHaveBeenCalledWith('lead-1');
    });

    it('should call markAsSkip when Skip button is clicked', () => {
      renderWithRouter(<ReviewPage />);

      // Find the first Skip button using data-testid
      const skipButtons = screen.getAllByTestId('skip-button');
      expect(skipButtons.length).toBeGreaterThanOrEqual(2);
      fireEvent.click(skipButtons[0]);

      expect(mockMarkAsSkip).toHaveBeenCalledWith('lead-1');
    });

    it('should call archiveLead when Archive button is clicked', () => {
      renderWithRouter(<ReviewPage />);

      // Find the first Archive button using data-testid
      const archiveButtons = screen.getAllByTestId('archive-button');
      expect(archiveButtons.length).toBeGreaterThanOrEqual(2);
      fireEvent.click(archiveButtons[0]);

      expect(mockArchiveLead).toHaveBeenCalledWith('lead-1');
    });
  });

  describe('detail panel', () => {
    it('should have View Details buttons that can be clicked', () => {
      renderWithRouter(<ReviewPage />);

      const detailButtons = screen.getAllByRole('button', { name: /view details/i });
      expect(detailButtons.length).toBeGreaterThan(0);

      // Clicking should not throw an error
      expect(() => fireEvent.click(detailButtons[0])).not.toThrow();
    });

    it('should select different lead cards', () => {
      renderWithRouter(<ReviewPage />);

      // Both addresses should be visible
      expect(screen.getByText('123 Main Street')).toBeInTheDocument();
      expect(screen.getByText('456 Oak Avenue')).toBeInTheDocument();

      // Click on second lead's View Details
      const detailButtons = screen.getAllByRole('button', { name: /view details/i });
      expect(detailButtons.length).toBeGreaterThanOrEqual(2);
      expect(() => fireEvent.click(detailButtons[1])).not.toThrow();
    });
  });

  describe('keyboard shortcuts', () => {
    it('should handle keyboard navigation without crashing', () => {
      renderWithRouter(<ReviewPage />);

      // Press j to go to next card
      fireEvent.keyDown(window, { key: 'j' });
      fireEvent.keyDown(window, { key: 'k' });

      // Page should still be functional
      expect(screen.getByText('Review Leads')).toBeInTheDocument();
    });
  });

  describe('snackbar', () => {
    it('should call markAsDone when done button is clicked', () => {
      renderWithRouter(<ReviewPage />);

      const doneButtons = screen.getAllByTestId('done-button');
      fireEvent.click(doneButtons[0]);

      // markAsDone was called, which would trigger the snackbar via onNotification
      expect(mockMarkAsDone).toHaveBeenCalled();
    });
  });

  describe('archive from card view', () => {
    it('should call archiveLead when archive button is clicked on card', () => {
      renderWithRouter(<ReviewPage />);

      const archiveButtons = screen.getAllByTestId('archive-button');
      fireEvent.click(archiveButtons[0]);

      // archiveLead should be called with the first lead's ID
      expect(mockArchiveLead).toHaveBeenCalledWith('lead-1');
    });
  });
});

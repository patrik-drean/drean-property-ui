import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { MessagingPage } from '../MessagingPage';
import { smsService } from '../../services/smsService';
import { leadQueueService } from '../../services/leadQueueService';
import { getPropertyLead } from '../../services/api';

// Mock dependencies
jest.mock('../../services/smsService');
jest.mock('../../services/leadQueueService');
jest.mock('../../services/api');

// Mock useLeadQueue hook - return a hardcoded lead for simplicity
jest.mock('../../hooks/useLeadQueue', () => ({
  mapToQueueLead: () => ({
    id: 'lead-1',
    address: '123 Test St',
    status: 'new',
    listingPrice: 200000,
    photoUrl: 'https://example.com/photo.jpg',
    photoUrls: ['https://example.com/photo1.jpg', 'https://example.com/photo2.jpg'],
  }),
}));

// Mock SubscriptionContext
jest.mock('../../contexts/SubscriptionContext', () => ({
  useSubscription: () => ({
    canAccessMessaging: true,
    loading: false,
  }),
}));

// Mock react-router-dom
jest.mock('react-router-dom', () => {
  const mockReact = require('react');
  return {
    Link: mockReact.forwardRef(
      ({ children, to }: { children: React.ReactNode; to: string }, ref: React.Ref<HTMLAnchorElement>) =>
        mockReact.createElement('a', { href: to, ref }, children)
    ),
    useSearchParams: () => [new URLSearchParams(), jest.fn()],
  };
});

// Mock MUI useMediaQuery
jest.mock('@mui/material', () => {
  const actual = jest.requireActual('@mui/material');
  return {
    ...actual,
    useMediaQuery: () => false, // Desktop mode
  };
});

// Track props passed to LeadDetailPanel
let capturedLeadDetailPanelProps: any = null;
let capturedPhotoGalleryPanelProps: any = null;

// Mock child components to simplify tests
jest.mock('../../components/messaging/ConversationList', () => ({
  ConversationList: ({ onSelect }: any) => (
    <div data-testid="conversation-list">
      <button onClick={() => onSelect({ id: 'conv-1', phoneNumber: '+1234567890', propertyLeadId: 'lead-1' })}>
        Select Conversation
      </button>
    </div>
  ),
}));

jest.mock('../../components/messaging/ConversationView', () => ({
  ConversationView: ({ onOpenLeadDetail }: any) => (
    <div data-testid="conversation-view">
      <button onClick={() => onOpenLeadDetail('lead-1')}>Open Lead Detail</button>
    </div>
  ),
}));

jest.mock('../../components/messaging/NewMessageDialog', () => ({
  NewMessageDialog: () => null,
}));

jest.mock('../../components/shared/MessagingLockedOverlay', () => ({
  MessagingLockedOverlay: () => <div>Messaging Locked</div>,
}));

jest.mock('../../components/leads/DetailPanel', () => ({
  LeadDetailPanel: (props: any) => {
    capturedLeadDetailPanelProps = props;
    if (!props.open) return null;
    return (
      <div data-testid="lead-detail-panel">
        <span data-testid="panel-open">{props.open ? 'true' : 'false'}</span>
        <span data-testid="panel-has-lead">{props.lead ? 'true' : 'false'}</span>
        <span data-testid="panel-has-status-handler">{props.onStatusChange ? 'true' : 'false'}</span>
        <span data-testid="panel-has-gallery-handler">{props.onGalleryToggle ? 'true' : 'false'}</span>
        <span data-testid="panel-show-gallery">{props.showGallery ? 'true' : 'false'}</span>
        <button data-testid="close-panel" onClick={props.onClose}>Close</button>
        <button data-testid="change-status" onClick={() => props.onStatusChange?.('contacted')}>Change Status</button>
        <button data-testid="toggle-gallery-on" onClick={() => props.onGalleryToggle?.(true)}>Open Gallery</button>
        <button data-testid="toggle-gallery-off" onClick={() => props.onGalleryToggle?.(false)}>Close Gallery</button>
      </div>
    );
  },
}));

jest.mock('../../components/leads/ReviewPage/PhotoGalleryPanel', () => ({
  PhotoGalleryPanel: (props: any) => {
    capturedPhotoGalleryPanelProps = props;
    return (
      <div data-testid="photo-gallery-panel">
        <span data-testid="gallery-has-lead">{props.lead ? 'true' : 'false'}</span>
        <button data-testid="close-gallery" onClick={props.onClose}>Close Gallery</button>
      </div>
    );
  },
}));

const theme = createTheme();

const mockConversations = [
  {
    id: 'conv-1',
    phoneNumber: '+1234567890',
    propertyLeadId: 'lead-1',
    displayName: '123 Test St',
    unreadCount: 0,
  },
];

const mockLead = {
  id: 'lead-1',
  address: '123 Test St',
  status: 'new',
  listingPrice: 200000,
  photoUrl: 'https://example.com/photo.jpg',
  photoUrls: ['https://example.com/photo1.jpg', 'https://example.com/photo2.jpg'],
};

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('MessagingPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    capturedLeadDetailPanelProps = null;
    capturedPhotoGalleryPanelProps = null;

    // Setup default mocks
    (smsService.getConversations as jest.Mock).mockResolvedValue(mockConversations);
    (smsService.getConversation as jest.Mock).mockResolvedValue({
      conversation: mockConversations[0],
      messages: [],
    });
    (getPropertyLead as jest.Mock).mockResolvedValue(mockLead);
    (leadQueueService.getLeadById as jest.Mock).mockResolvedValue(mockLead);
    (leadQueueService.updateStatus as jest.Mock).mockResolvedValue({ ...mockLead, status: 'contacted' });
  });

  describe('Lead Detail Panel Props', () => {
    it('should pass onStatusChange handler to LeadDetailPanel', async () => {
      renderWithProviders(<MessagingPage />);

      await waitFor(() => {
        expect(screen.getByTestId('conversation-list')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Select Conversation'));

      await waitFor(() => {
        expect(screen.getByTestId('conversation-view')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Open Lead Detail'));

      await waitFor(() => {
        expect(screen.getByTestId('lead-detail-panel')).toBeInTheDocument();
      });

      // Verify the handler is passed
      expect(screen.getByTestId('panel-has-status-handler')).toHaveTextContent('true');
      expect(capturedLeadDetailPanelProps.onStatusChange).toBeDefined();
      expect(typeof capturedLeadDetailPanelProps.onStatusChange).toBe('function');
    });

    it('should pass onGalleryToggle handler and showGallery prop to LeadDetailPanel', async () => {
      renderWithProviders(<MessagingPage />);

      await waitFor(() => {
        expect(screen.getByTestId('conversation-list')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Select Conversation'));

      await waitFor(() => {
        expect(screen.getByTestId('conversation-view')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Open Lead Detail'));

      await waitFor(() => {
        expect(screen.getByTestId('lead-detail-panel')).toBeInTheDocument();
      });

      // Verify the handler and prop are passed
      expect(screen.getByTestId('panel-has-gallery-handler')).toHaveTextContent('true');
      expect(screen.getByTestId('panel-show-gallery')).toHaveTextContent('false'); // Initially false
      expect(capturedLeadDetailPanelProps.onGalleryToggle).toBeDefined();
      expect(typeof capturedLeadDetailPanelProps.onGalleryToggle).toBe('function');
    });
  });

  describe('Status Change Functionality', () => {
    it('should call updateStatus when onStatusChange is invoked', async () => {
      renderWithProviders(<MessagingPage />);

      await waitFor(() => {
        expect(screen.getByTestId('conversation-list')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Select Conversation'));

      await waitFor(() => {
        expect(screen.getByTestId('conversation-view')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Open Lead Detail'));

      await waitFor(() => {
        expect(screen.getByTestId('lead-detail-panel')).toBeInTheDocument();
      });

      // Trigger status change
      await act(async () => {
        fireEvent.click(screen.getByTestId('change-status'));
      });

      await waitFor(() => {
        expect(leadQueueService.updateStatus).toHaveBeenCalledWith('lead-1', 'contacted');
      });
    });

    it('should refresh lead data after successful status change', async () => {
      renderWithProviders(<MessagingPage />);

      await waitFor(() => {
        expect(screen.getByTestId('conversation-list')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Select Conversation'));

      await waitFor(() => {
        expect(screen.getByTestId('conversation-view')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Open Lead Detail'));

      await waitFor(() => {
        expect(screen.getByTestId('lead-detail-panel')).toBeInTheDocument();
      });

      // Initial call to getLeadById
      expect(leadQueueService.getLeadById).toHaveBeenCalledTimes(1);

      // Trigger status change
      await act(async () => {
        fireEvent.click(screen.getByTestId('change-status'));
      });

      // Should call getLeadById again to refresh
      await waitFor(() => {
        expect(leadQueueService.getLeadById).toHaveBeenCalledTimes(2);
      });
    });

    it('should handle status change error gracefully', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      (leadQueueService.updateStatus as jest.Mock).mockRejectedValue(new Error('Update failed'));

      renderWithProviders(<MessagingPage />);

      await waitFor(() => {
        expect(screen.getByTestId('conversation-list')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Select Conversation'));

      await waitFor(() => {
        expect(screen.getByTestId('conversation-view')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Open Lead Detail'));

      await waitFor(() => {
        expect(screen.getByTestId('lead-detail-panel')).toBeInTheDocument();
      });

      // Trigger status change
      await act(async () => {
        fireEvent.click(screen.getByTestId('change-status'));
      });

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('Failed to update lead status:', expect.any(Error));
      });

      // Panel should still be open (error handled gracefully)
      expect(screen.getByTestId('lead-detail-panel')).toBeInTheDocument();

      consoleError.mockRestore();
    });
  });

  describe('Photo Gallery Functionality', () => {
    it('should show gallery when onGalleryToggle(true) is called', async () => {
      renderWithProviders(<MessagingPage />);

      await waitFor(() => {
        expect(screen.getByTestId('conversation-list')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Select Conversation'));

      await waitFor(() => {
        expect(screen.getByTestId('conversation-view')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Open Lead Detail'));

      await waitFor(() => {
        expect(screen.getByTestId('lead-detail-panel')).toBeInTheDocument();
      });

      // Gallery should not be visible initially
      expect(screen.queryByTestId('photo-gallery-panel')).not.toBeInTheDocument();

      // Toggle gallery on
      await act(async () => {
        fireEvent.click(screen.getByTestId('toggle-gallery-on'));
      });

      // Gallery should now be visible
      await waitFor(() => {
        expect(screen.getByTestId('photo-gallery-panel')).toBeInTheDocument();
      });
    });

    it('should hide gallery when onGalleryToggle(false) is called', async () => {
      renderWithProviders(<MessagingPage />);

      await waitFor(() => {
        expect(screen.getByTestId('conversation-list')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Select Conversation'));

      await waitFor(() => {
        expect(screen.getByTestId('conversation-view')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Open Lead Detail'));

      await waitFor(() => {
        expect(screen.getByTestId('lead-detail-panel')).toBeInTheDocument();
      });

      // Open gallery first
      await act(async () => {
        fireEvent.click(screen.getByTestId('toggle-gallery-on'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('photo-gallery-panel')).toBeInTheDocument();
      });

      // Close gallery via toggle
      await act(async () => {
        fireEvent.click(screen.getByTestId('toggle-gallery-off'));
      });

      await waitFor(() => {
        expect(screen.queryByTestId('photo-gallery-panel')).not.toBeInTheDocument();
      });

      // Panel should still be open
      expect(screen.getByTestId('lead-detail-panel')).toBeInTheDocument();
    });

    it('should close gallery via PhotoGalleryPanel onClose callback', async () => {
      renderWithProviders(<MessagingPage />);

      await waitFor(() => {
        expect(screen.getByTestId('conversation-list')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Select Conversation'));

      await waitFor(() => {
        expect(screen.getByTestId('conversation-view')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Open Lead Detail'));

      await waitFor(() => {
        expect(screen.getByTestId('lead-detail-panel')).toBeInTheDocument();
      });

      // Open gallery
      await act(async () => {
        fireEvent.click(screen.getByTestId('toggle-gallery-on'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('photo-gallery-panel')).toBeInTheDocument();
      });

      // Close via gallery's own close button
      await act(async () => {
        fireEvent.click(screen.getByTestId('close-gallery'));
      });

      await waitFor(() => {
        expect(screen.queryByTestId('photo-gallery-panel')).not.toBeInTheDocument();
      });
    });

    it('should close gallery when panel is closed', async () => {
      renderWithProviders(<MessagingPage />);

      await waitFor(() => {
        expect(screen.getByTestId('conversation-list')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Select Conversation'));

      await waitFor(() => {
        expect(screen.getByTestId('conversation-view')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Open Lead Detail'));

      await waitFor(() => {
        expect(screen.getByTestId('lead-detail-panel')).toBeInTheDocument();
      });

      // Open gallery
      await act(async () => {
        fireEvent.click(screen.getByTestId('toggle-gallery-on'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('photo-gallery-panel')).toBeInTheDocument();
      });

      // Close panel (should also close gallery)
      await act(async () => {
        fireEvent.click(screen.getByTestId('close-panel'));
      });

      await waitFor(() => {
        expect(screen.queryByTestId('lead-detail-panel')).not.toBeInTheDocument();
        expect(screen.queryByTestId('photo-gallery-panel')).not.toBeInTheDocument();
      });
    });

    it('should update showGallery prop when gallery state changes', async () => {
      renderWithProviders(<MessagingPage />);

      await waitFor(() => {
        expect(screen.getByTestId('conversation-list')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Select Conversation'));

      await waitFor(() => {
        expect(screen.getByTestId('conversation-view')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Open Lead Detail'));

      await waitFor(() => {
        expect(screen.getByTestId('lead-detail-panel')).toBeInTheDocument();
      });

      // Initially false
      expect(screen.getByTestId('panel-show-gallery')).toHaveTextContent('false');

      // Toggle on
      await act(async () => {
        fireEvent.click(screen.getByTestId('toggle-gallery-on'));
      });

      // Should now be true
      await waitFor(() => {
        expect(screen.getByTestId('panel-show-gallery')).toHaveTextContent('true');
      });
    });
  });
});

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Button,
  Drawer,
  useMediaQuery,
  useTheme,
  IconButton,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Description as TemplatesIcon,
  Menu as MenuIcon,
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { ConversationList } from '../components/messaging/ConversationList';
import { ConversationView } from '../components/messaging/ConversationView';
import { NewMessageDialog } from '../components/messaging/NewMessageDialog';
import { smsService } from '../services/smsService';
import { getPropertyLead } from '../services/api';
import { SmsConversation, ConversationWithMessages } from '../types/sms';
import { PropertyLead } from '../types/property';

const POLL_INTERVAL = 10000; // 10 seconds

export const MessagingPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState<SmsConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ConversationWithMessages | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [backendAvailable, setBackendAvailable] = useState(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [leadData, setLeadData] = useState<PropertyLead | null>(null);
  const [newMessageDialogOpen, setNewMessageDialogOpen] = useState(false);
  const hasLoggedError = useRef(false);

  // Handle URL params for deep linking
  const phoneParam = searchParams.get('phone');
  const conversationParam = searchParams.get('conversation');
  const leadParam = searchParams.get('lead');

  const fetchConversations = useCallback(async (isInitialLoad = false) => {
    try {
      const data = await smsService.getConversations();
      setConversations(data);
      setError(null);
      setBackendAvailable(true);
      hasLoggedError.current = false;
    } catch (err: any) {
      // Only log error once to prevent console spam during polling
      if (!hasLoggedError.current) {
        console.error('Error fetching conversations:', err);
        hasLoggedError.current = true;
      }

      // Check if it's a connection error or 404 (backend not available)
      const is404 = err?.response?.status === 404;
      const isNetworkError = !err?.response;

      if (is404 || isNetworkError) {
        setBackendAvailable(false);
        if (isInitialLoad) {
          setError('SMS backend is not available. The SMS API endpoints may not be deployed yet.');
        }
      } else {
        setError('Failed to load conversations. Please try again.');
      }
    }
  }, []);

  const fetchSelectedConversation = useCallback(async (id: string) => {
    try {
      const data = await smsService.getConversation(id);
      setSelectedConversation(data);
      // Update unread count in list
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c))
      );
    } catch (err) {
      console.error('Error fetching conversation:', err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchConversations(true);
      setLoading(false);
    };
    init();
  }, [fetchConversations]);

  // Handle URL params
  useEffect(() => {
    const handleUrlParams = async () => {
      // Fetch lead data if leadParam is provided
      let fetchedLeadData: PropertyLead | null = null;
      if (leadParam) {
        try {
          fetchedLeadData = await getPropertyLead(leadParam);
          setLeadData(fetchedLeadData);
        } catch (err) {
          console.error('Failed to fetch lead data:', err);
        }
      }

      if (phoneParam) {
        const conv = await smsService.getConversationByPhone(phoneParam);
        if (conv) {
          setSelectedConversation(conv);
        } else {
          // New conversation - set up empty state with lead info if available
          setSelectedConversation({
            conversation: {
              id: '',
              phoneNumber: phoneParam,
              propertyLeadId: leadParam || undefined,
              displayName: fetchedLeadData?.address,
              unreadCount: 0,
            },
            messages: [],
          });
        }
      } else if (conversationParam) {
        await fetchSelectedConversation(conversationParam);
      } else if (leadParam) {
        // Try to find existing conversation by lead
        const conv = await smsService.getConversationByLead(leadParam);
        if (conv) {
          setSelectedConversation(conv);
        } else if (fetchedLeadData?.sellerPhone) {
          // No conversation exists, but lead has phone - set up new conversation
          setSelectedConversation({
            conversation: {
              id: '',
              phoneNumber: fetchedLeadData.sellerPhone,
              propertyLeadId: leadParam,
              displayName: fetchedLeadData.address,
              unreadCount: 0,
            },
            messages: [],
          });
        }
      }
    };
    handleUrlParams();
  }, [phoneParam, conversationParam, leadParam, fetchSelectedConversation]);

  // Polling for updates - only when backend is available
  useEffect(() => {
    if (!backendAvailable) {
      return; // Don't poll if backend is not available
    }

    const interval = setInterval(() => {
      fetchConversations();
      if (selectedConversation?.conversation.id) {
        fetchSelectedConversation(selectedConversation.conversation.id);
      }
    }, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [fetchConversations, fetchSelectedConversation, selectedConversation?.conversation.id, backendAvailable]);

  const handleSelectConversation = async (conversation: SmsConversation) => {
    await fetchSelectedConversation(conversation.id);

    // Fetch lead data if this conversation has a propertyLeadId
    if (conversation.propertyLeadId) {
      try {
        const lead = await getPropertyLead(conversation.propertyLeadId);
        setLeadData(lead);
      } catch (err) {
        console.error('Failed to fetch lead data:', err);
        setLeadData(null);
      }
    } else {
      setLeadData(null);
    }

    if (isMobile) {
      setMobileDrawerOpen(false);
    }
  };

  const handleMessageSent = () => {
    // Refresh both lists
    fetchConversations();
    if (selectedConversation?.conversation.id) {
      fetchSelectedConversation(selectedConversation.conversation.id);
    }
  };

  const handleRetry = () => {
    setError(null);
    hasLoggedError.current = false;
    fetchConversations(true);
  };

  const handleStartNewConversation = async (phoneNumber: string) => {
    // Check if conversation already exists for this phone number
    const existingConv = await smsService.getConversationByPhone(phoneNumber);

    if (existingConv) {
      // Select the existing conversation
      setSelectedConversation(existingConv);
    } else {
      // Create a new conversation view (conversation will be created on first message send)
      setSelectedConversation({
        conversation: {
          id: '',
          phoneNumber: phoneNumber,
          unreadCount: 0,
        },
        messages: [],
      });
    }

    // Close mobile drawer if open
    if (isMobile) {
      setMobileDrawerOpen(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  const conversationList = (
    <ConversationList
      conversations={conversations}
      selectedId={selectedConversation?.conversation.id}
      onSelect={handleSelectConversation}
      onRefresh={fetchConversations}
    />
  );

  return (
    <Box sx={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {isMobile && (
            <IconButton onClick={() => setMobileDrawerOpen(true)} edge="start">
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h4">Messaging</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            onClick={() => setNewMessageDialogOpen(true)}
            startIcon={<AddIcon />}
            variant="contained"
            size={isMobile ? 'small' : 'medium'}
          >
            {isMobile ? 'New' : 'New Message'}
          </Button>
          <Button
            component={Link}
            to="/messaging/templates"
            startIcon={<TemplatesIcon />}
            variant="outlined"
            size={isMobile ? 'small' : 'medium'}
          >
            {isMobile ? 'Templates' : 'Manage Templates'}
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert
          severity={backendAvailable ? 'error' : 'warning'}
          sx={{ mb: 2 }}
          action={
            <Button
              color="inherit"
              size="small"
              startIcon={<RefreshIcon />}
              onClick={handleRetry}
            >
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      <Box
        sx={{
          flex: 1,
          display: 'flex',
          border: '1px solid #e0e0e0',
          borderRadius: 1,
          overflow: 'hidden',
        }}
      >
        {/* Desktop: Conversation List */}
        {!isMobile && (
          <Box
            sx={{
              width: 320,
              borderRight: '1px solid #e0e0e0',
              overflow: 'auto',
            }}
          >
            {conversationList}
          </Box>
        )}

        {/* Mobile: Drawer for Conversation List */}
        {isMobile && (
          <Drawer
            anchor="left"
            open={mobileDrawerOpen}
            onClose={() => setMobileDrawerOpen(false)}
            PaperProps={{ sx: { width: '80%', maxWidth: 320 } }}
          >
            <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconButton onClick={() => setMobileDrawerOpen(false)} edge="start">
                  <ArrowBackIcon />
                </IconButton>
                <Typography variant="h6">Conversations</Typography>
              </Box>
            </Box>
            {conversationList}
          </Drawer>
        )}

        {/* Conversation View */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {selectedConversation ? (
            <ConversationView
              conversation={selectedConversation}
              onMessageSent={handleMessageSent}
              leadName={leadData?.address}
              leadAddress={leadData?.address}
              leadPrice={leadData?.listingPrice?.toLocaleString()}
              zillowLink={leadData?.zillowLink}
            />
          ) : (
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              flex={1}
              color="text.secondary"
              sx={{ p: 2, textAlign: 'center' }}
            >
              <Typography>
                {isMobile
                  ? 'Tap the menu icon to select a conversation'
                  : 'Select a conversation to view messages'}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* New Message Dialog */}
      <NewMessageDialog
        open={newMessageDialogOpen}
        onClose={() => setNewMessageDialogOpen(false)}
        onStartConversation={handleStartNewConversation}
      />
    </Box>
  );
};

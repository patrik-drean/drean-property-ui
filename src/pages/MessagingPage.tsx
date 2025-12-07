import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Box, Typography, CircularProgress, Alert, Button } from '@mui/material';
import { Refresh as RefreshIcon, Description as TemplatesIcon } from '@mui/icons-material';
import { ConversationList } from '../components/messaging/ConversationList';
import { ConversationView } from '../components/messaging/ConversationView';
import { smsService } from '../services/smsService';
import { SmsConversation, ConversationWithMessages } from '../types/sms';

const POLL_INTERVAL = 10000; // 10 seconds

export const MessagingPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState<SmsConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ConversationWithMessages | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [backendAvailable, setBackendAvailable] = useState(true);
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
      if (phoneParam) {
        const conv = await smsService.getConversationByPhone(phoneParam);
        if (conv) {
          setSelectedConversation(conv);
        } else {
          // New conversation - set up empty state
          setSelectedConversation({
            conversation: {
              id: '',
              phoneNumber: phoneParam,
              unreadCount: 0,
            },
            messages: [],
          });
        }
      } else if (conversationParam) {
        await fetchSelectedConversation(conversationParam);
      } else if (leadParam) {
        const conv = await smsService.getConversationByLead(leadParam);
        if (conv) {
          setSelectedConversation(conv);
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

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Messaging</Typography>
        <Button
          component={Link}
          to="/messaging/templates"
          startIcon={<TemplatesIcon />}
          variant="outlined"
        >
          Manage Templates
        </Button>
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
        {/* Conversation List */}
        <Box
          sx={{
            width: 320,
            borderRight: '1px solid #e0e0e0',
            overflow: 'auto',
          }}
        >
          <ConversationList
            conversations={conversations}
            selectedId={selectedConversation?.conversation.id}
            onSelect={handleSelectConversation}
          />
        </Box>

        {/* Conversation View */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {selectedConversation ? (
            <ConversationView
              conversation={selectedConversation}
              onMessageSent={handleMessageSent}
            />
          ) : (
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              flex={1}
              color="text.secondary"
            >
              <Typography>Select a conversation to view messages</Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

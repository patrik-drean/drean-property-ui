import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import * as signalR from '@microsoft/signalr';
import { useAuth } from './AuthContext';

interface WebSocketContextValue {
  leadsConnection: signalR.HubConnection | null;
  messagingConnection: signalR.HubConnection | null;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'reconnecting';
  subscribe: <T>(event: string, handler: (data: T) => void) => () => void;
}

const WebSocketContext = createContext<WebSocketContextValue | null>(null);

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, isAuthenticated } = useAuth();
  const [leadsConnection, setLeadsConnection] = useState<signalR.HubConnection | null>(null);
  const [messagingConnection, setMessagingConnection] = useState<signalR.HubConnection | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<WebSocketContextValue['connectionStatus']>('disconnected');

  const handlersRef = useRef<Map<string, Set<(data: any) => void>>>(new Map());

  // Initialize connections
  useEffect(() => {
    if (!isAuthenticated || !token) {
      setConnectionStatus('disconnected');
      return;
    }

    // Create leads connection
    const leads = new signalR.HubConnectionBuilder()
      .withUrl(`${API_BASE_URL}/hubs/leads`, {
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (retryContext) => {
          // Exponential backoff: 1s, 2s, 4s, 8s, 16s, max 30s
          const delay = Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 30000);
          return delay;
        },
      })
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    // Create messaging connection
    const messaging = new signalR.HubConnectionBuilder()
      .withUrl(`${API_BASE_URL}/hubs/messaging`, {
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (retryContext) => {
          const delay = Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 30000);
          return delay;
        },
      })
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    // Connection state handlers
    leads.onreconnecting(() => setConnectionStatus('reconnecting'));
    leads.onreconnected(() => setConnectionStatus('connected'));
    leads.onclose(() => setConnectionStatus('disconnected'));

    // Forward lead events to registered handlers
    const leadEvents = ['lead:created', 'lead:updated', 'lead:consolidated', 'lead:deleted'];
    leadEvents.forEach((event) => {
      leads.on(event, (data) => {
        const handlers = handlersRef.current.get(event);
        handlers?.forEach((handler) => handler(data));
      });
    });

    // Forward message events to registered handlers
    const messageEvents = ['message:received', 'message:sent', 'message:status_changed'];
    messageEvents.forEach((event) => {
      messaging.on(event, (data) => {
        const handlers = handlersRef.current.get(event);
        handlers?.forEach((handler) => handler(data));
      });
    });

    // Start connections
    setConnectionStatus('connecting');
    Promise.all([leads.start(), messaging.start()])
      .then(() => {
        setConnectionStatus('connected');
        setLeadsConnection(leads);
        setMessagingConnection(messaging);
        console.log('[WebSocket] Connected to SignalR hubs');
      })
      .catch((err) => {
        console.error('[WebSocket] Connection failed:', err);
        setConnectionStatus('disconnected');
      });

    // Cleanup
    return () => {
      leads.stop();
      messaging.stop();
      setLeadsConnection(null);
      setMessagingConnection(null);
    };
  }, [isAuthenticated, token]);

  // Subscribe to events
  const subscribe = useCallback(<T,>(event: string, handler: (data: T) => void) => {
    if (!handlersRef.current.has(event)) {
      handlersRef.current.set(event, new Set());
    }
    handlersRef.current.get(event)!.add(handler);

    // Return unsubscribe function
    return () => {
      handlersRef.current.get(event)?.delete(handler);
    };
  }, []);

  return (
    <WebSocketContext.Provider value={{ leadsConnection, messagingConnection, connectionStatus, subscribe }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within WebSocketProvider');
  }
  return context;
};

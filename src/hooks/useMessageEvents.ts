import { useEffect } from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';

export interface MessageEventData {
  id: string;
  conversationId: string;
  direction: string;
  body: string;
  status: string;
  createdAt: string;
  deliveredAt: string | null;
  errorMessage: string | null;
}

export interface MessageStatusChangedData {
  messageId: string;
  status: string;
  updatedAt: string;
}

export interface UseMessageEventsOptions {
  onMessageReceived?: (message: MessageEventData) => void;
  onMessageSent?: (message: MessageEventData) => void;
  onMessageStatusChanged?: (data: MessageStatusChangedData) => void;
}

export const useMessageEvents = (options: UseMessageEventsOptions) => {
  const { subscribe, connectionStatus } = useWebSocket();

  useEffect(() => {
    const unsubscribers: (() => void)[] = [];

    if (options.onMessageReceived) {
      unsubscribers.push(subscribe<MessageEventData>('message:received', options.onMessageReceived));
    }
    if (options.onMessageSent) {
      unsubscribers.push(subscribe<MessageEventData>('message:sent', options.onMessageSent));
    }
    if (options.onMessageStatusChanged) {
      unsubscribers.push(subscribe<MessageStatusChangedData>('message:status_changed', options.onMessageStatusChanged));
    }

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [subscribe, options.onMessageReceived, options.onMessageSent, options.onMessageStatusChanged]);

  return { connectionStatus };
};

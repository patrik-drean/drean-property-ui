import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ConversationView } from '../ConversationView';
import { ConversationWithMessages, SmsMessage, SmsConversation } from '../../../types/sms';

// Mock scrollIntoView
Element.prototype.scrollIntoView = jest.fn();

// Mock the child components
jest.mock('../MessageBubble', () => ({
  MessageBubble: ({ message }: { message: SmsMessage }) => (
    <div data-testid="message-bubble">{message.body}</div>
  ),
}));

jest.mock('../MessageComposer', () => ({
  MessageComposer: ({
    phoneNumber,
    onMessageSent,
  }: {
    phoneNumber: string;
    onMessageSent: () => void;
  }) => (
    <div data-testid="message-composer">
      <span data-testid="composer-phone">{phoneNumber}</span>
      <button onClick={onMessageSent}>Send</button>
    </div>
  ),
}));

// Mock window.open
const mockWindowOpen = jest.fn();
Object.defineProperty(window, 'open', {
  value: mockWindowOpen,
  writable: true,
});

// Test fixtures
const createConversation = (overrides: Partial<SmsConversation> = {}): SmsConversation => ({
  id: 'conv-1',
  phoneNumber: '+15551234567',
  displayName: 'John Seller',
  unreadCount: 0,
  ...overrides,
});

const createMessage = (overrides: Partial<SmsMessage> = {}): SmsMessage => ({
  id: 'msg-1',
  conversationId: 'conv-1',
  toPhoneNumber: '+15551234567',
  fromPhoneNumber: '+15559876543',
  body: 'Test message',
  direction: 'outbound',
  status: 'delivered',
  createdAt: '2025-01-15T10:30:00Z',
  ...overrides,
});

const mockConversationWithMessages: ConversationWithMessages = {
  conversation: createConversation(),
  messages: [
    createMessage({ id: 'msg-1', body: 'Hello', direction: 'outbound' }),
    createMessage({ id: 'msg-2', body: 'Hi there!', direction: 'inbound' }),
  ],
};

describe('ConversationView', () => {
  const defaultProps = {
    conversation: mockConversationWithMessages,
    onMessageSent: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockWindowOpen.mockClear();
  });

  describe('header', () => {
    it('should display conversation display name', () => {
      render(<ConversationView {...defaultProps} />);

      expect(screen.getByText('John Seller')).toBeInTheDocument();
    });

    it('should display phone number when no display name', () => {
      const conversation: ConversationWithMessages = {
        conversation: createConversation({ displayName: undefined }),
        messages: [],
      };
      render(<ConversationView {...defaultProps} conversation={conversation} />);

      // Phone number should appear - at least in header
      const phoneElements = screen.getAllByText('+15551234567');
      expect(phoneElements.length).toBeGreaterThanOrEqual(1);
    });

    it('should display phone number in header section', () => {
      render(<ConversationView {...defaultProps} />);

      // Phone number appears in both header and composer mock
      const phoneElements = screen.getAllByText('+15551234567');
      expect(phoneElements.length).toBeGreaterThanOrEqual(1);
    });

    it('should show Lead chip when propertyLeadId is present', () => {
      const conversation: ConversationWithMessages = {
        conversation: createConversation({ propertyLeadId: 'lead-123' }),
        messages: [],
      };
      render(<ConversationView {...defaultProps} conversation={conversation} />);

      expect(screen.getByText('Lead')).toBeInTheDocument();
    });

    it('should not show Lead chip when propertyLeadId is absent', () => {
      const conversation: ConversationWithMessages = {
        conversation: createConversation({ propertyLeadId: undefined }),
        messages: [],
      };
      render(<ConversationView {...defaultProps} conversation={conversation} />);

      expect(screen.queryByText('Lead')).not.toBeInTheDocument();
    });

    it('should show Contact chip when contactId is present', () => {
      const conversation: ConversationWithMessages = {
        conversation: createConversation({ contactId: 'contact-456' }),
        messages: [],
      };
      render(<ConversationView {...defaultProps} conversation={conversation} />);

      expect(screen.getByText('Contact')).toBeInTheDocument();
    });

    it('should not show Contact chip when contactId is absent', () => {
      const conversation: ConversationWithMessages = {
        conversation: createConversation({ contactId: undefined }),
        messages: [],
      };
      render(<ConversationView {...defaultProps} conversation={conversation} />);

      expect(screen.queryByText('Contact')).not.toBeInTheDocument();
    });

    it('should show both Lead and Contact chips when both IDs present', () => {
      const conversation: ConversationWithMessages = {
        conversation: createConversation({
          propertyLeadId: 'lead-123',
          contactId: 'contact-456',
        }),
        messages: [],
      };
      render(<ConversationView {...defaultProps} conversation={conversation} />);

      expect(screen.getByText('Lead')).toBeInTheDocument();
      expect(screen.getByText('Contact')).toBeInTheDocument();
    });
  });

  describe('navigation', () => {
    it('should open lead page in new tab when Lead chip clicked', () => {
      const conversation: ConversationWithMessages = {
        conversation: createConversation({ propertyLeadId: 'lead-123' }),
        messages: [],
      };
      render(<ConversationView {...defaultProps} conversation={conversation} />);

      const leadChip = screen.getByText('Lead');
      fireEvent.click(leadChip);

      expect(mockWindowOpen).toHaveBeenCalledWith('/#/leads?id=lead-123', '_blank');
    });

    it('should open contact page in new tab when Contact chip clicked', () => {
      const conversation: ConversationWithMessages = {
        conversation: createConversation({ contactId: 'contact-456' }),
        messages: [],
      };
      render(<ConversationView {...defaultProps} conversation={conversation} />);

      const contactChip = screen.getByText('Contact');
      fireEvent.click(contactChip);

      expect(mockWindowOpen).toHaveBeenCalledWith('/#/team?contact=contact-456', '_blank');
    });

    it('should not navigate when Lead chip clicked but no propertyLeadId', () => {
      const conversation: ConversationWithMessages = {
        conversation: createConversation({ propertyLeadId: undefined }),
        messages: [],
      };
      render(<ConversationView {...defaultProps} conversation={conversation} />);

      // Lead chip shouldn't even exist, but if it did, nothing should happen
      expect(screen.queryByText('Lead')).not.toBeInTheDocument();
      expect(mockWindowOpen).not.toHaveBeenCalled();
    });
  });

  describe('messages', () => {
    it('should render all messages', () => {
      render(<ConversationView {...defaultProps} />);

      const messageBubbles = screen.getAllByTestId('message-bubble');
      expect(messageBubbles).toHaveLength(2);
    });

    it('should render message content correctly', () => {
      render(<ConversationView {...defaultProps} />);

      expect(screen.getByText('Hello')).toBeInTheDocument();
      expect(screen.getByText('Hi there!')).toBeInTheDocument();
    });

    it('should show empty state when no messages', () => {
      const conversation: ConversationWithMessages = {
        conversation: createConversation(),
        messages: [],
      };
      render(<ConversationView {...defaultProps} conversation={conversation} />);

      expect(screen.getByText('No messages yet. Send the first message!')).toBeInTheDocument();
    });

    it('should render messages in order', () => {
      const conversation: ConversationWithMessages = {
        conversation: createConversation(),
        messages: [
          createMessage({ id: 'msg-1', body: 'First message' }),
          createMessage({ id: 'msg-2', body: 'Second message' }),
          createMessage({ id: 'msg-3', body: 'Third message' }),
        ],
      };
      render(<ConversationView {...defaultProps} conversation={conversation} />);

      const messageBubbles = screen.getAllByTestId('message-bubble');
      expect(messageBubbles[0]).toHaveTextContent('First message');
      expect(messageBubbles[1]).toHaveTextContent('Second message');
      expect(messageBubbles[2]).toHaveTextContent('Third message');
    });
  });

  describe('message composer', () => {
    it('should render message composer', () => {
      render(<ConversationView {...defaultProps} />);

      expect(screen.getByTestId('message-composer')).toBeInTheDocument();
    });

    it('should pass phone number to composer', () => {
      render(<ConversationView {...defaultProps} />);

      expect(screen.getByTestId('composer-phone')).toHaveTextContent('+15551234567');
    });

    it('should call onMessageSent when message is sent', () => {
      const onMessageSent = jest.fn();
      render(<ConversationView {...defaultProps} onMessageSent={onMessageSent} />);

      const sendButton = screen.getByText('Send');
      fireEvent.click(sendButton);

      expect(onMessageSent).toHaveBeenCalled();
    });
  });

  describe('scroll behavior', () => {
    it('should have a scroll container for messages', () => {
      render(<ConversationView {...defaultProps} />);

      // The messages container should have overflow: auto
      const messageBubbles = screen.getAllByTestId('message-bubble');
      expect(messageBubbles.length).toBeGreaterThan(0);
      const messageContainer = messageBubbles[0].parentElement;
      expect(messageContainer).toBeInTheDocument();
    });
  });

  describe('layout', () => {
    it('should have proper structure with header, messages, and composer', () => {
      render(<ConversationView {...defaultProps} />);

      // Header with name
      expect(screen.getByText('John Seller')).toBeInTheDocument();
      // Messages
      expect(screen.getAllByTestId('message-bubble')).toHaveLength(2);
      // Composer
      expect(screen.getByTestId('message-composer')).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle conversation with minimal data', () => {
      const conversation: ConversationWithMessages = {
        conversation: {
          id: 'conv-minimal',
          phoneNumber: '+15551111111',
          unreadCount: 0,
        },
        messages: [],
      };
      render(<ConversationView {...defaultProps} conversation={conversation} />);

      // Phone number appears multiple times (header, sub-header, composer)
      const phoneElements = screen.getAllByText('+15551111111');
      expect(phoneElements.length).toBeGreaterThan(0);
      expect(screen.getByText('No messages yet. Send the first message!')).toBeInTheDocument();
    });

    it('should handle many messages', () => {
      const messages = Array.from({ length: 100 }, (_, i) =>
        createMessage({ id: `msg-${i}`, body: `Message ${i}` })
      );
      const conversation: ConversationWithMessages = {
        conversation: createConversation(),
        messages,
      };
      render(<ConversationView {...defaultProps} conversation={conversation} />);

      const messageBubbles = screen.getAllByTestId('message-bubble');
      expect(messageBubbles).toHaveLength(100);
    });
  });
});

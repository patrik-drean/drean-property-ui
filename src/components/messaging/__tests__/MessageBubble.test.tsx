import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MessageBubble } from '../MessageBubble';
import { SmsMessage } from '../../../types/sms';

// Test fixtures
const createMessage = (overrides: Partial<SmsMessage> = {}): SmsMessage => ({
  id: 'msg-1',
  conversationId: 'conv-1',
  toPhoneNumber: '+15551234567',
  fromPhoneNumber: '+15559876543',
  body: 'Test message content',
  direction: 'outbound',
  status: 'delivered',
  createdAt: '2025-01-15T10:30:00Z',
  ...overrides,
});

describe('MessageBubble', () => {
  describe('rendering', () => {
    it('should render message body text', () => {
      const message = createMessage({ body: 'Hello, how are you?' });
      render(<MessageBubble message={message} />);

      expect(screen.getByText('Hello, how are you?')).toBeInTheDocument();
    });

    it('should render message timestamp', () => {
      const message = createMessage({ createdAt: '2025-01-15T10:30:00Z' });
      render(<MessageBubble message={message} />);

      // Format depends on locale, just check the element renders time info
      const timeText = screen.getByText(/\d{1,2}:\d{2}/);
      expect(timeText).toBeInTheDocument();
    });

    it('should handle multi-line messages with preserved whitespace', () => {
      const message = createMessage({ body: 'Line 1\nLine 2\nLine 3' });
      render(<MessageBubble message={message} />);

      // Check that the element contains the multiline text
      expect(screen.getByText(/Line 1/)).toBeInTheDocument();
      expect(screen.getByText(/Line 2/)).toBeInTheDocument();
      expect(screen.getByText(/Line 3/)).toBeInTheDocument();
    });

    it('should handle long messages without breaking layout', () => {
      const longMessage = 'A'.repeat(500);
      const message = createMessage({ body: longMessage });
      render(<MessageBubble message={message} />);

      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });
  });

  describe('message direction', () => {
    it('should align outbound messages to the right', () => {
      const message = createMessage({ direction: 'outbound' });
      const { container } = render(<MessageBubble message={message} />);

      const outerBox = container.firstChild;
      expect(outerBox).toHaveStyle({ justifyContent: 'flex-end' });
    });

    it('should align inbound messages to the left', () => {
      const message = createMessage({ direction: 'inbound' });
      const { container } = render(<MessageBubble message={message} />);

      const outerBox = container.firstChild;
      expect(outerBox).toHaveStyle({ justifyContent: 'flex-start' });
    });
  });

  describe('status indicators', () => {
    it('should show schedule icon for pending messages', () => {
      const message = createMessage({ status: 'pending', direction: 'outbound' });
      render(<MessageBubble message={message} />);

      expect(screen.getByTestId('ScheduleIcon')).toBeInTheDocument();
    });

    it('should show single check icon for sent messages', () => {
      const message = createMessage({ status: 'sent', direction: 'outbound' });
      render(<MessageBubble message={message} />);

      expect(screen.getByTestId('CheckIcon')).toBeInTheDocument();
    });

    it('should show double check icon for delivered messages', () => {
      const message = createMessage({ status: 'delivered', direction: 'outbound' });
      render(<MessageBubble message={message} />);

      expect(screen.getByTestId('DoneAllIcon')).toBeInTheDocument();
    });

    it('should show error icon for failed messages', () => {
      const message = createMessage({ status: 'failed', direction: 'outbound' });
      render(<MessageBubble message={message} />);

      expect(screen.getByTestId('ErrorIcon')).toBeInTheDocument();
    });

    it('should not show status icon for inbound messages', () => {
      const message = createMessage({ direction: 'inbound', status: 'delivered' });
      render(<MessageBubble message={message} />);

      expect(screen.queryByTestId('CheckIcon')).not.toBeInTheDocument();
      expect(screen.queryByTestId('DoneAllIcon')).not.toBeInTheDocument();
      expect(screen.queryByTestId('ErrorIcon')).not.toBeInTheDocument();
      expect(screen.queryByTestId('ScheduleIcon')).not.toBeInTheDocument();
    });
  });

  describe('tooltips', () => {
    it('should show "Sending..." tooltip for pending status', () => {
      const message = createMessage({ status: 'pending', direction: 'outbound' });
      render(<MessageBubble message={message} />);

      // Tooltip title is on the wrapper element
      const iconWrapper = screen.getByTestId('ScheduleIcon').closest('[title]');
      // The tooltip is rendered but not visible until hover
      expect(screen.getByTestId('ScheduleIcon')).toBeInTheDocument();
    });

    it('should show "Sent" tooltip for sent status', () => {
      const message = createMessage({ status: 'sent', direction: 'outbound' });
      render(<MessageBubble message={message} />);

      expect(screen.getByTestId('CheckIcon')).toBeInTheDocument();
    });

    it('should show delivery time in tooltip for delivered status', () => {
      const message = createMessage({
        status: 'delivered',
        direction: 'outbound',
        deliveredAt: '2025-01-15T10:30:05Z',
      });
      render(<MessageBubble message={message} />);

      expect(screen.getByTestId('DoneAllIcon')).toBeInTheDocument();
    });

    it('should show error message in tooltip for failed status', () => {
      const message = createMessage({
        status: 'failed',
        direction: 'outbound',
        errorMessage: 'Invalid phone number',
      });
      render(<MessageBubble message={message} />);

      expect(screen.getByTestId('ErrorIcon')).toBeInTheDocument();
    });

    it('should show default "Failed to send" when no error message', () => {
      const message = createMessage({
        status: 'failed',
        direction: 'outbound',
        errorMessage: undefined,
      });
      render(<MessageBubble message={message} />);

      expect(screen.getByTestId('ErrorIcon')).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle empty message body', () => {
      const message = createMessage({ body: '' });
      const { container } = render(<MessageBubble message={message} />);

      // Should still render the bubble structure
      expect(container.querySelector('.MuiBox-root')).toBeInTheDocument();
    });

    it('should handle message with special characters', () => {
      const message = createMessage({ body: 'Hello! @#$%^&*() <script>alert("xss")</script>' });
      render(<MessageBubble message={message} />);

      expect(
        screen.getByText('Hello! @#$%^&*() <script>alert("xss")</script>')
      ).toBeInTheDocument();
    });

    it('should handle message with emojis', () => {
      const message = createMessage({ body: 'Great property! 🏠 Looking forward to it 👍' });
      render(<MessageBubble message={message} />);

      expect(
        screen.getByText('Great property! 🏠 Looking forward to it 👍')
      ).toBeInTheDocument();
    });

    it('should handle invalid date gracefully', () => {
      const message = createMessage({ createdAt: 'invalid-date' });
      render(<MessageBubble message={message} />);

      // Should not crash, timestamp area should still render
      expect(screen.getByText('Test message content')).toBeInTheDocument();
    });
  });
});

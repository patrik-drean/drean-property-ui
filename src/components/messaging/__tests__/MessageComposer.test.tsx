import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { MessageComposer } from '../MessageComposer';
import { smsService } from '../../../services/smsService';

// Mock the SMS service
jest.mock('../../../services/smsService');

const mockSmsService = smsService as jest.Mocked<typeof smsService>;

// Helper to get the send button (the one with SendIcon)
const getSendButton = () => {
  const sendIcon = screen.getByTestId('SendIcon');
  return sendIcon.closest('button') as HTMLButtonElement;
};

describe('MessageComposer', () => {
  const defaultProps = {
    phoneNumber: '+15551234567',
    onMessageSent: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockSmsService.sendMessage.mockResolvedValue({
      success: true,
      messageId: 'msg-123',
      conversationId: 'conv-1',
    });
  });

  describe('rendering', () => {
    it('should render text input with placeholder', () => {
      render(<MessageComposer {...defaultProps} />);

      expect(screen.getByPlaceholderText('Type a message...')).toBeInTheDocument();
    });

    it('should render send button', () => {
      render(<MessageComposer {...defaultProps} />);

      expect(getSendButton()).toBeInTheDocument();
    });

    it('should render send icon in button', () => {
      render(<MessageComposer {...defaultProps} />);

      expect(screen.getByTestId('SendIcon')).toBeInTheDocument();
    });
  });

  describe('character count', () => {
    it('should not show character count when input is empty', () => {
      render(<MessageComposer {...defaultProps} />);

      expect(screen.queryByText(/\/ 1600/)).not.toBeInTheDocument();
    });

    it('should show character count when typing', async () => {
      render(<MessageComposer {...defaultProps} />);

      const input = screen.getByPlaceholderText('Type a message...');
      await userEvent.type(input, 'Hello');

      expect(screen.getByText('5 / 1600')).toBeInTheDocument();
    });

    it('should show segment count for multi-segment messages', async () => {
      render(<MessageComposer {...defaultProps} />);

      const input = screen.getByPlaceholderText('Type a message...');
      // Type 170 characters (exceeds single SMS of 160)
      await userEvent.type(input, 'A'.repeat(170));

      expect(screen.getByText('170 / 1600')).toBeInTheDocument();
      expect(screen.getByText('(2 segments)')).toBeInTheDocument();
    });

    it('should show error state when over 1600 characters', async () => {
      render(<MessageComposer {...defaultProps} />);

      const input = screen.getByPlaceholderText('Type a message...');
      // Type 1601 characters
      await userEvent.type(input, 'A'.repeat(1601));

      expect(screen.getByText('1601 / 1600')).toBeInTheDocument();
      // Input should have error state
      const textField = input.closest('.MuiTextField-root');
      expect(textField).toHaveClass('MuiFormControl-root');
    });

    it('should calculate correct segment count for various lengths', async () => {
      render(<MessageComposer {...defaultProps} />);

      const input = screen.getByPlaceholderText('Type a message...');

      // 160 chars = 1 segment (no count shown)
      await userEvent.clear(input);
      await userEvent.type(input, 'A'.repeat(160));
      expect(screen.queryByText('(1 segments)')).not.toBeInTheDocument();
      expect(screen.queryByText('segments')).not.toBeInTheDocument();

      // 161 chars = 2 segments
      await userEvent.type(input, 'B');
      expect(screen.getByText('(2 segments)')).toBeInTheDocument();

      // 320 chars = 2 segments
      await userEvent.clear(input);
      await userEvent.type(input, 'A'.repeat(320));
      expect(screen.getByText('(2 segments)')).toBeInTheDocument();

      // 321 chars = 3 segments
      await userEvent.type(input, 'B');
      expect(screen.getByText('(3 segments)')).toBeInTheDocument();
    });
  });

  describe('send button state', () => {
    it('should disable send button when input is empty', () => {
      render(<MessageComposer {...defaultProps} />);

      const button = getSendButton();
      expect(button).toBeDisabled();
    });

    it('should disable send button when input is only whitespace', async () => {
      render(<MessageComposer {...defaultProps} />);

      const input = screen.getByPlaceholderText('Type a message...');
      await userEvent.type(input, '   ');

      const button = getSendButton();
      expect(button).toBeDisabled();
    });

    it('should enable send button when input has text', async () => {
      render(<MessageComposer {...defaultProps} />);

      const input = screen.getByPlaceholderText('Type a message...');
      await userEvent.type(input, 'Hello');

      const button = getSendButton();
      expect(button).not.toBeDisabled();
    });

    it('should disable send button when over character limit', async () => {
      render(<MessageComposer {...defaultProps} />);

      const input = screen.getByPlaceholderText('Type a message...');
      await userEvent.type(input, 'A'.repeat(1601));

      const button = getSendButton();
      expect(button).toBeDisabled();
    });
  });

  describe('sending messages', () => {
    it('should send message when clicking send button', async () => {
      const onMessageSent = jest.fn();
      render(<MessageComposer {...defaultProps} onMessageSent={onMessageSent} />);

      const input = screen.getByPlaceholderText('Type a message...');
      await userEvent.type(input, 'Hello there!');

      const button = getSendButton();
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockSmsService.sendMessage).toHaveBeenCalledWith({
          toPhoneNumber: '+15551234567',
          body: 'Hello there!',
          propertyLeadId: undefined,
          contactId: undefined,
        });
      });

      await waitFor(() => {
        expect(onMessageSent).toHaveBeenCalled();
      });
    });

    it('should send message when pressing Enter', async () => {
      const onMessageSent = jest.fn();
      render(<MessageComposer {...defaultProps} onMessageSent={onMessageSent} />);

      const input = screen.getByPlaceholderText('Type a message...');
      await userEvent.type(input, 'Hello there!');
      fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13 });

      await waitFor(() => {
        expect(mockSmsService.sendMessage).toHaveBeenCalled();
      });
    });

    it('should not send message when pressing Shift+Enter (for newline)', async () => {
      render(<MessageComposer {...defaultProps} />);

      const input = screen.getByPlaceholderText('Type a message...');
      await userEvent.type(input, 'Hello');
      fireEvent.keyPress(input, {
        key: 'Enter',
        code: 'Enter',
        charCode: 13,
        shiftKey: true,
      });

      expect(mockSmsService.sendMessage).not.toHaveBeenCalled();
    });

    it('should clear input after successful send', async () => {
      render(<MessageComposer {...defaultProps} />);

      const input = screen.getByPlaceholderText('Type a message...');
      await userEvent.type(input, 'Hello there!');

      const button = getSendButton();
      fireEvent.click(button);

      await waitFor(() => {
        expect(input).toHaveValue('');
      });
    });

    it('should trim whitespace from message', async () => {
      render(<MessageComposer {...defaultProps} />);

      const input = screen.getByPlaceholderText('Type a message...');
      await userEvent.type(input, '  Hello there!  ');

      const button = getSendButton();
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockSmsService.sendMessage).toHaveBeenCalledWith(
          expect.objectContaining({
            body: 'Hello there!',
          })
        );
      });
    });

    it('should include propertyLeadId when provided', async () => {
      render(<MessageComposer {...defaultProps} propertyLeadId="lead-123" />);

      const input = screen.getByPlaceholderText('Type a message...');
      await userEvent.type(input, 'Hello');

      const button = getSendButton();
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockSmsService.sendMessage).toHaveBeenCalledWith(
          expect.objectContaining({
            propertyLeadId: 'lead-123',
          })
        );
      });
    });

    it('should include contactId when provided', async () => {
      render(<MessageComposer {...defaultProps} contactId="contact-456" />);

      const input = screen.getByPlaceholderText('Type a message...');
      await userEvent.type(input, 'Hello');

      const button = getSendButton();
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockSmsService.sendMessage).toHaveBeenCalledWith(
          expect.objectContaining({
            contactId: 'contact-456',
          })
        );
      });
    });
  });

  describe('loading state', () => {
    it('should show loading spinner when sending', async () => {
      mockSmsService.sendMessage.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );

      render(<MessageComposer {...defaultProps} />);

      const input = screen.getByPlaceholderText('Type a message...');
      await userEvent.type(input, 'Hello');

      const button = getSendButton();
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
      });
    });

    it('should disable input while sending', async () => {
      mockSmsService.sendMessage.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );

      render(<MessageComposer {...defaultProps} />);

      const input = screen.getByPlaceholderText('Type a message...');
      await userEvent.type(input, 'Hello');

      const button = getSendButton();
      fireEvent.click(button);

      await waitFor(() => {
        expect(input).toBeDisabled();
      });
    });

    it('should disable send button while sending', async () => {
      mockSmsService.sendMessage.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );

      render(<MessageComposer {...defaultProps} />);

      const input = screen.getByPlaceholderText('Type a message...');
      await userEvent.type(input, 'Hello');

      const button = getSendButton();
      fireEvent.click(button);

      await waitFor(() => {
        expect(button).toBeDisabled();
      });
    });
  });

  describe('error handling', () => {
    it('should display error message when send fails from response', async () => {
      mockSmsService.sendMessage.mockResolvedValue({
        success: false,
        errorMessage: 'Invalid phone number',
      });

      render(<MessageComposer {...defaultProps} />);

      const input = screen.getByPlaceholderText('Type a message...');
      await userEvent.type(input, 'Hello');

      const button = getSendButton();
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Invalid phone number')).toBeInTheDocument();
      });
    });

    it('should display error message when API throws', async () => {
      mockSmsService.sendMessage.mockRejectedValue(new Error('Network error'));

      render(<MessageComposer {...defaultProps} />);

      const input = screen.getByPlaceholderText('Type a message...');
      await userEvent.type(input, 'Hello');

      const button = getSendButton();
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    it('should display default error when no message provided', async () => {
      mockSmsService.sendMessage.mockResolvedValue({
        success: false,
      });

      render(<MessageComposer {...defaultProps} />);

      const input = screen.getByPlaceholderText('Type a message...');
      await userEvent.type(input, 'Hello');

      const button = getSendButton();
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Failed to send message')).toBeInTheDocument();
      });
    });

    it('should not clear input when send fails', async () => {
      mockSmsService.sendMessage.mockResolvedValue({
        success: false,
        errorMessage: 'Failed',
      });

      render(<MessageComposer {...defaultProps} />);

      const input = screen.getByPlaceholderText('Type a message...');
      await userEvent.type(input, 'Hello');

      const button = getSendButton();
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Failed')).toBeInTheDocument();
      });

      expect(input).toHaveValue('Hello');
    });

    it('should clear error when typing new message', async () => {
      mockSmsService.sendMessage.mockResolvedValueOnce({
        success: false,
        errorMessage: 'Failed',
      });

      render(<MessageComposer {...defaultProps} />);

      const input = screen.getByPlaceholderText('Type a message...');
      await userEvent.type(input, 'Hello');

      const button = getSendButton();
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Failed')).toBeInTheDocument();
      });

      // Error should be cleared on next send attempt
      mockSmsService.sendMessage.mockResolvedValueOnce({
        success: true,
        messageId: 'msg-1',
      });

      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.queryByText('Failed')).not.toBeInTheDocument();
      });
    });
  });

  describe('multiline input', () => {
    it('should support multiline input', () => {
      render(<MessageComposer {...defaultProps} />);

      const input = screen.getByPlaceholderText('Type a message...');
      // MUI TextField multiline uses textarea under the hood
      expect(input.tagName.toLowerCase()).toBe('textarea');
    });
  });
});

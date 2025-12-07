import {
  SmsConversation,
  ConversationWithMessages,
  SendSmsRequest,
  SendSmsResponse,
  SmsMessage,
  SmsTemplate,
  CreateTemplateRequest,
  UpdateTemplateRequest,
} from '../../types/sms';

// Mock axios module
const mockGet = jest.fn();
const mockPost = jest.fn();
const mockPut = jest.fn();
const mockDelete = jest.fn();

jest.mock('axios', () => {
  return {
    create: () => ({
      get: (...args: any[]) => mockGet(...args),
      post: (...args: any[]) => mockPost(...args),
      put: (...args: any[]) => mockPut(...args),
      delete: (...args: any[]) => mockDelete(...args),
    }),
  };
});

// Import service AFTER setting up mocks
import { smsService } from '../smsService';

// Test fixtures
const mockConversation: SmsConversation = {
  id: 'conv-1',
  phoneNumber: '+15551234567',
  displayName: 'John Seller',
  propertyLeadId: 'lead-1',
  lastMessageAt: '2025-01-15T10:30:00Z',
  lastMessagePreview: 'Sounds good, let me know',
  unreadCount: 2,
};

const mockMessage: SmsMessage = {
  id: 'msg-1',
  conversationId: 'conv-1',
  toPhoneNumber: '+15551234567',
  fromPhoneNumber: '+15559876543',
  body: 'Hello, interested in selling?',
  direction: 'outbound',
  status: 'delivered',
  createdAt: '2025-01-15T10:00:00Z',
  deliveredAt: '2025-01-15T10:00:05Z',
};

const mockConversationWithMessages: ConversationWithMessages = {
  conversation: mockConversation,
  messages: [mockMessage],
};

describe('smsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getConversations', () => {
    it('should fetch all conversations', async () => {
      const conversations: SmsConversation[] = [mockConversation];
      mockGet.mockResolvedValue({ data: conversations });

      const result = await smsService.getConversations();

      expect(mockGet).toHaveBeenCalledWith('/api/sms/conversations');
      expect(result).toEqual(conversations);
    });

    it('should return empty array when no conversations exist', async () => {
      mockGet.mockResolvedValue({ data: [] });

      const result = await smsService.getConversations();

      expect(result).toEqual([]);
    });

    it('should throw error when API request fails', async () => {
      mockGet.mockRejectedValue(new Error('Network error'));

      await expect(smsService.getConversations()).rejects.toThrow('Network error');
    });
  });

  describe('getConversation', () => {
    it('should fetch a conversation by ID with messages', async () => {
      mockGet.mockResolvedValue({ data: mockConversationWithMessages });

      const result = await smsService.getConversation('conv-1');

      expect(mockGet).toHaveBeenCalledWith('/api/sms/conversations/conv-1');
      expect(result).toEqual(mockConversationWithMessages);
      expect(result.messages).toHaveLength(1);
    });

    it('should throw error for non-existent conversation', async () => {
      mockGet.mockRejectedValue({ response: { status: 404 } });

      await expect(smsService.getConversation('invalid-id')).rejects.toEqual({
        response: { status: 404 },
      });
    });
  });

  describe('getConversationByPhone', () => {
    it('should fetch conversation by phone number', async () => {
      mockGet.mockResolvedValue({ data: mockConversationWithMessages });

      const result = await smsService.getConversationByPhone('+15551234567');

      expect(mockGet).toHaveBeenCalledWith(
        '/api/sms/conversations/phone/%2B15551234567'
      );
      expect(result).toEqual(mockConversationWithMessages);
    });

    it('should return null when phone number not found (404)', async () => {
      mockGet.mockRejectedValue({ response: { status: 404 } });

      const result = await smsService.getConversationByPhone('+15559999999');

      expect(result).toBeNull();
    });

    it('should throw error for non-404 errors', async () => {
      mockGet.mockRejectedValue({ response: { status: 500 } });

      await expect(smsService.getConversationByPhone('+15551234567')).rejects.toEqual({
        response: { status: 500 },
      });
    });

    it('should encode special characters in phone number', async () => {
      mockGet.mockResolvedValue({ data: mockConversationWithMessages });

      await smsService.getConversationByPhone('+1 (555) 123-4567');

      expect(mockGet).toHaveBeenCalledWith(
        '/api/sms/conversations/phone/%2B1%20(555)%20123-4567'
      );
    });
  });

  describe('getConversationByLead', () => {
    it('should fetch conversation by lead ID', async () => {
      mockGet.mockResolvedValue({ data: mockConversationWithMessages });

      const result = await smsService.getConversationByLead('lead-1');

      expect(mockGet).toHaveBeenCalledWith('/api/sms/conversations/lead/lead-1');
      expect(result).toEqual(mockConversationWithMessages);
    });

    it('should return null when lead has no conversation (404)', async () => {
      mockGet.mockRejectedValue({ response: { status: 404 } });

      const result = await smsService.getConversationByLead('lead-999');

      expect(result).toBeNull();
    });

    it('should throw error for non-404 errors', async () => {
      mockGet.mockRejectedValue({ response: { status: 500 } });

      await expect(smsService.getConversationByLead('lead-1')).rejects.toEqual({
        response: { status: 500 },
      });
    });
  });

  describe('sendMessage', () => {
    it('should send SMS message successfully', async () => {
      const request: SendSmsRequest = {
        toPhoneNumber: '+15551234567',
        body: 'Hello, interested in your property',
        propertyLeadId: 'lead-1',
      };
      const response: SendSmsResponse = {
        success: true,
        messageId: 'msg-123',
        conversationId: 'conv-1',
      };
      mockPost.mockResolvedValue({ data: response });

      const result = await smsService.sendMessage(request);

      expect(mockPost).toHaveBeenCalledWith('/api/sms/send', request);
      expect(result).toEqual(response);
      expect(result.success).toBe(true);
    });

    it('should return error response for failed send', async () => {
      const request: SendSmsRequest = {
        toPhoneNumber: '+15551234567',
        body: 'Test message',
      };
      const response: SendSmsResponse = {
        success: false,
        errorMessage: 'Invalid phone number',
      };
      mockPost.mockResolvedValue({ data: response });

      const result = await smsService.sendMessage(request);

      expect(result.success).toBe(false);
      expect(result.errorMessage).toBe('Invalid phone number');
    });

    it('should include optional contactId when provided', async () => {
      const request: SendSmsRequest = {
        toPhoneNumber: '+15551234567',
        body: 'Test message',
        contactId: 'contact-1',
      };
      const response: SendSmsResponse = {
        success: true,
        messageId: 'msg-123',
        conversationId: 'conv-1',
      };
      mockPost.mockResolvedValue({ data: response });

      await smsService.sendMessage(request);

      expect(mockPost).toHaveBeenCalledWith('/api/sms/send', request);
    });

    it('should throw error when API request fails', async () => {
      const request: SendSmsRequest = {
        toPhoneNumber: '+15551234567',
        body: 'Test message',
      };
      mockPost.mockRejectedValue(new Error('Network error'));

      await expect(smsService.sendMessage(request)).rejects.toThrow('Network error');
    });
  });

  describe('getMessage', () => {
    it('should fetch a message by ID', async () => {
      mockGet.mockResolvedValue({ data: mockMessage });

      const result = await smsService.getMessage('msg-1');

      expect(mockGet).toHaveBeenCalledWith('/api/sms/messages/msg-1');
      expect(result).toEqual(mockMessage);
    });

    it('should throw error for non-existent message', async () => {
      mockGet.mockRejectedValue({ response: { status: 404 } });

      await expect(smsService.getMessage('invalid-id')).rejects.toEqual({
        response: { status: 404 },
      });
    });
  });

  describe('retryMessage', () => {
    it('should retry sending a failed message', async () => {
      const response: SendSmsResponse = {
        success: true,
        messageId: 'msg-1',
      };
      mockPost.mockResolvedValue({ data: response });

      const result = await smsService.retryMessage('msg-1');

      expect(mockPost).toHaveBeenCalledWith('/api/sms/messages/msg-1/retry');
      expect(result).toEqual(response);
    });

    it('should return error when retry fails', async () => {
      const response: SendSmsResponse = {
        success: false,
        errorMessage: 'Message already delivered',
      };
      mockPost.mockResolvedValue({ data: response });

      const result = await smsService.retryMessage('msg-1');

      expect(result.success).toBe(false);
      expect(result.errorMessage).toBe('Message already delivered');
    });
  });

  describe('markConversationRead', () => {
    it('should mark conversation as read', async () => {
      mockPost.mockResolvedValue({});

      await smsService.markConversationRead('conv-1');

      expect(mockPost).toHaveBeenCalledWith('/api/sms/conversations/conv-1/read');
    });

    it('should throw error when marking as read fails', async () => {
      mockPost.mockRejectedValue(new Error('Server error'));

      await expect(smsService.markConversationRead('conv-1')).rejects.toThrow(
        'Server error'
      );
    });
  });

  // ============ Template Tests ============

  const mockTemplate: SmsTemplate = {
    id: 'template-1',
    name: 'Initial Outreach',
    body: 'Hi {{name}}, I noticed your property at {{address}}. Are you interested in selling?',
    placeholders: ['name', 'address'],
    createdAt: '2025-01-15T10:00:00Z',
    updatedAt: '2025-01-15T10:00:00Z',
  };

  describe('getTemplates', () => {
    it('should fetch all templates', async () => {
      const templates: SmsTemplate[] = [mockTemplate];
      mockGet.mockResolvedValue({ data: templates });

      const result = await smsService.getTemplates();

      expect(mockGet).toHaveBeenCalledWith('/api/sms/templates');
      expect(result).toEqual(templates);
    });

    it('should return empty array when no templates exist', async () => {
      mockGet.mockResolvedValue({ data: [] });

      const result = await smsService.getTemplates();

      expect(result).toEqual([]);
    });

    it('should throw error when API request fails', async () => {
      mockGet.mockRejectedValue(new Error('Network error'));

      await expect(smsService.getTemplates()).rejects.toThrow('Network error');
    });
  });

  describe('getTemplate', () => {
    it('should fetch a template by ID', async () => {
      mockGet.mockResolvedValue({ data: mockTemplate });

      const result = await smsService.getTemplate('template-1');

      expect(mockGet).toHaveBeenCalledWith('/api/sms/templates/template-1');
      expect(result).toEqual(mockTemplate);
    });

    it('should throw error for non-existent template', async () => {
      mockGet.mockRejectedValue({ response: { status: 404 } });

      await expect(smsService.getTemplate('invalid-id')).rejects.toEqual({
        response: { status: 404 },
      });
    });
  });

  describe('createTemplate', () => {
    it('should create a new template', async () => {
      const request: CreateTemplateRequest = {
        name: 'New Template',
        body: 'Hi {{name}}, this is a test.',
      };
      const createdTemplate: SmsTemplate = {
        ...mockTemplate,
        id: 'template-new',
        name: request.name,
        body: request.body,
        placeholders: ['name'],
      };
      mockPost.mockResolvedValue({ data: createdTemplate });

      const result = await smsService.createTemplate(request);

      expect(mockPost).toHaveBeenCalledWith('/api/sms/templates', request);
      expect(result).toEqual(createdTemplate);
      expect(result.name).toBe('New Template');
    });

    it('should throw error when creation fails', async () => {
      const request: CreateTemplateRequest = {
        name: '',
        body: 'Test body',
      };
      mockPost.mockRejectedValue({ response: { status: 400, data: 'Name is required' } });

      await expect(smsService.createTemplate(request)).rejects.toEqual({
        response: { status: 400, data: 'Name is required' },
      });
    });
  });

  describe('updateTemplate', () => {
    it('should update an existing template', async () => {
      const request: UpdateTemplateRequest = {
        name: 'Updated Name',
        body: 'Updated body with {{name}}',
      };
      const updatedTemplate: SmsTemplate = {
        ...mockTemplate,
        name: request.name,
        body: request.body,
        updatedAt: '2025-01-16T10:00:00Z',
      };
      mockPut.mockResolvedValue({ data: updatedTemplate });

      const result = await smsService.updateTemplate('template-1', request);

      expect(mockPut).toHaveBeenCalledWith('/api/sms/templates/template-1', request);
      expect(result).toEqual(updatedTemplate);
      expect(result.name).toBe('Updated Name');
    });

    it('should throw error when template not found', async () => {
      const request: UpdateTemplateRequest = {
        name: 'Updated',
        body: 'Body',
      };
      mockPut.mockRejectedValue({ response: { status: 404 } });

      await expect(smsService.updateTemplate('invalid-id', request)).rejects.toEqual({
        response: { status: 404 },
      });
    });
  });

  describe('deleteTemplate', () => {
    it('should delete a template', async () => {
      mockDelete.mockResolvedValue({});

      await smsService.deleteTemplate('template-1');

      expect(mockDelete).toHaveBeenCalledWith('/api/sms/templates/template-1');
    });

    it('should throw error when template not found', async () => {
      mockDelete.mockRejectedValue({ response: { status: 404 } });

      await expect(smsService.deleteTemplate('invalid-id')).rejects.toEqual({
        response: { status: 404 },
      });
    });

    it('should throw error when deletion fails', async () => {
      mockDelete.mockRejectedValue(new Error('Server error'));

      await expect(smsService.deleteTemplate('template-1')).rejects.toThrow('Server error');
    });
  });
});

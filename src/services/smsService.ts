import {
  SmsConversation,
  ConversationWithMessages,
  SendSmsRequest,
  SendSmsResponse,
  SmsMessage,
  SmsTemplate,
  CreateTemplateRequest,
  UpdateTemplateRequest,
} from '../types/sms';
import { axiosInstance } from './api';

export const smsService = {
  /**
   * Get all SMS conversations sorted by last message date
   */
  async getConversations(): Promise<SmsConversation[]> {
    const response = await axiosInstance.get<SmsConversation[]>('/api/sms/conversations');
    return response.data;
  },

  /**
   * Get a specific conversation with its messages
   */
  async getConversation(id: string): Promise<ConversationWithMessages> {
    const response = await axiosInstance.get<ConversationWithMessages>(
      `/api/sms/conversations/${id}`
    );
    return response.data;
  },

  /**
   * Get conversation by phone number (returns null if not found)
   */
  async getConversationByPhone(phone: string): Promise<ConversationWithMessages | null> {
    try {
      const response = await axiosInstance.get<ConversationWithMessages>(
        `/api/sms/conversations/phone/${encodeURIComponent(phone)}`
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  /**
   * Get conversation by property lead ID
   */
  async getConversationByLead(leadId: string): Promise<ConversationWithMessages | null> {
    try {
      const response = await axiosInstance.get<ConversationWithMessages>(
        `/api/sms/conversations/lead/${leadId}`
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  /**
   * Send an SMS message
   */
  async sendMessage(request: SendSmsRequest): Promise<SendSmsResponse> {
    const response = await axiosInstance.post<SendSmsResponse>(
      '/api/sms/send',
      request
    );
    return response.data;
  },

  /**
   * Get a specific message by ID
   */
  async getMessage(id: string): Promise<SmsMessage> {
    const response = await axiosInstance.get<SmsMessage>(`/api/sms/messages/${id}`);
    return response.data;
  },

  /**
   * Retry sending a failed message
   */
  async retryMessage(id: string): Promise<SendSmsResponse> {
    const response = await axiosInstance.post<SendSmsResponse>(`/api/sms/messages/${id}/retry`);
    return response.data;
  },

  /**
   * Mark a conversation as read
   */
  async markConversationRead(conversationId: string): Promise<void> {
    await axiosInstance.post(`/api/sms/conversations/${conversationId}/read`);
  },

  /**
   * Mark a conversation as unread
   */
  async markConversationUnread(conversationId: string): Promise<void> {
    await axiosInstance.post(`/api/sms/conversations/${conversationId}/unread`);
  },

  // ============ Template Methods ============

  /**
   * Get all SMS templates
   */
  async getTemplates(): Promise<SmsTemplate[]> {
    const response = await axiosInstance.get<SmsTemplate[]>('/api/sms/templates');
    return response.data;
  },

  /**
   * Get a specific template by ID
   */
  async getTemplate(id: string): Promise<SmsTemplate> {
    const response = await axiosInstance.get<SmsTemplate>(`/api/sms/templates/${id}`);
    return response.data;
  },

  /**
   * Create a new template
   */
  async createTemplate(request: CreateTemplateRequest): Promise<SmsTemplate> {
    const response = await axiosInstance.post<SmsTemplate>('/api/sms/templates', request);
    return response.data;
  },

  /**
   * Update an existing template
   */
  async updateTemplate(id: string, request: UpdateTemplateRequest): Promise<SmsTemplate> {
    const response = await axiosInstance.put<SmsTemplate>(`/api/sms/templates/${id}`, request);
    return response.data;
  },

  /**
   * Delete a template
   */
  async deleteTemplate(id: string): Promise<void> {
    await axiosInstance.delete(`/api/sms/templates/${id}`);
  },

  /**
   * Reorder templates by providing an array of template IDs in the desired order
   */
  async reorderTemplates(templateIds: string[]): Promise<void> {
    await axiosInstance.put('/api/sms/templates/reorder', { templateIds });
  },
};

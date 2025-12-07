/**
 * SMS Messaging Types
 * Type definitions for SMS conversations, messages, and API contracts
 */

export interface SmsConversation {
  id: string;
  phoneNumber: string;
  displayName?: string;
  propertyLeadId?: string;
  contactId?: string;
  lastMessageAt?: string;
  lastMessagePreview?: string;
  unreadCount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface SmsMessage {
  id: string;
  conversationId: string;
  toPhoneNumber: string;
  fromPhoneNumber: string;
  body: string;
  direction: 'outbound' | 'inbound';
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  errorMessage?: string;
  createdAt: string;
  deliveredAt?: string;
}

export interface ConversationWithMessages {
  conversation: SmsConversation;
  messages: SmsMessage[];
}

export interface SendSmsRequest {
  toPhoneNumber: string;
  body: string;
  propertyLeadId?: string;
  contactId?: string;
}

export interface SendSmsResponse {
  success: boolean;
  messageId?: string;
  conversationId?: string;
  errorMessage?: string;
}

export interface SmsTemplate {
  id: string;
  name: string;
  body: string;
  placeholders: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTemplateRequest {
  name: string;
  body: string;
}

export interface UpdateTemplateRequest {
  name: string;
  body: string;
}

export interface TemplateVariables {
  name?: string;
  address?: string;
  price?: string;
  phone?: string;
  [key: string]: string | undefined;
}

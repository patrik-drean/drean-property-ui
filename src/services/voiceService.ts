import {
  VoiceCall,
  InitiateCallRequest,
  InitiateCallResponse,
} from '../types/voice';
import { axiosInstance } from './api';

export const voiceService = {
  /**
   * Initiate a click-to-call to a phone number
   * This will call the owner's phone first, then connect to the target
   */
  async initiateCall(request: InitiateCallRequest): Promise<InitiateCallResponse> {
    const response = await axiosInstance.post<InitiateCallResponse>(
      '/api/voice/call',
      request
    );
    return response.data;
  },

  /**
   * Get recent call history
   */
  async getCallHistory(limit?: number): Promise<VoiceCall[]> {
    const params = limit ? { limit } : {};
    const response = await axiosInstance.get<VoiceCall[]>('/api/voice/calls', { params });
    return response.data;
  },

  /**
   * Get calls for a specific lead
   */
  async getCallsForLead(leadId: string): Promise<VoiceCall[]> {
    const response = await axiosInstance.get<VoiceCall[]>(
      `/api/voice/calls/lead/${leadId}`
    );
    return response.data;
  },

  /**
   * Get all calls with voicemail recordings
   */
  async getVoicemails(): Promise<VoiceCall[]> {
    const response = await axiosInstance.get<VoiceCall[]>('/api/voice/voicemails');
    return response.data;
  },
};

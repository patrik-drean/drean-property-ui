import {
  VoiceCall,
  InitiateCallRequest,
  InitiateCallResponse,
} from '../../types/voice';

// Mock axios module before any imports that use it
const mockGet = jest.fn();
const mockPost = jest.fn();

// Mock axios.create to return an axios-like instance with interceptors
jest.mock('axios', () => {
  return {
    create: () => ({
      get: (...args: any[]) => mockGet(...args),
      post: (...args: any[]) => mockPost(...args),
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() },
      },
    }),
  };
});

// Import service AFTER setting up mocks
import { voiceService } from '../voiceService';

// Test fixtures
const mockVoiceCall: VoiceCall = {
  id: 'call-1',
  direction: 'outbound',
  fromNumber: '+12107961756',
  toNumber: '+12105551234',
  twilioCallSid: 'CA123456789',
  status: 'completed',
  durationSeconds: 120,
  startedAt: '2025-01-15T10:00:00Z',
  endedAt: '2025-01-15T10:02:00Z',
  propertyLeadId: 'lead-1',
  createdAt: '2025-01-15T10:00:00Z',
};

const mockVoiceCallWithVoicemail: VoiceCall = {
  ...mockVoiceCall,
  id: 'call-2',
  status: 'no-answer',
  voicemailUrl: 'https://api.twilio.com/recordings/RE123456',
  voicemailTranscription: 'Hi, please call me back about the property.',
};

describe('voiceService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initiateCall', () => {
    it('should initiate a call successfully', async () => {
      const request: InitiateCallRequest = {
        toPhoneNumber: '+12105551234',
        propertyLeadId: 'lead-1',
      };
      const response: InitiateCallResponse = {
        success: true,
        callId: 'call-123',
        twilioCallSid: 'CA123456789',
      };
      mockPost.mockResolvedValue({ data: response });

      const result = await voiceService.initiateCall(request);

      expect(mockPost).toHaveBeenCalledWith('/api/voice/call', request);
      expect(result).toEqual(response);
      expect(result.success).toBe(true);
    });

    it('should return error response for failed call', async () => {
      const request: InitiateCallRequest = {
        toPhoneNumber: '+12105551234',
      };
      const response: InitiateCallResponse = {
        success: false,
        errorMessage: 'Invalid phone number',
      };
      mockPost.mockResolvedValue({ data: response });

      const result = await voiceService.initiateCall(request);

      expect(result.success).toBe(false);
      expect(result.errorMessage).toBe('Invalid phone number');
    });

    it('should initiate call without propertyLeadId', async () => {
      const request: InitiateCallRequest = {
        toPhoneNumber: '+12105551234',
      };
      const response: InitiateCallResponse = {
        success: true,
        callId: 'call-123',
        twilioCallSid: 'CA123456789',
      };
      mockPost.mockResolvedValue({ data: response });

      await voiceService.initiateCall(request);

      expect(mockPost).toHaveBeenCalledWith('/api/voice/call', request);
    });

    it('should throw error when API request fails', async () => {
      const request: InitiateCallRequest = {
        toPhoneNumber: '+12105551234',
      };
      mockPost.mockRejectedValue(new Error('Network error'));

      await expect(voiceService.initiateCall(request)).rejects.toThrow('Network error');
    });
  });

  describe('getCallHistory', () => {
    it('should fetch call history without limit', async () => {
      const calls: VoiceCall[] = [mockVoiceCall];
      mockGet.mockResolvedValue({ data: calls });

      const result = await voiceService.getCallHistory();

      expect(mockGet).toHaveBeenCalledWith('/api/voice/calls', { params: {} });
      expect(result).toEqual(calls);
    });

    it('should fetch call history with limit', async () => {
      const calls: VoiceCall[] = [mockVoiceCall];
      mockGet.mockResolvedValue({ data: calls });

      const result = await voiceService.getCallHistory(10);

      expect(mockGet).toHaveBeenCalledWith('/api/voice/calls', { params: { limit: 10 } });
      expect(result).toEqual(calls);
    });

    it('should return empty array when no calls exist', async () => {
      mockGet.mockResolvedValue({ data: [] });

      const result = await voiceService.getCallHistory();

      expect(result).toEqual([]);
    });

    it('should throw error when API request fails', async () => {
      mockGet.mockRejectedValue(new Error('Network error'));

      await expect(voiceService.getCallHistory()).rejects.toThrow('Network error');
    });
  });

  describe('getCallsForLead', () => {
    it('should fetch calls for a specific lead', async () => {
      const calls: VoiceCall[] = [mockVoiceCall];
      mockGet.mockResolvedValue({ data: calls });

      const result = await voiceService.getCallsForLead('lead-1');

      expect(mockGet).toHaveBeenCalledWith('/api/voice/calls/lead/lead-1');
      expect(result).toEqual(calls);
      expect(result[0].propertyLeadId).toBe('lead-1');
    });

    it('should return empty array when lead has no calls', async () => {
      mockGet.mockResolvedValue({ data: [] });

      const result = await voiceService.getCallsForLead('lead-999');

      expect(result).toEqual([]);
    });

    it('should throw error for non-existent lead', async () => {
      mockGet.mockRejectedValue({ response: { status: 404 } });

      await expect(voiceService.getCallsForLead('invalid-id')).rejects.toEqual({
        response: { status: 404 },
      });
    });
  });

  describe('getVoicemails', () => {
    it('should fetch all calls with voicemail', async () => {
      const calls: VoiceCall[] = [mockVoiceCallWithVoicemail];
      mockGet.mockResolvedValue({ data: calls });

      const result = await voiceService.getVoicemails();

      expect(mockGet).toHaveBeenCalledWith('/api/voice/voicemails');
      expect(result).toEqual(calls);
      expect(result[0].voicemailUrl).toBeDefined();
    });

    it('should return empty array when no voicemails exist', async () => {
      mockGet.mockResolvedValue({ data: [] });

      const result = await voiceService.getVoicemails();

      expect(result).toEqual([]);
    });

    it('should throw error when API request fails', async () => {
      mockGet.mockRejectedValue(new Error('Server error'));

      await expect(voiceService.getVoicemails()).rejects.toThrow('Server error');
    });
  });
});

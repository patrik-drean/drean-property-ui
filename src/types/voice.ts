/**
 * Voice Calling Types
 * Type definitions for voice calls, call history, and API contracts
 */

export interface VoiceCall {
  id: string;
  direction: 'inbound' | 'outbound';
  fromNumber: string;
  toNumber: string;
  twilioCallSid?: string;
  status: 'initiating' | 'ringing' | 'in-progress' | 'completed' | 'busy' | 'no-answer' | 'failed' | 'canceled';
  durationSeconds?: number;
  startedAt: string;
  endedAt?: string;
  voicemailUrl?: string;
  voicemailTranscription?: string;
  propertyLeadId?: string;
  createdAt: string;
}

export interface VoiceCallWithLead extends VoiceCall {
  leadAddress?: string;
}

export interface InitiateCallRequest {
  toPhoneNumber: string;
  propertyLeadId?: string;
}

export interface InitiateCallResponse {
  success: boolean;
  callId?: string;
  twilioCallSid?: string;
  errorMessage?: string;
}

// Helper to format duration
export function formatCallDuration(seconds: number | undefined): string {
  if (!seconds) return '0:00';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Helper to get call status display text
export function getCallStatusDisplay(status: VoiceCall['status']): string {
  switch (status) {
    case 'initiating':
      return 'Initiating...';
    case 'ringing':
      return 'Ringing';
    case 'in-progress':
      return 'In Progress';
    case 'completed':
      return 'Completed';
    case 'busy':
      return 'Busy';
    case 'no-answer':
      return 'No Answer';
    case 'failed':
      return 'Failed';
    case 'canceled':
      return 'Canceled';
    default:
      return status;
  }
}

// Helper to get call status color for UI
export function getCallStatusColor(status: VoiceCall['status']): 'default' | 'primary' | 'success' | 'warning' | 'danger' {
  switch (status) {
    case 'completed':
      return 'success';
    case 'in-progress':
    case 'ringing':
      return 'primary';
    case 'initiating':
      return 'warning';
    case 'busy':
    case 'no-answer':
    case 'canceled':
      return 'default';
    case 'failed':
      return 'danger';
    default:
      return 'default';
  }
}

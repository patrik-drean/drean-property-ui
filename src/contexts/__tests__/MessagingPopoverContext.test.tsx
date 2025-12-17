/**
 * Unit tests for MessagingPopoverContext
 *
 * Tests global state management for messaging popover including:
 * - Opening popover with conversationId or phoneNumber
 * - Draft saving when switching conversations
 * - Minimize/restore functionality
 * - Context provider requirements
 */

import React from 'react';
import { renderHook, act } from '@testing-library/react';
import {
  MessagingPopoverProvider,
  useMessagingPopover,
} from '../MessagingPopoverContext';
import { draftStorage } from '../../utils/draftStorage';

// Mock draftStorage utility
jest.mock('../../utils/draftStorage', () => ({
  draftStorage: {
    saveDraft: jest.fn(),
    getDraft: jest.fn(),
    clearDraft: jest.fn(),
    clearAllDrafts: jest.fn(),
  },
}));

describe('MessagingPopoverContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset getDraft to return null by default
    (draftStorage.getDraft as jest.Mock).mockReturnValue(null);
  });

  const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <MessagingPopoverProvider>{children}</MessagingPopoverProvider>
  );

  describe('useMessagingPopover hook', () => {
    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      expect(() => {
        renderHook(() => useMessagingPopover());
      }).toThrow('useMessagingPopover must be used within a MessagingPopoverProvider');

      consoleSpy.mockRestore();
    });

    it('should provide context when used inside provider', () => {
      const { result } = renderHook(() => useMessagingPopover(), { wrapper });

      expect(result.current).toBeDefined();
      expect(result.current.isOpen).toBe(false);
      expect(result.current.openPopover).toBeInstanceOf(Function);
      expect(result.current.closePopover).toBeInstanceOf(Function);
    });
  });

  describe('Initial state', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useMessagingPopover(), { wrapper });

      expect(result.current.isOpen).toBe(false);
      expect(result.current.isMinimized).toBe(false);
      expect(result.current.conversationId).toBeNull();
      expect(result.current.phoneNumber).toBeNull();
      expect(result.current.leadId).toBeNull();
      expect(result.current.contactName).toBeNull();
      expect(result.current.draftText).toBe('');
      expect(result.current.leadName).toBeUndefined();
      expect(result.current.leadAddress).toBeUndefined();
      expect(result.current.leadPrice).toBeUndefined();
    });
  });

  describe('openPopover', () => {
    it('should open popover with conversationId', () => {
      const { result } = renderHook(() => useMessagingPopover(), { wrapper });

      act(() => {
        result.current.openPopover({ conversationId: 'conv-123' });
      });

      expect(result.current.isOpen).toBe(true);
      expect(result.current.isMinimized).toBe(false);
      expect(result.current.conversationId).toBe('conv-123');
      expect(result.current.phoneNumber).toBeNull();
      expect(result.current.leadId).toBeNull();
    });

    it('should open popover with phoneNumber and leadId', () => {
      const { result } = renderHook(() => useMessagingPopover(), { wrapper });

      act(() => {
        result.current.openPopover({
          phoneNumber: '+1234567890',
          leadId: 'lead-456',
        });
      });

      expect(result.current.isOpen).toBe(true);
      expect(result.current.conversationId).toBeNull();
      expect(result.current.phoneNumber).toBe('+1234567890');
      expect(result.current.leadId).toBe('lead-456');
    });

    it('should store lead template variables', () => {
      const { result } = renderHook(() => useMessagingPopover(), { wrapper });

      act(() => {
        result.current.openPopover({
          phoneNumber: '+1234567890',
          leadId: 'lead-456',
          leadName: '123 Main St',
          leadAddress: '123 Main St, Denver, CO 80202',
          leadPrice: '350000',
        });
      });

      expect(result.current.leadName).toBe('123 Main St');
      expect(result.current.leadAddress).toBe('123 Main St, Denver, CO 80202');
      expect(result.current.leadPrice).toBe('350000');
    });

    it('should save draft when switching conversations', () => {
      const { result } = renderHook(() => useMessagingPopover(), { wrapper });

      // Open first conversation and add draft text
      act(() => {
        result.current.openPopover({ conversationId: 'conv-1' });
      });

      act(() => {
        result.current.setDraftText('Draft message for conv-1');
      });

      // Switch to second conversation
      act(() => {
        result.current.openPopover({ conversationId: 'conv-2' });
      });

      // Verify draft was saved for conv-1
      expect(draftStorage.saveDraft).toHaveBeenCalledWith('conv-1', 'Draft message for conv-1');

      // Verify new conversation is open
      expect(result.current.conversationId).toBe('conv-2');
      expect(result.current.draftText).toBe(''); // New conversation starts with empty draft
    });

    it('should not save draft when switching conversations if draft is empty', () => {
      const { result } = renderHook(() => useMessagingPopover(), { wrapper });

      // Open first conversation without draft
      act(() => {
        result.current.openPopover({ conversationId: 'conv-1' });
      });

      // Switch to second conversation
      act(() => {
        result.current.openPopover({ conversationId: 'conv-2' });
      });

      // Verify draft was not saved
      expect(draftStorage.saveDraft).not.toHaveBeenCalled();
    });

    it('should load draft from localStorage when opening conversation', async () => {
      (draftStorage.getDraft as jest.Mock).mockReturnValue('Saved draft text');

      const { result } = renderHook(() => useMessagingPopover(), { wrapper });

      act(() => {
        result.current.openPopover({ conversationId: 'conv-123' });
      });

      // Wait for useEffect to load draft
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(draftStorage.getDraft).toHaveBeenCalledWith('conv-123');
      expect(result.current.draftText).toBe('Saved draft text');
    });
  });

  describe('closePopover', () => {
    it('should close popover and reset state', () => {
      const { result } = renderHook(() => useMessagingPopover(), { wrapper });

      // Open popover
      act(() => {
        result.current.openPopover({
          conversationId: 'conv-123',
          leadName: '123 Main St',
        });
      });

      // Close popover
      act(() => {
        result.current.closePopover();
      });

      // Verify state is reset
      expect(result.current.isOpen).toBe(false);
      expect(result.current.isMinimized).toBe(false);
      expect(result.current.conversationId).toBeNull();
      expect(result.current.phoneNumber).toBeNull();
      expect(result.current.leadId).toBeNull();
      expect(result.current.draftText).toBe('');
      expect(result.current.leadName).toBeUndefined();
    });

    it('should save draft before closing if present', () => {
      const { result } = renderHook(() => useMessagingPopover(), { wrapper });

      // Open popover and add draft
      act(() => {
        result.current.openPopover({ conversationId: 'conv-123' });
      });

      act(() => {
        result.current.setDraftText('Unsent message');
      });

      // Close popover
      act(() => {
        result.current.closePopover();
      });

      // Verify draft was saved
      expect(draftStorage.saveDraft).toHaveBeenCalledWith('conv-123', 'Unsent message');
    });

    it('should not save draft before closing if empty', () => {
      const { result } = renderHook(() => useMessagingPopover(), { wrapper });

      // Open popover without draft
      act(() => {
        result.current.openPopover({ conversationId: 'conv-123' });
      });

      // Close popover
      act(() => {
        result.current.closePopover();
      });

      // Verify draft was not saved
      expect(draftStorage.saveDraft).not.toHaveBeenCalled();
    });
  });

  describe('minimizePopover', () => {
    it('should set isMinimized to true', () => {
      const { result } = renderHook(() => useMessagingPopover(), { wrapper });

      // Open popover
      act(() => {
        result.current.openPopover({ conversationId: 'conv-123' });
      });

      // Minimize
      act(() => {
        result.current.minimizePopover();
      });

      expect(result.current.isOpen).toBe(true);
      expect(result.current.isMinimized).toBe(true);
      expect(result.current.conversationId).toBe('conv-123'); // State preserved
    });

    it('should preserve draft text when minimizing', () => {
      const { result } = renderHook(() => useMessagingPopover(), { wrapper });

      act(() => {
        result.current.openPopover({ conversationId: 'conv-123' });
      });

      act(() => {
        result.current.setDraftText('Draft text');
      });

      act(() => {
        result.current.minimizePopover();
      });

      expect(result.current.draftText).toBe('Draft text');
    });
  });

  describe('restorePopover', () => {
    it('should set isMinimized to false', () => {
      const { result } = renderHook(() => useMessagingPopover(), { wrapper });

      // Open and minimize popover
      act(() => {
        result.current.openPopover({ conversationId: 'conv-123' });
      });

      act(() => {
        result.current.minimizePopover();
      });

      // Restore
      act(() => {
        result.current.restorePopover();
      });

      expect(result.current.isOpen).toBe(true);
      expect(result.current.isMinimized).toBe(false);
      expect(result.current.conversationId).toBe('conv-123'); // State preserved
    });

    it('should preserve draft text when restoring', () => {
      const { result } = renderHook(() => useMessagingPopover(), { wrapper });

      act(() => {
        result.current.openPopover({ conversationId: 'conv-123' });
      });

      act(() => {
        result.current.setDraftText('Draft text');
      });

      act(() => {
        result.current.minimizePopover();
      });

      act(() => {
        result.current.restorePopover();
      });

      expect(result.current.draftText).toBe('Draft text');
    });
  });

  describe('setDraftText', () => {
    it('should update draft text in state', () => {
      const { result } = renderHook(() => useMessagingPopover(), { wrapper });

      act(() => {
        result.current.openPopover({ conversationId: 'conv-123' });
      });

      act(() => {
        result.current.setDraftText('New draft text');
      });

      expect(result.current.draftText).toBe('New draft text');
    });

    it('should auto-save draft to localStorage', () => {
      const { result } = renderHook(() => useMessagingPopover(), { wrapper });

      act(() => {
        result.current.openPopover({ conversationId: 'conv-123' });
      });

      act(() => {
        result.current.setDraftText('Auto-saved draft');
      });

      expect(draftStorage.saveDraft).toHaveBeenCalledWith('conv-123', 'Auto-saved draft');
    });

    it('should handle multiple draft text updates', () => {
      const { result } = renderHook(() => useMessagingPopover(), { wrapper });

      act(() => {
        result.current.openPopover({ conversationId: 'conv-123' });
      });

      act(() => {
        result.current.setDraftText('First draft');
      });

      act(() => {
        result.current.setDraftText('Second draft');
      });

      act(() => {
        result.current.setDraftText('Third draft');
      });

      expect(result.current.draftText).toBe('Third draft');
      expect(draftStorage.saveDraft).toHaveBeenCalledTimes(3);
      expect(draftStorage.saveDraft).toHaveBeenLastCalledWith('conv-123', 'Third draft');
    });

    it('should not save draft if no conversationId is set', () => {
      const { result } = renderHook(() => useMessagingPopover(), { wrapper });

      // Don't open popover, try to set draft directly
      act(() => {
        result.current.setDraftText('Orphan draft');
      });

      expect(result.current.draftText).toBe('Orphan draft');
      expect(draftStorage.saveDraft).not.toHaveBeenCalled();
    });
  });

  describe('State persistence across actions', () => {
    it('should maintain conversation state through minimize/restore cycle', () => {
      const { result } = renderHook(() => useMessagingPopover(), { wrapper });

      act(() => {
        result.current.openPopover({
          conversationId: 'conv-123',
          phoneNumber: '+1234567890',
          leadId: 'lead-456',
          leadName: '123 Main St',
        });
      });

      act(() => {
        result.current.setDraftText('Test draft');
      });

      act(() => {
        result.current.minimizePopover();
      });

      act(() => {
        result.current.restorePopover();
      });

      // Verify all state is preserved
      expect(result.current.conversationId).toBe('conv-123');
      expect(result.current.phoneNumber).toBe('+1234567890');
      expect(result.current.leadId).toBe('lead-456');
      expect(result.current.leadName).toBe('123 Main St');
      expect(result.current.draftText).toBe('Test draft');
    });
  });
});

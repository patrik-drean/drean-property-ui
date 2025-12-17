import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  MessagingPopoverState,
  MessagingPopoverContextType,
  OpenPopoverParams,
} from '../types/messagingPopover';
import { draftStorage } from '../utils/draftStorage';

/**
 * React Context for managing global messaging popover state
 *
 * This context persists across page navigation, allowing users to keep
 * conversations open while browsing different pages of the application.
 */
const MessagingPopoverContext = createContext<MessagingPopoverContextType | undefined>(
  undefined
);

/**
 * Hook to access the messaging popover context
 * Must be used within a MessagingPopoverProvider
 */
export const useMessagingPopover = (): MessagingPopoverContextType => {
  const context = useContext(MessagingPopoverContext);
  if (context === undefined) {
    throw new Error(
      'useMessagingPopover must be used within a MessagingPopoverProvider'
    );
  }
  return context;
};

const initialState: MessagingPopoverState = {
  isOpen: false,
  isMinimized: false,
  conversationId: null,
  phoneNumber: null,
  leadId: null,
  contactName: null,
  draftText: '',
  leadName: undefined,
  leadAddress: undefined,
  leadPrice: undefined,
};

interface MessagingPopoverProviderProps {
  children: React.ReactNode;
}

/**
 * Provider component for the messaging popover context
 * Should be placed at the App level to ensure state persists across navigation
 */
export const MessagingPopoverProvider: React.FC<MessagingPopoverProviderProps> = ({
  children,
}) => {
  const [state, setState] = useState<MessagingPopoverState>(initialState);

  /**
   * Restore draft from localStorage when conversation changes
   */
  useEffect(() => {
    if (state.conversationId && state.isOpen) {
      const draft = draftStorage.getDraft(state.conversationId);
      if (draft) {
        setState((prev) => ({ ...prev, draftText: draft }));
      }
    }
  }, [state.conversationId, state.isOpen]);

  /**
   * Open the messaging popover with a conversation or phone number
   */
  const openPopover = useCallback(
    ({ conversationId, phoneNumber, leadId, leadName, leadAddress, leadPrice }: OpenPopoverParams) => {
      // Save draft for current conversation before switching
      if (state.conversationId && state.conversationId !== conversationId && state.draftText) {
        draftStorage.saveDraft(state.conversationId, state.draftText);
      }

      setState({
        isOpen: true,
        isMinimized: false,
        conversationId: conversationId || null,
        phoneNumber: phoneNumber || null,
        leadId: leadId || null,
        contactName: null, // Will be fetched by popover component
        draftText: '', // Will be loaded from localStorage by useEffect
        leadName,
        leadAddress,
        leadPrice,
      });

      console.log('Popover opened:', { conversationId, phoneNumber, leadId, leadName, leadAddress, leadPrice });
    },
    [state.conversationId, state.draftText]
  );

  /**
   * Close the popover and save draft if present
   */
  const closePopover = useCallback(() => {
    // Save draft before closing
    if (state.conversationId && state.draftText) {
      draftStorage.saveDraft(state.conversationId, state.draftText);
    }

    setState(initialState);
    console.log('Popover closed');
  }, [state.conversationId, state.draftText]);

  /**
   * Minimize the popover to a 40px bottom bar
   */
  const minimizePopover = useCallback(() => {
    setState((prev) => ({ ...prev, isMinimized: true }));
    console.log('Popover minimized');
  }, []);

  /**
   * Restore the popover from minimized state
   */
  const restorePopover = useCallback(() => {
    setState((prev) => ({ ...prev, isMinimized: false }));
    console.log('Popover restored');
  }, []);

  /**
   * Update draft text and auto-save to localStorage
   */
  const setDraftText = useCallback(
    (text: string) => {
      setState((prev) => ({ ...prev, draftText: text }));

      // Auto-save draft to localStorage
      if (state.conversationId) {
        draftStorage.saveDraft(state.conversationId, text);
      }
    },
    [state.conversationId]
  );

  const value: MessagingPopoverContextType = {
    ...state,
    openPopover,
    closePopover,
    minimizePopover,
    restorePopover,
    setDraftText,
  };

  return (
    <MessagingPopoverContext.Provider value={value}>
      {children}
    </MessagingPopoverContext.Provider>
  );
};

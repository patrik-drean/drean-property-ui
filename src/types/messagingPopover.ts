/**
 * Types and interfaces for the messaging popover feature
 *
 * The messaging popover allows users to message leads without losing context
 * of their current page by displaying a Gmail-style floating conversation window.
 */

/**
 * Parameters for opening the messaging popover
 */
export interface OpenPopoverParams {
  /** Existing conversation ID to open */
  conversationId?: string;
  /** Phone number to message (creates new conversation if needed) */
  phoneNumber?: string;
  /** Associated property lead ID for context */
  leadId?: string;
  /** Lead data for template variables */
  leadName?: string;
  leadAddress?: string;
  leadPrice?: string;
}

/**
 * Internal state of the messaging popover
 */
export interface MessagingPopoverState {
  /** Whether the popover is currently open */
  isOpen: boolean;
  /** Whether the popover is minimized to the bottom bar */
  isMinimized: boolean;
  /** Current conversation ID being displayed */
  conversationId: string | null;
  /** Phone number for the conversation */
  phoneNumber: string | null;
  /** Associated property lead ID */
  leadId: string | null;
  /** Display name for the conversation (contact name or phone) */
  contactName: string | null;
  /** Draft message text (auto-saved to localStorage) */
  draftText: string;
  /** Lead data for template variables */
  leadName?: string;
  leadAddress?: string;
  leadPrice?: string;
}

/**
 * Context type for the messaging popover
 * Extends the state with action methods
 */
export interface MessagingPopoverContextType extends MessagingPopoverState {
  /** Open the popover with a conversation or phone number */
  openPopover: (params: OpenPopoverParams) => void;
  /** Close the popover and save draft */
  closePopover: () => void;
  /** Minimize popover to 40px bottom bar */
  minimizePopover: () => void;
  /** Restore popover from minimized state */
  restorePopover: () => void;
  /** Update draft text (auto-saves to localStorage) */
  setDraftText: (text: string) => void;
}

/**
 * localStorage utility for persisting SMS message drafts
 *
 * Drafts are automatically saved when the user types and restored when
 * the conversation is reopened. Drafts expire after 24 hours to prevent
 * localStorage from filling up with stale data.
 */

const DRAFT_KEY_PREFIX = 'sms_draft_';
const DRAFT_EXPIRY_HOURS = 24;

interface DraftData {
  text: string;
  timestamp: number;
}

/**
 * Save a draft message to localStorage
 *
 * @param conversationId - The conversation ID to associate with the draft
 * @param text - The draft message text
 */
const saveDraft = (conversationId: string, text: string): void => {
  try {
    if (!text.trim()) {
      // Delete draft if empty
      localStorage.removeItem(`${DRAFT_KEY_PREFIX}${conversationId}`);
      return;
    }

    const draft: DraftData = {
      text,
      timestamp: Date.now(),
    };

    localStorage.setItem(
      `${DRAFT_KEY_PREFIX}${conversationId}`,
      JSON.stringify(draft)
    );
  } catch (error) {
    // Handle localStorage quota exceeded or other errors
    console.warn('Failed to save draft to localStorage:', error);
  }
};

/**
 * Retrieve a draft message from localStorage
 *
 * @param conversationId - The conversation ID to retrieve the draft for
 * @returns The draft text if found and not expired, null otherwise
 */
const getDraft = (conversationId: string): string | null => {
  try {
    const item = localStorage.getItem(`${DRAFT_KEY_PREFIX}${conversationId}`);
    if (!item) return null;

    const draft: DraftData = JSON.parse(item);
    const age = Date.now() - draft.timestamp;
    const maxAge = DRAFT_EXPIRY_HOURS * 60 * 60 * 1000;

    if (age > maxAge) {
      // Draft expired, delete it
      localStorage.removeItem(`${DRAFT_KEY_PREFIX}${conversationId}`);
      return null;
    }

    return draft.text;
  } catch (error) {
    console.error('Failed to parse draft from localStorage:', error);
    return null;
  }
};

/**
 * Remove a specific draft from localStorage
 *
 * @param conversationId - The conversation ID to clear the draft for
 */
const clearDraft = (conversationId: string): void => {
  try {
    localStorage.removeItem(`${DRAFT_KEY_PREFIX}${conversationId}`);
  } catch (error) {
    console.warn('Failed to clear draft from localStorage:', error);
  }
};

/**
 * Remove all drafts from localStorage
 * Useful for cleanup or testing purposes
 */
const clearAllDrafts = (): void => {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith(DRAFT_KEY_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.warn('Failed to clear all drafts from localStorage:', error);
  }
};

export const draftStorage = {
  saveDraft,
  getDraft,
  clearDraft,
  clearAllDrafts,
};

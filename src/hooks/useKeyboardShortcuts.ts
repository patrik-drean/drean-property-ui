import { useEffect, useCallback } from 'react';

interface ShortcutHandlers {
  onNext: () => void;
  onPrev: () => void;
  onEnter: () => void;
  onTemplate: () => void;
  onDone?: () => void;
  onArchive?: () => void;
  onFollowUp?: () => void;
}

/**
 * Hook to handle keyboard shortcuts for the Review Page
 *
 * Shortcuts:
 * - w: Navigate to next card
 * - q: Navigate to previous card
 * - Enter: Open detail panel for selected card
 * - t: Send template message
 * - d: Mark as done
 * - a: Archive lead
 * - f: Schedule follow-up for 2 days & mark done
 *
 * Note: Shortcuts are disabled when focus is on input/textarea elements
 */
export const useKeyboardShortcuts = (handlers: ShortcutHandlers, enabled: boolean = true) => {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // Don't trigger if modifier keys are pressed (except for some specific cases)
      if (e.metaKey || e.ctrlKey || e.altKey) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'w':
          e.preventDefault();
          handlers.onNext();
          break;
        case 'q':
          e.preventDefault();
          handlers.onPrev();
          break;
        case 'enter':
          e.preventDefault();
          handlers.onEnter();
          break;
        case 't':
          e.preventDefault();
          handlers.onTemplate();
          break;
        case 'd':
          e.preventDefault();
          handlers.onDone?.();
          break;
        case 'a':
          e.preventDefault();
          handlers.onArchive?.();
          break;
        case 'f':
          e.preventDefault();
          handlers.onFollowUp?.();
          break;
      }
    },
    [handlers]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown, enabled]);
};

export default useKeyboardShortcuts;

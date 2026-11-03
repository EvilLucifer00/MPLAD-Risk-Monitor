import { useEffect, useRef } from 'react';

/**
 * Custom hook to enforce WCAG 2.1 Criteria 2.1.2 (No Keyboard Trap)
 * and WCAG 2.4.3 (Focus Order) on accessible dialogs, drawers, and popovers:
 * 1. Closes the dialog when pressing the 'Escape' key.
 * 2. Traps focus within the dialog container when pressing 'Tab' or 'Shift + Tab'.
 * 3. Restores focus to the triggering element when the dialog closes.
 *
 * @param {boolean} isOpen - Whether the dialog/drawer is currently open
 * @param {Function} onClose - Callback invoked when the user dismisses the dialog via Escape
 * @param {Object} [options]
 * @param {boolean} [options.trapFocus=true] - Whether to cycle keyboard focus inside container
 * @param {boolean} [options.restoreFocus=true] - Whether to return focus on close
 * @returns {React.RefObject} containerRef - Attach this ref to the dialog/drawer container element
 */
export function useDialogA11y(isOpen, onClose, options = {}) {
  const { trapFocus = true, restoreFocus = true } = options;
  const containerRef = useRef(null);
  const previouslyFocusedElementRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    if (restoreFocus) {
      previouslyFocusedElementRef.current = document.activeElement;
    }

    const container = containerRef.current;
    if (!container) return;

    const focusableSelectors = [
      'button:not([disabled])',
      '[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ');

    const focusables = Array.from(container.querySelectorAll(focusableSelectors));
    if (focusables.length > 0) {
      const timeoutId = setTimeout(() => {
        focusables[0]?.focus();
      }, 50);
      return () => clearTimeout(timeoutId);
    }
  }, [isOpen, restoreFocus]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      // 1. Escape key dismissal
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose?.();
        return;
      }

      // 2. Tab key focus trapping
      if (trapFocus && e.key === 'Tab') {
        const container = containerRef.current;
        if (!container) return;

        const focusableSelectors = [
          'button:not([disabled])',
          '[href]',
          'input:not([disabled])',
          'select:not([disabled])',
          'textarea:not([disabled])',
          '[tabindex]:not([tabindex="-1"])',
        ].join(', ');

        const focusables = Array.from(container.querySelectorAll(focusableSelectors));
        if (focusables.length === 0) {
          e.preventDefault();
          return;
        }

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first || !container.contains(document.activeElement)) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last || !container.contains(document.activeElement)) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (restoreFocus && previouslyFocusedElementRef.current && typeof previouslyFocusedElementRef.current.focus === 'function') {
        previouslyFocusedElementRef.current.focus();
      }
    };
  }, [isOpen, onClose, trapFocus, restoreFocus]);

  return containerRef;
}

export default useDialogA11y;


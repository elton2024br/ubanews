import { useEffect, useRef, useCallback } from 'react';

interface FocusManagementOptions {
  trapFocus?: boolean;
  restoreFocus?: boolean;
  autoFocus?: boolean;
}

export const useFocusManagement = ({
  trapFocus = false,
  restoreFocus = true,
  autoFocus = false,
}: FocusManagementOptions = {}) => {
  const containerRef = useRef<HTMLElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Get all focusable elements within a container
  const getFocusableElements = useCallback((container: HTMLElement) => {
    const focusableSelectors = [
      'button:not([disabled])',
      '[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]',
    ].join(', ');

    return Array.from(
      container.querySelectorAll<HTMLElement>(focusableSelectors)
    ).filter((element) => {
      // Check if element is visible and not hidden
      const style = window.getComputedStyle(element);
      return (
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        element.offsetWidth > 0 &&
        element.offsetHeight > 0
      );
    });
  }, []);

  // Focus trap implementation
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!trapFocus || !containerRef.current || event.key !== 'Tab') {
        return;
      }

      const focusableElements = getFocusableElements(containerRef.current);
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey) {
        // Shift + Tab: moving backwards
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab: moving forwards
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    },
    [trapFocus, getFocusableElements]
  );

  // Handle Escape key to close modals/dialogs
  const handleEscapeKey = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape' && containerRef.current) {
        // Dispatch custom escape event that components can listen to
        const escapeEvent = new CustomEvent('focusEscape', {
          bubbles: true,
          cancelable: true,
        });
        containerRef.current.dispatchEvent(escapeEvent);
      }
    },
    []
  );

  // Focus the first focusable element
  const focusFirst = useCallback(() => {
    if (!containerRef.current) return;
    
    const focusableElements = getFocusableElements(containerRef.current);
    const firstElement = focusableElements[0];
    firstElement?.focus();
  }, [getFocusableElements]);

  // Focus the last focusable element
  const focusLast = useCallback(() => {
    if (!containerRef.current) return;
    
    const focusableElements = getFocusableElements(containerRef.current);
    const lastElement = focusableElements[focusableElements.length - 1];
    lastElement?.focus();
  }, [getFocusableElements]);

  // Store and restore focus
  const storeFocus = useCallback(() => {
    previousFocusRef.current = document.activeElement as HTMLElement;
  }, []);

  const restorePreviousFocus = useCallback(() => {
    if (restoreFocus && previousFocusRef.current) {
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
  }, [restoreFocus]);

  // Setup focus management
  useEffect(() => {
    if (!containerRef.current) return;

    // Store current focus when component mounts
    if (restoreFocus) {
      storeFocus();
    }

    // Auto focus first element if requested
    if (autoFocus) {
      // Use setTimeout to ensure DOM is ready
      const timeoutId = setTimeout(() => {
        focusFirst();
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [autoFocus, restoreFocus, storeFocus, focusFirst]);

  // Setup keyboard event listeners
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;

    if (trapFocus) {
      document.addEventListener('keydown', handleKeyDown);
    }

    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [trapFocus, handleKeyDown, handleEscapeKey]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (restoreFocus) {
        restorePreviousFocus();
      }
    };
  }, [restoreFocus, restorePreviousFocus]);

  return {
    containerRef,
    focusFirst,
    focusLast,
    storeFocus,
    restorePreviousFocus,
    getFocusableElements: () => 
      containerRef.current ? getFocusableElements(containerRef.current) : [],
  };
};

// Hook for managing focus announcements for screen readers
export const useFocusAnnouncement = () => {
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }, []);

  return { announce };
};

// Hook for managing roving tabindex (useful for lists, grids, etc.)
export const useRovingTabIndex = (itemsLength: number) => {
  const activeIndexRef = useRef(0);
  const itemRefs = useRef<(HTMLElement | null)[]>([]);

  const setActiveIndex = useCallback((index: number) => {
    if (index < 0 || index >= itemsLength) return;
    
    // Remove tabindex from all items
    itemRefs.current.forEach((item) => {
      if (item) {
        item.setAttribute('tabindex', '-1');
      }
    });
    
    // Set tabindex on active item
    const activeItem = itemRefs.current[index];
    if (activeItem) {
      activeItem.setAttribute('tabindex', '0');
      activeItem.focus();
    }
    
    activeIndexRef.current = index;
  }, [itemsLength]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent, currentIndex: number) => {
      let newIndex = currentIndex;
      
      switch (event.key) {
        case 'ArrowDown':
        case 'ArrowRight':
          event.preventDefault();
          newIndex = (currentIndex + 1) % itemsLength;
          break;
        case 'ArrowUp':
        case 'ArrowLeft':
          event.preventDefault();
          newIndex = currentIndex === 0 ? itemsLength - 1 : currentIndex - 1;
          break;
        case 'Home':
          event.preventDefault();
          newIndex = 0;
          break;
        case 'End':
          event.preventDefault();
          newIndex = itemsLength - 1;
          break;
        default:
          return;
      }
      
      setActiveIndex(newIndex);
    },
    [itemsLength, setActiveIndex]
  );

  const getItemProps = useCallback(
    (index: number) => ({
      ref: (el: HTMLElement | null) => {
        itemRefs.current[index] = el;
      },
      tabIndex: index === 0 ? 0 : -1,
      onKeyDown: (event: React.KeyboardEvent) => {
        handleKeyDown(event.nativeEvent, index);
      },
      onFocus: () => {
        setActiveIndex(index);
      },
    }),
    [handleKeyDown, setActiveIndex]
  );

  return {
    getItemProps,
    setActiveIndex,
    activeIndex: activeIndexRef.current,
  };
};
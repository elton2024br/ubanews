/**
 * Accessibility utilities for WCAG AA compliance
 */

// Color contrast calculation utilities
export const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

// Calculate relative luminance according to WCAG guidelines
export const getRelativeLuminance = (r: number, g: number, b: number): number => {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
};

// Calculate contrast ratio between two colors
export const getContrastRatio = (color1: string, color2: string): number => {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) return 0;
  
  const lum1 = getRelativeLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getRelativeLuminance(rgb2.r, rgb2.g, rgb2.b);
  
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  
  return (brightest + 0.05) / (darkest + 0.05);
};

// Check if contrast ratio meets WCAG AA standards
export const meetsWCAGAA = (foreground: string, background: string, isLargeText = false): boolean => {
  const ratio = getContrastRatio(foreground, background);
  return isLargeText ? ratio >= 3 : ratio >= 4.5;
};

// Check if contrast ratio meets WCAG AAA standards
export const meetsWCAGAAA = (foreground: string, background: string, isLargeText = false): boolean => {
  const ratio = getContrastRatio(foreground, background);
  return isLargeText ? ratio >= 4.5 : ratio >= 7;
};

// Get accessible color suggestions
export const getAccessibleColor = (
  baseColor: string,
  backgroundColor: string,
  targetRatio = 4.5
): string => {
  const baseRgb = hexToRgb(baseColor);
  const bgRgb = hexToRgb(backgroundColor);
  
  if (!baseRgb || !bgRgb) return baseColor;
  
  const bgLuminance = getRelativeLuminance(bgRgb.r, bgRgb.g, bgRgb.b);
  
  // Try darkening first
  for (let factor = 0; factor <= 1; factor += 0.05) {
    const adjustedColor = {
      r: Math.round(baseRgb.r * (1 - factor)),
      g: Math.round(baseRgb.g * (1 - factor)),
      b: Math.round(baseRgb.b * (1 - factor)),
    };
    
    const adjustedLuminance = getRelativeLuminance(adjustedColor.r, adjustedColor.g, adjustedColor.b);
    const ratio = (Math.max(adjustedLuminance, bgLuminance) + 0.05) / (Math.min(adjustedLuminance, bgLuminance) + 0.05);
    
    if (ratio >= targetRatio) {
      return `#${adjustedColor.r.toString(16).padStart(2, '0')}${adjustedColor.g.toString(16).padStart(2, '0')}${adjustedColor.b.toString(16).padStart(2, '0')}`;
    }
  }
  
  // If darkening doesn't work, try lightening
  for (let factor = 0; factor <= 1; factor += 0.05) {
    const adjustedColor = {
      r: Math.round(baseRgb.r + (255 - baseRgb.r) * factor),
      g: Math.round(baseRgb.g + (255 - baseRgb.g) * factor),
      b: Math.round(baseRgb.b + (255 - baseRgb.b) * factor),
    };
    
    const adjustedLuminance = getRelativeLuminance(adjustedColor.r, adjustedColor.g, adjustedColor.b);
    const ratio = (Math.max(adjustedLuminance, bgLuminance) + 0.05) / (Math.min(adjustedLuminance, bgLuminance) + 0.05);
    
    if (ratio >= targetRatio) {
      return `#${adjustedColor.r.toString(16).padStart(2, '0')}${adjustedColor.g.toString(16).padStart(2, '0')}${adjustedColor.b.toString(16).padStart(2, '0')}`;
    }
  }
  
  return baseColor; // Return original if no accessible version found
};

// Screen reader utilities
export const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite'): void => {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only absolute -left-[10000px] w-[1px] h-[1px] overflow-hidden';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  // Clean up after announcement
  setTimeout(() => {
    if (document.body.contains(announcement)) {
      document.body.removeChild(announcement);
    }
  }, 1000);
};

// Focus management utilities
export const trapFocus = (container: HTMLElement): (() => void) => {
  const focusableElements = container.querySelectorAll<HTMLElement>(
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), [contenteditable="true"]'
  );
  
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];
  
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;
    
    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    }
  };
  
  container.addEventListener('keydown', handleKeyDown);
  
  // Return cleanup function
  return () => {
    container.removeEventListener('keydown', handleKeyDown);
  };
};

// Keyboard navigation helpers
export const isNavigationKey = (key: string): boolean => {
  return ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown'].includes(key);
};

export const isActionKey = (key: string): boolean => {
  return ['Enter', ' ', 'Escape'].includes(key);
};

// ARIA helpers
export const generateAriaLabel = (context: string, action?: string, state?: string): string => {
  let label = context;
  if (action) label += `, ${action}`;
  if (state) label += `, ${state}`;
  return label;
};

// Reduced motion detection
export const prefersReducedMotion = (): boolean => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// High contrast detection
export const prefersHighContrast = (): boolean => {
  return window.matchMedia('(prefers-contrast: high)').matches;
};

// Font size utilities for accessibility
export const getAccessibleFontSize = (baseSizePx: number, scaleFactor = 1): string => {
  const minSize = Math.max(baseSizePx * scaleFactor, 16); // Minimum 16px for accessibility
  return `${minSize}px`;
};

// Line height utilities for readability
export const getAccessibleLineHeight = (fontSize: number): number => {
  // WCAG recommends line height of at least 1.5 times the font size
  return Math.max(fontSize * 1.5, 24);
};

// Touch target size validation (minimum 44px for mobile)
export const isValidTouchTarget = (element: HTMLElement): boolean => {
  const rect = element.getBoundingClientRect();
  return rect.width >= 44 && rect.height >= 44;
};

// Validate form accessibility
export const validateFormAccessibility = (form: HTMLFormElement): string[] => {
  const issues: string[] = [];
  
  // Check for labels
  const inputs = form.querySelectorAll('input, select, textarea');
  inputs.forEach((input) => {
    const id = input.getAttribute('id');
    const ariaLabel = input.getAttribute('aria-label');
    const ariaLabelledBy = input.getAttribute('aria-labelledby');
    
    if (!id && !ariaLabel && !ariaLabelledBy) {
      issues.push(`Input element missing accessible label: ${input.tagName}`);
    }
    
    if (id) {
      const label = form.querySelector(`label[for="${id}"]`);
      if (!label && !ariaLabel && !ariaLabelledBy) {
        issues.push(`Input with id "${id}" has no associated label`);
      }
    }
  });
  
  // Check for required field indicators
  const requiredInputs = form.querySelectorAll('[required]');
  requiredInputs.forEach((input) => {
    const ariaRequired = input.getAttribute('aria-required');
    if (!ariaRequired) {
      issues.push('Required field missing aria-required attribute');
    }
  });
  
  return issues;
};
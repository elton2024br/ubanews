import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, vi } from 'vitest';

// Cleanup after each test case
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia
beforeAll(() => {
  // Ensure environment mode is set for services relying on import.meta.env.MODE
  vi.stubEnv('MODE', 'test');
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  // Mock ResizeObserver
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  // Mock IntersectionObserver
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  // Mock scrollTo
  window.scrollTo = vi.fn();

  // Mocks for ProseMirror/Tiptap which is used in RichTextEditor
  if (typeof document.createRange === 'undefined') {
    document.createRange = () => ({
      setEnd: () => {},
      setStart: () => {},
      getBoundingClientRect: () => ({
        bottom: 0,
        height: 0,
        left: 0,
        right: 0,
        top: 0,
        width: 0,
        x: 0,
        y: 0,
        toJSON: () => ''
      }),
      getClientRects: () => [],
    });
  }

  // Mocks for Radix UI components that use pointer events
  if (typeof window.HTMLElement.prototype.hasPointerCapture === 'undefined') {
    window.HTMLElement.prototype.hasPointerCapture = () => false;
  }
  if (typeof window.HTMLElement.prototype.releasePointerCapture === 'undefined') {
    window.HTMLElement.prototype.releasePointerCapture = () => {};
  }
  if (typeof window.HTMLElement.prototype.setPointerCapture === 'undefined') {
    window.HTMLElement.prototype.setPointerCapture = () => {};
  }

  if (typeof document.elementFromPoint === 'undefined') {
    document.elementFromPoint = () => null;
  }

  // Mock localStorage
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
  });

  // Mock sessionStorage
  Object.defineProperty(window, 'sessionStorage', {
    value: localStorageMock
  });

  // Mock navigator.vibrate
  Object.defineProperty(navigator, 'vibrate', {
    writable: true,
    value: vi.fn(),
  });

  // Mock for getClientRects
  if (typeof Element.prototype.getClientRects === 'undefined') {
    Element.prototype.getClientRects = function () {
      const rect = this.getBoundingClientRect();
      return [{
        ...rect,
        x: rect.left,
        y: rect.top,
        toJSON: () => JSON.stringify(rect),
      }];
    };
  }

  // Mock for scrollIntoView
  if (typeof window.HTMLElement.prototype.scrollIntoView === 'undefined') {
    window.HTMLElement.prototype.scrollIntoView = function() {};
  }
});

// Polyfill for PointerEvents
if (!global.PointerEvent) {
  class PointerEvent extends MouseEvent {
    public pointerId?: number
    public pointerType?: string
    public isPrimary?: boolean

    constructor(type: string, params: PointerEventInit = {}) {
      super(type, params)
      this.pointerId = params.pointerId
      this.pointerType = params.pointerType
      this.isPrimary = params.isPrimary
    }
  }
  global.PointerEvent = PointerEvent as typeof PointerEvent
}
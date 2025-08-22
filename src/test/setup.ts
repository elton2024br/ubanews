import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, expect, vi } from 'vitest';
import { toHaveNoViolations } from 'vitest-axe';

expect.extend(toHaveNoViolations);

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
});
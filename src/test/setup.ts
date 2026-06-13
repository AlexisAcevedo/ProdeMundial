import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'
import { createSupabaseMock } from './mocks/supabase'

// Register globally to avoid relative require path resolution issues inside vi.mock callbacks
(globalThis as any).createSupabaseMock = createSupabaseMock;

// Mock matchMedia for components that check dark mode or screen width
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
})

import '@testing-library/jest-dom/vitest';

// Stub window.matchMedia — jsdom does not implement it.
// Components that call useMediaQuery or check window.matchMedia directly
// will get a no-op implementation that returns false for all queries.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Stub ResizeObserver — jsdom does not implement it.
// Components that use ResizeObserver (e.g. Tiptap) will get a no-op stub.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: ResizeObserverStub,
});

afterEach(() => vi.clearAllMocks());

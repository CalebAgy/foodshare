import '@testing-library/jest-dom';

// jsdom lacks ResizeObserver, which Radix UI primitives (RadioGroup, etc.) require.
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

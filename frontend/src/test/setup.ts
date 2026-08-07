import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// jsdom doesn't implement ResizeObserver — Recharts' <ResponsiveContainer> needs one to mount
// at all, even though layout/resize behavior itself is irrelevant in a headless test.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = ResizeObserverStub;

afterEach(() => {
  cleanup();
});

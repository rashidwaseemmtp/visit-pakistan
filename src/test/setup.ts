import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

/**
 * Vitest runs with `globals: false` (vite.config.ts), so Testing Library cannot find a
 * global `afterEach` to hang its automatic cleanup on. Registering it here means one test's
 * DOM is never still mounted while the next one queries.
 */
afterEach(() => {
  cleanup();
});

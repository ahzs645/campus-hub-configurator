// Standalone test setup (`npm test` in this repo). Hosts that run these tests
// from their own suite supply equivalent setup.
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
});

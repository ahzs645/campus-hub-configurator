import { defineConfig } from 'vitest/config';

// Tests run with the host's toolchain: from a host checkout (e.g.
// campus-hub-cloud/packages/<this repo>), `npm test` finds the host's vitest,
// React, testing-library and the single shared widget SDK by walking up to the
// host's node_modules. This package deliberately declares none of them, because
// a host installs the dev dependencies of `file:`-linked packages and a second
// SDK copy would split the widget registry.
export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
});

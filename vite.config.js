import { defineConfig } from 'vite';

export default defineConfig({
  // Relative asset paths, so the built site works at https://<user>.github.io/<any-repo-name>/
  // without having to hard-code the repository name here.
  base: './',
  build: {
    outDir: 'dist',
    // three.js is one large module; this only silences the size warning.
    chunkSizeWarningLimit: 900,
  },
});

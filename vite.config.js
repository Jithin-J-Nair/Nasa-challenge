import { defineConfig } from 'vite';

export default defineConfig({
  // GitHub Pages serves the production site below /Nasa-challenge/ while
  // Arena/local previews serve it from /. Runtime public assets use the same
  // Vite base through import.meta.env.BASE_URL.
  base: process.env.VITE_BASE_PATH || '/',
  server: {
    host: '0.0.0.0',
    allowedHosts: true,
  },
  preview: {
    host: '0.0.0.0',
    allowedHosts: true,
  },
});

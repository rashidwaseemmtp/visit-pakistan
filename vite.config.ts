import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

/**
 * connect-src 'none' and form-action 'none' make "no backend, no keyed API" a
 * browser-enforced property. frame-ancestors is omitted: it cannot be delivered
 * by a meta tag and GitHub Pages does not allow response headers.
 */
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'none'",
  "form-action 'none'",
  "base-uri 'none'",
  "object-src 'none'",
].join('; ');

function contentSecurityPolicyPlugin(): Plugin {
  return {
    name: 'visit-pakistan:content-security-policy',
    apply: 'build',
    transformIndexHtml: {
      order: 'pre',
      handler: (html) => ({
        html,
        tags: [
          {
            tag: 'meta',
            attrs: { 'http-equiv': 'Content-Security-Policy', content: CONTENT_SECURITY_POLICY },
            injectTo: 'head-prepend',
          },
        ],
      }),
    },
  };
}

export default defineConfig({
  // '/' locally, '/visit-pakistan/' for the GitHub Pages deploy.
  base: process.env.VITE_BASE_PATH ?? '/',
  plugins: [react(), contentSecurityPolicyPlugin()],
  build: { outDir: 'dist', sourcemap: false },
  preview: { port: 4173, strictPort: true },
  test: {
    environment: 'jsdom',
    globals: false,
    css: false,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
});

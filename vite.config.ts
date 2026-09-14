import { copyFileSync } from 'node:fs';
import { resolve } from 'node:path';
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

/**
 * GitHub Pages answers every unmatched address under the sub-path with 404.html.
 * Publishing a copy of index.html there means the application boots on the address
 * the visitor actually asked for: the router renders the requested route, or the
 * site's own not-found page, with no redirect shim and no rewriting of the URL.
 * The response status stays 404, which GitHub Pages does not let us change.
 */
function notFoundFallbackPlugin(): Plugin {
  let outDir = 'dist';

  return {
    name: 'visit-pakistan:not-found-fallback',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      copyFileSync(resolve(outDir, 'index.html'), resolve(outDir, '404.html'));
    },
  };
}

export default defineConfig({
  // '/' locally, '/visit-pakistan/' for the GitHub Pages deploy.
  base: process.env.VITE_BASE_PATH ?? '/',
  plugins: [react(), contentSecurityPolicyPlugin(), notFoundFallbackPlugin()],
  build: { outDir: 'dist', sourcemap: false },
  preview: { port: 4173, strictPort: true },
  test: {
    environment: 'jsdom',
    globals: false,
    css: false,
    setupFiles: ['./src/test/setup.ts'],
    // Application tests sit next to the code; scripts/ holds the suites that cover
    // repository configuration (the raw-HTML lint ban, workflow action pinning).
    include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.ts'],
  },
});

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from "@tailwindcss/vite";

function nonRenderBlockingCssPlugin() {
  return {
    name: 'non-render-blocking-css',
    apply: 'build',
    enforce: 'post',
    transformIndexHtml(html) {
      return html.replace(
        /<link rel="stylesheet" crossorigin href="(\/assets\/index-[^"]+\.css)">/g,
        '<link rel="preload" as="style" href="$1">\n    <link rel="stylesheet" href="$1" media="print" onload="this.media=\'all\'">\n    <noscript><link rel="stylesheet" href="$1"></noscript>'
      );
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), nonRenderBlockingCssPlugin()],
  server: {
    headers: {
      'Link': '</.well-known/ai-catalog.json>; rel="ai-catalog", </.well-known/ard.json>; rel="ard"',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  },
  preview: {
    headers: {
      'Link': '</.well-known/ai-catalog.json>; rel="ai-catalog", </.well-known/ard.json>; rel="ard"',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            const normalized = id.replace(/\\/g, '/');
            if (
              normalized.includes('/react/') ||
              normalized.includes('/react-dom/') ||
              normalized.includes('/scheduler/') ||
              normalized.includes('/react-is/')
            ) {
              return 'vendor-react';
            }
            if (normalized.includes('react-router') || normalized.includes('@remix-run')) {
              return 'vendor-router';
            }
            if (normalized.includes('zustand')) {
              return 'vendor-state';
            }
          }
        }
      }
    }
  }
});


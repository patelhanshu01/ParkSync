import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VENDOR_GROUPS: Array<[string, string[]]> = [
  ['react', ['react', 'react-dom']],
  ['router', ['react-router', 'react-router-dom']],
  ['mui', ['@mui', '@emotion']],
  ['maps', ['@react-google-maps']],
  ['three', ['three', '@react-three']],
  ['stripe', ['@stripe']],
  ['auth', ['@react-oauth']],
  ['data', ['axios', 'react-query']],
  ['ui', ['swiper', 'qrcode.react']]
];

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 3001,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          for (const [chunkName, packages] of VENDOR_GROUPS) {
            for (const pkg of packages) {
              if (id.includes(`/node_modules/${pkg}/`) || id.includes(`/node_modules/${pkg}`)) {
                return chunkName;
              }
            }
          }
        }
      }
    }
  }
});

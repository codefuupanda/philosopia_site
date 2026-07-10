import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Mirror the "@/*" -> "src/*" alias from jsconfig.json (kept for editor intellisense)
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
    // Guard against duplicate React copies from nested dep trees (cmdk ships
    // its own radix-dialog; two React instances break hooks at runtime).
    dedupe: ['react', 'react-dom'],
  },
  server: {
    port: 3000, // match the CRA-era workflow and docs
  },
});

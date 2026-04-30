/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import fs from 'fs';

// Legge la versione da package.json con controllo errori
let appVersion = '0.0.0';
try {
  const packageJsonPath = path.resolve(__dirname, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    if (packageJson.version && typeof packageJson.version === 'string') {
      appVersion = packageJson.version;
    } else {
      console.warn('[vite.config.ts] package.json non contiene una versione valida, uso default:', appVersion);
    }
  } else {
    console.warn('[vite.config.ts] package.json non trovato, uso default:', appVersion);
  }
} catch (err) {
  console.error('[vite.config.ts] Errore lettura package.json:', err);
}

console.log('[vite.config.ts] App version:', appVersion);

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/test/**', 'src/**/*.d.ts'],
    },
  },
});
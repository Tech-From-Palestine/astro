import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: مسار الموقع على GitHub Pages (مثل /astro/). يُضبط تلقائياً من GitHub Actions عبر VITE_BASE
export default defineConfig({
  base: process.env.VITE_BASE || '/',
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { '/api': 'http://localhost:5000' },
  },
});

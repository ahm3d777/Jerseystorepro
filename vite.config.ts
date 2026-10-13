import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
    // Ignore Visual Studio (.vs) and Wrangler (.wrangler) locked files on Windows to prevent EBUSY watcher crashes.
    watch: {
      ignored: ['**/.vs/**', '**/.wrangler/**', '**/dist/**', '**/.git/**'],
    },
    // `npm run dev` runs the Worker (API + D1) on 8787 alongside Vite.
    proxy: { '/api': { target: 'http://localhost:8787', changeOrigin: false } },
  },
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, '.') } },
  build: {
    rollupOptions: {
      output: { manualChunks: { react: ['react', 'react-dom'] } },
    },
  },
});

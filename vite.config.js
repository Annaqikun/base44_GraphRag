import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // map @ to project root so imports like '@/components/...' and '@/lib/...' resolve
      '@': path.resolve(__dirname, './'),
    },
  },
});

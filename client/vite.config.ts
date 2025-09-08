import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@snake-game/shared': path.resolve(__dirname, '../shared/src'),
    },
  },
  server: {
    port: 3000,
    host: '0.0.0.0',  // 모든 네트워크 인터페이스에서 접속 허용
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        ws: true,
        secure: false,
      },
    },
  },
});
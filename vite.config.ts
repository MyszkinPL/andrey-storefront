import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    // Песочница проксирует dev-сервер через внешний preview-хост — без этого Vite отвечает 403.
    allowedHosts: true,
  },
});

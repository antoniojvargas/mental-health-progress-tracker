import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Outside Docker the backend is reachable at localhost:3000. Inside the Compose
// network it must be reached by service name, since each container has its own
// "localhost". docker-compose.yml overrides this via VITE_PROXY_TARGET.
const proxyTarget = process.env.VITE_PROXY_TARGET ?? 'http://localhost:3000';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: proxyTarget,
        changeOrigin: true,
      },
      '/socket.io': {
        target: proxyTarget,
        ws: true,
      },
    },
  },
});

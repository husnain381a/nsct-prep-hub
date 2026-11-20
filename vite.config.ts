import { defineConfig, type Connect } from 'vite';
import react from '@vitejs/plugin-react';

const appRoute = /^\/(?:login|register|dashboard|create-quiz|(?:quiz|results|review)\/[^/]+)\/?$/;

const serveApp: Connect.NextHandleFunction = (request, _response, next) => {
  const path = request.url?.split('?')[0];
  if (path && appRoute.test(path)) request.url = '/app.html';
  next();
};

export default defineConfig({
  appType: 'mpa',
  plugins: [
    react(),
    {
      name: 'serve-practice-app',
      configureServer(server) {
        server.middlewares.use(serveApp);
      },
      configurePreviewServer(server) {
        server.middlewares.use(serveApp);
      },
    },
  ],
  build: {
    rollupOptions: {
      input: ['index.html', 'app.html'],
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});

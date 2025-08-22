import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(async () => {
  const plugins = [react()];

  if (process.env.ANALYZE) {
    try {
      const { default: analyze } = await import('vite-bundle-analyzer');
      plugins.push(analyze());
    } catch (e) {
      console.warn('vite-bundle-analyzer not installed');
    }
  }

  return {
    plugins,
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5173,
      host: true,
    },
  };
});


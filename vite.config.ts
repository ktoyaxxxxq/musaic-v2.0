import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      // Musaic v2.4: libraries go to separate cached chunks, so the app loads faster after updates
      build: {
        target: 'es2020',
        chunkSizeWarningLimit: 2500,
        rollupOptions: {
          output: {
            manualChunks(id) {
              if (!id.includes('node_modules')) return;
              if (id.includes('react-dom') || id.includes('/react/') || id.includes('scheduler')) return 'react';
              if (id.includes('motion') || id.includes('framer')) return 'motion';
              if (id.includes('lucide')) return 'icons';
              if (id.includes('@google')) return 'genai';
              return 'vendor';
            }
          }
        }
      }
    };
});

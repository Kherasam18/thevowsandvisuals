import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { createApi } from './server/api.js';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

/*
  Mounts the admin API inside the dev server, so `npm run dev` brings up the
  site, the admin and the media store together on one origin — no second
  process, no proxy, and no CORS to configure.

  In production these separate: the public site is static, and the API becomes
  a Cloudflare Worker reading and writing R2. server/api.js is deliberately
  framework-free so that move is a change of host, not a rewrite.
*/
function adminApi() {
  return {
    name: 'vows-admin-api',
    configureServer(server) {
      const handle = createApi({
        dataDir: path.join(projectRoot, '.data'),
        projectRoot,
        log: (...args) => server.config.logger.info(args.join(' ')),
      });

      server.middlewares.use((req, res, next) => {
        handle(req, res).then(
          (handled) => {
            if (!handled) next();
          },
          (err) => next(err),
        );
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), adminApi()],
  server: {
    // Honour a PORT supplied by the environment; fall back to Vite's default.
    port: process.env.PORT ? Number(process.env.PORT) : 5173,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // The admin is only ever opened by the studio; keeping it out of the
          // public bundle means visitors never download it.
          if (id.includes('/src/admin/')) return 'admin';
          return undefined;
        },
      },
    },
  },
});

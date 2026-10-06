import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

/*
  Mounts the admin API inside the dev server, so `npm run dev` brings up the
  site, the admin and the media store together on one origin — no second
  process, no proxy, and no CORS to configure.

  In production these separate: the public site is static, and the API becomes
  a Cloudflare Worker reading and writing R2. server/api.js is deliberately
  framework-free so that move is a change of host, not a rewrite.
*/
function adminApi(env) {
  return {
    name: 'vows-admin-api',
    // Dev only. `vite build` produces static files and has no business loading
    // the server, which drags in sharp and the S3 client — a build host that
    // cannot compile sharp would otherwise fail on a bundle that never uses it.
    apply: 'serve',
    async configureServer(server) {
      /*
        Loaded by URL rather than by literal path on purpose. Vite pre-bundles
        this config with esbuild, which follows a literal `import('./x.js')` and
        pulls sharp and the S3 client into the bundle — so `vite build` would
        fail on a host that has neither, even though the build never runs them.
        A URL computed at runtime cannot be resolved statically, so they stay out.
      */
      const load = (file) => import(new URL(`./server/${file}`, import.meta.url).href);
      const [{ createApi }, { createStorageFromEnv }] = await Promise.all([
        load('api.js'),
        load('storage.js'),
      ]);

      const dataDir = path.join(projectRoot, '.data');
      const { storage, kind, detail } = createStorageFromEnv(env, { dataDir });
      server.config.logger.info(
        `  ➜  Storage: ${kind === 'r2' ? `R2 bucket "${detail}"` : 'local .data folder'}`,
      );

      const handle = createApi({
        dataDir,
        projectRoot,
        storage,
        log: (...args) => server.config.logger.info(args.join(' ')),
        auth: {
          adminEmail: env.ADMIN_EMAIL,
          adminPasswordHash: env.ADMIN_PASSWORD_HASH,
          sessionSecret: env.ADMIN_SESSION_SECRET,
          secureCookies: false, // plain http on localhost
        },
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

export default defineConfig(({ mode }) => ({
  // The third argument loads every variable, not just the VITE_ ones — the
  // admin credentials are server-side and must never reach the browser bundle.
  plugins: [react(), tailwindcss(), adminApi(loadEnv(mode, projectRoot, ''))],
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
}));

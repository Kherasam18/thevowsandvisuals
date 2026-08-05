import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Honour a PORT supplied by the environment; fall back to Vite's default.
    port: process.env.PORT ? Number(process.env.PORT) : 5173,
  },
});

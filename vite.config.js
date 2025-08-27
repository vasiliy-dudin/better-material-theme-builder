import { defineConfig } from 'vite';

export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '' : '/',
  root: './src',
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: './src/index.html'
      }
    }
  },
  resolve: {
    alias: {
      '@materialx/material-color-utilities': '@materialx/material-color-utilities'
    }
  }
});
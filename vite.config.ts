const react = require('@vitejs/plugin-react').default;
const { defineConfig } = require('vitest/config');

module.exports = defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
  test: {
    coverage: {
      reporter: ['text', 'html'],
    },
  },
});

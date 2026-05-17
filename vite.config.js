import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  // Корневая директория для Vite
  root: './client',

  // Настройка dev-сервера
  server: {
    port: 5173,
    host: true, // Слушать на 0.0.0.0 для Docker
    open: false, // Не открывать браузер в Docker

    // В Docker/Windows file-system events могут не доходить до Vite.
    // Polling делает hot reload (включая CSS) стабильным.
    watch: {
      usePolling: true,
      interval: 150
    },

    // Явно фиксируем порт клиента HMR, чтобы не было проблем с пробросом портов в Docker.
    hmr: {
      clientPort: 5173
    },

    // Проксирование API запросов на Express сервер
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      },
      '/assets': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  },

  // Настройка сборки
  build: {
    outDir: '../dist',
    emptyOutDir: true,

    // Multi-page приложение
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'client/index.html'),
        car: resolve(__dirname, 'client/car.html'),
        admin: resolve(__dirname, 'client/admin.html')
      }
    }
  },

  // Резолв путей
  resolve: {
    alias: {
      '@': resolve(__dirname, 'client')
    }
  }
});

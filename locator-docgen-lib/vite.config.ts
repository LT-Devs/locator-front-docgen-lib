import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import dts from 'vite-plugin-dts'

// https://vite.dev/config/
export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'LocatorDocgenLib',
      fileName: (format) => `locator-docgen-lib.${format}.js`
    },
    rollupOptions: {
      // Внешние зависимости, которые не нужно включать в пакет
      external: ['vue', 'axios', 'lodash'],
      output: {
        // Предоставляем глобальные переменные для внешних зависимостей
        globals: {
          vue: 'Vue',
          axios: 'axios',
          lodash: '_'
        },
        // Сохраняем CSS в отдельном файле
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'style.css') return 'style.css';
          return assetInfo.name || ''; // Исправлено для соответствия типам
        },
        exports: 'named'
      }
    }
  },
  plugins: [
    vue(),
    dts({
      include: ['src/**/*.ts', 'src/**/*.vue'],
      outDir: 'dist',
      staticImport: true,
      insertTypesEntry: true
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})

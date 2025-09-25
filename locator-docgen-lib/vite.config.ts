import { defineConfig, loadEnv } from 'vite'
import { fileURLToPath } from 'node:url'
import autoprefixer from 'autoprefixer'
import tailwind from 'tailwindcss'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    build: {
      lib: {
        entry: 'src/index.ts',
        name: 'locator-docgen-lib',
        formats: ['es', 'umd'],
        fileName: (format) => `locator-docgen-lib.${format}.js`
      },
      rollupOptions: {
        external: ['vue'],
        output: {
          globals: {
            vue: 'Vue'
          }
        }
      }
    },
    base: '/',
    css: {
      postcss: {
        plugins: [tailwind(), autoprefixer()],
      },
    },
    plugins: [vue()],
    define: {
      __APP_VERSION__: JSON.stringify(env.VITE_APP_VERSION || '0.0.0'),
      'process.env.VITE_BACKEND_URL': JSON.stringify(process.env.VITE_BACKEND_URL),
      'process.env.VITE_FILE_BACKEND_URL': JSON.stringify(process.env.VITE_FILE_BACKEND_URL)
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        'locator-ars-lib': env.VITE_MOCK_PERMISSIONS === 'true'
          ? fileURLToPath(new URL('./src/src/mocks/permissions-mock.ts', import.meta.url))
          : 'locator-ars-lib',
      }
    },
    server: {
      host: '0.0.0.0',
      port: 80,
      allowedHosts: ['moshkatest.locator.local']
    }
  }
})
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_VERSION: string
  // другие переменные окружения...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
} 
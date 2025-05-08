// src/config.js
import { inject, provide, ref } from 'vue';
import type { App, InjectionKey } from 'vue';

// Конфигурация с настройками по умолчанию
export interface DocgenConfig {
    backendUrl: string;
    staffUrl: string;
    inquiryUrl: string;
    fileHandlerBackendUrl: string;
    generateDocumentPath: string;
    uiComponents?: Record<string, any>; // Добавляем поддержку пользовательских компонентов
}

// Дефолтная конфигурация
export const defaultConfig: DocgenConfig = {
    backendUrl: '',
    staffUrl: '',
    inquiryUrl: '',
    fileHandlerBackendUrl: '',
    generateDocumentPath: '',
    uiComponents: {} // По умолчанию используем встроенные компоненты
};

const configSymbol: InjectionKey<DocgenConfig> = Symbol();

// Создаем ссылку на конфигурацию
const configRef = ref<DocgenConfig>({ ...defaultConfig });

// Функция для установки конфигурации
export function setConfig(config: Partial<DocgenConfig>) {
    Object.assign(configRef.value, config);
}

// Функция для получения конфигурации
export function getConfig(): DocgenConfig {
    return configRef.value;
}

// Провайдер для Vue компонентов
export function provideConfig(_app: App) {
    provide(configSymbol, configRef.value);
}

// Функция для получения конфигурации в компонентах
export function useConfig() {
    const config = inject(configSymbol, configRef.value);
    return config;
}

export const config = configRef.value;


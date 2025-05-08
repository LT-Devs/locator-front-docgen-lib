// Экспорты компонентов
import DocumentDialog from '@/components/DocumentDialog.vue';

// Экспорты API
import { documentApi } from './api/documentApi';

// Экспорты типов
import type { DocumentData } from './types/document_data';
import type { DocumentGenerationRequest, EnhancedDocumentData } from './api/documentApi';

// Экспорты настроек
import { setConfig, getConfig, defaultConfig, provideConfig, useConfig, type DocgenConfig } from './config';

// Функция установки
function install(app: any, options: Partial<DocgenConfig> = {}) {
    // Устанавливаем конфигурацию
    setConfig(options);

    // Предоставляем конфигурацию через провайдер
    provideConfig(app);

    // Регистрируем компоненты
    app.component('DocumentDialog', DocumentDialog);
}

// Именованные экспорты
export {
    DocumentDialog,
    documentApi,
    setConfig,
    getConfig,
    defaultConfig,
    provideConfig,
    useConfig,
    install
};

// Типы
export type {
    DocumentData,
    DocgenConfig,
    DocumentGenerationRequest,
    EnhancedDocumentData
};

// Экспорт по умолчанию (функции установки) для Vue plugins API
export default { install }; 
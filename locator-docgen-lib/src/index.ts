// Экспорты компонентов
import DocumentDialog from '@/components/DocumentDialog.vue';
import DocumentSetDialog from '@/components/DocumentSetDialog.vue';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

// Экспорты API
import { documentApi } from './api/documentApi';

// Экспорты типов
import type { DocumentData } from './types/document_data';
import type { DocumentGenerationRequest, EnhancedDocumentData, DocumentSetGenerationRequest } from './api/documentApi';

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
    app.component('DocumentSetDialog', DocumentSetDialog);
    app.component('LoadingSpinner', LoadingSpinner);
}

// Именованные экспорты
export {
    DocumentDialog,
    DocumentSetDialog,
    LoadingSpinner,
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
    EnhancedDocumentData,
    DocumentSetGenerationRequest
};

// Экспорт по умолчанию (функции установки) для Vue plugins API
export default { install }; 
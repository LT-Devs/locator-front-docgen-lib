// Экспорты компонентов
import DocumentDialog from '@/components/DocumentDialog.vue';
import DocumentSetDialog from '@/components/DocumentSetDialog.vue';
import UnifiedDocumentDialog from '@/components/UnifiedDocumentDialog.vue';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

// Экспорты UI компонентов
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';

// Экспорты API
import { documentApi } from './api/documentApi';

// Экспорты типов
import type { DocumentData } from './types/document_data';
import type { DocumentGenerationRequest, EnhancedDocumentData, DocumentSetGenerationRequest } from './api/documentApi';
import type { 
  ApiEndpoint, 
  FieldCondition, 
  ConditionGroup, 
  AdditionalField, 
  SelectOption,
  DocumentTemplate, 
  UnifiedDialogOptions 
} from './components/UnifiedDocumentDialog.vue';

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
    app.component('UnifiedDocumentDialog', UnifiedDocumentDialog);
    app.component('LoadingSpinner', LoadingSpinner);
}

// Именованные экспорты
export {
    DocumentDialog,
    DocumentSetDialog,
    UnifiedDocumentDialog,
    LoadingSpinner,
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
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
    DocumentSetGenerationRequest,
    ApiEndpoint,
    FieldCondition,
    ConditionGroup,
    AdditionalField,
    SelectOption,
    DocumentTemplate,
    UnifiedDialogOptions
};

// Accordion типы (из reka-ui)
export type {
    AccordionRootProps,
    AccordionRootEmits,
    AccordionItemProps,
    AccordionTriggerProps,
    AccordionContentProps
} from 'reka-ui';

// Экспорт по умолчанию (функции установки) для Vue plugins API
export default { install };

// Документация по использованию accordion компонентов
export const ACCORDION_USAGE = `
## Использование Accordion компонентов

### Базовое использование:
\`\`\`vue
<template>
  <Accordion type="single" collapsible>
    <AccordionItem value="item-1">
      <AccordionTrigger>Заголовок секции</AccordionTrigger>
      <AccordionContent>
        Содержимое секции
      </AccordionContent>
    </AccordionItem>
  </Accordion>
</template>

<script setup>
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from 'locator-docgen-lib'
</script>
\`\`\`

### Множественный выбор:
\`\`\`vue
<Accordion type="multiple">
  <AccordionItem value="item-1">
    <AccordionTrigger>Первая секция</AccordionTrigger>
    <AccordionContent>Содержимое первой секции</AccordionContent>
  </AccordionItem>
  <AccordionItem value="item-2">
    <AccordionTrigger>Вторая секция</AccordionTrigger>
    <AccordionContent>Содержимое второй секции</AccordionContent>
  </AccordionItem>
</Accordion>
\`\`\`

### С пользовательскими стилями:
\`\`\`vue
<AccordionItem value="styled-item" class="border-2 border-blue-200">
  <AccordionTrigger class="hover:bg-blue-50">
    Стилизованный заголовок
  </AccordionTrigger>
  <AccordionContent class="bg-gray-50">
    Стилизованное содержимое
  </AccordionContent>
</AccordionItem>
\`\`\`
`;
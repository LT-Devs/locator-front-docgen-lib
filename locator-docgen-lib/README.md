# Locator Document Generation Library

Библиотека для генерации документов из шаблонов для Vue 3 приложений.

## Описание

`locator-docgen-lib` - библиотека, которая предоставляет компоненты и функции для генерации документов на основе шаблонов в формате DOCX.

## Установка

```bash
npm install locator-docgen-lib
```

или

```bash
yarn add locator-docgen-lib
```

## Быстрый старт

Минимальная настройка для быстрого запуска:

В main.ts вставьте:

```typescript
import { createApp } from "vue";
import App from "./App.vue";
import { setConfig, DocumentDialog, install } from "locator-docgen-lib";
import "locator-docgen-lib/dist/locator-docgen-lib.css";

const app = createApp(App);

// Базовая настройка, укажите url до service files handler, export endpoint
app.use(install, {
  fileHandlerBackendUrl: "https://files.example.com",
  generateDocumentPath: "/generate-document/",
});

app.mount("#app");
```

Использование компонента DocumentDialog:

```vue
<template>
  <div>
    <button @click="showDialog = true">Генерировать документ</button>

    <DocumentDialog
      class="w-1/2"
      v-model:isOpen="showDialog"
      :document="documentData"
      :templates="documentTemplates"
      @success="handleSuccess"
      @error="handleError"
    />
  </div>
</template>

<script setup>
import { ref } from "vue";
import { DocumentDialog } from "locator-docgen-lib";

const showDialog = ref(false);
const documentData = ref({
  ref_id: "DOC-2023-001",
  // Любые другие данные документа
});

// Пример шаблонов документов
const documentTemplates = ref([
  {
    id: "notification_template",
    name: "Уведомление",
    description: "Стандартное уведомление",
    additional_fields: [], // Пустой массив для примера без доп. полей
  },
]);

function handleSuccess(message) {
  console.log(message);
}

function handleError(message) {
  console.error("Ошибка:", message);
}
</script>
```

## Базовое использование

### Настройка через плагин или вручную

```typescript
// Вариант 1: Использование плагина
app.use(install, {
  fileHandlerBackendUrl: "https://files.example.com",
  generateDocumentPath: "/generate-document/",
});

// Вариант 2: Ручная настройка
setConfig({
  fileHandlerBackendUrl: "https://files.example.com",
  generateDocumentPath: "/generate-document/",
});
app.component("DocumentDialog", DocumentDialog);
```

### Использование только API

```typescript
import { documentApi } from "locator-docgen-lib";

// Создание экземпляра API с обработчиками
const { generateDocument } = documentApi({
  filename: "",
  onSuccess: (message) => console.log(message),
  onError: (message) => console.error(message),
});

// Генерация документа
async function generateSampleDocument() {
  const data = {
    ref_id: "DOC-2023-001",
    // Другие данные документа
  };

  await generateDocument(data, "notification_template");
}
```

## Расширенные возможности

### Шаблоны с дополнительными полями

```typescript
const documentTemplates = ref([
  {
    id: "notification_template",
    name: "Уведомление",
    description: "Стандартное уведомление",
    additional_fields: [
      {
        id: "recipient_name",
        name: "ФИО получателя",
        type: "string",
        description: "Укажите ФИО получателя уведомления",
        required: true,
        defaultValue: null,
      },
      {
        id: "notification_date",
        name: "Дата уведомления",
        type: "date",
        description: "Укажите дату уведомления",
        required: true,
        defaultValue: null,
      },
    ],
  },
]);
```

### Настройка размера диалога

По умолчанию диалог занимает 4/6 ширины экрана. Для изменения ширины используйте CSS-класс:

```vue
<DocumentDialog
  class="w-1/2" <!-- Ширина 50% -->
  v-model:isOpen="isDocumentDialogOpen"
  :document="selectedDocument"
  :templates="documentTemplates"
/>
```

## Интеграция с UI-библиотеками

### Использование с Shadcn/Vue

Библиотека поддерживает интеграцию с компонентами Shadcn/Vue для обеспечения единого стиля приложения.

```typescript
// main.ts
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
// Импортируем компоненты Dialog для анимации и затемнения
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

// При использовании библиотеки передайте ваши UI-компоненты
app.use(install, {
  fileHandlerBackendUrl: "https://files.example.com",
  generateDocumentPath: "/generate-document/",
  uiComponents: {
    Card,
    CardContent,
    CardHeader,
    CardFooter,
    CardTitle,
    CardDescription,
    Button,
    Input,
    Label,
    Checkbox,
    Dialog,
    DialogContent,
    DialogHeader,
    DialogFooter,
    DialogTitle,
    DialogDescription,
  },
});
```

### Accordion компоненты (shadcn/vue)

Библиотека включает полнофункциональные компоненты аккордеона на базе shadcn/vue (reka-ui).

```vue
<template>
  <div>
    <Accordion type="single" collapsible>
      <AccordionItem value="section-1">
        <AccordionTrigger>
          Заголовок секции
        </AccordionTrigger>
        <AccordionContent>
          Содержимое секции с любыми компонентами
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  </div>
</template>

<script setup>
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from 'locator-docgen-lib'
</script>
```

#### Типы аккордеона

- `type="single"` - только одна секция может быть открыта одновременно
- `type="multiple"` - несколько секций могут быть открыты одновременно
- `collapsible` - позволяет закрыть все секции (только для `type="single"`)

#### Пример с кастомными стилями

```vue
<Accordion type="multiple" class="space-y-4">
  <AccordionItem value="custom-section" class="border-2 border-blue-200 rounded-lg">
    <AccordionTrigger class="hover:bg-blue-50 px-4 py-3">
      Стилизованный заголовок
    </AccordionTrigger>
    <AccordionContent class="px-4 pb-4 bg-gray-50">
      Стилизованное содержимое
    </AccordionContent>
  </AccordionItem>
</Accordion>
```

#### Добавление accordion в пользовательские UI компоненты

```typescript
// main.ts
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";

app.use(install, {
  fileHandlerBackendUrl: "https://files.example.com",
  generateDocumentPath: "/generate-document/",
  uiComponents: {
    // ... другие компоненты
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
  },
});
```

## API и типы

### Компоненты

#### DocumentDialog

Компонент диалога для генерации одного документа.

#### DocumentSetDialog

Новый компонент для генерации комплекта документов в zip-архиве. Позволяет пользователю выбрать несколько шаблонов документов и получить их в виде zip-файла.

```vue
<template>
  <div>
    <button @click="showSetDialog = true">Генерировать комплект документов</button>

    <DocumentSetDialog
      :is-open="showSetDialog"
      :document="documentData"
      :templates="documentTemplates"
      :options="{ filename: 'my_document_set' }"
      @update:is-open="showSetDialog = $event"
      @success="handleSuccess"
      @error="handleError"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { DocumentSetDialog } from 'locator-docgen-lib';

const showSetDialog = ref(false);
const documentData = ref({
  ref_id: "12345",
  // ... данные документа
});

const documentTemplates = ref([
  {
    id: "template1",
    name: "Шаблон 1",
    description: "Описание шаблона 1",
    additional_fields: []
  },
  // ... другие шаблоны
]);

const handleSuccess = (message) => {
  console.log('Успех:', message);
};

const handleError = (message) => {
  console.error('Ошибка:', message);
};
</script>
```

### Файл примера: `accordion-example.vue`

```vue
<template>
  <div class="container mx-auto p-6 space-y-8">
    <!-- Демо аккордеона в библиотеке документов -->
    <div class="space-y-6">
      <h2 class="text-2xl font-bold">Группы документов</h2>

      <Accordion type="multiple" class="space-y-4">
        <AccordionItem
          v-for="group in documentGroups"
          :key="group.id"
          :value="group.id"
          class="border rounded-lg"
        >
          <AccordionTrigger class="px-4 py-3 hover:bg-muted/50">
            <div class="flex items-center justify-between w-full">
              <div class="text-left">
                <h3 class="font-semibold">{{ group.name }}</h3>
                <p class="text-sm text-muted-foreground">{{ group.description }}</p>
              </div>
              <span class="text-sm text-muted-foreground">
                {{ group.templates?.length || 0 }} шаблонов
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent class="px-4 pb-4">
            <div class="space-y-3">
              <div
                v-for="template in group.templates"
                :key="template.id"
                class="flex items-center space-x-3 p-3 border rounded hover:bg-muted/30"
              >
                <input
                  type="checkbox"
                  :id="template.id"
                  class="rounded"
                />
                <label :for="template.id" class="flex-1 cursor-pointer">
                  <div class="font-medium">{{ template.name }}</div>
                  <div class="text-sm text-muted-foreground">{{ template.description }}</div>
                </label>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>

    <!-- Простой аккордеон для настроек -->
    <div class="space-y-6">
      <h2 class="text-2xl font-bold">Настройки</h2>

      <Accordion type="single" collapsible class="border rounded-lg">
        <AccordionItem value="general">
          <AccordionTrigger class="px-4 py-3">Общие настройки</AccordionTrigger>
          <AccordionContent class="px-4 pb-4">
            <div class="space-y-4">
              <div>
                <label class="text-sm font-medium">Тема</label>
                <select class="w-full mt-1 p-2 border rounded">
                  <option>Светлая</option>
                  <option>Темная</option>
                  <option>Автоматическая</option>
                </select>
              </div>
              <div>
                <label class="text-sm font-medium">Язык</label>
                <select class="w-full mt-1 p-2 border rounded">
                  <option>Русский</option>
                  <option>English</option>
                </select>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="notifications">
          <AccordionTrigger class="px-4 py-3">Уведомления</AccordionTrigger>
          <AccordionContent class="px-4 pb-4">
            <div class="space-y-3">
              <div class="flex items-center space-x-2">
                <input type="checkbox" id="email-notif" />
                <label for="email-notif">Уведомления по email</label>
              </div>
              <div class="flex items-center space-x-2">
                <input type="checkbox" id="push-notif" />
                <label for="push-notif">Push уведомления</label>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  </div>
</template>

<script setup>
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from 'locator-docgen-lib'

const documentGroups = [
  {
    id: 'group-1',
    name: 'Основные документы',
    description: 'Базовые документы для подачи заявки',
    templates: [
      { id: 'doc-1', name: 'Заявление', description: 'Основное заявление' },
      { id: 'doc-2', name: 'Анкета', description: 'Анкета заявителя' }
    ]
  },
  {
    id: 'group-2',
    name: 'Дополнительные документы',
    description: 'Документы по требованию',
    templates: [
      { id: 'doc-3', name: 'Справка о доходах', description: 'Справка с места работы' },
      { id: 'doc-4', name: 'Копия паспорта', description: 'Копия документа' }
    ]
  }
]
</script>
```

Подробная документация по использованию комплекта документов доступна в [DOCUMENT_SET_USAGE.md](./DOCUMENT_SET_USAGE.md).

#### LoadingSpinner

Компонент индикатора загрузки с анимацией. Используется для отображения процесса генерации документов.

```vue
<template>
  <LoadingSpinner
    text="Генерация документа..."
    :overlay="true"
  />
</template>

<script setup>
import { LoadingSpinner } from 'locator-docgen-lib';
</script>
```

**Props:**
- `text?: string` - текст для отображения под спиннером
- `overlay?: boolean` - показывать ли как overlay поверх всего экрана

#### Accordion компоненты

Набор компонентов для создания интерактивных аккордеонов на базе shadcn/vue.

```vue
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from 'locator-docgen-lib';
</script>
```

**Компоненты:**
- `Accordion` - корневой контейнер аккордеона
- `AccordionItem` - элемент секции аккордеона
- `AccordionTrigger` - триггер (кнопка) для раскрытия секции
- `AccordionContent` - содержимое секции

**Основные пропы Accordion:**
- `type?: "single" | "multiple"` - тип аккордеона
- `value?: string | string[]` - контролируемое значение
- `defaultValue?: string | string[]` - значение по умолчанию
- `collapsible?: boolean` - можно ли сворачивать все секции

**События:**
- `update:modelValue` - изменение значения аккордеона

Пропсы:

- `isOpen`: boolean - Управляет отображением диалога
- `document`: DocumentData - Данные документа
- `templates`: DocumentTemplate[] - Шаблоны документов
- `class`: string - CSS класс для настройки размера и стиля диалога

События:

- `update:isOpen` - Изменение состояния открытия
- `success` - Успешная генерация документа
- `error` - Ошибка при генерации

### Функции

#### setConfig(config: Partial<DocgenConfig>)

Устанавливает конфигурацию библиотеки.

#### getConfig(): DocgenConfig

Возвращает текущую конфигурацию.

#### documentApi(options?: DocumentApiOptions)

Создает API для работы с документами.

Возвращает объект с методами:

- `generateDocument(data: EnhancedDocumentData, templateName: string): Promise<boolean>` - генерация одного документа
- `generateDocumentSet(request: DocumentSetGenerationRequest): Promise<boolean>` - генерация комплекта документов в zip-архиве

### Типы

```typescript
// Базовые данные документа
interface DocumentData {
  ref_id?: string;
  [key: string]: any;
}

// Расширенные данные документа
interface EnhancedDocumentData extends DocumentData {
  additional_fields?: Record<string, any>;
  api_data?: Record<string, any>;
}

// Запрос на генерацию комплекта документов
interface DocumentSetGenerationRequest {
  documents: Array<{
    templateName: string;
    data: EnhancedDocumentData;
  }>;
  zipFilename?: string;
}

// Шаблон документа
interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  api_endpoints?: ApiEndpoint[];
  additional_fields: AdditionalField[];
}

// Дополнительное поле
interface AdditionalField {
  id: string;
  name: string;
  type: "string" | "number" | "date" | "boolean";
  description: string;
  required: boolean;
  defaultValue: string | number | boolean | null;
  conditions?: (FieldCondition | ConditionGroup)[];
}
```

## Конфигурация

Библиотека использует следующие настройки:

```typescript
interface DocgenConfig {
  // API настройки
  fileHandlerBackendUrl: string; // URL бэкенда для генерации файлов
  generateDocumentPath: string; // Путь к эндпоинту генерации документов

  // UI настройки (опционально)
  uiComponents?: {
    Card?: Component;
    CardContent?: Component;
    CardHeader?: Component;
    CardFooter?: Component;
    CardTitle?: Component;
    CardDescription?: Component;
    Button?: Component;
    Input?: Component;
    Label?: Component;
    Checkbox?: Component;
    Dialog?: Component;
    DialogContent?: Component;
    DialogHeader?: Component;
    DialogFooter?: Component;
    DialogTitle?: Component;
    DialogDescription?: Component;
  };
}
```

## Разработка и контрибьюция

Для локальной разработки:

```bash
# Установка зависимостей
npm install

# Запуск дев-сервера
npm run dev

# Сборка библиотеки
npm run build
```

## Примеры использования

### Пример использования Accordion компонентов

```vue
<template>
  <div class="max-w-2xl mx-auto p-6">
    <h1 class="text-2xl font-bold mb-6">Пример аккордеона</h1>

    <!-- Одиночный аккордеон -->
    <Accordion type="single" collapsible class="mb-8">
      <AccordionItem value="basics">
        <AccordionTrigger>Основы использования</AccordionTrigger>
        <AccordionContent>
          <p class="mb-4">
            Accordion компоненты позволяют создавать интерактивные секции,
            которые можно разворачивать и сворачивать.
          </p>
          <ul class="list-disc list-inside space-y-2">
            <li>Поддержка одиночного и множественного режимов</li>
            <li>Плавные анимации с помощью CSS</li>
            <li>Полная интеграция с shadcn/vue</li>
            <li>Поддержка кастомных стилей и тем</li>
          </ul>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="advanced">
        <AccordionTrigger>Расширенные возможности</AccordionTrigger>
        <AccordionContent>
          <div class="space-y-4">
            <p>
              Компоненты поддерживают кастомизацию через CSS переменные
              и слоты для создания уникального интерфейса.
            </p>
            <div class="bg-muted p-4 rounded-lg">
              <code class="text-sm">
                // Кастомные стили через CSS переменные<br/>
                :root {{"{"}}<br/>
                {"  "}&nbsp;--accordion-border: hsl(var(--border));<br/>
                {"  "}&nbsp;--accordion-radius: var(--radius);<br/>
                {"}"}
              </code>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>

    <!-- Множественный аккордеон -->
    <Accordion type="multiple">
      <AccordionItem value="docs">
        <AccordionTrigger>Документация</AccordionTrigger>
        <AccordionContent>
          <a href="#" class="text-blue-600 hover:underline">Руководство пользователя</a>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="examples">
        <AccordionTrigger>Примеры</AccordionTrigger>
        <AccordionContent>
          <a href="#" class="text-blue-600 hover:underline">Примеры кода</a>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="support">
        <AccordionTrigger>Поддержка</AccordionTrigger>
        <AccordionContent>
          <a href="#" class="text-blue-600 hover:underline">Связаться с поддержкой</a>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  </div>
</template>

<script setup>
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from 'locator-docgen-lib'
</script>
```

<p align="center">
    <img src="https://github.com/LT-Devs/locator-front-docgen-lib/blob/master/banner.svg?raw=true" alt="Locator DocGen" height="150" />
</p>

<h3 align="center">Locator Document Generation Library</h3>

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

## Пример шаблонов

### Пример генерации уведомлений

```json
[
  {
    "id": "notification_and_accompanying_template",
    "name": "Уведомление и сопроводительная документация",
    "description": "Стандартный шаблон уведомления и сопроводительной документации",
    "api_endpoints": [
      {
        "id": "staff_info",
        "url": "http://localhost:9007/api/v1/staff/summary?position=руководитель отдела&name_by_select={{ document.solution.decision_description }}",
        "method": "GET"
      }
    ],
    "additional_fields": [
      {
        "id": "petition_date",
        "name": "Дата обращения",
        "type": "date",
        "description": "Дата составления обращения",
        "required": true,
        "defaultValue": null,
        "conditions": [
          {
            "logic": "AND",
            "conditions": [
              {
                "field": "requests.sender",
                "operator": "!=",
                "value": "напрямую"
              },
              {
                "field": "requests.sender",
                "operator": "!regex",
                "value": "^[А-ЯЁ][а-яё]+\\s+[А-ЯЁ]\\.[А-ЯЁ]\\."
              }
            ]
          }
        ]
      }
    ]
  }
] 
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

## API и типы

### Компоненты

#### DocumentDialog

Компонент диалога для генерации документа.

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

Возвращает объект с методом:

- `generateDocument(data: EnhancedDocumentData, templateName: string): Promise<boolean>`

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

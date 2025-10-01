<script setup lang="ts">
import { computed, ref, watch } from "vue";
import _ from "lodash";
import axiosInstance from "axios";
import { getConfig, useConfig } from "@/config";
import { documentApi } from "@/api/documentApi";
import type { DocumentData } from "@/types/document_data";

// Импортируем UI компоненты
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

// Импортируем компоненты диалога для анимации
import { Dialog } from "@/components/ui/dialog";
import { DialogHeader } from "@/components/ui/dialog";
import { DialogFooter } from "@/components/ui/dialog";
import { DialogTitle } from "@/components/ui/dialog";
import { DialogDescription } from "@/components/ui/dialog";
// Импортируем наш кастомный компонент диалога с шириной 4/6
import CustomDialogContent from "@/components/ui/dialog/CustomDialogContent.vue";

// Типы для API-эндпоинтов
export interface ApiEndpoint {
  id: string;
  url: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  params?: Record<string, any>;
  body?: Record<string, any>;
  headers?: Record<string, string>;
}

// Типы для дополнительных полей
export interface FieldCondition {
  field: string;
  operator: "==" | "!=" | ">" | "<" | ">=" | "<=" | "includes" | "!includes" | "regex" | "!regex";
  value: string | number | boolean | null;
}

// Добавляем типы для группировки условий
export interface ConditionGroup {
  logic: "AND" | "OR";
  conditions: (FieldCondition | ConditionGroup)[];
}

export interface AdditionalField {
  id: string;
  name: string;
  type: "string" | "number" | "date" | "boolean";
  description: string;
  required: boolean;
  defaultValue: string | number | boolean | null;
  conditions?: (FieldCondition | ConditionGroup)[];
}

export interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  api_endpoints?: ApiEndpoint[];
  additional_fields: AdditionalField[];
}

export interface DocumentDialogOptions {
   filename: string | undefined | null
   onSuccess?: (data: string | Blob) => void;
   onError?: (message: string) => void;
}

const emit = defineEmits<{
  (e: "update:isOpen", value: boolean): void;
  (e: "success", message: string | Blob): void;
  (e: "error", message: string): void;
}>();

const props = defineProps<{
  isOpen: boolean;
  document?: DocumentData | null;
  templates: DocumentTemplate[];
  options?: DocumentDialogOptions;
  class?: string; // Пользовательский класс для DialogContent
}>();

const { generateDocument } = documentApi({
  filename: props.options?.filename,
  onSuccess: (data) => {
    if (typeof data === 'string') {
      emit('success', data);
    } else {
      // Если получили Blob, создаем URL для скачивания
      const url = window.URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Document_${props.document?.ref_id ?? 'new'}_${selectedTemplate.value?.id ?? 'template'}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      emit('success', 'Документ успешно сгенерирован и загружен');
    }
  },
  onError: (message) => emit('error', message)
});

// Получаем конфигурацию с UI-компонентами
const config = useConfig();
const uiComponents = computed(() => config.uiComponents || {});

// Используем пользовательские компоненты, если они определены в конфигурации
const CustomButton = computed(() => uiComponents.value.Button || Button);
const CustomInput = computed(() => uiComponents.value.Input || Input);
const CustomLabel = computed(() => uiComponents.value.Label || Label);
const CustomCheckbox = computed(() => uiComponents.value.Checkbox || Checkbox);
const CustomLoadingSpinner = computed(() => uiComponents.value.LoadingSpinner || LoadingSpinner);

// Добавляем поддержку компонентов Dialog
const CustomDialog = computed(() => uiComponents.value.Dialog || Dialog);
const CustomDialogHeader = computed(() => uiComponents.value.DialogHeader || DialogHeader);
const CustomDialogFooter = computed(() => uiComponents.value.DialogFooter || DialogFooter);
const CustomDialogTitle = computed(() => uiComponents.value.DialogTitle || DialogTitle);
const CustomDialogDescription = computed(() => uiComponents.value.DialogDescription || DialogDescription);

const isGenerating = ref(false);
const selectedTemplate = ref<DocumentTemplate | null>(null);
const additionalFieldValues = ref<Record<string, any>>({});
const showAdditionalFieldsDialog = ref(false);
const apiDataLoading = ref(false);
const apiData = ref<Record<string, any>>({});
const showLoadingOverlay = ref(false);
const loadingText = ref('');

// Вспомогательная функция для получения значения по пути в объекте
function getValueByPath(obj: any, path: string): any {
  return _.get(obj, path);
}

// Проверка условия для отображения поля
function checkCondition(condition: FieldCondition | undefined, document: DocumentData | null): boolean {
  if (!condition || !document) return true;

  const fieldValue = getValueByPath(document, condition.field);
  const conditionValue = condition.value;

  // Если значение условия null, особая обработка
  if (conditionValue === null) {
    return fieldValue === null || fieldValue === undefined;
  }

  let result = false;

  switch (condition.operator) {
    case "==": result = fieldValue === conditionValue; break;
    case "!=": result = fieldValue !== conditionValue; break;
    case ">": result = typeof fieldValue === 'number' && typeof conditionValue === 'number' ? fieldValue > conditionValue : false; break;
    case "<": result = typeof fieldValue === 'number' && typeof conditionValue === 'number' ? fieldValue < conditionValue : false; break;
    case ">=": result = typeof fieldValue === 'number' && typeof conditionValue === 'number' ? fieldValue >= conditionValue : false; break;
    case "<=": result = typeof fieldValue === 'number' && typeof conditionValue === 'number' ? fieldValue <= conditionValue : false; break;
    case "includes": result = Array.isArray(fieldValue) && conditionValue !== null ? fieldValue.includes(conditionValue) : false; break;
    case "!includes": result = Array.isArray(fieldValue) && conditionValue !== null ? !fieldValue.includes(conditionValue) : true; break;
    case "regex":
      if (typeof fieldValue === 'string' && typeof conditionValue === 'string') {
        try {
          const regex = new RegExp(conditionValue);
          result = regex.test(fieldValue);
        } catch (e) {
          result = false;
        }
      } else {
        result = false;
      }
      break;
    case "!regex":
      if (typeof fieldValue === 'string' && typeof conditionValue === 'string') {
        try {
          const regex = new RegExp(conditionValue);
          result = !regex.test(fieldValue);
        } catch (e) {
          result = true;
        }
      } else {
        result = true;
      }
      break;
    default: result = true;
  }

  return result;
}

// Проверка группы условий
function checkConditionGroup(group: ConditionGroup, document: DocumentData | null): boolean {
  if (!document || group.conditions.length === 0) return true;

  let result = false;

  if (group.logic === "AND") {
    result = group.conditions.every(condition => {
      if ('logic' in condition) {
        return checkConditionGroup(condition as ConditionGroup, document);
      } else {
        return checkCondition(condition as FieldCondition, document);
      }
    });
  } else { // OR
    result = group.conditions.some(condition => {
      if ('logic' in condition) {
        return checkConditionGroup(condition as ConditionGroup, document);
      } else {
        return checkCondition(condition as FieldCondition, document);
      }
    });
  }

  return result;
}

// Проверка всех условий для отображения поля
function checkAllConditions(field: AdditionalField, document: DocumentData | null): boolean {
  if (!document) return true;

  // Если условий нет, поле всегда отображается
  if (!field.conditions || field.conditions.length === 0) return true;

  // Проверяем все условия
  return field.conditions.every(condition => {
    if ('logic' in condition) {
      return checkConditionGroup(condition as ConditionGroup, document);
    } else {
      return checkCondition(condition as FieldCondition, document);
    }
  });
}

// Функция для получения значения cookie по имени
function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  if (match) return match[2];
  return null;
}

// Функция для обработки шаблонных переменных в строках
function processTemplate(template: string, data: Record<string, any>): string {
  return template.replace(/\{\{\s*([^}]+)\s*\}\}/g, (match, path) => {
    const value = _.get(data, path.trim());
    return value !== undefined ? String(value) : match;
  });
}

// Функция для запроса данных с API-эндпоинтов
async function fetchApiData(endpoints: ApiEndpoint[], documentData: DocumentData): Promise<Record<string, any>> {
  const result: Record<string, any> = {};

  if (!endpoints || endpoints.length === 0) {
    return result;
  }

  // Получаем значение авторизационного ключа из cookie
  const authKey = getCookie('key');
  // Подготавливаем заголовки для запроса
  const headers: Record<string, string> = {};

  if (authKey) {
    headers['Authorization'] = authKey;
  }

  const config = getConfig();

  for (const endpoint of endpoints) {
    try {
      // Обрабатываем шаблонные переменные в URL
      let processedUrl = processTemplate(endpoint.url, { document: documentData });

      // Проверяем, нужно ли добавить базовый URL из конфига
      if (processedUrl.startsWith("{config.") && processedUrl.includes("}")) {
        // Извлекаем имя конфиг-переменной
        const configVarMatch = processedUrl.match(/\{config\.([^}]+)\}/);
        if (configVarMatch && configVarMatch[1]) {
          const configVar = configVarMatch[1];
          const baseUrl = (config as any)[configVar] || '';

          // Заменяем шаблон на значение из конфига и убираем ведущий слэш, если он есть
          processedUrl = processedUrl.replace(
            `{config.${configVar}}`,
            baseUrl
          ).replace(/^\{config\.[^}]+\}\//, baseUrl);
        }
      } else if (processedUrl.startsWith("/")) {
        // Если URL начинается со слэша, но не содержит конфиг-переменную,
        // проверяем, можно ли определить нужный базовый URL по содержимому пути
        if (processedUrl.startsWith("/staff")) {
          processedUrl = `${config.staffUrl}${processedUrl}`;
        } else if (processedUrl.startsWith("/inquiries")) {
          processedUrl = `${config.inquiryUrl}${processedUrl}`;
        } else {
          // По умолчанию используем основной бэкенд
          processedUrl = `${config.backendUrl}${processedUrl}`;
        }
      }

      // Обрабатываем параметры запроса
      const processedParams = endpoint.params
        ? Object.entries(endpoint.params).reduce((acc, [key, value]) => {
          if (typeof value === 'string') {
            acc[key] = processTemplate(value, { document: documentData });
          } else {
            acc[key] = value;
          }
          return acc;
        }, {} as Record<string, any>)
        : {};

      // Выполняем запрос
      let response;
      const requestConfig = {
        params: processedParams,
        headers: { ...headers, ...(endpoint.headers || {}) }
      };

      switch (endpoint.method) {
        case 'GET':
          response = await axiosInstance.get(processedUrl, requestConfig);
          break;
        case 'POST':
          response = await axiosInstance.post(processedUrl, endpoint.body, requestConfig);
          break;
        case 'PUT':
          response = await axiosInstance.put(processedUrl, endpoint.body, requestConfig);
          break;
        case 'DELETE':
          response = await axiosInstance.delete(processedUrl, requestConfig);
          break;
      }

      if (response?.data) {
        result[endpoint.id] = response.data;
      }
    } catch (error) {
      console.error(`Ошибка при запросе к ${endpoint.url}:`, error);
    }
  }

  return result;
}

// Отфильтрованные поля в зависимости от условий
const filteredAdditionalFields = computed(() => {
  if (!selectedTemplate.value) return [];

  const document = props.document || null;

  return selectedTemplate.value.additional_fields.filter(field =>
    checkAllConditions(field, document)
  );
});

// Проверка, все ли обязательные поля заполнены
const isFormValid = computed(() => {
  return filteredAdditionalFields.value.every(field =>
    !field.required || additionalFieldValues.value[field.id] !== undefined
  );
});

// Сброс формы при закрытии диалога
watch(() => props.isOpen, (isOpen) => {
  if (!isOpen) {
    selectedTemplate.value = null;
    additionalFieldValues.value = {};
    showAdditionalFieldsDialog.value = false;
    apiData.value = {};
  }
});

// Обработчик выбора шаблона
const handleTemplateSelect = async (template: DocumentTemplate) => {
  selectedTemplate.value = template;

  const document = props.document || null;

  // Запрашиваем данные с API, если указаны эндпоинты
  if (template.api_endpoints && template.api_endpoints.length > 0 && document) {
    apiDataLoading.value = true;

    try {
      apiData.value = await fetchApiData(template.api_endpoints, document);
    } catch (error) {
      console.error("Ошибка при загрузке данных:", error);
      emit('error', 'Не удалось загрузить дополнительные данные');
    } finally {
      apiDataLoading.value = false;
    }
  }

  // Если нет дополнительных полей или все они имеют defaultValue и не требуют заполнения, сразу генерируем документ
  if (template.additional_fields.length === 0 ||
    template.additional_fields.every(field =>
      !checkAllConditions(field, document) ||
      field.defaultValue !== null
    )) {
    // Заполняем дефолтные значения
    template.additional_fields.forEach(field => {
      if (field.defaultValue !== null) {
        additionalFieldValues.value[field.id] = field.defaultValue;
      }
    });
    handleGenerateWithAdditionalFields();
  } else {
    // Иначе показываем диалог для заполнения полей
    showAdditionalFieldsDialog.value = true;
  }
};

// Генерация документа с дополнительными полями
const handleGenerateWithAdditionalFields = async () => {
  if (!props.document || !selectedTemplate.value) {
    emit('error', 'Документ или шаблон не выбраны');
    return;
  }

  if (!isFormValid.value) {
    emit('error', 'Заполните все обязательные поля');
    return;
  }

  isGenerating.value = true;
  showLoadingOverlay.value = true;
  loadingText.value = 'Подготовка данных...';
  
  try {
    // Форматируем даты перед отправкой
    loadingText.value = 'Подготовка данных...';
    const formattedFields = { ...additionalFieldValues.value };

    // Если есть выбранный шаблон и дополнительные поля
    if (selectedTemplate.value && selectedTemplate.value.additional_fields.length > 0) {
      selectedTemplate.value.additional_fields.forEach(field => {
        if (field.type === 'date' && formattedFields[field.id]) {
          // Преобразуем дату из YYYY-MM-DD в DD.MM.YYYY
          const dateParts = formattedFields[field.id].split('-');
          if (dateParts.length === 3) {
            formattedFields[field.id] = `${dateParts[2]}.${dateParts[1]}.${dateParts[0]}`;
          }
        }
      });
    }

    // Объединяем данные документа с дополнительными полями и данными API
    const documentWithAdditionalFields = {
      ...props.document,
      additional_fields: formattedFields,
      api_data: apiData.value
    };

    loadingText.value = 'Генерация документа...';
    await generateDocument(documentWithAdditionalFields, selectedTemplate.value.id);
    
    loadingText.value = 'Завершение...';
    emit("update:isOpen", false);
  } catch (error) {
    console.error("Ошибка при генерации документа:", error);
    emit('error', 'Произошла ошибка при генерации документа');
  } finally {
    isGenerating.value = false;
    showLoadingOverlay.value = false;
    loadingText.value = '';
  }
};
</script>

<template>
  <component :is="CustomDialog" :open="isOpen" @update:open="emit('update:isOpen', $event)">
    <CustomDialogContent :class="props.class">
      <!-- Индикатор загрузки -->
      <component 
        v-if="showLoadingOverlay" 
        :is="CustomLoadingSpinner" 
        :text="loadingText" 
        :overlay="true" 
      />
      <!-- Диалог выбора шаблона -->
      <div v-if="!showAdditionalFieldsDialog">
        <component :is="CustomDialogHeader">
          <component :is="CustomDialogTitle">Выберите шаблон документа</component>
          <component :is="CustomDialogDescription">
            Выберите шаблон для генерации документа {{ document?.ref_id ? `#${document.ref_id}` : '' }}
          </component>
        </component>

        <div class="py-4 space-y-4">
          <div v-for="template in templates" :key="template.id"
            class="flex items-center justify-between p-4 border rounded-lg mb-4">
            <div class="flex-1">
              <h4 class="font-medium">{{ template.name }}</h4>
              <p class="text-sm text-muted-foreground">{{ template.description }}</p>
            </div>
            <component :is="CustomButton" :disabled="isGenerating || apiDataLoading"
              @click="handleTemplateSelect(template)" class="ml-4">
              Выбрать
            </component>
          </div>
        </div>

        <component :is="CustomDialogFooter">
          <component :is="CustomButton" variant="outline" @click="emit('update:isOpen', false)">
            Отмена
          </component>
        </component>
      </div>

      <!-- Диалог ввода дополнительных полей -->
      <div v-else>
        <component :is="CustomDialogHeader">
          <component :is="CustomDialogTitle">Заполните дополнительные поля</component>
          <component :is="CustomDialogDescription">
            Необходимо заполнить дополнительные поля для шаблона "{{ selectedTemplate?.name }}"
          </component>
        </component>

        <div class="py-4">
          <div v-if="Object.keys(apiData).length > 0" class="mb-4 p-3 bg-muted rounded-md">
            <p class="font-medium">Дополнительные данные загружены с сервера</p>
            <p class="text-sm text-muted-foreground">Данные будут использованы при генерации документа</p>
          </div>

          <div class="space-y-4">
            <div v-for="field in filteredAdditionalFields" :key="field.id" class="space-y-2">
              <component :is="CustomLabel" :for="field.id" class="block">
                {{ field.name }}
                <span v-if="field.required" class="text-destructive">*</span>
              </component>

              <component v-if="field.type === 'string' || field.type === 'number'" :is="CustomInput" :id="field.id"
                :type="field.type === 'number' ? 'number' : 'text'" :placeholder="field.description"
                v-model="additionalFieldValues[field.id]" :required="field.required" class="w-full" />

              <component v-else-if="field.type === 'date'" :is="CustomInput" :id="field.id" type="date"
                :placeholder="field.description" v-model="additionalFieldValues[field.id]" :required="field.required"
                class="w-full" />

              <div v-else-if="field.type === 'boolean'" class="flex items-center space-x-2">
                <component :is="CustomCheckbox" :id="field.id" v-model="additionalFieldValues[field.id]"
                  :required="field.required" />
                <component :is="CustomLabel" :for="field.id">{{ field.description }}</component>
              </div>

              <p class="text-sm text-muted-foreground">{{ field.description }}</p>
            </div>
          </div>
        </div>

        <component :is="CustomDialogFooter" class="flex justify-between sm:justify-end sm:space-x-2">
          <component :is="CustomButton" variant="outline" @click="showAdditionalFieldsDialog = false"
            :disabled="isGenerating">
            Назад
          </component>
          <component :is="CustomButton" @click="handleGenerateWithAdditionalFields"
            :disabled="!isFormValid || isGenerating">
            Сгенерировать
            <span v-if="isGenerating" class="ml-2">...</span>
          </component>
        </component>
      </div>
    </CustomDialogContent>
  </component>
</template>

<style scoped>
/* Удаляем старые стили, так как теперь используем компоненты Shadcn */
</style>
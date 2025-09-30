<script setup lang="ts">
import { computed, ref, watch } from "vue";
import _ from "lodash";
import axiosInstance from "@/lib/axios";
import { getConfig, useConfig } from "@/config";
import { documentApi } from "@/api/documentApi";
import type { DocumentData } from "@/types/document_data";
import type { EnhancedDocumentData } from "@/api/documentApi";

// Импортируем UI компоненты
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Импортируем компоненты диалога
import { Dialog } from "@/components/ui/dialog";
import { DialogHeader } from "@/components/ui/dialog";
import { DialogFooter } from "@/components/ui/dialog";
import { DialogTitle } from "@/components/ui/dialog";
import { DialogDescription } from "@/components/ui/dialog";
import CustomDialogContent from "@/components/ui/dialog/CustomDialogContent.vue";

// Типы для API-эндпоинтов (экспортируем для использования в других проектах)
export interface ApiEndpoint {
  id: string;
  url: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  params?: Record<string, any>;
  body?: Record<string, any>;
  headers?: Record<string, string>;
}

export interface FieldCondition {
  field: string;
  operator: "==" | "!=" | ">" | "<" | ">=" | "<=" | "includes" | "!includes" | "regex" | "!regex";
  value: string | number | boolean | null;
}

export interface ConditionGroup {
  logic: "AND" | "OR";
  conditions: (FieldCondition | ConditionGroup)[];
}

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface AdditionalField {
  id: string;
  name: string;
  type: "string" | "number" | "date" | "boolean" | "select" | "api_select";
  api_endpoint?: string; 
  optionLabelPath?: string; // путь до поля для отображения в списке
  optionValuePath?: string; // путь до поля-идентификатора
  resultsPath?: string; // если массив находится по вложенному пути в ответе
  description: string;
  required: boolean;
  defaultValue: string | number | boolean | null;
  conditions?: (FieldCondition | ConditionGroup)[];
  options?: SelectOption[]; // Для select полей
}

export interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  api_endpoints?: ApiEndpoint[];
  additional_fields: AdditionalField[];
  templates?: DocumentTemplate[]; // Если есть - это группа, если нет - единичный шаблон
}

export interface UnifiedDialogOptions {
  filename: string | undefined | null;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

const emit = defineEmits<{
  (e: "update:isOpen", value: boolean): void;
  (e: "success", message: string): void;
  (e: "error", message: string): void;
}>();

const props = defineProps<{
  isOpen: boolean;
  document?: DocumentData | null;
  templates: DocumentTemplate[];
  options?: UnifiedDialogOptions;
  class?: string;
}>();

const { generateDocument, generateDocumentSet } = documentApi({
  filename: props.options?.filename,
  onSuccess: (message) => emit('success', message),
  onError: (message) => emit('error', message)
});

// Получаем конфигурацию с UI-компонентами
const config = useConfig();
const uiComponents = computed(() => config.uiComponents || {});

// Используем пользовательские компоненты, если они определены в конфигурации
const CustomButton = computed(() => uiComponents.value.Button || Button);
const CustomCheckbox = computed(() => uiComponents.value.Checkbox || Checkbox);
const CustomLabel = computed(() => uiComponents.value.Label || Label);
const CustomInput = computed(() => uiComponents.value.Input || Input);
const CustomLoadingSpinner = computed(() => uiComponents.value.LoadingSpinner || LoadingSpinner);
// Select компоненты для дополнительных полей
const CustomSelect = computed(() => uiComponents.value.Select || Select);
const CustomSelectContent = computed(() => uiComponents.value.SelectContent || SelectContent);
const CustomSelectItem = computed(() => uiComponents.value.SelectItem || SelectItem);
const CustomSelectTrigger = computed(() => uiComponents.value.SelectTrigger || SelectTrigger);
const CustomSelectValue = computed(() => uiComponents.value.SelectValue || SelectValue);
const CustomDialog = computed(() => uiComponents.value.Dialog || Dialog);
const CustomDialogHeader = computed(() => uiComponents.value.DialogHeader || DialogHeader);
const CustomDialogFooter = computed(() => uiComponents.value.DialogFooter || DialogFooter);
const CustomDialogTitle = computed(() => uiComponents.value.DialogTitle || DialogTitle);
const CustomDialogDescription = computed(() => uiComponents.value.DialogDescription || DialogDescription);

// Состояние компонента
const isGenerating = ref(false);
const selectedAction = ref<'report' | 'documents' | null>(null);
const selectedTemplates = ref<Set<string>>(new Set());
const additionalFieldValues = ref<Record<string, Record<string, any>>>({});
const showAdditionalFieldsDialog = ref(false);
const apiDataLoading = ref(false);
const apiData = ref<Record<string, any>>({});
const showLoadingOverlay = ref(false);
const loadingText = ref('');
// Состояние аккордеона для групп документов
const expandedGroups = ref<Set<string>>(new Set());

// Разделяем шаблоны на две категории
const reportTemplates = computed(() =>
  props.templates.filter(template => !template.templates) // Единичные документы (без поля templates)
);

const documentGroups = computed(() =>
  props.templates.filter(template => template.templates) // Группы документов (с полем templates)
);

// Получаем все шаблоны документов из групп
const allDocumentTemplates = computed(() => {
  const templates: DocumentTemplate[] = [];
  documentGroups.value.forEach(group => {
    if (group.templates) {
      templates.push(...group.templates);
    }
  });
  return templates;
});

// Вспомогательные функции (копируем из DocumentDialog)
function getValueByPath(obj: any, path: string): any {
  return _.get(obj, path);
}

function checkCondition(condition: FieldCondition | undefined, document: DocumentData | null): boolean {
  if (!condition || !document) return true;

  const fieldValue = getValueByPath(document, condition.field);
  const conditionValue = condition.value;

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
  } else {
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

function checkAllConditions(field: AdditionalField, document: DocumentData | null): boolean {
  if (!document) return true;

  if (!field.conditions || field.conditions.length === 0) return true;

  return field.conditions.every(condition => {
    if ('logic' in condition) {
      return checkConditionGroup(condition as ConditionGroup, document);
    } else {
      return checkCondition(condition as FieldCondition, document);
    }
  });
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  if (match) return match[2];
  return null;
}

function processTemplate(template: string, data: Record<string, any>): string {
  return template.replace(/\{\{\s*([^}]+)\s*\}\}/g, (match, path) => {
    const value = _.get(data, path.trim());
    return value !== undefined ? String(value) : match;
  });
}

// Возвращает массив объектов-опций для поля api_select
function getApiItemsForField(field: AdditionalField): any[] {
  if (!field.api_endpoint) return [];
  const raw = apiData.value[field.api_endpoint];
  if (!raw) return [];
  // Если указан resultsPath, извлекаем массив по нему, иначе ожидаем, что raw — это массив
  const items = field.resultsPath ? _.get(raw, field.resultsPath) : raw;
  return Array.isArray(items) ? items : [];
}

// Собирает опции для Select из объектов ответа API
function buildApiSelectOptions(field: AdditionalField): SelectOption[] {
  const items = getApiItemsForField(field);
  const labelPath = field.optionLabelPath || 'name';
  const valuePath = field.optionValuePath || 'id';
  return items.map((item) => ({
    label: String(_.get(item, labelPath) ?? ''),
    value: String(_.get(item, valuePath) ?? ''),
  })).filter(o => o.label !== '' && o.value !== '');
}

// Находит полный объект по выбранному value
function findApiItemByValue(field: AdditionalField, selectedValue: string | number): any | undefined {
  const items = getApiItemsForField(field);
  const valuePath = field.optionValuePath || 'id';
  return items.find(item => String(_.get(item, valuePath)) === String(selectedValue));
}

async function fetchApiData(endpoints: ApiEndpoint[], documentData: DocumentData): Promise<Record<string, any>> {
  const result: Record<string, any> = {};

  if (!endpoints || endpoints.length === 0) {
    return result;
  }

  const authKey = getCookie('key');
  const headers: Record<string, string> = {};

  if (authKey) {
    headers['Authorization'] = authKey;
  }

  const config = getConfig();

  for (const endpoint of endpoints) {
    try {
      let processedUrl = processTemplate(endpoint.url, { document: documentData });

      if (processedUrl.startsWith("{config.") && processedUrl.includes("}")) {
        const configVarMatch = processedUrl.match(/\{config\.([^}]+)\}/);
        if (configVarMatch && configVarMatch[1]) {
          const configVar = configVarMatch[1];
          const baseUrl = (config as any)[configVar] || '';

          processedUrl = processedUrl.replace(
            `{config.${configVar}}`,
            baseUrl
          ).replace(/^\{config\.[^}]+\}\//, baseUrl);
        }
      } else if (processedUrl.startsWith("/")) {
        if (processedUrl.startsWith("/staff")) {
          processedUrl = `${config.staffUrl}${processedUrl}`;
        } else if (processedUrl.startsWith("/inquiries")) {
          processedUrl = `${config.inquiryUrl}${processedUrl}`;
        } else {
          processedUrl = `${config.backendUrl}${processedUrl}`;
        }
      }

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

// Выбранные шаблоны с их дополнительными полями
const selectedTemplatesWithFields = computed(() => {
  return allDocumentTemplates.value.filter(template => selectedTemplates.value.has(template.id));
});

// Объединенные поля для выбранных шаблонов (группировка по имени поля)
const mergedFields = computed(() => {
  const fieldMap = new Map<string, {
    id: string;
    name: string;
    type: string;
    description: string;
    required: boolean;
    defaultValue: any;
    options?: SelectOption[];
    api_endpoint?: string;
    optionLabelPath?: string;
    optionValuePath?: string;
    resultsPath?: string;
    conditions?: any[];
    templates: string[]; // ID шаблонов, использующих это поле
  }>();

  selectedTemplatesWithFields.value.forEach(template => {
    const document = props.document || null;
    const filteredFields = template.additional_fields.filter(field =>
      checkAllConditions(field, document)
    );

    filteredFields.forEach(field => {
      if (fieldMap.has(field.name)) {
        // Поле уже существует, обновляем информацию
        const existingField = fieldMap.get(field.name)!;
        existingField.templates.push(template.id);

        // Если поле обязательное в любом шаблоне, делаем его обязательным
        if (field.required) {
          existingField.required = true;
        }

        // Объединяем опции для select полей
        if (field.type === 'select' && field.options && existingField.type === 'select') {
          const existingOptions = existingField.options || [];
          const newOptions = field.options.filter(newOpt =>
            !existingOptions.some(existingOpt => existingOpt.value === newOpt.value)
          );
          existingField.options = [...existingOptions, ...newOptions];
        }

        // Объединяем условия
        if (field.conditions && field.conditions.length > 0) {
          if (!existingField.conditions) {
            existingField.conditions = [];
          }
          existingField.conditions.push(...field.conditions);
        }
      } else {
        // Новое поле
        fieldMap.set(field.name, {
          id: `${field.name}_${template.id}`,
          name: field.name,
          type: field.type,
          description: field.description,
          required: field.required,
          defaultValue: field.defaultValue,
          options: field.type === 'select' ? field.options : undefined,
          api_endpoint: field.type === 'api_select' ? field.api_endpoint : undefined,
          optionLabelPath: field.type === 'api_select' ? field.optionLabelPath : undefined,
          optionValuePath: field.type === 'api_select' ? field.optionValuePath : undefined,
          resultsPath: field.type === 'api_select' ? field.resultsPath : undefined,
          conditions: field.conditions,
          templates: [template.id]
        });
      }
    });
  });

  return Array.from(fieldMap.values());
});

// Проверка, все ли обязательные поля заполнены для всех выбранных шаблонов
const isFormValid = computed(() => {
  // Проверяем, что все обязательные объединенные поля заполнены
  return mergedFields.value.every(field => {
    return !field.required || additionalFieldValues.value[field.templates[0]]?.[field.id] !== undefined;
  });
});

// Сброс формы при закрытии диалога
watch(() => props.isOpen, (isOpen) => {
  if (!isOpen) {
    selectedAction.value = null;
    selectedTemplates.value.clear();
    additionalFieldValues.value = {};
    showAdditionalFieldsDialog.value = false;
    apiData.value = {};
    expandedGroups.value.clear();
  }
});

// Функция переключения состояния группы аккордеона
const toggleGroup = (groupId: string) => {
  if (expandedGroups.value.has(groupId)) {
    expandedGroups.value.delete(groupId);
  } else {
    expandedGroups.value.add(groupId);
  }
};

// Обработчик выбора действия
const handleActionSelect = (action: 'report' | 'documents') => {
  selectedAction.value = action;

  if (action === 'report') {
    // Для отчета сразу начинаем генерацию
    handleGenerateReport();
  }
};

// Обработчик выбора/снятия выбора шаблона документа
const handleTemplateToggle = (templateId: string) => {
  if (selectedTemplates.value.has(templateId)) {
    selectedTemplates.value.delete(templateId);
    delete additionalFieldValues.value[templateId];
  } else {
    selectedTemplates.value.add(templateId);
    const template = allDocumentTemplates.value.find(t => t.id === templateId);
    if (template) {
      additionalFieldValues.value[templateId] = {};
      template.additional_fields.forEach(field => {
        if (field.defaultValue !== null) {
          additionalFieldValues.value[templateId][field.id] = field.defaultValue;
        }
      });
    }
  }
};

// Генерация отчета
const handleGenerateReport = async () => {
  if (!props.document) {
    emit('error', 'Документ не выбран');
    return;
  }

  isGenerating.value = true;
  showLoadingOverlay.value = true;
  loadingText.value = 'Подготовка отчета...';

  try {
    // Находим первый доступный единичный шаблон
    const reportTemplate = reportTemplates.value[0];
    if (!reportTemplate) {
      emit('error', 'Шаблон отчета не найден');
      return;
    }

    // Загружаем данные с API, если нужно
    if (reportTemplate.api_endpoints && reportTemplate.api_endpoints.length > 0) {
      loadingText.value = 'Загрузка данных...';
      apiData.value = await fetchApiData(reportTemplate.api_endpoints, props.document);
    }

    // Подготавливаем данные для генерации
    const documentWithAdditionalFields: EnhancedDocumentData = {
      ...props.document,
      additional_fields: {},
      api_data: apiData.value
    };

    loadingText.value = 'Генерация отчета...';
    await generateDocument(documentWithAdditionalFields, reportTemplate.id);

    loadingText.value = 'Завершение...';
    emit("update:isOpen", false);
  } catch (error) {
    console.error("Ошибка при генерации отчета:", error);
    emit('error', 'Произошла ошибка при генерации отчета');
  } finally {
    isGenerating.value = false;
    showLoadingOverlay.value = false;
    loadingText.value = '';
  }
};

// Обработчик перехода к заполнению дополнительных полей
const handleProceedToFields = async () => {
  if (selectedTemplates.value.size === 0) {
    emit('error', 'Выберите хотя бы один шаблон');
    return;
  }

  const document = props.document || null;

  // Загружаем данные с API для всех выбранных шаблонов
  const allEndpoints = selectedTemplatesWithFields.value
    .flatMap(template => template.api_endpoints || []);

  if (allEndpoints.length > 0 && document) {
    apiDataLoading.value = true;

    try {
      apiData.value = await fetchApiData(allEndpoints, document);
    } catch (error) {
      console.error("Ошибка при загрузке данных:", error);
      emit('error', 'Не удалось загрузить дополнительные данные');
    } finally {
      apiDataLoading.value = false;
    }
  }

  // Проверяем, нужны ли дополнительные поля
  const needsFields = selectedTemplatesWithFields.value.some(template => {
    const document = props.document || null;
    const filteredFields = template.additional_fields.filter(field =>
      checkAllConditions(field, document)
    );

    return filteredFields.some(field =>
      field.required && field.defaultValue === null
    );
  });

  if (needsFields) {
    showAdditionalFieldsDialog.value = true;
  } else {
    handleGenerateDocuments();
  }
};

// Генерация документов
const handleGenerateDocuments = async () => {
  if (!props.document || selectedTemplates.value.size === 0) {
    emit('error', 'Документ или шаблоны не выбраны');
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
    // Подготавливаем данные для всех выбранных документов
    loadingText.value = 'Подготовка данных...';
    const documents = Array.from(selectedTemplates.value).map((templateId) => {
      const template = allDocumentTemplates.value.find(t => t.id === templateId);
      if (!template) return null;

      // Распределяем объединенные поля по шаблонам
      const formattedFields: Record<string, any> = {};

      // Проходим по объединенным полям и распределяем их значения
      mergedFields.value.forEach(mergedField => {
        if (mergedField.templates.includes(templateId)) {
          const fieldValue = additionalFieldValues.value[templateId]?.[mergedField.id];
          if (fieldValue !== undefined) {
            formattedFields[mergedField.name] = fieldValue;
          }
        }
      });

      // Форматируем даты перед отправкой
      Object.keys(formattedFields).forEach(fieldName => {
        const mergedField = mergedFields.value.find(f => f.name === fieldName);
        if (mergedField && mergedField.type === 'date' && formattedFields[fieldName]) {
          const dateParts = formattedFields[fieldName].split('-');
          if (dateParts.length === 3) {
            formattedFields[fieldName] = `${dateParts[2]}.${dateParts[1]}.${dateParts[0]}`;
          }
        } else if (mergedField && mergedField.type === 'api_select' && formattedFields[fieldName] !== undefined) {
          // Преобразуем выбранный идентификатор в полный объект
          const selected = formattedFields[fieldName];
          const fieldForApi: AdditionalField = {
            id: mergedField.id,
            name: mergedField.name,
            type: mergedField.type as "string" | "number" | "date" | "boolean" | "select" | "api_select",
            description: mergedField.description,
            required: mergedField.required,
            defaultValue: mergedField.defaultValue,
            api_endpoint: mergedField.api_endpoint,
            optionLabelPath: mergedField.optionLabelPath,
            optionValuePath: mergedField.optionValuePath,
            resultsPath: mergedField.resultsPath,
            conditions: mergedField.conditions
          };
          const fullObject = findApiItemByValue(fieldForApi, selected);
          if (fullObject !== undefined) {
            formattedFields[fieldName] = fullObject;
          }
        }
      });

      // Объединяем данные документа с дополнительными полями и данными API
      const documentWithAdditionalFields: EnhancedDocumentData = {
        ...props.document,
        additional_fields: formattedFields,
        api_data: apiData.value
      };

      return {
        templateName: template.id,
        data: documentWithAdditionalFields
      };
    }).filter((doc): doc is { templateName: string; data: EnhancedDocumentData } => doc !== null);

    // Генерируем zip-архив с комплектом документов
    loadingText.value = 'Генерация документов...';
    const zipFilename = props.options?.filename ?
      `${props.options.filename}_комплект` :
      `DocumentSet_${props.document.ref_id ?? 'new'}_${new Date().toISOString().split('T')[0]}`;

    loadingText.value = 'Создание архива...';
    await generateDocumentSet({
      documents,
      zipFilename
    });

    loadingText.value = 'Завершение...';
    emit("update:isOpen", false);
  } catch (error) {
    console.error("Ошибка при генерации документов:", error);
    emit('error', 'Произошла ошибка при генерации документов');
  } finally {
    isGenerating.value = false;
    showLoadingOverlay.value = false;
    loadingText.value = '';
  }
};
</script>

<template>
  <component :is="CustomDialog" :open="isOpen" @update:open="emit('update:isOpen', $event)">
    <CustomDialogContent :class="`max-h-[90vh] overflow-y-auto ${props.class || ''}`">
      <!-- Индикатор загрузки -->
      <component v-if="showLoadingOverlay" :is="CustomLoadingSpinner" :text="loadingText" :overlay="true" />

      <!-- Выбор действия -->
      <div v-if="!selectedAction">
        <component :is="CustomDialogHeader">
          <component :is="CustomDialogTitle">Выберите действие</component>
          <component :is="CustomDialogDescription">
            Выберите, что вы хотите сделать с документом {{ document?.ref_id ? `#${document.ref_id}` : '' }}
          </component>
        </component>

        <div class="py-6 space-y-4">
          <!-- Единичные шаблоны (отчеты) -->
          <div v-for="template in reportTemplates" :key="template.id"
            class="flex items-center justify-between p-6 border-2 border-dashed border-blue-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors cursor-pointer"
            @click="handleActionSelect('report')">
            <div class="flex items-center space-x-4">
              <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z">
                  </path>
                </svg>
              </div>
              <div>
                <h3 class="text-lg font-semibold text-gray-900">{{ template.name }}</h3>
                <p class="text-sm text-gray-600">{{ template.description }}</p>
              </div>
            </div>
            <component :is="CustomButton" variant="outline" class="ml-4">
              Выполнить
            </component>
          </div>

          <!-- Кнопка генерации документов -->
          <div v-if="documentGroups.length > 0"
            class="flex items-center justify-between p-6 border-2 border-dashed border-green-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors cursor-pointer"
            @click="handleActionSelect('documents')">
            <div class="flex items-center space-x-4">
              <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z">
                  </path>
                </svg>
              </div>
              <div>
                <h3 class="text-lg font-semibold text-gray-900">Генерация документов</h3>
                <p class="text-sm text-gray-600">Сгенерировать комплект документов</p>
                <p class="text-xs text-gray-500 mt-1">
                  Доступно {{ allDocumentTemplates.length }} шаблонов в {{ documentGroups.length }} группе(ах)
                </p>
              </div>
            </div>
            <component :is="CustomButton" variant="outline" class="ml-4">
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

      <!-- Выбор шаблонов документов -->
      <div v-else-if="selectedAction === 'documents' && !showAdditionalFieldsDialog">
        <component :is="CustomDialogHeader">
          <component :is="CustomDialogTitle">Выберите документы для генерации</component>
          <component :is="CustomDialogDescription">
            Выберите необходимые документы для генерации комплекта {{ document?.ref_id ? `#${document.ref_id}` : '' }}
          </component>
        </component>

        <div class="py-4 space-y-6 max-h-[60vh] overflow-y-auto">
          <div v-for="group in documentGroups" :key="group.id" class="space-y-4">
            <div class="border-b pb-2">
              <div
                class="flex items-center justify-between cursor-pointer group"
                @click="toggleGroup(group.id)">
                <div class="flex-1">
                  <h3 class="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {{ group.name }}
                  </h3>
                  <p class="text-sm text-gray-600">{{ group.description }}</p>
                </div>
                <div class="ml-4 flex-shrink-0">
                  <svg
                    class="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-all duration-200"
                    :class="{ 'rotate-180': expandedGroups.has(group.id) }"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            <!-- Контент группы с анимацией -->
            <div
              class="transition-all duration-300 ease-in-out overflow-hidden"
              :class="expandedGroups.has(group.id) ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'"
            >
              <div class="space-y-3 pt-2">
                <div v-for="template in group.templates" :key="template.id"
                  class="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <component :is="CustomCheckbox" :id="`template-${template.id}`"
                    :checked="selectedTemplates.has(template.id)" @update:checked="handleTemplateToggle(template.id)"
                    class="mt-1" @click="handleTemplateToggle(template.id)" />
                  <div class="flex-1">
                    <component :is="CustomLabel" :for="`template-${template.id}`" class="font-medium cursor-pointer">
                      {{ template.name }}
                    </component>
                    <p class="text-sm text-muted-foreground mt-1">{{ template.description }}</p>
                    <div v-if="template.additional_fields.length > 0" class="mt-2">
                      <span class="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                        {{ template.additional_fields.length }} дополнительных полей
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <component :is="CustomDialogFooter">
          <component :is="CustomButton" variant="outline" @click="{ selectedAction = null; selectedTemplates.clear() }">
            Назад
          </component>
          <component :is="CustomButton" @click="handleProceedToFields"
            :disabled="selectedTemplates.size === 0 || isGenerating || apiDataLoading">
            Продолжить
            <span v-if="apiDataLoading" class="ml-2">...</span>
          </component>
        </component>
      </div>

      <!-- Диалог ввода дополнительных полей -->
      <div v-else-if="showAdditionalFieldsDialog">
        <component :is="CustomDialogHeader">
          <component :is="CustomDialogTitle">Заполните дополнительные поля</component>
          <component :is="CustomDialogDescription">
            Необходимо заполнить дополнительные поля для выбранных шаблонов
          </component>
        </component>

        <div class="py-4 max-h-[60vh] overflow-y-auto">
          <div v-if="Object.keys(apiData).length > 0" class="mb-4 p-3 bg-muted rounded-md">
            <p class="font-medium">Дополнительные данные загружены с сервера</p>
            <p class="text-sm text-muted-foreground">Данные будут использованы при генерации документов</p>
          </div>

          <div class="space-y-6">
            <!-- Группировка объединенных полей по шаблонам для лучшего UX -->
            <div v-for="template in selectedTemplatesWithFields" :key="template.id" class="space-y-4">
              <div class="border-b pb-2">
                <h4 class="font-medium">{{ template.name }}</h4>
                <p class="text-sm text-muted-foreground">{{ template.description }}</p>
              </div>

              <div class="space-y-4">
                <div v-for="field in mergedFields.filter(field => field.templates.includes(template.id))"
                  :key="`${template.id}-${field.id}`" class="space-y-2">
                  <component :is="CustomLabel" :for="`${template.id}-${field.id}`" class="block">
                    {{ field.name }}
                    <span v-if="field.required" class="text-destructive">*</span>
                    <span v-if="field.templates.length > 1" class="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded ml-2">
                      Используется в {{ field.templates.length }} шаблонах
                    </span>
                  </component>

                  <component v-if="field.type === 'string' || field.type === 'number'" :is="CustomInput"
                    :id="`${template.id}-${field.id}`" :type="field.type === 'number' ? 'number' : 'text'"
                    :placeholder="field.description" v-model="additionalFieldValues[template.id][field.id]"
                    :required="field.required" class="w-full" />

                  <component v-else-if="field.type === 'date'" :is="CustomInput" :id="`${template.id}-${field.id}`"
                    type="date" :placeholder="field.description" v-model="additionalFieldValues[template.id][field.id]"
                    :required="field.required" class="w-full" />

                  <div v-else-if="field.type === 'boolean'" class="flex items-center space-x-2">
                    <component :is="CustomCheckbox" :id="`${template.id}-${field.id}`"
                      v-model="additionalFieldValues[template.id][field.id]" :required="field.required" />
                    <component :is="CustomLabel" :for="`${template.id}-${field.id}`">{{ field.description }}</component>
                  </div>

                  <component v-else-if="field.type === 'select'" :is="CustomSelect"
                    v-model="additionalFieldValues[template.id][field.id]" :required="field.required">
                    <component :is="CustomSelectTrigger" class="w-full">
                      <component :is="CustomSelectValue" :placeholder="field.description" />
                    </component>
                    <component :is="CustomSelectContent">
                      <component v-for="option in field.options" :key="option.value" :is="CustomSelectItem"
                        :value="option.value" :disabled="option.disabled">
                        {{ option.label }}
                      </component>
                    </component>
                  </component>

                  <component v-else-if="field.type === 'api_select'" :is="CustomSelect"
                    v-model="additionalFieldValues[template.id][field.id]" :required="field.required">
                    <component :is="CustomSelectTrigger" class="w-full">
                      <component :is="CustomSelectValue" :placeholder="field.description" />
                    </component>
                    <component :is="CustomSelectContent">
                      <component v-for="option in buildApiSelectOptions(field as AdditionalField)" :key="option.value" :is="CustomSelectItem"
                        :value="option.value">
                        {{ option.label }}
                      </component>
                    </component>
                  </component>

                </div>
              </div>
            </div>
          </div>
        </div>

        <component :is="CustomDialogFooter" class="flex justify-between sm:justify-end sm:space-x-2">
          <component :is="CustomButton" @click="handleGenerateDocuments" :disabled="!isFormValid || isGenerating">
            Сгенерировать комплект
            <span v-if="isGenerating" class="ml-2">...</span>
          </component>
        </component>
      </div>
    </CustomDialogContent>
  </component>
</template>

<style scoped>
/* Стили для hover эффектов */
.hover\:border-blue-300:hover {
  border-color: rgb(147 197 253);
}

.hover\:bg-blue-50:hover {
  background-color: rgb(239 246 255);
}

.hover\:border-green-300:hover {
  border-color: rgb(134 239 172);
}

.hover\:bg-green-50:hover {
  background-color: rgb(240 253 244);
}

.hover\:bg-gray-50:hover {
  background-color: rgb(249 250 251);
}

/* Стили для скролла */
.overflow-y-auto {
  scrollbar-width: thin;
  scrollbar-color: rgb(203 213 225) transparent;
}

.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background-color: rgb(203 213 225);
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background-color: rgb(156 163 175);
}
</style>

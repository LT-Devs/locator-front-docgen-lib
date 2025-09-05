<script setup lang="ts">
import { computed, ref, watch } from "vue";
import _ from "lodash";
import axios from "axios";
import { getConfig, useConfig } from "@/config";
import { documentApi } from "@/api/documentApi";
import type { DocumentData } from "@/types/document_data";

// Импортируем UI компоненты
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

// Импортируем компоненты диалога
import { Dialog } from "@/components/ui/dialog";
import { DialogHeader } from "@/components/ui/dialog";
import { DialogFooter } from "@/components/ui/dialog";
import { DialogTitle } from "@/components/ui/dialog";
import { DialogDescription } from "@/components/ui/dialog";
import CustomDialogContent from "@/components/ui/dialog/CustomDialogContent.vue";

// Типы для API-эндпоинтов (копируем из DocumentDialog)
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

export interface DocumentSetDialogOptions {
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
  options?: DocumentSetDialogOptions;
  class?: string;
}>();

const { generateDocumentSet } = documentApi({
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
const CustomDialog = computed(() => uiComponents.value.Dialog || Dialog);
const CustomDialogHeader = computed(() => uiComponents.value.DialogHeader || DialogHeader);
const CustomDialogFooter = computed(() => uiComponents.value.DialogFooter || DialogFooter);
const CustomDialogTitle = computed(() => uiComponents.value.DialogTitle || DialogTitle);
const CustomDialogDescription = computed(() => uiComponents.value.DialogDescription || DialogDescription);

const isGenerating = ref(false);
const selectedTemplates = ref<Set<string>>(new Set());
const additionalFieldValues = ref<Record<string, Record<string, any>>>({});
const showAdditionalFieldsDialog = ref(false);
const apiDataLoading = ref(false);
const apiData = ref<Record<string, any>>({});
const showLoadingOverlay = ref(false);
const loadingText = ref('');

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
          response = await axios.get(processedUrl, requestConfig);
          break;
        case 'POST':
          response = await axios.post(processedUrl, endpoint.body, requestConfig);
          break;
        case 'PUT':
          response = await axios.put(processedUrl, endpoint.body, requestConfig);
          break;
        case 'DELETE':
          response = await axios.delete(processedUrl, requestConfig);
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
  return props.templates.filter(template => selectedTemplates.value.has(template.id));
});

// Проверка, все ли обязательные поля заполнены для всех выбранных шаблонов
const isFormValid = computed(() => {
  return selectedTemplatesWithFields.value.every(template => {
    const document = props.document || null;
    const filteredFields = template.additional_fields.filter(field =>
      checkAllConditions(field, document)
    );
    
    return filteredFields.every(field =>
      !field.required || additionalFieldValues.value[template.id]?.[field.id] !== undefined
    );
  });
});

// Сброс формы при закрытии диалога
watch(() => props.isOpen, (isOpen) => {
  if (!isOpen) {
    selectedTemplates.value.clear();
    additionalFieldValues.value = {};
    showAdditionalFieldsDialog.value = false;
    apiData.value = {};
  }
});

// Обработчик выбора/снятия выбора шаблона
const handleTemplateToggle = (templateId: string) => {
  if (selectedTemplates.value.has(templateId)) {
    selectedTemplates.value.delete(templateId);
    // Удаляем значения полей для этого шаблона
    delete additionalFieldValues.value[templateId];
  } else {
    selectedTemplates.value.add(templateId);
    // Инициализируем значения полей для этого шаблона
    const template = props.templates.find(t => t.id === templateId);
    if (template) {
      additionalFieldValues.value[templateId] = {};
      // Заполняем дефолтные значения
      template.additional_fields.forEach(field => {
        if (field.defaultValue !== null) {
          additionalFieldValues.value[templateId][field.id] = field.defaultValue;
        }
      });
    }
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
      const template = props.templates.find(t => t.id === templateId);
      if (!template) return null;

      // Форматируем даты перед отправкой
      const formattedFields = { ...additionalFieldValues.value[templateId] };
      
      if (template.additional_fields.length > 0) {
        template.additional_fields.forEach(field => {
          if (field.type === 'date' && formattedFields[field.id]) {
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
    <CustomDialogContent :class="props.class">
      <!-- Индикатор загрузки -->
      <component 
        v-if="showLoadingOverlay" 
        :is="CustomLoadingSpinner" 
        :text="loadingText" 
        :overlay="true" 
      />
      <!-- Диалог выбора шаблонов -->
      <div v-if="!showAdditionalFieldsDialog">
        <component :is="CustomDialogHeader">
          <component :is="CustomDialogTitle">Выберите комплект документов</component>
          <component :is="CustomDialogDescription">
            Выберите необходимые документы для генерации комплекта {{ document?.ref_id ? `#${document.ref_id}` : '' }}
          </component>
        </component>

        <div class="py-4 space-y-4">
          <div v-for="template in templates" :key="template.id"
            class="flex items-start space-x-3 p-4 border rounded-lg">
            <component :is="CustomCheckbox" 
              :id="`template-${template.id}`"
              :checked="selectedTemplates.has(template.id)"
              @update:checked="handleTemplateToggle(template.id)"
              class="mt-1" />
            <div class="flex-1">
              <component :is="CustomLabel" :for="`template-${template.id}`" class="font-medium cursor-pointer">
                {{ template.name }}
              </component>
              <p class="text-sm text-muted-foreground mt-1">{{ template.description }}</p>
            </div>
          </div>
        </div>

        <component :is="CustomDialogFooter">
          <component :is="CustomButton" variant="outline" @click="emit('update:isOpen', false)">
            Отмена
          </component>
          <component :is="CustomButton" 
            @click="handleProceedToFields"
            :disabled="selectedTemplates.size === 0 || isGenerating || apiDataLoading">
            Продолжить
            <span v-if="apiDataLoading" class="ml-2">...</span>
          </component>
        </component>
      </div>

      <!-- Диалог ввода дополнительных полей -->
      <div v-else>
        <component :is="CustomDialogHeader">
          <component :is="CustomDialogTitle">Заполните дополнительные поля</component>
          <component :is="CustomDialogDescription">
            Необходимо заполнить дополнительные поля для выбранных шаблонов
          </component>
        </component>

        <div class="py-4">
          <div v-if="Object.keys(apiData).length > 0" class="mb-4 p-3 bg-muted rounded-md">
            <p class="font-medium">Дополнительные данные загружены с сервера</p>
            <p class="text-sm text-muted-foreground">Данные будут использованы при генерации документов</p>
          </div>

          <div class="space-y-6">
            <div v-for="template in selectedTemplatesWithFields" :key="template.id" class="space-y-4">
              <div class="border-b pb-2">
                <h4 class="font-medium">{{ template.name }}</h4>
                <p class="text-sm text-muted-foreground">{{ template.description }}</p>
              </div>
              
              <div class="space-y-4">
                <div v-for="field in template.additional_fields.filter(field => 
                  checkAllConditions(field, document || null)
                )" :key="`${template.id}-${field.id}`" class="space-y-2">
                  <component :is="CustomLabel" :for="`${template.id}-${field.id}`" class="block">
                    {{ field.name }}
                    <span v-if="field.required" class="text-destructive">*</span>
                  </component>

                  <component v-if="field.type === 'string' || field.type === 'number'" 
                    :is="CustomInput" 
                    :id="`${template.id}-${field.id}`"
                    :type="field.type === 'number' ? 'number' : 'text'" 
                    :placeholder="field.description"
                    v-model="additionalFieldValues[template.id][field.id]" 
                    :required="field.required" 
                    class="w-full" />

                  <component v-else-if="field.type === 'date'" 
                    :is="CustomInput" 
                    :id="`${template.id}-${field.id}`" 
                    type="date"
                    :placeholder="field.description" 
                    v-model="additionalFieldValues[template.id][field.id]" 
                    :required="field.required"
                    class="w-full" />

                  <div v-else-if="field.type === 'boolean'" class="flex items-center space-x-2">
                    <component :is="CustomCheckbox" 
                      :id="`${template.id}-${field.id}`" 
                      v-model="additionalFieldValues[template.id][field.id]"
                      :required="field.required" />
                    <component :is="CustomLabel" :for="`${template.id}-${field.id}`">{{ field.description }}</component>
                  </div>

                  <p class="text-sm text-muted-foreground">{{ field.description }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <component :is="CustomDialogFooter" class="flex justify-between sm:justify-end sm:space-x-2">
          <component :is="CustomButton" variant="outline" @click="showAdditionalFieldsDialog = false"
            :disabled="isGenerating">
            Назад
          </component>
          <component :is="CustomButton" @click="handleGenerateDocuments"
            :disabled="!isFormValid || isGenerating">
            Сгенерировать комплект
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

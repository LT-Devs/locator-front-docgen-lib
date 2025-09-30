<script setup lang="ts">
import { ref } from 'vue';
import UnifiedDocumentDialog from './components/UnifiedDocumentDialog.vue';
import { LoadingSpinner } from './components/ui/loading-spinner';
import type { DocumentData } from './types/document_data';
import type { DocumentTemplate } from './components/UnifiedDocumentDialog.vue';
import documentTemplatesData from './assets/document_templates.json';
import "./style.css"
// Пример данных документа
const sampleDocument: DocumentData = {
  ref_id: "12345",
  metadata: {
    sender: "Иванов И.И.",
    decision_description: "Руководитель отдела"
  }
};

// Загружаем шаблоны из JSON файла с правильной типизацией
const documentTemplates: DocumentTemplate[] = documentTemplatesData as DocumentTemplate[];

// Состояние диалога
const isUnifiedDialogOpen = ref(false);

// Обработчики событий
const handleSuccess = (message: string) => {
  console.log('Success:', message);
  alert(message);
};

const handleError = (message: string) => {
  console.error('Error:', message);
  alert(message);
};
</script>

<template>
  <div id="app">
    <div class="container mx-auto p-8">
      <h1 class="text-3xl font-bold mb-8">Locator Docgen Library Demo</h1>
      
      <div class="space-y-4">
        <div class="p-6 border rounded-lg">
          <h2 class="text-xl font-semibold mb-4">Универсальный диалог документов</h2>
          <p class="text-gray-600 mb-4">Выберите действие: скачать отчет или сгенерировать комплект документов</p>
          <button 
            @click="isUnifiedDialogOpen = true"
            class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium">
            Открыть диалог документов
          </button>
        </div>

        <div class="p-6 border rounded-lg">
          <h2 class="text-xl font-semibold mb-4">Компонент LoadingSpinner</h2>
          <p class="text-gray-600 mb-4">Демонстрация компонента индикатора загрузки</p>
          <div class="space-x-4">
            <LoadingSpinner text="Загрузка..." />
            <LoadingSpinner text="Обработка данных..." />
          </div>
        </div>

        <div class="p-6 border rounded-lg">
          <h2 class="text-xl font-semibold mb-4">Доступные шаблоны</h2>
          <p class="text-gray-600 mb-4">Список доступных шаблонов для генерации</p>
          <div class="space-y-4">
            <!-- Единичные шаблоны (отчеты) -->
            <div v-if="documentTemplates.some(t => !t.templates)" class="space-y-2">
              <h3 class="font-medium text-gray-900">Единичные шаблоны</h3>
              <div v-for="template in documentTemplates.filter(t => !t.templates)" :key="template.id" 
                class="flex items-center justify-between p-3 bg-blue-50 rounded">
                <div>
                  <span class="font-medium">{{ template.name }}</span>
                  <span class="text-sm text-gray-500 ml-2">{{ template.description }}</span>
                </div>
                <span class="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">Шаблон</span>
              </div>
            </div>

            <!-- Группы документов -->
            <div v-for="group in documentTemplates.filter(t => t.templates)" :key="group.id" class="space-y-2">
              <h3 class="font-medium text-gray-900">{{ group.name }}</h3>
              <p class="text-sm text-gray-600 mb-2">{{ group.description }}</p>
              <div class="space-y-1">
                <div v-for="template in group.templates" :key="template.id" 
                  class="flex items-center justify-between p-3 bg-gray-50 rounded ml-4">
                  <div>
                    <span class="font-medium">{{ template.name }}</span>
                    <span class="text-sm text-gray-500 ml-2">{{ template.description }}</span>
                    <span v-if="template.additional_fields.length > 0" class="text-xs text-blue-600 ml-2">
                      ({{ template.additional_fields.length }} полей)
                      <span v-if="template.additional_fields.some(f => f.type === 'select')" class="text-green-600">
                        • Select поля
                      </span>
                    </span>
                  </div>
                  <span class="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">Документ</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Универсальный диалог документов -->
      <UnifiedDocumentDialog
        :is-open="isUnifiedDialogOpen"
        :document="sampleDocument"
        :templates="documentTemplates"
        :options="{ filename: 'sample_document' }"
        @update:is-open="isUnifiedDialogOpen = $event"
        @success="handleSuccess"
        @error="handleError"
      />
    </div>
  </div>
</template>

<style>
#app {
  font-family: Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  margin: 0;
  padding: 20px;
}
</style> 
<script setup lang="ts">
import { ref } from 'vue';
import DocumentDialog from './components/DocumentDialog.vue';
import DocumentSetDialog from './components/DocumentSetDialog.vue';
import { LoadingSpinner } from './components/ui/loading-spinner';
import type { DocumentData } from './types/document_data';

// Пример данных документа
const sampleDocument: DocumentData = {
  ref_id: "12345",
  metadata: {
    sender: "Иванов И.И.",
    decision_description: "Руководитель отдела"
  }
};

// Пример шаблонов документов
const documentTemplates = [
  {
    id: "notification_template",
    name: "Уведомление и сопроводительная документация",
    description: "Стандартный шаблон уведомления и сопроводительной документации",
    additional_fields: []
  },
  {
    id: "report_template", 
    name: "Отчет о работе",
    description: "Шаблон отчета о выполненной работе",
    additional_fields: []
  },
  {
    id: "contract_template",
    name: "Договор",
    description: "Шаблон договора",
    additional_fields: []
  }
];

// Состояние диалогов
const isDocumentDialogOpen = ref(false);
const isDocumentSetDialogOpen = ref(false);

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
          <h2 class="text-xl font-semibold mb-4">Генерация одного документа</h2>
          <p class="text-gray-600 mb-4">Выберите шаблон для генерации одного документа с индикатором загрузки</p>
          <button 
            @click="isDocumentDialogOpen = true"
            class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
            Открыть диалог выбора документа
          </button>
        </div>

        <div class="p-6 border rounded-lg">
          <h2 class="text-xl font-semibold mb-4">Генерация комплекта документов</h2>
          <p class="text-gray-600 mb-4">Выберите несколько шаблонов для генерации комплекта документов в zip-архиве с индикатором загрузки</p>
          <button 
            @click="isDocumentSetDialogOpen = true"
            class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded">
            Открыть диалог выбора комплекта документов
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
      </div>

      <!-- Диалог для одного документа -->
      <DocumentDialog
        :is-open="isDocumentDialogOpen"
        :document="sampleDocument"
        :templates="documentTemplates"
        :options="{ filename: 'sample_document' }"
        @update:is-open="isDocumentDialogOpen = $event"
        @success="handleSuccess"
        @error="handleError"
      />

      <!-- Диалог для комплекта документов -->
      <DocumentSetDialog
        :is-open="isDocumentSetDialogOpen"
        :document="sampleDocument"
        :templates="documentTemplates"
        :options="{ filename: 'sample_document_set' }"
        @update:is-open="isDocumentSetDialogOpen = $event"
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
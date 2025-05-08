import axios from 'axios';
import { getConfig } from '@/config';
import type { DocumentData } from '@/types/document_data';

export interface DocumentGenerationRequest {
    type: string;
    template_fields: string;
    template_name: string;
}

export interface EnhancedDocumentData extends DocumentData {
    additional_fields?: Record<string, any>;
    api_data?: Record<string, any>;
}

export interface DocumentApiOptions {
    onSuccess?: (message: string) => void;
    onError?: (message: string) => void;
}

// Функция для работы с документами
function documentApiFunction(options?: DocumentApiOptions) {
    const config = getConfig();

    async function generateDocument(data: EnhancedDocumentData, templateName: string) {
        try {
            const request: DocumentGenerationRequest = {
                type: "docx",
                template_fields: JSON.stringify(data),
                template_name: templateName
            };

            const response = await axios.post(
                `${config.fileHandlerBackendUrl}${config.generateDocumentPath}`,
                request,
                { responseType: 'blob' }
            );

            // Создаем blob и ссылку для скачивания
            const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Document_${data.ref_id ?? 'new'}_${templateName}.docx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();

            if (options?.onSuccess) {
                options.onSuccess('Документ успешно сгенерирован и загружен');
            }

            return true;
        } catch (error) {
            if (options?.onError) {
                options.onError('Не удалось сгенерировать документ');
            }
            console.error('Ошибка генерации документа', error);
            return false;
        }
    }

    return { generateDocument };
}

// Именованный экспорт
export const documentApi = documentApiFunction;

// Экспорт по умолчанию для совместимости
export default documentApiFunction; 
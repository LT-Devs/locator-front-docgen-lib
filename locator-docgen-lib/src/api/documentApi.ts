import axios from 'axios';
import JSZip from 'jszip';
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
    filename: string | undefined | null;
    onSuccess?: (message: string) => void;
    onError?: (message: string) => void;
}

export interface DocumentSetGenerationRequest {
    documents: Array<{
        templateName: string;
        data: EnhancedDocumentData;
    }>;
    zipFilename?: string;
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
            if (options?.filename == null) {
                a.download = `Document_${data.ref_id ?? 'new'}_${templateName}.docx`;
            }
            else {
                a.download = `${options.filename}.docx`;
            }
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

    async function generateDocumentSet(request: DocumentSetGenerationRequest) {
        try {
            const zip = new JSZip();
            const config = getConfig();

            // Генерируем все документы
            const documentPromises = request.documents.map(async (doc) => {
                const documentRequest: DocumentGenerationRequest = {
                    type: "docx",
                    template_fields: JSON.stringify(doc.data),
                    template_name: doc.templateName
                };

                const response = await axios.post(
                    `${config.fileHandlerBackendUrl}${config.generateDocumentPath}`,
                    documentRequest,
                    { responseType: 'blob' }
                );

                return {
                    filename: `${doc.templateName}.docx`,
                    data: response.data
                };
            });

            const documents = await Promise.all(documentPromises);

            // Добавляем документы в zip-архив
            documents.forEach(doc => {
                zip.file(doc.filename, doc.data);
            });

            // Генерируем zip-архив
            const zipBlob = await zip.generateAsync({ type: 'blob' });

            // Создаем ссылку для скачивания
            const url = window.URL.createObjectURL(zipBlob);
            const a = document.createElement('a');
            a.href = url;
            
            const zipFilename = request.zipFilename || 
                `DocumentSet_${request.documents[0]?.data.ref_id ?? 'new'}_${new Date().toISOString().split('T')[0]}.zip`;
            a.download = zipFilename;
            
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();

            if (options?.onSuccess) {
                options.onSuccess(`Комплект из ${documents.length} документов успешно сгенерирован и загружен`);
            }

            return true;
        } catch (error) {
            if (options?.onError) {
                options.onError('Не удалось сгенерировать комплект документов');
            }
            console.error('Ошибка генерации комплекта документов', error);
            return false;
        }
    }

    return { generateDocument, generateDocumentSet };
}

// Именованный экспорт
export const documentApi = documentApiFunction;

// Экспорт по умолчанию для совместимости
export default documentApiFunction; 
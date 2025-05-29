// Type definitions for locator-docgen-lib
// Project: https://github.com/your-username/locator-docgen-lib
// Definitions by: Your Name

import { App } from 'vue';

export interface DocumentData {
    ref_id?: string;
    [key: string]: any;
}

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

export interface DocgenConfig {
    fileHandlerBackendUrl: string;
    generateDocumentPath: string;
}

export const DocumentDialog: import('vue').DefineComponent<{}, {}, any>;

export const documentApi: (options?: DocumentApiOptions) => {
    generateDocument: (data: EnhancedDocumentData, templateName: string) => Promise<boolean>;
};

export const defaultConfig: DocgenConfig;
export function getConfig(): DocgenConfig;
export function setConfig(config: Partial<DocgenConfig>): void;

export function install(app: App): void;

declare const _default: {
    install: typeof install;
};

export default _default; 
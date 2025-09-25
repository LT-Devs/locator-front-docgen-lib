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

export interface DocumentSetGenerationRequest {
    documents: Array<{
        templateName: string;
        data: EnhancedDocumentData;
    }>;
    zipFilename?: string;
}

export interface DocgenConfig {
    fileHandlerBackendUrl: string;
    generateDocumentPath: string;
}

// Типы для UnifiedDocumentDialog
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
    type: "string" | "number" | "date" | "boolean" | "select";
    description: string;
    required: boolean;
    defaultValue: string | number | boolean | null;
    conditions?: (FieldCondition | ConditionGroup)[];
    options?: SelectOption[];
}

export interface DocumentTemplate {
    id: string;
    name: string;
    description: string;
    api_endpoints?: ApiEndpoint[];
    additional_fields: AdditionalField[];
    type?: "group";
    templates?: DocumentTemplate[];
}

export interface UnifiedDialogOptions {
    filename: string | undefined | null;
    onSuccess?: (message: string) => void;
    onError?: (message: string) => void;
}

export const DocumentDialog: import('vue').DefineComponent<{}, {}, any>;
export const DocumentSetDialog: import('vue').DefineComponent<{}, {}, any>;
export const UnifiedDocumentDialog: import('vue').DefineComponent<{
  isOpen: boolean;
  document?: DocumentData | null;
  templates: DocumentTemplate[];
  options?: UnifiedDialogOptions;
  class?: string;
}, {}, any>;
export const LoadingSpinner: import('vue').DefineComponent<{
  text?: string;
  overlay?: boolean;
}, {}, any>;

export const documentApi: (options?: DocumentApiOptions) => {
    generateDocument: (data: EnhancedDocumentData, templateName: string) => Promise<boolean>;
    generateDocumentSet: (request: DocumentSetGenerationRequest) => Promise<boolean>;
};

export const defaultConfig: DocgenConfig;
export function getConfig(): DocgenConfig;
export function setConfig(config: Partial<DocgenConfig>): void;

export function install(app: App): void;

declare const _default: {
    install: typeof install;
};

export default _default; 
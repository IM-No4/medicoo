import { apiClient } from './client';

export interface Document {
    _id: string;
    userId: string;
    sourceType: string;
    name: string;
    documentType: string;
    sourceName?: string;
    fileUrl: string;
    fileType: string;
    mimeType: string;
    size: number;
    isDeleted: boolean;
    canDelete: boolean;
    createdAt: string;
    updatedAt: string;
}

export const fetchDocuments = async (): Promise<Document[]> => {
    const response = await apiClient.get<Document[]>('/api/user/documents');
    return response.data;
};

export const uploadDocument = async (formData: FormData): Promise<Document> => {
    const response = await apiClient.post<Document>('/api/user/documents/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

export const deleteDocument = async (documentId: string): Promise<void> => {
    await apiClient.delete(`/api/user/documents/${documentId}`);
};

export const getDocumentViewUrl = (documentId: string): string => {
    return `${apiClient.defaults.baseURL}/api/user/documents/${documentId}/view`;
};

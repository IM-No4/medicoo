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
    // Content-Type must be set explicitly here - confirmed via a live device
    // trace (adb logcat) that without it, axios's transformRequest falls
    // back to 'application/x-www-form-urlencoded' for a FormData body in
    // this RN/axios setup. React Native's native NetworkingModule still
    // detects the FormData shape and tries to build a real multipart body
    // regardless, but then hands OkHttp a Content-Type that doesn't start
    // with "multipart" - OkHttp's MultipartBody.Builder.setType() throws
    // IllegalArgumentException("multipart != ...") instantly, before any
    // network activity, which surfaces here as a generic client-side
    // "Network Error". React Native's bridge appends the real boundary
    // itself, so a bare 'multipart/form-data' (no boundary) is correct.
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

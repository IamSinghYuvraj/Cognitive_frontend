import apiClient from "./apiClient";
import { Document } from "./types";

export const documentAPI = {
  async uploadDocument(
    contextId: string,
    file: File,
    onUploadProgress: (progress: number) => void
  ): Promise<{ document_id: string; message: string }> {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await apiClient.post(
        `/api/documents/upload?context_id=${contextId}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / (progressEvent.total || 1)
            );
            onUploadProgress(percentCompleted);
          },
        }
      );
      return response.data;
    } catch (error) {
      // Re-throw the error to be handled by the calling component
      throw error;
    }
  },

  async getDocuments(contextId: string): Promise<{ data: Document[] }> {
    return apiClient.get(`/api/documents/context/${contextId}`);
  },

  async deleteDocument(documentId: string): Promise<void> {
    return apiClient.delete(`/api/documents/${documentId}`);
  },
};
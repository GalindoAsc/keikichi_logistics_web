import api from "./client";

export interface FileUploadResponse {
    file_path: string;
    filename: string;
    file_type: string;
}

/**
 * Upload a file for a quote (label or bond document)
 */
export async function uploadQuoteFile(
    file: File,
    fileType: "label" | "bond"
): Promise<FileUploadResponse> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("file_type", fileType);

    const response = await api.post<FileUploadResponse>("/quote-files/upload", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
    return response.data;
}

/**
 * Delete an uploaded quote file
 */
export async function deleteQuoteFile(fileType: "label" | "bond", filename: string): Promise<void> {
    await api.delete(`/quote-files/${fileType}/${filename}`);
}

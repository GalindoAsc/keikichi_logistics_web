import { useState } from 'react';
import { Upload, X, CheckCircle } from "lucide-react";
import api from '../../api/client';
import { compressImage } from '../../lib/imageCompression';

interface FileUploadProps {
    label: string;
    docType: 'fianza' | 'contrato' | 'etiquetas' | 'comprobante_pago' | 'constancia_fiscal' | 'otro';
    onUploadComplete: (fileId: string) => void;
    accept?: string;
    className?: string;
}

export const FileUpload = ({ label, docType, onUploadComplete, accept = ".pdf,.jpg,.png", className = "" }: FileUploadProps) => {
    const [isUploading, setIsUploading] = useState(false);
    const [fileName, setFileName] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        let file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        setError(null);

        // Compress images before upload
        if (file.type.startsWith('image/')) {
            file = await compressImage(file);
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('doc_type', docType);

        try {
            const response = await api.post('/documents/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            setFileName(file.name);
            onUploadComplete(response.data.id);
        } catch (err) {
            console.error(err);
            setError("Error al subir archivo");
        } finally {
            setIsUploading(false);
        }
    };

    const clearFile = () => {
        setFileName(null);
    };

    return (
        <div className={`border border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-4 bg-slate-50 dark:bg-slate-800/50 ${className}`}>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{label}</p>

            {!fileName ? (
                <div className="relative">
                    <input
                        type="file"
                        accept={accept}
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        disabled={isUploading}
                    />
                    <div className="flex flex-col items-center justify-center py-4 text-slate-500 dark:text-slate-400">
                        {isUploading ? (
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mb-2"></div>
                        ) : (
                            <Upload className="w-6 h-6 mb-2" />
                        )}
                        <span className="text-xs">{isUploading ? "Subiendo..." : "Click para subir archivo"}</span>
                    </div>
                </div>
            ) : (
                <div className="flex items-center justify-between bg-white dark:bg-slate-700 p-2 rounded border border-slate-200 dark:border-slate-600">
                    <div className="flex items-center gap-2 overflow-hidden">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm text-slate-600 dark:text-slate-200 truncate">{fileName}</span>
                    </div>
                    <button
                        onClick={clearFile}
                        className="text-slate-400 hover:text-red-500 transition-colors"
                        type="button"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
    );
};

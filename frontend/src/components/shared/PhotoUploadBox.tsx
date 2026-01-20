import { useRef, ChangeEvent } from 'react';
import { Upload, CheckCircle, Camera, Image as ImageIcon } from 'lucide-react';
import { compressImage } from '../../lib/imageCompression';

interface Props {
    label: string;
    icon?: React.ReactNode;
    file: File | null;
    onFileSelect: (file: File | null) => void;
    instructions?: string;
    highlight?: boolean;
    captureMode?: 'user' | 'environment';
}

export function PhotoUploadBox({ label, icon, file, onFileSelect, instructions, highlight, captureMode }: Props) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            // Compress image before passing to parent
            const compressed = await compressImage(e.target.files[0]);
            onFileSelect(compressed);
        }
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const compressed = await compressImage(e.dataTransfer.files[0]);
            onFileSelect(compressed);
        }
    };

    return (
        <div
            className={`relative border-2 border-dashed rounded-xl p-4 transition-all ${file
                ? 'border-green-500 bg-green-50 dark:bg-green-900/20 dark:border-green-700'
                : highlight
                    ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-700'
                    : 'border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
        >
            {/* Standard File Input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
            />

            {/* Camera Input */}
            <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture={captureMode}
                onChange={handleFileChange}
                className="hidden"
            />

            {file ? (
                <div className="flex flex-col items-center text-center">
                    <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-2">
                        <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <p className="font-medium text-slate-900 dark:text-white text-sm truncate max-w-full px-2">
                        {file.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white underline"
                        >
                            Cambiar
                        </button>
                        <button
                            type="button"
                            onClick={() => onFileSelect(null)}
                            className="text-xs font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 underline"
                        >
                            Eliminar
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center text-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${highlight ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                        }`}>
                        {icon || <Upload className="w-5 h-5" />}
                    </div>
                    <h3 className="font-medium text-slate-900 dark:text-white text-sm">{label}</h3>
                    {instructions && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-3">{instructions}</p>
                    )}

                    <div className="flex gap-2 mt-2">
                        <button
                            type="button"
                            onClick={() => cameraInputRef.current?.click()}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 hover:border-slate-300 dark:hover:border-slate-500 transition-colors shadow-sm"
                        >
                            <Camera className="w-3.5 h-3.5" />
                            Cámara
                        </button>
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 hover:border-slate-300 dark:hover:border-slate-500 transition-colors shadow-sm"
                        >
                            <ImageIcon className="w-3.5 h-3.5" />
                            Galería
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

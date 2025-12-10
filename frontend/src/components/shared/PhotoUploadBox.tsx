import { useRef, ChangeEvent } from 'react';
import { Upload, CheckCircle, Camera, Image as ImageIcon } from 'lucide-react';

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

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onFileSelect(e.target.files[0]);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            onFileSelect(e.dataTransfer.files[0]);
        }
    };

    return (
        <div
            className={`relative border-2 border-dashed rounded-xl p-4 transition-all ${file
                ? 'border-green-500 bg-green-50'
                : highlight
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'
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
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mb-2">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <p className="font-medium text-slate-900 text-sm truncate max-w-full px-2">
                        {file.name}
                    </p>
                    <p className="text-xs text-slate-500 mb-3">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="text-xs font-medium text-slate-600 hover:text-slate-900 underline"
                        >
                            Cambiar
                        </button>
                        <button
                            type="button"
                            onClick={() => onFileSelect(null)}
                            className="text-xs font-medium text-red-600 hover:text-red-700 underline"
                        >
                            Eliminar
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center text-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${highlight ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'
                        }`}>
                        {icon || <Upload className="w-5 h-5" />}
                    </div>
                    <h3 className="font-medium text-slate-900 text-sm">{label}</h3>
                    {instructions && (
                        <p className="text-xs text-slate-500 mt-1 mb-3">{instructions}</p>
                    )}

                    <div className="flex gap-2 mt-2">
                        <button
                            type="button"
                            onClick={() => cameraInputRef.current?.click()}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-sm"
                        >
                            <Camera className="w-3.5 h-3.5" />
                            Cámara
                        </button>
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-sm"
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

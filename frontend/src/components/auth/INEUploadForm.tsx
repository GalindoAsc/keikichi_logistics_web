import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { CreditCard, Camera, Info } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../api/client';
import { PhotoUploadBox } from '../shared/PhotoUploadBox';
import { ImagePreview } from '../shared/ImagePreview';
import LoadingSpinner from '../shared/LoadingSpinner';

interface Props {
    onComplete: () => void;
}

export function INEUploadForm({ onComplete }: Props) {
    const [frontFile, setFrontFile] = useState<File | null>(null);
    const [backFile, setBackFile] = useState<File | null>(null);
    const [selfieFile, setSelfieFile] = useState<File | null>(null);

    const uploadMutation = useMutation({
        mutationFn: async () => {
            const formData = new FormData();
            formData.append("ine_front", frontFile!);
            formData.append("ine_back", backFile!);
            formData.append("ine_selfie", selfieFile!);

            return api.post("/verifications/ine", formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
        },
        onSuccess: () => {
            toast.success("Documentos enviados correctamente");
            onComplete();
        },
        onError: () => {
            toast.error("Error al subir documentos. Inténtalo de nuevo.");
        }
    });

    const allFilesUploaded = frontFile && backFile && selfieFile;

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-slate-900">Verifica tu Identidad</h2>
                <p className="text-slate-600 mt-2">
                    Necesitamos 3 fotos de tu INE para verificar tu identidad y activar tu cuenta.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Front */}
                <PhotoUploadBox
                    label="1. Frente de INE"
                    icon={<CreditCard className="w-5 h-5" />}
                    file={frontFile}
                    onFileSelect={setFrontFile}
                    instructions="Asegúrate que se vea clara"
                    captureMode="environment"
                />

                {/* Back */}
                <PhotoUploadBox
                    label="2. Reverso de INE"
                    icon={<CreditCard className="w-5 h-5" />}
                    file={backFile}
                    onFileSelect={setBackFile}
                    instructions="Captura el lado de atrás"
                    captureMode="environment"
                />

                {/* Selfie */}
                <PhotoUploadBox
                    label="3. Selfie con INE"
                    icon={<Camera className="w-5 h-5" />}
                    file={selfieFile}
                    onFileSelect={setSelfieFile}
                    instructions="Sostén tu INE junto a tu cara"
                    highlight
                    captureMode="user"
                />
            </div>

            {/* Preview row */}
            {(frontFile || backFile || selfieFile) && (
                <div className="flex justify-center gap-4 py-2">
                    {frontFile && <ImagePreview file={frontFile} label="Frente" />}
                    {backFile && <ImagePreview file={backFile} label="Reverso" />}
                    {selfieFile && <ImagePreview file={selfieFile} label="Selfie" />}
                </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex gap-3">
                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-900">
                        <strong>¿Por qué necesitamos esto?</strong>
                        <p className="mt-1 text-blue-800">
                            La selfie sosteniendo tu INE nos ayuda a verificar que realmente
                            eres tú quien se está registrando y previene el robo de identidad.
                            Tus datos están protegidos.
                        </p>
                    </div>
                </div>
            </div>

            <button
                disabled={!allFilesUploaded || uploadMutation.isPending}
                onClick={() => uploadMutation.mutate()}
                className="w-full bg-blue-600 text-white rounded-lg py-3 font-medium hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
                {uploadMutation.isPending ? (
                    <>
                        <LoadingSpinner size="sm" />
                        Subiendo documentos...
                    </>
                ) : (
                    'Enviar para Verificación'
                )}
            </button>
        </div>
    );
}

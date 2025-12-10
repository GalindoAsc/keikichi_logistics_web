import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Check, X, AlertCircle, Download } from 'lucide-react';
import api from '../../api/client';
import { User } from '../../types/auth';
import LoadingSpinner from '../shared/LoadingSpinner';

interface Props {
    user: User;
    onClose: () => void;
}

export function VerificationReviewPanel({ user, onClose }: Props) {
    const queryClient = useQueryClient();
    const [notes, setNotes] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');
    const [showRejectModal, setShowRejectModal] = useState(false);

    const approveMutation = useMutation({
        mutationFn: async () => {
            const formData = new FormData();
            formData.append('notes', notes || '');
            return api.post(`/admin/verifications/${user.id}/approve`, formData);
        },
        onSuccess: async () => {
            toast.success('Usuario verificado exitosamente');
            await queryClient.invalidateQueries({ queryKey: ['pending-verifications'], refetchType: 'all' });
            onClose();
        },
        onError: () => toast.error('Error al aprobar usuario')
    });

    const rejectMutation = useMutation({
        mutationFn: async () => {
            const formData = new FormData();
            formData.append('reason', rejectionReason);
            return api.post(`/admin/verifications/${user.id}/reject`, formData);
        },
        onSuccess: () => {
            toast.success('Verificación rechazada');
            queryClient.invalidateQueries({ queryKey: ['pending-verifications'] });
            onClose();
        },
        onError: () => toast.error('Error al rechazar verificación')
    });

    const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

    // Helper to get file URL
    const getFileUrl = (fileId?: string) => fileId ? `/api/v1/files/${fileId}/content` : '';

    return (
        <>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm overflow-hidden transition-colors">
                <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-start transition-colors">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{user.full_name}</h2>
                        <p className="text-slate-600 dark:text-slate-400">{user.email || user.phone}</p>
                    </div>
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-full text-sm font-medium">
                        Pendiente de Revisión
                    </span>
                </div>

                <div className="p-6 space-y-8">
                    {/* Photos Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { label: '1. Frente de INE', fileId: user.ine_front_file_id },
                            { label: '2. Reverso de INE', fileId: user.ine_back_file_id },
                            { label: '3. Selfie con INE', fileId: user.ine_selfie_file_id }
                        ].map((item, index) => (
                            <div key={index} className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block">{item.label}</label>
                                <div
                                    className="group relative aspect-[3/2] bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
                                    onClick={() => item.fileId && setPreviewImage({ url: getFileUrl(item.fileId), title: item.label })}
                                >
                                    {/* @ts-ignore */}
                                    <img src={getFileUrl(item.fileId)} alt={item.label} className="w-full h-full object-contain" />

                                    {/* Overlay Actions */}
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center gap-2">
                                        <div
                                            onClick={(e) => e.stopPropagation()}
                                            className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <a
                                                href={getFileUrl(item.fileId)}
                                                download
                                                className="p-2 bg-white text-slate-700 rounded-full hover:bg-slate-100 transition-colors shadow-sm flex items-center justify-center"
                                                title="Descargar imagen"
                                            >
                                                <Download className="w-5 h-5" />
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Checklist */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors">
                        <h3 className="font-medium text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                            <Check className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                            Puntos a verificar
                        </h3>
                        <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                            <li className="flex items-center gap-2">
                                <input type="checkbox" className="rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700" />
                                <span>Las fotos son claras y legibles</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <input type="checkbox" className="rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700" />
                                <span>La persona en la selfie coincide con la foto de la INE</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <input type="checkbox" className="rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700" />
                                <span>La INE está vigente y sin alteraciones</span>
                            </li>
                        </ul>
                    </div>

                    {/* Actions */}
                    {!showRejectModal ? (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Notas internas (opcional)
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="w-full p-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                    rows={2}
                                    placeholder="Observaciones visibles solo para admins..."
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => approveMutation.mutate()}
                                    disabled={approveMutation.isPending}
                                    className="flex-1 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white py-2.5 rounded-lg font-medium flex justify-center items-center gap-2 transition-colors"
                                >
                                    {approveMutation.isPending ? <LoadingSpinner size="sm" /> : (
                                        <>
                                            <Check className="w-4 h-4" /> Aprobar Verificación
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={() => setShowRejectModal(true)}
                                    className="flex-1 bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/30 py-2.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 font-medium flex justify-center items-center gap-2 transition-colors"
                                >
                                    <X className="w-4 h-4" /> Rechazar
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-lg border border-red-100 dark:border-red-900/20 animate-in fade-in slide-in-from-top-2 transition-colors">
                            <h3 className="font-medium text-red-900 dark:text-red-300 mb-2 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" />
                                Motivo del rechazo
                            </h3>
                            <textarea
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                className="w-full p-2 border border-red-200 dark:border-red-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg text-sm mb-3 focus:ring-red-500 focus:border-red-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                rows={3}
                                placeholder="Explica por qué se rechazaron los documentos (visible para el usuario)..."
                                autoFocus
                            />
                            <div className="flex gap-2 justify-end">
                                <button
                                    onClick={() => setShowRejectModal(false)}
                                    className="px-3 py-1.5 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => rejectMutation.mutate()}
                                    disabled={!rejectionReason || rejectMutation.isPending}
                                    className="px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 transition-colors"
                                >
                                    {rejectMutation.isPending ? 'Rechazando...' : 'Confirmar Rechazo'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Image Preview Modal */}
            {previewImage && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => setPreviewImage(null)}
                >
                    <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center">
                        <button
                            onClick={() => setPreviewImage(null)}
                            className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
                        >
                            <X className="w-8 h-8" />
                        </button>
                        <img
                            src={previewImage.url}
                            alt={previewImage.title}
                            className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        />
                        <p className="text-white mt-4 font-medium text-lg">{previewImage.title}</p>
                    </div>
                </div>
            )}
        </>
    );
}

import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Upload, FileText, Trash2, Download, CheckCircle, Eye } from "lucide-react";
import { toast } from "sonner";
import api from "../../api/client";
import LoadingSpinner from "../../components/shared/LoadingSpinner";

interface ClientDocument {
    id: string;
    client_id: string;
    doc_type: string;
    display_name?: string;
    filename: string;
    file_path: string;
    created_at: string;
    expires_at?: string;
    is_approved: boolean;
}

interface User {
    id: string;
    full_name: string;
    email: string;
    phone?: string;
}

const docTypes = [
    { id: "contrato", label: "Contratos" },
    { id: "etiquetas", label: "Etiquetas" },
    { id: "fianza", label: "Fianzas" },
    { id: "constancia_fiscal", label: "Fiscal" },
    { id: "otro", label: "Otros" },
];

import ConfirmationModal from "../../components/shared/ConfirmationModal";
import { useSocketEvents } from "../../hooks/useSocketEvents";

const ClientFilesPage = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState("contrato");
    const [isUploading, setIsUploading] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [documentToDelete, setDocumentToDelete] = useState<ClientDocument | null>(null);

    const { data: user, isLoading: isLoadingUser } = useQuery({
        queryKey: ["user", userId],
        queryFn: async () => (await api.get<User>(`/admin/users/${userId}`)).data,
        enabled: !!userId,
    });

    const { data: documents = [], isLoading: isLoadingDocs } = useQuery({
        queryKey: ["documents", userId],
        queryFn: async () => (await api.get<ClientDocument[]>(`/documents/user/${userId}`)).data,
        enabled: !!userId,
    });

    const uploadMutation = useMutation({
        mutationFn: async (formData: FormData) => {
            await api.post("/documents/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["documents", userId] });
            toast.success("Documento subido correctamente");
            setIsUploading(false);
        },
        onError: () => {
            toast.error("Error al subir documento");
            setIsUploading(false);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (docId: string) => {
            await api.delete(`/documents/${docId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["documents", userId] });
            toast.success("Documento eliminado");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.detail || "Error al eliminar documento");
        },
    });

    const approveMutation = useMutation({
        mutationFn: async (docId: string) => {
            await api.patch(`/documents/${docId}/approve`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["documents", userId] });
            toast.success("Documento aprobado");
        },
        onError: () => {
            toast.error("Error al aprobar documento");
        },
    });

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const formData = new FormData();
            formData.append("file", file);
            formData.append("client_id", userId!);
            formData.append("doc_type", activeTab);

            setIsUploading(true);
            uploadMutation.mutate(formData);
        }
    };

    const handleView = async (doc: ClientDocument) => {
        try {
            const response = await api.get(`/documents/${doc.id}/download`, {
                params: { inline: true },
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data], { type: response.headers['content-type'] }));
            window.open(url, '_blank');
        } catch (error) {
            toast.error("Error al abrir el documento");
        }
    };

    const handleDownload = async (doc: ClientDocument) => {
        try {
            const response = await api.get(`/documents/${doc.id}/download`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', doc.filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            toast.error("Error al descargar el documento");
        }
    };

    // Real-time updates
    useSocketEvents(["DOCUMENT_UPLOADED", "DOCUMENT_DELETED"], (data, event) => {
        console.log("ClientFilesPage received event:", event, data);
        console.log("Current userId:", userId);

        // Always invalidate to ensure update - ID check might be failing
        console.log("Invalidating ALL document queries");
        queryClient.invalidateQueries({ queryKey: ["documents"] });
    });

    const filteredDocs = documents.filter((doc) => doc.doc_type === activeTab);

    if (isLoadingUser || isLoadingDocs) {
        return (
            <div className="flex justify-center py-12">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <button
                onClick={() => navigate("/admin/accounts")}
                className="flex items-center text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver a Cuentas
            </button>

            <div className="bg-white dark:bg-keikichi-forest-800 rounded-xl shadow-sm border border-keikichi-lime-200 dark:border-keikichi-forest-600 overflow-hidden transition-colors">
                <div className="p-6 border-b border-keikichi-lime-200 dark:border-keikichi-forest-600 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-keikichi-forest-800 dark:text-white">Expediente de Cliente</h1>
                        {user && (
                            <p className="text-keikichi-forest-500 dark:text-keikichi-lime-400">
                                {user.full_name} {user.email && `(${user.email})`}
                            </p>
                        )}
                    </div>
                    <div>
                        <label className={`flex items-center gap-2 bg-keikichi-lime-600 text-white px-4 py-2 rounded-lg hover:bg-keikichi-lime-700 cursor-pointer transition-colors ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                            <Upload className="w-4 h-4" />
                            {isUploading ? "Subiendo..." : "Subir Documento"}
                            <input
                                type="file"
                                className="hidden"
                                onChange={handleFileUpload}
                                disabled={isUploading}
                            />
                        </label>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-keikichi-lime-200 dark:border-keikichi-forest-600 overflow-x-auto">
                    {docTypes.map((type) => (
                        <button
                            key={type.id}
                            onClick={() => setActiveTab(type.id)}
                            className={`px-6 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${activeTab === type.id
                                ? "border-keikichi-lime-600 text-keikichi-lime-600 dark:text-keikichi-lime-400 dark:border-keikichi-lime-400"
                                : "border-transparent text-keikichi-forest-500 dark:text-keikichi-lime-400 hover:text-keikichi-forest-700 dark:hover:text-keikichi-lime-200 hover:border-keikichi-lime-300 dark:hover:border-keikichi-forest-600"
                                }`}
                        >
                            {type.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="p-6">
                    {filteredDocs.length === 0 ? (
                        <div className="text-center py-12 bg-keikichi-lime-50 dark:bg-keikichi-forest-800/50 rounded-lg border border-dashed border-keikichi-lime-300 dark:border-keikichi-forest-600">
                            <FileText className="w-12 h-12 text-keikichi-forest-300 dark:text-keikichi-forest-600 mx-auto mb-3" />
                            <p className="text-keikichi-forest-500 dark:text-keikichi-lime-400">No hay documentos en esta categoría</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredDocs.map((doc) => (
                                <div key={doc.id} className="border border-keikichi-lime-200 dark:border-keikichi-forest-600 rounded-lg p-4 hover:shadow-md dark:hover:shadow-keikichi-forest-800/30 transition-shadow relative group bg-white dark:bg-keikichi-forest-800">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="p-2 bg-keikichi-lime-50 dark:bg-keikichi-forest-700 text-keikichi-lime-600 dark:text-keikichi-lime-400 rounded-lg">
                                            <FileText className="w-6 h-6" />
                                        </div>
                                        <div className="flex gap-1">
                                            {!doc.is_approved && (
                                                <button
                                                    onClick={() => approveMutation.mutate(doc.id)}
                                                    className="p-1.5 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                                                    title="Aprobar Documento"
                                                >
                                                    <CheckCircle className="w-5 h-5" />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => {
                                                    setDocumentToDelete(doc);
                                                    setDeleteModalOpen(true);
                                                }}
                                                className="p-1.5 text-keikichi-forest-400 dark:text-keikichi-forest-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                title="Eliminar"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                    <h3 className="font-medium text-keikichi-forest-900 dark:text-white truncate mb-1" title={doc.display_name || doc.filename}>
                                        {doc.display_name || doc.filename}
                                    </h3>
                                    {doc.display_name && (
                                        <p className="text-xs text-keikichi-forest-400 dark:text-keikichi-forest-500 truncate mb-1">{doc.filename}</p>
                                    )}
                                    <div className="flex items-center justify-between mb-4">
                                        <p className="text-xs text-keikichi-forest-500 dark:text-keikichi-lime-400">
                                            {new Date(doc.created_at).toLocaleDateString()}
                                        </p>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${doc.is_approved ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-keikichi-yellow-100 text-keikichi-yellow-700 dark:bg-keikichi-yellow-900/30 dark:text-keikichi-yellow-400'}`}>
                                            {doc.is_approved ? 'Aprobado' : 'Pendiente'}
                                        </span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleView(doc)}
                                            className="flex-1 flex items-center justify-center gap-2 text-sm bg-keikichi-lime-50 dark:bg-keikichi-forest-700 text-keikichi-forest-700 dark:text-keikichi-lime-300 py-2 rounded hover:bg-keikichi-lime-100 dark:hover:bg-keikichi-forest-600 transition-colors"
                                        >
                                            <Eye className="w-4 h-4" />
                                            Ver
                                        </button>
                                        <button
                                            onClick={() => handleDownload(doc)}
                                            className="flex-1 flex items-center justify-center gap-2 text-sm bg-keikichi-lime-50 dark:bg-keikichi-forest-700 text-keikichi-forest-700 dark:text-keikichi-lime-300 py-2 rounded hover:bg-keikichi-lime-100 dark:hover:bg-keikichi-forest-600 transition-colors"
                                        >
                                            <Download className="w-4 h-4" />
                                            Descargar
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <ConfirmationModal
                isOpen={deleteModalOpen}
                onClose={() => {
                    setDeleteModalOpen(false);
                    setDocumentToDelete(null);
                }}
                onConfirm={() => {
                    if (documentToDelete) {
                        deleteMutation.mutate(documentToDelete.id);
                    }
                }}
                title="Eliminar Documento"
                message={`¿Estás seguro de que deseas eliminar el documento "${documentToDelete?.display_name || documentToDelete?.filename}"? Esta acción no se puede deshacer.`}
                confirmText="Eliminar"
                cancelText="Cancelar"
                isDestructive={true}
            />
        </div >
    );
};

export default ClientFilesPage;

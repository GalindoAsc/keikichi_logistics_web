import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Upload, FileText, Trash2, Download, Eye } from "lucide-react";
import { toast } from "sonner";
import api from "../../api/client";
import { authStore } from "../../stores/authStore";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import ConfirmationModal from "../../components/shared/ConfirmationModal";
import { useSocketEvents } from "../../hooks/useSocketEvents";

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

const docTypes = [
    { id: "contrato", label: "Contratos" },
    { id: "etiquetas", label: "Etiquetas" },
    { id: "fianza", label: "Fianzas" },
    { id: "constancia_fiscal", label: "Fiscal" },
    { id: "otro", label: "Otros" },
];

const MyFilesPage = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { user } = authStore();
    const [activeTab, setActiveTab] = useState("contrato");
    const [isUploading, setIsUploading] = useState(false);
    const [displayName, setDisplayName] = useState("");
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { data: documents = [], isLoading } = useQuery({
        queryKey: ["my-documents", user?.id],
        queryFn: async () => (await api.get<ClientDocument[]>(`/documents/user/${user?.id}`)).data,
        enabled: !!user?.id,
    });

    const uploadMutation = useMutation({
        mutationFn: async (formData: FormData) => {
            await api.post("/documents/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["my-documents", user?.id] });
            toast.success("Documento subido correctamente");
            setIsUploading(false);
            setDisplayName("");
            if (fileInputRef.current) fileInputRef.current.value = "";
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
            queryClient.invalidateQueries({ queryKey: ["my-documents", user?.id] });
            toast.success("Documento eliminado");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.detail || "Error al eliminar documento");
        },
    });

    // Real-time updates
    // Use a single listener for all document events to avoid multiple socket connections
    useSocketEvents(["DOCUMENT_UPDATED", "DOCUMENT_APPROVED", "DOCUMENT_DELETED"], (data, event) => {
        console.log("MyFilesPage received event:", event, data);

        // Invalidate all my-documents queries to be safe
        queryClient.invalidateQueries({ queryKey: ["my-documents"] });

        if (event === "DOCUMENT_APPROVED") {
            toast.success("¡Un documento ha sido aprobado!");
        } else if (event === "DOCUMENT_DELETED") {
            toast.info("Un documento ha sido eliminado");
        }
    });

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const formData = new FormData();
            formData.append("file", file);
            formData.append("doc_type", activeTab);
            if (displayName.trim()) {
                formData.append("display_name", displayName.trim());
            }

            setIsUploading(true);
            uploadMutation.mutate(formData);
        }
    };



    const filteredDocs = documents.filter((doc) => doc.doc_type === activeTab);

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <button
                onClick={() => navigate("/profile")}
                className="flex items-center text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver al Perfil
            </button>

            <div className="bg-white dark:bg-keikichi-forest-800 rounded-xl shadow-sm border border-slate-200 dark:border-keikichi-forest-600 overflow-hidden">
                <div className="p-6 border-b border-slate-200 dark:border-keikichi-forest-600">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Mis Documentos</h1>
                            <p className="text-slate-500 dark:text-slate-400">Gestiona tus archivos y documentos legales</p>
                        </div>

                        <div className="flex items-center gap-2 bg-slate-50 dark:bg-keikichi-forest-700 p-2 rounded-lg border border-slate-200 dark:border-keikichi-forest-600 w-full md:w-auto">
                            <input
                                type="text"
                                placeholder="Nombre opcional (ej. Constancia 2024)"
                                className="bg-transparent border-none text-sm focus:ring-0 w-full md:w-64 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                            />
                            <label
                                className={`flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <Upload className="w-4 h-4" />
                                {isUploading ? "Subiendo..." : "Subir"}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    className="hidden"
                                    onChange={handleFileUpload}
                                    disabled={isUploading}
                                />
                            </label>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex overflow-x-auto">
                        {docTypes.map((type) => (
                            <button
                                key={type.id}
                                onClick={() => setActiveTab(type.id)}
                                className={`px-6 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${activeTab === type.id
                                    ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                                    : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600"
                                    }`}
                            >
                                {type.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {isLoading ? (
                        <div className="flex justify-center py-12">
                            <LoadingSpinner />
                        </div>
                    ) : filteredDocs.length === 0 ? (
                        <div className="text-center py-12 bg-slate-50 dark:bg-keikichi-forest-700 rounded-lg border border-dashed border-slate-300 dark:border-keikichi-forest-600">
                            <FileText className="w-12 h-12 text-slate-300 dark:text-slate-500 mx-auto mb-3" />
                            <p className="text-slate-500 dark:text-slate-400">No hay documentos en esta categoría</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredDocs.map((doc) => (
                                <div key={doc.id} className="border border-slate-200 dark:border-keikichi-forest-600 rounded-lg p-4 hover:shadow-md transition-shadow relative group bg-white dark:bg-keikichi-forest-700">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                                            <FileText className="w-6 h-6" />
                                        </div>
                                        {/* Allow delete if not approved */}
                                        {(!doc.is_approved || user?.role === 'superadmin') && (
                                            <button
                                                onClick={() => {
                                                    setSelectedDocId(doc.id);
                                                    setIsDeleteModalOpen(true);
                                                }}
                                                className="text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                                                title="Eliminar"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                    <h3 className="font-medium text-slate-900 dark:text-white truncate mb-1" title={doc.display_name || doc.filename}>
                                        {doc.display_name || doc.filename}
                                    </h3>
                                    {doc.display_name && (
                                        <p className="text-xs text-slate-400 dark:text-slate-500 truncate mb-1">{doc.filename}</p>
                                    )}
                                    <div className="flex items-center justify-between mb-4">
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            {new Date(doc.created_at).toLocaleDateString()}
                                        </p>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${doc.is_approved ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'}`}>
                                            {doc.is_approved ? 'Aprobado' : 'Pendiente'}
                                        </span>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => window.open(`${api.defaults.baseURL}/documents/${doc.id}/download?inline=true`, '_blank')}
                                            className="flex-1 flex items-center justify-center gap-2 text-sm bg-slate-100 dark:bg-keikichi-forest-600 text-slate-700 dark:text-slate-200 py-2 rounded hover:bg-slate-200 dark:hover:bg-keikichi-forest-500 transition-colors"
                                        >
                                            <Eye className="w-4 h-4" />
                                            Ver
                                        </button>
                                        <button
                                            onClick={() => window.open(`${api.defaults.baseURL}/documents/${doc.id}/download`, '_blank')}
                                            className="flex-1 flex items-center justify-center gap-2 text-sm bg-slate-100 dark:bg-keikichi-forest-600 text-slate-700 dark:text-slate-200 py-2 rounded hover:bg-slate-200 dark:hover:bg-keikichi-forest-500 transition-colors"
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
                isOpen={isDeleteModalOpen}
                onClose={() => {
                    setIsDeleteModalOpen(false);
                    setSelectedDocId(null);
                }}
                onConfirm={() => {
                    if (selectedDocId) {
                        deleteMutation.mutate(selectedDocId);
                    }
                }}
                title="Eliminar Documento"
                message="¿Estás seguro de que deseas eliminar este documento? Esta acción no se puede deshacer."
                confirmText="Eliminar"
                isDestructive={true}
            />
        </div>
    );
};

export default MyFilesPage;

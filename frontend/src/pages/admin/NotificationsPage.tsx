import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Bell, Check, Trash2, ArrowLeft, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import api from "../../api/client";
import { authStore } from "../../stores/authStore";
import LoadingSpinner from "../../components/shared/LoadingSpinner";

interface Notification {
    id: string;
    title: string;
    message: string;
    type: "info" | "success" | "warning" | "error";
    is_read: boolean;
    created_at: string;
    link?: string;
}

const NotificationsPage = () => {
    const navigate = useNavigate();
    const { user } = authStore();
    const queryClient = useQueryClient();

    const { data: notifications = [], isLoading } = useQuery({
        queryKey: ["notifications"],
        queryFn: async () => {
            const res = await api.get<Notification[]>("/notifications?limit=100");
            return res.data;
        },
        enabled: !!user,
    });

    const markReadMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.put(`/notifications/${id}/read`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/notifications/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
            toast.success("Notificación eliminada");
        }
    });

    const clearAllMutation = useMutation({
        mutationFn: async () => {
            await api.delete("/notifications/");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
            toast.success("Historial limpiado");
        }
    });

    const handleNotificationClick = (notification: Notification) => {
        if (!notification.is_read) {
            markReadMutation.mutate(notification.id);
        }
        if (notification.link) {
            navigate(notification.link);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <button
                onClick={() => navigate("/admin/settings")}
                className="flex items-center text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver a Ajustes
            </button>

            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
                <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                            <Bell className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Historial de Notificaciones</h1>
                            <p className="text-slate-500 dark:text-slate-400 text-sm">Registro completo de actividad</p>
                        </div>
                    </div>
                    {notifications.length > 0 && (
                        <button
                            onClick={() => clearAllMutation.mutate()}
                            className="flex items-center gap-2 px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors text-sm font-medium"
                        >
                            <Trash2 className="w-4 h-4" />
                            Limpiar todo
                        </button>
                    )}
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {notifications.length === 0 ? (
                        <div className="p-12 text-center">
                            <Bell className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-slate-900 dark:text-white">No hay notificaciones</h3>
                            <p className="text-slate-500 dark:text-slate-400 mt-1">Tu historial de actividad aparecerá aquí</p>
                        </div>
                    ) : (
                        notifications.map((notification) => (
                            <div
                                key={notification.id}
                                onClick={() => handleNotificationClick(notification)}
                                className={`p-6 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer group ${!notification.is_read ? 'bg-indigo-50/30 dark:bg-indigo-900/10' : ''}`}
                            >
                                <div className="flex gap-4">
                                    <div className={`mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 ${notification.type === 'success' ? 'bg-green-500' :
                                        notification.type === 'error' ? 'bg-red-500' :
                                            notification.type === 'warning' ? 'bg-yellow-500' :
                                                'bg-blue-500'
                                        }`} />
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <h3 className="font-medium text-slate-900 dark:text-slate-100">{notification.title}</h3>
                                            <span className="text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap ml-4">
                                                {format(new Date(notification.created_at), "d MMM yyyy, HH:mm", { locale: es })}
                                            </span>
                                        </div>
                                        <p className="text-slate-600 dark:text-slate-400 mt-1">{notification.message}</p>
                                    </div>
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {!notification.is_read && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    markReadMutation.mutate(notification.id);
                                                }}
                                                className="p-2 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                                                title="Marcar como leída"
                                            >
                                                <Check className="w-4 h-4" />
                                            </button>
                                        )}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteMutation.mutate(notification.id);
                                            }}
                                            className="p-2 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                            title="Eliminar"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotificationsPage;

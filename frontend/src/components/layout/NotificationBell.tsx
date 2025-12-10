import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Check, X, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "../../api/client";
import { authStore } from "../../stores/authStore";
import { useSocketStore } from "../../stores/socketStore";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";

interface Notification {
    id: string;
    title: string;
    message: string;
    type: "info" | "success" | "warning" | "error";
    is_read: boolean;
    created_at: string;
    link?: string;
}

export default function NotificationBell() {
    const { user } = authStore();
    const [isOpen, setIsOpen] = useState(false);
    const queryClient = useQueryClient();
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { t, i18n } = useTranslation();
    const dateLocale = i18n.language === 'es' ? es : enUS;

    // Fetch notifications
    const { data: notifications = [] } = useQuery({
        queryKey: ["notifications"],
        queryFn: async () => {
            const res = await api.get<Notification[]>("/notifications");
            return res.data;
        },
        enabled: !!user,
        refetchInterval: 60000 // Fallback polling
    });

    // Mark as read mutation
    const markReadMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.put(`/notifications/${id}/read`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
        }
    });

    // Delete notification mutation
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/notifications/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
            toast.success(t('common.success'));
        }
    });

    // Clear all notifications mutation
    const clearAllMutation = useMutation({
        mutationFn: async () => {
            await api.delete("/notifications/");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
            toast.success(t('common.success'));
        }
    });

    // WebSocket Connection
    const { connect } = useSocketStore();

    useEffect(() => {
        if (user) {
            connect();
        }
    }, [user, connect]);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const unreadCount = notifications.filter(n => !n.is_read).length;

    const navigate = useNavigate();

    const handleNotificationClick = (notification: Notification) => {
        if (!notification.is_read) {
            markReadMutation.mutate(notification.id);
        }
        setIsOpen(false);

        if (notification.link) {
            navigate(notification.link);
        }
    };

    // Mark all as read mutation
    const markAllReadMutation = useMutation({
        mutationFn: async () => {
            await api.put("/notifications/read-all");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
        }
    });

    const handleOpen = () => {
        const newIsOpen = !isOpen;
        setIsOpen(newIsOpen);

        if (newIsOpen && unreadCount > 0) {
            markAllReadMutation.mutate();
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={handleOpen}
                className="relative p-2 text-keikichi-forest-600 dark:text-keikichi-lime-300 hover:bg-keikichi-lime-50 dark:hover:bg-keikichi-forest-600 rounded-full transition-colors"
            >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-keikichi-yellow-500 rounded-full ring-2 ring-white dark:ring-keikichi-forest-800" />
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] md:w-80 bg-white dark:bg-keikichi-forest-800 rounded-xl shadow-lg border border-keikichi-lime-100 dark:border-keikichi-forest-600 overflow-hidden z-50">
                    <div className="p-4 border-b border-keikichi-lime-50 dark:border-keikichi-forest-600 flex justify-between items-center">
                        <h3 className="font-semibold text-keikichi-forest-800 dark:text-white">{t('notifications.title')}</h3>
                        {unreadCount > 0 && (
                            <span className="text-xs font-medium text-keikichi-lime-600 dark:text-keikichi-lime-400 bg-keikichi-lime-50 dark:bg-keikichi-lime-900/20 px-2 py-1 rounded-full">
                                {unreadCount} {i18n.language === 'es' ? 'nuevas' : 'new'}
                            </span>
                        )}
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-keikichi-forest-500 dark:text-keikichi-lime-300 text-sm">
                                {t('notifications.noNotifications')}
                            </div>
                        ) : (
                            <div className="divide-y divide-keikichi-lime-50 dark:divide-keikichi-forest-600">
                                {notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        onClick={() => handleNotificationClick(notification)}
                                        className={`p-4 hover:bg-keikichi-lime-50/50 dark:hover:bg-keikichi-forest-700/50 transition-colors cursor-pointer group ${!notification.is_read ? 'bg-keikichi-lime-50/30 dark:bg-keikichi-lime-900/10' : ''}`}
                                    >
                                        <div className="flex gap-3">
                                            <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${notification.type === 'success' ? 'bg-keikichi-lime-500' :
                                                notification.type === 'error' ? 'bg-red-500' :
                                                    notification.type === 'warning' ? 'bg-keikichi-yellow-500' :
                                                        'bg-keikichi-forest-400'
                                                }`} />
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-keikichi-forest-800 dark:text-white">{notification.title}</p>
                                                <p className="text-sm text-keikichi-forest-600 dark:text-keikichi-lime-300 mt-0.5">{notification.message}</p>
                                                <p className="text-xs text-keikichi-forest-400 dark:text-keikichi-lime-400 mt-2">
                                                    {format(new Date(notification.created_at), "d MMM, HH:mm", { locale: dateLocale })}
                                                </p>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                {!notification.is_read && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            markReadMutation.mutate(notification.id);
                                                        }}
                                                        className="text-keikichi-forest-400 dark:text-keikichi-lime-400 hover:text-keikichi-lime-600 dark:hover:text-keikichi-lime-300"
                                                        title={t('notifications.markAsRead')}
                                                    >
                                                        <Check className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        deleteMutation.mutate(notification.id);
                                                    }}
                                                    className="text-keikichi-forest-400 dark:text-keikichi-lime-400 hover:text-red-600"
                                                    title={t('common.delete')}
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {notifications.length > 0 && (
                        <div className="p-3 bg-keikichi-lime-50/50 dark:bg-keikichi-forest-700/50 border-t border-keikichi-lime-100 dark:border-keikichi-forest-600 flex justify-between items-center text-xs">
                            <button
                                onClick={() => clearAllMutation.mutate()}
                                className="text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                            >
                                <Trash2 className="w-3 h-3" />
                                {t('common.delete')} {t('common.all').toLowerCase()}
                            </button>
                            <a href="/admin/notifications" className="text-keikichi-lime-600 dark:text-keikichi-lime-400 hover:text-keikichi-lime-700 dark:hover:text-keikichi-lime-300 font-medium">
                                {t('dashboard.viewAll')}
                            </a>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

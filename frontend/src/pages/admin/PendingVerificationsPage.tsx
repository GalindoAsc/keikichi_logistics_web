import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { User } from '../../types/auth';
import api from '../../api/client';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { VerificationReviewPanel } from '../../components/admin/VerificationReviewPanel';
import { ChevronRight, User as UserIcon } from 'lucide-react';

export default function PendingVerificationsPage() {
    const { data: pendingUsers, isLoading } = useQuery<User[]>({
        queryKey: ['pending-verifications'],
        queryFn: async () => {
            const { data } = await api.get('/admin/verifications/pending');
            return data;
        }
    });

    const { userId } = useParams();
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    // Auto-select user from URL param
    useEffect(() => {
        if (userId && pendingUsers) {
            const user = pendingUsers.find(u => u.id === userId);
            if (user) {
                setSelectedUser(user);
            }
        }
    }, [userId, pendingUsers]);

    if (isLoading) return <div className="flex justify-center p-12"><LoadingSpinner /></div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Verificaciones Pendientes</h1>
                <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 px-3 py-1 rounded-full text-sm font-medium">
                    {pendingUsers?.length || 0} pendientes
                </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* List */}
                <div className="lg:col-span-1 space-y-3">
                    {pendingUsers?.length === 0 && (
                        <div className="text-center py-12 bg-white dark:bg-keikichi-forest-800 rounded-lg border border-keikichi-lime-200 dark:border-keikichi-forest-600 text-keikichi-forest-500 dark:text-keikichi-lime-400">
                            No hay verificaciones pendientes
                        </div>
                    )}

                    {pendingUsers?.map(user => (
                        <button
                            key={user.id}
                            onClick={() => setSelectedUser(user)}
                            className={`w-full text-left p-4 rounded-lg border transition-all ${selectedUser?.id === user.id
                                ? 'bg-keikichi-lime-50 dark:bg-keikichi-forest-700 border-keikichi-lime-500 ring-1 ring-keikichi-lime-500'
                                : 'bg-white dark:bg-keikichi-forest-800 border-keikichi-lime-200 dark:border-keikichi-forest-600 hover:border-keikichi-lime-300 dark:hover:border-keikichi-forest-500'
                                }`}
                        >
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-keikichi-lime-100 dark:bg-keikichi-forest-700 flex items-center justify-center">
                                        <UserIcon className="w-5 h-5 text-keikichi-forest-600 dark:text-keikichi-lime-400" />
                                    </div>
                                    <div>
                                        <div className="font-medium text-keikichi-forest-800 dark:text-white">{user.full_name}</div>
                                        <div className="text-xs text-keikichi-forest-500 dark:text-keikichi-lime-400">{user.email || user.phone}</div>
                                    </div>
                                </div>
                                <ChevronRight className={`w-4 h-4 text-keikichi-forest-400 dark:text-keikichi-lime-500 ${selectedUser?.id === user.id ? 'text-keikichi-lime-600 dark:text-keikichi-lime-400' : ''}`} />
                            </div>
                        </button>
                    ))}
                </div>

                {/* Detail Panel */}
                <div className="lg:col-span-2">
                    {selectedUser ? (
                        <VerificationReviewPanel
                            user={selectedUser}
                            onClose={() => setSelectedUser(null)}
                        />
                    ) : (
                        <div className="h-full min-h-[400px] flex items-center justify-center bg-keikichi-lime-50 dark:bg-keikichi-forest-800/50 rounded-lg border border-dashed border-keikichi-lime-300 dark:border-keikichi-forest-600 text-keikichi-forest-400 dark:text-keikichi-lime-500">
                            Selecciona un usuario para revisar sus documentos
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

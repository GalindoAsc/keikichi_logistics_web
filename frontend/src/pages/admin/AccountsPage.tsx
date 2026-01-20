import { useState } from "react";
import { Users, Trash2, Check, X, ArrowLeft, Edit2, Plus, Save, XCircle, Folder, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "../../api/client";
import { useTranslation } from "react-i18next";
import { SmartPhoneInput, PhoneData } from "../../components/shared/SmartPhoneInput";
import { SmartEmailInput } from "../../components/shared/SmartEmailInput";

interface User {
    id: string;
    email: string;
    full_name: string;
    phone?: string;
    role: string;
    is_active: boolean;
    is_verified: boolean;
    created_at: string;
}

interface UserFormData {
    email: string;
    full_name: string;
    phone?: string;
    password?: string;
    role: 'client' | 'manager' | 'superadmin';
}

const AccountsPage = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [selectedRole, setSelectedRole] = useState<string>("all");
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [creatingUser, setCreatingUser] = useState(false);
    const [formData, setFormData] = useState<UserFormData>({
        email: "",
        full_name: "",
        phone: "",
        password: "",
        role: "client",
    });
    const { t } = useTranslation();

    const { data: users = [], isLoading } = useQuery({
        queryKey: ["users"],
        queryFn: async () => {
            const response = await api.get("/admin/users");
            return response.data;
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (userId: string) => {
            await api.delete(`/admin/users/${userId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
            toast.success(t('common.userDeleted'));
        },
        onError: () => {
            toast.error(t('errors.generic'));
        },
    });

    const updateMutation = useMutation({
        mutationFn: async ({ userId, data }: { userId: string; data: Partial<User> }) => {
            await api.patch(`/admin/users/${userId}`, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
            setEditingUser(null);
            toast.success(t('common.userUpdated'));
        },
        onError: () => {
            toast.error(t('errors.generic'));
        },
    });

    const createMutation = useMutation({
        mutationFn: async (data: UserFormData) => {
            await api.post("/admin/users", {
                ...data,
                is_active: true,
                is_verified: true
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
            setCreatingUser(false);
            setFormData({ email: "", full_name: "", phone: "", password: "", role: "client" });
            toast.success(t('common.userCreated'));
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.detail || t('errors.generic'));
        },
    });

    const toggleVerificationMutation = useMutation({
        mutationFn: async ({ userId, newStatus }: { userId: string; newStatus: boolean }) => {
            await api.patch(`/admin/users/${userId}`, { is_verified: newStatus });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
            toast.success(t('common.success'));
        },
        onError: () => {
            toast.error(t('errors.generic'));
        },
    });

    const toggleActiveMutation = useMutation({
        mutationFn: async ({ userId, newStatus }: { userId: string; newStatus: boolean }) => {
            await api.patch(`/admin/users/${userId}`, { is_active: newStatus });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
            toast.success(t('common.success'));
        },
        onError: () => {
            toast.error(t('errors.generic'));
        },
    });

    const filteredUsers = selectedRole === "all"
        ? users
        : users.filter((u: User) => u.role === selectedRole);

    const handleDelete = (userId: string, email: string) => {
        if (confirm(`${t('common.confirmDeleteUser')} ${email}?`)) {
            deleteMutation.mutate(userId);
        }
    };

    const handleEdit = (user: User) => {
        setEditingUser(user);
        setFormData({
            email: user.email,
            full_name: user.full_name,
            phone: user.phone || "",
            role: user.role as 'client' | 'manager' | 'superadmin',
        });
    };

    const handleSaveEdit = () => {
        if (!editingUser) return;
        updateMutation.mutate({
            userId: editingUser.id,
            data: {
                full_name: formData.full_name,
                phone: formData.phone,
                is_active: editingUser.is_active,
                is_verified: editingUser.is_verified,
            } as Partial<User>
        });
    };

    const handleCreate = () => {
        if (!formData.email || !formData.full_name || !formData.password) {
            toast.error(t('accounts.emailNamePasswordRequired'));
            return;
        }
        createMutation.mutate(formData);
    };

    const getRoleLabel = (role: string) => {
        switch (role) {
            case 'client': return t('common.client');
            case 'manager': return t('common.manager');
            case 'superadmin': return t('common.superadmin');
            default: return role;
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <button
                onClick={() => navigate("/admin/settings")}
                className="text-keikichi-forest-600 dark:text-keikichi-lime-300 hover:text-keikichi-forest-900 dark:hover:text-keikichi-lime-100 flex items-center gap-2 transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                {t('settings.backToSettings')}
            </button>

            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <Users className="w-6 h-6 text-keikichi-lime-600 dark:text-keikichi-lime-400" />
                    <h1 className="text-2xl font-bold text-keikichi-forest-800 dark:text-white">{t('accounts.title')}</h1>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => navigate("/admin/verifications")}
                        className="bg-white dark:bg-keikichi-forest-700 border border-keikichi-lime-200 dark:border-keikichi-forest-600 hover:bg-keikichi-lime-50 dark:hover:bg-keikichi-forest-600 text-keikichi-forest-700 dark:text-keikichi-lime-200 px-4 py-2 rounded-md flex items-center gap-2 transition-colors"
                    >
                        <CheckCircle className="w-4 h-4" />
                        {t('common.verifications')}
                    </button>
                    <button
                        onClick={() => setCreatingUser(true)}
                        className="bg-keikichi-lime-600 hover:bg-keikichi-lime-700 dark:bg-keikichi-lime-600 dark:hover:bg-keikichi-lime-700 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        {t('common.createUser')}
                    </button>
                </div>
            </div>

            {/* Create User Form */}
            {creatingUser && (
                <div className="bg-white dark:bg-keikichi-forest-800 rounded-lg border border-keikichi-lime-100 dark:border-keikichi-forest-600 p-6 shadow-sm space-y-4 transition-colors">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-keikichi-forest-800 dark:text-white">{t('common.newUser')}</h2>
                        <button onClick={() => setCreatingUser(false)}>
                            <XCircle className="w-5 h-5 text-keikichi-forest-400 dark:text-keikichi-lime-400" />
                        </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <SmartEmailInput
                                value={formData.email}
                                onChange={(email) => setFormData({ ...formData, email })}
                                label={`${t('common.email')} *`}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-keikichi-forest-700 dark:text-keikichi-lime-300 mb-1">{t('auth.fullName')} *</label>
                            <input
                                type="text"
                                value={formData.full_name}
                                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                className="w-full border border-keikichi-lime-200 dark:border-keikichi-forest-600 rounded-md px-3 py-2 bg-white dark:bg-keikichi-forest-700 text-keikichi-forest-800 dark:text-white focus:ring-2 focus:ring-keikichi-lime-500"
                            />
                        </div>
                        <div>
                            <SmartPhoneInput
                                value={formData.phone || ''}
                                onChange={(data: PhoneData) => setFormData({ ...formData, phone: data.fullNumber })}
                                label={t('common.phone')}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-keikichi-forest-700 dark:text-keikichi-lime-300 mb-1">{t('auth.password')} *</label>
                            <input
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="w-full border border-keikichi-lime-200 dark:border-keikichi-forest-600 rounded-md px-3 py-2 bg-white dark:bg-keikichi-forest-700 text-keikichi-forest-800 dark:text-white focus:ring-2 focus:ring-keikichi-lime-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-keikichi-forest-700 dark:text-keikichi-lime-300 mb-1">{t('common.role')}</label>
                            <select
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                                className="w-full border border-keikichi-lime-200 dark:border-keikichi-forest-600 rounded-md px-3 py-2 bg-white dark:bg-keikichi-forest-700 text-keikichi-forest-800 dark:text-white focus:ring-2 focus:ring-keikichi-lime-500"
                            >
                                <option value="client">{t('common.client')}</option>
                                <option value="manager">{t('common.manager')}</option>
                                <option value="superadmin">{t('common.superadmin')}</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={() => setCreatingUser(false)}
                            className="px-4 py-2 border border-keikichi-lime-200 dark:border-keikichi-forest-600 rounded-md hover:bg-keikichi-lime-50 dark:hover:bg-keikichi-forest-700 text-keikichi-forest-700 dark:text-keikichi-lime-300 transition-colors"
                        >
                            {t('common.cancel')}
                        </button>
                        <button
                            onClick={handleCreate}
                            className="px-4 py-2 bg-keikichi-lime-600 text-white rounded-md hover:bg-keikichi-lime-700 transition-colors"
                        >
                            {t('common.create')}
                        </button>
                    </div>
                </div>
            )}

            {/* Filter */}
            <div className="bg-white dark:bg-keikichi-forest-800 rounded-lg border border-keikichi-lime-100 dark:border-keikichi-forest-600 p-4 shadow-sm transition-colors">
                <label className="text-sm text-keikichi-forest-600 dark:text-keikichi-lime-400 mr-2">{t('accounts.filterByRole')}:</label>
                <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="border border-keikichi-lime-200 dark:border-keikichi-forest-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-keikichi-forest-700 text-keikichi-forest-800 dark:text-white focus:ring-2 focus:ring-keikichi-lime-500"
                >
                    <option value="all">{t('common.all')}</option>
                    <option value="client">{t('accounts.clients')}</option>
                    <option value="manager">{t('accounts.managers')}</option>
                    <option value="superadmin">{t('accounts.superadmins')}</option>
                </select>
            </div>

            {/* Users Table */}
            <div className="bg-white dark:bg-keikichi-forest-800 rounded-lg border border-keikichi-lime-100 dark:border-keikichi-forest-600 shadow-sm overflow-hidden transition-colors">
                {isLoading ? (
                    <div className="p-8 text-center text-keikichi-forest-500 dark:text-keikichi-lime-400">{t('common.loading')}</div>
                ) : filteredUsers.length === 0 ? (
                    <div className="p-8 text-center text-keikichi-forest-500 dark:text-keikichi-lime-400">{t('common.noUsers')}</div>
                ) : (
                    <div className="table-responsive">
                        <table className="w-full">
                            <thead className="bg-keikichi-lime-50 dark:bg-keikichi-forest-700 border-b border-keikichi-lime-100 dark:border-keikichi-forest-600">
                                <tr>
                                    <th className="text-left p-4 text-sm font-medium text-keikichi-forest-700 dark:text-keikichi-lime-300">{t('common.email')}</th>
                                    <th className="text-left p-4 text-sm font-medium text-keikichi-forest-700 dark:text-keikichi-lime-300">{t('common.name')}</th>
                                    <th className="text-left p-4 text-sm font-medium text-keikichi-forest-700 dark:text-keikichi-lime-300">{t('common.phone')}</th>
                                    <th className="text-left p-4 text-sm font-medium text-keikichi-forest-700 dark:text-keikichi-lime-300">{t('common.role')}</th>
                                    <th className="text-center p-4 text-sm font-medium text-keikichi-forest-700 dark:text-keikichi-lime-300">{t('common.verified')}</th>
                                    <th className="text-center p-4 text-sm font-medium text-keikichi-forest-700 dark:text-keikichi-lime-300">{t('common.active')}</th>
                                    <th className="text-center p-4 text-sm font-medium text-keikichi-forest-700 dark:text-keikichi-lime-300">{t('common.actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-keikichi-lime-50 dark:divide-keikichi-forest-600">
                                {filteredUsers.map((user: User) => {
                                    const isEditing = editingUser?.id === user.id;

                                    return (
                                        <tr key={user.id} className="hover:bg-keikichi-lime-50/50 dark:hover:bg-keikichi-forest-700/50 transition-colors">
                                            <td className="p-4 text-sm text-keikichi-forest-800 dark:text-keikichi-lime-200">{user.email}</td>
                                            <td className="p-4 text-sm text-keikichi-forest-800 dark:text-keikichi-lime-200">
                                                {isEditing ? (
                                                    <input
                                                        type="text"
                                                        value={formData.full_name}
                                                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                                        className="border border-keikichi-lime-200 dark:border-keikichi-forest-500 rounded px-2 py-1 w-full bg-white dark:bg-keikichi-forest-600 text-keikichi-forest-800 dark:text-white"
                                                    />
                                                ) : (
                                                    user.full_name
                                                )}
                                            </td>
                                            <td className="p-4 text-sm text-keikichi-forest-800 dark:text-keikichi-lime-200">
                                                {isEditing ? (
                                                    <input
                                                        type="text"
                                                        value={formData.phone}
                                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                        className="border border-keikichi-lime-200 dark:border-keikichi-forest-500 rounded px-2 py-1 w-full bg-white dark:bg-keikichi-forest-600 text-keikichi-forest-800 dark:text-white"
                                                    />
                                                ) : (
                                                    user.phone || "-"
                                                )}
                                            </td>
                                            <td className="p-4 text-sm">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.role === "superadmin"
                                                    ? "bg-keikichi-forest-100 text-keikichi-forest-800 dark:bg-keikichi-forest-600 dark:text-keikichi-lime-200"
                                                    : user.role === "manager"
                                                        ? "bg-keikichi-yellow-100 text-keikichi-yellow-800 dark:bg-keikichi-yellow-900/30 dark:text-keikichi-yellow-400"
                                                        : "bg-keikichi-lime-100 text-keikichi-lime-800 dark:bg-keikichi-lime-900/30 dark:text-keikichi-lime-400"
                                                    }`}>
                                                    {getRoleLabel(user.role)}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center">
                                                <button
                                                    onClick={() => {
                                                        if (confirm(`${t('common.confirmToggleVerified')} ${user.email}?`)) {
                                                            toggleVerificationMutation.mutate({
                                                                userId: user.id,
                                                                newStatus: !user.is_verified,
                                                            });
                                                        }
                                                    }}
                                                    className={`p-1 rounded ${user.is_verified
                                                        ? "text-keikichi-lime-600 hover:bg-keikichi-lime-50 dark:text-keikichi-lime-400 dark:hover:bg-keikichi-lime-900/30"
                                                        : "text-keikichi-forest-400 hover:bg-keikichi-lime-50 dark:text-keikichi-forest-500 dark:hover:bg-keikichi-forest-700"
                                                        }`}
                                                    title={user.is_verified ? t('accounts.markAsUnverified') : t('accounts.markAsVerified')}
                                                >
                                                    {user.is_verified ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                                                </button>
                                            </td>
                                            <td className="p-4 text-center">
                                                <button
                                                    onClick={() => {
                                                        if (confirm(`${t('common.confirmToggleActive')} ${user.is_active ? t('common.deactivate') : t('common.activate')} ${t('common.theAccountOf')} ${user.email}?`)) {
                                                            toggleActiveMutation.mutate({
                                                                userId: user.id,
                                                                newStatus: !user.is_active,
                                                            });
                                                        }
                                                    }}
                                                    className={`p-1 rounded ${user.is_active
                                                        ? "text-keikichi-lime-600 hover:bg-keikichi-lime-50 dark:text-keikichi-lime-400 dark:hover:bg-keikichi-lime-900/30"
                                                        : "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
                                                        }`}
                                                    title={user.is_active ? t('accounts.deactivateAccount') : t('accounts.activateAccount')}
                                                >
                                                    {user.is_active ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                                                </button>
                                            </td>
                                            <td className="p-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    {isEditing ? (
                                                        <>
                                                            <button
                                                                onClick={handleSaveEdit}
                                                                className="text-keikichi-lime-600 hover:bg-keikichi-lime-50 dark:text-keikichi-lime-400 dark:hover:bg-keikichi-lime-900/30 p-1 rounded"
                                                                title={t('common.save')}
                                                            >
                                                                <Save className="w-5 h-5" />
                                                            </button>
                                                            <button
                                                                onClick={() => setEditingUser(null)}
                                                                className="text-keikichi-forest-600 hover:bg-keikichi-lime-50 dark:text-keikichi-lime-400 dark:hover:bg-keikichi-forest-700 p-1 rounded"
                                                                title={t('common.cancel')}
                                                            >
                                                                <XCircle className="w-5 h-5" />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <button
                                                                onClick={() => navigate(`/admin/accounts/${user.id}/files`)}
                                                                className="text-keikichi-lime-600 hover:bg-keikichi-lime-50 dark:text-keikichi-lime-400 dark:hover:bg-keikichi-lime-900/30 p-1 rounded"
                                                                title={t('common.viewFiles')}
                                                            >
                                                                <Folder className="w-5 h-5" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleEdit(user)}
                                                                className="text-keikichi-forest-600 hover:bg-keikichi-lime-50 dark:text-keikichi-lime-400 dark:hover:bg-keikichi-lime-900/30 p-1 rounded"
                                                                title={t('common.edit')}
                                                            >
                                                                <Edit2 className="w-5 h-5" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(user.id, user.email)}
                                                                className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 p-1 rounded"
                                                                title={t('common.delete')}
                                                            >
                                                                <Trash2 className="w-5 h-5" />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AccountsPage;

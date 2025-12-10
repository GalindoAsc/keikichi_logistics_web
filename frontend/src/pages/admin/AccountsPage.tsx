import { useState } from "react";
import { Users, Trash2, Check, X, ArrowLeft, Edit2, Plus, Save, XCircle, Folder, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "../../api/client";

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
            toast.success("Usuario eliminado");
        },
        onError: () => {
            toast.error("Error al eliminar usuario");
        },
    });

    const updateMutation = useMutation({
        mutationFn: async ({ userId, data }: { userId: string; data: Partial<User> }) => {
            await api.patch(`/admin/users/${userId}`, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
            setEditingUser(null);
            toast.success("Usuario actualizado");
        },
        onError: () => {
            toast.error("Error al actualizar usuario");
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
            toast.success("Usuario creado");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.detail || "Error al crear usuario");
        },
    });

    const toggleVerificationMutation = useMutation({
        mutationFn: async ({ userId, newStatus }: { userId: string; newStatus: boolean }) => {
            await api.patch(`/admin/users/${userId}`, { is_verified: newStatus });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
            toast.success("Estado actualizado");
        },
        onError: () => {
            toast.error("Error al actualizar estado");
        },
    });

    const toggleActiveMutation = useMutation({
        mutationFn: async ({ userId, newStatus }: { userId: string; newStatus: boolean }) => {
            await api.patch(`/admin/users/${userId}`, { is_active: newStatus });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
            toast.success("Estado actualizado");
        },
        onError: () => {
            toast.error("Error al actualizar estado");
        },
    });

    const filteredUsers = selectedRole === "all"
        ? users
        : users.filter((u: User) => u.role === selectedRole);

    const handleDelete = (userId: string, email: string) => {
        if (confirm(`¿Estás seguro de eliminar la cuenta de ${email}?`)) {
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
            toast.error("Email, nombre y contraseña son requeridos");
            return;
        }
        createMutation.mutate(formData);
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <button
                onClick={() => navigate("/admin/settings")}
                className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 flex items-center gap-2 transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                Volver a Ajustes
            </button>

            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <Users className="w-6 h-6 text-orange-600 dark:text-orange-500" />
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Gestión de Cuentas</h1>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => navigate("/admin/verifications")}
                        className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-md flex items-center gap-2 transition-colors"
                    >
                        <CheckCircle className="w-4 h-4" />
                        Verificaciones
                    </button>
                    <button
                        onClick={() => setCreatingUser(true)}
                        className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Crear Usuario
                    </button>
                </div>
            </div>

            {/* Create User Form */}
            {creatingUser && (
                <div className="bg-white dark:bg-slate-900 rounded-lg border dark:border-slate-700 p-6 shadow-sm space-y-4 transition-colors">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold dark:text-white">Nuevo Usuario</h2>
                        <button onClick={() => setCreatingUser(false)}>
                            <XCircle className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                        </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email *</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full border dark:border-slate-700 rounded-md px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nombre Completo *</label>
                            <input
                                type="text"
                                value={formData.full_name}
                                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                className="w-full border dark:border-slate-700 rounded-md px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Teléfono</label>
                            <input
                                type="text"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full border dark:border-slate-700 rounded-md px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Contraseña *</label>
                            <input
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="w-full border dark:border-slate-700 rounded-md px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Rol</label>
                            <select
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                                className="w-full border dark:border-slate-700 rounded-md px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="client">Cliente</option>
                                <option value="manager">Gestor</option>
                                <option value="superadmin">Superadmin</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={() => setCreatingUser(false)}
                            className="px-4 py-2 border dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleCreate}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                        >
                            Crear
                        </button>
                    </div>
                </div>
            )}

            {/* Filter */}
            <div className="bg-white dark:bg-slate-900 rounded-lg border dark:border-slate-700 p-4 shadow-sm transition-colors">
                <label className="text-sm text-slate-600 dark:text-slate-400 mr-2">Filtrar por rol:</label>
                <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="border dark:border-slate-700 rounded-md px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                    <option value="all">Todos</option>
                    <option value="client">Clientes</option>
                    <option value="manager">Gestores</option>
                    <option value="superadmin">Superadmins</option>
                </select>
            </div>

            {/* Users Table */}
            <div className="bg-white dark:bg-slate-900 rounded-lg border dark:border-slate-700 shadow-sm overflow-hidden transition-colors">
                {isLoading ? (
                    <div className="p-8 text-center text-slate-500 dark:text-slate-400">Cargando...</div>
                ) : filteredUsers.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 dark:text-slate-400">No hay usuarios registrados</div>
                ) : (
                    <div className="table-responsive">
                        <table className="w-full">
                            <thead className="bg-slate-50 dark:bg-slate-800 border-b dark:border-slate-700">
                                <tr>
                                    <th className="text-left p-4 text-sm font-medium text-slate-700 dark:text-slate-300">Email</th>
                                    <th className="text-left p-4 text-sm font-medium text-slate-700 dark:text-slate-300">Nombre</th>
                                    <th className="text-left p-4 text-sm font-medium text-slate-700 dark:text-slate-300">Teléfono</th>
                                    <th className="text-left p-4 text-sm font-medium text-slate-700 dark:text-slate-300">Rol</th>
                                    <th className="text-center p-4 text-sm font-medium text-slate-700 dark:text-slate-300">Verificado</th>
                                    <th className="text-center p-4 text-sm font-medium text-slate-700 dark:text-slate-300">Activo</th>
                                    <th className="text-center p-4 text-sm font-medium text-slate-700 dark:text-slate-300">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-slate-800">
                                {filteredUsers.map((user: User) => {
                                    const isEditing = editingUser?.id === user.id;

                                    return (
                                        <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="p-4 text-sm text-slate-800 dark:text-slate-300">{user.email}</td>
                                            <td className="p-4 text-sm text-slate-800 dark:text-slate-300">
                                                {isEditing ? (
                                                    <input
                                                        type="text"
                                                        value={formData.full_name}
                                                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                                        className="border dark:border-slate-600 rounded px-2 py-1 w-full bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                                    />
                                                ) : (
                                                    user.full_name
                                                )}
                                            </td>
                                            <td className="p-4 text-sm text-slate-800 dark:text-slate-300">
                                                {isEditing ? (
                                                    <input
                                                        type="text"
                                                        value={formData.phone}
                                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                        className="border dark:border-slate-600 rounded px-2 py-1 w-full bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                                    />
                                                ) : (
                                                    user.phone || "-"
                                                )}
                                            </td>
                                            <td className="p-4 text-sm">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.role === "superadmin"
                                                    ? "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300"
                                                    : user.role === "manager"
                                                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                                                        : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                                    }`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center">
                                                <button
                                                    onClick={() => {
                                                        if (confirm(`¿Estás seguro de cambiar el estado de verificación de ${user.email}?`)) {
                                                            toggleVerificationMutation.mutate({
                                                                userId: user.id,
                                                                newStatus: !user.is_verified,
                                                            });
                                                        }
                                                    }}
                                                    className={`p-1 rounded ${user.is_verified
                                                        ? "text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/30"
                                                        : "text-slate-400 hover:bg-slate-50 dark:text-slate-500 dark:hover:bg-slate-800"
                                                        }`}
                                                    title={user.is_verified ? "Marcar como no verificado" : "Marcar como verificado"}
                                                >
                                                    {user.is_verified ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                                                </button>
                                            </td>
                                            <td className="p-4 text-center">
                                                <button
                                                    onClick={() => {
                                                        if (confirm(`¿Estás seguro de ${user.is_active ? 'desactivar' : 'activar'} la cuenta de ${user.email}?`)) {
                                                            toggleActiveMutation.mutate({
                                                                userId: user.id,
                                                                newStatus: !user.is_active,
                                                            });
                                                        }
                                                    }}
                                                    className={`p-1 rounded ${user.is_active
                                                        ? "text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/30"
                                                        : "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
                                                        }`}
                                                    title={user.is_active ? "Desactivar cuenta" : "Activar cuenta"}
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
                                                                className="text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/30 p-1 rounded"
                                                                title="Guardar"
                                                            >
                                                                <Save className="w-5 h-5" />
                                                            </button>
                                                            <button
                                                                onClick={() => setEditingUser(null)}
                                                                className="text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800 p-1 rounded"
                                                                title="Cancelar"
                                                            >
                                                                <XCircle className="w-5 h-5" />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <button
                                                                onClick={() => navigate(`/admin/accounts/${user.id}/files`)}
                                                                className="text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/30 p-1 rounded"
                                                                title="Ver Archivos"
                                                            >
                                                                <Folder className="w-5 h-5" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleEdit(user)}
                                                                className="text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 p-1 rounded"
                                                                title="Editar"
                                                            >
                                                                <Edit2 className="w-5 h-5" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(user.id, user.email)}
                                                                className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 p-1 rounded"
                                                                title="Eliminar usuario"
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

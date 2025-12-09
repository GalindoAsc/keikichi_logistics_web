import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, Trash2, Edit2, Truck, User, Save, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import api from "../../api/client";
import LoadingSpinner from "../../components/shared/LoadingSpinner";

// Types
interface Driver {
    id: string;
    full_name: string;
    phone: string;
    license_number: string;
    is_active: boolean;
}

interface Vehicle {
    id: string;
    type: "truck" | "trailer";
    plate: string;
    brand: string;
    model: string;
    year: string;
    is_active: boolean;
}

// API Functions
const fetchDrivers = async () => (await api.get<Driver[]>("/fleet/drivers")).data;
const fetchVehicles = async () => (await api.get<Vehicle[]>("/fleet/vehicles")).data;

const createDriver = async (data: Partial<Driver>) => (await api.post("/fleet/drivers", data)).data;
const updateDriver = async ({ id, data }: { id: string; data: Partial<Driver> }) => (await api.patch(`/fleet/drivers/${id}`, data)).data;
const deleteDriver = async (id: string) => (await api.delete(`/fleet/drivers/${id}`)).data;

const createVehicle = async (data: Partial<Vehicle>) => (await api.post("/fleet/vehicles", data)).data;
const updateVehicle = async ({ id, data }: { id: string; data: Partial<Vehicle> }) => (await api.patch(`/fleet/vehicles/${id}`, data)).data;
const deleteVehicle = async (id: string) => (await api.delete(`/fleet/vehicles/${id}`)).data;

const FleetSettingsPage = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<"drivers" | "vehicles">("drivers");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);

    // Queries
    const { data: drivers, isLoading: loadingDrivers } = useQuery({ queryKey: ["drivers"], queryFn: fetchDrivers });
    const { data: vehicles, isLoading: loadingVehicles } = useQuery({ queryKey: ["vehicles"], queryFn: fetchVehicles });

    // Mutations
    const driverMutation = useMutation({
        mutationFn: editingItem?.id ? updateDriver : createDriver,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["drivers"] });
            setIsModalOpen(false);
            setEditingItem(null);
            toast.success("Conductor guardado");
        }
    });

    const vehicleMutation = useMutation({
        mutationFn: editingItem?.id ? updateVehicle : createVehicle,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["vehicles"] });
            setIsModalOpen(false);
            setEditingItem(null);
            toast.success("Vehículo guardado");
        }
    });

    const deleteDriverMutation = useMutation({
        mutationFn: deleteDriver,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["drivers"] });
            toast.success("Conductor eliminado");
        }
    });

    const deleteVehicleMutation = useMutation({
        mutationFn: deleteVehicle,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["vehicles"] });
            toast.success("Vehículo eliminado");
        }
    });

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        const data = Object.fromEntries(formData);

        if (activeTab === "drivers") {
            if (editingItem?.id) {
                driverMutation.mutate({ id: editingItem.id, data });
            } else {
                driverMutation.mutate(data);
            }
        } else {
            if (editingItem?.id) {
                vehicleMutation.mutate({ id: editingItem.id, data });
            } else {
                vehicleMutation.mutate(data);
            }
        }
    };

    if (loadingDrivers || loadingVehicles) return <LoadingSpinner />;

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <button
                onClick={() => navigate("/admin/settings")}
                className="flex items-center text-slate-600 hover:text-slate-900 transition-colors"
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver a Ajustes
            </button>

            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-900">Gestión de Flota</h1>
                <button
                    onClick={() => { setEditingItem(null); setIsModalOpen(true); }}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Agregar {activeTab === "drivers" ? "Conductor" : "Vehículo"}
                </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200">
                <button
                    onClick={() => setActiveTab("drivers")}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "drivers" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700"
                        }`}
                >
                    Conductores
                </button>
                <button
                    onClick={() => setActiveTab("vehicles")}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "vehicles" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700"
                        }`}
                >
                    Vehículos
                </button>
            </div>

            {/* Content */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {activeTab === "drivers" ? (
                    <div className="table-responsive">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                                <tr>
                                    <th className="p-4">Nombre</th>
                                    <th className="p-4">Teléfono</th>
                                    <th className="p-4">Licencia</th>
                                    <th className="p-4 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {drivers?.map((driver) => (
                                    <tr key={driver.id} className="hover:bg-slate-50">
                                        <td className="p-4 font-medium text-slate-900 flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                                <User className="w-4 h-4" />
                                            </div>
                                            {driver.full_name}
                                        </td>
                                        <td className="p-4 text-slate-600">{driver.phone || "-"}</td>
                                        <td className="p-4 text-slate-600">{driver.license_number || "-"}</td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => { setEditingItem(driver); setIsModalOpen(true); }}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => { if (confirm("¿Eliminar conductor?")) deleteDriverMutation.mutate(driver.id); }}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {drivers?.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="p-8 text-center text-slate-500">No hay conductores registrados</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                                <tr>
                                    <th className="p-4">Placas</th>
                                    <th className="p-4">Tipo</th>
                                    <th className="p-4">Marca/Modelo</th>
                                    <th className="p-4 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {vehicles?.map((vehicle) => (
                                    <tr key={vehicle.id} className="hover:bg-slate-50">
                                        <td className="p-4 font-medium text-slate-900 flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                                <Truck className="w-4 h-4" />
                                            </div>
                                            {vehicle.plate}
                                        </td>
                                        <td className="p-4 text-slate-600 capitalize">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${vehicle.type === 'truck' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                                                }`}>
                                                {vehicle.type === 'truck' ? 'Camión' : 'Remolque'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-slate-600">{vehicle.brand} {vehicle.model} ({vehicle.year})</td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => { setEditingItem(vehicle); setIsModalOpen(true); }}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => { if (confirm("¿Eliminar vehículo?")) deleteVehicleMutation.mutate(vehicle.id); }}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {vehicles?.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="p-8 text-center text-slate-500">No hay vehículos registrados</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-slate-900">
                                {editingItem ? "Editar" : "Nuevo"} {activeTab === "drivers" ? "Conductor" : "Vehículo"}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="space-y-4">
                            {activeTab === "drivers" ? (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Completo</label>
                                        <input
                                            name="full_name"
                                            defaultValue={editingItem?.full_name}
                                            required
                                            className="w-full border rounded-lg px-3 py-2"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
                                        <input
                                            name="phone"
                                            defaultValue={editingItem?.phone}
                                            className="w-full border rounded-lg px-3 py-2"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Licencia</label>
                                        <input
                                            name="license_number"
                                            defaultValue={editingItem?.license_number}
                                            className="w-full border rounded-lg px-3 py-2"
                                        />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
                                        <select
                                            name="type"
                                            defaultValue={editingItem?.type || "truck"}
                                            className="w-full border rounded-lg px-3 py-2"
                                        >
                                            <option value="truck">Camión</option>
                                            <option value="trailer">Remolque</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Placas</label>
                                        <input
                                            name="plate"
                                            defaultValue={editingItem?.plate}
                                            required
                                            className="w-full border rounded-lg px-3 py-2"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Marca</label>
                                            <input
                                                name="brand"
                                                defaultValue={editingItem?.brand}
                                                className="w-full border rounded-lg px-3 py-2"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Modelo</label>
                                            <input
                                                name="model"
                                                defaultValue={editingItem?.model}
                                                className="w-full border rounded-lg px-3 py-2"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Año</label>
                                        <input
                                            name="year"
                                            defaultValue={editingItem?.year}
                                            className="w-full border rounded-lg px-3 py-2"
                                        />
                                    </div>
                                </>
                            )}

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                                >
                                    Guardar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FleetSettingsPage;

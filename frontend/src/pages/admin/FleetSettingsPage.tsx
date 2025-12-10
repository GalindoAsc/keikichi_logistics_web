import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, Trash2, Edit2, Truck, User, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import api from "../../api/client";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import { useTranslation } from "react-i18next";

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
    const { t } = useTranslation();

    // Queries
    const { data: drivers, isLoading: loadingDrivers } = useQuery({ queryKey: ["drivers"], queryFn: fetchDrivers });
    const { data: vehicles, isLoading: loadingVehicles } = useQuery({ queryKey: ["vehicles"], queryFn: fetchVehicles });

    // Mutations
    const createDriverMutation = useMutation({
        mutationFn: createDriver,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["drivers"] });
            setIsModalOpen(false);
            setEditingItem(null);
            toast.success(t('fleet.driverSaved'));
        }
    });

    const updateDriverMutation = useMutation({
        mutationFn: updateDriver,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["drivers"] });
            setIsModalOpen(false);
            setEditingItem(null);
            toast.success(t('fleet.driverUpdated'));
        }
    });

    const createVehicleMutation = useMutation({
        mutationFn: createVehicle,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["vehicles"] });
            setIsModalOpen(false);
            setEditingItem(null);
            toast.success(t('fleet.vehicleSaved'));
        }
    });

    const updateVehicleMutation = useMutation({
        mutationFn: updateVehicle,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["vehicles"] });
            setIsModalOpen(false);
            setEditingItem(null);
            toast.success(t('fleet.vehicleUpdated'));
        }
    });

    const deleteDriverMutation = useMutation({
        mutationFn: deleteDriver,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["drivers"] });
            toast.success(t('fleet.driverDeleted'));
        }
    });

    const deleteVehicleMutation = useMutation({
        mutationFn: deleteVehicle,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["vehicles"] });
            toast.success(t('fleet.vehicleDeleted'));
        }
    });

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        const data = Object.fromEntries(formData);

        if (activeTab === "drivers") {
            if (editingItem?.id) {
                updateDriverMutation.mutate({ id: editingItem.id, data });
            } else {
                createDriverMutation.mutate(data);
            }
        } else {
            if (editingItem?.id) {
                updateVehicleMutation.mutate({ id: editingItem.id, data });
            } else {
                createVehicleMutation.mutate(data);
            }
        }
    };

    if (loadingDrivers || loadingVehicles) return <LoadingSpinner />;

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <button
                onClick={() => navigate("/admin/settings")}
                className="flex items-center text-keikichi-forest-600 dark:text-keikichi-lime-300 hover:text-keikichi-forest-900 dark:hover:text-keikichi-lime-100 transition-colors"
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('settings.backToSettings')}
            </button>

            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-keikichi-forest-800 dark:text-white">{t('settings.fleetTitle')}</h1>
                <button
                    onClick={() => { setEditingItem(null); setIsModalOpen(true); }}
                    className="flex items-center gap-2 bg-keikichi-lime-600 text-white px-4 py-2 rounded-lg hover:bg-keikichi-lime-700 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    {t('common.add')} {activeTab === "drivers" ? t('fleet.drivers') : t('fleet.vehicles')}
                </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-keikichi-lime-100 dark:border-keikichi-forest-600">
                <button
                    onClick={() => setActiveTab("drivers")}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "drivers" ? "border-keikichi-lime-600 text-keikichi-lime-600 dark:text-keikichi-lime-400" : "border-transparent text-keikichi-forest-500 dark:text-keikichi-lime-300 hover:text-keikichi-forest-700 dark:hover:text-keikichi-lime-100"
                        }`}
                >
                    {t('fleet.drivers')}
                </button>
                <button
                    onClick={() => setActiveTab("vehicles")}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "vehicles" ? "border-keikichi-lime-600 text-keikichi-lime-600 dark:text-keikichi-lime-400" : "border-transparent text-keikichi-forest-500 dark:text-keikichi-lime-300 hover:text-keikichi-forest-700 dark:hover:text-keikichi-lime-100"
                        }`}
                >
                    {t('fleet.vehicles')}
                </button>
            </div>

            {/* Content */}
            <div className="bg-white dark:bg-keikichi-forest-800 rounded-xl shadow-sm border border-keikichi-lime-100 dark:border-keikichi-forest-600 overflow-hidden transition-colors">
                {activeTab === "drivers" ? (
                    <div className="table-responsive">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-keikichi-lime-50 dark:bg-keikichi-forest-700 text-keikichi-forest-600 dark:text-keikichi-lime-300 font-medium border-b border-keikichi-lime-100 dark:border-keikichi-forest-600">
                                <tr>
                                    <th className="p-4">{t('common.name')}</th>
                                    <th className="p-4">{t('common.phone')}</th>
                                    <th className="p-4">{t('common.license')}</th>
                                    <th className="p-4 text-right">{t('common.actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-keikichi-lime-50 dark:divide-keikichi-forest-600">
                                {drivers?.map((driver) => (
                                    <tr key={driver.id} className="hover:bg-keikichi-lime-50/50 dark:hover:bg-keikichi-forest-700/50 transition-colors">
                                        <td className="p-4 font-medium text-keikichi-forest-800 dark:text-white flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-keikichi-lime-100 dark:bg-keikichi-forest-600 flex items-center justify-center text-keikichi-forest-500 dark:text-keikichi-lime-300">
                                                <User className="w-4 h-4" />
                                            </div>
                                            {driver.full_name}
                                        </td>
                                        <td className="p-4 text-keikichi-forest-600 dark:text-keikichi-lime-300">{driver.phone || "-"}</td>
                                        <td className="p-4 text-keikichi-forest-600 dark:text-keikichi-lime-300">{driver.license_number || "-"}</td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => { setEditingItem(driver); setIsModalOpen(true); }}
                                                    className="p-2 text-keikichi-lime-600 hover:bg-keikichi-lime-50 dark:hover:bg-keikichi-lime-900/20 rounded-lg transition-colors"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => { if (confirm(t('fleet.confirmDeleteDriver'))) deleteDriverMutation.mutate(driver.id); }}
                                                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {drivers?.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="p-8 text-center text-keikichi-forest-500 dark:text-keikichi-lime-400">{t('fleet.noDrivers')}</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-keikichi-lime-50 dark:bg-keikichi-forest-700 text-keikichi-forest-600 dark:text-keikichi-lime-300 font-medium border-b border-keikichi-lime-100 dark:border-keikichi-forest-600">
                                <tr>
                                    <th className="p-4">{t('fleet.plate')}</th>
                                    <th className="p-4">{t('common.type')}</th>
                                    <th className="p-4">{t('fleet.brand')}/{t('fleet.model')}</th>
                                    <th className="p-4 text-right">{t('common.actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-keikichi-lime-50 dark:divide-keikichi-forest-600">
                                {vehicles?.map((vehicle) => (
                                    <tr key={vehicle.id} className="hover:bg-keikichi-lime-50/50 dark:hover:bg-keikichi-forest-700/50 transition-colors">
                                        <td className="p-4 font-medium text-keikichi-forest-800 dark:text-white flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-keikichi-lime-100 dark:bg-keikichi-forest-600 flex items-center justify-center text-keikichi-forest-500 dark:text-keikichi-lime-300">
                                                <Truck className="w-4 h-4" />
                                            </div>
                                            {vehicle.plate}
                                        </td>
                                        <td className="p-4 text-keikichi-forest-600 dark:text-keikichi-lime-300 capitalize">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${vehicle.type === 'truck' ? 'bg-keikichi-lime-100 text-keikichi-lime-700 dark:bg-keikichi-lime-900/30 dark:text-keikichi-lime-400' : 'bg-keikichi-yellow-100 text-keikichi-yellow-700 dark:bg-keikichi-yellow-900/30 dark:text-keikichi-yellow-400'
                                                }`}>
                                                {vehicle.type === 'truck' ? t('fleet.truck') : t('fleet.trailer')}
                                            </span>
                                        </td>
                                        <td className="p-4 text-keikichi-forest-600 dark:text-keikichi-lime-300">{vehicle.brand} {vehicle.model} ({vehicle.year})</td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => { setEditingItem(vehicle); setIsModalOpen(true); }}
                                                    className="p-2 text-keikichi-lime-600 hover:bg-keikichi-lime-50 dark:hover:bg-keikichi-lime-900/20 rounded-lg transition-colors"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => { if (confirm(t('fleet.confirmDeleteVehicle'))) deleteVehicleMutation.mutate(vehicle.id); }}
                                                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {vehicles?.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="p-8 text-center text-keikichi-forest-500 dark:text-keikichi-lime-400">{t('fleet.noVehicles')}</td>
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
                    <div className="bg-white dark:bg-keikichi-forest-800 rounded-xl shadow-xl max-w-md w-full p-6 border border-keikichi-lime-100 dark:border-keikichi-forest-600">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-keikichi-forest-800 dark:text-white">
                                {editingItem ? t('common.edit') : t('common.new')} {activeTab === "drivers" ? t('fleet.drivers') : t('fleet.vehicles')}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-keikichi-forest-400 dark:text-keikichi-lime-400 hover:text-keikichi-forest-600 dark:hover:text-keikichi-lime-200">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="space-y-4">
                            {activeTab === "drivers" ? (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-keikichi-forest-700 dark:text-keikichi-lime-300 mb-1">{t('fleet.fullName')}</label>
                                        <input
                                            name="full_name"
                                            defaultValue={editingItem?.full_name}
                                            required
                                            className="w-full border border-keikichi-lime-200 dark:border-keikichi-forest-600 bg-white dark:bg-keikichi-forest-700 text-keikichi-forest-800 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-keikichi-lime-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-keikichi-forest-700 dark:text-keikichi-lime-300 mb-1">{t('common.phone')}</label>
                                        <input
                                            name="phone"
                                            defaultValue={editingItem?.phone}
                                            className="w-full border border-keikichi-lime-200 dark:border-keikichi-forest-600 bg-white dark:bg-keikichi-forest-700 text-keikichi-forest-800 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-keikichi-lime-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-keikichi-forest-700 dark:text-keikichi-lime-300 mb-1">{t('common.license')}</label>
                                        <input
                                            name="license_number"
                                            defaultValue={editingItem?.license_number}
                                            className="w-full border border-keikichi-lime-200 dark:border-keikichi-forest-600 bg-white dark:bg-keikichi-forest-700 text-keikichi-forest-800 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-keikichi-lime-500"
                                        />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-keikichi-forest-700 dark:text-keikichi-lime-300 mb-1">{t('common.type')}</label>
                                        <select
                                            name="type"
                                            defaultValue={editingItem?.type || "truck"}
                                            className="w-full border border-keikichi-lime-200 dark:border-keikichi-forest-600 bg-white dark:bg-keikichi-forest-700 text-keikichi-forest-800 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-keikichi-lime-500"
                                        >
                                            <option value="truck">{t('fleet.truck')}</option>
                                            <option value="trailer">{t('fleet.trailer')}</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-keikichi-forest-700 dark:text-keikichi-lime-300 mb-1">{t('fleet.plate')}</label>
                                        <input
                                            name="plate"
                                            defaultValue={editingItem?.plate}
                                            required
                                            className="w-full border border-keikichi-lime-200 dark:border-keikichi-forest-600 bg-white dark:bg-keikichi-forest-700 text-keikichi-forest-800 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-keikichi-lime-500"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-keikichi-forest-700 dark:text-keikichi-lime-300 mb-1">{t('fleet.brand')}</label>
                                            <input
                                                name="brand"
                                                defaultValue={editingItem?.brand}
                                                className="w-full border border-keikichi-lime-200 dark:border-keikichi-forest-600 bg-white dark:bg-keikichi-forest-700 text-keikichi-forest-800 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-keikichi-lime-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-keikichi-forest-700 dark:text-keikichi-lime-300 mb-1">{t('fleet.model')}</label>
                                            <input
                                                name="model"
                                                defaultValue={editingItem?.model}
                                                className="w-full border border-keikichi-lime-200 dark:border-keikichi-forest-600 bg-white dark:bg-keikichi-forest-700 text-keikichi-forest-800 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-keikichi-lime-500"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-keikichi-forest-700 dark:text-keikichi-lime-300 mb-1">{t('fleet.year')}</label>
                                        <input
                                            name="year"
                                            defaultValue={editingItem?.year}
                                            className="w-full border border-keikichi-lime-200 dark:border-keikichi-forest-600 bg-white dark:bg-keikichi-forest-700 text-keikichi-forest-800 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-keikichi-lime-500"
                                        />
                                    </div>
                                </>
                            )}

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-keikichi-forest-700 dark:text-keikichi-lime-300 hover:bg-keikichi-lime-50 dark:hover:bg-keikichi-forest-700 rounded-lg transition-colors"
                                >
                                    {t('common.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-keikichi-lime-600 text-white rounded-lg hover:bg-keikichi-lime-700 transition-colors"
                                >
                                    {t('common.save')}
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

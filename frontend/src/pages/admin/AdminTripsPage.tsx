import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Plus, Edit, Trash2, Truck, Calendar, MapPin, Eye } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { fetchTrips, deleteTrip } from "../../api/trips";
import api from "../../api/client";
import { Trip } from "../../types/trip";
import { toast } from "sonner";

export default function AdminTripsPage() {
    const navigate = useNavigate();
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const { data: trips, isLoading, refetch } = useQuery({
        queryKey: ["admin-trips", statusFilter],
        queryFn: () => fetchTrips()
    });

    const filteredTrips = trips?.filter(trip => statusFilter === "all" || trip.status === statusFilter);

    // Bulk Selection Handlers
    const handleSelectAll = (isChecked: boolean) => {
        if (isChecked && filteredTrips) {
            setSelectedIds(filteredTrips.map(t => t.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectTrip = (id: string) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(prev => prev.filter(i => i !== id));
        } else {
            setSelectedIds(prev => [...prev, id]);
        }
    };

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteTrip(id),
        onSuccess: () => {
            toast.success("Viaje eliminado exitosamente");
            refetch();
        },
        onError: () => {
            toast.error("Error al eliminar el viaje");
        }
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: string }) =>
            api.patch(`/trips/${id}/status`, null, {
                params: { status }
            }).then(res => res.data),
        onSuccess: () => {
            toast.success("Estado actualizado exitosamente");
            refetch();
        },
        onError: () => {
            toast.error("Error al actualizar el estado");
        }
    });

    const handleStatusChange = (id: string, newStatus: string) => {
        if (window.confirm(`¿Cambiar estado del viaje a ${newStatus}?`)) {
            updateStatusMutation.mutate({ id, status: newStatus });
        }
    };

    const handleDelete = (id: string) => {
        if (window.confirm("¿Estás seguro de eliminar este viaje? Esta acción no se puede deshacer.")) {
            deleteMutation.mutate(id);
        }
    };

    const handleBulkDelete = async () => {
        if (!window.confirm(`¿Estás seguro de eliminar PERMANENTEMENTE ${selectedIds.length} viajes? Esta acción no se puede deshacer.`)) return;

        const toastId = toast.loading("Eliminando viajes...");
        try {
            await Promise.all(selectedIds.map(id => deleteTrip(id)));
            toast.success(`${selectedIds.length} viajes eliminados`, { id: toastId });
            setSelectedIds([]);
            refetch();
        } catch (error) {
            toast.error("Error al eliminar algunos viajes", { id: toastId });
            refetch();
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Gestión de Viajes</h1>
                    <p className="text-slate-500">Administra los viajes disponibles y pasados</p>
                </div>

                <Link
                    to="/admin/trips/create"
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" /> Crear Viaje
                </Link>
            </div>

            {/* Filters & Bulk Controls */}
            <div className="flex flex-wrap items-center gap-4 justify-between bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                <div className="flex items-center gap-4 pl-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                        <input
                            type="checkbox"
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                            checked={filteredTrips?.length === selectedIds.length && (filteredTrips?.length ?? 0) > 0}
                            onChange={(e) => handleSelectAll(e.target.checked)}
                        />
                        Seleccionar Todo
                    </label>
                    <div className="h-4 w-px bg-slate-200"></div>
                </div>

                <div className="flex gap-2">
                    <select
                        className="border rounded-lg px-3 py-2 text-sm bg-white"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">Todos los Estados</option>
                        <option value="scheduled">Programado</option>
                        <option value="in_transit">En Tránsito</option>
                        <option value="completed">Completado</option>
                        <option value="cancelled">Cancelado</option>
                    </select>
                </div>
            </div>

            {/* Bulk Action Bar */}
            {selectedIds.length > 0 && (
                <div className="sticky top-4 z-10 bg-indigo-50 border border-indigo-100 rounded-lg p-3 flex items-center justify-between animate-in fade-in slide-in-from-top-2 shadow-lg">
                    <div className="flex items-center gap-2">
                        <span className="bg-indigo-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                            {selectedIds.length}
                        </span>
                        <span className="text-sm font-medium text-indigo-900">
                            viajes seleccionados
                        </span>
                    </div>
                    <button
                        onClick={handleBulkDelete}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2"
                    >
                        <Trash2 className="w-4 h-4" />
                        Eliminar Selección
                    </button>
                </div>
            )}

            {isLoading ? (
                <div className="text-center py-12">Cargando viajes...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTrips?.map((trip: Trip) => (
                        <div
                            key={trip.id}
                            className={`relative bg-white rounded-xl border shadow-sm overflow-hidden hover:shadow-md transition-all duration-200
                                ${selectedIds.includes(trip.id) ? 'border-indigo-500 ring-1 ring-indigo-500 bg-indigo-50/10' : 'border-slate-200'}
                            `}
                        >
                            {/* Selection Checkbox Overlay */}
                            <div className="absolute top-3 left-3 z-10">
                                <input
                                    type="checkbox"
                                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-5 h-5 shadow-sm cursor-pointer"
                                    checked={selectedIds.includes(trip.id)}
                                    onChange={() => handleSelectTrip(trip.id)}
                                />
                            </div>

                            <div className="p-5 space-y-4 pl-10"> {/* Added left padding for checkbox */}
                                {/* Header */}
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                                        <select
                                            value={trip.status}
                                            onChange={(e) => handleStatusChange(trip.id, e.target.value)}
                                            className={`px-2 py-1 rounded-full text-xs font-bold uppercase border-none focus:ring-2 focus:ring-indigo-500 cursor-pointer
                                                ${trip.status === 'scheduled' ? 'bg-green-100 text-green-800' :
                                                    trip.status === 'in_transit' ? 'bg-blue-100 text-blue-800' :
                                                        trip.status === 'completed' ? 'bg-slate-100 text-slate-800' :
                                                            'bg-red-100 text-red-800'}`}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <option value="scheduled">Programado</option>
                                            <option value="in_transit">En Tránsito</option>
                                            <option value="completed">Completado</option>
                                            <option value="cancelled">Cancelado</option>
                                        </select>
                                        {trip.is_international && (
                                            <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-xs font-bold uppercase">
                                                INTL
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex gap-1">
                                        <Link
                                            to={`/trips/${trip.id}`}
                                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Ver Espacios"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </Link>
                                        <button
                                            onClick={() => navigate(`/admin/trips/${trip.id}/edit`)}
                                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                            title="Editar"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(trip.id)}
                                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Eliminar"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Route */}
                                <div>
                                    <div className="flex items-center gap-2 text-slate-900 font-semibold text-lg">
                                        <MapPin className="w-5 h-5 text-indigo-600" />
                                        {trip.origin} → {trip.destination}
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-500 text-sm mt-1">
                                        <Calendar className="w-4 h-4" />
                                        {format(new Date(trip.departure_date), "d 'de' MMMM, yyyy", { locale: es })}
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-2 gap-4 py-3 border-t border-b border-slate-100">
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase tracking-wider">Espacios</p>
                                        <p className="font-semibold text-slate-900">
                                            {trip.available_spaces} / {trip.total_spaces}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase tracking-wider">Precio</p>
                                        <p className="font-semibold text-slate-900">
                                            ${trip.price_per_space} {trip.currency}
                                        </p>
                                    </div>
                                </div>

                                {/* Driver Info */}
                                <div className="flex items-center gap-3 text-sm text-slate-600">
                                    <Truck className="w-4 h-4" />
                                    <span>{trip.driver_name || "Sin conductor asignado"}</span>
                                </div>

                                {/* Space Management Button */}
                                <Link
                                    to={`/admin/trips/${trip.id}/spaces`}
                                    className="w-full mt-2 bg-slate-800 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="3" width="7" height="7"></rect>
                                        <rect x="14" y="3" width="7" height="7"></rect>
                                        <rect x="14" y="14" width="7" height="7"></rect>
                                        <rect x="3" y="14" width="7" height="7"></rect>
                                    </svg>
                                    Gestionar Espacios
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

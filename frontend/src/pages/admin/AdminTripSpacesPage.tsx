import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Shield, CheckCircle, Ban, Lock } from "lucide-react";
import { toast } from "sonner";
import api from "../../api/client";
import { Trip } from "../../types/trip";
import SpaceMap from "../../components/spaces/SpaceMap";

// Define local types if not available globally yet
interface Space {
    id: string;
    space_number: number;
    status: 'available' | 'reserved' | 'blocked' | 'on_hold' | 'internal';
    price?: number;
    is_mine?: boolean;
}

interface TripSpacesResponse {
    trip_id: string;
    total_spaces: number;
    spaces: Space[];
    summary: Record<string, number>;
}

export default function AdminTripSpacesPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null);

    // Fetch Trip Details
    const { data: trip } = useQuery({
        queryKey: ["trip", id],
        queryFn: async () => {
            const res = await api.get<Trip>(`/trips/${id}`);
            return res.data;
        },
        enabled: !!id
    });

    // Fetch Spaces
    const { data: spacesData, isLoading: isLoadingSpaces } = useQuery({
        queryKey: ["trip-spaces", id],
        queryFn: async () => {
            const res = await api.get<TripSpacesResponse>(`/spaces/trip/${id}`);
            return res.data;
        },
        enabled: !!id,
        refetchInterval: 5000 // Auto-refresh every 5s
    });

    // Mutation to update space status
    const updateStatusMutation = useMutation({
        mutationFn: async ({ spaceId, status }: { spaceId: string, status: string }) => {
            await api.put(`/spaces/${spaceId}/status?status=${status}`);
        },
        onSuccess: () => {
            toast.success("Estado del espacio actualizado");
            queryClient.invalidateQueries({ queryKey: ["trip-spaces", id] });
            setSelectedSpaceId(null);
        },
        onError: () => {
            toast.error("Error al actualizar el estado");
        }
    });

    // Mutation for Admin Reservation
    const createAdminReservationMutation = useMutation({
        mutationFn: async (data: { trip_id: string; space_ids: string[]; notes?: string }) => {
            const res = await api.post("/reservations/admin", data);
            return res.data;
        },
        onSuccess: () => {
            toast.success("Reservación interna creada exitosamente");
            queryClient.invalidateQueries({ queryKey: ["trip-spaces", id] });
            setSelectedSpaceId(null);
        },
        onError: (error: any) => {
            console.error("Error creating admin reservation:", error);
            const errorMsg = error.response?.data?.detail || error.message || "Error desconocido";
            toast.error(`Error: ${errorMsg}`);
        }
    });

    const handleSpaceClick = (spaceId: string) => {
        setSelectedSpaceId(spaceId);
    };

    const handleStatusChange = (status: string) => {
        if (selectedSpaceId) {
            updateStatusMutation.mutate({ spaceId: selectedSpaceId, status });
        }
    };

    const handleAdminReservation = () => {
        if (!selectedSpaceId || !id) return;

        const notes = window.prompt("Notas para esta reservación interna (opcional):");
        if (notes === null) return; // Cancelled

        createAdminReservationMutation.mutate({
            trip_id: id,
            space_ids: [selectedSpaceId],
            notes: notes || "Reservación Interna / Admin"
        });
    };

    const selectedSpace = spacesData?.spaces.find(s => s.id === selectedSpaceId);

    if (!trip) return <div className="p-8 text-center">Cargando viaje...</div>;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate("/admin/trips")}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                    <ArrowLeft className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Gestión de Espacios</h1>
                    <p className="text-slate-500 dark:text-slate-400">{trip.origin} → {trip.destination}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Map Column */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
                    {isLoadingSpaces ? (
                        <div className="h-64 flex items-center justify-center text-slate-500 dark:text-slate-400">Cargando mapa...</div>
                    ) : (
                        <SpaceMap
                            totalSpaces={trip.total_spaces}
                            spaces={spacesData?.spaces || []}
                            selectedSpaces={selectedSpaceId ? [selectedSpaceId] : []}
                            onSpaceSelect={handleSpaceClick}
                            isSelectionEnabled={true}
                        />
                    )}

                    <div className="mt-6 flex gap-4 justify-center text-sm text-slate-600 dark:text-slate-400 flex-wrap">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded"></div>
                            <span>Disponible</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-amber-400 rounded"></div>
                            <span>Pre-Reserva</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-red-500 rounded"></div>
                            <span>Reservado</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-slate-800 dark:bg-slate-950 border dark:border-slate-700 rounded"></div>
                            <span>Interno/Bloqueado</span>
                        </div>
                    </div>
                </div>

                {/* Controls Column */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Acciones del Espacio</h2>

                        {selectedSpace ? (
                            <div className="space-y-4">
                                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg relative transition-colors">
                                    <button
                                        onClick={() => setSelectedSpaceId(null)}
                                        className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"
                                        title="Deseleccionar espacio"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="18" y1="6" x2="6" y2="18"></line>
                                            <line x1="6" y1="6" x2="18" y2="18"></line>
                                        </svg>
                                    </button>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Espacio Seleccionado</p>
                                    <p className="text-2xl font-bold text-slate-900 dark:text-white">#{selectedSpace.space_number}</p>
                                    <p className="text-sm font-medium uppercase mt-1 text-indigo-600 dark:text-indigo-400">
                                        Estado Actual: {selectedSpace.status}
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Cambiar Estado:</p>

                                    <button
                                        onClick={() => handleStatusChange('available')}
                                        disabled={selectedSpace.status === 'available'}
                                        className="w-full p-3 flex items-center gap-3 rounded-lg border border-green-200 dark:border-green-800/30 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <CheckCircle className="w-5 h-5" />
                                        <span>Disponible</span>
                                    </button>

                                    <button
                                        onClick={handleAdminReservation}
                                        disabled={selectedSpace.status !== 'available'}
                                        className="w-full p-3 flex items-center gap-3 rounded-lg border border-indigo-200 dark:border-indigo-800/30 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Shield className="w-5 h-5" />
                                        <span>Reservar (Gratis/Interno)</span>
                                    </button>

                                    <button
                                        onClick={() => handleStatusChange('internal')}
                                        disabled={selectedSpace.status === 'internal'}
                                        className="w-full p-3 flex items-center gap-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-800 dark:bg-slate-700 text-white hover:bg-slate-700 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Lock className="w-5 h-5" />
                                        <span>Marcar como Interno (No visible)</span>
                                    </button>

                                    <button
                                        onClick={() => handleStatusChange('blocked')}
                                        disabled={selectedSpace.status === 'blocked'}
                                        className="w-full p-3 flex items-center gap-3 rounded-lg border border-red-200 dark:border-red-800/30 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Ban className="w-5 h-5" />
                                        <span>Bloqueado (Mantenimiento)</span>
                                    </button>
                                </div>

                                {selectedSpace.status === 'reserved' && (
                                    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 text-sm rounded-lg flex items-start gap-2 border border-yellow-100 dark:border-yellow-900/30">
                                        <Lock className="w-4 h-4 mt-0.5" />
                                        <p>Este espacio está reservado por un cliente. Cambiar su estado podría causar inconsistencias.</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-slate-400 dark:text-slate-500">
                                <p>Selecciona un espacio en el mapa para ver opciones</p>
                            </div>
                        )}
                    </div>

                    {/* Stats Summary */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">Resumen</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-600 dark:text-slate-400">Total Espacios</span>
                                <span className="font-medium text-slate-900 dark:text-white">{trip.total_spaces}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-green-600 dark:text-green-400">Disponibles</span>
                                <span className="font-medium text-slate-900 dark:text-white">{spacesData?.summary.available || 0}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-amber-600 dark:text-amber-400">Pre-Reservas</span>
                                <span className="font-medium text-slate-900 dark:text-white">{spacesData?.summary.on_hold || 0}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-red-600 dark:text-red-400">Reservados</span>
                                <span className="font-medium text-slate-900 dark:text-white">{spacesData?.summary.reserved || 0}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-600 dark:text-slate-400">Internos/Bloqueados</span>
                                <span className="font-medium text-slate-900 dark:text-white">
                                    {(spacesData?.summary.internal || 0) + (spacesData?.summary.blocked || 0)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

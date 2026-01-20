import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { Plus, Edit, Trash2, Truck, Calendar, MapPin, Eye, FileText, Copy, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { fetchTrips, deleteTrip, downloadManifest, cloneTrip } from "../../api/trips";
import api from "../../api/client";
import { Trip } from "../../types/trip";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export default function AdminTripsPage() {
    const navigate = useNavigate();
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const { t, i18n } = useTranslation();
    const dateLocale = i18n.language === 'es' ? es : enUS;

    // Clone modal state
    const [cloneTarget, setCloneTarget] = useState<Trip | null>(null);
    const [cloneDate, setCloneDate] = useState<string>("");

    const { data: trips, isLoading, refetch } = useQuery({
        queryKey: ["admin-trips", statusFilter],
        queryFn: () => fetchTrips(false)
    });

    // Memoize filtered trips to avoid recalculation on every render
    const filteredTrips = useMemo(() => 
        trips?.filter(trip => statusFilter === "all" || trip.status === statusFilter),
        [trips, statusFilter]
    );

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
            toast.success(t('trips.deleteSuccess'));
            refetch();
        },
        onError: () => {
            toast.error(t('trips.deleteError'));
        }
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: string }) =>
            api.patch(`/trips/${id}/status`, null, {
                params: { status }
            }).then(res => res.data),
        onSuccess: () => {
            toast.success(t('trips.statusUpdateSuccess'));
            refetch();
        },
        onError: () => {
            toast.error(t('trips.statusUpdateError'));
        }
    });

    const handleStatusChange = (id: string, newStatus: string) => {
        if (window.confirm(`${t('trips.confirmStatusChange')} ${t(`trips.status.${newStatus}`)}?`)) {
            updateStatusMutation.mutate({ id, status: newStatus });
        }
    };

    const handleDelete = (id: string) => {
        if (window.confirm(t('trips.confirmDelete'))) {
            deleteMutation.mutate(id);
        }
    };

    const handleBulkDelete = async () => {
        if (!window.confirm(t('trips.confirmDelete'))) return;

        const toastId = toast.loading(t('common.loading'));
        try {
            await Promise.all(selectedIds.map(id => deleteTrip(id)));
            toast.success(t('trips.deleteSuccess'), { id: toastId });
            setSelectedIds([]);
            refetch();
        } catch (error) {
            toast.error(t('trips.deleteError'), { id: toastId });
            refetch();
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-keikichi-forest-800 dark:text-white">{t('trips.adminTitle')}</h1>
                    <p className="text-keikichi-forest-500 dark:text-keikichi-lime-300">{t('trips.adminSubtitle')}</p>
                </div>

                <Link
                    to="/admin/trips/create"
                    className="bg-keikichi-lime-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-keikichi-lime-700 transition-colors flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" /> {t('trips.createTrip')}
                </Link>
            </div>

            {/* Filters & Bulk Controls */}
            <div className="flex flex-wrap items-center gap-4 justify-between bg-white dark:bg-keikichi-forest-800 p-2 rounded-lg border border-keikichi-lime-100 dark:border-keikichi-forest-600 shadow-sm transition-colors">
                <div className="flex items-center gap-4 pl-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-keikichi-forest-700 dark:text-keikichi-lime-200 cursor-pointer">
                        <input
                            type="checkbox"
                            className="rounded border-keikichi-lime-300 dark:border-keikichi-forest-500 bg-white dark:bg-keikichi-forest-700 text-keikichi-lime-600 focus:ring-keikichi-lime-500 w-4 h-4"
                            checked={filteredTrips?.length === selectedIds.length && (filteredTrips?.length ?? 0) > 0}
                            onChange={(e) => handleSelectAll(e.target.checked)}
                        />
                        {t('common.selectAll')}
                    </label>
                    <div className="h-4 w-px bg-keikichi-lime-200 dark:bg-keikichi-forest-600"></div>
                </div>

                <div className="flex gap-2">
                    <select
                        className="border border-keikichi-lime-200 dark:border-keikichi-forest-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-keikichi-forest-700 text-keikichi-forest-800 dark:text-white"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">{t('common.allStatuses')}</option>
                        <option value="scheduled">{t('trips.status.scheduled')}</option>
                        <option value="in_transit">{t('trips.status.in_transit')}</option>
                        <option value="completed">{t('trips.status.completed')}</option>
                        <option value="cancelled">{t('trips.status.cancelled')}</option>
                    </select>
                </div>
            </div>

            {/* Bulk Action Bar */}
            {selectedIds.length > 0 && (
                <div className="sticky top-4 z-10 bg-keikichi-lime-50 dark:bg-keikichi-lime-900/20 border border-keikichi-lime-200 dark:border-keikichi-lime-800 rounded-lg p-3 flex items-center justify-between animate-in fade-in slide-in-from-top-2 shadow-lg">
                    <div className="flex items-center gap-2">
                        <span className="bg-keikichi-lime-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                            {selectedIds.length}
                        </span>
                        <span className="text-sm font-medium text-keikichi-lime-800 dark:text-keikichi-lime-200">
                            {t('common.selected')}
                        </span>
                    </div>
                    <button
                        onClick={handleBulkDelete}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2"
                    >
                        <Trash2 className="w-4 h-4" />
                        {t('common.deleteSelected')}
                    </button>
                </div>
            )}

            {isLoading ? (
                <div className="text-center py-12 text-keikichi-forest-500 dark:text-keikichi-lime-300">{t('common.loading')}</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTrips?.map((trip: Trip) => (
                        <div
                            key={trip.id}
                            className={`relative bg-white dark:bg-keikichi-forest-800 rounded-xl border shadow-sm overflow-hidden hover:shadow-md transition-all duration-200
                                ${selectedIds.includes(trip.id) ? 'border-keikichi-lime-500 ring-1 ring-keikichi-lime-500 bg-keikichi-lime-50/10 dark:bg-keikichi-lime-900/10' : 'border-keikichi-lime-100 dark:border-keikichi-forest-600'}
                            `}
                        >
                            {/* Selection Checkbox Overlay */}
                            <div className="absolute top-3 left-3 z-10">
                                <input
                                    type="checkbox"
                                    className="rounded border-keikichi-lime-300 dark:border-keikichi-forest-500 bg-white dark:bg-keikichi-forest-700 text-keikichi-lime-600 focus:ring-keikichi-lime-500 w-5 h-5 shadow-sm cursor-pointer"
                                    checked={selectedIds.includes(trip.id)}
                                    onChange={() => handleSelectTrip(trip.id)}
                                />
                            </div>

                            <div className="p-5 space-y-4 pl-10">
                                {/* Header */}
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-2 text-sm font-medium text-keikichi-forest-500 dark:text-keikichi-lime-300">
                                        <select
                                            value={trip.status}
                                            onChange={(e) => handleStatusChange(trip.id, e.target.value)}
                                            className={`px-2 py-1 rounded-full text-xs font-bold uppercase border-none focus:ring-2 focus:ring-keikichi-lime-500 cursor-pointer
                                                ${trip.status === 'scheduled' ? 'bg-keikichi-lime-100 text-keikichi-lime-800 dark:bg-keikichi-lime-900/30 dark:text-keikichi-lime-400' :
                                                    trip.status === 'in_transit' ? 'bg-keikichi-yellow-100 text-keikichi-yellow-800 dark:bg-keikichi-yellow-900/30 dark:text-keikichi-yellow-400' :
                                                        trip.status === 'completed' ? 'bg-keikichi-forest-100 text-keikichi-forest-800 dark:bg-keikichi-forest-700 dark:text-keikichi-lime-300' :
                                                            'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <option value="scheduled">{t('trips.status.scheduled')}</option>
                                            <option value="in_transit">{t('trips.status.in_transit')}</option>
                                            <option value="completed">{t('trips.status.completed')}</option>
                                            <option value="cancelled">{t('trips.status.cancelled')}</option>
                                        </select>
                                        {trip.is_international && (
                                            <span className="bg-keikichi-forest-100 text-keikichi-forest-800 dark:bg-keikichi-forest-700 dark:text-keikichi-lime-300 px-2 py-1 rounded-full text-xs font-bold uppercase">
                                                INTL
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex gap-1">
                                        <Link
                                            to={`/trips/${trip.id}`}
                                            className="p-1.5 text-keikichi-forest-400 dark:text-keikichi-lime-400 hover:text-keikichi-lime-600 dark:hover:text-keikichi-lime-300 hover:bg-keikichi-lime-50 dark:hover:bg-keikichi-lime-900/20 rounded-lg transition-colors"
                                            title={t('trips.viewSpaces')}
                                        >
                                            <Eye className="w-4 h-4" />
                                        </Link>
                                        <div className="relative group">
                                            <button
                                                className="p-1.5 text-keikichi-forest-400 dark:text-keikichi-lime-400 hover:text-keikichi-lime-600 dark:hover:text-keikichi-lime-300 hover:bg-keikichi-lime-50 dark:hover:bg-keikichi-lime-900/20 rounded-lg transition-colors"
                                                title="Descargar Manifiesto"
                                            >
                                                <FileText className="w-4 h-4" />
                                            </button>
                                            <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 min-w-[160px]">
                                                <button
                                                    onClick={async (e) => {
                                                        e.preventDefault();
                                                        try {
                                                            await downloadManifest(trip.id, 'office', { origin: trip.origin, destination: trip.destination });
                                                            toast.success('Manifiesto de oficina descargado');
                                                        } catch {
                                                            toast.error('Error al descargar manifiesto');
                                                        }
                                                    }}
                                                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg"
                                                >
                                                    📋 Manifiesto Oficina
                                                </button>
                                                <button
                                                    onClick={async (e) => {
                                                        e.preventDefault();
                                                        try {
                                                            await downloadManifest(trip.id, 'driver', { origin: trip.origin, destination: trip.destination });
                                                            toast.success('Manifiesto de chofer descargado');
                                                        } catch {
                                                            toast.error('Error al descargar manifiesto');
                                                        }
                                                    }}
                                                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-b-lg"
                                                >
                                                    🚚 Manifiesto Chofer
                                                </button>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setCloneTarget(trip);
                                                setCloneDate("");
                                            }}
                                            className="p-1.5 text-keikichi-forest-400 dark:text-keikichi-lime-400 hover:text-keikichi-lime-600 dark:hover:text-keikichi-lime-300 hover:bg-keikichi-lime-50 dark:hover:bg-keikichi-lime-900/20 rounded-lg transition-colors"
                                            title="Clonar viaje"
                                        >
                                            <Copy className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => navigate(`/admin/trips/${trip.id}/edit`)}
                                            className="p-1.5 text-keikichi-forest-400 dark:text-keikichi-lime-400 hover:text-keikichi-lime-600 dark:hover:text-keikichi-lime-300 hover:bg-keikichi-lime-50 dark:hover:bg-keikichi-lime-900/20 rounded-lg transition-colors"
                                            title={t('common.edit')}
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(trip.id)}
                                            className="p-1.5 text-keikichi-forest-400 dark:text-keikichi-lime-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                            title={t('common.delete')}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Route */}
                                <div>
                                    <div className="flex items-center gap-2 text-keikichi-forest-800 dark:text-white font-semibold text-lg">
                                        <MapPin className="w-5 h-5 text-keikichi-lime-600 dark:text-keikichi-lime-400" />
                                        {trip.origin} → {trip.destination}
                                    </div>
                                    <div className="flex items-center gap-2 text-keikichi-forest-500 dark:text-keikichi-lime-300 text-sm mt-1">
                                        <Calendar className="w-4 h-4" />
                                        {format(parseISO(trip.departure_date), i18n.language === 'es' ? "d 'de' MMMM, yyyy" : "MMMM d, yyyy", { locale: dateLocale })}
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-2 gap-4 py-3 border-t border-b border-keikichi-lime-50 dark:border-keikichi-forest-600">
                                    <div>
                                        <p className="text-xs text-keikichi-forest-500 dark:text-keikichi-lime-400 uppercase tracking-wider">{t('trips.spaces')}</p>
                                        <p className="font-semibold text-keikichi-forest-800 dark:text-white">
                                            {trip.available_spaces} / {trip.total_spaces}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-keikichi-forest-500 dark:text-keikichi-lime-400 uppercase tracking-wider">{t('common.price')}</p>
                                        <p className="font-semibold text-keikichi-forest-800 dark:text-white">
                                            ${trip.price_per_space} {trip.currency}
                                        </p>
                                    </div>
                                </div>

                                {/* Driver Info */}
                                <div className="flex items-center gap-3 text-sm text-keikichi-forest-600 dark:text-keikichi-lime-300">
                                    <Truck className="w-4 h-4" />
                                    <span>{trip.driver_name || t('common.noDriver')}</span>
                                </div>

                                {/* Space Management Button */}
                                <Link
                                    to={`/admin/trips/${trip.id}/spaces`}
                                    className="w-full mt-2 bg-keikichi-forest-700 dark:bg-keikichi-lime-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-keikichi-forest-800 dark:hover:bg-keikichi-lime-700 transition-colors flex items-center justify-center gap-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="3" width="7" height="7"></rect>
                                        <rect x="14" y="3" width="7" height="7"></rect>
                                        <rect x="14" y="14" width="7" height="7"></rect>
                                        <rect x="3" y="14" width="7" height="7"></rect>
                                    </svg>
                                    {t('trips.manageSpaces')}
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Clone Modal */}
            {cloneTarget && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {t('trips.cloneTrip')}
                            </h3>
                            <button
                                onClick={() => setCloneTarget(null)}
                                className="p-1 text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                            {cloneTarget.origin} → {cloneTarget.destination}
                        </p>

                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t('trips.newDepartureDate')}
                        </label>
                        <input
                            type="date"
                            value={cloneDate}
                            onChange={(e) => setCloneDate(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-4"
                            min={new Date().toISOString().split('T')[0]}
                        />

                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setCloneTarget(null)}
                                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                onClick={async () => {
                                    if (!cloneDate) {
                                        toast.error(t('trips.selectDateError'));
                                        return;
                                    }
                                    try {
                                        const result = await cloneTrip(cloneTarget.id, cloneDate);
                                        toast.success(result.message || t('trips.cloneSuccess'));
                                        setCloneTarget(null);
                                        refetch();
                                    } catch {
                                        toast.error(t('trips.cloneError'));
                                    }
                                }}
                                disabled={!cloneDate}
                                className="px-4 py-2 bg-keikichi-lime-600 text-white rounded-lg hover:bg-keikichi-lime-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {t('trips.cloneTrip')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Eye, Clock, Trash2, Ban, MoreVertical } from "lucide-react";
import { getReservations, cancelReservation, deleteReservation } from "../../api/reservations";
import { PaymentStatus, ReservationStatus } from "../../types/reservation";
import AdminReservationDetailModal from "../../components/admin/AdminReservationDetailModal";
import { toast } from "sonner";

interface ActionProps {
    reservationId: string;
    status: string;
    onView: () => void;
    onCancel: () => void;
    onDelete: () => void;
}

function ReservationActions({ reservationId, status, onView, onCancel, onDelete }: ActionProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const buttonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setPosition({
                top: rect.bottom + window.scrollY,
                left: rect.right - 192 // 192px is w-48 (12rem)
            });
        }
    }, [isOpen]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
                // Check if click is inside the portal content is tricky without a ref to it, 
                // but since we are using portal, the event target might be outside the button.
                // A simple way is to close if click is not on the button, 
                // but we need to allow clicking inside the menu.
                // Let's use a ref for the menu as well, but it's in a portal.
                // Easier: just close on any click outside the button, 
                // but we need to stop propagation on the menu itself.
                setIsOpen(false);
            }
        }

        if (isOpen) {
            window.addEventListener("click", handleClickOutside);
            window.addEventListener("scroll", () => setIsOpen(false), true); // Close on scroll
        }
        return () => {
            window.removeEventListener("click", handleClickOutside);
            window.removeEventListener("scroll", () => setIsOpen(false), true);
        };
    }, [isOpen]);

    return (
        <>
            <button
                ref={buttonRef}
                onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(!isOpen);
                }}
                className={`p-1.5 rounded-md transition-colors ${isOpen ? 'bg-slate-100 text-slate-700' : 'text-slate-500 hover:bg-slate-100'}`}
            >
                <MoreVertical className="w-4 h-4" />
            </button>

            {isOpen && createPortal(
                <div
                    className="fixed bg-white rounded-lg shadow-lg border border-slate-100 py-1 z-50 w-48"
                    style={{ top: position.top, left: position.left }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        onClick={() => { setIsOpen(false); onView(); }}
                        className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                        <Eye className="w-4 h-4 text-indigo-500" /> Ver Detalle
                    </button>

                    {status !== ReservationStatus.CANCELLED && (
                        <button
                            onClick={() => { setIsOpen(false); onCancel(); }}
                            className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                        >
                            <Ban className="w-4 h-4 text-orange-500" /> Cancelar
                        </button>
                    )}

                    <button
                        onClick={() => { setIsOpen(false); onDelete(); }}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                        <Trash2 className="w-4 h-4" /> Eliminar
                    </button>
                </div>,
                document.body
            )}
        </>
    );
}

export default function AdminReservationsPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [paymentFilter, setPaymentFilter] = useState<string>("all");
    const [selectedReservationId, setSelectedReservationId] = useState<string | null>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    useEffect(() => {
        setSelectedIds([]);
    }, [page, statusFilter, paymentFilter]);

    const handleSelectAll = () => {
        if (!data) return;
        if (selectedIds.length === data.items.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(data.items.map(r => r.id));
        }
    };

    const handleSelectRow = (id: string) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(prev => prev.filter(i => i !== id));
        } else {
            setSelectedIds(prev => [...prev, id]);
        }
    };

    useEffect(() => {
        const id = searchParams.get("id");
        if (id) {
            setSelectedReservationId(id);
        }
    }, [searchParams]);

    const { data, isLoading, refetch } = useQuery({
        queryKey: ["admin-reservations", page, statusFilter, paymentFilter],
        queryFn: () => getReservations(page, 20, {
            status: statusFilter !== "all" ? statusFilter as ReservationStatus : undefined,
            payment_status: paymentFilter !== "all" ? paymentFilter as PaymentStatus : undefined
        })
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteReservation(id),
        onSuccess: () => {
            toast.success("Reservación eliminada permanentemente");
            refetch();
        },
        onError: () => {
            toast.error("Error al eliminar la reservación");
        }
    });

    const cancelMutation = useMutation({
        mutationFn: (id: string) => cancelReservation(id),
        onSuccess: () => {
            toast.success("Reservación cancelada exitosamente");
            refetch();
        },
        onError: () => {
            toast.error("Error al cancelar la reservación");
        }
    });

    const handleDelete = (id: string) => {
        if (window.confirm("¿Estás seguro de eliminar PERMANENTEMENTE esta reservación? Esta acción no se puede deshacer.")) {
            deleteMutation.mutate(id);
        }
    };

    const handleCancel = (id: string) => {
        if (window.confirm("¿Estás seguro de cancelar esta reservación? Esto liberará los espacios.")) {
            cancelMutation.mutate(id);
        }
    };

    const handleBulkDelete = async () => {
        if (!window.confirm(`¿Estás seguro de eliminar PERMANENTEMENTE ${selectedIds.length} reservaciones? Esta acción no se puede deshacer.`)) return;

        const toastId = toast.loading("Eliminando reservaciones...");
        try {
            await Promise.all(selectedIds.map(id => deleteReservation(id)));
            toast.success(`${selectedIds.length} reservaciones eliminadas`, { id: toastId });
            setSelectedIds([]);
            refetch();
        } catch (error) {
            toast.error("Error al eliminar algunas reservaciones", { id: toastId });
            refetch(); // Refetch anyway to show what's left
        }
    };

    const handleCloseModal = () => {
        setSelectedReservationId(null);
        setSearchParams(params => {
            params.delete("id");
            return params;
        });
        refetch();
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h1 className="text-2xl font-bold text-slate-900">Gestión de Reservaciones</h1>

                <div className="flex gap-2">
                    <select
                        className="border rounded-lg px-3 py-2 text-sm bg-white"
                        value={paymentFilter}
                        onChange={(e) => setPaymentFilter(e.target.value)}
                    >
                        <option value="all">Todos los Pagos</option>
                        <option value={PaymentStatus.PENDING_REVIEW}>Por Revisar</option>
                        <option value={PaymentStatus.UNPAID}>Pendiente</option>
                        <option value={PaymentStatus.PAID}>Pagado</option>
                    </select>

                    <select
                        className="border rounded-lg px-3 py-2 text-sm bg-white"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">Todos los Estados</option>
                        <option value={ReservationStatus.PENDING}>Pendiente</option>
                        <option value={ReservationStatus.CONFIRMED}>Confirmada</option>
                        <option value={ReservationStatus.CANCELLED}>Cancelada</option>
                    </select>
                </div>
            </div>

            {/* Bulk Action Bar */}
            {selectedIds.length > 0 && (
                <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-2">
                        <span className="bg-indigo-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                            {selectedIds.length}
                        </span>
                        <span className="text-sm font-medium text-indigo-900">
                            seleccionados
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
                <div className="text-center py-12">Cargando reservaciones...</div>
            ) : (
                <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                    <div className="table-responsive">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-3 w-10">
                                        <input
                                            type="checkbox"
                                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                            checked={data?.items.length === selectedIds.length && (data?.items.length ?? 0) > 0}
                                            onChange={handleSelectAll}
                                        />
                                    </th>
                                    <th className="px-4 py-3">ID / Fecha</th>
                                    <th className="px-4 py-3">Cliente</th>
                                    <th className="px-4 py-3">Viaje</th>
                                    <th className="px-4 py-3">Espacios</th>
                                    <th className="px-4 py-3">Total</th>
                                    <th className="px-4 py-3">Estado</th>
                                    <th className="px-4 py-3">Pago</th>
                                    <th className="px-4 py-3 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {data?.items.map((res) => (
                                    <tr key={res.id} className={`hover:bg-slate-50 transition-colors ${selectedIds.includes(res.id) ? 'bg-indigo-50/50' : ''}`}>
                                        <td className="px-4 py-3">
                                            <input
                                                type="checkbox"
                                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                checked={selectedIds.includes(res.id)}
                                                onChange={() => handleSelectRow(res.id)}
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-mono text-xs text-slate-500">#{res.id.slice(0, 8)}</div>
                                            <div className="text-slate-900">
                                                {format(new Date(res.created_at), "d MMM yyyy", { locale: es })}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-slate-900">
                                                {res.client_name || "Desconocido"}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-slate-900">
                                                {res.trip_origin} → {res.trip_destination}
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                {res.trip_departure_date && format(new Date(res.trip_departure_date), "d MMM", { locale: es })}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="bg-slate-100 px-2 py-1 rounded text-xs font-medium">
                                                {res.spaces_count}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 font-medium text-slate-900">
                                            <div className="flex flex-col">
                                                <span>${res.total_amount.toLocaleString()}</span>
                                                <span className="text-[10px] text-slate-500 font-normal">{res.currency || 'USD'}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium
                                                ${res.status === ReservationStatus.CONFIRMED ? 'bg-green-100 text-green-800' :
                                                    res.status === ReservationStatus.CANCELLED ? 'bg-red-100 text-red-800' :
                                                        'bg-yellow-100 text-yellow-800'}`}>
                                                {res.status === 'pending' ? 'Pendiente' :
                                                    res.status === 'confirmed' ? 'Confirmada' :
                                                        res.status === 'cancelled' ? 'Cancelada' : res.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`flex items-center gap-1 w-fit px-2 py-1 rounded-full text-xs font-medium
                                                ${res.payment_status === PaymentStatus.PAID ? 'bg-green-100 text-green-800' :
                                                    res.payment_status === PaymentStatus.PENDING_REVIEW ? 'bg-blue-100 text-blue-800' :
                                                        'bg-slate-100 text-slate-600'}`}>
                                                {res.payment_status === PaymentStatus.PENDING_REVIEW && <Clock className="w-3 h-3" />}
                                                {res.payment_status === PaymentStatus.PAID ? 'Pagado' :
                                                    res.payment_status === PaymentStatus.PENDING_REVIEW ? 'Revisión' : 'Pendiente'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <ReservationActions
                                                reservationId={res.id}
                                                status={res.status}
                                                onView={() => setSelectedReservationId(res.id)}
                                                onCancel={() => handleCancel(res.id)}
                                                onDelete={() => handleDelete(res.id)}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="px-4 py-3 border-t border-slate-200 flex justify-between items-center text-sm text-slate-500">
                        <span>Página {page} de {data?.pages || 1}</span>
                        <div className="flex gap-2">
                            <button
                                disabled={page === 1}
                                onClick={() => setPage(p => p - 1)}
                                className="px-3 py-1 border rounded hover:bg-slate-50 disabled:opacity-50"
                            >
                                Anterior
                            </button>
                            <button
                                disabled={page === (data?.pages || 1)}
                                onClick={() => setPage(p => p + 1)}
                                className="px-3 py-1 border rounded hover:bg-slate-50 disabled:opacity-50"
                            >
                                Siguiente
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {selectedReservationId && (
                <AdminReservationDetailModal
                    reservationId={selectedReservationId}
                    onClose={handleCloseModal}
                />
            )}
        </div>
    );
}

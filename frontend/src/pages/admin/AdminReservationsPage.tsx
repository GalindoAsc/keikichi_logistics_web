import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { Eye, Clock, Trash2, Ban, MoreVertical } from "lucide-react";
import { getReservations, cancelReservation, deleteReservation } from "../../api/reservations";
import { PaymentStatus, ReservationStatus } from "../../types/reservation";
import AdminReservationDetailModal from "../../components/admin/AdminReservationDetailModal";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

interface ActionProps {
    reservationId: string;
    status: string;
    onView: () => void;
    onCancel: () => void;
    onDelete: () => void;
}

function ReservationActions({ reservationId: _reservationId, status, onView, onCancel, onDelete }: ActionProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const buttonRef = useRef<HTMLButtonElement>(null);
    const { t } = useTranslation();

    useEffect(() => {
        if (isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setPosition({
                top: rect.bottom + window.scrollY,
                left: rect.right - 192
            });
        }
    }, [isOpen]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        if (isOpen) {
            window.addEventListener("click", handleClickOutside);
            window.addEventListener("scroll", () => setIsOpen(false), true);
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
                className={`p-1.5 rounded-md transition-colors ${isOpen ? 'bg-keikichi-lime-100 text-keikichi-lime-700 dark:bg-keikichi-lime-900/30 dark:text-keikichi-lime-400' : 'text-keikichi-forest-500 dark:text-keikichi-lime-400 hover:bg-keikichi-lime-50 dark:hover:bg-keikichi-lime-900/20'}`}
            >
                <MoreVertical className="w-4 h-4" />
            </button>

            {isOpen && createPortal(
                <div
                    className="fixed bg-white dark:bg-keikichi-forest-800 rounded-lg shadow-lg border border-keikichi-lime-100 dark:border-keikichi-forest-600 py-1 z-50 w-48"
                    style={{ top: position.top, left: position.left }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        onClick={() => { setIsOpen(false); onView(); }}
                        className="w-full px-4 py-2 text-left text-sm text-keikichi-forest-700 dark:text-keikichi-lime-200 hover:bg-keikichi-lime-50 dark:hover:bg-keikichi-forest-700 flex items-center gap-2"
                    >
                        <Eye className="w-4 h-4 text-keikichi-lime-600" /> {t('common.viewDetail')}
                    </button>

                    {status !== ReservationStatus.CANCELLED && (
                        <button
                            onClick={() => { setIsOpen(false); onCancel(); }}
                            className="w-full px-4 py-2 text-left text-sm text-keikichi-forest-700 dark:text-keikichi-lime-200 hover:bg-keikichi-lime-50 dark:hover:bg-keikichi-forest-700 flex items-center gap-2"
                        >
                            <Ban className="w-4 h-4 text-keikichi-yellow-600" /> {t('common.cancel')}
                        </button>
                    )}

                    <button
                        onClick={() => { setIsOpen(false); onDelete(); }}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                    >
                        <Trash2 className="w-4 h-4" /> {t('common.delete')}
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
    const { t, i18n } = useTranslation();
    const dateLocale = i18n.language === 'es' ? es : enUS;

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
            toast.success(t('reservations.deletedPermanently'));
            refetch();
        },
        onError: () => {
            toast.error(t('reservations.deleteError'));
        }
    });

    const cancelMutation = useMutation({
        mutationFn: (id: string) => cancelReservation(id),
        onSuccess: () => {
            toast.success(t('reservations.cancelledSuccessfully'));
            refetch();
        },
        onError: () => {
            toast.error(t('reservations.cancelError'));
        }
    });

    const handleDelete = (id: string) => {
        if (window.confirm(t('reservations.confirmDeletePermanent'))) {
            deleteMutation.mutate(id);
        }
    };

    const handleCancel = (id: string) => {
        if (window.confirm(t('reservations.confirmCancel'))) {
            cancelMutation.mutate(id);
        }
    };

    const handleBulkDelete = async () => {
        if (!window.confirm(t('reservations.confirmBulkDelete', { count: selectedIds.length }))) return;

        const toastId = toast.loading(t('reservations.deletingReservations'));
        try {
            await Promise.all(selectedIds.map(id => deleteReservation(id)));
            toast.success(`${selectedIds.length} ${t('reservations.reservationsDeleted')}`, { id: toastId });
            setSelectedIds([]);
            refetch();
        } catch (error) {
            toast.error(t('reservations.bulkDeleteError'), { id: toastId });
            refetch();
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

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'pending': return t('reservations.status.pending');
            case 'confirmed': return t('reservations.status.confirmed');
            case 'cancelled': return t('reservations.status.cancelled');
            default: return status;
        }
    };

    const getPaymentLabel = (status: string) => {
        switch (status) {
            case PaymentStatus.PAID: return t('reservations.status.paid');
            case PaymentStatus.PENDING_REVIEW: return t('reservations.paymentReview');
            case PaymentStatus.UNPAID: return t('reservations.status.pending');
            default: return status;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h1 className="text-2xl font-bold text-keikichi-forest-800 dark:text-white">{t('reservations.title')}</h1>

                <div className="flex gap-2">
                    <select
                        className="border border-keikichi-lime-200 dark:border-keikichi-forest-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-keikichi-forest-700 text-keikichi-forest-800 dark:text-white"
                        value={paymentFilter}
                        onChange={(e) => setPaymentFilter(e.target.value)}
                    >
                        <option value="all">{t('common.allPayments')}</option>
                        <option value={PaymentStatus.PENDING_REVIEW}>{t('reservations.paymentReview')}</option>
                        <option value={PaymentStatus.UNPAID}>{t('reservations.status.pending')}</option>
                        <option value={PaymentStatus.PAID}>{t('reservations.status.paid')}</option>
                    </select>

                    <select
                        className="border border-keikichi-lime-200 dark:border-keikichi-forest-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-keikichi-forest-700 text-keikichi-forest-800 dark:text-white"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">{t('common.allStatuses')}</option>
                        <option value={ReservationStatus.PENDING}>{t('reservations.status.pending')}</option>
                        <option value={ReservationStatus.CONFIRMED}>{t('reservations.status.confirmed')}</option>
                        <option value={ReservationStatus.CANCELLED}>{t('reservations.status.cancelled')}</option>
                    </select>
                </div>
            </div>

            {/* Bulk Action Bar */}
            {selectedIds.length > 0 && (
                <div className="bg-keikichi-lime-50 dark:bg-keikichi-lime-900/20 border border-keikichi-lime-200 dark:border-keikichi-lime-800 rounded-lg p-3 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
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
                <div className="text-center py-12 text-keikichi-forest-500 dark:text-keikichi-lime-300">{t('reservations.loadingReservations')}</div>
            ) : (
                <div className="bg-white dark:bg-keikichi-forest-800 rounded-lg border border-keikichi-lime-100 dark:border-keikichi-forest-600 shadow-sm overflow-hidden transition-colors">
                    <div className="table-responsive">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-keikichi-lime-50 dark:bg-keikichi-forest-700 text-keikichi-forest-600 dark:text-keikichi-lime-300 font-medium border-b border-keikichi-lime-100 dark:border-keikichi-forest-600">
                                <tr>
                                    <th className="px-4 py-3 w-10">
                                        <input
                                            type="checkbox"
                                            className="rounded border-keikichi-lime-300 dark:border-keikichi-forest-500 bg-white dark:bg-keikichi-forest-700 text-keikichi-lime-600 focus:ring-keikichi-lime-500"
                                            checked={data?.items.length === selectedIds.length && (data?.items.length ?? 0) > 0}
                                            onChange={handleSelectAll}
                                        />
                                    </th>
                                    <th className="px-4 py-3">{t('reservations.idDate')}</th>
                                    <th className="px-4 py-3">{t('reservations.client')}</th>
                                    <th className="px-4 py-3">{t('reservations.trip')}</th>
                                    <th className="px-4 py-3">{t('trips.spaces')}</th>
                                    <th className="px-4 py-3">{t('common.total')}</th>
                                    <th className="px-4 py-3">{t('common.status')}</th>
                                    <th className="px-4 py-3">{t('reservations.payment')}</th>
                                    <th className="px-4 py-3 text-right">{t('common.actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-keikichi-lime-50 dark:divide-keikichi-forest-600">
                                {data?.items.map((res) => (
                                    <tr key={res.id} className={`hover:bg-keikichi-lime-50/50 dark:hover:bg-keikichi-forest-700/50 transition-colors ${selectedIds.includes(res.id) ? 'bg-keikichi-lime-50/50 dark:bg-keikichi-lime-900/10' : ''}`}>
                                        <td className="px-4 py-3">
                                            <input
                                                type="checkbox"
                                                className="rounded border-keikichi-lime-300 dark:border-keikichi-forest-500 bg-white dark:bg-keikichi-forest-700 text-keikichi-lime-600 focus:ring-keikichi-lime-500"
                                                checked={selectedIds.includes(res.id)}
                                                onChange={() => handleSelectRow(res.id)}
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-mono text-xs text-keikichi-forest-400 dark:text-keikichi-lime-500">#{res.id.slice(0, 8)}</div>
                                            <div className="text-keikichi-forest-800 dark:text-white">
                                                {format(new Date(res.created_at), i18n.language === 'es' ? "d MMM yyyy" : "MMM d, yyyy", { locale: dateLocale })}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-keikichi-forest-800 dark:text-white">
                                                {res.client_name || t('common.unknown')}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-keikichi-forest-800 dark:text-white">
                                                {res.trip_origin} → {res.trip_destination}
                                            </div>
                                            <div className="text-xs text-keikichi-forest-400 dark:text-keikichi-lime-400">
                                                {res.trip_departure_date && format(new Date(res.trip_departure_date), i18n.language === 'es' ? "d MMM" : "MMM d", { locale: dateLocale })}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="bg-keikichi-lime-100 dark:bg-keikichi-forest-600 px-2 py-1 rounded text-xs font-medium text-keikichi-forest-800 dark:text-keikichi-lime-200">
                                                {res.spaces_count}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 font-medium text-keikichi-forest-800 dark:text-white">
                                            <div className="flex flex-col">
                                                <span>${res.total_amount.toLocaleString()}</span>
                                                <span className="text-[10px] text-keikichi-forest-400 dark:text-keikichi-lime-400 font-normal">{res.currency || 'USD'}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium
                                                ${res.status === ReservationStatus.CONFIRMED ? 'bg-keikichi-lime-100 text-keikichi-lime-800 dark:bg-keikichi-lime-900/30 dark:text-keikichi-lime-400' :
                                                    res.status === ReservationStatus.CANCELLED ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                                                        'bg-keikichi-yellow-100 text-keikichi-yellow-800 dark:bg-keikichi-yellow-900/30 dark:text-keikichi-yellow-400'}`}>
                                                {getStatusLabel(res.status)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`flex items-center gap-1 w-fit px-2 py-1 rounded-full text-xs font-medium
                                                ${res.payment_status === PaymentStatus.PAID ? 'bg-keikichi-lime-100 text-keikichi-lime-800 dark:bg-keikichi-lime-900/30 dark:text-keikichi-lime-400' :
                                                    res.payment_status === PaymentStatus.PENDING_REVIEW ? 'bg-keikichi-forest-100 text-keikichi-forest-800 dark:bg-keikichi-forest-600 dark:text-keikichi-lime-300' :
                                                        'bg-keikichi-lime-50 text-keikichi-forest-600 dark:bg-keikichi-forest-600 dark:text-keikichi-lime-400'}`}>
                                                {res.payment_status === PaymentStatus.PENDING_REVIEW && <Clock className="w-3 h-3" />}
                                                {getPaymentLabel(res.payment_status)}
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
                    <div className="px-4 py-3 border-t border-keikichi-lime-100 dark:border-keikichi-forest-600 flex justify-between items-center text-sm text-keikichi-forest-500 dark:text-keikichi-lime-400">
                        <span>{t('common.page')} {page} {t('common.of')} {data?.pages || 1}</span>
                        <div className="flex gap-2">
                            <button
                                disabled={page === 1}
                                onClick={() => setPage(p => p - 1)}
                                className="px-3 py-1 border border-keikichi-lime-200 dark:border-keikichi-forest-600 rounded hover:bg-keikichi-lime-50 dark:hover:bg-keikichi-forest-700 disabled:opacity-50 transition-colors"
                            >
                                {t('common.previous')}
                            </button>
                            <button
                                disabled={page === (data?.pages || 1)}
                                onClick={() => setPage(p => p + 1)}
                                className="px-3 py-1 border border-keikichi-lime-200 dark:border-keikichi-forest-600 rounded hover:bg-keikichi-lime-50 dark:hover:bg-keikichi-forest-700 disabled:opacity-50 transition-colors"
                            >
                                {t('common.next')}
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

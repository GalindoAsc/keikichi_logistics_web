import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { X, Check, AlertTriangle, FileText, User, Truck, DollarSign, Trash2, Ban, MessageCircle, History } from "lucide-react";
import { getReservationById, confirmPayment, cancelReservation, deleteReservation, getAuditHistory } from "../../api/reservations";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { PaymentStatus, ReservationStatus } from "../../types/reservation";

// Helper to create WhatsApp URL with pre-filled message
const createWhatsAppUrl = (phone: string, message: string): string => {
    // Clean phone number
    let cleanPhone = phone.replace(/[\s\-\(\)\.]/g, '');
    // If doesn't start with + or country code, assume Mexico (+52)
    if (!cleanPhone.startsWith('+') && !cleanPhone.startsWith('52')) {
        cleanPhone = '52' + cleanPhone;
    }
    cleanPhone = cleanPhone.replace('+', '');

    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
};

// Helper to create Mailto URL with Subject and Body
const createEmailLink = (email: string, reservation: any): string => {
    const subject = encodeURIComponent(`Información sobre reservación: ${reservation.trip?.origin} - ${reservation.trip?.destination}`);

    const isPaid = reservation.payment_status === PaymentStatus.PAID;
    // Ensure apiUrl includes /api/v1 if not present in env, or assume env has it.
    // Based on user error, VITE_API_URL likely has /api/v1.
    // We will standardize on using the base URL and appending the correct path.
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

    // Cleanup apiUrl to ensure consistent base (although normally we trust the env)
    // But for the specific download links, we need to match the backend route structure.
    // If apiUrl ends with /api/v1, we append /reservations/...

    // Construct body text
    let body = `Hola ${reservation.client_name || 'Cliente'},\n\n`;

    if (isPaid) {
        body += `Tu pago ha sido confirmado para el viaje de ${reservation.trip?.origin} a ${reservation.trip?.destination}.\n\n`;
        body += `📅 Salida: ${reservation.trip ? format(parseISO(reservation.trip.departure_date), "d 'de' MMMM, yyyy", { locale: es }) : ''}\n`;
        body += `✅ Total: $${reservation.total_amount?.toLocaleString()}\n\n`;
        body += `Puedes descargar tu ticket confirmado aquí:\n`;
        body += `${apiUrl}/reservations/public/ticket/${reservation.id}\n\n`;
    } else {
        body += `Adjuntamos información sobre tu pre-reservación pendiente de pago.\n\n`;
        body += `📦 Viaje: ${reservation.trip?.origin} -> ${reservation.trip?.destination}\n`;
        body += `💰 Total a pagar: $${reservation.total_amount?.toLocaleString()}\n\n`;
        body += `Descarga el resumen de la reserva aquí:\n`;
        body += `${apiUrl}/reservations/public/summary/${reservation.id}\n\n`;
        body += `Por favor envía tu comprobante de pago respondiendo a este correo.\n\n`;
    }

    body += `Atentamente,\nKeikichi Logistics`;

    return `mailto:${email}?subject=${subject}&body=${encodeURIComponent(body)}`;
};

interface Props {
    reservationId: string;
    onClose: () => void;
}

export default function AdminReservationDetailModal({ reservationId, onClose }: Props) {
    const { data: reservation, isLoading, error, refetch } = useQuery({
        queryKey: ["reservation", reservationId],
        queryFn: () => getReservationById(reservationId),
        retry: 1
    });

    const { data: auditData } = useQuery({
        queryKey: ["reservation-audit", reservationId],
        queryFn: () => getAuditHistory(reservationId),
        retry: 1
    });

    // State for rejection modal
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectionNotes, setRejectionNotes] = useState("");

    const confirmMutation = useMutation({
        mutationFn: ({ approved, notes }: { approved: boolean; notes?: string }) =>
            confirmPayment(reservationId, { approved, notes }),
        onSuccess: (data) => {
            toast.success(data.message);
            setShowRejectModal(false);
            setRejectionNotes("");
            refetch();
        },
        onError: () => {
            toast.error("Error al procesar el pago");
        }
    });

    const cancelMutation = useMutation({
        mutationFn: () => cancelReservation(reservationId),
        onSuccess: () => {
            toast.success("Reservación cancelada exitosamente");
            refetch();
        },
        onError: () => {
            toast.error("Error al cancelar la reservación");
        }
    });

    const deleteMutation = useMutation({
        mutationFn: () => deleteReservation(reservationId),
        onSuccess: () => {
            toast.success("Reservación eliminada permanentemente");
            onClose();
        },
        onError: () => {
            toast.error("Error al eliminar la reservación");
        }
    });

    if (isLoading) return null;

    if (error || !reservation) {
        return (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-keikichi-forest-800 rounded-xl p-6 max-w-md w-full text-center">
                    <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Error al cargar</h3>
                    <p className="text-slate-500 dark:text-slate-400 mb-6">No se pudo cargar la información de la reservación.</p>
                    <button onClick={onClose} className="px-4 py-2 bg-slate-100 dark:bg-slate-700 dark:text-white rounded-lg font-medium hover:bg-slate-200 dark:hover:bg-slate-600">
                        Cerrar
                    </button>
                </div>
            </div>
        );
    }

    const isPendingReview = reservation.payment_status === PaymentStatus.PENDING_REVIEW;
    const canCancel = reservation.status !== ReservationStatus.CANCELLED;

    const paymentMethodMap: Record<string, string> = {
        bank_transfer: "Transferencia Bancaria",
        credit_card: "Tarjeta de Crédito",
        cash: "Efectivo"
    };

    const statusMap: Record<string, string> = {
        pending: "Pendiente",
        confirmed: "Confirmada",
        cancelled: "Cancelada",
        on_hold: "En Espera"
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white dark:bg-keikichi-forest-900 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto transition-colors">
                {/* Header */}
                <div className="p-6 border-b border-slate-200 dark:border-keikichi-forest-600 flex justify-between items-center sticky top-0 bg-white dark:bg-keikichi-forest-900 z-10">
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Detalle de Reservación</h2>
                            <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase
                                ${reservation.status === ReservationStatus.CONFIRMED ? 'bg-green-100 text-green-700' :
                                    reservation.status === ReservationStatus.CANCELLED ? 'bg-red-100 text-red-700' :
                                        'bg-yellow-100 text-yellow-700'}`}>
                                {statusMap[reservation.status] || reservation.status}
                            </span>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-keikichi-lime-300">ID: {reservation.id}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {canCancel && (
                            <button
                                onClick={() => {
                                    if (window.confirm("¿Estás seguro de cancelar esta reservación? Esto liberará los espacios.")) {
                                        cancelMutation.mutate();
                                    }
                                }}
                                className="p-2 text-orange-600 hover:bg-orange-50 rounded-full transition-colors"
                                title="Cancelar reservación"
                            >
                                <Ban className="w-5 h-5" />
                            </button>
                        )}
                        <button
                            onClick={() => {
                                if (window.confirm("¿Estás seguro de eliminar PERMANENTEMENTE esta reservación? Esta acción no se puede deshacer.")) {
                                    deleteMutation.mutate();
                                }
                            }}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                            title="Eliminar reservación permanentemente"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                            <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                        </button>
                    </div>
                </div>

                <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column: Details */}
                    <div className="space-y-6">
                        {/* Status Banner */}
                        <div className={`p-4 rounded-lg flex items-center gap-3
                            ${reservation.payment_status === PaymentStatus.PAID ? 'bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                                reservation.payment_status === PaymentStatus.PENDING_REVIEW ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' :
                                    'bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-300'}`}>
                            <div className="font-medium flex items-center gap-2">
                                {reservation.payment_status === PaymentStatus.PENDING_REVIEW && <AlertTriangle className="w-4 h-4" />}
                                {reservation.payment_status === PaymentStatus.PAID && <Check className="w-4 h-4" />}

                                {reservation.payment_status === 'pending_review' ? 'Pago en Revisión' :
                                    reservation.payment_status === 'paid' ? 'Pago Completado' : 'Pago Pendiente'}
                            </div>
                        </div>

                        {/* Client Info */}
                        <div className="space-y-2">
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                                <User className="w-4 h-4" /> Cliente
                            </h3>
                            <div className="bg-slate-50 dark:bg-keikichi-forest-800 p-4 rounded-lg text-sm space-y-1 dark:text-slate-300">
                                <p><span className="font-medium dark:text-white">Nombre:</span> {reservation.client_name || "Desconocido"}</p>
                                <p><span className="font-medium dark:text-white">Email:</span> {reservation.client_email || "No disponible"}</p>
                                <p><span className="font-medium dark:text-white">Teléfono:</span> {reservation.client_phone || "No disponible"}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">ID: {reservation.client_id}</p>

                                {/* Contact Actions Grid */}
                                <div className="mt-4 grid grid-cols-2 gap-3">
                                    {/* WhatsApp Button */}
                                    {reservation.client_phone ? (
                                        <a
                                            href={createWhatsAppUrl(
                                                reservation.client_phone,
                                                reservation.payment_status === PaymentStatus.PAID
                                                    ? `¡Hola ${reservation.client_name || ''}! 🎉\n\n` +
                                                    `Tu pago ha sido *confirmado* para tu reservación en *Keikichi Logistics*:\n\n` +
                                                    `📦 Viaje: ${reservation.trip?.origin || ''} → ${reservation.trip?.destination || ''}\n` +
                                                    `📅 Fecha: ${reservation.trip ? format(parseISO(reservation.trip.departure_date), "d 'de' MMMM, yyyy", { locale: es }) : ''}\n` +
                                                    `✅ Total pagado: *$${reservation.total_amount.toLocaleString()}*\n\n` +
                                                    `🎫 Descarga tu ticket aquí:\n` +
                                                    `${import.meta.env.VITE_API_URL}/reservations/public/ticket/${reservation.id}\n\n` +
                                                    `¡Gracias por confiar en nosotros! Nos vemos pronto.`
                                                    : `¡Hola ${reservation.client_name || ''}! 👋\n\n` +
                                                    `Te contactamos de *Keikichi Logistics* respecto a tu pre-reservación:\n\n` +
                                                    `📦 Viaje: ${reservation.trip?.origin || ''} → ${reservation.trip?.destination || ''}\n` +
                                                    `📅 Fecha: ${reservation.trip ? format(parseISO(reservation.trip.departure_date), "d 'de' MMMM, yyyy", { locale: es }) : ''}\n` +
                                                    `💰 Total a pagar: *$${reservation.total_amount.toLocaleString()}*\n\n` +
                                                    `📄 Descarga tu resumen de pre-reservación aquí:\n` +
                                                    `${import.meta.env.VITE_API_URL}/reservations/public/summary/${reservation.id}\n\n` +
                                                    `Una vez realizado el pago, envíanos tu comprobante. ¡Gracias!`
                                            )}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="col-span-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors"
                                        >
                                            <MessageCircle className="w-4 h-4" />
                                            WhatsApp
                                        </a>
                                    ) : (
                                        <button disabled className="col-span-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-100 text-slate-400 text-xs font-medium rounded-lg cursor-not-allowed border border-slate-200">
                                            <MessageCircle className="w-4 h-4" />
                                            Sin WhatsApp
                                        </button>
                                    )}

                                    {/* Email Button */}
                                    {reservation.client_email ? (
                                        <a
                                            href={createEmailLink(reservation.client_email, reservation)}
                                            className="col-span-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
                                        >
                                            <FileText className="w-4 h-4" />
                                            Email
                                        </a>
                                    ) : (
                                        <button disabled className="col-span-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 text-xs font-medium rounded-lg cursor-not-allowed border border-slate-200 dark:border-slate-700">
                                            <FileText className="w-4 h-4" />
                                            Sin Email
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Trip Info */}
                        <div className="space-y-2">
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                                <Truck className="w-4 h-4" /> Viaje
                            </h3>
                            <div className="bg-slate-50 dark:bg-keikichi-forest-800 p-4 rounded-lg text-sm space-y-1 dark:text-slate-300">
                                {reservation.trip && (
                                    <>
                                        <p className="font-medium text-base dark:text-white">{reservation.trip.origin} → {reservation.trip.destination}</p>
                                        <p className="text-slate-600 dark:text-slate-400">
                                            Salida: {format(parseISO(reservation.trip.departure_date), "d 'de' MMMM, yyyy", { locale: es })}
                                        </p>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Financials */}
                        <div className="space-y-2">
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                                <DollarSign className="w-4 h-4" /> Desglose
                            </h3>
                            <div className="bg-slate-50 dark:bg-keikichi-forest-800 p-4 rounded-lg text-sm space-y-2 dark:text-slate-300">
                                <div className="flex justify-between">
                                    <span>Subtotal</span>
                                    <span>${reservation.subtotal.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                                    <span>Impuestos</span>
                                    <span>${reservation.tax_amount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between font-bold text-lg pt-2 border-t border-slate-200 dark:border-slate-700 dark:text-white">
                                    <span>Total</span>
                                    <span>${reservation.total_amount.toLocaleString()} <span className="text-xs font-normal text-slate-500 dark:text-slate-400 uppercase">{reservation.trip?.currency || 'USD'}</span></span>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Método: {paymentMethodMap[reservation.payment_method] || reservation.payment_method}</p>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Payment Proof & Actions */}
                    <div className="space-y-6">
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                            <FileText className="w-4 h-4" /> Comprobante de Pago
                        </h3>

                        {reservation.payment_proof_path ? (
                            <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800">
                                {reservation.payment_proof_path.endsWith('.pdf') ? (
                                    <div className="p-8 text-center">
                                        <FileText className="w-16 h-16 mx-auto text-slate-400 mb-2" />
                                        <p className="text-sm text-slate-600 mb-4">Archivo PDF</p>
                                        <a
                                            href={`${import.meta.env.VITE_API_URL}/${reservation.payment_proof_path}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-indigo-600 hover:underline text-sm font-medium"
                                        >
                                            Ver Documento
                                        </a>
                                    </div>
                                ) : (
                                    <img
                                        src={`${import.meta.env.VITE_API_URL}/${reservation.payment_proof_path}`}
                                        alt="Comprobante"
                                        className="w-full h-auto object-contain max-h-[400px]"
                                    />
                                )}
                            </div>
                        ) : (
                            <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg p-8 text-center text-slate-400 dark:text-slate-500">
                                <AlertTriangle className="w-12 h-12 mx-auto mb-2" />
                                <p>No se ha subido comprobante</p>
                            </div>
                        )}

                        {/* Actions */}
                        {isPendingReview && (
                            <>
                                {/* Rejection Modal */}
                                {showRejectModal && (
                                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
                                        <h4 className="font-medium text-red-800 dark:text-red-300 mb-2">Motivo del Rechazo</h4>
                                        <textarea
                                            value={rejectionNotes}
                                            onChange={(e) => setRejectionNotes(e.target.value)}
                                            placeholder="Ej: El comprobante está borroso, por favor sube uno más claro..."
                                            className="w-full rounded-lg border border-red-200 dark:border-red-700 p-2 text-sm bg-white dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-red-500"
                                            rows={3}
                                        />
                                        <div className="flex gap-2 mt-3">
                                            <button
                                                onClick={() => {
                                                    setShowRejectModal(false);
                                                    setRejectionNotes("");
                                                }}
                                                className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-sm hover:bg-slate-100 dark:hover:bg-slate-700"
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                onClick={() => confirmMutation.mutate({ approved: false, notes: rejectionNotes })}
                                                disabled={confirmMutation.isPending}
                                                className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                                            >
                                                Confirmar Rechazo
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {!showRejectModal && (
                                    <div className="flex gap-3 pt-4">
                                        <button
                                            onClick={() => setShowRejectModal(true)}
                                            disabled={confirmMutation.isPending}
                                            className="flex-1 px-4 py-3 bg-red-50 text-red-700 font-medium rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <X className="w-5 h-5" /> Rechazar
                                        </button>
                                        <button
                                            onClick={() => confirmMutation.mutate({ approved: true })}
                                            disabled={confirmMutation.isPending}
                                            className="flex-1 px-4 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
                                        >
                                            <Check className="w-5 h-5" /> Aprobar Pago
                                        </button>
                                    </div>
                                )}
                            </>
                        )}

                        {reservation.payment_status === PaymentStatus.PAID && (
                            <div className="bg-green-50 p-4 rounded-lg text-green-800 text-sm text-center">
                                <Check className="w-6 h-6 mx-auto mb-1" />
                                Pago verificado y aprobado
                            </div>
                        )}

                        {/* Audit History */}
                        {auditData?.audit_history && auditData.audit_history.length > 0 && (
                            <div className="mt-6 space-y-2">
                                <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                                    <History className="w-4 h-4" /> Historial de Cambios
                                </h3>
                                <div className="bg-slate-50 dark:bg-keikichi-forest-800 rounded-lg divide-y divide-slate-200 dark:divide-slate-700 max-h-48 overflow-y-auto">
                                    {auditData.audit_history.map((log) => (
                                        <div key={log.id} className="p-3 text-xs">
                                            <div className="flex justify-between items-start">
                                                <span className={`font-medium ${log.action === 'payment_approved' ? 'text-green-700' :
                                                    log.action === 'payment_rejected' ? 'text-red-700' :
                                                        'text-slate-700'
                                                    }`}>
                                                    {log.action === 'payment_approved' ? '✅ Pago Aprobado' :
                                                        log.action === 'payment_rejected' ? '❌ Pago Rechazado' :
                                                            log.action}
                                                </span>
                                                <span className="text-slate-400">
                                                    {log.created_at && format(new Date(log.created_at), "d MMM HH:mm", { locale: es })}
                                                </span>
                                            </div>
                                            <p className="text-slate-500 dark:text-slate-400 mt-1">Por: {log.performed_by}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

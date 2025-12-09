import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, Package, Truck, Upload, FileText, Loader2, Download, CreditCard } from "lucide-react";
import { getReservations, uploadPaymentProof, downloadAndSaveTicket, downloadAndSaveSummary, updateReservation } from "../../api/reservations";
import { ReservationStatus, PaymentStatus, PaymentMethod } from "../../types/reservation";
import { RESERVATION_STATUS_LABELS, PAYMENT_STATUS_LABELS, PAYMENT_METHOD_LABELS } from "../../types/translations";
import { useState } from "react";
import { toast } from "sonner";

const STATUS_COLORS = {
    [ReservationStatus.PENDING]: "bg-yellow-100 text-yellow-800",
    [ReservationStatus.CONFIRMED]: "bg-green-100 text-green-800",
    [ReservationStatus.CANCELLED]: "bg-red-100 text-red-800",
};

const PAYMENT_STATUS_COLORS = {
    [PaymentStatus.UNPAID]: "bg-red-100 text-red-800",
    [PaymentStatus.PENDING_REVIEW]: "bg-yellow-100 text-yellow-800",
    [PaymentStatus.PAID]: "bg-green-100 text-green-800",
    [PaymentStatus.REFUNDED]: "bg-gray-100 text-gray-800",
};

export default function ReservationsPage() {
    const { data, isLoading, refetch } = useQuery({
        queryKey: ["reservations"],
        queryFn: () => getReservations(1, 100), // Fetch all for now
    });

    const [uploadingId, setUploadingId] = useState<string | null>(null);
    const [downloadingId, setDownloadingId] = useState<string | null>(null);
    const [downloadingSummaryId, setDownloadingSummaryId] = useState<string | null>(null);
    const [changingPaymentId, setChangingPaymentId] = useState<string | null>(null);

    const handleFileUpload = async (reservationId: string, file: File) => {
        try {
            setUploadingId(reservationId);
            await uploadPaymentProof(reservationId, file);
            toast.success("Comprobante subido exitosamente");
            refetch();
        } catch (error) {
            toast.error("Error al subir el comprobante");
            console.error(error);
        } finally {
            setUploadingId(null);
        }
    };

    const handleDownloadTicket = async (reservationId: string) => {
        try {
            setDownloadingId(reservationId);
            await downloadAndSaveTicket(reservationId);
            toast.success("Ticket descargado");
        } catch (error: any) {
            const message = error?.response?.status === 404
                ? "El ticket aún no está disponible"
                : "Error al descargar el ticket";
            toast.error(message);
            console.error(error);
        } finally {
            setDownloadingId(null);
        }
    };

    const handleDownloadSummary = async (reservationId: string) => {
        try {
            setDownloadingSummaryId(reservationId);
            await downloadAndSaveSummary(reservationId);
            toast.success("Resumen descargado");
        } catch (error: any) {
            toast.error("Error al descargar el resumen");
            console.error(error);
        } finally {
            setDownloadingSummaryId(null);
        }
    };

    const handlePaymentMethodChange = async (reservationId: string, newMethod: PaymentMethod) => {
        try {
            setChangingPaymentId(reservationId);
            await updateReservation(reservationId, { payment_method: newMethod });
            toast.success("Método de pago actualizado");
            refetch();
        } catch (error: any) {
            toast.error(error?.response?.data?.detail || "Error al cambiar el método de pago");
            console.error(error);
        } finally {
            setChangingPaymentId(null);
        }
    };

    if (isLoading) {
        return <div className="p-8 text-center">Cargando reservaciones...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-900">Mis Reservaciones</h1>
            </div>

            {data?.items.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
                    <Package className="mx-auto h-12 w-12 text-slate-400" />
                    <h3 className="mt-2 text-sm font-semibold text-slate-900">No tienes reservaciones</h3>
                    <p className="mt-1 text-sm text-slate-500">Comienza reservando un espacio en nuestros viajes.</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {data?.items.map((reservation) => (
                        <div
                            key={reservation.id}
                            className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden"
                        >
                            <div className="p-6">
                                <div className="flex flex-col md:flex-row justify-between gap-4">
                                    {/* Trip Info */}
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-slate-500 text-sm">
                                            <Calendar className="w-4 h-4" />
                                            <span>
                                                {reservation.trip_departure_date
                                                    ? format(new Date(reservation.trip_departure_date), "d 'de' MMMM, yyyy", { locale: es })
                                                    : "Fecha pendiente"}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 font-medium text-lg">
                                            <Truck className="w-5 h-5 text-indigo-600" />
                                            <span>
                                                {reservation.trip_origin} <span className="text-slate-400">→</span> {reservation.trip_destination}
                                            </span>
                                        </div>
                                        <div className="text-sm text-slate-600">
                                            {reservation.spaces_count} espacio(s) reservado(s)
                                        </div>
                                    </div>

                                    {/* Status & Amount */}
                                    <div className="flex flex-col items-end gap-2">
                                        <div className="flex gap-2">
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[reservation.status]}`}>
                                                {RESERVATION_STATUS_LABELS[reservation.status]}
                                            </span>
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${PAYMENT_STATUS_COLORS[reservation.payment_status]}`}>
                                                {PAYMENT_STATUS_LABELS[reservation.payment_status]}
                                            </span>
                                        </div>
                                        <div className="text-2xl font-bold text-slate-900">
                                            ${Number(reservation.total_amount).toLocaleString()}
                                            <span className="text-sm text-slate-500 ml-1 font-normal uppercase">{reservation.currency || 'USD'}</span>
                                        </div>
                                        {/* Payment Method - Editable if unpaid */}
                                        {reservation.payment_status === PaymentStatus.UNPAID ? (
                                            <div className="flex items-center gap-2">
                                                <CreditCard className="w-4 h-4 text-slate-400" />
                                                <select
                                                    value={reservation.payment_method}
                                                    onChange={(e) => handlePaymentMethodChange(reservation.id, e.target.value as PaymentMethod)}
                                                    disabled={changingPaymentId === reservation.id}
                                                    className="text-xs border border-slate-200 rounded px-2 py-1 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
                                                >
                                                    <option value={PaymentMethod.CASH}>{PAYMENT_METHOD_LABELS[PaymentMethod.CASH]}</option>
                                                    <option value={PaymentMethod.BANK_TRANSFER}>{PAYMENT_METHOD_LABELS[PaymentMethod.BANK_TRANSFER]}</option>
                                                    <option value={PaymentMethod.MERCADOPAGO}>{PAYMENT_METHOD_LABELS[PaymentMethod.MERCADOPAGO]}</option>
                                                </select>
                                            </div>
                                        ) : (
                                            <div className="text-xs text-slate-500 uppercase">
                                                {PAYMENT_METHOD_LABELS[reservation.payment_method]}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Actions Footer */}
                                <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end gap-3">
                                    {reservation.payment_status === PaymentStatus.UNPAID && (
                                        <>
                                            <button
                                                onClick={() => handleDownloadSummary(reservation.id)}
                                                disabled={downloadingSummaryId === reservation.id}
                                                className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                                            >
                                                {downloadingSummaryId === reservation.id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Download className="w-4 h-4" />
                                                )}
                                                Descargar Resumen
                                            </button>
                                            <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
                                                {uploadingId === reservation.id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Upload className="w-4 h-4" />
                                                )}
                                                Subir Comprobante
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    accept="image/*,.pdf"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) handleFileUpload(reservation.id, file);
                                                    }}
                                                    disabled={uploadingId === reservation.id}
                                                />
                                            </label>
                                        </>
                                    )}

                                    {reservation.payment_status === PaymentStatus.PAID && (
                                        <button
                                            onClick={() => handleDownloadTicket(reservation.id)}
                                            disabled={downloadingId === reservation.id}
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                                        >
                                            {downloadingId === reservation.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <FileText className="w-4 h-4" />
                                            )}
                                            Descargar Ticket
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

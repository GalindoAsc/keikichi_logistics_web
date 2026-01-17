import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { DollarSign, MapPin, Thermometer, Send, Eye, X } from "lucide-react";
import { toast } from "sonner";
import api from "../../api/client";
import { useTranslation } from "react-i18next";
import ConfirmationModal from "../../components/shared/ConfirmationModal";
import { QuoteCardSkeleton } from "../../components/shared/Skeleton";

interface QuoteStop {
    address: string;
    contact?: string;
    phone?: string;
    time?: string;
    notes?: string;
}

interface TripQuote {
    id: string;
    origin: string;
    destination: string;
    is_international: boolean;
    pallet_count: number;
    preferred_date: string;
    flexible_dates: boolean;
    preferred_currency: string;
    stops: QuoteStop[] | null;
    requires_bond: boolean;
    requires_refrigeration: boolean;
    temperature_min: number | null;
    temperature_max: number | null;
    requires_labeling: boolean;
    requires_pickup: boolean;
    pickup_address: string | null;
    pickup_date: string | null;
    merchandise_type: string | null;
    merchandise_weight: string | null;
    merchandise_description: string | null;
    special_requirements: string | null;
    quoted_price: number | null;
    quoted_currency: string | null;
    free_stops: number | null;
    price_per_extra_stop: number | null;
    admin_notes: string | null;
    status: string;
    client_response: string | null;
    client_name: string | null;
    client_email: string | null;
    created_at: string;
    expires_at: string | null;
    created_trip_id: string | null;
}

const statusColors: Record<string, string> = {
    pending: "bg-keikichi-yellow-100 text-keikichi-yellow-800 dark:bg-keikichi-yellow-900/30 dark:text-keikichi-yellow-400",
    quoted: "bg-keikichi-lime-100 text-keikichi-lime-800 dark:bg-keikichi-lime-900/30 dark:text-keikichi-lime-400",
    negotiating: "bg-keikichi-forest-100 text-keikichi-forest-800 dark:bg-keikichi-forest-600 dark:text-keikichi-lime-300",
    accepted: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    expired: "bg-keikichi-forest-100 text-keikichi-forest-600 dark:bg-keikichi-forest-700 dark:text-keikichi-lime-500"
};

export default function TripQuotesPage() {
    const queryClient = useQueryClient();
    const { t, i18n } = useTranslation();
    const dateLocale = i18n.language === 'es' ? es : enUS;
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [selectedQuote, setSelectedQuote] = useState<TripQuote | null>(null);
    const [quotingId, setQuotingId] = useState<string | null>(null);
    const [deleteQuoteId, setDeleteQuoteId] = useState<string | null>(null);
    const [quoteForm, setQuoteForm] = useState({
        quoted_price: "",
        quoted_currency: "USD",
        free_stops: "0",
        price_per_extra_stop: "",
        admin_notes: ""
    });

    const { data: quotes = [], isLoading } = useQuery<TripQuote[]>({
        queryKey: ["admin-quotes", statusFilter],
        queryFn: async () => {
            const params = statusFilter !== "all" ? `?status=${statusFilter}` : "";
            const res = await api.get(`/trip-quotes${params}`);
            return res.data;
        }
    });

    const quoteMutation = useMutation({
        mutationFn: async ({ quoteId, data }: { quoteId: string; data: any }) => {
            const res = await api.patch(`/trip-quotes/${quoteId}/quote`, data);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-quotes"] });
            setQuotingId(null);
            setQuoteForm({ quoted_price: "", quoted_currency: "USD", free_stops: "0", price_per_extra_stop: "", admin_notes: "" });
            toast.success(t('quotes.priceSent'));
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.detail || t('errors.generic'));
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (quoteId: string) => {
            await api.delete(`/trip-quotes/${quoteId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-quotes"] });
            toast.success(t('quotes.deleted'));
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.detail || t('errors.generic'));
        }
    });

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            pending: t('quotes.status.pending'),
            quoted: t('quotes.status.quoted'),
            negotiating: t('quotes.status.negotiating'),
            accepted: t('quotes.status.accepted'),
            rejected: t('quotes.status.rejected'),
            expired: t('quotes.status.expired')
        };
        return labels[status] || status;
    };

    const handleSendQuote = (quoteId: string) => {
        if (!quoteForm.quoted_price || parseFloat(quoteForm.quoted_price) <= 0) {
            toast.error(t('quotes.priceRequired'));
            return;
        }
        quoteMutation.mutate({
            quoteId,
            data: {
                quoted_price: parseFloat(quoteForm.quoted_price),
                quoted_currency: quoteForm.quoted_currency,
                free_stops: parseInt(quoteForm.free_stops) || 0,
                price_per_extra_stop: quoteForm.price_per_extra_stop ? parseFloat(quoteForm.price_per_extra_stop) : null,
                admin_notes: quoteForm.admin_notes || null
            }
        });
    };

    const handleDelete = (quoteId: string) => {
        setDeleteQuoteId(quoteId);
    };

    const confirmDelete = () => {
        if (deleteQuoteId) {
            deleteMutation.mutate(deleteQuoteId);
            setDeleteQuoteId(null);
        }
    };

    const pendingCount = quotes.filter(q => q.status === "pending" || q.status === "negotiating").length;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-keikichi-forest-800 dark:text-white">{t('quotes.adminTitle')}</h1>
                    <p className="text-keikichi-forest-500 dark:text-keikichi-lime-400">{t('quotes.adminSubtitle')}</p>
                </div>

                <div className="flex items-center gap-2">
                    {pendingCount > 0 && (
                        <span className="bg-keikichi-yellow-100 dark:bg-keikichi-yellow-900/30 text-keikichi-yellow-800 dark:text-keikichi-yellow-400 px-3 py-1 rounded-full text-sm font-medium">
                            {pendingCount} {t('quotes.pendingQuotes')}
                        </span>
                    )}
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="border border-keikichi-lime-200 dark:border-keikichi-forest-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-keikichi-forest-700 text-keikichi-forest-800 dark:text-white"
                    >
                        <option value="all">{t('common.allStatuses')}</option>
                        <option value="pending">{t('quotes.status.pending')}</option>
                        <option value="quoted">{t('quotes.status.quoted')}</option>
                        <option value="negotiating">{t('quotes.status.negotiating')}</option>
                        <option value="accepted">{t('quotes.status.accepted')}</option>
                        <option value="rejected">{t('quotes.status.rejected')}</option>
                    </select>
                </div>
            </div>

            {isLoading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-white dark:bg-keikichi-forest-800 rounded-lg border border-keikichi-lime-100 dark:border-keikichi-forest-600">
                            <QuoteCardSkeleton />
                        </div>
                    ))}
                </div>
            ) : quotes.length === 0 ? (
                <div className="bg-white dark:bg-keikichi-forest-800 rounded-lg border border-keikichi-lime-100 dark:border-keikichi-forest-600 p-12 text-center">
                    <DollarSign className="w-12 h-12 mx-auto text-keikichi-lime-300 dark:text-keikichi-forest-600 mb-4" />
                    <p className="text-keikichi-forest-500 dark:text-keikichi-lime-400">{t('quotes.noQuotesAdmin')}</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {quotes.map((quote) => (
                        <div key={quote.id} className="bg-white dark:bg-keikichi-forest-800 rounded-lg border border-keikichi-lime-100 dark:border-keikichi-forest-600 shadow-sm overflow-hidden transition-colors">
                            <div className="p-6">
                                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                                    {/* Quote Info */}
                                    <div className="flex-1 space-y-3">
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[quote.status]}`}>
                                                {getStatusLabel(quote.status)}
                                            </span>
                                            {quote.is_international && (
                                                <span className="px-2 py-1 bg-keikichi-forest-100 dark:bg-keikichi-forest-600 text-keikichi-forest-700 dark:text-keikichi-lime-300 text-xs rounded">
                                                    {t('trips.international')}
                                                </span>
                                            )}
                                            {quote.requires_refrigeration && (
                                                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded flex items-center gap-1">
                                                    <Thermometer className="w-3 h-3" />
                                                    {quote.temperature_min}° - {quote.temperature_max}°C
                                                </span>
                                            )}
                                            {quote.requires_bond && (
                                                <span className="px-2 py-1 bg-keikichi-yellow-100 dark:bg-keikichi-yellow-900/30 text-keikichi-yellow-700 dark:text-keikichi-yellow-400 text-xs rounded">
                                                    {t('quotes.usesKeikichiBond')}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2 text-lg font-medium text-keikichi-forest-800 dark:text-white">
                                            <MapPin className="w-5 h-5 text-keikichi-lime-600" />
                                            {quote.origin} → {quote.destination}
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                            <div>
                                                <p className="text-keikichi-forest-400 dark:text-keikichi-lime-500">{t('quotes.client')}</p>
                                                <p className="font-medium text-keikichi-forest-800 dark:text-white">{quote.client_name}</p>
                                                <p className="text-xs text-keikichi-forest-400 dark:text-keikichi-lime-500">{quote.client_email}</p>
                                            </div>
                                            <div>
                                                <p className="text-keikichi-forest-400 dark:text-keikichi-lime-500">{t('quotes.pallets')}</p>
                                                <p className="font-medium text-keikichi-forest-800 dark:text-white">{quote.pallet_count}</p>
                                            </div>
                                            <div>
                                                <p className="text-keikichi-forest-400 dark:text-keikichi-lime-500">{t('quotes.preferredDate')}</p>
                                                <p className="font-medium text-keikichi-forest-800 dark:text-white">
                                                    {format(new Date(quote.preferred_date), i18n.language === 'es' ? "d MMM yyyy" : "MMM d, yyyy", { locale: dateLocale })}
                                                </p>
                                                {quote.flexible_dates && (
                                                    <p className="text-xs text-keikichi-lime-600">{t('quotes.flexible')}</p>
                                                )}
                                            </div>
                                            {quote.is_international && quote.stops && quote.stops.length > 0 && (
                                                <div>
                                                    <p className="text-keikichi-forest-400 dark:text-keikichi-lime-500">{t('quotes.stops')}</p>
                                                    <p className="font-medium text-keikichi-forest-800 dark:text-white">{quote.stops.length}</p>
                                                </div>
                                            )}
                                        </div>

                                        {quote.special_requirements && (
                                            <div className="bg-keikichi-lime-50 dark:bg-keikichi-forest-700 p-3 rounded-lg mt-2">
                                                <p className="text-xs text-keikichi-forest-500 dark:text-keikichi-lime-400 mb-1">{t('quotes.specialRequirements')}</p>
                                                <p className="text-sm text-keikichi-forest-700 dark:text-keikichi-lime-200">{quote.special_requirements}</p>
                                            </div>
                                        )}

                                        {quote.client_response && (
                                            <div className="bg-keikichi-yellow-50 dark:bg-keikichi-yellow-900/20 p-3 rounded-lg mt-2 border border-keikichi-yellow-200 dark:border-keikichi-yellow-800/30">
                                                <p className="text-xs text-keikichi-yellow-700 dark:text-keikichi-yellow-400 mb-1">{t('quotes.clientMessage')}</p>
                                                <p className="text-sm text-keikichi-forest-700 dark:text-keikichi-lime-200">{quote.client_response}</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="lg:w-72 space-y-3">
                                        {quote.quoted_price ? (
                                            <div className="bg-keikichi-lime-50 dark:bg-keikichi-lime-900/20 rounded-lg p-4 border border-keikichi-lime-200 dark:border-keikichi-lime-800">
                                                <p className="text-xs text-keikichi-forest-500 dark:text-keikichi-lime-400 mb-1">{t('quotes.quotedPrice')}</p>
                                                <p className="text-2xl font-bold text-keikichi-lime-700 dark:text-keikichi-lime-400">
                                                    ${quote.quoted_price.toLocaleString()} {quote.quoted_currency}
                                                </p>
                                            </div>
                                        ) : (
                                            quotingId === quote.id ? (
                                                <div className="space-y-3 bg-keikichi-lime-50 dark:bg-keikichi-forest-700 p-4 rounded-lg border border-keikichi-lime-200 dark:border-keikichi-forest-600">
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            placeholder={t('quotes.price')}
                                                            value={quoteForm.quoted_price}
                                                            onChange={(e) => setQuoteForm({ ...quoteForm, quoted_price: e.target.value })}
                                                            className="border border-keikichi-lime-200 dark:border-keikichi-forest-600 rounded px-2 py-1.5 text-sm bg-white dark:bg-keikichi-forest-600"
                                                        />
                                                        <select
                                                            value={quoteForm.quoted_currency}
                                                            onChange={(e) => setQuoteForm({ ...quoteForm, quoted_currency: e.target.value })}
                                                            className="border border-keikichi-lime-200 dark:border-keikichi-forest-600 rounded px-2 py-1.5 text-sm bg-white dark:bg-keikichi-forest-600"
                                                        >
                                                            <option value="USD">USD</option>
                                                            <option value="MXN">MXN</option>
                                                        </select>
                                                    </div>
                                                    {quote.is_international && (
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <input
                                                                type="number"
                                                                placeholder={t('quotes.freeStops')}
                                                                value={quoteForm.free_stops}
                                                                onChange={(e) => setQuoteForm({ ...quoteForm, free_stops: e.target.value })}
                                                                className="border border-keikichi-lime-200 dark:border-keikichi-forest-600 rounded px-2 py-1.5 text-sm bg-white dark:bg-keikichi-forest-600"
                                                            />
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                placeholder={t('quotes.extraStopPrice')}
                                                                value={quoteForm.price_per_extra_stop}
                                                                onChange={(e) => setQuoteForm({ ...quoteForm, price_per_extra_stop: e.target.value })}
                                                                className="border border-keikichi-lime-200 dark:border-keikichi-forest-600 rounded px-2 py-1.5 text-sm bg-white dark:bg-keikichi-forest-600"
                                                            />
                                                        </div>
                                                    )}
                                                    <textarea
                                                        placeholder={t('quotes.adminNotes')}
                                                        value={quoteForm.admin_notes}
                                                        onChange={(e) => setQuoteForm({ ...quoteForm, admin_notes: e.target.value })}
                                                        rows={2}
                                                        className="w-full border border-keikichi-lime-200 dark:border-keikichi-forest-600 rounded px-2 py-1.5 text-sm bg-white dark:bg-keikichi-forest-600"
                                                    />
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleSendQuote(quote.id)}
                                                            disabled={quoteMutation.isPending}
                                                            className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-keikichi-lime-600 text-white rounded text-sm hover:bg-keikichi-lime-700 disabled:opacity-50"
                                                        >
                                                            <Send className="w-4 h-4" />
                                                            {t('quotes.sendPrice')}
                                                        </button>
                                                        <button
                                                            onClick={() => setQuotingId(null)}
                                                            className="px-3 py-1.5 border border-keikichi-lime-200 dark:border-keikichi-forest-600 rounded text-sm"
                                                        >
                                                            {t('common.cancel')}
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                (quote.status === "pending" || quote.status === "negotiating") && (
                                                    <button
                                                        onClick={() => setQuotingId(quote.id)}
                                                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-keikichi-lime-600 text-white rounded-lg hover:bg-keikichi-lime-700 transition-colors"
                                                    >
                                                        <DollarSign className="w-4 h-4" />
                                                        {t('quotes.setPrice')}
                                                    </button>
                                                )
                                            )
                                        )}

                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setSelectedQuote(quote)}
                                                className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 border border-keikichi-lime-200 dark:border-keikichi-forest-600 rounded-lg text-sm text-keikichi-forest-700 dark:text-keikichi-lime-300 hover:bg-keikichi-lime-50 dark:hover:bg-keikichi-forest-700"
                                            >
                                                <Eye className="w-4 h-4" />
                                                {t('common.viewDetail')}
                                            </button>
                                            <button
                                                onClick={() => handleDelete(quote.id)}
                                                className="px-3 py-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg text-sm"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Detail Modal */}
            {selectedQuote && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedQuote(null)}>
                    <div className="bg-white dark:bg-keikichi-forest-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6 border-b border-keikichi-lime-100 dark:border-keikichi-forest-600 flex justify-between items-start">
                            <h2 className="text-xl font-bold text-keikichi-forest-800 dark:text-white">{t('quotes.quoteDetail')}</h2>
                            <button onClick={() => setSelectedQuote(null)} className="text-keikichi-forest-400 hover:text-keikichi-forest-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <pre className="text-xs bg-keikichi-lime-50 dark:bg-keikichi-forest-700 p-4 rounded-lg overflow-x-auto text-keikichi-forest-700 dark:text-keikichi-lime-200">
                                {JSON.stringify(selectedQuote, null, 2)}
                            </pre>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={deleteQuoteId !== null}
                onClose={() => setDeleteQuoteId(null)}
                onConfirm={confirmDelete}
                title={t('common.delete')}
                message={t('quotes.confirmDelete')}
                confirmText={t('common.delete')}
                cancelText={t('common.cancel')}
                isDestructive={true}
            />
        </div>
    );
}

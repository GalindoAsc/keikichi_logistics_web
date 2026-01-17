import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { ArrowLeft, Plus, Check, X, MessageSquare, Clock, DollarSign, MapPin, Package, Thermometer } from "lucide-react";
import { toast } from "sonner";
import api from "../../api/client";
import { useTranslation } from "react-i18next";
import { useState } from "react";

interface TripQuote {
    id: string;
    origin: string;
    destination: string;
    is_international: boolean;
    pallet_count: number;
    preferred_date: string;
    flexible_dates: boolean;
    preferred_currency: string;
    stops: any[] | null;
    requires_bond: boolean;
    requires_refrigeration: boolean;
    temperature_min: number | null;
    temperature_max: number | null;
    quoted_price: number | null;
    quoted_currency: string | null;
    free_stops: number | null;
    price_per_extra_stop: number | null;
    status: string;
    client_response: string | null;
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
    expired: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
};

export default function MyQuotesPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { t, i18n } = useTranslation();
    const dateLocale = i18n.language === 'es' ? es : enUS;
    const [respondingId, setRespondingId] = useState<string | null>(null);
    const [negotiateMessage, setNegotiateMessage] = useState("");

    const { data: quotes = [], isLoading } = useQuery<TripQuote[]>({
        queryKey: ["my-quotes"],
        queryFn: async () => {
            const res = await api.get("/trip-quotes");
            return res.data;
        }
    });

    const respondMutation = useMutation({
        mutationFn: async ({ quoteId, action, message }: { quoteId: string; action: string; message?: string }) => {
            const res = await api.patch(`/trip-quotes/${quoteId}/respond`, { action, message });
            return res.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["my-quotes"] });
            setRespondingId(null);
            setNegotiateMessage("");
            if (data.trip_id) {
                toast.success(t('quotes.tripCreated'));
                navigate(`/trips`);
            } else {
                toast.success(t('quotes.responseSubmitted'));
            }
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

    const handleAccept = (quoteId: string) => {
        if (confirm(t('quotes.confirmAccept'))) {
            respondMutation.mutate({ quoteId, action: "accept" });
        }
    };

    const handleNegotiate = (quoteId: string) => {
        if (!negotiateMessage.trim()) {
            toast.error(t('quotes.messageRequired'));
            return;
        }
        respondMutation.mutate({ quoteId, action: "negotiate", message: negotiateMessage });
    };

    const handleReject = (quoteId: string) => {
        if (confirm(t('quotes.confirmReject'))) {
            respondMutation.mutate({ quoteId, action: "reject" });
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center text-keikichi-forest-600 dark:text-keikichi-lime-300 hover:text-keikichi-forest-900 dark:hover:text-keikichi-lime-100 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    {t('common.back')}
                </button>
                <button
                    onClick={() => navigate("/request-trip")}
                    className="flex items-center gap-2 bg-keikichi-lime-600 hover:bg-keikichi-lime-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    {t('quotes.newRequest')}
                </button>
            </div>

            <div className="bg-white dark:bg-keikichi-forest-800 rounded-xl shadow-sm border border-keikichi-lime-100 dark:border-keikichi-forest-600 overflow-hidden">
                <div className="p-6 border-b border-keikichi-lime-100 dark:border-keikichi-forest-600">
                    <h1 className="text-2xl font-bold text-keikichi-forest-800 dark:text-white">{t('quotes.myQuotes')}</h1>
                    <p className="text-keikichi-forest-500 dark:text-keikichi-lime-400 mt-1">{t('quotes.myQuotesSubtitle')}</p>
                </div>

                {isLoading ? (
                    <div className="p-12 text-center text-keikichi-forest-500 dark:text-keikichi-lime-400">{t('common.loading')}</div>
                ) : quotes.length === 0 ? (
                    <div className="p-12 text-center">
                        <DollarSign className="w-12 h-12 mx-auto text-keikichi-lime-300 dark:text-keikichi-forest-600 mb-4" />
                        <p className="text-keikichi-forest-500 dark:text-keikichi-lime-400 mb-4">{t('quotes.noQuotes')}</p>
                        <button
                            onClick={() => navigate("/request-trip")}
                            className="text-keikichi-lime-600 hover:text-keikichi-lime-700 font-medium"
                        >
                            {t('quotes.requestFirst')}
                        </button>
                    </div>
                ) : (
                    <div className="divide-y divide-keikichi-lime-50 dark:divide-keikichi-forest-600">
                        {quotes.map((quote) => (
                            <div key={quote.id} className="p-6 hover:bg-keikichi-lime-50/50 dark:hover:bg-keikichi-forest-700/50 transition-colors">
                                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
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
                                        </div>

                                        <div className="flex items-center gap-2 text-lg font-medium text-keikichi-forest-800 dark:text-white">
                                            <MapPin className="w-5 h-5 text-keikichi-lime-600" />
                                            {quote.origin} → {quote.destination}
                                        </div>

                                        <div className="flex items-center gap-6 text-sm text-keikichi-forest-600 dark:text-keikichi-lime-400">
                                            <span className="flex items-center gap-1">
                                                <Package className="w-4 h-4" />
                                                {quote.pallet_count} {t('quotes.pallets')}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-4 h-4" />
                                                {format(new Date(quote.preferred_date), i18n.language === 'es' ? "d MMM yyyy" : "MMM d, yyyy", { locale: dateLocale })}
                                            </span>
                                            {quote.is_international && quote.stops && quote.stops.length > 0 && (
                                                <span>{quote.stops.length} {t('quotes.stops')}</span>
                                            )}
                                        </div>

                                        <p className="text-xs text-keikichi-forest-400 dark:text-keikichi-lime-500">
                                            {t('quotes.requestedOn')} {format(new Date(quote.created_at), i18n.language === 'es' ? "d MMM yyyy HH:mm" : "MMM d, yyyy HH:mm", { locale: dateLocale })}
                                        </p>
                                    </div>

                                    {/* Price and Actions */}
                                    <div className="lg:text-right space-y-3">
                                        {quote.quoted_price ? (
                                            <div className="bg-keikichi-lime-50 dark:bg-keikichi-lime-900/20 rounded-lg p-4 border border-keikichi-lime-200 dark:border-keikichi-lime-800">
                                                <p className="text-xs text-keikichi-forest-500 dark:text-keikichi-lime-400 mb-1">{t('quotes.quotedPrice')}</p>
                                                <p className="text-2xl font-bold text-keikichi-lime-700 dark:text-keikichi-lime-400">
                                                    ${quote.quoted_price.toLocaleString()} {quote.quoted_currency}
                                                </p>
                                                {quote.free_stops !== null && quote.free_stops > 0 && (
                                                    <p className="text-xs text-keikichi-forest-500 dark:text-keikichi-lime-400 mt-1">
                                                        {quote.free_stops} {t('quotes.stopsIncluded')}
                                                    </p>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="bg-keikichi-yellow-50 dark:bg-keikichi-yellow-900/20 rounded-lg p-4 border border-keikichi-yellow-200 dark:border-keikichi-yellow-800">
                                                <p className="text-sm text-keikichi-yellow-800 dark:text-keikichi-yellow-400">
                                                    {t('quotes.awaitingPrice')}
                                                </p>
                                            </div>
                                        )}

                                        {/* Action Buttons */}
                                        {quote.status === "quoted" && (
                                            <div className="space-y-2">
                                                {respondingId === quote.id ? (
                                                    <div className="space-y-2">
                                                        <textarea
                                                            value={negotiateMessage}
                                                            onChange={(e) => setNegotiateMessage(e.target.value)}
                                                            placeholder={t('quotes.negotiateMessage')}
                                                            className="w-full border border-keikichi-lime-200 dark:border-keikichi-forest-600 rounded-lg p-2 text-sm bg-white dark:bg-keikichi-forest-700 text-keikichi-forest-800 dark:text-white"
                                                            rows={2}
                                                        />
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => handleNegotiate(quote.id)}
                                                                disabled={respondMutation.isPending}
                                                                className="flex-1 px-3 py-1.5 bg-keikichi-forest-600 text-white rounded text-sm hover:bg-keikichi-forest-700 disabled:opacity-50"
                                                            >
                                                                {t('common.submit')}
                                                            </button>
                                                            <button
                                                                onClick={() => setRespondingId(null)}
                                                                className="px-3 py-1.5 border border-keikichi-lime-200 dark:border-keikichi-forest-600 rounded text-sm"
                                                            >
                                                                {t('common.cancel')}
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex gap-2 justify-end">
                                                        <button
                                                            onClick={() => handleAccept(quote.id)}
                                                            disabled={respondMutation.isPending}
                                                            className="flex items-center gap-1 px-3 py-1.5 bg-keikichi-lime-600 text-white rounded-lg text-sm hover:bg-keikichi-lime-700 transition-colors disabled:opacity-50"
                                                        >
                                                            <Check className="w-4 h-4" />
                                                            {t('quotes.accept')}
                                                        </button>
                                                        <button
                                                            onClick={() => setRespondingId(quote.id)}
                                                            className="flex items-center gap-1 px-3 py-1.5 border border-keikichi-forest-300 dark:border-keikichi-forest-600 text-keikichi-forest-700 dark:text-keikichi-lime-300 rounded-lg text-sm hover:bg-keikichi-forest-50 dark:hover:bg-keikichi-forest-700 transition-colors"
                                                        >
                                                            <MessageSquare className="w-4 h-4" />
                                                            {t('quotes.negotiate')}
                                                        </button>
                                                        <button
                                                            onClick={() => handleReject(quote.id)}
                                                            disabled={respondMutation.isPending}
                                                            className="flex items-center gap-1 px-3 py-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg text-sm transition-colors disabled:opacity-50"
                                                        >
                                                            <X className="w-4 h-4" />
                                                            {t('quotes.reject')}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {quote.status === "accepted" && quote.created_trip_id && (
                                            <button
                                                onClick={() => navigate(`/trips`)}
                                                className="text-keikichi-lime-600 hover:text-keikichi-lime-700 text-sm font-medium"
                                            >
                                                {t('quotes.viewTrip')} →
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Plane, Truck, Thermometer, MapPin, Package, Calendar, DollarSign, FileText } from "lucide-react";
import api from "../../api/client";
import { useTranslation } from "react-i18next";

interface QuoteFormData {
    origin: string;
    destination: string;
    is_international: boolean;
    pallet_count: number;
    preferred_date: string;
    flexible_dates: boolean;
    preferred_currency: "USD" | "MXN";
    tiradas: number;
    requires_bond: boolean;
    requires_refrigeration: boolean;
    temperature_min?: number;
    temperature_max?: number;
    pickup_address?: string;
    special_requirements?: string;
}

export default function RequestTripPage() {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [step, setStep] = useState(1);

    const { register, handleSubmit, watch, formState: { errors } } = useForm<QuoteFormData>({
        defaultValues: {
            is_international: false,
            pallet_count: 1,
            flexible_dates: false,
            preferred_currency: "USD",
            tiradas: 0,
            requires_bond: false,
            requires_refrigeration: false
        }
    });

    const isInternational = watch("is_international");
    const requiresRefrigeration = watch("requires_refrigeration");

    const createQuote = useMutation({
        mutationFn: async (data: QuoteFormData) => {
            const response = await api.post("/trip-quotes", data);
            return response.data;
        },
        onSuccess: () => {
            toast.success(t('quotes.requestSubmitted'));
            navigate("/my-quotes");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.detail || t('errors.generic'));
        }
    });

    const onSubmit = (data: QuoteFormData) => {
        createQuote.mutate(data);
    };

    const nextStep = () => setStep(s => Math.min(s + 1, 3));
    const prevStep = () => setStep(s => Math.max(s - 1, 1));

    // Calculate minimum date (at least 4 days from now)
    const minDate = new Date();
    minDate.setDate(minDate.getDate() + 4);
    const minDateStr = minDate.toISOString().split('T')[0];

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <button
                onClick={() => navigate(-1)}
                className="flex items-center text-keikichi-forest-600 dark:text-keikichi-lime-300 hover:text-keikichi-forest-900 dark:hover:text-keikichi-lime-100 transition-colors"
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('common.back')}
            </button>

            <div className="bg-white dark:bg-keikichi-forest-800 rounded-xl shadow-sm border border-keikichi-lime-100 dark:border-keikichi-forest-600 overflow-hidden transition-colors">
                <div className="p-6 border-b border-keikichi-lime-100 dark:border-keikichi-forest-600 bg-gradient-to-r from-keikichi-lime-500 to-keikichi-lime-600 text-white">
                    <h1 className="text-2xl font-bold">{t('quotes.requestTitle')}</h1>
                    <p className="text-keikichi-lime-100 mt-1">{t('quotes.requestSubtitle')}</p>
                </div>

                {/* Progress Steps */}
                <div className="px-6 pt-6">
                    <div className="flex items-center justify-between mb-8">
                        {[1, 2, 3].map((s) => (
                            <div key={s} className="flex-1 flex items-center">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${step >= s
                                        ? 'bg-keikichi-lime-600 text-white'
                                        : 'bg-keikichi-lime-100 dark:bg-keikichi-forest-600 text-keikichi-forest-400 dark:text-keikichi-lime-400'
                                    }`}>
                                    {s}
                                </div>
                                {s < 3 && (
                                    <div className={`flex-1 h-1 mx-2 transition-colors ${step > s
                                            ? 'bg-keikichi-lime-600'
                                            : 'bg-keikichi-lime-100 dark:bg-keikichi-forest-600'
                                        }`} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
                    {/* Step 1: Route & Type */}
                    {step === 1 && (
                        <div className="space-y-6 animate-in fade-in">
                            <h2 className="text-lg font-semibold text-keikichi-forest-800 dark:text-white flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-keikichi-lime-600" />
                                {t('quotes.routeType')}
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-keikichi-forest-700 dark:text-keikichi-lime-300 mb-1">
                                        {t('trips.origin')} *
                                    </label>
                                    <input
                                        {...register("origin", { required: true })}
                                        placeholder="Ej: Los Angeles, CA"
                                        className="w-full border border-keikichi-lime-200 dark:border-keikichi-forest-600 rounded-lg px-4 py-3 bg-white dark:bg-keikichi-forest-700 text-keikichi-forest-800 dark:text-white focus:ring-2 focus:ring-keikichi-lime-500"
                                    />
                                    {errors.origin && <p className="text-red-500 text-xs mt-1">{t('validation.required')}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-keikichi-forest-700 dark:text-keikichi-lime-300 mb-1">
                                        {t('trips.destination')} *
                                    </label>
                                    <input
                                        {...register("destination", { required: true })}
                                        placeholder="Ej: Guadalajara, JAL"
                                        className="w-full border border-keikichi-lime-200 dark:border-keikichi-forest-600 rounded-lg px-4 py-3 bg-white dark:bg-keikichi-forest-700 text-keikichi-forest-800 dark:text-white focus:ring-2 focus:ring-keikichi-lime-500"
                                    />
                                    {errors.destination && <p className="text-red-500 text-xs mt-1">{t('validation.required')}</p>}
                                </div>
                            </div>

                            <div className="bg-keikichi-lime-50 dark:bg-keikichi-forest-700 p-4 rounded-lg border border-keikichi-lime-200 dark:border-keikichi-forest-600">
                                <label className="block text-sm font-medium text-keikichi-forest-700 dark:text-keikichi-lime-300 mb-3">
                                    {t('trips.tripType')}
                                </label>
                                <div className="flex gap-4">
                                    <label className={`flex-1 cursor-pointer border-2 rounded-lg p-4 text-center transition-all ${!isInternational
                                            ? 'border-keikichi-lime-600 bg-keikichi-lime-100 dark:bg-keikichi-lime-900/30'
                                            : 'border-keikichi-lime-200 dark:border-keikichi-forest-600 hover:border-keikichi-lime-400'
                                        }`}>
                                        <input type="radio" value="false" {...register("is_international")} className="sr-only" />
                                        <Truck className="w-8 h-8 mx-auto mb-2 text-keikichi-lime-600" />
                                        <span className="text-sm font-medium text-keikichi-forest-800 dark:text-white">{t('trips.national')}</span>
                                    </label>
                                    <label className={`flex-1 cursor-pointer border-2 rounded-lg p-4 text-center transition-all ${isInternational
                                            ? 'border-keikichi-lime-600 bg-keikichi-lime-100 dark:bg-keikichi-lime-900/30'
                                            : 'border-keikichi-lime-200 dark:border-keikichi-forest-600 hover:border-keikichi-lime-400'
                                        }`}>
                                        <input type="radio" value="true" {...register("is_international")} className="sr-only" />
                                        <Plane className="w-8 h-8 mx-auto mb-2 text-keikichi-lime-600" />
                                        <span className="text-sm font-medium text-keikichi-forest-800 dark:text-white">{t('trips.international')}</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Cargo Details */}
                    {step === 2 && (
                        <div className="space-y-6 animate-in fade-in">
                            <h2 className="text-lg font-semibold text-keikichi-forest-800 dark:text-white flex items-center gap-2">
                                <Package className="w-5 h-5 text-keikichi-lime-600" />
                                {t('quotes.cargoDetails')}
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-keikichi-forest-700 dark:text-keikichi-lime-300 mb-1">
                                        {t('quotes.palletCount')} *
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        {...register("pallet_count", { required: true, valueAsNumber: true, min: 1 })}
                                        className="w-full border border-keikichi-lime-200 dark:border-keikichi-forest-600 rounded-lg px-4 py-3 bg-white dark:bg-keikichi-forest-700 text-keikichi-forest-800 dark:text-white focus:ring-2 focus:ring-keikichi-lime-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-keikichi-forest-700 dark:text-keikichi-lime-300 mb-1">
                                        {t('quotes.preferredCurrency')}
                                    </label>
                                    <select
                                        {...register("preferred_currency")}
                                        className="w-full border border-keikichi-lime-200 dark:border-keikichi-forest-600 rounded-lg px-4 py-3 bg-white dark:bg-keikichi-forest-700 text-keikichi-forest-800 dark:text-white focus:ring-2 focus:ring-keikichi-lime-500"
                                    >
                                        <option value="USD">USD - Dólares</option>
                                        <option value="MXN">MXN - Pesos</option>
                                    </select>
                                </div>
                            </div>

                            {isInternational && (
                                <div className="bg-keikichi-yellow-50 dark:bg-keikichi-yellow-900/20 p-4 rounded-lg border border-keikichi-yellow-200 dark:border-keikichi-yellow-800/30">
                                    <h3 className="text-sm font-semibold text-keikichi-yellow-900 dark:text-keikichi-yellow-300 mb-3">
                                        {t('quotes.internationalOptions')}
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-keikichi-forest-700 dark:text-keikichi-lime-300 mb-1">
                                                {t('quotes.tiradas')}
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                {...register("tiradas", { valueAsNumber: true })}
                                                placeholder="0"
                                                className="w-full border border-keikichi-lime-200 dark:border-keikichi-forest-600 rounded-lg px-4 py-3 bg-white dark:bg-keikichi-forest-700 text-keikichi-forest-800 dark:text-white focus:ring-2 focus:ring-keikichi-lime-500"
                                            />
                                            <p className="text-xs text-keikichi-forest-500 dark:text-keikichi-lime-400 mt-1">{t('quotes.tiradasHelp')}</p>
                                        </div>
                                        <div className="flex items-center">
                                            <label className="flex items-center gap-3 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    {...register("requires_bond")}
                                                    className="w-5 h-5 rounded border-keikichi-lime-300 text-keikichi-lime-600 focus:ring-keikichi-lime-500"
                                                />
                                                <span className="text-sm text-keikichi-forest-700 dark:text-keikichi-lime-300">{t('quotes.requiresBond')}</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="bg-keikichi-lime-50 dark:bg-keikichi-forest-700 p-4 rounded-lg border border-keikichi-lime-200 dark:border-keikichi-forest-600">
                                <label className="flex items-center gap-3 cursor-pointer mb-4">
                                    <input
                                        type="checkbox"
                                        {...register("requires_refrigeration")}
                                        className="w-5 h-5 rounded border-keikichi-lime-300 text-keikichi-lime-600 focus:ring-keikichi-lime-500"
                                    />
                                    <Thermometer className="w-5 h-5 text-keikichi-forest-600 dark:text-keikichi-lime-400" />
                                    <span className="text-sm font-medium text-keikichi-forest-700 dark:text-keikichi-lime-300">{t('quotes.requiresRefrigeration')}</span>
                                </label>

                                {requiresRefrigeration && (
                                    <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-keikichi-lime-200 dark:border-keikichi-forest-600">
                                        <div>
                                            <label className="block text-sm font-medium text-keikichi-forest-700 dark:text-keikichi-lime-300 mb-1">
                                                {t('quotes.tempMin')} (°C)
                                            </label>
                                            <input
                                                type="number"
                                                step="0.1"
                                                {...register("temperature_min", { valueAsNumber: true })}
                                                className="w-full border border-keikichi-lime-200 dark:border-keikichi-forest-600 rounded-lg px-4 py-2 bg-white dark:bg-keikichi-forest-600 text-keikichi-forest-800 dark:text-white focus:ring-2 focus:ring-keikichi-lime-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-keikichi-forest-700 dark:text-keikichi-lime-300 mb-1">
                                                {t('quotes.tempMax')} (°C)
                                            </label>
                                            <input
                                                type="number"
                                                step="0.1"
                                                {...register("temperature_max", { valueAsNumber: true })}
                                                className="w-full border border-keikichi-lime-200 dark:border-keikichi-forest-600 rounded-lg px-4 py-2 bg-white dark:bg-keikichi-forest-600 text-keikichi-forest-800 dark:text-white focus:ring-2 focus:ring-keikichi-lime-500"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Step 3: Schedule & Notes */}
                    {step === 3 && (
                        <div className="space-y-6 animate-in fade-in">
                            <h2 className="text-lg font-semibold text-keikichi-forest-800 dark:text-white flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-keikichi-lime-600" />
                                {t('quotes.scheduleNotes')}
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-keikichi-forest-700 dark:text-keikichi-lime-300 mb-1">
                                        {t('quotes.preferredDate')} *
                                    </label>
                                    <input
                                        type="date"
                                        min={minDateStr}
                                        {...register("preferred_date", { required: true })}
                                        className="w-full border border-keikichi-lime-200 dark:border-keikichi-forest-600 rounded-lg px-4 py-3 bg-white dark:bg-keikichi-forest-700 text-keikichi-forest-800 dark:text-white focus:ring-2 focus:ring-keikichi-lime-500"
                                    />
                                    {errors.preferred_date && <p className="text-red-500 text-xs mt-1">{t('validation.required')}</p>}
                                </div>
                                <div className="flex items-center pt-6">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            {...register("flexible_dates")}
                                            className="w-5 h-5 rounded border-keikichi-lime-300 text-keikichi-lime-600 focus:ring-keikichi-lime-500"
                                        />
                                        <span className="text-sm text-keikichi-forest-700 dark:text-keikichi-lime-300">{t('quotes.flexibleDates')}</span>
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-keikichi-forest-700 dark:text-keikichi-lime-300 mb-1">
                                    {t('quotes.pickupAddress')}
                                </label>
                                <input
                                    {...register("pickup_address")}
                                    placeholder={t('quotes.pickupAddressPlaceholder')}
                                    className="w-full border border-keikichi-lime-200 dark:border-keikichi-forest-600 rounded-lg px-4 py-3 bg-white dark:bg-keikichi-forest-700 text-keikichi-forest-800 dark:text-white focus:ring-2 focus:ring-keikichi-lime-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-keikichi-forest-700 dark:text-keikichi-lime-300 mb-1">
                                    <FileText className="w-4 h-4 inline mr-1" />
                                    {t('quotes.specialRequirements')}
                                </label>
                                <textarea
                                    {...register("special_requirements")}
                                    rows={4}
                                    placeholder={t('quotes.specialRequirementsPlaceholder')}
                                    className="w-full border border-keikichi-lime-200 dark:border-keikichi-forest-600 rounded-lg px-4 py-3 bg-white dark:bg-keikichi-forest-700 text-keikichi-forest-800 dark:text-white focus:ring-2 focus:ring-keikichi-lime-500"
                                />
                            </div>
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex justify-between pt-6 border-t border-keikichi-lime-100 dark:border-keikichi-forest-600">
                        {step > 1 ? (
                            <button
                                type="button"
                                onClick={prevStep}
                                className="px-6 py-2 border border-keikichi-lime-200 dark:border-keikichi-forest-600 rounded-lg text-keikichi-forest-700 dark:text-keikichi-lime-300 hover:bg-keikichi-lime-50 dark:hover:bg-keikichi-forest-700 transition-colors"
                            >
                                {t('common.previous')}
                            </button>
                        ) : (
                            <div />
                        )}

                        {step < 3 ? (
                            <button
                                type="button"
                                onClick={nextStep}
                                className="px-6 py-2 bg-keikichi-lime-600 text-white rounded-lg hover:bg-keikichi-lime-700 transition-colors font-medium"
                            >
                                {t('common.next')}
                            </button>
                        ) : (
                            <button
                                type="submit"
                                disabled={createQuote.isPending}
                                className="px-8 py-2 bg-keikichi-lime-600 text-white rounded-lg hover:bg-keikichi-lime-700 transition-colors font-medium disabled:opacity-50 flex items-center gap-2"
                            >
                                <DollarSign className="w-4 h-4" />
                                {createQuote.isPending ? t('common.processing') : t('quotes.submitRequest')}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Plane, Truck, Thermometer, MapPin, Package, Calendar, DollarSign, FileText, Plus, Trash2, Tag, Clock } from "lucide-react";
import api from "../../api/client";
import { useTranslation } from "react-i18next";
import { useStops } from "../../hooks/useProducts";
import { SavedStop } from "../../api/catalog";

interface QuoteStop {
    name?: string;  // Nombre identificador de la parada
    address: string;
    contact?: string;
    time?: string;
    notes?: string;
}

interface QuoteFormData {
    origin: string;
    destination: string;
    is_international: boolean;
    pallet_count: number;
    preferred_date: string;
    flexible_dates: boolean;
    preferred_currency: "USD" | "MXN";

    // Stops
    stops: QuoteStop[];

    // Merchandise
    merchandise_type: string;
    merchandise_weight: string;
    merchandise_description: string;

    // Services
    requires_bond: boolean;
    requires_refrigeration: boolean;
    requires_labeling: boolean;
    requires_pickup: boolean;

    // Pickup Details
    pickup_address?: string;
    pickup_date?: string; // datetime string for input

    // Temp
    temperature_min?: number;
    temperature_max?: number;

    special_requirements?: string;
}

export default function RequestTripPage() {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [step, setStep] = useState(1);
    const { searchStops } = useStops();
    
    // Estado para autocompletado de paradas
    const [stopSuggestions, setStopSuggestions] = useState<{ [key: number]: SavedStop[] }>({});
    const [showStopSuggestions, setShowStopSuggestions] = useState<{ [key: number]: boolean }>({});

    const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm<QuoteFormData>({
        defaultValues: {
            is_international: false,
            pallet_count: 1,
            flexible_dates: false,
            preferred_currency: "USD",
            stops: [],
            requires_bond: false,
            requires_refrigeration: false,
            requires_labeling: false,
            requires_pickup: false
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "stops"
    });

    const isInternational = watch("is_international");
    const requiresRefrigeration = watch("requires_refrigeration");
    const requiresPickup = watch("requires_pickup");
    
    // Función para manejar búsqueda de paradas guardadas
    const handleStopNameSearch = (index: number, value: string) => {
        setValue(`stops.${index}.name` as const, value);
        if (value.length >= 2) {
            const filtered = searchStops(value);
            setStopSuggestions(prev => ({ ...prev, [index]: filtered }));
            setShowStopSuggestions(prev => ({ ...prev, [index]: true }));
        } else {
            setShowStopSuggestions(prev => ({ ...prev, [index]: false }));
        }
    };
    
    // Función para seleccionar una parada guardada
    const selectSavedStop = (index: number, stop: SavedStop) => {
        setValue(`stops.${index}.name` as const, stop.name);
        setValue(`stops.${index}.address` as const, stop.address || "");
        setValue(`stops.${index}.contact` as const, stop.default_contact || "");
        setValue(`stops.${index}.time` as const, stop.default_schedule || "");
        setShowStopSuggestions(prev => ({ ...prev, [index]: false }));
    };

    const createQuote = useMutation({
        mutationFn: async (data: QuoteFormData) => {
            // Handle pickup_date transformation if needed
            const payload = {
                ...data,
                stops: data.stops.map(s => ({
                    ...s,
                    address: s.address || "N/A" // Ensure address is present
                }))
            };
            const response = await api.post("/trip-quotes", payload);
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
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
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

                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-8">
                    {/* Step 1: Route, Type & Stops */}
                    {step === 1 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div>
                                <h2 className="text-lg font-semibold text-keikichi-forest-800 dark:text-white flex items-center gap-2 mb-4">
                                    <MapPin className="w-5 h-5 text-keikichi-lime-600" />
                                    {t('quotes.routeType')}
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                    <div>
                                        <label className="block text-sm font-medium text-keikichi-forest-700 dark:text-keikichi-lime-300 mb-1">
                                            {t('trips.origin')} *
                                        </label>
                                        <input
                                            {...register("origin", { required: true })}
                                            placeholder="Ej: Los Angeles, CA"
                                            className="w-full form-input"
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
                                            className="w-full form-input"
                                        />
                                        {errors.destination && <p className="text-red-500 text-xs mt-1">{t('validation.required')}</p>}
                                    </div>
                                </div>

                                <div className="bg-keikichi-lime-50 dark:bg-keikichi-forest-700 p-4 rounded-lg border border-keikichi-lime-200 dark:border-keikichi-forest-600">
                                    <label className="block text-sm font-medium text-keikichi-forest-700 dark:text-keikichi-lime-300 mb-3">
                                        {t('trips.tripType')}
                                    </label>
                                    <div className="flex gap-4">
                                        <button
                                            type="button"
                                            onClick={() => setValue("is_international", false)}
                                            className={`flex-1 border-2 rounded-lg p-4 text-center transition-all ${!isInternational
                                                ? 'border-keikichi-lime-600 bg-keikichi-lime-100 dark:bg-keikichi-lime-900/30'
                                                : 'border-keikichi-lime-200 dark:border-keikichi-forest-600 hover:border-keikichi-lime-400'
                                                }`}
                                        >
                                            <Truck className="w-8 h-8 mx-auto mb-2 text-keikichi-lime-600" />
                                            <span className="text-sm font-medium text-keikichi-forest-800 dark:text-white">{t('trips.national')}</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setValue("is_international", true)}
                                            className={`flex-1 border-2 rounded-lg p-4 text-center transition-all ${isInternational
                                                ? 'border-keikichi-lime-600 bg-keikichi-lime-100 dark:bg-keikichi-lime-900/30'
                                                : 'border-keikichi-lime-200 dark:border-keikichi-forest-600 hover:border-keikichi-lime-400'
                                                }`}
                                        >
                                            <Plane className="w-8 h-8 mx-auto mb-2 text-keikichi-lime-600" />
                                            <span className="text-sm font-medium text-keikichi-forest-800 dark:text-white">{t('trips.international')}</span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Stops (Tiradas) */}
                            {isInternational && (
                                <div className="border-t border-keikichi-lime-100 dark:border-keikichi-forest-600 pt-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-semibold text-keikichi-forest-800 dark:text-white flex items-center gap-2">
                                            <MapPin className="w-5 h-5 text-keikichi-lime-600" />
                                            {t('quotes.stops')}
                                        </h3>
                                        <button
                                            type="button"
                                            onClick={() => append({ name: "", address: "" })}
                                            className="text-sm flex items-center gap-1 text-keikichi-lime-600 hover:text-keikichi-lime-700 font-medium"
                                        >
                                            <Plus className="w-4 h-4" />
                                            {t('quotes.addStop')}
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        {fields.map((field, index) => (
                                            <div key={field.id} className="bg-white dark:bg-keikichi-forest-700 p-4 rounded-lg border border-keikichi-lime-200 dark:border-keikichi-forest-600 relative group">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        remove(index);
                                                        setShowStopSuggestions(prev => ({ ...prev, [index]: false }));
                                                    }}
                                                    className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                                <h4 className="text-xs font-bold text-keikichi-lime-600 uppercase mb-2">{t('quotes.stop')} #{index + 1}</h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    {/* Nombre de la parada con autocompletado */}
                                                    <div className="col-span-2 relative">
                                                        <label className="text-xs text-keikichi-forest-500 dark:text-keikichi-lime-400 mb-1 block">
                                                            {t('quotes.stopName')}
                                                        </label>
                                                        <input
                                                            {...register(`stops.${index}.name` as const)}
                                                            placeholder={t('quotes.stopNamePlaceholder')}
                                                            onChange={(e) => handleStopNameSearch(index, e.target.value)}
                                                            onFocus={() => {
                                                                const currentName = watch(`stops.${index}.name`);
                                                                if (currentName && currentName.length >= 2) {
                                                                    const filtered = searchStops(currentName);
                                                                    setStopSuggestions(prev => ({ ...prev, [index]: filtered }));
                                                                    setShowStopSuggestions(prev => ({ ...prev, [index]: true }));
                                                                }
                                                            }}
                                                            onBlur={() => setTimeout(() => setShowStopSuggestions(prev => ({ ...prev, [index]: false })), 200)}
                                                            className="w-full form-input text-sm"
                                                            autoComplete="off"
                                                        />
                                                        {/* Sugerencias de autocompletado */}
                                                        {showStopSuggestions[index] && stopSuggestions[index]?.length > 0 && (
                                                            <ul className="absolute z-20 w-full bg-white dark:bg-keikichi-forest-800 border border-keikichi-lime-200 dark:border-keikichi-forest-600 rounded-md shadow-lg max-h-48 overflow-auto mt-1">
                                                                {stopSuggestions[index].map((stop) => (
                                                                    <li
                                                                        key={stop.id}
                                                                        className="px-3 py-2 hover:bg-keikichi-lime-50 dark:hover:bg-keikichi-forest-700 cursor-pointer text-sm"
                                                                        onClick={() => selectSavedStop(index, stop)}
                                                                    >
                                                                        <div className="font-medium text-keikichi-forest-800 dark:text-white">{stop.name}</div>
                                                                        {stop.address && (
                                                                            <div className="text-xs text-keikichi-forest-500 dark:text-keikichi-lime-400 truncate">
                                                                                {stop.address}
                                                                            </div>
                                                                        )}
                                                                        {stop.default_schedule && (
                                                                            <div className="text-xs text-keikichi-forest-400 dark:text-keikichi-lime-500 flex items-center gap-1">
                                                                                <Clock className="w-3 h-3" />
                                                                                {stop.default_schedule}
                                                                            </div>
                                                                        )}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        )}
                                                    </div>
                                                    {/* Dirección */}
                                                    <div className="col-span-2">
                                                        <label className="text-xs text-keikichi-forest-500 dark:text-keikichi-lime-400 mb-1 block">
                                                            {t('quotes.stopAddress')} *
                                                        </label>
                                                        <input
                                                            {...register(`stops.${index}.address` as const, { required: true })}
                                                            placeholder={t('quotes.stopAddressPlaceholder')}
                                                            className="w-full form-input text-sm"
                                                        />
                                                    </div>
                                                    {/* Contacto */}
                                                    <div>
                                                        <label className="text-xs text-keikichi-forest-500 dark:text-keikichi-lime-400 mb-1 block">
                                                            {t('quotes.stopContact')}
                                                        </label>
                                                        <input
                                                            {...register(`stops.${index}.contact` as const)}
                                                            placeholder={t('quotes.stopContactPlaceholder')}
                                                            className="w-full form-input text-sm"
                                                        />
                                                    </div>
                                                    {/* Horario */}
                                                    <div>
                                                        <label className="text-xs text-keikichi-forest-500 dark:text-keikichi-lime-400 mb-1 block">
                                                            {t('quotes.stopTime')}
                                                        </label>
                                                        <input
                                                            {...register(`stops.${index}.time` as const)}
                                                            placeholder={t('quotes.stopTimePlaceholder')}
                                                            className="w-full form-input text-sm"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {fields.length === 0 && (
                                            <div className="text-center py-6 border-2 border-dashed border-keikichi-lime-200 dark:border-keikichi-forest-600 rounded-lg text-keikichi-forest-400 dark:text-keikichi-forest-300 text-sm">
                                                {t('quotes.tiradasHelp')}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 2: Cargo & Services */}
                    {step === 2 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                            {/* Cargo Details */}
                            <div>
                                <h2 className="text-lg font-semibold text-keikichi-forest-800 dark:text-white flex items-center gap-2 mb-4">
                                    <Package className="w-5 h-5 text-keikichi-lime-600" />
                                    {t('quotes.cargoDetails')}
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                    <div>
                                        <label className="block text-sm font-medium text-keikichi-forest-700 dark:text-keikichi-lime-300 mb-1">
                                            {t('quotes.palletCount')} *
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            {...register("pallet_count", { required: true, valueAsNumber: true, min: 1 })}
                                            className="w-full form-input"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-keikichi-forest-700 dark:text-keikichi-lime-300 mb-1">
                                            {t('quotes.preferredCurrency')}
                                        </label>
                                        <select
                                            {...register("preferred_currency")}
                                            className="w-full form-select"
                                        >
                                            <option value="USD">USD - Dólares</option>
                                            <option value="MXN">MXN - Pesos</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="bg-gray-50 dark:bg-keikichi-forest-700/50 p-4 rounded-lg border border-gray-100 dark:border-keikichi-forest-600 space-y-4">
                                    <h3 className="text-sm font-semibold text-keikichi-forest-700 dark:text-keikichi-lime-300">
                                        {t('quotes.merchandiseDetails')}
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs text-gray-500 dark:text-gray-400">{t('quotes.productType')}</label>
                                            <input {...register("merchandise_type")} placeholder={t('quotes.productTypePlaceholder')} className="w-full form-input text-sm" />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500 dark:text-gray-400">{t('quotes.weight')}</label>
                                            <input {...register("merchandise_weight")} placeholder={t('quotes.weightPlaceholder')} className="w-full form-input text-sm" />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="text-xs text-gray-500 dark:text-gray-400">{t('quotes.description')}</label>
                                            <textarea {...register("merchandise_description")} rows={2} maxLength={500} className="w-full form-input text-sm" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Services */}
                            <div>
                                <h2 className="text-lg font-semibold text-keikichi-forest-800 dark:text-white flex items-center gap-2 mb-4">
                                    <Tag className="w-5 h-5 text-keikichi-lime-600" />
                                    {t('quotes.services')}
                                </h2>

                                <div className="space-y-3">
                                    {/* Labeling */}
                                    <label className="flex items-center p-4 border border-keikichi-lime-200 dark:border-keikichi-forest-600 rounded-lg cursor-pointer hover:bg-keikichi-lime-50 dark:hover:bg-keikichi-forest-700 transition-colors">
                                        <input type="checkbox" {...register("requires_labeling")} className="w-5 h-5 rounded border-keikichi-lime-300 text-keikichi-lime-600 focus:ring-keikichi-lime-500" />
                                        <span className="ml-3 font-medium text-keikichi-forest-700 dark:text-keikichi-lime-300">{t('quotes.requiresLabeling')}</span>
                                    </label>

                                    {/* Bond (International) */}
                                    {isInternational && (
                                        <label className="flex items-center p-4 border border-keikichi-lime-200 dark:border-keikichi-forest-600 rounded-lg cursor-pointer hover:bg-keikichi-lime-50 dark:hover:bg-keikichi-forest-700 transition-colors">
                                            <input type="checkbox" {...register("requires_bond")} className="w-5 h-5 rounded border-keikichi-lime-300 text-keikichi-lime-600 focus:ring-keikichi-lime-500" />
                                            <span className="ml-3 font-medium text-keikichi-forest-700 dark:text-keikichi-lime-300">{t('quotes.requiresBond')}</span>
                                        </label>
                                    )}

                                    {/* Pickup */}
                                    <div className={`border border-keikichi-lime-200 dark:border-keikichi-forest-600 rounded-lg overflow-hidden transition-all ${requiresPickup ? 'bg-keikichi-lime-50 dark:bg-keikichi-forest-700' : ''}`}>
                                        <label className="flex items-center p-4 cursor-pointer">
                                            <input type="checkbox" {...register("requires_pickup")} className="w-5 h-5 rounded border-keikichi-lime-300 text-keikichi-lime-600 focus:ring-keikichi-lime-500" />
                                            <span className="ml-3 font-medium text-keikichi-forest-700 dark:text-keikichi-lime-300">{t('quotes.requiresPickup')}</span>
                                        </label>

                                        {requiresPickup && (
                                            <div className="px-4 pb-4 animate-in slide-in-from-top-2">
                                                <div className="grid grid-cols-1 gap-3 pl-8 border-l-2 border-keikichi-lime-300">
                                                    <div>
                                                        <label className="text-xs font-semibold text-keikichi-forest-600 dark:text-keikichi-lime-300">{t('quotes.pickupAddress')}</label>
                                                        <input {...register("pickup_address")} placeholder="Calle, Ciudad, Estado, CP" className="w-full form-input mt-1" />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-semibold text-keikichi-forest-600 dark:text-keikichi-lime-300">{t('quotes.pickupDate')}</label>
                                                        <input type="datetime-local" {...register("pickup_date")} className="w-full form-input mt-1" />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Schedule & Notes */}
                    {step === 3 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div>
                                <h2 className="text-lg font-semibold text-keikichi-forest-800 dark:text-white flex items-center gap-2 mb-4">
                                    <Calendar className="w-5 h-5 text-keikichi-lime-600" />
                                    {t('quotes.scheduleNotes')}
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                    <div>
                                        <label className="block text-sm font-medium text-keikichi-forest-700 dark:text-keikichi-lime-300 mb-1">
                                            {t('quotes.preferredDate')} *
                                        </label>
                                        <input
                                            type="date"
                                            min={minDateStr}
                                            {...register("preferred_date", { required: true })}
                                            className="w-full form-input"
                                        />
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

                                {/* Refrigeration */}
                                <div className="bg-keikichi-lime-50 dark:bg-keikichi-forest-700 p-4 rounded-lg border border-keikichi-lime-200 dark:border-keikichi-forest-600 mb-6 transition-all">
                                    <label className="flex items-center gap-3 cursor-pointer mb-2">
                                        <input
                                            type="checkbox"
                                            {...register("requires_refrigeration")}
                                            className="w-5 h-5 rounded border-keikichi-lime-300 text-keikichi-lime-600 focus:ring-keikichi-lime-500"
                                        />
                                        <Thermometer className="w-5 h-5 text-keikichi-forest-600 dark:text-keikichi-lime-400" />
                                        <span className="text-sm font-medium text-keikichi-forest-700 dark:text-keikichi-lime-300">{t('quotes.requiresRefrigeration')}</span>
                                    </label>

                                    {requiresRefrigeration && (
                                        <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-keikichi-lime-200 dark:border-keikichi-forest-600 animate-in fade-in">
                                            <div>
                                                <label className="block text-xs font-medium text-keikichi-forest-700 dark:text-keikichi-lime-300 mb-1">
                                                    {t('quotes.tempMin')} (°C)
                                                </label>
                                                <input
                                                    type="number"
                                                    step="0.1"
                                                    {...register("temperature_min", { valueAsNumber: true })}
                                                    className="w-full form-input"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-keikichi-forest-700 dark:text-keikichi-lime-300 mb-1">
                                                    {t('quotes.tempMax')} (°C)
                                                </label>
                                                <input
                                                    type="number"
                                                    step="0.1"
                                                    {...register("temperature_max", { valueAsNumber: true })}
                                                    className="w-full form-input"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-keikichi-forest-700 dark:text-keikichi-lime-300 mb-1">
                                        <FileText className="w-4 h-4 inline mr-1" />
                                        {t('quotes.specialRequirements')}
                                    </label>
                                    <textarea
                                        {...register("special_requirements")}
                                        rows={4}
                                        maxLength={1000}
                                        placeholder={t('quotes.specialRequirementsPlaceholder')}
                                        className="w-full form-input"
                                    />
                                </div>
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
                                className="px-6 py-2 bg-keikichi-lime-600 text-white rounded-lg hover:bg-keikichi-lime-700 transition-colors font-medium shadow-md hover:shadow-lg"
                            >
                                {t('common.next')}
                            </button>
                        ) : (
                            <button
                                type="submit"
                                disabled={createQuote.isPending}
                                className="px-8 py-2 bg-keikichi-lime-600 text-white rounded-lg hover:bg-keikichi-lime-700 transition-colors font-medium disabled:opacity-50 flex items-center gap-2 shadow-md hover:shadow-lg"
                            >
                                <DollarSign className="w-4 h-4" />
                                {createQuote.isPending ? t('common.processing') : t('quotes.submitRequest')}
                            </button>
                        )}
                    </div>
                </form>
            </div>

            <style>{`
                .form-input {
                    @apply border border-keikichi-lime-200 dark:border-keikichi-forest-600 rounded-lg px-4 py-3 bg-white dark:bg-keikichi-forest-700 text-keikichi-forest-800 dark:text-white focus:ring-2 focus:ring-keikichi-lime-500 focus:border-transparent outline-none transition-all;
                }
                .form-select {
                    @apply border border-keikichi-lime-200 dark:border-keikichi-forest-600 rounded-lg px-4 py-3 bg-white dark:bg-keikichi-forest-700 text-keikichi-forest-800 dark:text-white focus:ring-2 focus:ring-keikichi-lime-500 focus:border-transparent outline-none transition-all;
                }
            `}</style>
        </div>
    );
}

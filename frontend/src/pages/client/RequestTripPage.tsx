import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Plane, Truck, Thermometer, MapPin, Calendar, DollarSign, FileText, Plus, Trash2, Tag, Clock, Layers, Box, Upload } from "lucide-react";
import api from "../../api/client";
import { useTranslation } from "react-i18next";
import { useStops, useProducts } from "../../hooks/useProducts";
import { SavedStop } from "../../api/catalog";
import { AddressAutocomplete } from "../../components/shared/AddressAutocomplete";
import { fetchLabelPrices } from "../../api/labelPrices";

// Producto dentro de una tarima
interface PalletProduct {
    product: string;        // Nombre del producto
    boxes: number;          // Cantidad de cajas
    weight_per_box: number; // Peso por caja
    unit: "lbs" | "kg";     // Unidad de peso
}

// Tarima con sus productos
interface StopPallet {
    products: PalletProduct[];
}

interface QuoteStop {
    name?: string;  // Nombre identificador de la parada
    address: string;
    address_reference?: string;  // Referencia de la dirección (entre calles, etc.)
    contact?: string;
    time?: string;  // Hora de apertura (HH:MM)
    unknownTime?: boolean;  // No conoce la hora de apertura
    notes?: string;
    pallets: StopPallet[];  // Tarimas para esta parada
}

interface QuoteFormData {
    origin: string;
    destination: string;
    is_international: boolean;
    preferred_date: string;
    flexible_dates: boolean;
    preferred_currency: "USD" | "MXN";

    // Stops con sus tarimas y productos
    stops: QuoteStop[];

    // Services
    requires_bond: boolean;
    requires_refrigeration: boolean;
    requires_labeling: boolean;
    requires_pickup: boolean;

    // Labeling Details
    labeling_type?: "own" | "keikichi";  // Etiqueta propia o de Keikichi
    labeling_size?: string;               // ID del tamaño de etiqueta (de label_prices)
    labeling_quantity?: number;            // Cantidad de etiquetas
    labeling_file?: FileList;              // Archivo de etiqueta propia

    // Bond Details
    bond_type?: "keikichi" | "own";       // Fianza de Keikichi o propia
    bond_file?: FileList;                  // Archivo de fianza propia

    // Pickup Details
    pickup_address?: string;
    pickup_address_reference?: string;   // Referencia de la dirección de recolección
    pickup_date?: string;
    pickup_contact_name?: string;          // Nombre del contacto de recolección
    pickup_contact_phone?: string;         // Teléfono del contacto
    pickup_notes?: string;                 // Notas adicionales para recolección

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
    const { products: savedProducts, searchProducts } = useProducts();
    
    // Estado para autocompletado de paradas
    const [stopSuggestions, setStopSuggestions] = useState<{ [key: number]: SavedStop[] }>({});
    const [showStopSuggestions, setShowStopSuggestions] = useState<{ [key: number]: boolean }>({});
    
    // Estado para autocompletado de productos
    const [productSuggestions, setProductSuggestions] = useState<{ [key: string]: typeof savedProducts }>({});
    const [showProductSuggestions, setShowProductSuggestions] = useState<{ [key: string]: boolean }>({});

    const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm<QuoteFormData>({
        defaultValues: {
            is_international: false,
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
    const requiresLabeling = watch("requires_labeling");
    const labelingType = watch("labeling_type");
    const bondType = watch("bond_type");
    
    // Query para obtener los precios/tamaños de etiquetas disponibles
    const { data: labelPrices = [] } = useQuery({
        queryKey: ["labelPrices"],
        queryFn: fetchLabelPrices,
    });
    
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
                                            onClick={() => append({ name: "", address: "", pallets: [] })}
                                            className="text-sm flex items-center gap-1 text-keikichi-lime-600 hover:text-keikichi-lime-700 font-medium"
                                        >
                                            <Plus className="w-4 h-4" />
                                            {t('quotes.addStop')}
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        {fields.map((field, index) => {
                                            const stopPallets = watch(`stops.${index}.pallets`) || [];
                                            
                                            return (
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
                                                    {/* Dirección con autocompletado */}
                                                    <div className="col-span-2">
                                                        <label className="text-xs text-keikichi-forest-500 dark:text-keikichi-lime-400 mb-1 block">
                                                            {t('quotes.stopAddress')} *
                                                        </label>
                                                        <AddressAutocomplete
                                                            value={watch(`stops.${index}.address`) || ""}
                                                            onChange={(value) => setValue(`stops.${index}.address`, value, { shouldValidate: true })}
                                                            placeholder={t('quotes.stopAddressPlaceholder')}
                                                            className="text-sm"
                                                        />
                                                        <input
                                                            type="hidden"
                                                            {...register(`stops.${index}.address` as const, { required: true })}
                                                        />
                                                    </div>
                                                    {/* Referencia de la dirección */}
                                                    <div className="col-span-2">
                                                        <label className="text-xs text-keikichi-forest-500 dark:text-keikichi-lime-400 mb-1 block">
                                                            {t('address.reference')}
                                                        </label>
                                                        <input
                                                            {...register(`stops.${index}.address_reference` as const)}
                                                            placeholder={t('address.referencePlaceholder')}
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
                                                    {/* Hora de Apertura */}
                                                    <div>
                                                        <label className="text-xs text-keikichi-forest-500 dark:text-keikichi-lime-400 mb-1 block">
                                                            {t('quotes.stopOpeningTime')}
                                                        </label>
                                                        <div className="space-y-2">
                                                            <div className="flex items-center gap-2">
                                                                <input
                                                                    type="checkbox"
                                                                    {...register(`stops.${index}.unknownTime` as const)}
                                                                    id={`unknownTime-${index}`}
                                                                    className="rounded border-keikichi-lime-300 text-keikichi-lime-600 focus:ring-keikichi-lime-500"
                                                                />
                                                                <label htmlFor={`unknownTime-${index}`} className="text-xs text-keikichi-forest-500 dark:text-keikichi-lime-400">
                                                                    {t('quotes.unknownTime')}
                                                                </label>
                                                            </div>
                                                            {!watch(`stops.${index}.unknownTime`) && (
                                                                <input
                                                                    type="time"
                                                                    {...register(`stops.${index}.time` as const)}
                                                                    className="w-full form-input text-sm"
                                                                />
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* TARIMAS Y PRODUCTOS DE ESTA PARADA */}
                                                <div className="mt-4 pt-4 border-t border-keikichi-lime-100 dark:border-keikichi-forest-600">
                                                    <div className="flex justify-between items-center mb-3">
                                                        <h5 className="text-sm font-semibold text-keikichi-forest-700 dark:text-keikichi-lime-300 flex items-center gap-2">
                                                            <Layers className="w-4 h-4" />
                                                            {t('quotes.palletsForStop')}
                                                        </h5>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const currentPallets = watch(`stops.${index}.pallets`) || [];
                                                                setValue(`stops.${index}.pallets`, [
                                                                    ...currentPallets,
                                                                    { products: [{ product: "", boxes: 0, weight_per_box: 0, unit: "lbs" }] }
                                                                ]);
                                                            }}
                                                            className="text-xs flex items-center gap-1 text-keikichi-lime-600 hover:text-keikichi-lime-700 font-medium"
                                                        >
                                                            <Plus className="w-3 h-3" />
                                                            {t('quotes.addPallet')}
                                                        </button>
                                                    </div>

                                                    {stopPallets.length === 0 ? (
                                                        <div className="text-center py-4 border border-dashed border-keikichi-lime-200 dark:border-keikichi-forest-600 rounded-lg text-keikichi-forest-400 dark:text-keikichi-forest-300 text-xs">
                                                            {t('quotes.noPalletsYet')}
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-3">
                                                            {stopPallets.map((pallet, palletIdx) => (
                                                                <div key={palletIdx} className="bg-keikichi-lime-50/50 dark:bg-keikichi-forest-800/50 p-3 rounded-lg border border-keikichi-lime-100 dark:border-keikichi-forest-600">
                                                                    <div className="flex justify-between items-center mb-2">
                                                                        <span className="text-xs font-bold text-keikichi-lime-700 dark:text-keikichi-lime-400 flex items-center gap-1">
                                                                            <Box className="w-3 h-3" />
                                                                            {t('quotes.pallet')} #{palletIdx + 1}
                                                                        </span>
                                                                        <div className="flex gap-1">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    const currentProducts = pallet.products || [];
                                                                                    const newPallets = [...stopPallets];
                                                                                    newPallets[palletIdx] = {
                                                                                        ...newPallets[palletIdx],
                                                                                        products: [...currentProducts, { product: "", boxes: 0, weight_per_box: 0, unit: "lbs" as const }]
                                                                                    };
                                                                                    setValue(`stops.${index}.pallets`, newPallets);
                                                                                }}
                                                                                className="text-xs text-keikichi-lime-600 hover:text-keikichi-lime-700 p-1"
                                                                                title={t('quotes.addProduct')}
                                                                            >
                                                                                <Plus className="w-3 h-3" />
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    const newPallets = stopPallets.filter((_, i) => i !== palletIdx);
                                                                                    setValue(`stops.${index}.pallets`, newPallets);
                                                                                }}
                                                                                className="text-xs text-red-400 hover:text-red-600 p-1"
                                                                            >
                                                                                <Trash2 className="w-3 h-3" />
                                                                            </button>
                                                                        </div>
                                                                    </div>

                                                                    {/* Productos de esta tarima */}
                                                                    <div className="space-y-2">
                                                                        {(pallet.products || []).map((product, productIdx) => (
                                                                            <div key={productIdx} className="grid grid-cols-12 gap-2 items-end">
                                                                                {/* Producto */}
                                                                                <div className="col-span-4 relative">
                                                                                    {productIdx === 0 && (
                                                                                        <label className="text-xs text-keikichi-forest-500 dark:text-keikichi-lime-400">{t('quotes.product')}</label>
                                                                                    )}
                                                                                    <input
                                                                                        type="text"
                                                                                        value={product.product || ""}
                                                                                        onChange={(e) => {
                                                                                            const val = e.target.value;
                                                                                            const newPallets = [...stopPallets];
                                                                                            newPallets[palletIdx].products[productIdx].product = val;
                                                                                            setValue(`stops.${index}.pallets`, newPallets);
                                                                                            
                                                                                            // Autocompletado de productos
                                                                                            const key = `${index}-${palletIdx}-${productIdx}`;
                                                                                            if (val.length >= 2) {
                                                                                                const filtered = searchProducts(val);
                                                                                                setProductSuggestions(prev => ({ ...prev, [key]: filtered }));
                                                                                                setShowProductSuggestions(prev => ({ ...prev, [key]: true }));
                                                                                            } else {
                                                                                                setShowProductSuggestions(prev => ({ ...prev, [key]: false }));
                                                                                            }
                                                                                        }}
                                                                                        onBlur={() => {
                                                                                            const key = `${index}-${palletIdx}-${productIdx}`;
                                                                                            setTimeout(() => setShowProductSuggestions(prev => ({ ...prev, [key]: false })), 200);
                                                                                        }}
                                                                                        placeholder={t('quotes.productName')}
                                                                                        className="w-full form-input text-xs py-1"
                                                                                        autoComplete="off"
                                                                                    />
                                                                                    {/* Sugerencias de productos */}
                                                                                    {showProductSuggestions[`${index}-${palletIdx}-${productIdx}`] && 
                                                                                     productSuggestions[`${index}-${palletIdx}-${productIdx}`]?.length > 0 && (
                                                                                        <ul className="absolute z-30 w-full bg-white dark:bg-keikichi-forest-800 border border-keikichi-lime-200 dark:border-keikichi-forest-600 rounded shadow-lg max-h-32 overflow-auto mt-0.5">
                                                                                            {productSuggestions[`${index}-${palletIdx}-${productIdx}`].map((p) => (
                                                                                                <li
                                                                                                    key={p.id}
                                                                                                    className="px-2 py-1 hover:bg-keikichi-lime-50 dark:hover:bg-keikichi-forest-700 cursor-pointer text-xs"
                                                                                                    onClick={() => {
                                                                                                        const newPallets = [...stopPallets];
                                                                                                        newPallets[palletIdx].products[productIdx].product = p.name_es;
                                                                                                        setValue(`stops.${index}.pallets`, newPallets);
                                                                                                        setShowProductSuggestions(prev => ({ ...prev, [`${index}-${palletIdx}-${productIdx}`]: false }));
                                                                                                    }}
                                                                                                >
                                                                                                    {p.name_es}
                                                                                                </li>
                                                                                            ))}
                                                                                        </ul>
                                                                                    )}
                                                                                </div>
                                                                                {/* Cajas */}
                                                                                <div className="col-span-2">
                                                                                    {productIdx === 0 && (
                                                                                        <label className="text-xs text-keikichi-forest-500 dark:text-keikichi-lime-400">{t('quotes.boxes')}</label>
                                                                                    )}
                                                                                    <input
                                                                                        type="number"
                                                                                        min="1"
                                                                                        value={product.boxes || ""}
                                                                                        onChange={(e) => {
                                                                                            const newPallets = [...stopPallets];
                                                                                            newPallets[palletIdx].products[productIdx].boxes = parseInt(e.target.value) || 0;
                                                                                            setValue(`stops.${index}.pallets`, newPallets);
                                                                                        }}
                                                                                        placeholder="0"
                                                                                        className="w-full form-input text-xs py-1"
                                                                                    />
                                                                                </div>
                                                                                {/* Peso */}
                                                                                <div className="col-span-2">
                                                                                    {productIdx === 0 && (
                                                                                        <label className="text-xs text-keikichi-forest-500 dark:text-keikichi-lime-400">{t('quotes.weightPerBox')}</label>
                                                                                    )}
                                                                                    <input
                                                                                        type="number"
                                                                                        min="0"
                                                                                        step="0.1"
                                                                                        value={product.weight_per_box || ""}
                                                                                        onChange={(e) => {
                                                                                            const newPallets = [...stopPallets];
                                                                                            newPallets[palletIdx].products[productIdx].weight_per_box = parseFloat(e.target.value) || 0;
                                                                                            setValue(`stops.${index}.pallets`, newPallets);
                                                                                        }}
                                                                                        placeholder="0"
                                                                                        className="w-full form-input text-xs py-1"
                                                                                    />
                                                                                </div>
                                                                                {/* Unidad */}
                                                                                <div className="col-span-2">
                                                                                    {productIdx === 0 && (
                                                                                        <label className="text-xs text-keikichi-forest-500 dark:text-keikichi-lime-400">{t('quotes.unit')}</label>
                                                                                    )}
                                                                                    <select
                                                                                        value={product.unit || "lbs"}
                                                                                        onChange={(e) => {
                                                                                            const newPallets = [...stopPallets];
                                                                                            newPallets[palletIdx].products[productIdx].unit = e.target.value as "lbs" | "kg";
                                                                                            setValue(`stops.${index}.pallets`, newPallets);
                                                                                        }}
                                                                                        className="w-full form-select text-xs py-1"
                                                                                    >
                                                                                        <option value="lbs">lbs</option>
                                                                                        <option value="kg">kg</option>
                                                                                    </select>
                                                                                </div>
                                                                                {/* Eliminar producto */}
                                                                                <div className="col-span-2 flex justify-end">
                                                                                    {(pallet.products?.length || 0) > 1 && (
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={() => {
                                                                                                const newPallets = [...stopPallets];
                                                                                                newPallets[palletIdx].products = newPallets[palletIdx].products.filter((_, i) => i !== productIdx);
                                                                                                setValue(`stops.${index}.pallets`, newPallets);
                                                                                            }}
                                                                                            className="text-red-400 hover:text-red-600 p-1"
                                                                                        >
                                                                                            <Trash2 className="w-3 h-3" />
                                                                                        </button>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )})}
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
                            {/* Currency preference */}
                            <div>
                                <h2 className="text-lg font-semibold text-keikichi-forest-800 dark:text-white flex items-center gap-2 mb-4">
                                    <DollarSign className="w-5 h-5 text-keikichi-lime-600" />
                                    {t('quotes.preferredCurrency')}
                                </h2>
                                <select
                                    {...register("preferred_currency")}
                                    className="w-full md:w-1/2 form-select"
                                >
                                    <option value="USD">USD - Dólares</option>
                                    <option value="MXN">MXN - Pesos</option>
                                </select>
                            </div>

                            {/* Services */}
                            <div>
                                <h2 className="text-lg font-semibold text-keikichi-forest-800 dark:text-white flex items-center gap-2 mb-4">
                                    <Tag className="w-5 h-5 text-keikichi-lime-600" />
                                    {t('quotes.services')}
                                </h2>

                                <div className="space-y-3">
                                    {/* Labeling - Expandible */}
                                    <div className={`border border-keikichi-lime-200 dark:border-keikichi-forest-600 rounded-lg overflow-hidden transition-all ${requiresLabeling ? 'bg-keikichi-lime-50 dark:bg-keikichi-forest-700' : ''}`}>
                                        <label className="flex items-center p-4 cursor-pointer">
                                            <input type="checkbox" {...register("requires_labeling")} className="w-5 h-5 rounded border-keikichi-lime-300 text-keikichi-lime-600 focus:ring-keikichi-lime-500" />
                                            <span className="ml-3 font-medium text-keikichi-forest-700 dark:text-keikichi-lime-300">{t('quotes.requiresLabeling')}</span>
                                        </label>

                                        {requiresLabeling && (
                                            <div className="px-4 pb-4 animate-in slide-in-from-top-2">
                                                <div className="space-y-4 pl-8 border-l-2 border-keikichi-lime-300">
                                                    {/* Tipo de etiqueta */}
                                                    <div>
                                                        <label className="text-xs font-semibold text-keikichi-forest-600 dark:text-keikichi-lime-300 mb-2 block">
                                                            {t('quotes.labelingType')}
                                                        </label>
                                                        <div className="flex gap-3">
                                                            <label className={`flex-1 flex items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition-all ${labelingType === 'keikichi' ? 'border-keikichi-lime-600 bg-keikichi-lime-100 dark:bg-keikichi-lime-900/30' : 'border-keikichi-lime-200 dark:border-keikichi-forest-600 hover:border-keikichi-lime-400'}`}>
                                                                <input
                                                                    type="radio"
                                                                    {...register("labeling_type")}
                                                                    value="keikichi"
                                                                    className="sr-only"
                                                                />
                                                                <span className="text-sm font-medium text-keikichi-forest-700 dark:text-keikichi-lime-300">
                                                                    {t('quotes.useKeikichiLabel')}
                                                                </span>
                                                            </label>
                                                            <label className={`flex-1 flex items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition-all ${labelingType === 'own' ? 'border-keikichi-lime-600 bg-keikichi-lime-100 dark:bg-keikichi-lime-900/30' : 'border-keikichi-lime-200 dark:border-keikichi-forest-600 hover:border-keikichi-lime-400'}`}>
                                                                <input
                                                                    type="radio"
                                                                    {...register("labeling_type")}
                                                                    value="own"
                                                                    className="sr-only"
                                                                />
                                                                <span className="text-sm font-medium text-keikichi-forest-700 dark:text-keikichi-lime-300">
                                                                    {t('quotes.useOwnLabel')}
                                                                </span>
                                                            </label>
                                                        </div>
                                                    </div>

                                                    {/* Tamaño de etiqueta (select) */}
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        <div>
                                                            <label className="text-xs font-semibold text-keikichi-forest-600 dark:text-keikichi-lime-300">
                                                                {t('quotes.labelSize')}
                                                            </label>
                                                            <select
                                                                {...register("labeling_size")}
                                                                className="w-full form-select mt-1"
                                                            >
                                                                <option value="">{t('quotes.selectLabelSize')}</option>
                                                                {labelPrices.map((lp) => (
                                                                    <option key={lp.id} value={lp.id}>
                                                                        {lp.dimensions} - ${lp.price.toFixed(2)} USD
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="text-xs font-semibold text-keikichi-forest-600 dark:text-keikichi-lime-300">
                                                                {t('quotes.labelQuantity')}
                                                            </label>
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                {...register("labeling_quantity", { valueAsNumber: true })}
                                                                placeholder="Ej. 500"
                                                                className="w-full form-input mt-1"
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Subir archivo de etiqueta propia */}
                                                    {labelingType === 'own' && (
                                                        <div>
                                                            <label className="text-xs font-semibold text-keikichi-forest-600 dark:text-keikichi-lime-300">
                                                                {t('quotes.uploadLabelFile')}
                                                            </label>
                                                            <div className="mt-1 flex items-center gap-2">
                                                                <label className="flex-1 flex items-center justify-center gap-2 p-3 border-2 border-dashed border-keikichi-lime-300 dark:border-keikichi-forest-500 rounded-lg cursor-pointer hover:border-keikichi-lime-500 transition-colors">
                                                                    <Upload className="w-5 h-5 text-keikichi-lime-600" />
                                                                    <span className="text-sm text-keikichi-forest-600 dark:text-keikichi-lime-300">
                                                                        {t('quotes.selectFile')}
                                                                    </span>
                                                                    <input
                                                                        type="file"
                                                                        {...register("labeling_file")}
                                                                        accept=".pdf,.png,.jpg,.jpeg"
                                                                        className="sr-only"
                                                                    />
                                                                </label>
                                                            </div>
                                                            <p className="text-xs text-keikichi-forest-400 mt-1">
                                                                {t('quotes.labelFileFormats')}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Bond (International) - Expandible */}
                                    {isInternational && (
                                        <div className={`border border-keikichi-lime-200 dark:border-keikichi-forest-600 rounded-lg overflow-hidden transition-all ${watch("requires_bond") ? 'bg-keikichi-lime-50 dark:bg-keikichi-forest-700' : ''}`}>
                                            <label className="flex items-center p-4 cursor-pointer">
                                                <input type="checkbox" {...register("requires_bond")} className="w-5 h-5 rounded border-keikichi-lime-300 text-keikichi-lime-600 focus:ring-keikichi-lime-500" />
                                                <span className="ml-3 font-medium text-keikichi-forest-700 dark:text-keikichi-lime-300">{t('quotes.requiresBondService')}</span>
                                            </label>

                                            {watch("requires_bond") && (
                                                <div className="px-4 pb-4 animate-in slide-in-from-top-2">
                                                    <div className="space-y-4 pl-8 border-l-2 border-keikichi-lime-300">
                                                        {/* Tipo de fianza */}
                                                        <div>
                                                            <label className="text-xs font-semibold text-keikichi-forest-600 dark:text-keikichi-lime-300 mb-2 block">
                                                                {t('quotes.bondType')}
                                                            </label>
                                                            <div className="flex gap-3">
                                                                <label className={`flex-1 flex items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition-all ${bondType === 'keikichi' ? 'border-keikichi-lime-600 bg-keikichi-lime-100 dark:bg-keikichi-lime-900/30' : 'border-keikichi-lime-200 dark:border-keikichi-forest-600 hover:border-keikichi-lime-400'}`}>
                                                                    <input
                                                                        type="radio"
                                                                        {...register("bond_type")}
                                                                        value="keikichi"
                                                                        className="sr-only"
                                                                    />
                                                                    <span className="text-sm font-medium text-keikichi-forest-700 dark:text-keikichi-lime-300">
                                                                        {t('quotes.useKeikichiBond')}
                                                                    </span>
                                                                </label>
                                                                <label className={`flex-1 flex items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition-all ${bondType === 'own' ? 'border-keikichi-lime-600 bg-keikichi-lime-100 dark:bg-keikichi-lime-900/30' : 'border-keikichi-lime-200 dark:border-keikichi-forest-600 hover:border-keikichi-lime-400'}`}>
                                                                    <input
                                                                        type="radio"
                                                                        {...register("bond_type")}
                                                                        value="own"
                                                                        className="sr-only"
                                                                    />
                                                                    <span className="text-sm font-medium text-keikichi-forest-700 dark:text-keikichi-lime-300">
                                                                        {t('quotes.useOwnBond')}
                                                                    </span>
                                                                </label>
                                                            </div>
                                                        </div>

                                                        {/* Subir archivo de fianza propia */}
                                                        {bondType === 'own' && (
                                                            <div>
                                                                <label className="text-xs font-semibold text-keikichi-forest-600 dark:text-keikichi-lime-300">
                                                                    {t('quotes.uploadBondFile')}
                                                                </label>
                                                                <div className="mt-1 flex items-center gap-2">
                                                                    <label className="flex-1 flex items-center justify-center gap-2 p-3 border-2 border-dashed border-keikichi-lime-300 dark:border-keikichi-forest-500 rounded-lg cursor-pointer hover:border-keikichi-lime-500 transition-colors">
                                                                        <Upload className="w-5 h-5 text-keikichi-lime-600" />
                                                                        <span className="text-sm text-keikichi-forest-600 dark:text-keikichi-lime-300">
                                                                            {t('quotes.selectFile')}
                                                                        </span>
                                                                        <input
                                                                            type="file"
                                                                            {...register("bond_file")}
                                                                            accept=".pdf,.png,.jpg,.jpeg"
                                                                            className="sr-only"
                                                                        />
                                                                    </label>
                                                                </div>
                                                                <p className="text-xs text-keikichi-forest-400 mt-1">
                                                                    {t('quotes.bondFileFormats')}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Pickup - Expandible */}
                                    <div className={`border border-keikichi-lime-200 dark:border-keikichi-forest-600 rounded-lg overflow-hidden transition-all ${requiresPickup ? 'bg-keikichi-lime-50 dark:bg-keikichi-forest-700' : ''}`}>
                                        <label className="flex items-center p-4 cursor-pointer">
                                            <input type="checkbox" {...register("requires_pickup")} className="w-5 h-5 rounded border-keikichi-lime-300 text-keikichi-lime-600 focus:ring-keikichi-lime-500" />
                                            <span className="ml-3 font-medium text-keikichi-forest-700 dark:text-keikichi-lime-300">{t('quotes.requiresPickup')}</span>
                                        </label>

                                        {requiresPickup && (
                                            <div className="px-4 pb-4 animate-in slide-in-from-top-2">
                                                <div className="space-y-4 pl-8 border-l-2 border-keikichi-lime-300">
                                                    <div>
                                                        <label className="text-xs font-semibold text-keikichi-forest-600 dark:text-keikichi-lime-300">{t('quotes.pickupAddress')}</label>
                                                        <AddressAutocomplete
                                                            value={watch("pickup_address") || ""}
                                                            onChange={(value) => setValue("pickup_address", value)}
                                                            placeholder="Calle, Ciudad, Estado, CP"
                                                            className="mt-1"
                                                        />
                                                        <input type="hidden" {...register("pickup_address")} />
                                                    </div>
                                                    
                                                    <div>
                                                        <label className="text-xs font-semibold text-keikichi-forest-600 dark:text-keikichi-lime-300">{t('address.reference')}</label>
                                                        <input 
                                                            type="text" 
                                                            {...register("pickup_address_reference")} 
                                                            placeholder={t('address.referencePlaceholder')}
                                                            className="w-full form-input mt-1" 
                                                        />
                                                    </div>
                                                    
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        <div>
                                                            <label className="text-xs font-semibold text-keikichi-forest-600 dark:text-keikichi-lime-300">{t('quotes.pickupContactName')}</label>
                                                            <input 
                                                                type="text" 
                                                                {...register("pickup_contact_name")} 
                                                                placeholder={t('quotes.pickupContactNamePlaceholder')}
                                                                className="w-full form-input mt-1" 
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-xs font-semibold text-keikichi-forest-600 dark:text-keikichi-lime-300">{t('quotes.pickupContactPhone')}</label>
                                                            <input 
                                                                type="tel" 
                                                                {...register("pickup_contact_phone")} 
                                                                placeholder="Ej. +1 (555) 123-4567"
                                                                className="w-full form-input mt-1" 
                                                            />
                                                        </div>
                                                    </div>
                                                    
                                                    <div>
                                                        <label className="text-xs font-semibold text-keikichi-forest-600 dark:text-keikichi-lime-300">{t('quotes.pickupDate')}</label>
                                                        <input type="datetime-local" {...register("pickup_date")} className="w-full form-input mt-1" />
                                                    </div>
                                                    
                                                    <div>
                                                        <label className="text-xs font-semibold text-keikichi-forest-600 dark:text-keikichi-lime-300">{t('quotes.pickupNotes')}</label>
                                                        <textarea 
                                                            {...register("pickup_notes")} 
                                                            rows={2}
                                                            placeholder={t('quotes.pickupNotesPlaceholder')}
                                                            className="w-full form-textarea mt-1" 
                                                        />
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

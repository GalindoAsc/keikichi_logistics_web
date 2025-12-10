import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { useCreateTrip, useUpdateTrip, useTrip } from "../../hooks/useTrips";
import { ArrowLeft } from "lucide-react";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import api from "../../api/client";
import { useTranslation } from "react-i18next";

interface Driver {
    id: string;
    full_name: string;
    phone: string;
}

interface Vehicle {
    id: string;
    type: "truck" | "trailer";
    plate: string;
    brand: string;
    model: string;
}

const fetchDrivers = async () => (await api.get<Driver[]>("/fleet/drivers")).data;
const fetchVehicles = async () => (await api.get<Vehicle[]>("/fleet/vehicles")).data;

const CreateTripPage = () => {
    const { id } = useParams();
    const isEditMode = !!id;
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<"general" | "pricing" | "fleet" | "notes">("general");
    const { t } = useTranslation();

    const tripSchema = z.object({
        is_international: z.preprocess(
            (val) => val === "true" || val === true,
            z.boolean()
        ).default(false),
        origin: z.string().min(1, t('validation.originRequired')),
        destination: z.string().min(1, t('validation.destinationRequired')),
        departure_date: z.string().min(1, t('validation.dateRequired')).refine((date) => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const selectedDate = new Date(date + "T00:00:00");
            return selectedDate >= today;
        }, t('trips.dateCannotBePast')),
        departure_time: z.preprocess(
            (val) => (val === "" ? undefined : val),
            z.string().optional()
        ),
        total_spaces: z.number().min(1, t('validation.minOneSpace')),
        price_per_space: z.number().min(0, t('validation.priceNotNegative')),
        pickup_cost: z.preprocess(
            (val) => (Number.isNaN(Number(val)) ? undefined : Number(val)),
            z.number().min(0).optional()
        ),
        pickup_cost_type: z.enum(["flat_rate", "per_pallet"]),
        bond_cost: z.number().min(0).default(500),
        currency: z.enum(["MXN", "USD"]),
        exchange_rate: z.number().min(0.1, t('validation.exchangeRateRequired')),
        individual_pricing: z.boolean().default(false),
        tax_included: z.boolean().default(true),
        tax_rate: z.number().default(0.16),
        payment_deadline_hours: z.number().min(1).default(24),
        notes_public: z.string().optional(),
        notes_internal: z.string().optional(),
        truck_identifier: z.string().optional(),
        trailer_identifier: z.string().optional(),
        truck_plate: z.string().optional(),
        trailer_plate: z.string().optional(),
        driver_name: z.string().optional(),
        driver_phone: z.string().optional(),
    });

    type TripFormData = z.infer<typeof tripSchema>;

    const createTrip = useCreateTrip();
    const updateTrip = useUpdateTrip();
    const { data: trip, isLoading: isLoadingTrip } = useTrip(id || "");
    const { data: drivers } = useQuery({ queryKey: ["drivers"], queryFn: fetchDrivers });
    const { data: vehicles } = useQuery({ queryKey: ["vehicles"], queryFn: fetchVehicles });

    const trucks = vehicles?.filter(v => v.type === "truck") || [];
    const trailers = vehicles?.filter(v => v.type === "trailer") || [];

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<TripFormData>({
        resolver: zodResolver(tripSchema),
        defaultValues: {
            is_international: "false" as any,
            total_spaces: 0,
            price_per_space: 0,
            pickup_cost: 0,
            pickup_cost_type: "flat_rate",
            bond_cost: 500,
            currency: "USD",
            exchange_rate: 18.50,
            individual_pricing: false,
            tax_included: true,
            tax_rate: 0.16,
            payment_deadline_hours: 24,
        },
    });

    useEffect(() => {
        if (trip) {
            reset({
                ...trip,
                is_international: String(trip.is_international) as any,
                departure_time: trip.departure_time || "",
                pickup_cost: trip.pickup_cost || 0,
                notes_public: trip.notes_public || "",
                notes_internal: trip.notes_internal || "",
                truck_identifier: trip.truck_identifier || "",
                trailer_identifier: trip.trailer_identifier || "",
                truck_plate: trip.truck_plate || "",
                trailer_plate: trip.trailer_plate || "",
                driver_name: trip.driver_name || "",
                driver_phone: trip.driver_phone || "",
                currency: (trip.currency as "USD" | "MXN") || "USD",
            });
        }
    }, [trip, reset]);

    const isInternationalVal = watch("is_international");
    const isInternational = isInternationalVal === true || String(isInternationalVal) === "true";

    const onSubmit = async (data: TripFormData) => {
        try {
            if (isEditMode && id) {
                await updateTrip.mutateAsync({ id, data });
                toast.success(t('trips.tripUpdated'));
            } else {
                await createTrip.mutateAsync(data);
                toast.success(t('trips.tripCreated'));
            }
            navigate("/admin/trips");
        } catch (error: any) {
            const message = error?.response?.data?.detail || (isEditMode ? t('trips.tripUpdateError') : t('trips.tripCreateError'));
            toast.error(message);
            console.error(error);
        }
    };

    const onInvalid = (errors: any) => {
        console.log("Validation errors:", errors);
        const errorFields = Object.keys(errors).map(key => {
            const labels: Record<string, string> = {
                origin: t('trips.origin'),
                destination: t('trips.destination'),
                departure_date: t('trips.departureDate'),
                departure_time: t('trips.departureTime'),
                total_spaces: t('trips.totalSpaces'),
                price_per_space: t('trips.pricePerSpace'),
                pickup_cost: t('trips.pickupCost'),
                exchange_rate: t('trips.exchangeRate'),
                payment_deadline_hours: t('trips.paymentDeadline'),
                bond_cost: t('trips.bondCost'),
            };
            return labels[key] || key;
        }).join(", ");
        toast.error(`${t('trips.fixErrors')}: ${errorFields}`);
    };

    const handleDriverChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const driver = drivers?.find(d => d.id === e.target.value);
        if (driver) {
            setValue("driver_name", driver.full_name);
            setValue("driver_phone", driver.phone || "");
        } else {
            setValue("driver_name", "");
            setValue("driver_phone", "");
        }
    };

    const handleTruckChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const truck = trucks.find(t => t.id === e.target.value);
        if (truck) {
            setValue("truck_plate", truck.plate);
            setValue("truck_identifier", `${truck.brand} ${truck.model}`);
        } else {
            setValue("truck_plate", "");
            setValue("truck_identifier", "");
        }
    };

    const handleTrailerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const trailer = trailers.find(t => t.id === e.target.value);
        if (trailer) {
            setValue("trailer_plate", trailer.plate);
            setValue("trailer_identifier", `${trailer.brand} ${trailer.model}`);
        } else {
            setValue("trailer_plate", "");
            setValue("trailer_identifier", "");
        }
    };

    if (isEditMode && isLoadingTrip) {
        return (
            <div className="flex justify-center py-12">
                <LoadingSpinner />
            </div>
        );
    }

    const tabs = [
        { id: "general", label: t('trips.generalInfo') },
        { id: "pricing", label: t('trips.pricingSpaces') },
        { id: "fleet", label: t('trips.fleetDriver') },
        { id: "notes", label: t('trips.notes') },
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <button
                onClick={() => navigate("/")}
                className="flex items-center text-keikichi-forest-600 dark:text-keikichi-lime-300 hover:text-keikichi-forest-900 dark:hover:text-keikichi-lime-100 transition-colors"
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('common.backToDashboard')}
            </button>

            <div className="bg-white dark:bg-keikichi-forest-800 rounded-xl shadow-sm border border-keikichi-lime-100 dark:border-keikichi-forest-600 overflow-hidden transition-colors">
                <div className="p-6 border-b border-keikichi-lime-100 dark:border-keikichi-forest-600">
                    <h1 className="text-2xl font-bold text-keikichi-forest-800 dark:text-white">
                        {isEditMode ? t('trips.editTrip') : t('trips.newTrip')}
                    </h1>
                </div>

                {/* Tabs Header */}
                <div className="flex border-b border-keikichi-lime-100 dark:border-keikichi-forest-600 overflow-x-auto">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-6 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${activeTab === tab.id
                                ? "border-keikichi-lime-600 text-keikichi-lime-600 dark:border-keikichi-lime-400 dark:text-keikichi-lime-400"
                                : "border-transparent text-keikichi-forest-500 hover:text-keikichi-forest-700 hover:border-keikichi-lime-300 dark:text-keikichi-lime-400 dark:hover:text-keikichi-lime-200 dark:hover:border-keikichi-lime-500"
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Error Summary */}
                {Object.keys(errors).length > 0 && (
                    <div className="m-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <h3 className="text-red-800 dark:text-red-300 font-medium mb-2">{t('errors.fixErrors')}:</h3>
                        <ul className="list-disc list-inside text-sm text-red-600 dark:text-red-400">
                            {Object.entries(errors).map(([key, error]) => (
                                <li key={key}>
                                    <span className="font-medium capitalize">{key.replace(/_/g, " ")}:</span> {(error as any)?.message}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="p-6">
                    {/* General Tab */}
                    {activeTab === "general" && (
                        <div className="space-y-6">
                            <div className="bg-keikichi-lime-50 dark:bg-keikichi-forest-700 p-4 rounded-lg border border-keikichi-lime-200 dark:border-keikichi-forest-600">
                                <label className="text-sm font-medium text-keikichi-forest-700 dark:text-keikichi-lime-300 block mb-2">{t('trips.tripType')}</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer text-keikichi-forest-700 dark:text-keikichi-lime-200">
                                        <input
                                            type="radio"
                                            value="false"
                                            {...register("is_international")}
                                            className="text-keikichi-lime-600 focus:ring-keikichi-lime-500 dark:bg-keikichi-forest-600 dark:border-keikichi-forest-500"
                                        />
                                        <span>{t('trips.national')}</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer text-keikichi-forest-700 dark:text-keikichi-lime-200">
                                        <input
                                            type="radio"
                                            value="true"
                                            {...register("is_international")}
                                            className="text-keikichi-lime-600 focus:ring-keikichi-lime-500 dark:bg-keikichi-forest-600 dark:border-keikichi-forest-500"
                                        />
                                        <span>{t('trips.international')}</span>
                                    </label>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-keikichi-forest-700 dark:text-keikichi-lime-300">{t('trips.origin')}</label>
                                    <input
                                        {...register("origin")}
                                        className="w-full border border-keikichi-lime-200 dark:border-keikichi-forest-600 rounded-md px-3 py-2 bg-white dark:bg-keikichi-forest-700 text-keikichi-forest-800 dark:text-white focus:ring-2 focus:ring-keikichi-lime-500"
                                        placeholder="Ej. Los Angeles, CA"
                                    />
                                    {errors.origin && <p className="text-xs text-red-500 dark:text-red-400">{errors.origin.message}</p>}
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-keikichi-forest-700 dark:text-keikichi-lime-300">{t('trips.destination')}</label>
                                    <input
                                        {...register("destination")}
                                        className="w-full border border-keikichi-lime-200 dark:border-keikichi-forest-600 rounded-md px-3 py-2 bg-white dark:bg-keikichi-forest-700 text-keikichi-forest-800 dark:text-white focus:ring-2 focus:ring-keikichi-lime-500"
                                        placeholder="Ej. Guadalajara, JAL"
                                    />
                                    {errors.destination && <p className="text-xs text-red-500 dark:text-red-400">{errors.destination.message}</p>}
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-keikichi-forest-700 dark:text-keikichi-lime-300">{t('trips.departureDate')}</label>
                                    <input
                                        type="date"
                                        {...register("departure_date")}
                                        className="w-full border border-keikichi-lime-200 dark:border-keikichi-forest-600 rounded-md px-3 py-2 bg-white dark:bg-keikichi-forest-700 text-keikichi-forest-800 dark:text-white focus:ring-2 focus:ring-keikichi-lime-500"
                                    />
                                    {errors.departure_date && <p className="text-xs text-red-500 dark:text-red-400">{errors.departure_date.message}</p>}
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-keikichi-forest-700 dark:text-keikichi-lime-300">{t('trips.departureTime')} ({t('common.none')})</label>
                                    <input
                                        type="time"
                                        {...register("departure_time")}
                                        className="w-full border border-keikichi-lime-200 dark:border-keikichi-forest-600 rounded-md px-3 py-2 bg-white dark:bg-keikichi-forest-700 text-keikichi-forest-800 dark:text-white focus:ring-2 focus:ring-keikichi-lime-500"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Pricing Tab */}
                    {activeTab === "pricing" && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-keikichi-forest-700 dark:text-keikichi-lime-300">{t('trips.totalSpaces')}</label>
                                    <input
                                        type="number"
                                        {...register("total_spaces", { valueAsNumber: true })}
                                        className="w-full border border-keikichi-lime-200 dark:border-keikichi-forest-600 rounded-md px-3 py-2 bg-white dark:bg-keikichi-forest-700 text-keikichi-forest-800 dark:text-white focus:ring-2 focus:ring-keikichi-lime-500"
                                    />
                                    {errors.total_spaces && <p className="text-xs text-red-500 dark:text-red-400">{errors.total_spaces.message}</p>}
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-keikichi-forest-700 dark:text-keikichi-lime-300">{t('trips.pricePerSpace')}</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        {...register("price_per_space", { valueAsNumber: true })}
                                        className="w-full border border-keikichi-lime-200 dark:border-keikichi-forest-600 rounded-md px-3 py-2 bg-white dark:bg-keikichi-forest-700 text-keikichi-forest-800 dark:text-white focus:ring-2 focus:ring-keikichi-lime-500"
                                    />
                                    {errors.price_per_space && <p className="text-xs text-red-500 dark:text-red-400">{errors.price_per_space.message}</p>}
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-keikichi-forest-700 dark:text-keikichi-lime-300">{t('trips.currency')}</label>
                                    <select {...register("currency")} className="w-full border border-keikichi-lime-200 dark:border-keikichi-forest-600 rounded-md px-3 py-2 bg-white dark:bg-keikichi-forest-700 text-keikichi-forest-800 dark:text-white focus:ring-2 focus:ring-keikichi-lime-500">
                                        <option value="USD">USD</option>
                                        <option value="MXN">MXN</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-keikichi-forest-700 dark:text-keikichi-lime-300">{t('trips.exchangeRate')}</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        {...register("exchange_rate", { valueAsNumber: true })}
                                        className="w-full border border-keikichi-lime-200 dark:border-keikichi-forest-600 rounded-md px-3 py-2 bg-white dark:bg-keikichi-forest-700 text-keikichi-forest-800 dark:text-white focus:ring-2 focus:ring-keikichi-lime-500"
                                    />
                                    {errors.exchange_rate && <p className="text-xs text-red-500 dark:text-red-400">{errors.exchange_rate.message}</p>}
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-keikichi-forest-700 dark:text-keikichi-lime-300">{t('trips.paymentDeadline')}</label>
                                    <input
                                        type="number"
                                        {...register("payment_deadline_hours", { valueAsNumber: true })}
                                        className="w-full border border-keikichi-lime-200 dark:border-keikichi-forest-600 rounded-md px-3 py-2 bg-white dark:bg-keikichi-forest-700 text-keikichi-forest-800 dark:text-white focus:ring-2 focus:ring-keikichi-lime-500"
                                    />
                                    {errors.payment_deadline_hours && <p className="text-xs text-red-500 dark:text-red-400">{errors.payment_deadline_hours.message}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-keikichi-lime-50 dark:bg-keikichi-forest-700 p-4 rounded-lg">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-keikichi-forest-700 dark:text-keikichi-lime-300">{t('trips.pickupCost')}</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        {...register("pickup_cost", { valueAsNumber: true })}
                                        className="w-full border border-keikichi-lime-200 dark:border-keikichi-forest-600 rounded-md px-3 py-2 bg-white dark:bg-keikichi-forest-600 text-keikichi-forest-800 dark:text-white focus:ring-2 focus:ring-keikichi-lime-500"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-keikichi-forest-700 dark:text-keikichi-lime-300">{t('trips.pickupCostType')}</label>
                                    <select {...register("pickup_cost_type")} className="w-full border border-keikichi-lime-200 dark:border-keikichi-forest-600 rounded-md px-3 py-2 bg-white dark:bg-keikichi-forest-600 text-keikichi-forest-800 dark:text-white focus:ring-2 focus:ring-keikichi-lime-500">
                                        <option value="flat_rate">{t('trips.flatRate')}</option>
                                        <option value="per_pallet">{t('trips.perPallet')}</option>
                                    </select>
                                </div>
                            </div>

                            {isInternational && (
                                <div className="bg-keikichi-yellow-50 dark:bg-keikichi-yellow-900/20 p-4 rounded-lg border border-keikichi-yellow-200 dark:border-keikichi-yellow-800/30">
                                    <h4 className="text-sm font-medium text-keikichi-yellow-900 dark:text-keikichi-yellow-300 mb-2">{t('trips.internationalConfig')}</h4>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-keikichi-forest-700 dark:text-keikichi-lime-300">{t('trips.bondCost')}</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            {...register("bond_cost", { valueAsNumber: true })}
                                            className="w-full border border-keikichi-lime-200 dark:border-keikichi-forest-600 rounded-md px-3 py-2 bg-white dark:bg-keikichi-forest-700 text-keikichi-forest-800 dark:text-white focus:ring-2 focus:ring-keikichi-lime-500"
                                        />
                                        <p className="text-xs text-keikichi-forest-500 dark:text-keikichi-lime-400">{t('trips.bondCostHelp')}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Fleet Tab */}
                    {activeTab === "fleet" && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-keikichi-forest-700 dark:text-keikichi-lime-300">{t('trips.selectDriver')}</label>
                                    <select
                                        className="w-full border border-keikichi-lime-200 dark:border-keikichi-forest-600 rounded-md px-3 py-2 bg-white dark:bg-keikichi-forest-700 text-keikichi-forest-800 dark:text-white focus:ring-2 focus:ring-keikichi-lime-500"
                                        onChange={handleDriverChange}
                                        defaultValue=""
                                    >
                                        <option value="">-- {t('common.select')} --</option>
                                        {drivers?.map(d => (
                                            <option key={d.id} value={d.id}>{d.full_name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-keikichi-forest-700 dark:text-keikichi-lime-300">{t('trips.driverName')}</label>
                                    <input
                                        {...register("driver_name")}
                                        className="w-full border border-keikichi-lime-200 dark:border-keikichi-forest-600 rounded-md px-3 py-2 bg-keikichi-lime-50 dark:bg-keikichi-forest-600 text-keikichi-forest-800 dark:text-white"
                                        readOnly
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-keikichi-forest-700 dark:text-keikichi-lime-300">{t('trips.driverPhone')}</label>
                                    <input
                                        {...register("driver_phone")}
                                        className="w-full border border-keikichi-lime-200 dark:border-keikichi-forest-600 rounded-md px-3 py-2 bg-keikichi-lime-50 dark:bg-keikichi-forest-600 text-keikichi-forest-800 dark:text-white"
                                        readOnly
                                    />
                                </div>
                            </div>

                            <div className="border-t border-keikichi-lime-100 dark:border-keikichi-forest-600 pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-keikichi-forest-700 dark:text-keikichi-lime-300">{t('trips.selectTruck')}</label>
                                    <select
                                        className="w-full border border-keikichi-lime-200 dark:border-keikichi-forest-600 rounded-md px-3 py-2 bg-white dark:bg-keikichi-forest-700 text-keikichi-forest-800 dark:text-white focus:ring-2 focus:ring-keikichi-lime-500"
                                        onChange={handleTruckChange}
                                        defaultValue=""
                                    >
                                        <option value="">-- {t('common.select')} --</option>
                                        {trucks.map(t => (
                                            <option key={t.id} value={t.id}>{t.plate} - {t.brand} {t.model}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-keikichi-forest-700 dark:text-keikichi-lime-300">{t('trips.truckPlate')}</label>
                                    <input
                                        {...register("truck_plate")}
                                        className="w-full border border-keikichi-lime-200 dark:border-keikichi-forest-600 rounded-md px-3 py-2 bg-keikichi-lime-50 dark:bg-keikichi-forest-600 text-keikichi-forest-800 dark:text-white"
                                        readOnly
                                    />
                                </div>
                            </div>

                            <div className="border-t border-keikichi-lime-100 dark:border-keikichi-forest-600 pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-keikichi-forest-700 dark:text-keikichi-lime-300">{t('trips.selectTrailer')}</label>
                                    <select
                                        className="w-full border border-keikichi-lime-200 dark:border-keikichi-forest-600 rounded-md px-3 py-2 bg-white dark:bg-keikichi-forest-700 text-keikichi-forest-800 dark:text-white focus:ring-2 focus:ring-keikichi-lime-500"
                                        onChange={handleTrailerChange}
                                        defaultValue=""
                                    >
                                        <option value="">-- {t('common.select')} --</option>
                                        {trailers.map(t => (
                                            <option key={t.id} value={t.id}>{t.plate} - {t.brand} {t.model}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-keikichi-forest-700 dark:text-keikichi-lime-300">{t('trips.trailerPlate')}</label>
                                    <input
                                        {...register("trailer_plate")}
                                        className="w-full border border-keikichi-lime-200 dark:border-keikichi-forest-600 rounded-md px-3 py-2 bg-keikichi-lime-50 dark:bg-keikichi-forest-600 text-keikichi-forest-800 dark:text-white"
                                        readOnly
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Notes Tab */}
                    {activeTab === "notes" && (
                        <div className="space-y-6">
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-keikichi-forest-700 dark:text-keikichi-lime-300">{t('trips.publicNotes')}</label>
                                <textarea
                                    {...register("notes_public")}
                                    className="w-full border border-keikichi-lime-200 dark:border-keikichi-forest-600 rounded-md px-3 py-2 h-32 bg-white dark:bg-keikichi-forest-700 text-keikichi-forest-800 dark:text-white focus:ring-2 focus:ring-keikichi-lime-500"
                                    placeholder={t('trips.publicNotesPlaceholder')}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-keikichi-forest-700 dark:text-keikichi-lime-300">{t('trips.internalNotes')}</label>
                                <textarea
                                    {...register("notes_internal")}
                                    className="w-full border border-keikichi-lime-200 dark:border-keikichi-forest-600 rounded-md px-3 py-2 h-32 bg-white dark:bg-keikichi-forest-700 text-keikichi-forest-800 dark:text-white focus:ring-2 focus:ring-keikichi-lime-500"
                                    placeholder={t('trips.internalNotesPlaceholder')}
                                />
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end pt-6 border-t border-keikichi-lime-100 dark:border-keikichi-forest-600 mt-6">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-keikichi-lime-600 text-white px-6 py-2 rounded-md hover:bg-keikichi-lime-700 disabled:opacity-50 font-medium shadow-sm transition-colors"
                        >
                            {isSubmitting ? t('common.processing') : (isEditMode ? t('trips.updateTrip') : t('trips.createTrip'))}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateTripPage;

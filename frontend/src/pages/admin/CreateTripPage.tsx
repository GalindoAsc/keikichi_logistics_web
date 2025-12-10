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

// Fleet Interfaces
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

const tripSchema = z.object({
    is_international: z.preprocess(
        (val) => val === "true" || val === true,
        z.boolean()
    ).default(false),
    origin: z.string().min(1, "Origen requerido"),
    destination: z.string().min(1, "Destino requerido"),
    departure_date: z.string().min(1, "Fecha requerida").refine((date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const selectedDate = new Date(date + "T00:00:00"); // Append time to avoid timezone issues
        return selectedDate >= today;
    }, "La fecha no puede ser anterior a hoy"),
    departure_time: z.preprocess(
        (val) => (val === "" ? undefined : val),
        z.string().optional()
    ),
    total_spaces: z.number().min(1, "Mínimo 1 espacio"),
    price_per_space: z.number().min(0, "Precio no puede ser negativo"),
    pickup_cost: z.preprocess(
        (val) => (Number.isNaN(Number(val)) ? undefined : Number(val)),
        z.number().min(0).optional()
    ),
    pickup_cost_type: z.enum(["flat_rate", "per_pallet"]),
    bond_cost: z.number().min(0).default(500),
    currency: z.enum(["MXN", "USD"]),
    exchange_rate: z.number().min(0.1, "Tipo de cambio requerido"),
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

const CreateTripPage = () => {
    const { id } = useParams();
    const isEditMode = !!id;
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<"general" | "pricing" | "fleet" | "notes">("general");

    const createTrip = useCreateTrip();
    const updateTrip = useUpdateTrip();
    const { data: trip, isLoading: isLoadingTrip } = useTrip(id || "");

    // Fleet Data
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
                toast.success("Viaje actualizado exitosamente");
            } else {
                await createTrip.mutateAsync(data);
                toast.success("Viaje creado exitosamente");
            }
            navigate("/admin/trips");
        } catch (error: any) {
            const message = error?.response?.data?.detail || (isEditMode ? "Error al actualizar el viaje" : "Error al crear el viaje");
            toast.error(message);
            console.error(error);
        }
    };

    const onInvalid = (errors: any) => {
        console.log("Validation errors:", errors);
        const errorFields = Object.keys(errors).map(key => {
            const labels: Record<string, string> = {
                origin: "Origen",
                destination: "Destino",
                departure_date: "Fecha de Salida",
                departure_time: "Hora de Salida",
                total_spaces: "Total Espacios",
                price_per_space: "Precio por Espacio",
                pickup_cost: "Costo Recolección",
                exchange_rate: "Tipo de Cambio",
                payment_deadline_hours: "Plazo de Pago",
                bond_cost: "Costo de Fianza",
            };
            return labels[key] || key;
        }).join(", ");
        toast.error(`Por favor corrige los errores en: ${errorFields}`);
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
        { id: "general", label: "Información General" },
        { id: "pricing", label: "Precios y Espacios" },
        { id: "fleet", label: "Flota y Chofer" },
        { id: "notes", label: "Notas" },
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <button
                onClick={() => navigate("/")}
                className="flex items-center text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver al Dashboard
            </button>

            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
                <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                        {isEditMode ? "Editar Viaje" : "Crear Nuevo Viaje"}
                    </h1>
                </div>

                {/* Tabs Header */}
                <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-6 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${activeTab === tab.id
                                ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:border-slate-600"
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Error Summary */}
                {Object.keys(errors).length > 0 && (
                    <div className="m-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <h3 className="text-red-800 dark:text-red-300 font-medium mb-2">Por favor corrige los siguientes errores:</h3>
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
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-2">Tipo de Viaje</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer dark:text-slate-200">
                                        <input
                                            type="radio"
                                            value="false"
                                            {...register("is_international")}
                                            className="text-blue-600 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600"
                                        />
                                        <span>Nacional</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer dark:text-slate-200">
                                        <input
                                            type="radio"
                                            value="true"
                                            {...register("is_international")}
                                            className="text-blue-600 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600"
                                        />
                                        <span>Internacional</span>
                                    </label>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Origen</label>
                                    <input
                                        {...register("origin")}
                                        className="w-full border dark:border-slate-700 rounded-md px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                        placeholder="Ej. Los Angeles, CA"
                                    />
                                    {errors.origin && <p className="text-xs text-red-500 dark:text-red-400">{errors.origin.message}</p>}
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Destino</label>
                                    <input
                                        {...register("destination")}
                                        className="w-full border dark:border-slate-700 rounded-md px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                        placeholder="Ej. Guadalajara, JAL"
                                    />
                                    {errors.destination && <p className="text-xs text-red-500 dark:text-red-400">{errors.destination.message}</p>}
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Fecha de Salida</label>
                                    <input
                                        type="date"
                                        {...register("departure_date")}
                                        className="w-full border dark:border-slate-700 rounded-md px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                    />
                                    {errors.departure_date && <p className="text-xs text-red-500 dark:text-red-400">{errors.departure_date.message}</p>}
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Hora de Salida (Opcional)</label>
                                    <input
                                        type="time"
                                        {...register("departure_time")}
                                        className="w-full border dark:border-slate-700 rounded-md px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
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
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Total Espacios</label>
                                    <input
                                        type="number"
                                        {...register("total_spaces", { valueAsNumber: true })}
                                        className="w-full border dark:border-slate-700 rounded-md px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                    />
                                    {errors.total_spaces && <p className="text-xs text-red-500 dark:text-red-400">{errors.total_spaces.message}</p>}
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Precio por Espacio</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        {...register("price_per_space", { valueAsNumber: true })}
                                        className="w-full border dark:border-slate-700 rounded-md px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                    />
                                    {errors.price_per_space && <p className="text-xs text-red-500 dark:text-red-400">{errors.price_per_space.message}</p>}
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Moneda</label>
                                    <select {...register("currency")} className="w-full border dark:border-slate-700 rounded-md px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                                        <option value="USD">USD</option>
                                        <option value="MXN">MXN</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Tipo de Cambio</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        {...register("exchange_rate", { valueAsNumber: true })}
                                        className="w-full border dark:border-slate-700 rounded-md px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                    />
                                    {errors.exchange_rate && <p className="text-xs text-red-500 dark:text-red-400">{errors.exchange_rate.message}</p>}
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Plazo de Pago (Horas)</label>
                                    <input
                                        type="number"
                                        {...register("payment_deadline_hours", { valueAsNumber: true })}
                                        className="w-full border dark:border-slate-700 rounded-md px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                    />
                                    {errors.payment_deadline_hours && <p className="text-xs text-red-500 dark:text-red-400">{errors.payment_deadline_hours.message}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Costo Recolección</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        {...register("pickup_cost", { valueAsNumber: true })}
                                        className="w-full border dark:border-slate-700 rounded-md px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Tipo de Cobro Recolección</label>
                                    <select {...register("pickup_cost_type")} className="w-full border dark:border-slate-700 rounded-md px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                                        <option value="flat_rate">Costo Fijo (Por viaje)</option>
                                        <option value="per_pallet">Por Tarima (Por espacio)</option>
                                    </select>
                                </div>
                            </div>

                            {isInternational && (
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800/30">
                                    <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">Configuración Internacional</h4>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Costo de Fianza (Keikichi)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            {...register("bond_cost", { valueAsNumber: true })}
                                            className="w-full border dark:border-slate-700 rounded-md px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                        />
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Este costo se sumará si el cliente elige usar la fianza de Keikichi.</p>
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
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Seleccionar Chofer</label>
                                    <select
                                        className="w-full border dark:border-slate-700 rounded-md px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                        onChange={handleDriverChange}
                                        defaultValue=""
                                    >
                                        <option value="">-- Seleccionar --</option>
                                        {drivers?.map(d => (
                                            <option key={d.id} value={d.id}>{d.full_name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Nombre del Chofer</label>
                                    <input
                                        {...register("driver_name")}
                                        className="w-full border dark:border-slate-700 rounded-md px-3 py-2 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white"
                                        placeholder="Nombre del Chofer"
                                        readOnly
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Teléfono Chofer</label>
                                    <input
                                        {...register("driver_phone")}
                                        className="w-full border dark:border-slate-700 rounded-md px-3 py-2 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white"
                                        placeholder="Teléfono"
                                        readOnly
                                    />
                                </div>
                            </div>

                            <div className="border-t dark:border-slate-800 pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Seleccionar Camión</label>
                                    <select
                                        className="w-full border dark:border-slate-700 rounded-md px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                        onChange={handleTruckChange}
                                        defaultValue=""
                                    >
                                        <option value="">-- Seleccionar --</option>
                                        {trucks.map(t => (
                                            <option key={t.id} value={t.id}>{t.plate} - {t.brand} {t.model}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Placas Camión</label>
                                    <input
                                        {...register("truck_plate")}
                                        className="w-full border dark:border-slate-700 rounded-md px-3 py-2 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white"
                                        placeholder="Placas del Camión"
                                        readOnly
                                    />
                                </div>
                            </div>

                            <div className="border-t dark:border-slate-800 pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Seleccionar Remolque</label>
                                    <select
                                        className="w-full border dark:border-slate-700 rounded-md px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                        onChange={handleTrailerChange}
                                        defaultValue=""
                                    >
                                        <option value="">-- Seleccionar --</option>
                                        {trailers.map(t => (
                                            <option key={t.id} value={t.id}>{t.plate} - {t.brand} {t.model}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Placas Remolque</label>
                                    <input
                                        {...register("trailer_plate")}
                                        className="w-full border dark:border-slate-700 rounded-md px-3 py-2 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white"
                                        placeholder="Placas del Remolque"
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
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Notas Públicas (Visible para clientes)</label>
                                <textarea
                                    {...register("notes_public")}
                                    className="w-full border dark:border-slate-700 rounded-md px-3 py-2 h-32 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                    placeholder="Información importante para el cliente..."
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Notas Internas</label>
                                <textarea
                                    {...register("notes_internal")}
                                    className="w-full border dark:border-slate-700 rounded-md px-3 py-2 h-32 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                    placeholder="Notas solo para administradores..."
                                />
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end pt-6 border-t border-slate-200 dark:border-slate-800 mt-6">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 font-medium shadow-sm transition-colors"
                        >
                            {isSubmitting ? "Procesando..." : (isEditMode ? "Actualizar Viaje" : "Crear Viaje")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateTripPage;

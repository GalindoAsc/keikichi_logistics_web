import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Globe, Truck, FileText, CreditCard, ArrowRight, ArrowLeft, Copy } from "lucide-react";
import { FileUpload } from "../shared/FileUpload";
import ProductCard from "./ProductCard";
import { Trip } from "../../types/trip";
import { Space } from "../../types/space";
import { fetchLabelPrices } from "../../api/labelPrices";
import { useQuery } from "@tanstack/react-query";

// ... (rest of file)

const loadItemSchema = z.object({
    space_id: z.string().optional(), // Linked space
    product_name: z.string().min(1, "Selecciona un producto"),
    box_count: z.number().min(1, "Mínimo 1 caja"),
    weight_per_unit: z.number().optional(),
    weight_unit: z.string().default("kg"),
    packaging_type: z.string().optional(),
    services: z.record(z.any()).optional(),

    // Per-item labeling (UI only, mapped to global list on submit if needed, or stored in services)
    needs_labeling: z.boolean().default(false),
    labeling_quantity: z.number().optional(),
    labeling_dimensions: z.string().optional(),
    labeling_file_id: z.string().optional(),
});

const reservationSchema = z.object({
    items: z.array(loadItemSchema).min(1, "Agrega al menos un producto"),

    // International
    is_international: z.boolean().default(false),
    use_own_bond: z.boolean().default(false),
    bond_file_id: z.string().optional(),

    // Pickup (Global for now)
    request_pickup: z.boolean().default(false),
    pickup_details: z.object({
        address: z.string().optional(),
        contact_name: z.string().optional(),
        contact_phone: z.string().optional(),
        time: z.string().optional(),
        notes: z.string().optional(),
    }).optional(),

    // Invoice
    requires_invoice: z.boolean().default(false),
    billing_company_name: z.string().optional(),
    billing_rfc: z.string().optional(),
    cfdi_use: z.string().optional(),
    billing_contact_methods: z.string().optional(),
    invoice_data_id: z.string().optional(),

    payment_method: z.enum(["bank_transfer", "cash", "mercadopago"] as const, {
        errorMap: () => ({ message: "Selecciona un método de pago válido" }),
    }),
});

export type ReservationFormData = z.infer<typeof reservationSchema>;
export type LoadItem = z.infer<typeof loadItemSchema>;

interface Props {
    onSubmit: (data: ReservationFormData) => void;
    isSubmitting?: boolean;
    trip: Trip;
    selectedSpaces: Space[];
}

const ReservationForm = ({ onSubmit, isSubmitting, trip, selectedSpaces }: Props) => {
    const [currentStep, setCurrentStep] = useState(0);

    const { data: labelPrices } = useQuery({
        queryKey: ["label-prices"],
        queryFn: fetchLabelPrices,
    });

    const {
        register,
        control,
        handleSubmit,
        watch,
        setValue,
        getValues,
        trigger,
        reset,
        formState: { errors },
    } = useForm<ReservationFormData>({
        resolver: zodResolver(reservationSchema),
        defaultValues: {
            items: selectedSpaces.map(s => ({
                space_id: s.id,
                product_name: "",
                box_count: 0,
                weight_per_unit: 0,
                weight_unit: "kg",
                needs_labeling: false
            })),
            is_international: trip.is_international,
            use_own_bond: false,
            request_pickup: false,
            requires_invoice: false,
            payment_method: "bank_transfer",
        },
    });

    // Load draft from localStorage
    useEffect(() => {
        const savedData = localStorage.getItem(`reservation_draft_${trip.id}`);
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                // Restore items ensuring they match current selected spaces
                const restoredItems = selectedSpaces.map(space => {
                    const savedItem = parsed.items?.find((i: any) => i.space_id === space.id);
                    return savedItem || {
                        space_id: space.id,
                        product_name: "",
                        box_count: 0,
                        weight_per_unit: 0,
                        weight_unit: "kg",
                        needs_labeling: false
                    };
                });

                reset({
                    ...parsed,
                    items: restoredItems,
                    // Ensure critical trip flags are not overwritten by stale draft data if trip changed (unlikely but safe)
                    is_international: trip.is_international,
                });
            } catch (e) {
                console.error("Failed to restore draft", e);
            }
        }
    }, [trip.id, selectedSpaces, reset, trip.is_international]);

    // Save draft to localStorage
    useEffect(() => {
        const subscription = watch((value) => {
            localStorage.setItem(`reservation_draft_${trip.id}`, JSON.stringify(value));
        });
        return () => subscription.unsubscribe();
    }, [watch, trip.id]);

    const { fields } = useFieldArray({
        control,
        name: "items",
    });

    const watchedItems = watch("items");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleItemChange = (index: number, field: string, value: any) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setValue(`items.${index}.${field}` as any, value, {
            shouldValidate: true,
            shouldDirty: true,
            shouldTouch: true
        });
    };

    const copyFirstConfigToAll = () => {
        const firstItem = getValues("items.0");
        if (!firstItem) return;

        fields.forEach((_, index) => {
            if (index === 0) return;
            setValue(`items.${index}.product_name`, firstItem.product_name);
            setValue(`items.${index}.box_count`, firstItem.box_count);
            setValue(`items.${index}.weight_per_unit`, firstItem.weight_per_unit);
            setValue(`items.${index}.weight_unit`, firstItem.weight_unit);
            setValue(`items.${index}.packaging_type`, firstItem.packaging_type);
            setValue(`items.${index}.needs_labeling`, firstItem.needs_labeling);
            setValue(`items.${index}.labeling_quantity`, firstItem.labeling_quantity);
            setValue(`items.${index}.labeling_dimensions`, firstItem.labeling_dimensions);
            setValue(`items.${index}.labeling_file_id`, firstItem.labeling_file_id);
        });
    };

    const nextStep = async () => {
        const isValid = await trigger("items");
        if (isValid) setCurrentStep(1);
    };

    const prevStep = () => setCurrentStep(0);

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Wizard Progress */}
            <div className="flex items-center justify-center mb-8">
                <div className={`flex items-center ${currentStep >= 0 ? "text-blue-600 dark:text-blue-400" : "text-slate-400 dark:text-slate-500"}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep >= 0 ? "border-blue-600 bg-blue-50 dark:border-blue-500 dark:bg-blue-900/30" : "border-slate-300 dark:border-slate-600"}`}>1</div>
                    <span className="ml-2 font-medium">Espacios</span>
                </div>
                <div className="w-16 h-0.5 bg-slate-300 dark:bg-slate-600 mx-4" />
                <div className={`flex items-center ${currentStep >= 1 ? "text-blue-600 dark:text-blue-400" : "text-slate-400 dark:text-slate-500"}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep >= 1 ? "border-blue-600 bg-blue-50 dark:border-blue-500 dark:bg-blue-900/30" : "border-slate-300 dark:border-slate-600"}`}>2</div>
                    <span className="ml-2 font-medium">Pago</span>
                </div>
            </div>

            {/* STEP 1: Space Configuration */}
            {currentStep === 0 && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium text-slate-900 dark:text-white">Configuración de Espacios</h3>
                        {fields.length > 1 && (
                            <button
                                type="button"
                                onClick={copyFirstConfigToAll}
                                className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                            >
                                <Copy className="w-4 h-4" />
                                Copiar configuración del primero a todos
                            </button>
                        )}
                    </div>

                    <div className="space-y-6">
                        {fields.map((field: Record<string, any>, index: number) => {
                            const space = selectedSpaces.find(s => s.id === field.space_id);
                            return (
                                <div key={field.id} className="bg-white dark:bg-keikichi-forest-800 border dark:border-keikichi-forest-600 rounded-lg p-6 shadow-sm space-y-6 transition-colors">
                                    <div className="flex items-center gap-2 border-b dark:border-keikichi-forest-700 pb-2 justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs font-bold px-2 py-1 rounded">
                                                Espacio {space?.space_number || index + 1}
                                            </div>
                                            <span className="text-sm text-slate-500 dark:text-keikichi-lime-300">Configura la carga para este espacio</span>
                                        </div>
                                        {index > 0 && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const firstItem = getValues("items.0");
                                                    setValue(`items.${index}.product_name`, firstItem.product_name);
                                                    setValue(`items.${index}.box_count`, firstItem.box_count);
                                                    setValue(`items.${index}.weight_per_unit`, firstItem.weight_per_unit);
                                                    setValue(`items.${index}.weight_unit`, firstItem.weight_unit);
                                                    setValue(`items.${index}.packaging_type`, firstItem.packaging_type);
                                                    setValue(`items.${index}.needs_labeling`, firstItem.needs_labeling);
                                                    setValue(`items.${index}.labeling_quantity`, firstItem.labeling_quantity);
                                                    setValue(`items.${index}.labeling_dimensions`, firstItem.labeling_dimensions);
                                                    setValue(`items.${index}.labeling_file_id`, firstItem.labeling_file_id);
                                                }}
                                                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                                title="Copiar configuración del primer espacio"
                                            >
                                                <Copy className="w-3 h-3" />
                                                Copiar del 1ro
                                            </button>
                                        )}
                                    </div>

                                    <ProductCard
                                        index={index}
                                        field={watchedItems[index]}
                                        handleItemChange={handleItemChange}
                                        onRemove={() => { }} // Cannot remove spaces here
                                        errors={errors.items?.[index]}
                                        labelPrices={labelPrices}
                                    />
                                </div>
                            );
                        })}

                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            type="button"
                            onClick={nextStep}
                            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
                        >
                            Siguiente
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* STEP 2: Additional Services and Payment */}
            {currentStep === 1 && (
                <div className="space-y-6">
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white">Servicios Adicionales y Pago</h3>

                    {/* International Trip Section */}
                    {trip.is_international && (
                        <div className="bg-white dark:bg-keikichi-forest-800 border dark:border-keikichi-forest-600 rounded-lg p-4 shadow-sm space-y-4 transition-colors">
                            <div className="flex items-center gap-2 mb-2">
                                <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                <h3 className="font-medium text-slate-800 dark:text-white">Viaje Internacional</h3>
                            </div>

                            <div className="pl-7 space-y-4 border-l-2 border-blue-100 ml-2">
                                <div className="space-y-2">
                                    <p className="text-sm text-slate-700">Fianza de Importación</p>
                                    <div className="flex gap-4">
                                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                                            <input
                                                type="radio"
                                                name="bond_type"
                                                checked={!watch("use_own_bond")}
                                                onChange={() => setValue("use_own_bond", false)}
                                                className="text-blue-600 focus:ring-blue-500"
                                            />
                                            <span>Usar fianza de Keikichi (${trip.bond_cost || 500} {trip.currency})</span>
                                        </label>
                                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                                            <input
                                                type="radio"
                                                name="bond_type"
                                                checked={watch("use_own_bond")}
                                                onChange={() => setValue("use_own_bond", true)}
                                                className="text-blue-600 focus:ring-blue-500"
                                            />
                                            <span>Tengo mi propia fianza</span>
                                        </label>
                                    </div>
                                </div>

                                {watch("use_own_bond") && (
                                    <FileUpload
                                        label="Subir Póliza de Fianza"
                                        docType="fianza"
                                        onUploadComplete={(fileId) => setValue("bond_file_id", fileId)}
                                    />
                                )}
                            </div>
                        </div>
                    )}

                    {/* Pickup Service Section */}
                    <div className="bg-white border rounded-lg p-4 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Truck className="w-5 h-5 text-blue-600" />
                                <h3 className="font-medium text-slate-800">Servicio de Recolección</h3>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={watch("request_pickup")}
                                    onChange={(e) => setValue("request_pickup", e.target.checked)}
                                />
                                <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                <span className="ml-3 text-sm font-medium text-slate-700 dark:text-keikichi-lime-200">
                                    {watch("request_pickup")
                                        ? `Sí, requiero recolección (+${trip.pickup_cost_type === 'per_pallet'
                                            ? `${trip.pickup_cost || 0} ${trip.currency} x espacio`
                                            : `${trip.pickup_cost || 0} ${trip.currency}`
                                        })`
                                        : "No, entregaré en bodega"
                                    }
                                </span>
                            </label>
                        </div>

                        {watch("request_pickup") && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-7 border-l-2 border-blue-100 ml-2">
                                <div className="space-y-1">
                                    <label className="text-sm text-slate-600">Dirección de Recolección</label>
                                    <input
                                        type="text"
                                        className="w-full border rounded px-3 py-2 text-sm"
                                        placeholder="Calle, número, colonia, ciudad"
                                        onChange={(e) => setValue("pickup_details.address", e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm text-slate-600">Nombre de Contacto</label>
                                    <input
                                        type="text"
                                        className="w-full border rounded px-3 py-2 text-sm"
                                        placeholder="Nombre completo"
                                        onChange={(e) => setValue("pickup_details.contact_name", e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm text-slate-600">Teléfono de Contacto</label>
                                    <input
                                        type="text"
                                        className="w-full border rounded px-3 py-2 text-sm"
                                        placeholder="Teléfono"
                                        onChange={(e) => setValue("pickup_details.contact_phone", e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm text-slate-600">Fecha y Hora Preferida</label>
                                    <input
                                        type="datetime-local"
                                        className="w-full border rounded px-3 py-2 text-sm"
                                        onChange={(e) => setValue("pickup_details.time", e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1 md:col-span-2">
                                    <label className="text-sm text-slate-600">Instrucciones Especiales</label>
                                    <input
                                        type="text"
                                        className="w-full border rounded px-3 py-2 text-sm"
                                        placeholder="Referencia, portón, etc."
                                        onChange={(e) => setValue("pickup_details.notes", e.target.value)}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Invoice Section */}
                    <div className="bg-white border rounded-lg p-4 shadow-sm space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <FileText className="w-5 h-5 text-blue-600" />
                            <h3 className="font-medium text-slate-800">Facturación</h3>
                        </div>

                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                {...register("requires_invoice")}
                                className="rounded text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-slate-700">Requiero factura para este servicio</span>
                        </label>

                        {watch("requires_invoice") && (
                            <div className="space-y-4 pl-7 border-l-2 border-blue-100 ml-2 pt-2">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-sm text-slate-600">Razón Social</label>
                                        <input
                                            type="text"
                                            className="w-full border rounded px-3 py-2 text-sm"
                                            placeholder="Nombre o Razón Social"
                                            {...register("billing_company_name")}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm text-slate-600">RFC</label>
                                        <input
                                            type="text"
                                            className="w-full border rounded px-3 py-2 text-sm"
                                            placeholder="RFC"
                                            {...register("billing_rfc")}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm text-slate-600">Uso de CFDI</label>
                                        <select
                                            className="w-full border rounded px-3 py-2 text-sm"
                                            {...register("cfdi_use")}
                                        >
                                            <option value="">Seleccionar...</option>
                                            <option value="G03">Gastos en general</option>
                                            <option value="P01">Por definir</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm text-slate-600">Medios de Contacto</label>
                                        <input
                                            type="text"
                                            className="w-full border rounded px-3 py-2 text-sm"
                                            placeholder="Email, Teléfono"
                                            {...register("billing_contact_methods")}
                                        />
                                    </div>
                                </div>
                                <FileUpload
                                    label="Constancia de Situación Fiscal (PDF)"
                                    docType="constancia_fiscal"
                                    onUploadComplete={(fileId) => setValue("invoice_data_id", fileId)}
                                />
                            </div>
                        )}
                    </div>

                    {/* Payment Method */}
                    <div className="bg-white dark:bg-keikichi-forest-800 border dark:border-keikichi-forest-600 rounded-lg p-4 shadow-sm space-y-4 transition-colors">
                        <h3 className="font-medium text-slate-800 dark:text-white flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            Método de Pago
                        </h3>
                        <select
                            {...register("payment_method")}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border"
                        >
                            <option value="bank_transfer">Transferencia Bancaria</option>
                            <option value="cash">Efectivo</option>
                            <option value="mercadopago">MercadoPago</option>
                        </select>
                    </div>

                    {/* Summary Card with Dual Currency */}
                    <div className="bg-slate-50 dark:bg-keikichi-forest-900 border border-slate-200 dark:border-keikichi-forest-600 rounded-lg p-6 space-y-4 transition-colors">
                        <h3 className="font-semibold text-slate-900 dark:text-white">Resumen de Costos</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-600">Espacios ({selectedSpaces.length})</span>
                                <span className="font-medium">${(selectedSpaces.length * trip.price_per_space).toFixed(2)} {trip.currency}</span>
                            </div>
                            {watch("request_pickup") && (
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Recolección ({trip.pickup_cost_type === 'per_pallet' ? 'Por tarima' : 'Tarifa plana'})</span>
                                    <span className="font-medium">
                                        ${(trip.pickup_cost_type === 'per_pallet'
                                            ? (trip.pickup_cost || 0) * selectedSpaces.length
                                            : (trip.pickup_cost || 0)).toFixed(2)} {trip.currency}
                                    </span>
                                </div>
                            )}
                            {/* Calculate Labeling Cost */}
                            {watchedItems.some((i: any) => i.needs_labeling) && (
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Etiquetado (Est.)</span>
                                    <span className="font-medium">
                                        ${watchedItems.reduce((sum: number, i: any) => sum + (i.needs_labeling ? (i.labeling_quantity || 0) * 1 : 0), 0).toFixed(2)} {trip.currency}
                                    </span>
                                </div>
                            )}

                            {trip.is_international && !watch("use_own_bond") && (
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Fianza Keikichi</span>
                                    <span className="font-medium">${(trip.bond_cost || 500).toFixed(2)} {trip.currency}</span>
                                </div>
                            )}

                            <div className="border-t pt-2 mt-2">
                                <div className="flex justify-between items-end">
                                    <span className="font-bold text-slate-900">Total ({trip.currency})</span>
                                    <span className="font-bold text-xl text-blue-600">
                                        ${
                                            (
                                                (selectedSpaces.length * trip.price_per_space) +
                                                (watch("request_pickup")
                                                    ? (trip.pickup_cost_type === 'per_pallet'
                                                        ? (trip.pickup_cost || 0) * selectedSpaces.length
                                                        : (trip.pickup_cost || 0))
                                                    : 0) +
                                                (trip.is_international && !watch("use_own_bond") ? (trip.bond_cost || 500) : 0) +
                                                watchedItems.reduce((sum: number, i: any) => sum + (i.needs_labeling ? (i.labeling_quantity || 0) * 1 : 0), 0)
                                            ).toFixed(2)
                                        }
                                    </span>
                                </div>
                                {trip.currency !== "MXN" && (
                                    <div className="flex justify-between items-end mt-1 text-slate-500">
                                        <span className="text-xs">Aprox. MXN (TC: {trip.exchange_rate})</span>
                                        <span className="font-medium text-sm">
                                            ${(
                                                (
                                                    (selectedSpaces.length * trip.price_per_space) +
                                                    (watch("request_pickup")
                                                        ? (trip.pickup_cost_type === 'per_pallet'
                                                            ? (trip.pickup_cost || 0) * selectedSpaces.length
                                                            : (trip.pickup_cost || 0))
                                                        : 0) +
                                                    (trip.is_international && !watch("use_own_bond") ? (trip.bond_cost || 500) : 0) +
                                                    watchedItems.reduce((sum: number, i: any) => sum + (i.needs_labeling ? (i.labeling_quantity || 0) * 1 : 0), 0)
                                                ) * trip.exchange_rate
                                            ).toFixed(2)} MXN
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-between pt-4">
                        <button
                            type="button"
                            onClick={prevStep}
                            className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-4 py-2"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Atrás
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex items-center gap-2 bg-blue-600 text-white px-8 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                            {isSubmitting ? "Procesando..." : "Confirmar Reservación"}
                        </button>
                    </div>
                </div>
            )
            }
        </form >
    );
};

export default ReservationForm;

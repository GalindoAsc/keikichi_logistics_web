import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Plus, Trash2, Edit2, X, Check } from "lucide-react";
import { fetchLabelPrices, createLabelPrice, updateLabelPrice, deleteLabelPrice, LabelPrice } from "../../api/labelPrices";

const labelPriceSchema = z.object({
    dimensions: z.string().min(1, "Dimensiones requeridas"),
    price: z.number().min(0, "Precio no puede ser negativo"),
    description: z.string().optional(),
});

type LabelPriceFormData = z.infer<typeof labelPriceSchema>;

const LabelPricesPage = () => {
    const queryClient = useQueryClient();
    const [isCreating, setIsCreating] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const { data: prices, isLoading } = useQuery({
        queryKey: ["label-prices"],
        queryFn: fetchLabelPrices,
    });

    const createMutation = useMutation({
        mutationFn: createLabelPrice,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["label-prices"] });
            setIsCreating(false);
            toast.success("Precio creado exitosamente");
        },
        onError: () => toast.error("Error al crear precio"),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: LabelPriceFormData }) => updateLabelPrice(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["label-prices"] });
            setEditingId(null);
            toast.success("Precio actualizado exitosamente");
        },
        onError: () => toast.error("Error al actualizar precio"),
    });

    const deleteMutation = useMutation({
        mutationFn: deleteLabelPrice,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["label-prices"] });
            toast.success("Precio eliminado exitosamente");
        },
        onError: () => toast.error("Error al eliminar precio"),
    });

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<LabelPriceFormData>({
        resolver: zodResolver(labelPriceSchema),
    });

    const onSubmit = (data: LabelPriceFormData) => {
        createMutation.mutate(data);
        reset();
    };

    if (isLoading) return <div className="p-8 text-center">Cargando precios...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-900">Precios de Etiquetas</h1>
                <button
                    onClick={() => setIsCreating(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Nuevo Precio
                </button>
            </div>

            {isCreating && (
                <div className="bg-white p-4 rounded-lg shadow border border-blue-100 mb-6">
                    <h3 className="font-medium mb-4">Agregar Nuevo Precio</h3>
                    <form onSubmit={handleSubmit(onSubmit)} className="flex gap-4 items-start">
                        <div className="flex-1 space-y-1">
                            <input
                                {...register("dimensions")}
                                placeholder="Dimensiones (ej. 4x6)"
                                className="w-full border rounded px-3 py-2 text-sm"
                            />
                            {errors.dimensions && <p className="text-xs text-red-500">{errors.dimensions.message}</p>}
                        </div>
                        <div className="w-32 space-y-1">
                            <input
                                type="number"
                                step="0.01"
                                {...register("price", { valueAsNumber: true })}
                                placeholder="Precio"
                                className="w-full border rounded px-3 py-2 text-sm"
                            />
                            {errors.price && <p className="text-xs text-red-500">{errors.price.message}</p>}
                        </div>
                        <div className="flex-1 space-y-1">
                            <input
                                {...register("description")}
                                placeholder="Descripción (opcional)"
                                className="w-full border rounded px-3 py-2 text-sm"
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="submit"
                                className="bg-green-600 text-white p-2 rounded hover:bg-green-700"
                                title="Guardar"
                            >
                                <Check className="w-4 h-4" />
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsCreating(false);
                                    reset();
                                }}
                                className="bg-slate-200 text-slate-600 p-2 rounded hover:bg-slate-300"
                                title="Cancelar"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="table-responsive">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-700 font-medium border-b">
                            <tr>
                                <th className="px-6 py-3">Dimensiones</th>
                                <th className="px-6 py-3">Precio (USD)</th>
                                <th className="px-6 py-3">Descripción</th>
                                <th className="px-6 py-3 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {prices?.map((price) => (
                                <PriceRow
                                    key={price.id}
                                    price={price}
                                    isEditing={editingId === price.id}
                                    onEdit={() => setEditingId(price.id)}
                                    onCancel={() => setEditingId(null)}
                                    onSave={(data) => updateMutation.mutate({ id: price.id, data })}
                                    onDelete={() => {
                                        if (confirm("¿Estás seguro de eliminar este precio?")) {
                                            deleteMutation.mutate(price.id);
                                        }
                                    }}
                                />
                            ))}
                            {prices?.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                                        No hay precios configurados.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const PriceRow = ({
    price,
    isEditing,
    onEdit,
    onCancel,
    onSave,
    onDelete,
}: {
    price: LabelPrice;
    isEditing: boolean;
    onEdit: () => void;
    onCancel: () => void;
    onSave: (data: LabelPriceFormData) => void;
    onDelete: () => void;
}) => {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LabelPriceFormData>({
        resolver: zodResolver(labelPriceSchema),
        defaultValues: {
            dimensions: price.dimensions,
            price: price.price,
            description: price.description || "",
        },
    });

    if (isEditing) {
        return (
            <tr className="bg-blue-50">
                <td className="px-6 py-3">
                    <input
                        {...register("dimensions")}
                        className="w-full border rounded px-2 py-1 text-sm"
                    />
                </td>
                <td className="px-6 py-3">
                    <input
                        type="number"
                        step="0.01"
                        {...register("price", { valueAsNumber: true })}
                        className="w-24 border rounded px-2 py-1 text-sm"
                    />
                </td>
                <td className="px-6 py-3">
                    <input
                        {...register("description")}
                        className="w-full border rounded px-2 py-1 text-sm"
                    />
                </td>
                <td className="px-6 py-3 text-right">
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={handleSubmit(onSave)}
                            className="text-green-600 hover:text-green-800"
                        >
                            <Check className="w-4 h-4" />
                        </button>
                        <button onClick={onCancel} className="text-slate-500 hover:text-slate-700">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </td>
            </tr>
        );
    }

    return (
        <tr className="hover:bg-slate-50">
            <td className="px-6 py-3 font-medium text-slate-900">{price.dimensions}</td>
            <td className="px-6 py-3">${price.price}</td>
            <td className="px-6 py-3 text-slate-500">{price.description || "-"}</td>
            <td className="px-6 py-3 text-right">
                <div className="flex justify-end gap-2">
                    <button onClick={onEdit} className="text-blue-600 hover:text-blue-800">
                        <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={onDelete} className="text-red-500 hover:text-red-700">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </td>
        </tr>
    );
};

export default LabelPricesPage;

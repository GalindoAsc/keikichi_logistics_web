import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Plus, Trash2, Edit2, X, Check, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { fetchLabelPrices, createLabelPrice, updateLabelPrice, deleteLabelPrice, LabelPrice } from "../../api/labelPrices";

const labelPriceSchema = z.object({
    dimensions: z.string().min(1, "Dimensiones requeridas"),
    price: z.number().min(0, "Precio no puede ser negativo"),
    description: z.string().optional(),
});

type LabelPriceFormData = z.infer<typeof labelPriceSchema>;

const LabelPricesPage = () => {
    const navigate = useNavigate();
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
            <button
                onClick={() => navigate("/admin/settings")}
                className="flex items-center text-keikichi-forest-600 dark:text-keikichi-lime-300 hover:text-keikichi-forest-900 dark:hover:text-keikichi-lime-100 transition-colors"
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver a Ajustes
            </button>

            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-keikichi-forest-800 dark:text-white">Precios de Etiquetas</h1>
                <button
                    onClick={() => setIsCreating(true)}
                    className="bg-keikichi-lime-600 text-white px-4 py-2 rounded-md hover:bg-keikichi-lime-700 flex items-center gap-2 transition-colors dark:bg-keikichi-lime-600 dark:hover:bg-keikichi-lime-500"
                >
                    <Plus className="w-4 h-4" />
                    Nuevo Precio
                </button>
            </div>

            {isCreating && (
                <div className="bg-white dark:bg-keikichi-forest-800 p-4 rounded-lg shadow border border-keikichi-lime-100 dark:border-keikichi-forest-600 mb-6 transition-colors">
                    <h3 className="font-medium mb-4 text-keikichi-forest-800 dark:text-white">Agregar Nuevo Precio</h3>
                    <form onSubmit={handleSubmit(onSubmit)} className="flex gap-4 items-start">
                        <div className="flex-1 space-y-1">
                            <input
                                {...register("dimensions")}
                                placeholder="Dimensiones (ej. 4x6)"
                                className="w-full border dark:border-keikichi-forest-600 rounded px-3 py-2 text-sm bg-white dark:bg-keikichi-forest-700 text-keikichi-forest-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-keikichi-lime-500"
                            />
                            {errors.dimensions && <p className="text-xs text-red-500">{errors.dimensions.message}</p>}
                        </div>
                        <div className="w-32 space-y-1">
                            <input
                                type="number"
                                step="0.01"
                                {...register("price", { valueAsNumber: true })}
                                placeholder="Precio"
                                className="w-full border dark:border-keikichi-forest-600 rounded px-3 py-2 text-sm bg-white dark:bg-keikichi-forest-700 text-keikichi-forest-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-keikichi-lime-500"
                            />
                            {errors.price && <p className="text-xs text-red-500">{errors.price.message}</p>}
                        </div>
                        <div className="flex-1 space-y-1">
                            <input
                                {...register("description")}
                                placeholder="Descripción (opcional)"
                                className="w-full border dark:border-keikichi-forest-600 rounded px-3 py-2 text-sm bg-white dark:bg-keikichi-forest-700 text-keikichi-forest-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-keikichi-lime-500"
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="submit"
                                className="bg-keikichi-lime-600 text-white p-2 rounded hover:bg-keikichi-lime-700 transition-colors"
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
                                className="bg-gray-100 dark:bg-keikichi-forest-700 text-gray-600 dark:text-keikichi-lime-300 p-2 rounded hover:bg-gray-200 dark:hover:bg-keikichi-forest-600 transition-colors"
                                title="Cancelar"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white dark:bg-keikichi-forest-800 rounded-xl shadow-sm border border-keikichi-lime-100 dark:border-keikichi-forest-600 overflow-hidden transition-colors">
                <div className="table-responsive">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-keikichi-lime-50 dark:bg-keikichi-forest-700 text-keikichi-forest-600 dark:text-keikichi-lime-300 font-medium border-b border-keikichi-lime-100 dark:border-keikichi-forest-600">
                            <tr>
                                <th className="px-6 py-3">Dimensiones</th>
                                <th className="px-6 py-3">Precio (USD)</th>
                                <th className="px-6 py-3">Descripción</th>
                                <th className="px-6 py-3 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-keikichi-lime-100 dark:divide-keikichi-forest-600">
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
                                    <td colSpan={4} className="px-6 py-8 text-center text-keikichi-forest-500 dark:text-keikichi-lime-400">
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
        formState: { errors: _errors },
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
            <tr className="bg-keikichi-lime-50 dark:bg-keikichi-forest-700/50">
                <td className="px-6 py-3">
                    <input
                        {...register("dimensions")}
                        className="w-full border dark:border-keikichi-forest-600 rounded px-2 py-1 text-sm bg-white dark:bg-keikichi-forest-700 text-keikichi-forest-800 dark:text-white"
                    />
                </td>
                <td className="px-6 py-3">
                    <input
                        type="number"
                        step="0.01"
                        {...register("price", { valueAsNumber: true })}
                        className="w-24 border dark:border-keikichi-forest-600 rounded px-2 py-1 text-sm bg-white dark:bg-keikichi-forest-700 text-keikichi-forest-800 dark:text-white"
                    />
                </td>
                <td className="px-6 py-3">
                    <input
                        {...register("description")}
                        className="w-full border dark:border-keikichi-forest-600 rounded px-2 py-1 text-sm bg-white dark:bg-keikichi-forest-700 text-keikichi-forest-800 dark:text-white"
                    />
                </td>
                <td className="px-6 py-3 text-right">
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={handleSubmit(onSave)}
                            className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                        >
                            <Check className="w-4 h-4" />
                        </button>
                        <button onClick={onCancel} className="text-keikichi-forest-500 hover:text-keikichi-forest-700 dark:text-keikichi-lime-500 dark:hover:text-keikichi-lime-400">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </td>
            </tr>
        );
    }

    return (
        <tr className="hover:bg-keikichi-lime-50 dark:hover:bg-keikichi-forest-700 transition-colors">
            <td className="px-6 py-3 font-medium text-keikichi-forest-800 dark:text-white">{price.dimensions}</td>
            <td className="px-6 py-3 text-keikichi-forest-700 dark:text-keikichi-lime-300 font-medium">${price.price}</td>
            <td className="px-6 py-3 text-keikichi-forest-500 dark:text-keikichi-lime-300">{price.description || "-"}</td>
            <td className="px-6 py-3 text-right">
                <div className="flex justify-end gap-2">
                    <button onClick={onEdit} className="text-keikichi-forest-400 dark:text-keikichi-lime-500 hover:text-keikichi-lime-600 dark:hover:text-keikichi-lime-400">
                        <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={onDelete} className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </td>
        </tr>
    );
};

export default LabelPricesPage;

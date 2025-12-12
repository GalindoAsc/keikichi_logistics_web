import { Trash2, Package } from "lucide-react";
import { useState, useEffect } from "react";
import { useProducts } from "../../hooks/useProducts";
import { useQuery } from "@tanstack/react-query";
import api from "../../api/client";

interface ProductCardProps {
    index: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    field: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handleItemChange: (index: number, field: string, value: any) => void;
    onRemove: (index: number) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    errors?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    labelPrices?: any[];
}

const ProductCard = ({ index, field, handleItemChange, onRemove, errors, labelPrices }: ProductCardProps) => {
    const { productOptions: PRODUCT_OPTIONS } = useProducts();
    const [productSearch, setProductSearch] = useState(field.product_name || "");
    const [showProductSuggestions, setShowProductSuggestions] = useState(false);

    // Fetch packaging history and catalog units
    const { data: packagingOptions } = useQuery({
        queryKey: ["packaging-options"],
        queryFn: async () => {
            const [historyRes, unitsRes] = await Promise.all([
                api.get<string[]>("/users/me/packaging-history"),
                api.get<any[]>("/catalog/units")
            ]);

            const history = historyRes.data || [];
            const units = unitsRes.data.map((u: any) => u.name) || [];

            // Combine and deduplicate
            return Array.from(new Set([...units, ...history]));
        }
    });

    const [packagingSearch, setPackagingSearch] = useState(field.packaging_type || "");
    const [showPackagingSuggestions, setShowPackagingSuggestions] = useState(false);

    // Sync local state with props
    useEffect(() => {
        setProductSearch(field.product_name || "");
    }, [field.product_name]);

    useEffect(() => {
        setPackagingSearch(field.packaging_type || "");
    }, [field.packaging_type]);

    const filteredProducts = PRODUCT_OPTIONS.filter(p =>
        p.toLowerCase().includes(productSearch.toLowerCase())
    );

    const filteredPackaging = packagingOptions ? packagingOptions.filter((p: string) =>
        p.toLowerCase().includes(packagingSearch.toLowerCase())
    ) : [];

    return (
        <div className="bg-white dark:bg-keikichi-forest-800 border dark:border-keikichi-forest-600 rounded-lg p-4 shadow-sm space-y-4 relative transition-colors">
            <div className="flex justify-between items-start">
                <h4 className="font-medium text-slate-800 dark:text-white flex items-center gap-2">
                    <Package className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    Producto #{index + 1}
                </h4>
                <button
                    type="button"
                    onClick={() => onRemove(index)}
                    className="text-red-500 hover:text-red-700 p-1"
                    title="Eliminar producto"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Product Selection with Autocomplete */}
                <div className="space-y-1 relative">
                    <label className="text-sm text-slate-600 dark:text-keikichi-lime-300">Producto</label>
                    <input
                        type="text"
                        className="w-full border rounded px-3 py-2 text-sm"
                        value={productSearch}
                        onChange={(e) => {
                            setProductSearch(e.target.value);
                            handleItemChange(index, "product_name", e.target.value);
                            setShowProductSuggestions(true);
                        }}
                        onFocus={() => setShowProductSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowProductSuggestions(false), 200)}
                        placeholder="Escribe para buscar..."
                    />
                    {showProductSuggestions && filteredProducts.length > 0 && (
                        <ul className="absolute z-10 w-full bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-md shadow-lg max-h-40 overflow-auto mt-1">
                            {filteredProducts.map((opt: string) => (
                                <li
                                    key={opt}
                                    className="px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer text-sm dark:text-slate-200"
                                    onClick={() => {
                                        handleItemChange(index, "product_name", opt);
                                        setProductSearch(opt);
                                        setShowProductSuggestions(false);
                                    }}
                                >
                                    {opt}
                                </li>
                            ))}
                        </ul>
                    )}
                    {errors?.product_name && <p className="text-xs text-red-500">Requerido</p>}
                </div>

                {/* Packaging Unit with History */}
                <div className="space-y-1 relative">
                    <label className="text-sm text-slate-600 dark:text-keikichi-lime-300">Unidad (Empaque)</label>
                    <input
                        type="text"
                        className="w-full border rounded px-3 py-2 text-sm"
                        value={packagingSearch}
                        onChange={(e) => {
                            setPackagingSearch(e.target.value);
                            handleItemChange(index, "packaging_type", e.target.value);
                            setShowPackagingSuggestions(true);
                        }}
                        onFocus={() => setShowPackagingSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowPackagingSuggestions(false), 200)}
                        placeholder="Ej. Caja estándar"
                    />
                    {showPackagingSuggestions && filteredPackaging.length > 0 && (
                        <ul className="absolute z-10 w-full bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-md shadow-lg max-h-40 overflow-auto mt-1">
                            {filteredPackaging.map((opt: string) => (
                                <li
                                    key={opt}
                                    className="px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer text-sm dark:text-slate-200"
                                    onClick={() => {
                                        handleItemChange(index, "packaging_type", opt);
                                        setPackagingSearch(opt);
                                        setShowPackagingSuggestions(false);
                                    }}
                                >
                                    {opt}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Quantity */}
                <div className="space-y-1">
                    <label className="text-sm text-slate-600 dark:text-keikichi-lime-300">Cantidad</label>
                    <input
                        type="number"
                        min="1"
                        className="w-full border rounded px-3 py-2 text-sm"
                        value={field.box_count || ""}
                        onChange={(e) => {
                            const val = e.target.valueAsNumber;
                            if (!isNaN(val)) {
                                handleItemChange(index, "box_count", val);
                            } else if (e.target.value === "") {
                                handleItemChange(index, "box_count", 0);
                            }
                        }}
                        placeholder="0"
                    />
                    {errors?.box_count && <p className="text-xs text-red-500">Mínimo 1</p>}
                </div>

                {/* Weight per Unit */}
                <div className="space-y-1">
                    <label className="text-sm text-slate-600 dark:text-keikichi-lime-300">Peso por Unidad</label>
                    <div className="relative flex gap-2">
                        <div className="relative flex-1">
                            <input
                                type="number"
                                step="0.01"
                                className="w-full border rounded px-3 py-2 text-sm"
                                value={field.weight_per_unit || ""}
                                onChange={(e) => {
                                    const val = parseFloat(e.target.value);
                                    if (!isNaN(val)) handleItemChange(index, "weight_per_unit", val);
                                }}
                                placeholder="0.00"
                            />
                        </div>
                        <select
                            className="border rounded px-2 py-2 text-sm bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-white w-24"
                            value={field.weight_unit || "kg"}
                            onChange={(e) => handleItemChange(index, "weight_unit", e.target.value)}
                        >
                            <option value="kg">kg</option>
                            <option value="lb">lb</option>
                            <option value="oz">oz</option>
                            <option value="lt">lt</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={field.needs_labeling}
                        onChange={(e) => handleItemChange(index, "needs_labeling", e.target.checked)}
                        id={`labeling-${index}`}
                        className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor={`labeling-${index}`} className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                        Requiere Etiquetado
                    </label>
                </div>

                {field.needs_labeling && (
                    <div className="pl-6 space-y-3 border-l-2 border-slate-200 ml-1">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs text-slate-500 dark:text-keikichi-lime-300">Cantidad</label>
                                <input
                                    type="number"
                                    value={field.labeling_quantity || ""}
                                    onChange={(e) => handleItemChange(index, "labeling_quantity", parseInt(e.target.value))}
                                    className="w-full border rounded px-2 py-1 text-sm"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-slate-500 dark:text-keikichi-lime-300">Medidas</label>
                                <select
                                    value={field.labeling_dimensions || ""}
                                    onChange={(e) => handleItemChange(index, "labeling_dimensions", e.target.value)}
                                    className="w-full border rounded px-2 py-1 text-sm"
                                >
                                    <option value="">Seleccionar...</option>
                                    {labelPrices?.map((p: any) => (
                                        <option key={p.id} value={p.dimensions}>
                                            {p.dimensions} - ${p.price}
                                        </option>
                                    ))}
                                    <option value="custom">Otra (Cotizar)</option>
                                </select>
                            </div>
                        </div>
                        {field.labeling_dimensions === "custom" && (
                            <div className="space-y-1">
                                <label className="text-xs text-slate-500 dark:text-keikichi-lime-300">Especificar Medidas</label>
                                <input
                                    type="text"
                                    value={field.labeling_dimensions === "custom" ? "" : field.labeling_dimensions}
                                    onChange={(e) => handleItemChange(index, "labeling_dimensions", e.target.value)}
                                    className="w-full border rounded px-2 py-1 text-sm"
                                    placeholder="Ej. 15x15 cm"
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductCard;

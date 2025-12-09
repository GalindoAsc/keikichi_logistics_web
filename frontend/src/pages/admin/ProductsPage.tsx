import { useState } from "react";
import { Tag, Plus, Trash2, ArrowLeft, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useProducts, useUnits } from "../../hooks/useProducts";
import { toast } from "sonner";
import { Product, Unit } from "../../api/catalog";

const ProductsPage = () => {
    const navigate = useNavigate();
    const { products, addProduct, removeProduct } = useProducts();
    const { units, addUnit, removeUnit } = useUnits();
    const [activeTab, setActiveTab] = useState<"products" | "units">("products");

    // Product Form
    const [prodNameEs, setProdNameEs] = useState("");
    const [prodNameEn, setProdNameEn] = useState("");

    // Unit Form
    const [unitName, setUnitName] = useState("");
    const [unitAbbr, setUnitAbbr] = useState("");

    const handleAddProduct = async () => {
        if (!prodNameEs.trim()) return;
        try {
            await addProduct({ name_es: prodNameEs.trim(), name_en: prodNameEn.trim() || undefined });
            setProdNameEs("");
            setProdNameEn("");
            toast.success("Producto agregado");
        } catch (error) {
            toast.error("Error al agregar producto");
        }
    };

    const handleAddUnit = async () => {
        if (!unitName.trim()) return;
        try {
            await addUnit({ name: unitName.trim(), abbreviation: unitAbbr.trim() || undefined });
            setUnitName("");
            setUnitAbbr("");
            toast.success("Unidad agregada");
        } catch (error) {
            toast.error("Error al agregar unidad");
        }
    };

    const handleRemoveProduct = async (id: number, name: string) => {
        if (confirm(`¿Estás seguro de eliminar "${name}"?`)) {
            try {
                await removeProduct(id);
                toast.success("Producto eliminado");
            } catch (error) {
                toast.error("Error al eliminar producto");
            }
        }
    };

    const handleRemoveUnit = async (id: number, name: string) => {
        if (confirm(`¿Estás seguro de eliminar "${name}"?`)) {
            try {
                await removeUnit(id);
                toast.success("Unidad eliminada");
            } catch (error) {
                toast.error("Error al eliminar unidad");
            }
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <button
                onClick={() => navigate("/admin/settings")}
                className="text-slate-600 hover:text-slate-900 flex items-center gap-2"
            >
                <ArrowLeft className="w-4 h-4" />
                Volver a Ajustes
            </button>

            <div className="flex items-center gap-2 mb-6">
                <Tag className="w-6 h-6 text-orange-600" />
                <h1 className="text-2xl font-bold text-slate-900">Productos y Unidades</h1>
            </div>

            {/* Tabs */}
            <div className="flex border-b">
                <button
                    className={`px-6 py-3 font-medium flex items-center gap-2 ${activeTab === "products" ? "border-b-2 border-orange-600 text-orange-600" : "text-slate-500 hover:text-slate-700"}`}
                    onClick={() => setActiveTab("products")}
                >
                    <Tag className="w-4 h-4" />
                    Productos
                </button>
                <button
                    className={`px-6 py-3 font-medium flex items-center gap-2 ${activeTab === "units" ? "border-b-2 border-orange-600 text-orange-600" : "text-slate-500 hover:text-slate-700"}`}
                    onClick={() => setActiveTab("units")}
                >
                    <Package className="w-4 h-4" />
                    Unidades
                </button>
            </div>

            <div className="bg-white rounded-lg border p-6 shadow-sm space-y-6">
                {activeTab === "products" ? (
                    <>
                        <div className="flex gap-4 items-end">
                            <div className="flex-1 space-y-1">
                                <label className="text-sm text-slate-600">Nombre (Español)</label>
                                <input
                                    type="text"
                                    value={prodNameEs}
                                    onChange={(e) => setProdNameEs(e.target.value)}
                                    className="w-full border rounded-md px-3 py-2"
                                    placeholder="Ej. Zanahoria"
                                />
                            </div>
                            <div className="flex-1 space-y-1">
                                <label className="text-sm text-slate-600">Nombre (Inglés) - Opcional</label>
                                <input
                                    type="text"
                                    value={prodNameEn}
                                    onChange={(e) => setProdNameEn(e.target.value)}
                                    className="w-full border rounded-md px-3 py-2"
                                    placeholder="Ej. Carrot"
                                />
                            </div>
                            <button
                                onClick={handleAddProduct}
                                disabled={!prodNameEs.trim()}
                                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 mb-[1px]"
                            >
                                <Plus className="w-4 h-4" />
                                Agregar
                            </button>
                        </div>

                        <div className="border rounded-md divide-y">
                            {products.map((product: Product) => (
                                <div key={product.id} className="p-4 flex justify-between items-center hover:bg-slate-50">
                                    <div>
                                        <span className="font-medium text-slate-800">{product.name_es}</span>
                                        {product.name_en && <span className="text-slate-500 ml-2">/ {product.name_en}</span>}
                                    </div>
                                    <button
                                        onClick={() => handleRemoveProduct(product.id, product.name_es)}
                                        className="text-slate-400 hover:text-red-600 transition-colors"
                                        title="Eliminar"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            {products.length === 0 && (
                                <div className="p-8 text-center text-slate-500">
                                    No hay productos registrados.
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        <div className="flex gap-4 items-end">
                            <div className="flex-1 space-y-1">
                                <label className="text-sm text-slate-600">Nombre Unidad</label>
                                <input
                                    type="text"
                                    value={unitName}
                                    onChange={(e) => setUnitName(e.target.value)}
                                    className="w-full border rounded-md px-3 py-2"
                                    placeholder="Ej. Caja Estándar"
                                />
                            </div>
                            <div className="flex-1 space-y-1">
                                <label className="text-sm text-slate-600">Abreviación</label>
                                <input
                                    type="text"
                                    value={unitAbbr}
                                    onChange={(e) => setUnitAbbr(e.target.value)}
                                    className="w-full border rounded-md px-3 py-2"
                                    placeholder="Ej. cja"
                                />
                            </div>
                            <button
                                onClick={handleAddUnit}
                                disabled={!unitName.trim()}
                                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 mb-[1px]"
                            >
                                <Plus className="w-4 h-4" />
                                Agregar
                            </button>
                        </div>

                        <div className="border rounded-md divide-y">
                            {units.map((unit: Unit) => (
                                <div key={unit.id} className="p-4 flex justify-between items-center hover:bg-slate-50">
                                    <div>
                                        <span className="font-medium text-slate-800">{unit.name}</span>
                                        {unit.abbreviation && <span className="text-slate-500 ml-2">({unit.abbreviation})</span>}
                                    </div>
                                    <button
                                        onClick={() => handleRemoveUnit(unit.id, unit.name)}
                                        className="text-slate-400 hover:text-red-600 transition-colors"
                                        title="Eliminar"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            {units.length === 0 && (
                                <div className="p-8 text-center text-slate-500">
                                    No hay unidades registradas.
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ProductsPage;

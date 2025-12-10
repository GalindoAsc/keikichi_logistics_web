import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, DollarSign, Save } from "lucide-react";
import { toast } from "sonner";
import { fetchSystemConfig, updateSystemConfig } from "../../api/systemConfig";
import LoadingSpinner from "../../components/shared/LoadingSpinner";

const ExchangeRatePage = () => {
    const navigate = useNavigate();
    const [exchangeRate, setExchangeRate] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const loadExchangeRate = async () => {
            try {
                const config = await fetchSystemConfig("exchange_rate");
                setExchangeRate(config.value);
            } catch (error) {
                // If not found, it might be the first time, so we leave it empty or set a default
                console.log("Exchange rate not set yet", error);
                setExchangeRate("18.50"); // Default fallback
            } finally {
                setLoading(false);
            }
        };
        loadExchangeRate();
    }, []);

    const handleSave = async () => {
        if (!exchangeRate || isNaN(parseFloat(exchangeRate))) {
            toast.error("Por favor ingresa un tipo de cambio válido");
            return;
        }

        setSaving(true);
        try {
            await updateSystemConfig("exchange_rate", exchangeRate);
            toast.success("Tipo de cambio actualizado correctamente");
        } catch (error) {
            toast.error("Error al guardar el tipo de cambio");
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <button
                onClick={() => navigate("/admin/settings")}
                className="flex items-center text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver a Ajustes
            </button>

            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 transition-colors">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Tipo de Cambio Diario</h1>
                        <p className="text-slate-500 dark:text-slate-400">Define el valor del dólar para las operaciones del sistema.</p>
                    </div>
                </div>

                <div className="max-w-md space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Tipo de Cambio (MXN por USD)
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400">$</span>
                            <input
                                type="number"
                                step="0.01"
                                value={exchangeRate}
                                onChange={(e) => setExchangeRate(e.target.value)}
                                className="w-full pl-8 pr-4 py-2 border dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                placeholder="0.00"
                            />
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Este valor se utilizará como referencia predeterminada al crear nuevos viajes y para conversiones en tiempo real donde aplique.
                        </p>
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 transition-colors"
                    >
                        <Save className="w-4 h-4" />
                        {saving ? "Guardando..." : "Guardar Cambios"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ExchangeRatePage;

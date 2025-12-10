import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Building, Bell, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { fetchSystemConfig, updateSystemConfig } from "../../api/systemConfig";
import LoadingSpinner from "../../components/shared/LoadingSpinner";

interface BusinessInfo {
    name: string;
    address: string;
    phone: string;
    email: string;
    website: string;
}

interface NotificationPreferences {
    email_enabled: boolean;
    whatsapp_enabled: boolean;
    in_app_enabled: boolean;
}

const initialBusinessInfo: BusinessInfo = {
    name: "",
    address: "",
    phone: "",
    email: "",
    website: "",
};

const initialNotificationPreferences: NotificationPreferences = {
    email_enabled: true,
    whatsapp_enabled: false,
    in_app_enabled: true,
};

interface TaxItem {
    id: string;
    name: string;
    rate: number;
    type: "tax" | "commission";
    active: boolean;
}

interface TaxConfig {
    items: TaxItem[];
}

const initialTaxConfig: TaxConfig = {
    items: [
        { id: "1", name: "IVA", rate: 0.16, type: "tax", active: true },
        { id: "2", name: "Comisión", rate: 0.0, type: "commission", active: true }
    ]
};

const GeneralSettingsPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [businessInfo, setBusinessInfo] = useState<BusinessInfo>(initialBusinessInfo);
    const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>(initialNotificationPreferences);
    const [taxConfig, setTaxConfig] = useState<TaxConfig>(initialTaxConfig);

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const [businessConfig, notifConfig, taxConfigRes] = await Promise.allSettled([
                    fetchSystemConfig("business_info"),
                    fetchSystemConfig("notification_preferences"),
                    fetchSystemConfig("tax_config"),
                ]);

                if (businessConfig.status === "fulfilled") {
                    try {
                        setBusinessInfo(JSON.parse(businessConfig.value.value));
                    } catch { }
                }

                if (notifConfig.status === "fulfilled") {
                    try {
                        setNotificationPrefs(JSON.parse(notifConfig.value.value));
                    } catch { }
                }

                if (taxConfigRes.status === "fulfilled") {
                    try {
                        const parsed = JSON.parse(taxConfigRes.value.value);
                        // Handle migration from old format if necessary
                        if (!parsed.items && (parsed.tax_name || parsed.default_tax_rate)) {
                            setTaxConfig({
                                items: [
                                    { id: "1", name: parsed.tax_name || "IVA", rate: parsed.default_tax_rate || 0.16, type: "tax", active: true },
                                    { id: "2", name: parsed.commission_name || "Comisión", rate: parsed.default_commission_rate || 0, type: "commission", active: true }
                                ]
                            });
                        } else {
                            setTaxConfig(parsed);
                        }
                    } catch { }
                }
            } catch (error) {
                console.error("Error loading settings", error);
            } finally {
                setLoading(false);
            }
        };
        loadSettings();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            await Promise.all([
                updateSystemConfig("business_info", JSON.stringify(businessInfo)),
                updateSystemConfig("notification_preferences", JSON.stringify(notificationPrefs)),
                updateSystemConfig("tax_config", JSON.stringify(taxConfig)),
            ]);
            toast.success("Ajustes guardados correctamente");
        } catch (error) {
            toast.error("Error al guardar ajustes");
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    const addTaxItem = () => {
        setTaxConfig({
            items: [
                ...taxConfig.items,
                {
                    id: Date.now().toString(),
                    name: "Nuevo Impuesto",
                    rate: 0,
                    type: "tax",
                    active: true
                }
            ]
        });
    };

    const removeTaxItem = (id: string) => {
        setTaxConfig({
            items: taxConfig.items.filter(item => item.id !== id)
        });
    };

    const updateTaxItem = (id: string, field: keyof TaxItem, value: any) => {
        setTaxConfig({
            items: taxConfig.items.map(item =>
                item.id === id ? { ...item, [field]: value } : item
            )
        });
    };

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <button
                onClick={() => navigate("/admin/settings")}
                className="flex items-center text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver a Ajustes
            </button>

            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Ajustes Generales</h1>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                    <Save className="w-4 h-4" />
                    {saving ? "Guardando..." : "Guardar Cambios"}
                </button>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {/* Business Info */}
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 transition-colors">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                            <Building className="w-6 h-6" />
                        </div>
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Información del Negocio</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nombre del Negocio</label>
                            <input
                                value={businessInfo.name}
                                onChange={(e) => setBusinessInfo({ ...businessInfo, name: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="Keikichi Logistics"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Dirección</label>
                            <input
                                value={businessInfo.address}
                                onChange={(e) => setBusinessInfo({ ...businessInfo, address: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="Calle Principal 123, Ciudad"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Teléfono</label>
                            <input
                                value={businessInfo.phone}
                                onChange={(e) => setBusinessInfo({ ...businessInfo, phone: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="+52 123 456 7890"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email de Contacto</label>
                            <input
                                value={businessInfo.email}
                                onChange={(e) => setBusinessInfo({ ...businessInfo, email: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="contacto@keikichi.com"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Sitio Web</label>
                            <input
                                value={businessInfo.website}
                                onChange={(e) => setBusinessInfo({ ...businessInfo, website: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="https://keikichi.com"
                            />
                        </div>
                    </div>
                </div>

                {/* Notification Preferences */}
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 transition-colors">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg text-yellow-600 dark:text-yellow-400">
                            <Bell className="w-6 h-6" />
                        </div>
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Preferencias de Notificación</h2>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-transparent dark:border-slate-700">
                            <div>
                                <h3 className="font-medium text-slate-900 dark:text-white">Notificaciones por Correo</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Enviar confirmaciones y actualizaciones por email.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={notificationPrefs.email_enabled}
                                    onChange={(e) => setNotificationPrefs({ ...notificationPrefs, email_enabled: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-slate-200 dark:bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-900 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-transparent dark:border-slate-700">
                            <div>
                                <h3 className="font-medium text-slate-900 dark:text-white">Notificaciones por WhatsApp</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Enviar mensajes automáticos por WhatsApp.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={notificationPrefs.whatsapp_enabled}
                                    onChange={(e) => setNotificationPrefs({ ...notificationPrefs, whatsapp_enabled: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-slate-200 dark:bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-900 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-transparent dark:border-slate-700">
                            <div>
                                <h3 className="font-medium text-slate-900 dark:text-white">Notificaciones In-App</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Mostrar notificaciones dentro de la plataforma.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={notificationPrefs.in_app_enabled}
                                    onChange={(e) => setNotificationPrefs({ ...notificationPrefs, in_app_enabled: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-slate-200 dark:bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-900 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Tax and Commission Settings */}
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 transition-colors">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-50 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400">
                                <Building className="w-6 h-6" />
                            </div>
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Impuestos y Comisiones</h2>
                        </div>
                        <button
                            onClick={addTaxItem}
                            className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                            <Plus className="w-4 h-4" />
                            Agregar
                        </button>
                    </div>

                    <div className="space-y-4">
                        {taxConfig.items.map((item) => (
                            <div key={item.id} className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors">
                                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Nombre</label>
                                        <input
                                            value={item.name}
                                            onChange={(e) => updateTaxItem(item.id, "name", e.target.value)}
                                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-md text-sm"
                                            placeholder="Nombre"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Tipo</label>
                                        <select
                                            value={item.type}
                                            onChange={(e) => updateTaxItem(item.id, "type", e.target.value)}
                                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-md text-sm"
                                        >
                                            <option value="tax">Impuesto</option>
                                            <option value="commission">Comisión</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Tasa (%)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={item.rate * 100}
                                            onChange={(e) => updateTaxItem(item.id, "rate", parseFloat(e.target.value) / 100)}
                                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-md text-sm"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 mt-6">
                                    <button
                                        onClick={() => removeTaxItem(item.id)}
                                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors"
                                        title="Eliminar"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}

                        {taxConfig.items.length === 0 && (
                            <div className="text-center py-8 text-slate-500 dark:text-slate-400 text-sm">
                                No hay impuestos o comisiones configurados.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GeneralSettingsPage;

import { useState, useEffect } from "react";
import { ArrowLeft, Save, FileText, Building2, Phone, Mail, Globe, Loader2, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { fetchSystemConfigs, updateSystemConfig, SystemConfig } from "../../api/systemConfig";

interface DocumentSettings {
    company_name: string;
    company_address: string;
    company_phone: string;
    company_email: string;
    company_website: string;
    pdf_footer_text: string;
    terms_and_conditions: string;
    payment_instructions: string; // Legacy - keep for backward compatibility
    payment_instructions_cash: string;
    payment_instructions_transfer: string;
    payment_instructions_mercadopago: string;
    cash_payment_info: string;
    whatsapp_number: string;
}

const DEFAULT_SETTINGS: DocumentSettings = {
    company_name: "Keikichi Logistics",
    company_address: "",
    company_phone: "",
    company_email: "soporte@keikichi.com",
    company_website: "www.keikichi.com",
    pdf_footer_text: "Gracias por confiar en Keikichi Logistics",
    terms_and_conditions: `• Este ticket es válido para los espacios indicados en el viaje especificado.
• La carga debe entregarse en bodega con al menos 2 horas de anticipación.
• Keikichi Logistics no se hace responsable por daños a mercancía frágil sin embalaje adecuado.
• Las cancelaciones deben solicitarse con al menos 24 horas de anticipación.
• Presenta este ticket al momento de entregar tu carga.`,
    payment_instructions: `1. Realiza la transferencia por el monto exacto indicado.
2. Envía tu comprobante de pago a través de la plataforma o por WhatsApp.
3. Tu reservación será confirmada en un máximo de 2 horas después de verificar el pago.
4. Recibirás tu ticket de confirmación por email.`,
    payment_instructions_cash: `1. Presenta este resumen en bodega
2. Paga el monto exacto en efectivo
3. Tu reservación se confirma al pagar
4. Recibirás tu ticket de inmediato`,
    payment_instructions_transfer: `1. Transfiere el monto exacto indicado
2. Envía tu comprobante por la plataforma
3. Confirmación en máximo 2 horas
4. Recibirás tu ticket por email`,
    payment_instructions_mercadopago: `1. Haz clic en el botón de pago
2. Completa el pago en MercadoPago
3. Tu reservación se confirma automáticamente
4. Recibirás tu ticket por email`,
    cash_payment_info: `El pago se realizará al entregar tu carga en bodega.

Importante: Lleva el monto exacto, no se dan cambios.`,
    whatsapp_number: "",
};

const DocumentSettingsPage = () => {
    const navigate = useNavigate();
    const [settings, setSettings] = useState<DocumentSettings>(DEFAULT_SETTINGS);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<"company" | "documents" | "instructions">("company");

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            setLoading(true);
            const configs = await fetchSystemConfigs();
            const configMap: Record<string, string> = {};
            configs.forEach((c: SystemConfig) => {
                configMap[c.key] = c.value;
            });

            setSettings({
                company_name: configMap.company_name || DEFAULT_SETTINGS.company_name,
                company_address: configMap.company_address || DEFAULT_SETTINGS.company_address,
                company_phone: configMap.company_phone || DEFAULT_SETTINGS.company_phone,
                company_email: configMap.company_email || DEFAULT_SETTINGS.company_email,
                company_website: configMap.company_website || DEFAULT_SETTINGS.company_website,
                pdf_footer_text: configMap.pdf_footer_text || DEFAULT_SETTINGS.pdf_footer_text,
                terms_and_conditions: configMap.terms_and_conditions || DEFAULT_SETTINGS.terms_and_conditions,
                payment_instructions: configMap.payment_instructions || DEFAULT_SETTINGS.payment_instructions,
                payment_instructions_cash: configMap.payment_instructions_cash || DEFAULT_SETTINGS.payment_instructions_cash,
                payment_instructions_transfer: configMap.payment_instructions_transfer || DEFAULT_SETTINGS.payment_instructions_transfer,
                payment_instructions_mercadopago: configMap.payment_instructions_mercadopago || DEFAULT_SETTINGS.payment_instructions_mercadopago,
                cash_payment_info: configMap.cash_payment_info || DEFAULT_SETTINGS.cash_payment_info,
                whatsapp_number: configMap.whatsapp_number || DEFAULT_SETTINGS.whatsapp_number,
            });
        } catch (error) {
            console.error("Error loading settings:", error);
            toast.error("Error al cargar la configuración");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const updates = Object.entries(settings).map(([key, value]) =>
                updateSystemConfig(key, value)
            );
            await Promise.all(updates);
            toast.success("Ajustes de documentos guardados");
        } catch (error) {
            toast.error("Error al guardar ajustes");
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    const handleSyncFromGeneral = async () => {
        try {
            setLoading(true);
            const businessConfig = await fetchSystemConfigs();
            const businessInfoStr = businessConfig.find(c => c.key === 'business_info')?.value;

            if (businessInfoStr) {
                try {
                    const businessInfo = JSON.parse(businessInfoStr);
                    setSettings(prev => ({
                        ...prev,
                        company_name: businessInfo.name || prev.company_name,
                        company_address: businessInfo.address || prev.company_address,
                        company_phone: businessInfo.phone || prev.company_phone,
                        company_email: businessInfo.email || prev.company_email,
                        company_website: businessInfo.website || prev.company_website
                    }));
                    toast.success("Datos sincronizados desde Ajustes Generales");
                } catch (e) {
                    toast.error("Error al procesar datos de Ajustes Generales");
                }
            } else {
                toast.error("No se encontró información en Ajustes Generales");
            }
        } catch (error) {
            toast.error("Error al obtener Ajustes Generales");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field: keyof DocumentSettings, value: string) => {
        setSettings(prev => ({ ...prev, [field]: value }));
    };

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <button
                onClick={() => navigate("/admin/settings")}
                className="flex items-center text-keikichi-forest-600 dark:text-keikichi-lime-300 hover:text-keikichi-forest-900 dark:hover:text-keikichi-lime-100 transition-colors"
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver a Ajustes
            </button>

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-keikichi-forest-800 dark:text-white">Configuración de Documentos</h1>
                    <p className="text-keikichi-forest-500 dark:text-keikichi-lime-300 mt-1">Personaliza la información que aparece en PDFs, tickets y resúmenes.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 bg-keikichi-lime-600 text-white px-4 py-2 rounded-lg hover:bg-keikichi-lime-700 disabled:opacity-50 transition-colors"
                >
                    <Save className="w-4 h-4" />
                    {saving ? "Guardando..." : "Guardar Cambios"}
                </button>
            </div>

            <div className="bg-white dark:bg-keikichi-forest-800 rounded-xl shadow-sm border border-keikichi-lime-100 dark:border-keikichi-forest-600 overflow-hidden transition-colors">
                <div className="flex border-b border-keikichi-lime-100 dark:border-keikichi-forest-600 overflow-x-auto">
                    <button
                        onClick={() => setActiveTab("company")}
                        className={`flex-1 px-6 py-4 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === "company"
                            ? "border-keikichi-lime-600 text-keikichi-lime-600 dark:text-keikichi-lime-400 dark:border-keikichi-lime-400"
                            : "border-transparent text-keikichi-forest-500 dark:text-keikichi-lime-300 hover:text-keikichi-forest-700 dark:hover:text-keikichi-lime-100"
                            }`}
                    >
                        <Building2 className="w-4 h-4" />
                        Empresa
                    </button>
                    <button
                        onClick={() => setActiveTab("documents")}
                        className={`flex-1 px-6 py-4 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === "documents"
                            ? "border-keikichi-lime-600 text-keikichi-lime-600 dark:text-keikichi-lime-400 dark:border-keikichi-lime-400"
                            : "border-transparent text-keikichi-forest-500 dark:text-keikichi-lime-300 hover:text-keikichi-forest-700 dark:hover:text-keikichi-lime-100"
                            }`}
                    >
                        <FileText className="w-4 h-4" />
                        Documentos
                    </button>
                    <button
                        onClick={() => setActiveTab("instructions")}
                        className={`flex-1 px-6 py-4 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === "instructions"
                            ? "border-keikichi-lime-600 text-keikichi-lime-600 dark:text-keikichi-lime-400 dark:border-keikichi-lime-400"
                            : "border-transparent text-keikichi-forest-500 dark:text-keikichi-lime-300 hover:text-keikichi-forest-700 dark:hover:text-keikichi-lime-100"
                            }`}
                    >
                        <Mail className="w-4 h-4" />
                        Instrucciones
                    </button>
                </div>

                <div className="p-6">
                    {activeTab === "company" && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg border border-blue-100 dark:border-blue-800/30 transition-colors">
                                <div className="flex items-center gap-2">
                                    <RefreshCw className="w-5 h-5" />
                                    <span className="font-medium">Sincronización de Datos</span>
                                </div>
                                <button
                                    onClick={handleSyncFromGeneral}
                                    className="text-sm bg-white dark:bg-keikichi-forest-700 border border-blue-200 dark:border-blue-700 px-3 py-1.5 rounded-md hover:bg-blue-50 dark:hover:bg-keikichi-forest-600 transition-colors flex items-center gap-2 shadow-sm dark:text-blue-300"
                                >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                    Traer de Ajustes Generales
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-keikichi-forest-700 dark:text-keikichi-lime-300 mb-1">
                                        <Building2 className="w-4 h-4 inline mr-1" />
                                        Nombre de la Empresa
                                    </label>
                                    <input
                                        type="text"
                                        value={settings.company_name}
                                        onChange={(e) => handleChange("company_name", e.target.value)}
                                        className="w-full border dark:border-keikichi-forest-600 rounded-lg px-3 py-2 bg-white dark:bg-keikichi-forest-700 text-keikichi-forest-800 dark:text-white focus:ring-2 focus:ring-keikichi-lime-500 focus:border-keikichi-lime-500"
                                        placeholder="Keikichi Logistics"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Dirección
                                    </label>
                                    <input
                                        type="text"
                                        value={settings.company_address}
                                        onChange={(e) => handleChange("company_address", e.target.value)}
                                        className="w-full border dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                                        placeholder="Calle, Número, Colonia, Ciudad, CP"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        <Phone className="w-4 h-4 inline mr-1" />
                                        Teléfono
                                    </label>
                                    <input
                                        type="tel"
                                        value={settings.company_phone}
                                        onChange={(e) => handleChange("company_phone", e.target.value)}
                                        className="w-full border dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                                        placeholder="+52 664 123 4567"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        WhatsApp (para notificaciones)
                                    </label>
                                    <input
                                        type="tel"
                                        value={settings.whatsapp_number}
                                        onChange={(e) => handleChange("whatsapp_number", e.target.value)}
                                        className="w-full border dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                                        placeholder="+52 664 123 4567"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        <Mail className="w-4 h-4 inline mr-1" />
                                        Email de Soporte
                                    </label>
                                    <input
                                        type="email"
                                        value={settings.company_email}
                                        onChange={(e) => handleChange("company_email", e.target.value)}
                                        className="w-full border dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                                        placeholder="soporte@keikichi.com"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        <Globe className="w-4 h-4 inline mr-1" />
                                        Sitio Web
                                    </label>
                                    <input
                                        type="text"
                                        value={settings.company_website}
                                        onChange={(e) => handleChange("company_website", e.target.value)}
                                        className="w-full border dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                                        placeholder="www.keikichi.com"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Documents Tab */}
                    {activeTab === "documents" && (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Pie de Página en PDFs
                                </label>
                                <input
                                    type="text"
                                    value={settings.pdf_footer_text}
                                    onChange={(e) => handleChange("pdf_footer_text", e.target.value)}
                                    className="w-full border dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                                    placeholder="Gracias por confiar en Keikichi Logistics"
                                />
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    Este texto aparece al final de todos los documentos PDF generados.
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Términos y Condiciones
                                </label>
                                <textarea
                                    value={settings.terms_and_conditions}
                                    onChange={(e) => handleChange("terms_and_conditions", e.target.value)}
                                    rows={8}
                                    className="w-full border dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:border-rose-500 font-mono text-sm"
                                    placeholder="Cada línea es un punto de los términos..."
                                />
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    Escribe cada condición en una línea nueva. Aparecen en los tickets de reservación.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Instructions Tab */}
                    {activeTab === "instructions" && (
                        <div className="space-y-6">
                            {/* Cash Payment Section */}
                            <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-900/30 rounded-xl p-5 transition-colors">
                                <h3 className="font-semibold text-emerald-800 dark:text-emerald-400 mb-4 flex items-center gap-2">
                                    💵 Pago en Efectivo
                                </h3>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-emerald-700 dark:text-emerald-300 mb-1">
                                            Información de Pago en Efectivo
                                        </label>
                                        <textarea
                                            value={settings.cash_payment_info}
                                            onChange={(e) => handleChange("cash_payment_info", e.target.value)}
                                            rows={3}
                                            className="w-full border border-emerald-300 dark:border-emerald-800 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                                            placeholder="El pago se realizará al entregar tu carga en bodega..."
                                        />
                                        <p className="text-xs text-emerald-600 dark:text-emerald-400/70 mt-1">
                                            Esta información aparece en el recuadro izquierdo del PDF para pagos en efectivo.
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-emerald-700 dark:text-emerald-300 mb-1">
                                            Instrucciones para Efectivo
                                        </label>
                                        <textarea
                                            value={settings.payment_instructions_cash}
                                            onChange={(e) => handleChange("payment_instructions_cash", e.target.value)}
                                            rows={4}
                                            className="w-full border border-emerald-300 dark:border-emerald-800 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono text-sm"
                                            placeholder="1. Presenta este resumen en bodega..."
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Bank Transfer Section */}
                            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/30 rounded-xl p-5 transition-colors">
                                <h3 className="font-semibold text-blue-800 dark:text-blue-400 mb-4 flex items-center gap-2">
                                    🏦 Transferencia Bancaria
                                </h3>

                                <div>
                                    <label className="block text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">
                                        Instrucciones para Transferencia
                                    </label>
                                    <textarea
                                        value={settings.payment_instructions_transfer}
                                        onChange={(e) => handleChange("payment_instructions_transfer", e.target.value)}
                                        rows={4}
                                        className="w-full border border-blue-300 dark:border-blue-800 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                                        placeholder="1. Transfiere el monto exacto indicado..."
                                    />
                                    <p className="text-xs text-blue-600 dark:text-blue-400/70 mt-1">
                                        Los datos bancarios se configuran en la sección de "Datos Bancarios" en Ajustes.
                                    </p>
                                </div>
                            </div>

                            {/* MercadoPago Section */}
                            <div className="bg-sky-50 dark:bg-sky-900/10 border border-sky-200 dark:border-sky-900/30 rounded-xl p-5 transition-colors">
                                <h3 className="font-semibold text-sky-800 dark:text-sky-400 mb-4 flex items-center gap-2">
                                    📱 MercadoPago
                                </h3>

                                <div>
                                    <label className="block text-sm font-medium text-sky-700 dark:text-sky-300 mb-1">
                                        Instrucciones para MercadoPago
                                    </label>
                                    <textarea
                                        value={settings.payment_instructions_mercadopago}
                                        onChange={(e) => handleChange("payment_instructions_mercadopago", e.target.value)}
                                        rows={4}
                                        className="w-full border border-sky-300 dark:border-sky-800 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 font-mono text-sm"
                                        placeholder="1. Haz clic en el botón de pago..."
                                    />
                                </div>
                            </div>

                            {/* Legacy Instructions (collapsed) */}
                            <details className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors">
                                <summary className="px-5 py-3 cursor-pointer text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200">
                                    ⚙️ Instrucciones Generales (legacy)
                                </summary>
                                <div className="px-5 pb-5">
                                    <textarea
                                        value={settings.payment_instructions}
                                        onChange={(e) => handleChange("payment_instructions", e.target.value)}
                                        rows={4}
                                        className="w-full border dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-500 focus:border-slate-500 font-mono text-sm"
                                        placeholder="Instrucciones generales..."
                                    />
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                        Estas instrucciones se usan como fallback si no hay instrucciones específicas.
                                    </p>
                                </div>
                            </details>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DocumentSettingsPage;

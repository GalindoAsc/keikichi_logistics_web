import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CreditCard, Save, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { fetchSystemConfig, updateSystemConfig } from "../../api/systemConfig";
import { authStore } from "../../stores/authStore";
import LoadingSpinner from "../../components/shared/LoadingSpinner";

interface BankDetails {
    beneficiary: string;
    bank: string;
    clabe: string;
    cardNumber: string;
    concept: string;
}

const initialDetails: BankDetails = {
    beneficiary: "",
    bank: "",
    clabe: "",
    cardNumber: "",
    concept: "",
};

const BankDetailsPage = () => {
    const navigate = useNavigate();
    const { user } = authStore();
    const isAdmin = user?.role === "superadmin" || user?.role === "manager";

    const [invoiceDetails, setInvoiceDetails] = useState<BankDetails>(initialDetails);
    const [noInvoiceDetails, setNoInvoiceDetails] = useState<BankDetails>(initialDetails);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const loadDetails = async () => {
            try {
                const [invoiceConfig, noInvoiceConfig] = await Promise.allSettled([
                    fetchSystemConfig("bank_details_invoice"),
                    fetchSystemConfig("bank_details_no_invoice"),
                ]);

                if (invoiceConfig.status === "fulfilled") {
                    try {
                        setInvoiceDetails(JSON.parse(invoiceConfig.value.value));
                    } catch {
                        // If not JSON, keep default or maybe map text to concept? 
                        // For now, let's just keep default to enforce new structure
                    }
                }
                if (noInvoiceConfig.status === "fulfilled") {
                    try {
                        setNoInvoiceDetails(JSON.parse(noInvoiceConfig.value.value));
                    } catch {
                        // Same here
                    }
                }
            } catch (error) {
                console.error("Error loading bank details", error);
            } finally {
                setLoading(false);
            }
        };
        loadDetails();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            await Promise.all([
                updateSystemConfig("bank_details_invoice", JSON.stringify(invoiceDetails)),
                updateSystemConfig("bank_details_no_invoice", JSON.stringify(noInvoiceDetails)),
            ]);
            toast.success("Datos bancarios actualizados correctamente");
        } catch (error) {
            toast.error("Error al guardar los datos bancarios");
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
        <div className="max-w-5xl mx-auto space-y-6">
            <button
                onClick={() => navigate("/admin/settings")}
                className="flex items-center text-slate-600 hover:text-slate-900 transition-colors"
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver a Ajustes
            </button>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-purple-50 rounded-lg">
                        <CreditCard className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Datos Bancarios</h1>
                        <p className="text-slate-500">Información para realizar transferencias bancarias.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <BankDetailsSection
                        title="Con Factura (Fiscal)"
                        details={invoiceDetails}
                        onChange={setInvoiceDetails}
                        isAdmin={isAdmin}
                    />
                    <BankDetailsSection
                        title="Sin Factura"
                        details={noInvoiceDetails}
                        onChange={setNoInvoiceDetails}
                        isAdmin={isAdmin}
                    />
                </div>

                {isAdmin && (
                    <div className="mt-8 flex justify-end border-t pt-6">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                            <Save className="w-4 h-4" />
                            {saving ? "Guardando..." : "Guardar Cambios"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const BankDetailsSection = ({
    title,
    details,
    onChange,
    isAdmin,
}: {
    title: string;
    details: BankDetails;
    onChange: (details: BankDetails) => void;
    isAdmin: boolean;
}) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        const text = `
Beneficiario: ${details.beneficiary}
Banco: ${details.bank}
CLABE: ${details.clabe}
Tarjeta: ${details.cardNumber}
Concepto: ${details.concept}
        `.trim();
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success("Datos copiados al portapapeles");
    };

    if (isAdmin) {
        return (
            <div className="space-y-4 bg-slate-50 p-6 rounded-xl border border-slate-200">
                <h3 className="font-semibold text-slate-900 text-lg border-b pb-2">{title}</h3>
                <div className="space-y-3">
                    <div>
                        <label className="text-sm font-medium text-slate-700">Nombre del Beneficiario</label>
                        <input
                            value={details.beneficiary}
                            onChange={(e) => onChange({ ...details, beneficiary: e.target.value })}
                            className="w-full border rounded-md px-3 py-2 mt-1"
                            placeholder="Ej. Keikichi Logistics SA de CV"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-700">Banco</label>
                        <input
                            value={details.bank}
                            onChange={(e) => onChange({ ...details, bank: e.target.value })}
                            className="w-full border rounded-md px-3 py-2 mt-1"
                            placeholder="Ej. BBVA"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-700">CLABE Interbancaria (18 dígitos)</label>
                        <input
                            value={details.clabe}
                            onChange={(e) => onChange({ ...details, clabe: e.target.value })}
                            className="w-full border rounded-md px-3 py-2 mt-1 font-mono"
                            placeholder="000000000000000000"
                            maxLength={18}
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-700">Tarjeta de Débito (16 dígitos) - Opcional</label>
                        <input
                            value={details.cardNumber}
                            onChange={(e) => onChange({ ...details, cardNumber: e.target.value })}
                            className="w-full border rounded-md px-3 py-2 mt-1 font-mono"
                            placeholder="0000000000000000"
                            maxLength={16}
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-700">Concepto de Pago</label>
                        <input
                            value={details.concept}
                            onChange={(e) => onChange({ ...details, concept: e.target.value })}
                            className="w-full border rounded-md px-3 py-2 mt-1"
                            placeholder="Ej. Renta, Servicios"
                        />
                        <p className="text-xs text-slate-500 mt-1">Visible para el SAT. Usar descripción breve y clara.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between border-b pb-2">
                <h3 className="font-semibold text-slate-900 text-lg">{title}</h3>
                <button
                    onClick={handleCopy}
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium"
                >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? "Copiado" : "Copiar todo"}
                </button>
            </div>
            <div className="space-y-4 text-sm">
                <div>
                    <span className="block text-slate-500 text-xs uppercase tracking-wider font-semibold">Beneficiario</span>
                    <p className="font-medium text-slate-900 text-base">{details.beneficiary || "-"}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <span className="block text-slate-500 text-xs uppercase tracking-wider font-semibold">Banco</span>
                        <p className="font-medium text-slate-900">{details.bank || "-"}</p>
                    </div>
                    <div>
                        <span className="block text-slate-500 text-xs uppercase tracking-wider font-semibold">Concepto</span>
                        <p className="font-medium text-slate-900">{details.concept || "-"}</p>
                    </div>
                </div>
                <div>
                    <span className="block text-slate-500 text-xs uppercase tracking-wider font-semibold">CLABE</span>
                    <div className="flex items-center gap-2">
                        <p className="font-mono text-slate-900 text-lg tracking-wide">{details.clabe || "-"}</p>
                        {details.clabe && (
                            <button
                                onClick={() => { navigator.clipboard.writeText(details.clabe); toast.success("CLABE copiada"); }}
                                className="text-slate-400 hover:text-blue-600"
                                title="Copiar CLABE"
                            >
                                <Copy className="w-3 h-3" />
                            </button>
                        )}
                    </div>
                </div>
                {details.cardNumber && (
                    <div>
                        <span className="block text-slate-500 text-xs uppercase tracking-wider font-semibold">Tarjeta</span>
                        <div className="flex items-center gap-2">
                            <p className="font-mono text-slate-900 text-lg tracking-wide">{details.cardNumber}</p>
                            <button
                                onClick={() => { navigator.clipboard.writeText(details.cardNumber); toast.success("Tarjeta copiada"); }}
                                className="text-slate-400 hover:text-blue-600"
                                title="Copiar Tarjeta"
                            >
                                <Copy className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BankDetailsPage;

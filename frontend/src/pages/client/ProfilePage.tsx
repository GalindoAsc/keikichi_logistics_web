import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { User, Lock, Save, FileText, CreditCard, Copy, Check, ArrowRight } from "lucide-react";
import api from "../../api/client";
import { authStore } from "../../stores/authStore";
import { fetchSystemConfig } from "../../api/systemConfig";
import { useState, useEffect } from "react";

interface ProfileForm {
    full_name: string;
    phone: string;
}

interface PasswordForm {
    old_password: string;
    new_password: string;
    confirm_password: string;
}

interface BankDetails {
    beneficiary: string;
    bank: string;
    clabe: string;
    cardNumber: string;
    concept: string;
}

const initialBankDetails: BankDetails = {
    beneficiary: "",
    bank: "",
    clabe: "",
    cardNumber: "",
    concept: "",
};

export default function ProfilePage() {
    const navigate = useNavigate();
    const { user, setUser } = authStore();

    const [invoiceDetails, setInvoiceDetails] = useState<BankDetails>(initialBankDetails);
    const [noInvoiceDetails, setNoInvoiceDetails] = useState<BankDetails>(initialBankDetails);
    const [loadingBankDetails, setLoadingBankDetails] = useState(true);

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
                    } catch { }
                }
                if (noInvoiceConfig.status === "fulfilled") {
                    try {
                        setNoInvoiceDetails(JSON.parse(noInvoiceConfig.value.value));
                    } catch { }
                }
            } catch (error) {
                console.error("Error loading bank details", error);
            } finally {
                setLoadingBankDetails(false);
            }
        };
        loadDetails();
    }, []);

    const { register: registerProfile, handleSubmit: handleProfileSubmit, formState: { errors: profileErrors, isSubmitting: isProfileSubmitting } } = useForm<ProfileForm>({
        defaultValues: {
            full_name: user?.full_name || "",
            phone: user?.phone || ""
        }
    });

    const { register: registerPassword, handleSubmit: handlePasswordSubmit, reset: resetPassword, formState: { errors: passwordErrors, isSubmitting: isPasswordSubmitting } } = useForm<PasswordForm>();

    const updateProfileMutation = useMutation({
        mutationFn: async (data: ProfileForm) => {
            const res = await api.patch("/users/me", data);
            return res.data;
        },
        onSuccess: (updatedUser) => {
            toast.success("Perfil actualizado");
            setUser(updatedUser);
        },
        onError: () => {
            toast.error("Error al actualizar perfil");
        }
    });

    const changePasswordMutation = useMutation({
        mutationFn: async (data: PasswordForm) => {
            await api.post("/users/me/password", {
                old_password: data.old_password,
                new_password: data.new_password
            });
        },
        onSuccess: () => {
            toast.success("Contraseña actualizada");
            resetPassword();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.detail || "Error al cambiar contraseña");
        }
    });

    const onProfileSubmit = (data: ProfileForm) => {
        updateProfileMutation.mutate(data);
    };

    const onPasswordSubmit = (data: PasswordForm) => {
        if (data.new_password !== data.confirm_password) {
            toast.error("Las contraseñas no coinciden");
            return;
        }
        changePasswordMutation.mutate(data);
    };

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-bold text-keikichi-forest-800 dark:text-white mb-8">Mi Perfil</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Profile Details */}
                {/* Profile Details */}
                <div className="bg-white dark:bg-keikichi-forest-800 p-6 rounded-xl border border-slate-200 dark:border-keikichi-forest-600 shadow-sm transition-colors">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-indigo-600 dark:text-indigo-400">
                            <User className="w-6 h-6" />
                        </div>
                        <h2 className="text-lg font-semibold text-keikichi-forest-800 dark:text-white">Datos Personales</h2>
                    </div>

                    <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-keikichi-lime-200 mb-1">Nombre Completo</label>
                            <input
                                {...registerProfile("full_name", { required: "El nombre es requerido" })}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-keikichi-forest-600 bg-white dark:bg-keikichi-forest-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                            />
                            {profileErrors.full_name && <p className="text-red-500 text-xs mt-1">{profileErrors.full_name.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-keikichi-lime-200 mb-1">Teléfono</label>
                            <input
                                {...registerProfile("phone")}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-keikichi-forest-600 bg-white dark:bg-keikichi-forest-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-keikichi-lime-200 mb-1">Email</label>
                            <input
                                value={user?.email}
                                disabled
                                className="w-full px-3 py-2 border border-slate-200 dark:border-keikichi-forest-600 bg-slate-50 dark:bg-keikichi-forest-700/50 text-slate-500 dark:text-slate-400 rounded-lg cursor-not-allowed"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isProfileSubmitting}
                            className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" />
                            {isProfileSubmitting ? "Guardando..." : "Guardar Cambios"}
                        </button>
                    </form>
                </div>

                {/* Password Change */}
                {/* Password Change */}
                <div className="bg-white dark:bg-keikichi-forest-800 p-6 rounded-xl border border-slate-200 dark:border-keikichi-forest-600 shadow-sm transition-colors">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-indigo-600 dark:text-indigo-400">
                            <Lock className="w-6 h-6" />
                        </div>
                        <h2 className="text-lg font-semibold text-keikichi-forest-800 dark:text-white">Cambiar Contraseña</h2>
                    </div>

                    <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-keikichi-lime-200 mb-1">Contraseña Actual</label>
                            <input
                                type="password"
                                {...registerPassword("old_password", { required: "Requerido" })}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-keikichi-forest-600 bg-white dark:bg-keikichi-forest-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                            />
                            {passwordErrors.old_password && <p className="text-red-500 text-xs mt-1">{passwordErrors.old_password.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-keikichi-lime-200 mb-1">Nueva Contraseña</label>
                            <input
                                type="password"
                                {...registerPassword("new_password", {
                                    required: "Requerido",
                                    minLength: { value: 6, message: "Mínimo 6 caracteres" }
                                })}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-keikichi-forest-600 bg-white dark:bg-keikichi-forest-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                            />
                            {passwordErrors.new_password && <p className="text-red-500 text-xs mt-1">{passwordErrors.new_password.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-keikichi-lime-200 mb-1">Confirmar Contraseña</label>
                            <input
                                type="password"
                                {...registerPassword("confirm_password", { required: "Requerido" })}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-keikichi-forest-600 bg-white dark:bg-keikichi-forest-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isPasswordSubmitting}
                            className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-slate-900 dark:bg-keikichi-lime-600 text-white rounded-lg hover:bg-slate-800 dark:hover:bg-keikichi-lime-700 transition-colors disabled:opacity-50"
                        >
                            <Lock className="w-4 h-4" />
                            {isPasswordSubmitting ? "Actualizando..." : "Actualizar Contraseña"}
                        </button>
                    </form>
                </div>
            </div>

            {/* My Files Section */}
            {/* My Files Section */}
            <div className="mt-8 bg-white dark:bg-keikichi-forest-800 p-6 rounded-xl border border-slate-200 dark:border-keikichi-forest-600 shadow-sm transition-colors">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                            <FileText className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-keikichi-forest-800 dark:text-white">Mis Archivos</h2>
                            <p className="text-sm text-keikichi-forest-500 dark:text-keikichi-lime-300">Gestiona tus documentos (INE, Constancia, Contratos)</p>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate("/my-files")}
                        className="flex items-center gap-2 text-keikichi-forest-600 dark:text-keikichi-lime-400 hover:text-keikichi-forest-800 dark:hover:text-keikichi-lime-300 font-medium"
                    >
                        Ver todos
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
                <div className="bg-slate-50 dark:bg-keikichi-forest-900/30 rounded-lg p-6 border border-dashed border-slate-300 dark:border-keikichi-forest-600 text-center">
                    <p className="text-slate-600 dark:text-keikichi-lime-200 mb-4">Accede a todos tus documentos cargados y contratos firmados.</p>
                    <button
                        onClick={() => navigate("/my-files")}
                        className="px-4 py-2 bg-white dark:bg-keikichi-forest-800 border border-slate-300 dark:border-keikichi-forest-600 rounded-lg text-slate-700 dark:text-keikichi-lime-200 font-medium hover:bg-slate-50 dark:hover:bg-keikichi-forest-700 transition-colors shadow-sm"
                    >
                        Gestionar Documentos
                    </button>
                </div>
            </div>

            {/* Bank Details Section */}
            {/* Bank Details Section */}
            <div className="mt-8 bg-white dark:bg-keikichi-forest-800 p-6 rounded-xl border border-slate-200 dark:border-keikichi-forest-600 shadow-sm transition-colors">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-purple-600 dark:text-purple-400">
                        <CreditCard className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-keikichi-forest-800 dark:text-white">Datos Bancarios</h2>
                        <p className="text-sm text-keikichi-forest-500 dark:text-keikichi-lime-300">Información para realizar pagos</p>
                    </div>
                </div>

                {loadingBankDetails ? (
                    <div className="text-center py-8 text-slate-500 dark:text-keikichi-lime-400">Cargando datos bancarios...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <BankDetailsView title="Con Factura (Fiscal)" details={invoiceDetails} />
                        <BankDetailsView title="Sin Factura" details={noInvoiceDetails} />
                    </div>
                )}
            </div>
        </div>
    );
}

const BankDetailsView = ({ title, details }: { title: string; details: BankDetails }) => {
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
        toast.success("Datos copiados");
    };

    return (
        <div className="space-y-4 bg-slate-50 dark:bg-keikichi-forest-900/30 p-6 rounded-xl border border-slate-200 dark:border-keikichi-forest-600 transition-colors">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-keikichi-forest-600 pb-3">
                <h3 className="font-semibold text-keikichi-forest-800 dark:text-white">{title}</h3>
                <button
                    onClick={handleCopy}
                    className="text-xs flex items-center gap-1 text-keikichi-forest-600 dark:text-keikichi-lime-400 hover:text-keikichi-forest-800 dark:hover:text-keikichi-lime-300 font-medium"
                >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copied ? "Copiado" : "Copiar"}
                </button>
            </div>
            <div className="space-y-3 text-sm">
                <div>
                    <span className="block text-xs font-semibold text-slate-500 dark:text-keikichi-lime-400 uppercase tracking-wider">Beneficiario</span>
                    <p className="font-medium text-slate-900 dark:text-white">{details.beneficiary || "-"}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <span className="block text-xs font-semibold text-slate-500 dark:text-keikichi-lime-400 uppercase tracking-wider">Banco</span>
                        <p className="font-medium text-slate-900 dark:text-white">{details.bank || "-"}</p>
                    </div>
                    <div>
                        <span className="block text-xs font-semibold text-slate-500 dark:text-keikichi-lime-400 uppercase tracking-wider">Concepto</span>
                        <p className="font-medium text-slate-900 dark:text-white">{details.concept || "-"}</p>
                    </div>
                </div>
                <div>
                    <span className="block text-xs font-semibold text-slate-500 dark:text-keikichi-lime-400 uppercase tracking-wider">CLABE</span>
                    <div className="flex items-center gap-2">
                        <p className="font-mono text-slate-900 dark:text-white tracking-wide">{details.clabe || "-"}</p>
                        {details.clabe && (
                            <button
                                onClick={() => { navigator.clipboard.writeText(details.clabe); toast.success("CLABE copiada"); }}
                                className="text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400"
                            >
                                <Copy className="w-3 h-3" />
                            </button>
                        )}
                    </div>
                </div>
                {details.cardNumber && (
                    <div>
                        <span className="block text-xs font-semibold text-slate-500 dark:text-keikichi-lime-400 uppercase tracking-wider">Tarjeta</span>
                        <div className="flex items-center gap-2">
                            <p className="font-mono text-slate-900 dark:text-white tracking-wide">{details.cardNumber}</p>
                            <button
                                onClick={() => { navigator.clipboard.writeText(details.cardNumber); toast.success("Tarjeta copiada"); }}
                                className="text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400"
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

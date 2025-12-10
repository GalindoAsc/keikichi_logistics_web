import { Link } from "react-router-dom";
import { Tag, Settings, DollarSign, CreditCard, Users, Truck, FileText, Bell } from "lucide-react";
import { authStore } from "../../stores/authStore";

const SettingsPage = () => {
    const { user } = authStore();
    const isAdmin = user?.role === "superadmin" || user?.role === "manager";

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center gap-2 mb-6">
                <Settings className="w-6 h-6 text-slate-700 dark:text-slate-300" />
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Ajustes del Sistema</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Admin Only Settings */}
                {isAdmin && (
                    <>
                        {/* Ajustes Generales */}
                        <Link
                            to="/admin/general-settings"
                            className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow group"
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg group-hover:bg-slate-100 dark:group-hover:bg-slate-700 transition-colors">
                                    <Settings className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-900 dark:text-white">Ajustes Generales</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Negocio y notificaciones</p>
                                </div>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                Configura la información del negocio, contacto y preferencias de notificación.
                            </p>
                        </Link>

                        {/* Cuentas */}
                        <Link
                            to="/admin/accounts"
                            className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow group"
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/40 transition-colors">
                                    <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-900 dark:text-white">Cuentas</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Gestión de usuarios</p>
                                </div>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                Administra usuarios, verifica cuentas, activa/desactiva acceso y elimina cuentas.
                            </p>
                        </Link>

                        {/* Datos Bancarios (Admin View) */}
                        <Link
                            to="/admin/bank-details"
                            className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow group"
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg group-hover:bg-purple-100 dark:group-hover:bg-purple-900/40 transition-colors">
                                    <CreditCard className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-900 dark:text-white">Datos Bancarios</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Información para transferencias</p>
                                </div>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                Administra la información bancaria para pagos con y sin factura.
                            </p>
                        </Link>

                        {/* Gestión de Vehículos */}
                        <Link
                            to="/admin/fleet-settings"
                            className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow group"
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg group-hover:bg-orange-100 dark:group-hover:bg-orange-900/40 transition-colors">
                                    <Truck className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-900 dark:text-white">Gestión de Vehículos</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Conductores y unidades</p>
                                </div>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                Administra tus conductores, camiones y remolques.
                            </p>
                        </Link>

                        {/* Notificaciones */}
                        <Link
                            to="/admin/notifications"
                            className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow group"
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/40 transition-colors">
                                    <Bell className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-900 dark:text-white">Notificaciones</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Historial y alertas</p>
                                </div>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                Revisa el historial completo de notificaciones y alertas del sistema.
                            </p>
                        </Link>

                        {/* Precios de Etiquetas */}
                        <Link
                            to="/admin/label-prices"
                            className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow group"
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 transition-colors">
                                    <Tag className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-900 dark:text-white">Precios de Etiquetas</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Configurar costos y medidas</p>
                                </div>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                Administra el catálogo de precios para el servicio de etiquetado de mercancía.
                            </p>
                        </Link>

                        {/* Configuración de Documentos */}
                        <Link
                            to="/admin/document-settings"
                            className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow group"
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 bg-rose-50 dark:bg-rose-900/20 rounded-lg group-hover:bg-rose-100 dark:group-hover:bg-rose-900/40 transition-colors">
                                    <FileText className="w-6 h-6 text-rose-600 dark:text-rose-400" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-900 dark:text-white">Documentos y PDFs</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Tickets, resúmenes y términos</p>
                                </div>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                Configura la información de empresa, términos y condiciones para PDFs.
                            </p>
                        </Link>

                        {/* Productos y Unidades */}
                        <Link
                            to="/admin/products"
                            className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow group"
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg group-hover:bg-orange-100 dark:group-hover:bg-orange-900/40 transition-colors">
                                    <Tag className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-900 dark:text-white">Productos y Unidades</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Catálogo de mercancía</p>
                                </div>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                Administra la lista de productos permitidos, sus traducciones y unidades de medida.
                            </p>
                        </Link>

                        {/* Tipo de Cambio */}
                        <Link
                            to="/admin/exchange-rate"
                            className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow group"
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg group-hover:bg-green-100 dark:group-hover:bg-green-900/40 transition-colors">
                                    <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-900 dark:text-white">Tipo de Cambio</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Valor diario del dólar</p>
                                </div>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                Actualiza el tipo de cambio utilizado para conversiones y nuevos viajes.
                            </p>
                        </Link>
                    </>
                )}

                {/* My Profile Card (All Users) */}
                <Link
                    to="/profile"
                    className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow group"
                >
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg group-hover:bg-cyan-100 dark:group-hover:bg-cyan-900/40 transition-colors">
                            <Users className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-slate-900 dark:text-white">Mi Perfil</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Datos personales y seguridad</p>
                        </div>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        Administra tu información personal, contraseña y expediente digital.
                    </p>
                </Link>

                {/* Bank Details Card (Non-Admin Users) */}
                {!isAdmin && (
                    <Link
                        to="/admin/bank-details"
                        className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow group"
                    >
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg group-hover:bg-purple-100 dark:group-hover:bg-purple-900/40 transition-colors">
                                <CreditCard className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-900 dark:text-white">Datos Bancarios</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Información para transferencias</p>
                            </div>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            Consulta los datos bancarios para realizar pagos por transferencia.
                        </p>
                    </Link>
                )}
            </div>
        </div>
    );
};

export default SettingsPage;

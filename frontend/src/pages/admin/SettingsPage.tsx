import { Link } from "react-router-dom";
import { Tag, Settings, DollarSign, CreditCard, Users, Truck, FileText, Bell, MapPin } from "lucide-react";
import { authStore } from "../../stores/authStore";
import { useTranslation } from "react-i18next";

const SettingsPage = () => {
    const { user } = authStore();
    const isAdmin = user?.role === "superadmin" || user?.role === "manager";
    const { t } = useTranslation();

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center gap-2 mb-6">
                <Settings className="w-6 h-6 text-keikichi-forest-700 dark:text-keikichi-lime-300" />
                <h1 className="text-2xl font-bold text-keikichi-forest-800 dark:text-white">{t('settings.title')}</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Admin Only Settings */}
                {isAdmin && (
                    <>
                        {/* Ajustes Generales */}
                        <Link
                            to="/admin/general-settings"
                            className="bg-white dark:bg-keikichi-forest-800 border border-keikichi-lime-100 dark:border-keikichi-forest-600 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow group"
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 bg-keikichi-forest-50 dark:bg-keikichi-forest-700 rounded-lg group-hover:bg-keikichi-forest-100 dark:group-hover:bg-keikichi-forest-600 transition-colors">
                                    <Settings className="w-6 h-6 text-keikichi-forest-600 dark:text-keikichi-lime-400" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-keikichi-forest-800 dark:text-white">{t('settings.general')}</h3>
                                    <p className="text-sm text-keikichi-forest-500 dark:text-keikichi-lime-300">{t('settings.generalDesc')}</p>
                                </div>
                            </div>
                        </Link>

                        {/* Cuentas */}
                        <Link
                            to="/admin/accounts"
                            className="bg-white dark:bg-keikichi-forest-800 border border-keikichi-lime-100 dark:border-keikichi-forest-600 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow group"
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 bg-keikichi-lime-50 dark:bg-keikichi-lime-900/20 rounded-lg group-hover:bg-keikichi-lime-100 dark:group-hover:bg-keikichi-lime-900/40 transition-colors">
                                    <Users className="w-6 h-6 text-keikichi-lime-600 dark:text-keikichi-lime-400" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-keikichi-forest-800 dark:text-white">{t('settings.accounts')}</h3>
                                    <p className="text-sm text-keikichi-forest-500 dark:text-keikichi-lime-300">{t('settings.accountsDesc')}</p>
                                </div>
                            </div>
                        </Link>

                        {/* Datos Bancarios (Admin View) */}
                        <Link
                            to="/admin/bank-details"
                            className="bg-white dark:bg-keikichi-forest-800 border border-keikichi-lime-100 dark:border-keikichi-forest-600 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow group"
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 bg-keikichi-yellow-50 dark:bg-keikichi-yellow-900/20 rounded-lg group-hover:bg-keikichi-yellow-100 dark:group-hover:bg-keikichi-yellow-900/40 transition-colors">
                                    <CreditCard className="w-6 h-6 text-keikichi-yellow-600 dark:text-keikichi-yellow-400" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-keikichi-forest-800 dark:text-white">{t('settings.bankDetails')}</h3>
                                    <p className="text-sm text-keikichi-forest-500 dark:text-keikichi-lime-300">{t('settings.bankDetailsDesc')}</p>
                                </div>
                            </div>
                        </Link>

                        {/* Gestión de Vehículos */}
                        <Link
                            to="/admin/fleet-settings"
                            className="bg-white dark:bg-keikichi-forest-800 border border-keikichi-lime-100 dark:border-keikichi-forest-600 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow group"
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 bg-keikichi-forest-50 dark:bg-keikichi-forest-700 rounded-lg group-hover:bg-keikichi-forest-100 dark:group-hover:bg-keikichi-forest-600 transition-colors">
                                    <Truck className="w-6 h-6 text-keikichi-forest-600 dark:text-keikichi-lime-400" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-keikichi-forest-800 dark:text-white">{t('settings.fleet')}</h3>
                                    <p className="text-sm text-keikichi-forest-500 dark:text-keikichi-lime-300">{t('settings.fleetDesc')}</p>
                                </div>
                            </div>
                        </Link>

                        {/* Notificaciones */}
                        <Link
                            to="/admin/notifications"
                            className="bg-white dark:bg-keikichi-forest-800 border border-keikichi-lime-100 dark:border-keikichi-forest-600 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow group"
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 bg-keikichi-lime-50 dark:bg-keikichi-lime-900/20 rounded-lg group-hover:bg-keikichi-lime-100 dark:group-hover:bg-keikichi-lime-900/40 transition-colors">
                                    <Bell className="w-6 h-6 text-keikichi-lime-600 dark:text-keikichi-lime-400" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-keikichi-forest-800 dark:text-white">{t('settings.notifications')}</h3>
                                    <p className="text-sm text-keikichi-forest-500 dark:text-keikichi-lime-300">{t('settings.notificationsDesc')}</p>
                                </div>
                            </div>
                        </Link>

                        {/* Precios de Etiquetas */}
                        <Link
                            to="/admin/label-prices"
                            className="bg-white dark:bg-keikichi-forest-800 border border-keikichi-lime-100 dark:border-keikichi-forest-600 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow group"
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 bg-keikichi-yellow-50 dark:bg-keikichi-yellow-900/20 rounded-lg group-hover:bg-keikichi-yellow-100 dark:group-hover:bg-keikichi-yellow-900/40 transition-colors">
                                    <Tag className="w-6 h-6 text-keikichi-yellow-600 dark:text-keikichi-yellow-400" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-keikichi-forest-800 dark:text-white">{t('settings.labelPrices')}</h3>
                                    <p className="text-sm text-keikichi-forest-500 dark:text-keikichi-lime-300">{t('settings.labelPricesDesc')}</p>
                                </div>
                            </div>
                        </Link>

                        {/* Paradas / Tiradas */}
                        <Link
                            to="/admin/stops"
                            className="bg-white dark:bg-keikichi-forest-800 border border-keikichi-lime-100 dark:border-keikichi-forest-600 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow group"
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 transition-colors">
                                    <MapPin className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-keikichi-forest-800 dark:text-white">{t('settings.stops')}</h3>
                                    <p className="text-sm text-keikichi-forest-500 dark:text-keikichi-lime-300">{t('settings.stopsDesc')}</p>
                                </div>
                            </div>
                        </Link>

                        {/* Configuración de Documentos */}
                        <Link
                            to="/admin/document-settings"
                            className="bg-white dark:bg-keikichi-forest-800 border border-keikichi-lime-100 dark:border-keikichi-forest-600 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow group"
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 bg-rose-50 dark:bg-rose-900/20 rounded-lg group-hover:bg-rose-100 dark:group-hover:bg-rose-900/40 transition-colors">
                                    <FileText className="w-6 h-6 text-rose-600 dark:text-rose-400" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-keikichi-forest-800 dark:text-white">{t('settings.documents')}</h3>
                                    <p className="text-sm text-keikichi-forest-500 dark:text-keikichi-lime-300">{t('settings.documentsDesc')}</p>
                                </div>
                            </div>
                        </Link>

                        {/* Productos y Unidades */}
                        <Link
                            to="/admin/products"
                            className="bg-white dark:bg-keikichi-forest-800 border border-keikichi-lime-100 dark:border-keikichi-forest-600 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow group"
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 bg-keikichi-lime-50 dark:bg-keikichi-lime-900/20 rounded-lg group-hover:bg-keikichi-lime-100 dark:group-hover:bg-keikichi-lime-900/40 transition-colors">
                                    <Tag className="w-6 h-6 text-keikichi-lime-600 dark:text-keikichi-lime-400" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-keikichi-forest-800 dark:text-white">{t('settings.products')}</h3>
                                    <p className="text-sm text-keikichi-forest-500 dark:text-keikichi-lime-300">{t('settings.productsDesc')}</p>
                                </div>
                            </div>
                        </Link>

                        {/* Tipo de Cambio */}
                        <Link
                            to="/admin/exchange-rate"
                            className="bg-white dark:bg-keikichi-forest-800 border border-keikichi-lime-100 dark:border-keikichi-forest-600 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow group"
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 bg-keikichi-lime-50 dark:bg-keikichi-lime-900/20 rounded-lg group-hover:bg-keikichi-lime-100 dark:group-hover:bg-keikichi-lime-900/40 transition-colors">
                                    <DollarSign className="w-6 h-6 text-keikichi-lime-600 dark:text-keikichi-lime-400" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-keikichi-forest-800 dark:text-white">{t('settings.exchangeRate')}</h3>
                                    <p className="text-sm text-keikichi-forest-500 dark:text-keikichi-lime-300">{t('settings.exchangeRateDesc')}</p>
                                </div>
                            </div>
                        </Link>
                    </>
                )}

                {/* My Profile Card (All Users) */}
                <Link
                    to="/profile"
                    className="bg-white dark:bg-keikichi-forest-800 border border-keikichi-lime-100 dark:border-keikichi-forest-600 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow group"
                >
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-keikichi-forest-50 dark:bg-keikichi-forest-700 rounded-lg group-hover:bg-keikichi-forest-100 dark:group-hover:bg-keikichi-forest-600 transition-colors">
                            <Users className="w-6 h-6 text-keikichi-forest-600 dark:text-keikichi-lime-400" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-keikichi-forest-800 dark:text-white">{t('profile.title')}</h3>
                            <p className="text-sm text-keikichi-forest-500 dark:text-keikichi-lime-300">{t('profile.updateProfile')}</p>
                        </div>
                    </div>
                </Link>

                {/* Bank Details Card (Non-Admin Users) */}
                {!isAdmin && (
                    <Link
                        to="/admin/bank-details"
                        className="bg-white dark:bg-keikichi-forest-800 border border-keikichi-lime-100 dark:border-keikichi-forest-600 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow group"
                    >
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-keikichi-yellow-50 dark:bg-keikichi-yellow-900/20 rounded-lg group-hover:bg-keikichi-yellow-100 dark:group-hover:bg-keikichi-yellow-900/40 transition-colors">
                                <CreditCard className="w-6 h-6 text-keikichi-yellow-600 dark:text-keikichi-yellow-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-keikichi-forest-800 dark:text-white">{t('settings.bankDetails')}</h3>
                                <p className="text-sm text-keikichi-forest-500 dark:text-keikichi-lime-300">{t('settings.bankDetailsDesc')}</p>
                            </div>
                        </div>
                    </Link>
                )}
            </div>
        </div>
    );
};

export default SettingsPage;

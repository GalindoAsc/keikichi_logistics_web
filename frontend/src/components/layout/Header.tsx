import { Link, useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { LogOut, LayoutDashboard, CalendarDays, Map, Settings, List, Menu, X, QrCode, Sun, Moon, Globe, DollarSign, Truck } from "lucide-react";
import { authStore } from "../../stores/authStore";
import NotificationBell from "./NotificationBell";
import { useState, useEffect } from "react";
import { useSocketStore } from "../../stores/socketStore";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useThemeStore } from "../../stores/themeStore";
import { useTranslation } from "react-i18next";

const Header = () => {
  const { user, logout } = authStore();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, setTheme } = useThemeStore();
  const { t, i18n } = useTranslation();

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'es' ? 'en' : 'es';
    i18n.changeLanguage(newLang);
  };

  const handleLogout = () => {
    logout();
    navigate("/auth/login");
    setMobileMenuOpen(false);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  // WebSocket Notification Listener (Global)
  const { subscribe, unsubscribe } = useSocketStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleNotification = (data: any) => {
      if (data.type === "NOTIFICATION") {
        const { title } = data.payload;
        toast.info(`${t('notifications.newNotification')}: ${title}`);
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
        queryClient.invalidateQueries({ queryKey: ["me"] });
      }
    };

    subscribe("NOTIFICATION", handleNotification);
    return () => {
      unsubscribe("NOTIFICATION", handleNotification);
    };
  }, [subscribe, unsubscribe, queryClient, t]);

  const isAdmin = user?.role === 'superadmin' || user?.role === 'manager';

  return (
    <header className="bg-white/80 dark:bg-keikichi-forest-700/90 backdrop-blur-md border-b border-keikichi-lime-200/50 dark:border-keikichi-forest-600 sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center gap-3">
            {/* Mobile Menu Button - Always visible */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-keikichi-forest-600 dark:text-keikichi-lime-300 hover:bg-keikichi-lime-50 dark:hover:bg-keikichi-forest-600 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>

            <Link to={isAdmin ? "/admin/dashboard" : "/"} className="flex items-center gap-2">
              <img src="/keikichi_logo.png" alt="Keikichi Logistics" className="h-10 sm:h-12 w-auto object-contain" />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {isAdmin ? (
              <>
                <Link to="/admin/dashboard" className="text-keikichi-forest-600 dark:text-keikichi-lime-200 hover:text-keikichi-lime-600 dark:hover:text-keikichi-lime-400 font-medium flex items-center gap-2 transition-colors">
                  <LayoutDashboard className="w-4 h-4" />
                  {t('nav.dashboard')}
                </Link>
                <Link to="/admin/reservations" className="text-keikichi-forest-600 dark:text-keikichi-lime-200 hover:text-keikichi-lime-600 dark:hover:text-keikichi-lime-400 font-medium flex items-center gap-2 transition-colors">
                  <CalendarDays className="w-4 h-4" />
                  {t('nav.reservations')}
                </Link>
                <Link to="/admin/trips" className="text-keikichi-forest-600 dark:text-keikichi-lime-200 hover:text-keikichi-lime-600 dark:hover:text-keikichi-lime-400 font-medium flex items-center gap-2 transition-colors">
                  <Map className="w-4 h-4" />
                  {t('nav.trips')}
                </Link>
                <Link to="/admin/quotes" className="text-keikichi-forest-600 dark:text-keikichi-lime-200 hover:text-keikichi-lime-600 dark:hover:text-keikichi-lime-400 font-medium flex items-center gap-2 transition-colors">
                  <DollarSign className="w-4 h-4" />
                  {t('nav.quotes')}
                </Link>
                <Link to="/admin/scanner" className="text-keikichi-forest-600 dark:text-keikichi-lime-200 hover:text-keikichi-lime-600 dark:hover:text-keikichi-lime-400 font-medium flex items-center gap-2 transition-colors">
                  <QrCode className="w-4 h-4" />
                  {t('nav.qrScanner')}
                </Link>
                <Link to="/admin/settings" className="text-keikichi-forest-600 dark:text-keikichi-lime-200 hover:text-keikichi-lime-600 dark:hover:text-keikichi-lime-400 font-medium flex items-center gap-2 transition-colors">
                  <Settings className="w-4 h-4" />
                  {t('nav.settings')}
                </Link>
              </>
            ) : user ? (
              <>
                <Link to="/" className="text-keikichi-forest-600 dark:text-keikichi-lime-200 hover:text-keikichi-lime-600 dark:hover:text-keikichi-lime-400 font-medium flex items-center gap-2 transition-colors">
                  <Map className="w-4 h-4" />
                  {t('nav.reserve')}
                </Link>
                <Link to="/request-trip" className="text-keikichi-forest-600 dark:text-keikichi-lime-200 hover:text-keikichi-lime-600 dark:hover:text-keikichi-lime-400 font-medium flex items-center gap-2 transition-colors">
                  <Truck className="w-4 h-4" />
                  {t('nav.requestTrip')}
                </Link>
                <Link to="/my-quotes" className="text-keikichi-forest-600 dark:text-keikichi-lime-200 hover:text-keikichi-lime-600 dark:hover:text-keikichi-lime-400 font-medium flex items-center gap-2 transition-colors">
                  <DollarSign className="w-4 h-4" />
                  {t('nav.myQuotes')}
                </Link>
                <Link to="/reservations" className="text-keikichi-forest-600 dark:text-keikichi-lime-200 hover:text-keikichi-lime-600 dark:hover:text-keikichi-lime-400 font-medium flex items-center gap-2 transition-colors">
                  <List className="w-4 h-4" />
                  {t('nav.myReservations')}
                </Link>
                <Link to="/profile" className="text-keikichi-forest-600 dark:text-keikichi-lime-200 hover:text-keikichi-lime-600 dark:hover:text-keikichi-lime-400 font-medium flex items-center gap-2 transition-colors">
                  <Settings className="w-4 h-4" />
                  {t('nav.profile')}
                </Link>
              </>
            ) : (
              <Link to="/" className="text-keikichi-forest-600 dark:text-keikichi-lime-200 hover:text-keikichi-lime-600 dark:hover:text-keikichi-lime-400 font-medium flex items-center gap-2 transition-colors">
                <Map className="w-4 h-4" />
                {t('nav.viewTrips')}
              </Link>
            )}
          </nav>

          {/* User Menu (Desktop) */}
          <div className="hidden md:flex items-center gap-3">
            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-keikichi-forest-500 dark:text-keikichi-lime-300 hover:bg-keikichi-lime-50 dark:hover:bg-keikichi-forest-600 rounded-lg transition-colors border border-keikichi-lime-200 dark:border-keikichi-forest-500"
              aria-label="Toggle language"
            >
              <Globe className="w-4 h-4" />
              <span className="text-xs font-bold uppercase">{i18n.language}</span>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 text-keikichi-forest-500 dark:text-keikichi-lime-300 hover:bg-keikichi-lime-50 dark:hover:bg-keikichi-forest-600 rounded-lg transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>

            {user ? (
              <div className="flex items-center gap-4">
                <NotificationBell />
                <div className="flex items-center gap-3 pl-4 border-l border-keikichi-lime-200 dark:border-keikichi-forest-500">
                  <div className="text-right hidden lg:block">
                    <p className="text-sm font-medium text-keikichi-forest-800 dark:text-white">
                      {user.full_name}
                    </p>
                    <p className="text-xs text-keikichi-forest-500 dark:text-keikichi-lime-300 capitalize">
                      {user.role}
                    </p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-keikichi-forest-500 dark:text-keikichi-lime-300 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title={t('nav.logout')}
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link
                  to="/auth/login"
                  className="text-keikichi-forest-600 dark:text-keikichi-lime-200 hover:text-keikichi-lime-600 dark:hover:text-keikichi-lime-400 font-medium transition-colors"
                >
                  {t('nav.login')}
                </Link>
                <Link
                  to="/auth/register"
                  className="bg-keikichi-lime-500 text-white px-4 py-2 rounded-lg hover:bg-keikichi-lime-600 transition-colors font-medium shadow-sm"
                >
                  {t('nav.register')}
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Notification Bell & User Info */}
          <div className="flex md:hidden items-center gap-2">
            {/* Language Toggle Mobile */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1 px-2 py-1.5 text-keikichi-forest-500 dark:text-keikichi-lime-300 hover:bg-keikichi-lime-50 dark:hover:bg-keikichi-forest-600 rounded-lg transition-colors border border-keikichi-lime-200 dark:border-keikichi-forest-500"
            >
              <Globe className="w-4 h-4" />
              <span className="text-xs font-bold uppercase">{i18n.language}</span>
            </button>
            <button
              onClick={toggleTheme}
              className="p-2 text-keikichi-forest-500 dark:text-keikichi-lime-300 hover:bg-keikichi-lime-50 dark:hover:bg-keikichi-forest-600 rounded-lg transition-colors"
            >
              {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
            {user && <NotificationBell />}
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay - Moved to Portal to avoid stacking context issues */}
      {mobileMenuOpen && createPortal(
        <div className="relative z-[9999]">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 transition-opacity"
            onClick={closeMobileMenu}
            aria-hidden="true"
          />

          {/* Slide-out Drawer */}
          <div
            className="fixed inset-y-0 left-0 w-72 bg-white dark:bg-keikichi-forest-800 shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col h-full"
            role="dialog"
            aria-modal="true"
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-keikichi-lime-100 dark:border-keikichi-forest-600 bg-keikichi-lime-50/50 dark:bg-keikichi-forest-900 flex-shrink-0">
              <img src="/keikichi_logo.png" alt="Keikichi" className="h-8" />
              <button
                onClick={closeMobileMenu}
                className="p-2 rounded-lg hover:bg-keikichi-lime-100 dark:hover:bg-keikichi-forest-700 transition-colors"
                aria-label={t('common.close')}
              >
                <X className="w-5 h-5 text-keikichi-forest-600 dark:text-keikichi-lime-300" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-4 py-6">
              <div className="space-y-1">
                {/* User Info */}
                {user && (
                  <div className="pb-4 mb-4 border-b border-keikichi-lime-100 dark:border-keikichi-forest-600">
                    <p className="text-sm font-medium text-keikichi-forest-800 dark:text-white truncate">
                      {user.full_name}
                    </p>
                    <p className="text-xs text-keikichi-forest-500 dark:text-keikichi-lime-300 capitalize mt-1">
                      {user.role}
                    </p>
                  </div>
                )}

                {/* Navigation Links */}
                {isAdmin ? (
                  <>
                    <Link
                      to="/admin/dashboard"
                      className="flex items-center gap-3 px-4 py-3 text-keikichi-forest-700 dark:text-keikichi-lime-200 hover:bg-keikichi-lime-50 dark:hover:bg-keikichi-forest-700 hover:text-keikichi-lime-600 dark:hover:text-keikichi-lime-400 rounded-lg transition-colors"
                      onClick={closeMobileMenu}
                    >
                      <LayoutDashboard className="w-5 h-5 flex-shrink-0" />
                      <span className="font-medium">{t('nav.dashboard')}</span>
                    </Link>
                    <Link
                      to="/admin/reservations"
                      className="flex items-center gap-3 px-4 py-3 text-keikichi-forest-700 dark:text-keikichi-lime-200 hover:bg-keikichi-lime-50 dark:hover:bg-keikichi-forest-700 hover:text-keikichi-lime-600 dark:hover:text-keikichi-lime-400 rounded-lg transition-colors"
                      onClick={closeMobileMenu}
                    >
                      <CalendarDays className="w-5 h-5 flex-shrink-0" />
                      <span className="font-medium">{t('nav.reservations')}</span>
                    </Link>
                    <Link
                      to="/admin/trips"
                      className="flex items-center gap-3 px-4 py-3 text-keikichi-forest-700 dark:text-keikichi-lime-200 hover:bg-keikichi-lime-50 dark:hover:bg-keikichi-forest-700 hover:text-keikichi-lime-600 dark:hover:text-keikichi-lime-400 rounded-lg transition-colors"
                      onClick={closeMobileMenu}
                    >
                      <Map className="w-5 h-5 flex-shrink-0" />
                      <span className="font-medium">{t('nav.trips')}</span>
                    </Link>
                    <Link
                      to="/admin/scanner"
                      className="flex items-center gap-3 px-4 py-3 text-keikichi-forest-700 dark:text-keikichi-lime-200 hover:bg-keikichi-lime-50 dark:hover:bg-keikichi-forest-700 hover:text-keikichi-lime-600 dark:hover:text-keikichi-lime-400 rounded-lg transition-colors"
                      onClick={closeMobileMenu}
                    >
                      <QrCode className="w-5 h-5 flex-shrink-0" />
                      <span className="font-medium">{t('nav.qrScanner')}</span>
                    </Link>
                    <Link
                      to="/admin/settings"
                      className="flex items-center gap-3 px-4 py-3 text-keikichi-forest-700 dark:text-keikichi-lime-200 hover:bg-keikichi-lime-50 dark:hover:bg-keikichi-forest-700 hover:text-keikichi-lime-600 dark:hover:text-keikichi-lime-400 rounded-lg transition-colors"
                      onClick={closeMobileMenu}
                    >
                      <Settings className="w-5 h-5 flex-shrink-0" />
                      <span className="font-medium">{t('nav.settings')}</span>
                    </Link>
                  </>
                ) : user ? (
                  <>
                    <Link
                      to="/"
                      className="flex items-center gap-3 px-4 py-3 text-keikichi-forest-700 dark:text-keikichi-lime-200 hover:bg-keikichi-lime-50 dark:hover:bg-keikichi-forest-700 hover:text-keikichi-lime-600 dark:hover:text-keikichi-lime-400 rounded-lg transition-colors"
                      onClick={closeMobileMenu}
                    >
                      <Map className="w-5 h-5 flex-shrink-0" />
                      <span className="font-medium">{t('nav.reserve')}</span>
                    </Link>
                    <Link
                      to="/reservations"
                      className="flex items-center gap-3 px-4 py-3 text-keikichi-forest-700 dark:text-keikichi-lime-200 hover:bg-keikichi-lime-50 dark:hover:bg-keikichi-forest-700 hover:text-keikichi-lime-600 dark:hover:text-keikichi-lime-400 rounded-lg transition-colors"
                      onClick={closeMobileMenu}
                    >
                      <List className="w-5 h-5 flex-shrink-0" />
                      <span className="font-medium">{t('nav.myReservations')}</span>
                    </Link>
                    <Link
                      to="/profile"
                      className="flex items-center gap-3 px-4 py-3 text-keikichi-forest-700 dark:text-keikichi-lime-200 hover:bg-keikichi-lime-50 dark:hover:bg-keikichi-forest-700 hover:text-keikichi-lime-600 dark:hover:text-keikichi-lime-400 rounded-lg transition-colors"
                      onClick={closeMobileMenu}
                    >
                      <Settings className="w-5 h-5 flex-shrink-0" />
                      <span className="font-medium">{t('nav.profile')}</span>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      to="/"
                      className="flex items-center gap-3 px-4 py-3 text-keikichi-forest-700 dark:text-keikichi-lime-200 hover:bg-keikichi-lime-50 dark:hover:bg-keikichi-forest-700 hover:text-keikichi-lime-600 dark:hover:text-keikichi-lime-400 rounded-lg transition-colors"
                      onClick={closeMobileMenu}
                    >
                      <Map className="w-5 h-5 flex-shrink-0" />
                      <span className="font-medium">{t('nav.viewTrips')}</span>
                    </Link>
                    <div className="border-t border-keikichi-lime-100 dark:border-keikichi-forest-600 my-2 pt-2">
                      <Link
                        to="/auth/login"
                        className="flex items-center gap-3 px-4 py-3 text-keikichi-forest-700 dark:text-keikichi-lime-200 hover:bg-keikichi-lime-50 dark:hover:bg-keikichi-forest-700 hover:text-keikichi-lime-600 dark:hover:text-keikichi-lime-400 rounded-lg transition-colors"
                        onClick={closeMobileMenu}
                      >
                        <span className="font-medium">{t('nav.login')}</span>
                      </Link>
                      <Link
                        to="/auth/register"
                        className="flex items-center gap-3 px-4 py-3 text-keikichi-lime-600 hover:bg-keikichi-lime-50 dark:hover:bg-keikichi-forest-700 rounded-lg transition-colors"
                        onClick={closeMobileMenu}
                      >
                        <span className="font-medium">{t('nav.register')}</span>
                      </Link>
                    </div>
                  </>
                )}

                {/* Logout Button */}
                {user && (
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors w-full mt-6"
                  >
                    <LogOut className="w-5 h-5 flex-shrink-0" />
                    <span className="font-medium">{t('nav.logout')}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </header>
  );
};

export default Header;

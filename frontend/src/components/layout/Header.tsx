import { Link, useNavigate } from "react-router-dom";
import { LogOut, LayoutDashboard, CalendarDays, Map, Settings, List, Menu, X, QrCode } from "lucide-react";
import { authStore } from "../../stores/authStore";
import NotificationBell from "./NotificationBell";
import { useState, useEffect } from "react";
import { useSocketStore } from "../../stores/socketStore";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const Header = () => {
  const { user, logout } = authStore();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
        toast.info(`Nueva notificación: ${title}`);
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
        queryClient.invalidateQueries({ queryKey: ["me"] });
      }
    };

    subscribe("NOTIFICATION", handleNotification);
    return () => {
      unsubscribe("NOTIFICATION", handleNotification);
    };
  }, [subscribe, unsubscribe, queryClient]);

  const isAdmin = user?.role === 'superadmin' || user?.role === 'manager';

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/50 sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center gap-3">
            {/* Mobile Menu Button - Always visible */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>

            <Link to={isAdmin ? "/admin/dashboard" : "/"} className="flex items-center gap-2">
              <img src="/keikichi_logo.jpg" alt="Keikichi Logistics" className="h-10 sm:h-12 w-auto object-contain" />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {isAdmin ? (
              <>
                <Link to="/admin/dashboard" className="text-slate-600 hover:text-indigo-600 font-medium flex items-center gap-2">
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>
                <Link to="/admin/reservations" className="text-slate-600 hover:text-indigo-600 font-medium flex items-center gap-2">
                  <CalendarDays className="w-4 h-4" />
                  Reservaciones
                </Link>
                <Link to="/admin/trips" className="text-slate-600 hover:text-indigo-600 font-medium flex items-center gap-2">
                  <Map className="w-4 h-4" />
                  Viajes
                </Link>
                <Link to="/admin/scanner" className="text-slate-600 hover:text-indigo-600 font-medium flex items-center gap-2">
                  <QrCode className="w-4 h-4" />
                  Escáner QR
                </Link>
                <Link to="/admin/settings" className="text-slate-600 hover:text-indigo-600 font-medium flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Ajustes
                </Link>
              </>
            ) : user ? (
              <>
                <Link to="/" className="text-slate-600 hover:text-indigo-600 font-medium flex items-center gap-2">
                  <Map className="w-4 h-4" />
                  Reservar
                </Link>
                <Link to="/reservations" className="text-slate-600 hover:text-indigo-600 font-medium flex items-center gap-2">
                  <List className="w-4 h-4" />
                  Mis Reservaciones
                </Link>
                <Link to="/profile" className="text-slate-600 hover:text-indigo-600 font-medium flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Mi Perfil
                </Link>
              </>
            ) : (
              <Link to="/" className="text-slate-600 hover:text-indigo-600 font-medium flex items-center gap-2">
                <Map className="w-4 h-4" />
                Ver Viajes
              </Link>
            )}
          </nav>

          {/* User Menu (Desktop) */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <NotificationBell />
                <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                  <div className="text-right hidden lg:block">
                    <p className="text-sm font-medium text-slate-900">
                      {user.full_name}
                    </p>
                    <p className="text-xs text-slate-500 capitalize">
                      {user.role}
                    </p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Cerrar Sesión"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link
                  to="/auth/login"
                  className="text-slate-600 hover:text-indigo-600 font-medium"
                >
                  Iniciar Sesión
                </Link>
                <Link
                  to="/auth/register"
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                >
                  Registrarse
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Notification Bell & User Info */}
          {user && (
            <div className="flex md:hidden items-center gap-2">
              <NotificationBell />
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop - higher than header z-50 */}
          <div
            className="fixed inset-0 bg-black/50 z-[90] md:hidden"
            onClick={closeMobileMenu}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
          />

          {/* Slide-out Drawer from Left - highest z-index */}
          <div
            className="fixed top-0 left-0 w-72 h-full bg-white z-[100] md:hidden overflow-y-auto shadow-2xl"
            style={{ position: 'fixed', top: 0, left: 0, width: '288px', height: '100vh', zIndex: 100 }}
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-slate-200 bg-slate-50">
              <img src="/keikichi_logo.jpg" alt="Keikichi" className="h-8" />
              <button onClick={closeMobileMenu} className="p-2 rounded-lg hover:bg-slate-200">
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>
            <div className="px-4 py-6 space-y-1">
              {/* User Info */}
              {user && (
                <div className="pb-4 mb-4 border-b border-slate-200">
                  <p className="text-sm font-medium text-slate-900">
                    {user.full_name}
                  </p>
                  <p className="text-xs text-slate-500 capitalize mt-1">
                    {user.role}
                  </p>
                </div>
              )}

              {/* Navigation Links */}
              {isAdmin ? (
                <>
                  <Link
                    to="/admin/dashboard"
                    className="flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors"
                    onClick={closeMobileMenu}
                  >
                    <LayoutDashboard className="w-5 h-5" />
                    <span className="font-medium">Dashboard</span>
                  </Link>
                  <Link
                    to="/admin/reservations"
                    className="flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors"
                    onClick={closeMobileMenu}
                  >
                    <CalendarDays className="w-5 h-5" />
                    <span className="font-medium">Reservaciones</span>
                  </Link>
                  <Link
                    to="/admin/trips"
                    className="flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors"
                    onClick={closeMobileMenu}
                  >
                    <Map className="w-5 h-5" />
                    <span className="font-medium">Viajes</span>
                  </Link>
                  <Link
                    to="/admin/scanner"
                    className="flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors"
                    onClick={closeMobileMenu}
                  >
                    <QrCode className="w-5 h-5" />
                    <span className="font-medium">Escáner QR</span>
                  </Link>
                  <Link
                    to="/admin/settings"
                    className="flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors"
                    onClick={closeMobileMenu}
                  >
                    <Settings className="w-5 h-5" />
                    <span className="font-medium">Ajustes</span>
                  </Link>
                </>
              ) : user ? (
                <>
                  <Link
                    to="/"
                    className="flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors"
                    onClick={closeMobileMenu}
                  >
                    <Map className="w-5 h-5" />
                    <span className="font-medium">Reservar</span>
                  </Link>
                  <Link
                    to="/reservations"
                    className="flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors"
                    onClick={closeMobileMenu}
                  >
                    <List className="w-5 h-5" />
                    <span className="font-medium">Mis Reservaciones</span>
                  </Link>
                  <Link
                    to="/profile"
                    className="flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors"
                    onClick={closeMobileMenu}
                  >
                    <Settings className="w-5 h-5" />
                    <span className="font-medium">Mi Perfil</span>
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/"
                    className="flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors"
                    onClick={closeMobileMenu}
                  >
                    <Map className="w-5 h-5" />
                    <span className="font-medium">Ver Viajes</span>
                  </Link>
                  <div className="border-t border-slate-200 my-2 pt-2">
                    <Link
                      to="/auth/login"
                      className="flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors"
                      onClick={closeMobileMenu}
                    >
                      <span className="font-medium">Iniciar Sesión</span>
                    </Link>
                    <Link
                      to="/auth/register"
                      className="flex items-center gap-3 px-4 py-3 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      onClick={closeMobileMenu}
                    >
                      <span className="font-medium">Registrarse</span>
                    </Link>
                  </div>
                </>
              )}

              {/* Logout Button */}
              {user && (
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors w-full mt-6"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Cerrar Sesión</span>
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </header>
  );
};

export default Header;

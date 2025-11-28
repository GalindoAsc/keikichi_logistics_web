import { Link } from "react-router-dom";
import { authStore } from "../../stores/authStore";

const Header = () => {
  const { user, logout } = authStore();

  return (
    <header className="bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-xl font-semibold text-indigo-700">
          Keikichi Logistics
        </Link>
        <div className="flex items-center gap-3 text-sm text-slate-600">
          {user ? (
            <>
              <span>Hola, {user.full_name}</span>
              <button className="text-indigo-700 font-medium" onClick={logout}>
                Cerrar sesión
              </button>
            </>
          ) : (
            <Link to="/auth/login" className="text-indigo-700 font-medium">
              Iniciar sesión
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;

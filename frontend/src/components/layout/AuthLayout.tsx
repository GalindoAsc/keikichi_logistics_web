import { Outlet, Link } from "react-router-dom";

const AuthLayout = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-slate-950 dark:to-slate-900 px-4 transition-colors">
    <div className="w-full max-w-md bg-white dark:bg-slate-900 shadow-lg rounded-xl p-8 space-y-6 transition-colors">
      <div className="text-center space-y-2">
        <Link to="/" className="text-2xl font-bold text-indigo-700 dark:text-indigo-400">
          Keikichi Logistics
        </Link>
        <p className="text-sm text-slate-500 dark:text-slate-400">Accede para gestionar viajes y reservaciones.</p>
      </div>
      <Outlet />
    </div>
  </div>
);

export default AuthLayout;

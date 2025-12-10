import { Outlet, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const AuthLayout = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-keikichi-lime-50 via-white to-keikichi-yellow-50 dark:from-keikichi-forest-900 dark:via-keikichi-forest-800 dark:to-keikichi-forest-900 px-4 transition-colors">
      <div className="w-full max-w-md bg-white dark:bg-keikichi-forest-800 shadow-lg rounded-xl p-8 space-y-6 transition-colors border border-keikichi-lime-100 dark:border-keikichi-forest-600">
        <div className="text-center space-y-2">
          <Link to="/" className="inline-block">
            <img src="/keikichi_logo.png" alt="Keikichi Logistics" className="h-16 mx-auto" />
          </Link>
          <p className="text-sm text-keikichi-forest-500 dark:text-keikichi-lime-300">{t('auth.accessMessage')}</p>
        </div>
        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;

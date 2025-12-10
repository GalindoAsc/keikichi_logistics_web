import LoginForm from "../../components/auth/LoginForm";
import { useTranslation } from "react-i18next";

const LoginPage = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-keikichi-forest-800 dark:text-white text-center">{t('auth.loginTitle')}</h2>
      <LoginForm />
    </div>
  );
};

export default LoginPage;

import RegisterForm from "../../components/auth/RegisterForm";
import { useTranslation } from "react-i18next";

const RegisterPage = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-keikichi-forest-800 dark:text-white text-center">{t('auth.registerTitle')}</h2>
      <RegisterForm />
    </div>
  );
};

export default RegisterPage;

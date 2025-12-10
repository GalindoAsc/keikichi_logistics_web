import { useState } from "react";
import { useForm } from "react-hook-form";
import { useLogin } from "../../hooks/useAuth";
import { LoginRequest } from "../../types/auth";
import { authStore } from "../../stores/authStore";
import LoadingSpinner from "../shared/LoadingSpinner";
import { Link, useNavigate } from "react-router-dom";
import { Phone, Mail } from "lucide-react";
import { CountryCodeSelector } from "./CountryCodeSelector";
import { EmailInput } from "./EmailInput";
import { useTranslation } from "react-i18next";

const LoginForm = () => {
  const { mutateAsync, isPending, isError } = useLogin();
  const { register, handleSubmit } = useForm<LoginRequest>();
  const [method, setMethod] = useState<'email' | 'phone'>('phone');
  const [countryCode, setCountryCode] = useState('+52');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const { t } = useTranslation();

  const navigate = useNavigate();

  const onSubmit = async (data: LoginRequest) => {
    const payload: LoginRequest = {
      email: method === 'email' ? email : `${countryCode}${phone}`,
      password: data.password
    };

    await mutateAsync(payload);
    const user = authStore.getState().user;
    if (user?.role === "superadmin" || user?.role === "manager") {
      navigate("/admin/dashboard");
    } else {
      navigate("/");
    }
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>

      {/* Method Toggle */}
      <div className="grid grid-cols-2 gap-2 p-1 bg-keikichi-lime-50 dark:bg-keikichi-forest-700 rounded-lg">
        <button
          type="button"
          onClick={() => setMethod('phone')}
          className={`flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${method === 'phone'
            ? 'bg-white dark:bg-keikichi-forest-600 text-keikichi-lime-600 dark:text-keikichi-lime-400 shadow-sm'
            : 'text-keikichi-forest-500 dark:text-keikichi-lime-300 hover:text-keikichi-forest-700 dark:hover:text-keikichi-lime-200'
            }`}
        >
          <Phone className="w-4 h-4" />
          {t('auth.phone')}
        </button>
        <button
          type="button"
          onClick={() => setMethod('email')}
          className={`flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${method === 'email'
            ? 'bg-white dark:bg-keikichi-forest-600 text-keikichi-lime-600 dark:text-keikichi-lime-400 shadow-sm'
            : 'text-keikichi-forest-500 dark:text-keikichi-lime-300 hover:text-keikichi-forest-700 dark:hover:text-keikichi-lime-200'
            }`}
        >
          <Mail className="w-4 h-4" />
          {t('auth.email')}
        </button>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-keikichi-forest-700 dark:text-keikichi-lime-200">
          {method === 'phone' ? t('auth.phoneNumber') : t('auth.email')}
        </label>

        {method === 'phone' ? (
          <div className="flex gap-2">
            <CountryCodeSelector
              value={countryCode}
              onChange={setCountryCode}
            />
            <input
              type="tel"
              placeholder="1234567890"
              maxLength={10}
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
              className="flex-1 w-full px-3 py-2.5 border border-keikichi-lime-200 dark:border-keikichi-forest-500 dark:bg-keikichi-forest-700 dark:text-white rounded-lg focus:ring-2 focus:ring-keikichi-lime-500 focus:border-keikichi-lime-500 outline-none transition-all"
              required
            />
          </div>
        ) : (
          <EmailInput
            value={email}
            onChange={setEmail}
            required
          />
        )}
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-keikichi-forest-700 dark:text-keikichi-lime-200">{t('auth.password')}</label>
        <input
          className="w-full px-3 py-2.5 border border-keikichi-lime-200 dark:border-keikichi-forest-500 dark:bg-keikichi-forest-700 dark:text-white rounded-lg focus:ring-2 focus:ring-keikichi-lime-500 focus:border-keikichi-lime-500 outline-none transition-all"
          type="password"
          {...register("password", { required: true })}
        />
      </div>

      {isError && <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-100 dark:border-red-800">{t('auth.loginError')}</p>}

      <button
        type="submit"
        className="w-full bg-keikichi-lime-500 text-white rounded-lg py-2.5 font-medium hover:bg-keikichi-lime-600 transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
        disabled={isPending || (method === 'phone' && phone.length < 10) || (method === 'email' && !email)}
      >
        {isPending ? <LoadingSpinner size="sm" /> : t('auth.login')}
      </button>

      <div className="text-center text-sm text-keikichi-forest-500 dark:text-keikichi-lime-300">
        {t('auth.noAccount')} <Link to="/auth/register" className="text-keikichi-lime-600 dark:text-keikichi-lime-400 font-medium hover:underline">{t('auth.register')}</Link>
      </div>
    </form>
  );
};

export default LoginForm;

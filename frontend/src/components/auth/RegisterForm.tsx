import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useRegister } from "../../hooks/useAuth";
import { RegisterRequest } from "../../types/auth";
import LoadingSpinner from "../shared/LoadingSpinner";
import { Link, useNavigate } from "react-router-dom";
import { CountryCodeSelector } from "./CountryCodeSelector";
import { EmailInput } from "./EmailInput";
import { Phone, Mail } from "lucide-react";
import { useTranslation } from "react-i18next";

const RegisterForm = () => {
  const { mutateAsync, isPending, isError, isSuccess } = useRegister();
  const [method, setMethod] = useState<'email' | 'phone'>('phone');
  const [countryCode, setCountryCode] = useState('+52');
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => {
        navigate("/auth/login");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, navigate]);

  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterRequest>();

  const onSubmit = async (data: RegisterRequest) => {
    const payload: RegisterRequest = {
      full_name: data.full_name,
      password: data.password,
    };

    if (method === 'email') {
      payload.email = email;
    } else {
      payload.phone = `${countryCode}${phone}`;
    }

    await mutateAsync(payload);
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

      {/* Contact Input */}
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
        <label className="text-sm font-medium text-keikichi-forest-700 dark:text-keikichi-lime-200">{t('auth.fullName')}</label>
        <input
          className="w-full px-3 py-2.5 border border-keikichi-lime-200 dark:border-keikichi-forest-500 dark:bg-keikichi-forest-700 dark:text-white rounded-lg focus:ring-2 focus:ring-keikichi-lime-500 focus:border-keikichi-lime-500 outline-none transition-all"
          {...register("full_name", { required: t('validation.required') })}
        />
        {errors.full_name && <p className="text-xs text-red-500">{errors.full_name.message}</p>}
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-keikichi-forest-700 dark:text-keikichi-lime-200">{t('auth.password')}</label>
        <input
          className="w-full px-3 py-2.5 border border-keikichi-lime-200 dark:border-keikichi-forest-500 dark:bg-keikichi-forest-700 dark:text-white rounded-lg focus:ring-2 focus:ring-keikichi-lime-500 focus:border-keikichi-lime-500 outline-none transition-all"
          type="password"
          {...register("password", { required: t('validation.required'), minLength: { value: 6, message: t('validation.passwordMinLength') } })}
        />
        {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
      </div>

      {isError && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg border border-red-100 dark:border-red-800">
          {t('auth.registerError')}
        </div>
      )}

      {isSuccess && (
        <div className="p-3 bg-keikichi-lime-50 dark:bg-keikichi-lime-900/20 text-keikichi-lime-700 dark:text-keikichi-lime-400 text-sm rounded-lg border border-keikichi-lime-100 dark:border-keikichi-lime-800">
          {t('common.success')}! {t('common.loading')}
        </div>
      )}

      <button
        type="submit"
        className="w-full bg-keikichi-lime-500 text-white rounded-lg py-2.5 font-medium hover:bg-keikichi-lime-600 transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
        disabled={isPending || (method === 'phone' && phone.length < 10) || (method === 'email' && !email)}
      >
        {isPending ? <LoadingSpinner size="sm" /> : t('auth.register')}
      </button>

      <div className="text-center text-sm text-keikichi-forest-500 dark:text-keikichi-lime-300">
        {t('auth.hasAccount')} <Link to="/auth/login" className="text-keikichi-lime-600 dark:text-keikichi-lime-400 font-medium hover:underline">{t('auth.login')}</Link>
      </div>
    </form>
  );
};

export default RegisterForm;

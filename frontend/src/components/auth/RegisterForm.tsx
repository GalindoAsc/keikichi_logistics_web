import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRegister } from "../../hooks/useAuth";
import { RegisterRequest } from "../../types/auth";
import LoadingSpinner from "../shared/LoadingSpinner";
import { Link } from "react-router-dom";
import { CountryCodeSelector } from "./CountryCodeSelector";
import { EmailInput } from "./EmailInput";
import { Phone, Mail } from "lucide-react";

const RegisterForm = () => {
  const { mutateAsync, isPending, isError, isSuccess } = useRegister();
  const [method, setMethod] = useState<'email' | 'phone'>('phone');
  const [countryCode, setCountryCode] = useState('+52');

  // We manage these manually to handle the complex validation/formatting
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
      <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg">
        <button
          type="button"
          onClick={() => setMethod('phone')}
          className={`flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${method === 'phone'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
            }`}
        >
          <Phone className="w-4 h-4" />
          Teléfono
        </button>
        <button
          type="button"
          onClick={() => setMethod('email')}
          className={`flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${method === 'email'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
            }`}
        >
          <Mail className="w-4 h-4" />
          Correo
        </button>
      </div>

      {/* Contact Input */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700">
          {method === 'phone' ? 'Número de celular' : 'Correo electrónico'}
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
              className="flex-1 w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
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
        <label className="text-sm font-medium text-slate-700">Nombre completo</label>
        <input
          className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
          {...register("full_name", { required: "El nombre es requerido" })}
        />
        {errors.full_name && <p className="text-xs text-red-500">{errors.full_name.message}</p>}
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700">Contraseña</label>
        <input
          className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
          type="password"
          {...register("password", { required: "La contraseña es requerida", minLength: { value: 6, message: "Mínimo 6 caracteres" } })}
        />
        {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
      </div>

      {isError && (
        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
          No se pudo registrar. Verifica tus datos o intenta con otro método.
        </div>
      )}

      {isSuccess && (
        <div className="p-3 bg-green-50 text-green-600 text-sm rounded-lg border border-green-100">
          ¡Cuenta creada! Redirigiendo...
        </div>
      )}

      <button
        type="submit"
        className="w-full bg-blue-600 text-white rounded-lg py-2.5 font-medium hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
        disabled={isPending || (method === 'phone' && phone.length < 10) || (method === 'email' && !email)}
      >
        {isPending ? <LoadingSpinner size="sm" /> : "Crear cuenta"}
      </button>

      <div className="text-center text-sm text-slate-500">
        ¿Ya tienes cuenta? <Link to="/auth/login" className="text-blue-600 font-medium hover:underline">Inicia sesión</Link>
      </div>

      <p className="text-xs text-center text-slate-400 mt-4">
        Al registrarte aceptas nuestros términos y condiciones.
        <br />
        Necesitarás verificar tu identidad después del registro.
      </p>
    </form>
  );
};

export default RegisterForm;

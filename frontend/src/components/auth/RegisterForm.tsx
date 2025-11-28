import { useForm } from "react-hook-form";
import { useRegister } from "../../hooks/useAuth";
import { RegisterRequest } from "../../types/auth";
import LoadingSpinner from "../shared/LoadingSpinner";
import { Link } from "react-router-dom";

const RegisterForm = () => {
  const { mutateAsync, isPending, error, isSuccess } = useRegister();
  const { register, handleSubmit } = useForm<RegisterRequest>();

  const onSubmit = async (data: RegisterRequest) => {
    await mutateAsync(data);
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-1">
        <label className="text-sm text-slate-600">Nombre completo</label>
        <input className="w-full border rounded px-3 py-2" {...register("full_name", { required: true })} />
      </div>
      <div className="space-y-1">
        <label className="text-sm text-slate-600">Correo</label>
        <input className="w-full border rounded px-3 py-2" type="email" {...register("email", { required: true })} />
      </div>
      <div className="space-y-1">
        <label className="text-sm text-slate-600">Teléfono</label>
        <input className="w-full border rounded px-3 py-2" {...register("phone")} />
      </div>
      <div className="space-y-1">
        <label className="text-sm text-slate-600">Contraseña</label>
        <input className="w-full border rounded px-3 py-2" type="password" {...register("password", { required: true })} />
      </div>
      {error && <p className="text-sm text-red-600">No se pudo registrar.</p>}
      {isSuccess && <p className="text-sm text-green-600">Cuenta creada. Pendiente de aprobación.</p>}
      <button
        type="submit"
        className="w-full bg-indigo-600 text-white rounded py-2 font-medium hover:bg-indigo-700 transition"
        disabled={isPending}
      >
        {isPending ? <LoadingSpinner size="sm" /> : "Crear cuenta"}
      </button>
      <div className="text-center text-sm text-slate-500">
        ¿Ya tienes cuenta? <Link to="/auth/login" className="text-indigo-600 font-medium">Inicia sesión</Link>
      </div>
    </form>
  );
};

export default RegisterForm;

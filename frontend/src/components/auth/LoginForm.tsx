import { useForm } from "react-hook-form";
import { useLogin } from "../../hooks/useAuth";
import { LoginRequest } from "../../types/auth";
import LoadingSpinner from "../shared/LoadingSpinner";
import { Link } from "react-router-dom";

const LoginForm = () => {
  const { mutateAsync, isPending, error } = useLogin();
  const { register, handleSubmit } = useForm<LoginRequest>();

  const onSubmit = async (data: LoginRequest) => {
    await mutateAsync(data);
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-1">
        <label className="text-sm text-slate-600">Correo</label>
        <input className="w-full border rounded px-3 py-2" type="email" {...register("email", { required: true })} />
      </div>
      <div className="space-y-1">
        <label className="text-sm text-slate-600">Contraseña</label>
        <input className="w-full border rounded px-3 py-2" type="password" {...register("password", { required: true })} />
      </div>
      {error && <p className="text-sm text-red-600">No se pudo iniciar sesión.</p>}
      <button
        type="submit"
        className="w-full bg-indigo-600 text-white rounded py-2 font-medium hover:bg-indigo-700 transition"
        disabled={isPending}
      >
        {isPending ? <LoadingSpinner size="sm" /> : "Iniciar sesión"}
      </button>
      <div className="text-center text-sm text-slate-500">
        ¿No tienes cuenta? <Link to="/auth/register" className="text-indigo-600 font-medium">Regístrate</Link>
      </div>
    </form>
  );
};

export default LoginForm;

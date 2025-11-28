import { useForm } from "react-hook-form";

const ForgotPasswordForm = () => {
  const { register, handleSubmit, reset } = useForm<{ email: string }>();

  const onSubmit = (data: { email: string }) => {
    reset();
    alert(`Solicitud enviada a ${data.email}`);
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-1">
        <label className="text-sm text-slate-600">Correo</label>
        <input className="w-full border rounded px-3 py-2" type="email" {...register("email", { required: true })} />
      </div>
      <button type="submit" className="w-full bg-indigo-600 text-white rounded py-2 font-medium hover:bg-indigo-700 transition">
        Enviar instrucciones
      </button>
    </form>
  );
};

export default ForgotPasswordForm;

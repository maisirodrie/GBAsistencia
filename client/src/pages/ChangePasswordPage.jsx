import { useForm } from "react-hook-form";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Save, AlertCircle } from "lucide-react";

const ChangePasswordPage = () => {
    const { register, handleSubmit, watch, formState: { errors } } = useForm();
    const { changePassword, user, logout } = useAuth();
    const [success, setSuccess] = useState(false);
    const [serverError, setServerError] = useState(null);
    const navigate = useNavigate();

    const onSubmit = handleSubmit(async (data) => {
        try {
            await changePassword({
                oldPassword: data.oldPassword,
                newPassword: data.newPassword
            });
            setSuccess(true);
            setTimeout(() => {
                logout(); // Deslogueamos para que vuelva a entrar con la nueva clave
                navigate("/login");
            }, 3000);
        } catch (error) {
            setServerError(error.response?.data?.message || "Error al cambiar la contraseña");
        }
    });

    return (
        <div className="flex h-[calc(100vh-100px)] items-center justify-center">
            <div className="bg-slate-800 max-w-md w-full p-10 rounded-2xl shadow-2xl border border-slate-700">
                <div className="flex flex-col items-center mb-8">
                    <div className="bg-amber-500 p-4 rounded-full mb-4 shadow-lg shadow-amber-500/20">
                        <Lock size={32} className="text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2 text-center">Actualizar Seguridad</h1>
                    {user?.mustChangePassword && (
                        <p className="text-amber-400 text-sm font-medium text-center bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                            Por seguridad, debes cambiar tu contraseña provisoria antes de continuar.
                        </p>
                    )}
                </div>

                {success ? (
                    <div className="bg-emerald-500/10 border border-emerald-500 text-emerald-500 p-6 rounded-xl text-center">
                        <Save className="mx-auto mb-4" size={48} />
                        <h2 className="font-bold text-lg mb-2">¡Contraseña Cambiada!</h2>
                        <p className="text-sm">Redirigiendo al inicio de sesión...</p>
                    </div>
                ) : (
                    <form onSubmit={onSubmit} className="space-y-6">
                        {serverError && (
                            <div className="bg-rose-500/10 border border-rose-500 text-rose-500 p-3 rounded-lg text-sm flex items-center gap-2">
                                <AlertCircle size={16} />
                                {serverError}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300 ml-1">Contraseña Actual (Provisoria)</label>
                            <input
                                type="password"
                                {...register("oldPassword", { required: "Requerido" })}
                                className="w-full bg-slate-900/50 border border-slate-700 text-white px-4 py-3 rounded-xl outline-none focus:border-amber-500 transition-all"
                                placeholder="••••••••"
                            />
                            {errors.oldPassword && <p className="text-rose-500 text-xs mt-1 ml-1">{errors.oldPassword.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300 ml-1">Nueva Contraseña</label>
                            <input
                                type="password"
                                {...register("newPassword", { 
                                    required: "Requerido",
                                    minLength: { value: 6, message: "Mínimo 6 caracteres" }
                                })}
                                className="w-full bg-slate-900/50 border border-slate-700 text-white px-4 py-3 rounded-xl outline-none focus:border-rose-500 transition-all"
                                placeholder="••••••••"
                            />
                            {errors.newPassword && <p className="text-rose-500 text-xs mt-1 ml-1">{errors.newPassword.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300 ml-1">Confirmar Nueva Contraseña</label>
                            <input
                                type="password"
                                {...register("confirmPassword", { 
                                    required: "Requerido",
                                    validate: (value) => value === watch('newPassword') || "Las contraseñas no coinciden"
                                })}
                                className="w-full bg-slate-900/50 border border-slate-700 text-white px-4 py-3 rounded-xl outline-none focus:border-rose-500 transition-all"
                                placeholder="••••••••"
                            />
                            {errors.confirmPassword && <p className="text-rose-500 text-xs mt-1 ml-1">{errors.confirmPassword.message}</p>}
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-rose-600/20 active:scale-[0.98]"
                        >
                            Guardar Nueva Contraseña
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ChangePasswordPage;

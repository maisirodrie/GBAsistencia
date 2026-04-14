import { useForm } from "react-hook-form";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Save, AlertCircle, Eye, EyeOff } from "lucide-react";
import { showAlert } from "../utils/alerts";

const ChangePasswordPage = () => {
    const { register, handleSubmit, watch, formState: { errors } } = useForm();
    const { changePassword, user, logout } = useAuth();
    const [success, setSuccess] = useState(false);
    const [serverError, setServerError] = useState(null);
    
    // Estados para visibilidad de contraseñas
    const [showOld, setShowOld] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    
    const navigate = useNavigate();

    const onSubmit = handleSubmit(async (data) => {
        try {
            await changePassword({
                oldPassword: data.oldPassword,
                newPassword: data.newPassword
            });
            setSuccess(true);
            
            showAlert({
                title: "¡Contraseña Actualizada!",
                text: "Tu seguridad ha sido reforzada. Redirigiendo al inicio de sesión...",
                icon: "success"
            });

            setTimeout(() => {
                logout(); 
                navigate("/login");
            }, 3000);
        } catch (error) {
            const msg = error.response?.data?.message || "Error al cambiar la contraseña";
            setServerError(msg);
            showAlert({ title: "Error", text: msg, icon: "error" });
        }
    });

    return (
        <div className="min-h-[calc(100vh-80px)] w-full flex flex-col items-center py-8 px-4 sm:justify-center overflow-y-auto">
            <div className="bg-slate-800 max-w-md w-full p-6 sm:p-10 rounded-2xl shadow-2xl border border-slate-700 my-auto">
                <div className="flex flex-col items-center mb-8">
                    <div className="bg-amber-500 p-4 rounded-full mb-4 shadow-lg shadow-amber-500/20">
                        <Lock size={32} className="text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2 text-center uppercase tracking-tight">Actualizar Seguridad</h1>
                    {user?.mustChangePassword && (
                        <p className="text-amber-400 text-sm font-medium text-center bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
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
                            <label className="text-xs font-bold text-slate-400 ml-1 uppercase tracking-wider">Contraseña Actual</label>
                            <div className="relative">
                                <input
                                    type={showOld ? "text" : "password"}
                                    {...register("oldPassword", { required: "Requerido" })}
                                    className="w-full bg-slate-900/50 border border-slate-700 text-white px-4 py-3.5 rounded-xl outline-none focus:border-amber-500 transition-all pr-12"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowOld(!showOld)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                                >
                                    {showOld ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                            {errors.oldPassword && <p className="text-rose-500 text-xs mt-1 ml-1">{errors.oldPassword.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 ml-1 uppercase tracking-wider">Nueva Contraseña</label>
                            <div className="relative">
                                <input
                                    type={showNew ? "text" : "password"}
                                    {...register("newPassword", { 
                                        required: "Requerido",
                                        minLength: { value: 6, message: "Mínimo 6 caracteres" }
                                    })}
                                    className="w-full bg-slate-900/50 border border-slate-700 text-white px-4 py-3.5 rounded-xl outline-none focus:border-rose-500 transition-all pr-12"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNew(!showNew)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                                >
                                    {showNew ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                            {errors.newPassword && <p className="text-rose-500 text-xs mt-1 ml-1">{errors.newPassword.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 ml-1 uppercase tracking-wider">Confirmar Nueva Contraseña</label>
                            <div className="relative">
                                <input
                                    type={showConfirm ? "text" : "password"}
                                    {...register("confirmPassword", { 
                                        required: "Requerido",
                                        validate: (value) => value === watch('newPassword') || "Las contraseñas no coinciden"
                                    })}
                                    className="w-full bg-slate-900/50 border border-slate-700 text-white px-4 py-3.5 rounded-xl outline-none focus:border-rose-500 transition-all pr-12"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm(!showConfirm)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                                >
                                    {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                            {errors.confirmPassword && <p className="text-rose-500 text-xs mt-1 ml-1">{errors.confirmPassword.message}</p>}
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-rose-600 hover:bg-rose-700 text-white font-black py-4 rounded-xl transition-all shadow-lg shadow-rose-900/40 active:scale-[0.98] uppercase tracking-widest mt-4"
                        >
                            Confirmar Cambio
                        </button>
                    </form>
                )}
            </div>
            {/* Espaciador para mobile bottom nav */}
            <div className="h-20 lg:hidden"></div>
        </div>
    );
};

export default ChangePasswordPage;

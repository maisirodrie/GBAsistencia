import { useForm } from "react-hook-form";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, User, Eye, EyeOff, Lock } from "lucide-react";

const LoginPage = () => {
    const { register, handleSubmit, formState: { errors } } = useForm();
    const { signin, isAuthenticated, errors: signinErrors } = useAuth();
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (isAuthenticated) navigate("/");
    }, [isAuthenticated, navigate]);

    const onSubmit = handleSubmit(async (data) => {
        signin(data);
    });

    return (
        <div className="flex h-[calc(100vh-100px)] items-center justify-center p-4">
            <div className="bg-slate-800 max-w-md w-full p-8 md:p-10 rounded-3xl shadow-2xl border border-slate-700 relative overflow-hidden">
                {/* Decorative background element */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-rose-600/10 rounded-full blur-3xl"></div>
                
                <div className="flex flex-col items-center mb-8 relative z-10">
                    <div className="mb-6 p-2 bg-slate-900/50 rounded-2xl border border-slate-700 shadow-inner">
                        <img 
                            src="/logo-gb.png" 
                            alt="Gracie Barra Logo" 
                            className="h-20 w-auto object-contain" 
                        />
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tight italic uppercase italic">Acceso</h1>
                    <div className="h-1 w-12 bg-rose-600 mt-2 rounded-full"></div>
                </div>

                {signinErrors.map((error, i) => (
                    <div key={i} className="bg-rose-500/10 border border-rose-500/50 text-rose-500 p-4 rounded-2xl text-sm mb-6 text-center font-medium animate-shake">
                        {error}
                    </div>
                ))}

                <form onSubmit={onSubmit} className="space-y-5 relative z-10">
                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Número de DNI</label>
                        <div className="relative group">
                            <input
                                type="text"
                                {...register("dni", { required: "El DNI es obligatorio" })}
                                className="w-full bg-slate-900 border border-slate-700 text-white px-5 py-4 rounded-2xl outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all pl-12 font-medium"
                                placeholder="Tu DNI"
                            />
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-rose-500 transition-colors" size={20} />
                        </div>
                        {errors.dni && <p className="text-rose-500 text-xs mt-1 ml-1 font-bold">{errors.dni.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Contraseña</label>
                        <div className="relative group">
                            <input
                                type={showPassword ? "text" : "password"}
                                {...register("password", { required: "La contraseña es obligatoria" })}
                                className="w-full bg-slate-900 border border-slate-700 text-white px-5 py-4 rounded-2xl outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all pl-12 pr-12 font-medium"
                                placeholder="••••••••"
                            />
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-rose-500 transition-colors" size={20} />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                        {errors.password && <p className="text-rose-500 text-xs mt-1 ml-1 font-bold">{errors.password.message}</p>}
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-rose-900/20 transition-all active:scale-[0.98] mt-4 uppercase tracking-widest text-sm italic"
                    >
                        Iniciar Sesión
                    </button>
                    
                    <div className="text-center mt-6">
                        <button 
                            type="button"
                            className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-rose-400 transition-colors"
                            onClick={() => alert('Por favor, contacta al Sensei para restablecer tu acceso.')}
                        >
                            ¿Olvidaste tu contraseña?
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;

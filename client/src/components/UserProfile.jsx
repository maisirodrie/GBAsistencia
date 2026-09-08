import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ChevronDown, KeyRound, LogOut, Shield } from "lucide-react";

export default function UserProfile() {
    const { user, logout, isAuthenticated } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if (!isAuthenticated) return null;

    const inicial = user?.nombre ? user.nombre.charAt(0).toUpperCase() : "U";
    const primerNombre = user?.nombre ? user.nombre.split(" ")[0] : "Usuario";

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Trigger Button: TailAdmin avatar circular + nombre + chevron */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2.5 text-slate-300 hover:text-white transition-colors focus:outline-none py-1 px-1.5 rounded-2xl hover:bg-slate-800/50"
                aria-expanded={isOpen}
            >
                {/* Avatar circular estilo TailAdmin */}
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-red-600/30 to-slate-800 border border-red-500/40 text-white flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-sm">
                    {inicial}
                </div>

                {/* Nombre y rol del usuario */}
                <div className="hidden sm:flex flex-col text-left min-w-0">
                    <span className="text-xs font-bold text-white tracking-tight truncate max-w-[120px]">
                        {primerNombre}
                    </span>
                    <span className="text-[10px] font-medium text-slate-400 capitalize truncate">
                        {user?.role?.toLowerCase() || "usuario"}
                    </span>
                </div>

                <ChevronDown 
                    size={16} 
                    className={`text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180 text-white" : ""}`} 
                />
            </button>

            {/* Dropdown Menu TailAdmin */}
            {isOpen && (
                <div className="absolute right-0 top-full mt-2.5 w-60 rounded-2xl border border-slate-800 bg-slate-900/95 backdrop-blur-2xl p-3 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
                    {/* Encabezado con datos del usuario */}
                    <div className="px-3 py-2 border-b border-slate-800/80">
                        <p className="text-xs font-bold text-white truncate">
                            {user?.nombre} {user?.apellido}
                        </p>
                        <p className="text-[11px] font-medium text-slate-400 truncate mt-0.5">
                            {user?.username ? `@${user.username}` : (user?.email || "usuario@gbasistencia")}
                        </p>
                        <div className="mt-1.5">
                            <span className={`inline-block px-2 py-0.5 text-[9px] font-extrabold uppercase rounded-full border ${
                                user?.role === 'Admin' 
                                    ? 'bg-red-500/10 text-red-400 border-red-500/20' 
                                    : user?.role === 'Encargado'
                                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                    : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                            }`}>
                                {user?.role}
                            </span>
                        </div>
                    </div>

                    {/* Links del Menú */}
                    <div className="py-2 space-y-1">
                        <Link
                            to="/perfil/cambiar-password"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/70 rounded-xl transition-all"
                        >
                            <KeyRound size={15} className="text-slate-400" />
                            <span>Cambiar Contraseña</span>
                        </Link>

                        {user?.role === 'Admin' && (
                            <Link
                                to="/usuarios"
                                onClick={() => setIsOpen(false)}
                                className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/70 rounded-xl transition-all"
                            >
                                <Shield size={15} className="text-slate-400" />
                                <span>Gestión de Usuarios</span>
                            </Link>
                        )}
                    </div>

                    {/* Cerrar Sesión */}
                    <div className="pt-2 border-t border-slate-800/80">
                        <button
                            type="button"
                            onClick={() => {
                                setIsOpen(false);
                                logout();
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all"
                        >
                            <LogOut size={15} />
                            <span>Cerrar Sesión</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

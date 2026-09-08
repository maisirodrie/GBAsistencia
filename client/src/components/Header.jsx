import { useLocation } from "react-router-dom";
import { Menu } from "lucide-react";
import UserProfile from "./UserProfile";

export default function Header({ sidebarOpen, setSidebarOpen }) {
    const location = useLocation();

    const getTitle = () => {
        if (location.pathname === "/") return "Panel de Control";
        if (location.pathname === "/alumnos") return "Alumnos";
        if (location.pathname === "/nuevo") return "Nuevo Alumno";
        if (location.pathname.startsWith("/editar/")) return "Editar Alumno";
        if (location.pathname === "/finanzas") return "Gestión Económica";
        if (location.pathname === "/usuarios") return "Control de Usuarios";
        if (location.pathname === "/perfil/cambiar-password") return "Mi Perfil";
        return "GB Asistente";
    };

    return (
        <header className="sticky top-0 z-30 flex w-full bg-slate-900/90 backdrop-blur-xl border-b border-slate-800 flex-shrink-0">
            <div className="flex flex-grow items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
                {/* Left: Mobile Hamburger + Mobile Brand / Desktop Title */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setSidebarOpen(!sidebarOpen);
                        }}
                        className="p-2 rounded-xl bg-slate-800/90 border border-slate-700/60 text-slate-300 hover:text-white lg:hidden transition-all active:scale-95 shadow-sm"
                        aria-label="Abrir menú"
                    >
                        <Menu size={20} />
                    </button>

                    {/* Mobile Brand next to hamburger */}
                    <div className="flex items-center gap-2 lg:hidden">
                        <img 
                            src="/gbnorte_v4.png" 
                            alt="Gracie Barra" 
                            className="h-8 w-auto object-contain" 
                        />
                        <span className="font-black text-xs uppercase tracking-widest text-white">GB Norte</span>
                    </div>

                    {/* Desktop Section Title */}
                    <div className="hidden lg:flex flex-col">
                        <h1 className="text-base font-black text-white uppercase tracking-tight">
                            {getTitle()}
                        </h1>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Gracie Barra Norte • Sistema de Gestión
                        </p>
                    </div>
                </div>

                {/* Right: User Profile (Compact & Clean) */}
                <div className="flex items-center">
                    <UserProfile />
                </div>
            </div>
        </header>
    );
}

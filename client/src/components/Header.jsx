import { useLocation } from "react-router-dom";
import { Menu } from "lucide-react";
import UserProfile from "./UserProfile";
import { useSidebar } from "../context/SidebarContext";

export default function Header() {
    const location = useLocation();
    const { toggleSidebar } = useSidebar();

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
            <div className="flex flex-grow items-center justify-between px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3">
                {/* Left: Hamburger button (VISIBLE EN PC Y MÓVIL) + Título o Logo */}
                <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
                    <button
                        onClick={toggleSidebar}
                        className="p-2 sm:p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-700/80 transition-all active:scale-95 shadow-sm flex items-center justify-center flex-shrink-0"
                        title="Alternar menú lateral"
                        aria-label="Alternar menú lateral"
                    >
                        <Menu size={20} />
                    </button>

                    {/* Logo solo en móvil (sin texto invasivo para que no se encime con el perfil) */}
                    <div className="flex items-center lg:hidden flex-shrink-0">
                        <img 
                            src="/gbnorte_v4.png" 
                            alt="Gracie Barra" 
                            className="h-8 w-auto object-contain" 
                        />
                    </div>

                    {/* Título de sección en PC */}
                    <div className="hidden lg:flex flex-col min-w-0">
                        <h1 className="text-base font-black text-white uppercase tracking-tight truncate">
                            {getTitle()}
                        </h1>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">
                            Gracie Barra Norte • Sistema de Gestión
                        </p>
                    </div>
                </div>

                {/* Right: User Profile (Compacto y sin desbordar) */}
                <div className="flex items-center flex-shrink-0">
                    <UserProfile />
                </div>
            </div>
        </header>
    );
}

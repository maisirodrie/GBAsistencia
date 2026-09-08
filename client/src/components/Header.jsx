import { Link, useLocation } from "react-router-dom";
import { Menu, Bell, QrCode } from "lucide-react";
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
        <header className="sticky top-0 z-30 flex w-full bg-slate-900/95 backdrop-blur-xl border-b border-slate-800 flex-shrink-0">
            <div className="flex flex-grow items-center justify-between px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5">
                {/* Left: Hamburger button (VISIBLE EN PC Y MÓVIL) + Título o Logo */}
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <button
                        onClick={toggleSidebar}
                        className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-700/80 transition-all active:scale-95 shadow-sm flex items-center justify-center flex-shrink-0"
                        title="Alternar menú lateral"
                        aria-label="Alternar menú lateral"
                    >
                        <Menu size={20} />
                    </button>

                    {/* Logo solo en móvil */}
                    <div className="flex items-center lg:hidden flex-shrink-0">
                        <img 
                            src="/gbnorte_v4.png" 
                            alt="Gracie Barra" 
                            className="h-8 w-auto object-contain" 
                        />
                    </div>

                    {/* Título de sección en PC */}
                    <div className="hidden lg:flex flex-col min-w-0">
                        <h1 className="text-base font-bold text-white tracking-tight truncate">
                            {getTitle()}
                        </h1>
                        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider truncate">
                            Gracie Barra Norte • Sistema de Gestión
                        </p>
                    </div>
                </div>

                {/* Right: Botones de acción circulares + Dropdown de Usuario estilo TailAdmin */}
                <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                    <Link
                        to="/cartel-qr"
                        className="hidden sm:flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-slate-700/80 bg-slate-800/60 text-slate-300 hover:text-white hover:border-slate-600 hover:bg-slate-800 transition-all shadow-sm"
                        title="Cartel QR Academia"
                    >
                        <QrCode size={18} />
                    </Link>

                    <Link
                        to="/"
                        className="relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-slate-700/80 bg-slate-800/60 text-slate-300 hover:text-white hover:border-slate-600 hover:bg-slate-800 transition-all shadow-sm"
                        title="Panel de Control y Alertas"
                    >
                        <Bell size={18} />
                        <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-slate-900" />
                    </Link>

                    <UserProfile />
                </div>
            </div>
        </header>
    );
}

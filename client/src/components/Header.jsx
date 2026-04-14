import { Link } from "react-router-dom";
import UserProfile from "./UserProfile";

export default function Header({ isSidebarCollapsed }) {
    return (
        <header className={`fixed top-0 left-0 ${isSidebarCollapsed ? "lg:left-20" : "lg:left-72"} right-0 h-auto min-h-[5rem] lg:h-20 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 z-[70] flex flex-col lg:flex-row items-start lg:items-center justify-between px-6 py-4 lg:py-0 gap-4 lg:gap-0 transition-all duration-300`}>
            {/* Logo y Marca alineados a la izquierda en móvil (Se oculta en desktop si la sidebar ya tiene el logo) */}
            <div className={`flex flex-row items-center justify-start gap-3 lg:gap-3 ${!isSidebarCollapsed ? "lg:hidden" : "lg:flex"}`}>
                <img 
                    src="/gbnorte_v4.png" 
                    alt="Logo" 
                    className="h-10 lg:h-12 w-auto object-contain" 
                />
                <div className="flex flex-col items-start text-left">
                    <span className="text-white font-black text-sm lg:text-xs tracking-widest uppercase italic leading-none">GB</span>
                    <span className="text-slate-500 font-bold text-[8px] lg:text-[8px] tracking-widest uppercase leading-none mt-1">Asistente</span>
                </div>
            </div>

            {/* Título de sección o espacio vacío en PC */}
            <div className="hidden lg:block">
                {/* Espacio para título dinámico */}
            </div>
            
            <div className="w-full lg:w-auto flex justify-start lg:justify-end">
                <UserProfile />
            </div>
        </header>
    );
}

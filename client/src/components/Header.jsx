import { Link } from "react-router-dom";
import UserProfile from "./UserProfile";

export default function Header() {
    return (
        <header className="fixed top-0 left-0 lg:left-72 right-0 h-auto min-h-[5rem] lg:h-20 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 z-[70] flex flex-col lg:flex-row items-center justify-between px-6 py-4 lg:py-0 gap-4 lg:gap-0">
            {/* Logo y Marca centrados en móvil */}
            <div className="flex flex-col lg:flex-row items-center gap-2 lg:gap-3">
                <img 
                    src="/gbnorte_v4.png" 
                    alt="Logo" 
                    className="h-12 lg:h-12 w-auto object-contain" 
                />
                <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
                    <span className="text-white font-black text-sm lg:text-xs tracking-widest uppercase italic leading-none">GB</span>
                    <span className="text-slate-500 font-bold text-[9px] lg:text-[8px] tracking-widest uppercase leading-none mt-1">Asistente</span>
                </div>
            </div>

            {/* Título de sección o espacio vacío en PC */}
            <div className="hidden lg:block">
                {/* Espacio para título dinámico */}
            </div>
            
            <div className="w-full lg:w-auto flex justify-center lg:justify-end">
                <UserProfile />
            </div>
        </header>
    );
}

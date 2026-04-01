import { Link } from "react-router-dom";
import UserProfile from "./UserProfile";

export default function Header() {
    return (
        <header className="fixed top-0 left-0 lg:left-72 right-0 h-20 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 z-[70] flex items-center justify-between px-6">
            {/* Logo solo visible en móvil (en PC está en el sidebar) */}
            <div className="lg:hidden flex items-center gap-3">
                <img 
                    src="/logo-gb.png" 
                    alt="Logo" 
                    className="h-10 w-auto" 
                />
                <div className="flex flex-col">
                    <span className="text-white font-black text-xs tracking-widest uppercase italic leading-none">Asistente</span>
                    <span className="text-slate-500 font-bold text-[8px] tracking-widest uppercase leading-none mt-1">Mestre Manager</span>
                </div>
            </div>

            {/* Título de sección o espacio vacío en PC */}
            <div className="hidden lg:block">
                {/* Aquí podríamos poner el título dinámico de la página si quisiéramos */}
            </div>
            
            <UserProfile />
        </header>
    );
}

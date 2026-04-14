import { Link } from "react-router-dom";
import UserProfile from "./UserProfile";

export default function TopMobileHeader() {
    return (
        <header className="lg:hidden flex flex-col items-center justify-center py-4 px-4 bg-slate-900 border-b border-slate-800 shadow-sm relative z-[70] overflow-hidden gap-4">
            <Link to="/" className="flex flex-col items-center gap-1.5 relative z-10 transition-transform active:scale-95">
                <img 
                    src="/gbnorte_v4.png" 
                    alt="GB Norte Logo" 
                    className="h-14 sm:h-16 w-auto object-contain" 
                />
                <div className="flex flex-col items-center">
                    <span className="text-slate-100 font-black text-sm tracking-[0.2em] uppercase italic leading-none">GB</span>
                    <span className="text-slate-500 font-bold text-[9px] tracking-[0.25em] uppercase leading-none mt-1">Asistente</span>
                </div>
            </Link>
            
            <div className="w-full flex justify-center">
                <UserProfile />
            </div>
        </header>
    );
}

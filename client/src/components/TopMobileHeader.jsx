import { Link } from "react-router-dom";
import UserProfile from "./UserProfile";

export default function TopMobileHeader() {
    return (
        <header className="lg:hidden flex items-center justify-between py-6 px-5 bg-slate-900 border-b border-slate-800 shadow-sm relative z-[70] overflow-hidden">
            <Link to="/" className="flex items-center gap-4 relative z-10 scale-90 -ml-2">
                <img 
                    src="/gbnorte_v4.png" 
                    alt="GB Norte Logo" 
                    className="h-[6rem] w-auto object-contain" 
                />
                <div className="flex flex-col">
                    <span className="text-slate-100 font-black text-md tracking-widest uppercase italic leading-none text-left">GB</span>
                    <span className="text-slate-500 font-bold text-[9px] tracking-[0.15em] uppercase leading-none mt-1.5 text-left">Asistente</span>
                </div>
            </Link>
            
            <UserProfile mobile={true} />
        </header>
    );
}

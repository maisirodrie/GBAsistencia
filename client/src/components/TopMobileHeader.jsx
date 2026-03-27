import { Link } from "react-router-dom";

export default function TopMobileHeader() {
    return (
        <header className="lg:hidden flex items-center justify-center py-8 px-5 bg-slate-900 border-b border-slate-800 shadow-sm">
            <Link to="/" className="flex items-center gap-6">
                <img 
                    src="/gbnorte_v4.png" 
                    alt="GB Norte Logo" 
                    className="h-[8rem] w-auto object-contain" 
                />
                <div className="flex flex-col">
                    <span className="text-slate-100 font-black text-lg tracking-widest uppercase italic leading-none text-left">Asistente</span>
                    <span className="text-slate-500 font-bold text-[11px] tracking-[0.15em] uppercase leading-none mt-2 text-left">Mestre Manager</span>
                </div>
            </Link>
        </header>
    );
}

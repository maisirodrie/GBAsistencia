import { Link, useLocation } from "react-router-dom";
import { Users, DollarSign, Package, LogOut, UserPlus, Shield, User as UserIcon } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
    const location = useLocation();
    const { user, logout, isAuthenticated } = useAuth();

    const isActive = (path) => location.pathname === path;

    const navLinks = [
        { to: "/", label: "Alumnos", icon: <Users size={20} />, active: isActive("/") },
        { to: "/finanzas", label: "Finanzas", icon: <DollarSign size={20} />, active: isActive("/finanzas") },
        { to: "/stock", label: "Stock", icon: <Package size={20} />, active: isActive("/stock") },
    ];

    if (!isAuthenticated) return null;

    return (
        <>
            {/* SIDEBAR (DESKTOP) */}
            <aside className="hidden lg:flex flex-col w-72 bg-slate-900 border-r border-slate-800 h-screen sticky top-0 fixed left-0 z-50">
                {/* Logo Section */}
                <div className="p-8 pb-10">
                    <Link to="/" className="flex flex-col items-center gap-2 group">
                        <img 
                            src="/gbnorte_v4.png" 
                            alt="GB Norte Logo" 
                            className="h-28 w-auto object-contain transition-transform group-hover:scale-105 duration-300" 
                        />
                        <div className="flex flex-col items-center">
                            <span className="text-slate-100 font-black text-sm tracking-widest uppercase italic">Asistente</span>
                            <span className="text-slate-500 font-bold text-[9px] tracking-[0.1em] uppercase leading-none mt-1 text-center">Mestre Manager</span>
                        </div>
                    </Link>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 px-4 space-y-2">
                    {navLinks.map((link) => (
                        <Link
                            key={link.to}
                            to={link.to}
                            className={`flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-sm transition-all duration-300 group ${
                                link.active
                                    ? "bg-slate-800 text-white border border-slate-700"
                                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                            }`}
                        >
                            <span className={`${link.active ? "text-white" : "text-slate-500 group-hover:text-rose-400"} transition-colors`}>
                                {link.icon}
                            </span>
                            <span className="tracking-wide">{link.label}</span>
                            {link.active && (
                                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse"></div>
                            )}
                        </Link>
                    ))}
                </nav>

                {/* Footer Action */}
                <div className="p-6">
                    <Link
                        to="/nuevo"
                        className="w-full bg-gradient-to-br from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all border border-red-500/20"
                    >
                        <UserPlus size={18} />
                        <span>NUEVO ALUMNO</span>
                    </Link>
                </div>
            </aside>

            {/* BOTTOM NAV (MOBILE) */}
            <nav className="lg:hidden fixed bottom-0 left-0 w-full bg-slate-900/80 backdrop-blur-xl border-t border-slate-800 flex items-center justify-around px-2 py-3 z-[60] pb-safe-area shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
                {navLinks.map((link) => (
                    <Link
                        key={link.to}
                        to={link.to}
                        className={`flex flex-col items-center gap-1 p-2 transition-all ${
                            link.active ? "text-rose-400" : "text-slate-500"
                        }`}
                    >
                        <div className={`p-2 rounded-xl transition-all ${link.active ? "bg-rose-500/10 scale-110" : ""}`}>
                            {link.icon}
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest">{link.label}</span>
                    </Link>
                ))}
                
                <button
                    onClick={logout}
                    className="flex flex-col items-center gap-1 p-2 text-slate-500"
                >
                    <div className="p-2">
                        <LogOut size={20} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest">Salir</span>
                </button>
            </nav>
        </>
    );
}

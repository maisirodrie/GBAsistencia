import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, DollarSign, Package, LogOut, UserPlus, Shield, Menu, ChevronLeft } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Navbar({ isCollapsed, onToggle }) {
    const location = useLocation();
    const { user, logout, isAuthenticated } = useAuth();

    const isActive = (path) => location.pathname === path;

    const navLinks = [
        { to: "/", label: "Panel", icon: <LayoutDashboard size={20} />, active: isActive("/") },
        { to: "/alumnos", label: "Alumnos", icon: <Users size={20} />, active: isActive("/alumnos") },
        { to: "/finanzas", label: "Finanzas", icon: <DollarSign size={20} />, active: isActive("/finanzas") },
        { to: "/stock", label: "Stock", icon: <Package size={20} />, active: isActive("/stock") },
    ];

    if (user?.role === 'Admin') {
        navLinks.push({ to: "/usuarios", label: "Usuarios", icon: <Shield size={20} />, active: isActive("/usuarios") });
    }

    if (!isAuthenticated) return null;

    return (
        <>
            {/* SIDEBAR (DESKTOP) */}
            <aside className={`hidden lg:flex flex-col ${isCollapsed ? "w-20" : "w-72"} bg-slate-900 border-r border-slate-800 h-screen sticky top-0 fixed left-0 z-50 transition-all duration-300`}>
                {/* Logo & Toggle Section */}
                <div className={`p-6 flex items-center ${isCollapsed ? "justify-center" : "justify-between"} mb-4`}>
                    {!isCollapsed && (
                        <Link to="/" className="flex flex-col items-center gap-1 group">
                            <img 
                                src="/gbnorte_v4.png" 
                                alt="GB Norte Logo" 
                                className="h-16 w-auto object-contain transition-transform group-hover:scale-105 duration-300" 
                            />
                            <div className="flex flex-col items-center">
                                <span className="text-slate-100 font-black text-[10px] tracking-widest uppercase italic">GB</span>
                                <span className="text-slate-500 font-bold text-[7px] tracking-[0.1em] uppercase leading-none mt-0.5 text-center">Asistente</span>
                            </div>
                        </Link>
                    )}
                    
                    <button 
                        onClick={onToggle}
                        className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-all active:scale-90"
                        title={isCollapsed ? "Expandir menú" : "Contraer menú"}
                    >
                        {isCollapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
                    </button>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 px-3 space-y-2">
                    {navLinks.map((link) => (
                        <Link
                            key={link.to}
                            to={link.to}
                            className={`flex items-center ${isCollapsed ? "justify-center" : "gap-4 px-6"} py-4 rounded-2xl font-black text-sm transition-all duration-300 group ${
                                link.active
                                    ? "bg-slate-800 text-white border border-slate-700"
                                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                            }`}
                        >
                            <span className={`${link.active ? "text-white" : "text-slate-500 group-hover:text-rose-400"} transition-colors`}>
                                {link.icon}
                            </span>
                            {!isCollapsed && <span className="tracking-wide whitespace-nowrap">{link.label}</span>}
                            {link.active && !isCollapsed && (
                                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse"></div>
                            )}
                        </Link>
                    ))}
                </nav>

                {/* Footer Action */}
                <div className="p-4">
                    <Link
                        to="/nuevo"
                        className={`w-full bg-gradient-to-br from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white font-black py-4 rounded-2xl flex items-center justify-center ${isCollapsed ? "" : "gap-2"} shadow-xl active:scale-95 transition-all border border-red-500/20`}
                        title="Nuevo Alumno"
                    >
                        <UserPlus size={18} />
                        {!isCollapsed && <span className="whitespace-nowrap">NUEVO ALUMNO</span>}
                    </Link>
                </div>
            </aside>

            {/* BOTTOM NAV (MOBILE) */}
            <nav className="lg:hidden fixed bottom-0 left-0 w-full bg-slate-900/80 backdrop-blur-xl border-t border-slate-800 flex items-center justify-around px-1 py-2 z-[60] pb-safe-area shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
                {navLinks.map((link) => (
                    <Link
                        key={link.to}
                        to={link.to}
                        className={`flex flex-col items-center gap-0.5 min-w-[60px] p-1 transition-all ${
                            link.active ? "text-rose-500" : "text-slate-500"
                        }`}
                    >
                        <div className={`p-1.5 rounded-lg transition-all ${link.active ? "bg-rose-500/10 scale-105" : ""}`}>
                            {/* Ajuste de tamaño de icono p/ móviles pequeños */}
                            {link.icon}
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-wider">{link.label}</span>
                    </Link>
                ))}
                
                <button
                    onClick={logout}
                    className="flex flex-col items-center gap-0.5 min-w-[60px] p-1 text-slate-500"
                >
                    <div className="p-1.5">
                        <LogOut size={20} />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-wider">Salir</span>
                </button>
            </nav>
        </>
    );
}

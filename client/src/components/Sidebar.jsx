import { Link, useLocation } from "react-router-dom";
import { 
    LayoutDashboard, 
    Users, 
    DollarSign, 
    Shield, 
    QrCode, 
    UserPlus, 
    LogOut, 
    X 
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Sidebar({ sidebarOpen, setSidebarOpen }) {
    const location = useLocation();
    const { user, logout, isAuthenticated } = useAuth();

    if (!isAuthenticated) return null;

    const isActive = (path) => {
        if (path === "/") return location.pathname === "/";
        return location.pathname.startsWith(path);
    };

    const navLinks = [
        { to: "/", label: "Panel", icon: <LayoutDashboard size={20} />, active: isActive("/") },
        { to: "/alumnos", label: "Alumnos", icon: <Users size={20} />, active: isActive("/alumnos") },
        { to: "/cartel-qr", label: "Cartel QR Academia", icon: <QrCode size={20} />, active: isActive("/cartel-qr") },
    ];

    const canSeeEconomy = ['Admin', 'Encargado'].includes(user?.role);
    if (canSeeEconomy) {
        navLinks.push({ 
            to: "/finanzas", 
            label: "Gestión Económica", 
            icon: <DollarSign size={20} />, 
            active: isActive("/finanzas") 
        });
    }

    if (user?.role === 'Admin') {
        navLinks.push({ 
            to: "/usuarios", 
            label: "Usuarios", 
            icon: <Shield size={20} />, 
            active: isActive("/usuarios") 
        });
    }

    return (
        <>
            {/* Mobile Backdrop Overlay */}
            <div
                onClick={() => setSidebarOpen(false)}
                className={`fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
                    sidebarOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
                }`}
            />

            {/* Sidebar Drawer Container */}
            <aside
                className={`fixed left-0 top-0 z-50 flex h-screen w-72 flex-col overflow-y-hidden bg-slate-900 border-r border-slate-800 duration-300 ease-in-out lg:static lg:translate-x-0 ${
                    sidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
                }`}
            >
                {/* Sidebar Header */}
                <div className="flex items-center justify-between gap-3 px-6 py-6 border-b border-slate-800/80">
                    <Link 
                        to="/" 
                        onClick={() => setSidebarOpen(false)}
                        className="flex items-center gap-3 group"
                    >
                        <img 
                            src="/gbnorte_v4.png" 
                            alt="Gracie Barra Norte" 
                            className="h-11 w-auto object-contain transition-transform group-hover:scale-105" 
                        />
                        <div className="flex flex-col">
                            <span className="text-white font-black text-sm tracking-wider uppercase italic leading-none">Gracie Barra</span>
                            <span className="text-red-500 font-black text-[9px] tracking-[0.25em] uppercase leading-none mt-1">Asistente</span>
                        </div>
                    </Link>

                    {/* Close button on mobile */}
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 lg:hidden transition-all"
                        aria-label="Cerrar menú"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Navigation Links Area */}
                <div className="no-scrollbar flex flex-col overflow-y-auto duration-300 ease-linear flex-1 px-4 py-5">
                    <div className="mb-2 px-3">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                            Menú Principal
                        </span>
                    </div>

                    <nav className="space-y-1.5">
                        {navLinks.map((link) => (
                            <Link
                                key={link.to}
                                to={link.to}
                                onClick={() => setSidebarOpen(false)}
                                className={`group relative flex items-center gap-3.5 rounded-2xl px-4 py-3.5 font-bold text-sm transition-all duration-200 ${
                                    link.active
                                        ? "bg-red-600/15 text-red-400 border border-red-500/30 shadow-sm shadow-red-950/40 font-black"
                                        : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                                }`}
                            >
                                <span className={`${link.active ? "text-red-500" : "text-slate-500 group-hover:text-slate-300"} transition-colors`}>
                                    {link.icon}
                                </span>
                                <span className="tracking-wide">{link.label}</span>
                                {link.active && (
                                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>
                                )}
                            </Link>
                        ))}
                    </nav>

                    {/* Quick Action Button */}
                    <div className="mt-6 pt-4 border-t border-slate-800/80">
                        <Link
                            to="/nuevo"
                            onClick={() => setSidebarOpen(false)}
                            className="w-full bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-black py-3 px-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-red-950/50 active:scale-95 transition-all text-xs uppercase tracking-wider"
                        >
                            <UserPlus size={16} />
                            <span>Nuevo Alumno</span>
                        </Link>
                    </div>
                </div>

                {/* Sidebar Footer with Logout */}
                <div className="p-4 border-t border-slate-800/80 bg-slate-950/30">
                    <button
                        onClick={() => {
                            logout();
                            setSidebarOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-400 hover:bg-red-950/20 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all"
                    >
                        <LogOut size={18} />
                        <span>Cerrar Sesión</span>
                    </button>
                </div>
            </aside>
        </>
    );
}

import { Link, useLocation } from "react-router-dom";
import { 
    LayoutDashboard, 
    Users, 
    DollarSign, 
    Shield, 
    QrCode, 
    UserPlus, 
    LogOut, 
    X,
    ChevronLeft
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useSidebar } from "../context/SidebarContext";

export default function Sidebar() {
    const location = useLocation();
    const { user, logout, isAuthenticated } = useAuth();
    const { isExpanded, isMobileOpen, isHovered, setIsHovered, closeMobileSidebar } = useSidebar();

    if (!isAuthenticated) return null;

    const isOpen = isExpanded || isHovered || isMobileOpen;

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
            {/* Backdrop para móviles */}
            <div
                onClick={closeMobileSidebar}
                className={`fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
                    isMobileOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
                }`}
            />

            {/* Contenedor Sidebar: Fijo y expandible en PC, Cajón en móvil */}
            <aside
                onMouseEnter={() => !isExpanded && setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className={`fixed left-0 top-0 z-50 flex h-screen flex-col overflow-y-hidden bg-slate-900 border-r border-slate-800 transition-all duration-300 ease-in-out lg:static ${
                    isOpen ? "lg:w-72" : "lg:w-20"
                } ${
                    isMobileOpen ? "w-72 translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0"
                }`}
            >
                {/* Header del Sidebar */}
                <div className={`flex items-center ${isOpen ? "justify-between px-6" : "lg:justify-center lg:px-2 px-6"} py-5 border-b border-slate-800/80 flex-shrink-0`}>
                    <Link 
                        to="/" 
                        onClick={closeMobileSidebar}
                        className="flex items-center gap-3 group overflow-hidden"
                    >
                        <img 
                            src="/gbnorte_v4.png" 
                            alt="Gracie Barra Norte" 
                            className="h-10 w-auto object-contain flex-shrink-0 transition-transform group-hover:scale-105" 
                        />
                        {isOpen && (
                            <div className="flex flex-col min-w-0 transition-opacity duration-200">
                                <span className="text-white font-black text-sm tracking-wider uppercase italic leading-none truncate">Gracie Barra</span>
                                <span className="text-red-500 font-black text-[9px] tracking-[0.2em] uppercase leading-none mt-1 truncate">GB Asistente</span>
                            </div>
                        )}
                    </Link>

                    {/* Botón cerrar en móvil */}
                    <button
                        onClick={closeMobileSidebar}
                        className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 lg:hidden transition-all"
                        aria-label="Cerrar menú"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Lista de navegación */}
                <div className="no-scrollbar flex flex-col overflow-y-auto flex-1 px-3 py-4 space-y-1.5">
                    {isOpen && (
                        <div className="mb-2 px-3">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                Menú
                            </span>
                        </div>
                    )}

                    <nav className="space-y-1.5">
                        {navLinks.map((link) => (
                            <Link
                                key={link.to}
                                to={link.to}
                                onClick={closeMobileSidebar}
                                title={!isOpen ? link.label : undefined}
                                className={`group relative flex items-center ${
                                    isOpen ? "gap-3.5 px-4 py-3" : "justify-center p-3"
                                } rounded-2xl font-bold text-sm transition-all duration-200 ${
                                    link.active
                                        ? "bg-red-600/15 text-red-400 border border-red-500/30 shadow-sm shadow-red-950/40 font-black"
                                        : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                                }`}
                            >
                                <span className={`${link.active ? "text-red-500" : "text-slate-400 group-hover:text-slate-200"} flex-shrink-0 transition-colors`}>
                                    {link.icon}
                                </span>
                                {isOpen && (
                                    <>
                                        <span className="tracking-wide truncate">{link.label}</span>
                                        {link.active && (
                                            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] flex-shrink-0"></span>
                                        )}
                                    </>
                                )}
                            </Link>
                        ))}
                    </nav>

                    {/* Botón rápido Nuevo Alumno */}
                    <div className="mt-4 pt-3 border-t border-slate-800/80">
                        <Link
                            to="/nuevo"
                            onClick={closeMobileSidebar}
                            title={!isOpen ? "Nuevo Alumno" : undefined}
                            className={`w-full bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-black ${
                                isOpen ? "py-3 px-4" : "p-3"
                            } rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-red-950/50 active:scale-95 transition-all text-xs uppercase tracking-wider`}
                        >
                            <UserPlus size={16} className="flex-shrink-0" />
                            {isOpen && <span className="truncate">Nuevo Alumno</span>}
                        </Link>
                    </div>
                </div>

                {/* Footer del Sidebar: Cerrar Sesión */}
                <div className="p-3 border-t border-slate-800/80 bg-slate-950/40 flex-shrink-0">
                    <button
                        onClick={() => {
                            logout();
                            closeMobileSidebar();
                        }}
                        title={!isOpen ? "Cerrar Sesión" : undefined}
                        className={`w-full flex items-center ${
                            isOpen ? "gap-3 px-3 py-2.5" : "justify-center p-2.5"
                        } text-slate-400 hover:text-red-400 hover:bg-red-950/20 rounded-xl font-bold text-xs uppercase tracking-wider transition-all`}
                    >
                        <LogOut size={16} className="flex-shrink-0" />
                        {isOpen && <span className="truncate">Cerrar Sesión</span>}
                    </button>
                </div>
            </aside>
        </>
    );
}

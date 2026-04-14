import { useAuth } from "../context/AuthContext";
import { Shield, User as UserIcon, LogOut } from "lucide-react";

export default function UserProfile() {
    const { user, logout, isAuthenticated } = useAuth();

    if (!isAuthenticated) return null;

    return (
        <div className="flex items-center gap-3 bg-slate-800/40 backdrop-blur-md p-1.5 pl-4 pr-1.5 rounded-2xl border border-slate-700/50 hover:bg-slate-800/60 transition-all group lg:scale-100 scale-100 sm:scale-100 origin-center sm:origin-right">
            <div className="flex flex-col items-center sm:items-end min-w-0 mr-1 overflow-visible">
                <span className="block text-white font-black text-[11px] lg:text-[13px] tracking-tight uppercase italic leading-none max-w-[150px] xs:max-w-[200px] sm:max-w-none text-center sm:text-right break-words">
                    {user?.nombre} {user?.apellido}
                </span>
                <span className="block text-rose-500 font-black text-[7px] lg:text-[8px] uppercase tracking-[0.2em] leading-none mt-1 max-w-[150px] xs:max-w-[200px] sm:max-w-none text-center sm:text-right">
                    {user?.role}
                </span>
            </div>
            
            <div className="flex items-center gap-1 border-l border-slate-700/50 pl-2">
                <div className="relative">
                    <div className="bg-rose-500/10 p-1.5 rounded-lg text-rose-500 border border-rose-500/20 shadow-lg shadow-rose-900/10 transition-transform group-hover:scale-105">
                        {user?.role === 'Admin' ? <Shield size={14} /> : <UserIcon size={14} />}
                    </div>
                </div>

                <button 
                    onClick={logout}
                    className="p-1.5 hover:bg-rose-500/10 rounded-lg text-slate-500 hover:text-rose-500 transition-all active:scale-90"
                    title="Cerrar Sesión"
                >
                    <LogOut size={16} />
                </button>
            </div>
        </div>
    );
}

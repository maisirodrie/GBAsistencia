import { useAuth } from "../context/AuthContext";
import { Shield, User as UserIcon, LogOut } from "lucide-react";

export default function UserProfile() {
    const { user, logout, isAuthenticated } = useAuth();

    if (!isAuthenticated) return null;

    return (
        <div className="flex items-center gap-2 sm:gap-3 bg-slate-800/60 backdrop-blur-md py-1.5 px-2.5 sm:px-3.5 rounded-2xl border border-slate-700/60 shadow-sm group">
            <div className="flex flex-col items-end min-w-0">
                <span className="text-white font-black text-[11px] sm:text-xs tracking-tight uppercase truncate max-w-[110px] xs:max-w-[150px] sm:max-w-[200px]">
                    {user?.nombre} {user?.apellido}
                </span>
                <span className="text-red-500 font-extrabold text-[8px] uppercase tracking-widest leading-none mt-0.5">
                    {user?.role}
                </span>
            </div>

            <div className="flex items-center gap-1.5 border-l border-slate-700/60 pl-2">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-red-600/10 border border-red-600/20 text-red-500 flex items-center justify-center font-black text-xs flex-shrink-0">
                    {user?.role === 'Admin' ? <Shield size={14} /> : <UserIcon size={14} />}
                </div>

                <button 
                    onClick={logout}
                    className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700/50 rounded-lg transition-all active:scale-95"
                    title="Cerrar Sesión"
                >
                    <LogOut size={16} />
                </button>
            </div>
        </div>
    );
}

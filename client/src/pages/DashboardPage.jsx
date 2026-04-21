import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getDashboardStats } from "../api/dashboard";
import { UPLOAD_URL } from "../api/axios";
import { useAuth } from "../context/AuthContext";
import BeltBadge from "../components/BeltBadge";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function DashboardPage() {
    const { user } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const isAdminOrEncargado = ['Admin', 'Encargado'].includes(user?.role);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await getDashboardStats();
                setData(res.data);
            } catch (error) {
                console.error("Error al cargar dashboard:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-slate-500 font-black animate-pulse bg-slate-800/50 px-8 py-4 rounded-3xl border border-slate-700">
                CARGANDO PANEL ADMINISTRATIVO...
            </div>
        </div>
    );

    const { stats, ultimasTransacciones, proximosAGraduar } = data;

    return (
        <div className="max-w-7xl mx-auto space-y-10 pb-20 animate-in fade-in duration-700">
            
            {/* Header de Bienvenida */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-gradient-to-r from-slate-900 via-slate-900 to-red-950/20 p-8 rounded-[2.5rem] border border-slate-700 shadow-2xl backdrop-blur-md relative overflow-hidden">
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-red-600/5 rounded-full blur-[80px]"></div>
                <div className="relative z-10 font-[Outfit]">
                    <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
                        ¡Bienvenido, <span className="bg-gradient-to-r from-red-400 to-rose-300 bg-clip-text text-transparent italic">{user?.nombre || "Mestre"}</span>!
                    </h1>
                    <p className="text-slate-400 font-bold mt-2 text-lg uppercase tracking-[0.2em]">{format(new Date(), "EEEE d 'de' MMMM", { locale: es })}</p>
                </div>
                <div className="flex flex-wrap gap-4 relative z-10 w-full md:w-auto">
                    <button onClick={() => navigate('/nuevo')} className="flex-1 md:flex-none bg-red-600 hover:bg-red-500 text-white px-6 py-4 rounded-2xl font-black shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 border-b-4 border-red-800 active:border-b-0 uppercase tracking-wider text-sm">
                        <span className="text-xl leading-none">+</span> Alumno
                    </button>
                    {isAdminOrEncargado && (
                        <button onClick={() => navigate('/finanzas')} className="flex-1 md:flex-none bg-slate-800 hover:bg-slate-700 text-white px-6 py-4 rounded-2xl font-black shadow-lg transition-all active:scale-95 border border-slate-700 flex items-center justify-center gap-2 uppercase tracking-wider text-sm">
                            <span className="text-lg leading-none">💰</span> Nueva Venta
                        </button>
                    )}
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {[
                    { label: "Alumnos Totales", value: stats.totalAlumnos, icon: "👤", color: "from-blue-600 to-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20 shadow-blue-500/10", show: true },
                    { label: "Asistencias Hoy", value: stats.asistenciasHoy, icon: "🥋", color: "from-emerald-600 to-teal-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20 shadow-emerald-500/10", show: true },
                    { label: "Ingresos del Mes", value: stats.ingresosMes ? `$${stats.ingresosMes.toLocaleString()}` : null, icon: "💵", color: "from-amber-600 to-orange-400", bg: "bg-amber-500/10", border: "border-amber-500/20 shadow-amber-500/10", show: stats.ingresosMes !== null }
                ].filter(kpi => kpi.show).map((kpi, i) => (
                    <div key={i} className={`group ${kpi.bg} p-8 rounded-[2.2rem] border ${kpi.border} shadow-2xl relative overflow-hidden transition-all hover:scale-[1.02] duration-300`}>
                        <div className="absolute top-0 right-0 p-6 text-5xl opacity-40 group-hover:scale-125 transition-transform duration-500 pointer-events-none">{kpi.icon}</div>
                        <p className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-1">{kpi.label}</p>
                        <h2 className={`text-4xl sm:text-5xl font-black bg-gradient-to-r ${kpi.color} bg-clip-text text-transparent tracking-tighter`}>{kpi.value}</h2>
                        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                
                {/* Alertas de Graduación */}
                <div className="bg-slate-800/10 backdrop-blur-xl border border-slate-700/50 rounded-[2.5rem] p-8 shadow-2xl flex flex-col min-h-[480px]">
                    <div className="flex items-center justify-between mb-8 pb-5 border-b border-slate-700/50">
                        <h3 className="text-xl font-black text-white flex items-center gap-3">
                            <span className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700 shadow-inner">🎓</span> Próximas Graduaciones
                        </h3>
                        <span className="text-[10px] font-black bg-red-500/20 text-red-400 px-3 py-1.5 rounded-full border border-red-500/30 uppercase tracking-widest animate-pulse">Checkpoints</span>
                    </div>
                    
                    <div className="space-y-4 flex-1">
                        {proximosAGraduar.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full opacity-30">
                                <span className="text-7xl mb-4">🏆</span>
                                <p className="font-bold text-lg uppercase tracking-widest">Todo al día</p>
                            </div>
                        ) : proximosAGraduar.map(a => (
                            <div key={a._id} className="group bg-slate-900/60 hover:bg-slate-800/60 p-5 rounded-3xl border border-slate-800/80 hover:border-red-500/30 transition-all cursor-pointer flex items-center gap-5 shadow-lg" onClick={() => navigate(`/editar/${a._id}`)}>
                                <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-slate-800 group-hover:border-red-500/50 relative shrink-0 transition-all shadow-xl">
                                    {a.fotoUrl ? (
                                        <img src={a.fotoUrl.startsWith('http') ? a.fotoUrl : `${UPLOAD_URL}/${a.fotoUrl}`} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-slate-800 flex items-center justify-center font-black text-slate-500 uppercase text-2xl">{a.nombre[0]}</div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <p className="font-black text-white text-lg leading-none mb-2">{a.nombre} <span className="opacity-70">{a.apellido}</span></p>
                                    <div className="flex items-center gap-3">
                                        <BeltBadge faja={a.faja} grado={a.grado} size="sm" showLabel={false} />
                                        <span className="text-[10px] font-black text-red-400/80 uppercase tracking-widest bg-red-400/5 px-2 py-0.5 rounded-md border border-red-400/10">Faltan {a.clasesRestantes} clases</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-3xl font-black text-white leading-none mb-1 tracking-tighter">{a.progreso}%</p>
                                    <div className="w-20 h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800 shadow-inner">
                                        <div className="h-full bg-gradient-to-r from-red-600 to-rose-400 transition-all duration-1000" style={{ width: `${a.progreso}%` }}></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Actividad Reciente */}
                {isAdminOrEncargado && (
                    <div className="bg-slate-800/10 backdrop-blur-xl border border-slate-700/50 rounded-[2.5rem] p-8 shadow-2xl flex flex-col min-h-[480px]">
                        <div className="flex items-center justify-between mb-8 pb-5 border-b border-slate-700/50">
                            <h3 className="text-xl font-black text-white flex items-center gap-3">
                                <span className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700 shadow-inner">⚡</span> Caja Reciente
                            </h3>
                            <button onClick={() => navigate('/finanzas')} className="text-[10px] font-black text-slate-500 hover:text-red-400 uppercase tracking-widest transition-all">Ver Historial →</button>
                        </div>

                        <div className="space-y-4 flex-1">
                            {ultimasTransacciones.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full opacity-30">
                                    <span className="text-7xl mb-4">💳</span>
                                    <p className="font-bold text-lg uppercase tracking-widest">Sin movimientos</p>
                                </div>
                            ) : ultimasTransacciones.map(t => (
                                <div key={t._id} className="flex items-center gap-5 bg-slate-900/40 p-5 rounded-3xl border border-slate-800/50 shadow-lg">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-inner border-2 ${t.tipo === 'INGRESO' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                                        {t.tipo === 'INGRESO' ? '↑' : '↓'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-black text-white text-base truncate mb-0.5">{t.descripcion}</p>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t.categoria}</span>
                                            <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
                                            <span className="text-[10px] font-bold text-slate-600 uppercase">{format(new Date(t.fecha), "d MMM", { locale: es })}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-black text-xl tracking-tight ${t.tipo === 'INGRESO' ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {t.tipo === 'INGRESO' ? '+' : '-'}${t.monto.toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

        </div>
    );
}

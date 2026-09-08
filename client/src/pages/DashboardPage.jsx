import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getDashboardStats } from "../api/dashboard";
import { UPLOAD_URL } from "../api/axios";
import { useAuth } from "../context/AuthContext";
import BeltBadge from "../components/BeltBadge";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { 
    Users, 
    CalendarCheck, 
    Award, 
    DollarSign, 
    ChevronRight, 
    ChevronLeft, 
    UserPlus, 
    ShoppingBag, 
    AlertCircle,
    TrendingUp,
    CheckCircle2
} from "lucide-react";

export default function DashboardPage() {
    const [candidatosAGrado, setCandidatosAGrado] = useState([]);
    const [candidatosAFaja, setCandidatosAFaja] = useState([]);
    const [currentPageGrado, setCurrentPageGrado] = useState(1);
    const [currentPageFaja, setCurrentPageFaja] = useState(1);
    const [currentPageCobranzas, setCurrentPageCobranzas] = useState(1);
    const itemsPerPage = 6;
    const itemsPerPageCobranzas = 10;
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const { user } = useAuth();
    const [data, setData] = useState(null);
    const isAdminOrEncargado = ['Admin', 'Encargado'].includes(user?.role);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await getDashboardStats();
                setData(res.data);
                setCandidatosAGrado(res.data.candidatosAGrado || []);
                setCandidatosAFaja(res.data.candidatosAFaja || []);
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
            <div className="flex flex-col items-center gap-3 bg-slate-900 border border-slate-800 px-8 py-6 rounded-3xl shadow-xl">
                <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">
                    Cargando Panel TailAdmin...
                </span>
            </div>
        </div>
    );

    if (!data) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center p-8 bg-red-950/20 border border-red-500/30 rounded-3xl max-w-md">
                <AlertCircle size={40} className="text-red-500 mx-auto mb-3" />
                <h2 className="text-lg font-black text-white uppercase tracking-tight mb-2">Error al cargar datos</h2>
                <p className="text-slate-400 text-xs mb-4">No pudimos conectar con el servidor. Reintentá nuevamente.</p>
                <button 
                    onClick={() => window.location.reload()} 
                    className="bg-red-600 hover:bg-red-500 text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider"
                >
                    Reintentar
                </button>
            </div>
        </div>
    );

    const { stats, ultimasTransacciones, pendientesPago } = data;
    const totalElegibles = (candidatosAGrado?.length || 0) + (candidatosAFaja?.length || 0);

    return (
        <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
            
            {/* Header de Bienvenida estilo TailAdmin */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/60 backdrop-blur-xl p-5 sm:p-7 rounded-2xl sm:rounded-3xl border border-slate-800 shadow-sm relative overflow-hidden">
                <div className="relative z-10">
                    <span className="text-red-500 font-black text-[10px] uppercase tracking-[0.25em] block mb-1">
                        Gracie Barra Norte • {format(new Date(), "EEEE d 'de' MMMM", { locale: es })}
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                        ¡Bienvenido, <span className="text-red-500 italic">{user?.nombre || "Profesor"}</span>!
                    </h1>
                    <p className="text-slate-400 text-xs font-medium mt-1">
                        Control general de alumnos, asistencias y promociones de la academia.
                    </p>
                </div>

                {/* Acciones Rápidas */}
                <div className="flex items-center gap-2.5 w-full sm:w-auto relative z-10">
                    <button 
                        onClick={() => navigate('/nuevo')} 
                        className="flex-1 sm:flex-initial bg-red-600 hover:bg-red-500 text-white px-4 sm:px-5 py-3 rounded-xl font-black shadow-lg shadow-red-900/30 transition-all active:scale-95 flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
                    >
                        <UserPlus size={16} />
                        <span>+ Alumno</span>
                    </button>
                    {isAdminOrEncargado && (
                        <button 
                            onClick={() => navigate('/finanzas')} 
                            className="flex-1 sm:flex-initial bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white px-4 sm:px-5 py-3 rounded-xl font-bold shadow transition-all active:scale-95 border border-slate-700 flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
                        >
                            <ShoppingBag size={16} />
                            <span>Caja / Venta</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Cuadrícula de Métricas TailAdmin (EcommerceMetrics Style) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
                
                {/* 1. Alumnos Totales */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 md:p-6 backdrop-blur-md hover:border-slate-700 transition-all">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center justify-center w-12 h-12 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
                            <Users size={22} />
                        </div>
                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            <TrendingUp size={12} /> Activos
                        </span>
                    </div>
                    <div className="mt-4">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            Alumnos Totales
                        </span>
                        <h4 className="mt-1 text-3xl sm:text-4xl font-black text-white tracking-tight">
                            {stats.totalAlumnos || 0}
                        </h4>
                    </div>
                </div>

                {/* 2. Asistencias Hoy */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 md:p-6 backdrop-blur-md hover:border-slate-700 transition-all">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center justify-center w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                            <CalendarCheck size={22} />
                        </div>
                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 size={12} /> Hoy
                        </span>
                    </div>
                    <div className="mt-4">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            Asistencias del Día
                        </span>
                        <h4 className="mt-1 text-3xl sm:text-4xl font-black text-white tracking-tight">
                            {stats.asistenciasHoy || 0}
                        </h4>
                    </div>
                </div>

                {/* 3. Elegibles para Promoción */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 md:p-6 backdrop-blur-md hover:border-slate-700 transition-all">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center justify-center w-12 h-12 bg-red-600/10 text-red-500 rounded-xl border border-red-600/20">
                            <Award size={22} />
                        </div>
                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                            Promociones
                        </span>
                    </div>
                    <div className="mt-4">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            Elegibles a Grado / Faja
                        </span>
                        <h4 className="mt-1 text-3xl sm:text-4xl font-black text-white tracking-tight">
                            {totalElegibles}
                        </h4>
                    </div>
                </div>

                {/* 4. Ingresos del Mes (Admin/Encargado) */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 md:p-6 backdrop-blur-md hover:border-slate-700 transition-all">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center justify-center w-12 h-12 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                            <DollarSign size={22} />
                        </div>
                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            Caja Mes
                        </span>
                    </div>
                    <div className="mt-4">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            Ingresos Mensuales
                        </span>
                        <h4 className="mt-1 text-2xl sm:text-3xl font-black text-white tracking-tight truncate">
                            {isAdminOrEncargado && stats.ingresosMes !== null 
                                ? `$${Number(stats.ingresosMes).toLocaleString("es-AR")}` 
                                : "Protegido"}
                        </h4>
                    </div>
                </div>
            </div>

            {/* Paneles de Graduaciones TailAdmin */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Panel 1: Próximos Grados */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6 backdrop-blur-md flex flex-col">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-4">
                        <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-xl bg-red-600/10 text-red-500 border border-red-600/20">
                                <Award size={18} />
                            </div>
                            <div>
                                <h3 className="text-base font-black text-white uppercase tracking-tight">Graduación de Grado</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Alumnos listos para nuevo grado</p>
                            </div>
                        </div>
                        <span className="text-[10px] font-black bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/20 uppercase tracking-widest">
                            {candidatosAGrado.length} listos
                        </span>
                    </div>
                    
                    <div className="space-y-2.5 flex-1">
                        {candidatosAGrado.length === 0 ? (
                            <div className="py-12 flex flex-col items-center justify-center opacity-40">
                                <Award size={36} className="text-slate-500 mb-2" />
                                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Sin grados pendientes</p>
                            </div>
                        ) : candidatosAGrado.slice((currentPageGrado - 1) * itemsPerPage, currentPageGrado * itemsPerPage).map(a => (
                            <div 
                                key={a._id} 
                                onClick={() => navigate(`/editar/${a._id}`)}
                                className="group bg-slate-950/40 hover:bg-slate-800/60 p-3.5 rounded-xl border border-slate-800/80 hover:border-slate-700 transition-all cursor-pointer flex items-center justify-between gap-3 shadow-sm"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-11 h-11 rounded-xl overflow-hidden border border-slate-800 relative shrink-0 bg-slate-800 flex items-center justify-center">
                                        {a.fotoUrl ? (
                                            <img src={a.fotoUrl.startsWith('http') ? a.fotoUrl : `${UPLOAD_URL}/${a.fotoUrl}`} className="w-full h-full object-cover" alt={a.nombre} />
                                        ) : (
                                            <span className="font-black text-slate-500 uppercase text-sm">{a.nombre[0]}</span>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-white text-sm truncate leading-tight">{a.nombre} {a.apellido}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <BeltBadge faja={a.faja} grado={a.grado} size="xs" showLabel={false} />
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">Grado actual: {a.grado}</span>
                                        </div>
                                    </div>
                                </div>
                                <ChevronRight size={16} className="text-slate-500 group-hover:text-red-400 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                            </div>
                        ))}
                    </div>

                    {candidatosAGrado.length > itemsPerPage && (
                        <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-800/60">
                            <button 
                                onClick={() => setCurrentPageGrado(p => Math.max(1, p - 1))} 
                                disabled={currentPageGrado === 1} 
                                className="px-3 py-1.5 bg-slate-800/80 rounded-lg border border-slate-700 text-slate-300 disabled:opacity-30 hover:bg-slate-700 text-xs font-bold transition-all"
                            >
                                Anterior
                            </button>
                            <span className="text-slate-400 font-bold text-[10px] tracking-widest uppercase">
                                {currentPageGrado} / {Math.ceil(candidatosAGrado.length / itemsPerPage)}
                            </span>
                            <button 
                                onClick={() => setCurrentPageGrado(p => Math.min(Math.ceil(candidatosAGrado.length / itemsPerPage), p + 1))} 
                                disabled={currentPageGrado === Math.ceil(candidatosAGrado.length / itemsPerPage)} 
                                className="px-3 py-1.5 bg-slate-800/80 rounded-lg border border-slate-700 text-slate-300 disabled:opacity-30 hover:bg-slate-700 text-xs font-bold transition-all"
                            >
                                Siguiente
                            </button>
                        </div>
                    )}
                </div>

                {/* Panel 2: Cambios de Faja */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6 backdrop-blur-md flex flex-col">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-4">
                        <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-xl bg-blue-600/10 text-blue-400 border border-blue-600/20">
                                <Award size={18} />
                            </div>
                            <div>
                                <h3 className="text-base font-black text-white uppercase tracking-tight">Graduación de Cinturón</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Alumnos listos para cambio de faja</p>
                            </div>
                        </div>
                        <span className="text-[10px] font-black bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full border border-blue-500/20 uppercase tracking-widest">
                            {candidatosAFaja.length} listos
                        </span>
                    </div>
                    
                    <div className="space-y-2.5 flex-1">
                        {candidatosAFaja.length === 0 ? (
                            <div className="py-12 flex flex-col items-center justify-center opacity-40">
                                <Award size={36} className="text-slate-500 mb-2" />
                                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Sin cambios de faja pendientes</p>
                            </div>
                        ) : candidatosAFaja.slice((currentPageFaja - 1) * itemsPerPage, currentPageFaja * itemsPerPage).map(a => (
                            <div 
                                key={a._id} 
                                onClick={() => navigate(`/editar/${a._id}`)}
                                className="group bg-slate-950/40 hover:bg-slate-800/60 p-3.5 rounded-xl border border-slate-800/80 hover:border-blue-500/30 transition-all cursor-pointer flex items-center justify-between gap-3 shadow-sm"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-11 h-11 rounded-xl overflow-hidden border border-slate-800 relative shrink-0 bg-slate-800 flex items-center justify-center">
                                        {a.fotoUrl ? (
                                            <img src={a.fotoUrl.startsWith('http') ? a.fotoUrl : `${UPLOAD_URL}/${a.fotoUrl}`} className="w-full h-full object-cover" alt={a.nombre} />
                                        ) : (
                                            <span className="font-black text-slate-500 uppercase text-sm">{a.nombre[0]}</span>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-white text-sm truncate leading-tight">{a.nombre} {a.apellido}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <BeltBadge faja={a.faja} grado={a.grado} size="xs" showLabel={false} />
                                            <span className="text-[10px] font-black text-blue-400 uppercase tracking-wider">Elegible Cinturón</span>
                                        </div>
                                    </div>
                                </div>
                                <ChevronRight size={16} className="text-slate-500 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                            </div>
                        ))}
                    </div>

                    {candidatosAFaja.length > itemsPerPage && (
                        <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-800/60">
                            <button 
                                onClick={() => setCurrentPageFaja(p => Math.max(1, p - 1))} 
                                disabled={currentPageFaja === 1} 
                                className="px-3 py-1.5 bg-slate-800/80 rounded-lg border border-slate-700 text-slate-300 disabled:opacity-30 hover:bg-slate-700 text-xs font-bold transition-all"
                            >
                                Anterior
                            </button>
                            <span className="text-slate-400 font-bold text-[10px] tracking-widest uppercase">
                                {currentPageFaja} / {Math.ceil(candidatosAFaja.length / itemsPerPage)}
                            </span>
                            <button 
                                onClick={() => setCurrentPageFaja(p => Math.min(Math.ceil(candidatosAFaja.length / itemsPerPage), p + 1))} 
                                disabled={currentPageFaja === Math.ceil(candidatosAFaja.length / itemsPerPage)} 
                                className="px-3 py-1.5 bg-slate-800/80 rounded-lg border border-slate-700 text-slate-300 disabled:opacity-30 hover:bg-slate-700 text-xs font-bold transition-all"
                            >
                                Siguiente
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Panel 3: Cobranzas Pendientes (TailAdmin Table Style) */}
            {isAdminOrEncargado && pendientesPago && pendientesPago.length > 0 && (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6 backdrop-blur-md">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-4">
                        <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                <DollarSign size={18} />
                            </div>
                            <div>
                                <h3 className="text-base font-black text-white uppercase tracking-tight">Cobranzas Pendientes</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Alumnos con cuotas o pagos a regularizar</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => navigate('/finanzas')} 
                            className="text-xs font-black text-amber-400 hover:text-amber-300 uppercase tracking-wider transition-all"
                        >
                            Ir a Finanzas →
                        </button>
                    </div>

                    <div className="overflow-x-auto no-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-800 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                                    <th className="py-3 px-3">Alumno</th>
                                    <th className="py-3 px-3">Concepto</th>
                                    <th className="py-3 px-3">Monto</th>
                                    <th className="py-3 px-3 text-right">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60 text-xs">
                                {pendientesPago.slice((currentPageCobranzas - 1) * itemsPerPageCobranzas, currentPageCobranzas * itemsPerPageCobranzas).map((p, idx) => (
                                    <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                                        <td className="py-3 px-3 font-bold text-white whitespace-nowrap">
                                            {p.alumnoNombre || p.alumno?.nombre || "Alumno"} {p.alumnoApellido || p.alumno?.apellido || ""}
                                        </td>
                                        <td className="py-3 px-3 text-slate-300 whitespace-nowrap">
                                            {p.concepto || "Membresía"}
                                        </td>
                                        <td className="py-3 px-3 font-black text-amber-400 whitespace-nowrap">
                                            ${Number(p.monto || 0).toLocaleString("es-AR")}
                                        </td>
                                        <td className="py-3 px-3 text-right whitespace-nowrap">
                                            <button 
                                                onClick={() => navigate('/finanzas')}
                                                className="px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 font-black text-[10px] uppercase tracking-wider transition-all"
                                            >
                                                Cobrar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

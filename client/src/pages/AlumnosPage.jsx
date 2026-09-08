import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAlumnos, addAsistencia, removeAsistencia, deleteAlumno } from "../api/alumnos";
import { UPLOAD_URL } from "../api/axios";
import { showAlert, showToast } from "../utils/alerts";
import BeltBadge from "../components/BeltBadge";
import QRCartelModal from "../components/QRCartelModal";
import { useAuth } from "../context/AuthContext";
import { 
    Search, QrCode, UserPlus, LayoutGrid, Table as TableIcon, 
    Check, Plus, Pencil, Trash2, X, User as UserIcon, Award
} from "lucide-react";

export default function AlumnosPage() {
    const { user } = useAuth();
    const [alumnos, setAlumnos] = useState([]);
    const [filtro, setFiltro] = useState("");
    const [showQRCartel, setShowQRCartel] = useState(false);
    const [viewMode, setViewMode] = useState(() => localStorage.getItem("alumnos_view_mode") || "grid");
    const navigate = useNavigate();

    useEffect(() => { cargar(); }, []);

    const toggleViewMode = (mode) => {
        setViewMode(mode);
        localStorage.setItem("alumnos_view_mode", mode);
    };

    async function cargar() {
        try {
            const { data } = await getAlumnos();
            setAlumnos(data);
        } catch (error) {
            console.error("Error al cargar alumnos:", error);
            const msg = error.response?.data?.message || "Error de conexión con el servidor.";
            if (error.response?.status !== 401) {
                showAlert({ title: "Error", text: msg, icon: "error" });
            }
        }
    }

    async function handleToggleAsistencia(alumno, yaAsistio) {
        const prevAlumnos = [...alumnos];
        try {
            let res;
            if (yaAsistio) {
                const confirm = await showAlert({
                    title: `¿Quitar asistencia?`,
                    text: `Se eliminará el presente de hoy para ${alumno.nombre}`,
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonText: 'Sí, quitar',
                    cancelButtonText: 'Cancelar'
                });
                if (!confirm.isConfirmed) return;
                
                res = await removeAsistencia(alumno._id, new Date());
                showToast(`Asistencia de ${alumno.nombre} eliminada`, 'info');
            } else {
                res = await addAsistencia(alumno._id, new Date());
                showToast(`¡Presente! ${alumno.nombre}`, 'success');
            }
            
            setAlumnos(prev => prev.map(a => a._id === alumno._id ? res.data : a));
        } catch (e) {
            showAlert({
                title: 'Error',
                text: e.response?.data?.message ?? "Error de red al actualizar asistencia.",
                icon: 'error'
            });
            setAlumnos(prevAlumnos);
        }
    }

    async function handleDelete(alumno) {
        const confirm = await showAlert({
            title: `¿Eliminar alumno?`,
            text: `Esta acción no se puede deshacer y se borrarán todos los datos de ${alumno.nombre}.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'No, cancelar'
        });

        if (confirm.isConfirmed) {
            try {
                await deleteAlumno(alumno._id);
                setAlumnos(prev => prev.filter(a => a._id !== alumno._id));
                showToast('Alumno eliminado correctamente', 'success');
            } catch (e) {
                showAlert({
                    title: 'Error',
                    text: "No se pudo borrar al alumno.",
                    icon: 'error'
                });
            }
        }
    }

    const lista = alumnos.filter(a => {
        const q = filtro.toLowerCase().trim();
        if (!q) return true;
        return a.nombre?.toLowerCase().includes(q) ||
               (a.apellido && a.apellido.toLowerCase().includes(q)) ||
               (a.dni && a.dni.toString().includes(q));
    });

    return (
        <div className="max-w-7xl mx-auto pb-16 space-y-6 animate-in fade-in duration-500">

            {/* Header + Action Bar TailAdmin (Fijo al hacer scroll) */}
            <div className="sticky top-0 z-20 flex flex-col gap-4 bg-slate-900/95 p-4 sm:p-5 rounded-2xl border border-slate-800/90 backdrop-blur-xl shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
                            <span>🥋</span> Alumnos y Asistencia
                        </h1>
                        <p className="text-xs sm:text-sm font-medium text-slate-400 mt-0.5">
                            Padrón general, control de asistencia diaria y seguimiento técnico
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Selector de Vista: Cuadrícula vs Tabla */}
                        <div className="flex bg-slate-950/60 p-1 rounded-xl border border-slate-800">
                            <button
                                onClick={() => toggleViewMode("grid")}
                                className={`p-2 rounded-lg transition-all ${viewMode === "grid" ? "bg-red-600 text-white shadow-sm" : "text-slate-400 hover:text-white"}`}
                                title="Vista Cuadrícula"
                            >
                                <LayoutGrid size={16} />
                            </button>
                            <button
                                onClick={() => toggleViewMode("table")}
                                className={`p-2 rounded-lg transition-all ${viewMode === "table" ? "bg-red-600 text-white shadow-sm" : "text-slate-400 hover:text-white"}`}
                                title="Vista Tabla"
                            >
                                <TableIcon size={16} />
                            </button>
                        </div>

                        <button
                            onClick={() => setShowQRCartel(true)}
                            className="inline-flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white px-3.5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-sm active:scale-95"
                            title="Ver e Imprimir Cartel QR para la Academia"
                        >
                            <QrCode size={15} />
                            <span className="hidden sm:inline">Cartel QR</span>
                        </button>

                        <button
                            onClick={() => navigate('/nuevo')}
                            className="inline-flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-500 text-white px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-red-600/20 active:scale-95"
                        >
                            <UserPlus size={15} />
                            <span>Nuevo Alumno</span>
                        </button>
                    </div>
                </div>

                {/* Buscador */}
                <div className="relative w-full">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, apellido o DNI..."
                        className="w-full bg-slate-950/60 border border-slate-700/80 rounded-xl pl-10 pr-10 py-2.5 sm:py-3 text-white text-sm outline-none focus:border-red-500 transition-all font-medium placeholder:text-slate-500"
                        value={filtro}
                        onChange={e => setFiltro(e.target.value)}
                    />
                    {filtro && (
                        <button
                            onClick={() => setFiltro("")}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>
            </div>

            {/* Listado */}
            {lista.length === 0 ? (
                <div className="text-center py-20 text-slate-500 border border-dashed border-slate-800 rounded-2xl bg-slate-900/20">
                    <UserIcon size={48} className="mx-auto mb-3 opacity-30 text-slate-400" />
                    <p className="font-bold text-sm">{filtro ? "No se encontraron alumnos con ese criterio." : "No hay alumnos en el sistema."}</p>
                    {filtro && (
                        <button 
                            className="mt-3 text-xs font-bold text-red-400 hover:text-red-300 uppercase tracking-wider"
                            onClick={() => setFiltro("")}
                        >
                            Limpiar búsqueda
                        </button>
                    )}
                </div>
            ) : viewMode === "table" ? (
                /* --- VISTA TABLA TAILADMIN --- */
                <div className="rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-md shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/30">
                        <h2 className="font-bold text-xs uppercase tracking-wider text-slate-400">Padrón de Alumnos ({lista.length})</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[760px]">
                            <thead>
                                <tr className="border-b border-slate-800/80 bg-slate-950/50 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                    <th className="py-4 px-6">Alumno</th>
                                    <th className="py-4 px-6">Graduación</th>
                                    <th className="py-4 px-6">Categoría</th>
                                    <th className="py-4 px-6">Condición</th>
                                    <th className="py-4 px-6 text-center">Asistencia Hoy</th>
                                    <th className="py-4 px-6 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/40 text-sm">
                                {lista.map(a => {
                                    const yaAsistio = a.yaAsistioHoy;
                                    const listo = a.clasesCumplidas && a.tiempoCumplido;
                                    return (
                                        <tr key={a._id} className="hover:bg-slate-800/25 transition-colors">
                                            {/* Alumno */}
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-800 border border-slate-700 flex-shrink-0 flex items-center justify-center font-bold text-white text-sm">
                                                        {a.fotoUrl ? (
                                                            <img 
                                                                src={a.fotoUrl.startsWith('http') ? a.fotoUrl : `${UPLOAD_URL}/${a.fotoUrl}`} 
                                                                alt="" 
                                                                className="w-full h-full object-cover" 
                                                            />
                                                        ) : (
                                                            <span>{a.nombre?.charAt(0)?.toUpperCase()}</span>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-white leading-tight">
                                                            {a.nombre} {a.apellido || ""}
                                                        </div>
                                                        <div className="text-xs text-slate-500 font-mono mt-0.5">
                                                            {a.dni ? `DNI: ${a.dni}` : "Sin DNI"}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Graduación */}
                                            <td className="py-4 px-6">
                                                <BeltBadge faja={a.faja} grado={a.grado} size="xs" />
                                            </td>

                                            {/* Categoría */}
                                            <td className="py-4 px-6">
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                                                    a.categoria === 'Infantil'
                                                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/25'
                                                        : 'bg-slate-800 text-slate-400 border-slate-700'
                                                }`}>
                                                    {a.categoria === 'Infantil' ? 'Kids' : 'Adulto'}
                                                </span>
                                            </td>

                                            {/* Condición */}
                                            <td className="py-4 px-6">
                                                {listo ? (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 uppercase tracking-wider animate-pulse">
                                                        <Award size={12} />
                                                        Elegible
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-slate-500 font-medium">Regular</span>
                                                )}
                                            </td>

                                            {/* Asistencia Hoy Toggle */}
                                            <td className="py-4 px-6 text-center">
                                                <button
                                                    onClick={() => handleToggleAsistencia(a, yaAsistio)}
                                                    className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all active:scale-95 shadow-sm ${
                                                        yaAsistio
                                                            ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/20"
                                                            : "bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-300 border border-slate-700"
                                                    }`}
                                                >
                                                    {yaAsistio ? (
                                                        <>
                                                            <Check size={14} />
                                                            <span>Presente</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Plus size={14} />
                                                            <span>Marcar</span>
                                                        </>
                                                    )}
                                                </button>
                                            </td>

                                            {/* Acciones */}
                                            <td className="py-4 px-6 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button 
                                                        onClick={() => navigate(`/editar/${a._id}`)}
                                                        className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"
                                                        title="Editar Perfil"
                                                    >
                                                        <Pencil size={15} />
                                                    </button>
                                                    {['Admin', 'Encargado'].includes(user?.role) && (
                                                        <button 
                                                            onClick={() => handleDelete(a)}
                                                            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                                            title="Borrar Alumno"
                                                        >
                                                            <Trash2 size={15} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                /* --- VISTA CUADRÍCULA TAILADMIN --- */
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {lista.map(a => {
                        const yaAsistio = a.yaAsistioHoy;
                        const listo = a.clasesCumplidas && a.tiempoCumplido;

                        return (
                            <div
                                key={a._id}
                                className={`rounded-2xl p-5 border shadow-sm flex flex-col justify-between transition-all duration-300 ${
                                    yaAsistio 
                                        ? "bg-slate-900/70 border-emerald-500/50 shadow-emerald-950/20" 
                                        : "bg-slate-900/50 border-slate-800 hover:border-slate-700"
                                }`}
                            >
                                {/* Top: Foto + Datos */}
                                <div>
                                    <div className="flex gap-4 items-center">
                                        {/* Foto de Perfil */}
                                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-slate-800 flex items-center justify-center text-2xl shadow-inner flex-shrink-0 border border-slate-700 overflow-hidden">
                                            {a.fotoUrl ? (
                                                <img 
                                                    src={a.fotoUrl.startsWith('http') ? a.fotoUrl : `${UPLOAD_URL}/${a.fotoUrl}`} 
                                                    alt="" 
                                                    className="w-full h-full object-cover" 
                                                />
                                            ) : (
                                                <span className="text-white font-bold">{a.nombre?.charAt(0)?.toUpperCase() || "👤"}</span>
                                            )}
                                        </div>
                                        
                                        {/* Nombre y Faja */}
                                        <div className="min-w-0 flex-1">
                                            <h3 className="font-bold text-base sm:text-lg text-white leading-snug break-words">
                                                {a.nombre} <span className="opacity-70">{a.apellido || ""}</span>
                                            </h3>
                                            <div className="mt-1.5 flex flex-col items-start gap-1">
                                                <BeltBadge faja={a.faja} grado={a.grado} size="xs" />
                                                <div className="flex items-center gap-1.5 flex-wrap mt-1">
                                                    {a.categoria === 'Infantil' && (
                                                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/25 uppercase tracking-wider">
                                                            Kids
                                                        </span>
                                                    )}
                                                    {listo && (
                                                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 uppercase tracking-wider animate-pulse flex items-center gap-1">
                                                            <Award size={10} /> Elegible
                                                        </span>
                                                    )}
                                                    {a.dni && (
                                                        <span className="text-[9px] font-semibold px-2 py-0.5 rounded-md bg-slate-950/60 text-slate-400 border border-slate-800 font-mono">
                                                            DNI: {a.dni}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Bottom: Botón Asistencia + Botones Edición */}
                                <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-col gap-2.5">
                                    <button
                                        onClick={() => handleToggleAsistencia(a, yaAsistio)}
                                        className={`w-full py-3 rounded-xl flex items-center justify-center gap-2 font-bold text-sm uppercase tracking-wider shadow-md transition-all active:scale-98 ${
                                            yaAsistio 
                                                ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/20" 
                                                : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/20"
                                        }`}
                                    >
                                        {yaAsistio ? (
                                            <>
                                                <Check size={18} />
                                                <span>Presente Hoy</span>
                                            </>
                                        ) : (
                                            <>
                                                <Plus size={18} />
                                                <span>Marcar Asistencia</span>
                                            </>
                                        )}
                                    </button>

                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => navigate(`/editar/${a._id}`)}
                                            className="flex-1 py-2 px-3 bg-slate-800/70 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs uppercase tracking-wider rounded-xl border border-slate-700/60 flex items-center justify-center gap-1.5 transition-all active:scale-95"
                                        >
                                            <Pencil size={13} />
                                            <span>Editar</span>
                                        </button>
                                        {['Admin', 'Encargado'].includes(user?.role) && (
                                            <button 
                                                onClick={() => handleDelete(a)}
                                                className="py-2 px-3 bg-slate-800/70 hover:bg-red-500/20 text-slate-400 hover:text-red-400 font-bold text-xs uppercase tracking-wider rounded-xl border border-slate-700/60 flex items-center justify-center gap-1.5 transition-all active:scale-95"
                                                title="Borrar Alumno"
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal para imprimir o ver el Cartel QR del Dojo */}
            <QRCartelModal 
                isOpen={showQRCartel} 
                onClose={() => setShowQRCartel(false)} 
            />
        </div>
    );
}

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAlumnos, addAsistencia, removeAsistencia, deleteAlumno } from "../api/alumnos";
import { UPLOAD_URL } from "../api/axios";
import { showAlert, showToast } from "../utils/alerts";
import { getFajaStyle, grauLabel } from "../utils/fajas";
import BeltBadge from "../components/BeltBadge";

export default function AlumnosPage() {
    const [alumnos, setAlumnos] = useState([]);
    const [filtro, setFiltro] = useState("");
    const navigate = useNavigate();

    useEffect(() => { cargar(); }, []);

    async function cargar() {
        try {
            const { data } = await getAlumnos();
            setAlumnos(data);
        } catch (error) {
            console.error("Error al cargar alumnos:", error);
            const msg = error.response?.data?.message || "Error de conexión con el servidor.";
            alert(`Error: ${msg}`);
        }
    }

    async function handleToggleAsistencia(alumno, yaAsistio) {
        // Guardamos copia de seguridad por si falla
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
            
            // Reemplazar al alumno en el state
            setAlumnos(prev => prev.map(a => a._id === alumno._id ? res.data : a));
        } catch (e) {
            showAlert({
                title: 'Error',
                text: e.response?.data?.message ?? "Error de red al actualizar asistencia.",
                icon: 'error'
            });
            setAlumnos(prevAlumnos); // Rollback
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

    const lista = alumnos.filter(a =>
        a.nombre.toLowerCase().includes(filtro.toLowerCase())
    );

    // Fecha local de hoy p/ validar UI
    const hoyStr = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];

    return (
        <div className="max-w-5xl mx-auto pb-20">

            {/* Header + Buscador */}
            <div className="mb-8 flex flex-col md:flex-row gap-4 items-stretch md:items-center">
                <div className="flex-1 flex gap-3 items-center bg-slate-800/50 overflow-hidden shadow-lg border border-slate-700/50 rounded-2xl px-4 transition-all focus-within:border-blue-500/50">
                    <span className="text-slate-400">🔍</span>
                    <input
                        type="text"
                        placeholder="Buscar por nombre..."
                        className="flex-1 bg-transparent py-4 text-lg outline-none text-white placeholder-slate-500"
                        value={filtro}
                        onChange={e => setFiltro(e.target.value)}
                    />
                    {filtro && (
                        <button
                            onClick={() => setFiltro("")}
                            className="text-slate-400 hover:text-white font-bold px-2"
                        >✕</button>
                    )}
                </div>

                <button
                    onClick={() => navigate('/nuevo')}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-black shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2 transition-all active:scale-95 whitespace-nowrap uppercase tracking-wider"
                >
                    <span className="text-2xl leading-none">+</span>
                    Nuevo Alumno
                </button>
            </div>

            {/* Lista */}
            {lista.length === 0 ? (
                <div className="text-center py-24 text-slate-500 border border-dashed border-slate-700 rounded-2xl flex flex-col items-center gap-4">
                    <p>{filtro ? "Sin resultados" : "No hay alumnos en el sistema."}</p>
                    {filtro && (
                        <button 
                            className="bg-slate-700 text-white px-4 py-2 rounded-lg"
                            onClick={() => navigate('/nuevo')}
                        >
                            Crear alumno
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {lista.map(a => {
                        const yaAsistio = a.yaAsistioHoy;
                        const requeridasBase = a.clasesParaGraduacion || 30;
                        const gradoActual = a.grado || 0;
                        const validasTotales = a.asistenciasDesdeUltimaGrad || 0;
                        const clasesHaciaProximo = Math.max(0, validasTotales - (gradoActual * requeridasBase));
                        const pct = Math.min((clasesHaciaProximo / requeridasBase) * 100, 100);

                        return (
                            <div
                                key={a._id}
                                className="bg-slate-800 rounded-2xl p-5 border shadow-lg flex flex-col relative overflow-hidden transition-all duration-300"
                                style={{
                                    borderColor: yaAsistio ? '#16a34a' : 'rgb(51, 65, 85)',
                                    borderWidth: yaAsistio ? '2px' : '1px',
                                }}
                            >
                                {/* Editar IconButton */}
                                <div className="absolute top-4 right-4 flex gap-2 z-10">
                                    <button 
                                        onClick={() => navigate(`/editar/${a._id}`)}
                                        className="text-slate-400 hover:text-white transition-colors bg-slate-900/40 rounded-full w-10 h-10 flex items-center justify-center hover:bg-slate-700 shadow-sm"
                                        title="Editar Perfil"
                                    >
                                        ✏️
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(a)}
                                        className="text-slate-400 hover:text-red-400 transition-colors bg-slate-900/40 rounded-full w-10 h-10 flex items-center justify-center hover:bg-red-900/40 shadow-sm"
                                        title="Borrar Alumno"
                                    >
                                        🗑
                                    </button>
                                </div>

                                {/* Header */}
                                <div className="flex items-start gap-3 pr-10 pb-3 flex-1 min-w-0">
                                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center text-xl shadow-inner flex-shrink-0 border border-slate-600/50 overflow-hidden">
                                        {a.fotoUrl ? (
                                            <img 
                                                src={a.fotoUrl.startsWith('http') ? a.fotoUrl : `${UPLOAD_URL}/${a.fotoUrl}`} 
                                                alt="Perfil" 
                                                className="w-full h-full object-cover" 
                                            />
                                        ) : (
                                            <span className="text-white drop-shadow-md">{a.nombre?.charAt(0)?.toUpperCase() || "👤"}</span>
                                        )}
                                    </div>
                                    <div className="flex flex-col items-start gap-1.5 overflow-hidden">
                                        <h3 className="font-bold text-lg sm:text-xl text-white leading-tight break-words w-full">{`${a.nombre} ${a.apellido || ""}`.trim()}</h3>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <BeltBadge faja={a.faja} grado={a.grado} size="md" />
                                            {a.categoria === 'Infantil' && (
                                                <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase tracking-widest">
                                                    Kids
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>



                                {/* Botón Gigante */}
                                <div className="mt-auto pt-2 border-t border-slate-700/50">
                                    <button
                                        onClick={() => handleToggleAsistencia(a, yaAsistio)}
                                        className={`w-full py-4 rounded-xl flex items-center justify-center gap-2 font-bold text-lg shadow-md transition-all active:scale-95 border-b-4 ${
                                            yaAsistio 
                                            ? "bg-green-600 hover:bg-green-500 border-green-800 text-white" 
                                            : "bg-blue-600 hover:bg-blue-500 border-blue-800 text-white"
                                        }`}
                                    >
                                        {yaAsistio ? (
                                            <>
                                                <span className="text-xl">✔</span>
                                                Presente Hoy
                                            </>
                                        ) : (
                                            <>
                                                <span className="text-xl">+</span>
                                                Marcar Asistencia
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

import { useState, useEffect, useMemo } from "react";
import { 
    Unlock, 
    Smartphone, 
    ShieldCheck, 
    AlertTriangle, 
    Search, 
    RefreshCw, 
    UserCheck, 
    X, 
    KeyRound, 
    Trash2, 
    Check, 
    RotateCcw,
    Users,
    Shield
} from "lucide-react";
import { 
    getAlumnos, 
    getCheckInsHoy, 
    destrabarDeviceCheckIn, 
    destrabarAlumno, 
    addAsistencia, 
    removeAsistencia,
    getDojoLocation,
    setDojoLocation 
} from "../api/alumnos";
import { UPLOAD_URL } from "../api/axios";
import { showAlert, showToast } from "../utils/alerts";
import BeltBadge from "../components/BeltBadge";

export default function DesbloqueosPage() {
    const [alumnos, setAlumnos] = useState([]);
    const [checkInsData, setCheckInsData] = useState({ total: 0, uniqueDevices: 0, checkIns: [] });
    const [dojoConfig, setDojoConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [busqueda, setBusqueda] = useState("");
    const [accionLoading, setAccionLoading] = useState(null);

    // Cargar alumnos, check-ins de hoy y configuración de PIN
    const cargarDatos = async () => {
        setRefreshing(true);
        try {
            const [resAlumnos, resCheckIns, resDojo] = await Promise.all([
                getAlumnos(),
                getCheckInsHoy(),
                getDojoLocation()
            ]);
            setAlumnos(resAlumnos.data || []);
            setCheckInsData(resCheckIns.data || { total: 0, uniqueDevices: 0, checkIns: [] });
            setDojoConfig(resDojo.data || null);
        } catch (err) {
            console.error("Error al cargar datos:", err);
            showToast("Error al cargar información de check-in.", "error");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        cargarDatos();
    }, []);

    // Determinar si un alumno asistió hoy en UTC-3
    const yaAsistioHoy = (alumno) => {
        if (!alumno?.asistencias) return false;
        const hoyLocal = new Date(Date.now() - 3 * 60 * 60 * 1000);
        const yyyy = hoyLocal.getUTCFullYear();
        const mm = hoyLocal.getUTCMonth();
        const dd = hoyLocal.getUTCDate();

        return alumno.asistencias.some((a) => {
            const d = new Date(a);
            return d.getUTCFullYear() === yyyy && d.getUTCMonth() === mm && d.getUTCDate() === dd;
        });
    };

    // Alumnos filtrados para búsqueda
    const alumnosFiltrados = useMemo(() => {
        const q = busqueda.trim().toLowerCase();
        if (!q) return [];
        return alumnos.filter((a) => {
            const matchNombre = a.nombre?.toLowerCase().includes(q);
            const matchApellido = a.apellido?.toLowerCase().includes(q);
            const matchDni = a.dni?.toString().includes(q);
            const matchTutor = a.tutorNombre?.toLowerCase().includes(q);
            return matchNombre || matchApellido || matchDni || matchTutor;
        }).slice(0, 10);
    }, [alumnos, busqueda]);

    // Acción 1: Destrabar alumno y su celular
    const handleDestrabarAlumno = async (alumno, resetAsistencia = false) => {
        const accionTexto = resetAsistencia 
            ? "liberar el celular y anular la asistencia de hoy" 
            : "liberar el bloqueo de celular para hoy";
        
        const confirm = await showAlert({
            title: `¿Destrabar a ${alumno.nombre}?`,
            text: `Se procederá a ${accionTexto}. El alumno podrá volver a registrarse con su celular.`,
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Sí, destrabar",
            cancelButtonText: "Cancelar"
        });

        if (!confirm.isConfirmed) return;

        setAccionLoading(alumno._id);
        try {
            const res = await destrabarAlumno(alumno._id, resetAsistencia);
            showToast(res.data.message || `¡Alumno ${alumno.nombre} destrabado con éxito!`, "success");
            await cargarDatos();
        } catch (err) {
            showAlert({
                title: "Error",
                text: err.response?.data?.message || "No se pudo destrabar al alumno.",
                icon: "error"
            });
        } finally {
            setAccionLoading(null);
        }
    };

    // Acción 2: Marcar asistencia manual directa
    const handlePresenteManual = async (alumno) => {
        const asistio = yaAsistioHoy(alumno);
        if (asistio) {
            showToast(`${alumno.nombre} ya tiene el presente tomado hoy.`, "info");
            return;
        }

        setAccionLoading(alumno._id);
        try {
            await addAsistencia(alumno._id, new Date());
            showToast(`¡Presente manual registrado para ${alumno.nombre}!`, "success");
            await cargarDatos();
        } catch (err) {
            showAlert({
                title: "Error",
                text: err.response?.data?.message || "No se pudo registrar la asistencia.",
                icon: "error"
            });
        } finally {
            setAccionLoading(null);
        }
    };

    // Acción 3: Liberar un dispositivo específico de la lista
    const handleLiberarDispositivo = async (checkIn) => {
        const confirm = await showAlert({
            title: "¿Liberar dispositivo?",
            text: `Se liberará el registro del dispositivo de ${checkIn.alumnoNombre}. Esto permite que otro alumno o padre pueda usar este mismo teléfono hoy.`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Sí, liberar celular",
            cancelButtonText: "Cancelar"
        });

        if (!confirm.isConfirmed) return;

        try {
            await destrabarDeviceCheckIn({ deviceId: checkIn.deviceId });
            showToast("Dispositivo liberado con éxito.", "success");
            await cargarDatos();
        } catch (err) {
            showAlert({
                title: "Error",
                text: err.response?.data?.message || "No se pudo liberar el dispositivo.",
                icon: "error"
            });
        }
    };

    // Acción 4: Liberar TODOS los dispositivos de hoy
    const handleLiberarTodos = async () => {
        const confirm = await showAlert({
            title: "⚠️ ¿Liberar TODOS los dispositivos de hoy?",
            text: "Esta acción reseteará el control de dispositivos de hoy para toda la academia. Todos los alumnos podrán volver a escanear desde cualquier teléfono.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Sí, liberar todos",
            cancelButtonText: "Cancelar"
        });

        if (!confirm.isConfirmed) return;

        try {
            const res = await destrabarDeviceCheckIn({ all: true });
            showToast(res.data.message || "Todos los dispositivos han sido liberados.", "success");
            await cargarDatos();
        } catch (err) {
            showAlert({
                title: "Error",
                text: err.response?.data?.message || "No se pudo realizar la acción.",
                icon: "error"
            });
        }
    };

    // Cambiar PIN de profesor
    const handleChangePin = async () => {
        const actual = dojoConfig?.kioskPin || "1745";
        const nuevo = window.prompt("Ingresá el nuevo PIN de profesor (mínimo 4 dígitos):", actual);
        if (nuevo === null) return;
        const clean = nuevo.trim();
        if (!clean || clean.length < 4) {
            showToast("El PIN debe tener al menos 4 dígitos.", "error");
            return;
        }

        try {
            const res = await setDojoLocation({ kioskPin: clean });
            setDojoConfig(res.data.config);
            showToast(`¡PIN de profesor actualizado a: ${clean}!`, "success");
        } catch (err) {
            showToast(err.response?.data?.message || "No se pudo actualizar el PIN.", "error");
        }
    };

    return (
        <div className="max-w-7xl mx-auto pb-16 space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900/90 border border-slate-800 p-5 rounded-3xl backdrop-blur-xl shadow-xl">
                <div>
                    <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-3">
                        <span className="p-2 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            <Unlock size={22} />
                        </span>
                        <span>Desbloqueo de Asistencias y Celulares</span>
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-400 font-medium mt-1">
                        Destrabá alumnos con problemas en el QR, liberá celulares compartidos y gestioná excepciones en vivo.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={cargarDatos}
                        disabled={refreshing}
                        className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2.5 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all shadow-sm active:scale-95"
                    >
                        <RefreshCw size={15} className={refreshing ? "animate-spin text-amber-400" : ""} />
                        <span>Actualizar</span>
                    </button>

                    <button
                        onClick={handleChangePin}
                        className="inline-flex items-center gap-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 px-4 py-2.5 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all shadow-sm active:scale-95"
                        title="Cambiar PIN de Profesor para desbloquear en celular o pantalla de recepción"
                    >
                        <KeyRound size={15} />
                        <span>PIN: {dojoConfig?.kioskPin || "1745"}</span>
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-3xl flex items-center justify-between shadow-lg">
                    <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                            Check-ins por QR Hoy
                        </span>
                        <div className="text-3xl font-black text-white mt-1">
                            {checkInsData.total}
                        </div>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center">
                        <Users size={24} />
                    </div>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-3xl flex items-center justify-between shadow-lg">
                    <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                            Dispositivos Únicos Activos
                        </span>
                        <div className="text-3xl font-black text-emerald-400 mt-1">
                            {checkInsData.uniqueDevices}
                        </div>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                        <Smartphone size={24} />
                    </div>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-3xl flex items-center justify-between shadow-lg">
                    <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                            PIN Modo Recepción / Dojo
                        </span>
                        <div className="text-3xl font-black text-amber-400 font-mono mt-1">
                            {dojoConfig?.kioskPin || "1745"}
                        </div>
                    </div>
                    <button
                        onClick={handleChangePin}
                        className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 flex items-center justify-center transition-all"
                        title="Modificar PIN"
                    >
                        <KeyRound size={22} />
                    </button>
                </div>
            </div>

            {/* SECCIÓN 1: Buscador y Destrabador Rápido de Alumno */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-800 pb-4">
                    <div>
                        <h2 className="text-lg font-black text-white flex items-center gap-2">
                            <span>🔍</span>
                            <span>Buscador y Destrabador Inmediato</span>
                        </h2>
                        <p className="text-xs text-slate-400">
                            Escribí el nombre, apellido o DNI del alumno para destrabarlo en 1 segundo.
                        </p>
                    </div>
                    <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full w-fit">
                        Destraba sin importar el celular que use
                    </span>
                </div>

                {/* Input de búsqueda */}
                <div className="relative w-full">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        placeholder="Ej: Alan Castro, Benjamin, 28387466..."
                        className="w-full bg-slate-950/80 border-2 border-slate-700/80 focus:border-amber-500 rounded-2xl pl-12 pr-12 py-3.5 text-white font-bold placeholder:text-slate-500 outline-none transition-all"
                        autoFocus
                    />
                    {busqueda && (
                        <button
                            onClick={() => setBusqueda("")}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                        >
                            <X size={18} />
                        </button>
                    )}
                </div>

                {/* Resultados de Alumnos */}
                {busqueda && (
                    <div className="space-y-3 pt-2">
                        {alumnosFiltrados.length === 0 ? (
                            <div className="p-8 text-center bg-slate-950/40 rounded-2xl border border-slate-800 text-slate-400 text-sm font-semibold">
                                No se encontraron alumnos con: <strong className="text-white">"{busqueda}"</strong>
                            </div>
                        ) : (
                            alumnosFiltrados.map((alumno) => {
                                const asistio = yaAsistioHoy(alumno);
                                const checkInReg = checkInsData.checkIns.find(
                                    (c) => c.alumnoId && (c.alumnoId._id === alumno._id || c.alumnoId === alumno._id)
                                );
                                const isBusy = accionLoading === alumno._id;

                                return (
                                    <div
                                        key={alumno._id}
                                        className="bg-slate-950/70 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all"
                                    >
                                        {/* Datos del Alumno */}
                                        <div className="flex items-center gap-4 min-w-0">
                                            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-800 border border-slate-700 overflow-hidden flex-shrink-0 flex items-center justify-center text-xl font-black shadow-inner">
                                                {alumno.fotoUrl ? (
                                                    <img
                                                        src={alumno.fotoUrl.startsWith("http") ? alumno.fotoUrl : `${UPLOAD_URL}/${alumno.fotoUrl}`}
                                                        alt=""
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <span className="text-white">{alumno.nombre?.charAt(0)}</span>
                                                )}
                                            </div>

                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h3 className="text-base sm:text-lg font-black text-white truncate">
                                                        {alumno.nombre} {alumno.apellido || ""}
                                                    </h3>
                                                    <BeltBadge faja={alumno.faja} grado={alumno.grado} size="xs" />
                                                    {alumno.categoria === "Infantil" && (
                                                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase">
                                                            Kids
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 flex-wrap font-medium">
                                                    <span>DNI: <strong className="text-white font-mono">{alumno.dni || "Sin DNI"}</strong></span>
                                                    <span>•</span>
                                                    {asistio ? (
                                                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                                                            <Check size={14} /> Asistencia Tomada Hoy
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-400">Sin asistencia hoy</span>
                                                    )}
                                                    {checkInReg && (
                                                        <>
                                                            <span>•</span>
                                                            <span className="text-blue-400 font-mono text-[11px] flex items-center gap-1">
                                                                <Smartphone size={13} /> Celular: {checkInReg.deviceId.substring(0, 14)}...
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Botones de Acción */}
                                        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                                            {/* Botón Principal: Destrabar */}
                                            <button
                                                onClick={() => handleDestrabarAlumno(alumno, false)}
                                                disabled={isBusy}
                                                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-black px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-amber-500/20 active:scale-95"
                                                title="Elimina el bloqueo de celular para que pueda escanear de nuevo"
                                            >
                                                <Unlock size={15} />
                                                <span>Destrabar Alumno</span>
                                            </button>

                                            {/* Botón: Destrabar y anular presente */}
                                            {asistio && (
                                                <button
                                                    onClick={() => handleDestrabarAlumno(alumno, true)}
                                                    disabled={isBusy}
                                                    className="inline-flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-red-500/20 text-slate-300 hover:text-red-400 border border-slate-700 px-3 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all active:scale-95"
                                                    title="Destraba el celular y además elimina la asistencia de hoy para rehacer el check-in"
                                                >
                                                    <RotateCcw size={14} />
                                                    <span className="hidden sm:inline">Reiniciar</span>
                                                </button>
                                            )}

                                            {/* Botón: Presente manual directo */}
                                            {!asistio && (
                                                <button
                                                    onClick={() => handlePresenteManual(alumno)}
                                                    disabled={isBusy}
                                                    className="inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-emerald-900/30 active:scale-95"
                                                    title="Marcar presente directamente sin usar celular"
                                                >
                                                    <Check size={15} />
                                                    <span>Presente Manual</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
            </div>

            {/* SECCIÓN 2: Listado en Tiempo Real de Check-ins y Dispositivos de Hoy */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-4">
                    <div>
                        <h2 className="text-lg font-black text-white flex items-center gap-2">
                            <span>📱</span>
                            <span>Dispositivos Registrados Hoy ({checkInsData.total})</span>
                        </h2>
                        <p className="text-xs text-slate-400">
                            Lista de teléfonos que ya completaron check-in en el dojo durante el día de hoy.
                        </p>
                    </div>

                    {checkInsData.total > 0 && (
                        <button
                            onClick={handleLiberarTodos}
                            className="inline-flex items-center justify-center gap-2 bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/40 px-3.5 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-sm active:scale-95"
                        >
                            <Trash2 size={14} />
                            <span>Liberar Todos los Dispositivos</span>
                        </button>
                    )}
                </div>

                {checkInsData.checkIns.length === 0 ? (
                    <div className="p-12 text-center text-slate-500 font-bold text-sm bg-slate-950/40 rounded-2xl border border-slate-800">
                        🥋 Aún no hay check-ins registrados para el día de hoy.
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-2xl border border-slate-800">
                        <table className="w-full text-left text-sm text-slate-300">
                            <thead className="bg-slate-950/80 text-[10px] uppercase font-black tracking-widest text-slate-400 border-b border-slate-800">
                                <tr>
                                    <th className="py-3.5 px-4">Alumno</th>
                                    <th className="py-3.5 px-4">DNI</th>
                                    <th className="py-3.5 px-4">ID Dispositivo</th>
                                    <th className="py-3.5 px-4">Hora</th>
                                    <th className="py-3.5 px-4 text-right">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                                {checkInsData.checkIns.map((item) => {
                                    const hora = item.createdAt 
                                        ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                                        : "Hoy";
                                    
                                    return (
                                        <tr key={item._id} className="hover:bg-slate-900/60 transition-colors">
                                            <td className="py-3 px-4 font-bold text-white flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-lg bg-slate-800 overflow-hidden flex items-center justify-center text-xs font-bold border border-slate-700">
                                                    {item.alumnoId?.fotoUrl ? (
                                                        <img
                                                            src={item.alumnoId.fotoUrl.startsWith("http") ? item.alumnoId.fotoUrl : `${UPLOAD_URL}/${item.alumnoId.fotoUrl}`}
                                                            alt=""
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <span>{item.alumnoNombre?.charAt(0) || "🥋"}</span>
                                                    )}
                                                </div>
                                                <span>{item.alumnoNombre}</span>
                                            </td>
                                            <td className="py-3 px-4 font-mono text-xs text-slate-400">
                                                {item.alumnoId?.dni || "-"}
                                            </td>
                                            <td className="py-3 px-4 font-mono text-xs text-slate-400 truncate max-w-[180px]">
                                                {item.deviceId}
                                            </td>
                                            <td className="py-3 px-4 text-xs font-semibold text-slate-400">
                                                {hora}
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <button
                                                    onClick={() => handleLiberarDispositivo(item)}
                                                    className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-amber-500 hover:text-black text-amber-300 border border-slate-700 hover:border-amber-400 px-3 py-1.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all active:scale-95"
                                                    title="Permite que este celular pueda volver a ser usado hoy"
                                                >
                                                    <Unlock size={13} />
                                                    <span>Liberar</span>
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

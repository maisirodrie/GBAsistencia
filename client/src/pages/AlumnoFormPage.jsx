import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { getAlumno, createAlumno, updateAlumno, deleteAlumno, addAsistencia, removeAsistencia, descargarPDF, uploadFoto } from "../api/alumnos";
import { UPLOAD_URL } from "../api/axios";
import { showAlert, showToast } from "../utils/alerts";
import CartaoFrequencia from "../components/CartaoFrequencia";
import ProgresoChart from "../components/ProgresoChart";
import QRModal from "../components/QRModal";
import PhotoCropModal from "../components/PhotoCropModal";
import { format } from "date-fns";
import { FAJAS_POR_CATEGORIA } from "../utils/fajas";
import Swal from "sweetalert2";

const MESES_ES = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

function toLocal(iso) {
    const d = new Date(iso);
    return new Date(d.getTime() + d.getTimezoneOffset() * 60000);
}

export default function AlumnoFormPage() {
    const { register, handleSubmit, setValue, watch } = useForm();
    const navigate = useNavigate();
    const { id } = useParams();
    const [asistencias, setAsistencias] = useState([]);
    const [fechaManual, setFechaManual] = useState(format(new Date(), "yyyy-MM-dd"));
    const [anioFicha, setAnioFicha] = useState(new Date().getFullYear().toString());
    const [guardado, setGuardado] = useState(false);
    const [cargando, setCargando] = useState(!!id);
    const [showQR, setShowQR] = useState(false);
    const [imageToCrop, setImageToCrop] = useState(null);
    const [categoria, setCategoria] = useState('Adulto');
    const fileInputRef = useRef(null);
    const cameraInputRef = useRef(null);

    const handlePhotoClick = async () => {
        if (!id) return showAlert({ title: "Atención", text: "Guardá el alumno primero antes de subir su foto.", icon: "info" });
        
        const result = await Swal.fire({
            title: 'Actualizar Foto',
            text: '¿Cómo deseas subir la foto?',
            icon: 'question',
            showCancelButton: true,
            showDenyButton: true,
            confirmButtonText: '📷 Tomar Foto',
            denyButtonText: '🖼️ Galería',
            cancelButtonText: 'Cancelar',
            background: '#0f172a',
            color: '#f8fafc',
            confirmButtonColor: '#e11d48',
            denyButtonColor: '#2563eb',
            cancelButtonColor: '#334155',
            customClass: {
                popup: 'rounded-[2rem] border border-slate-800',
                confirmButton: 'rounded-xl px-4 py-3 font-black uppercase text-xs',
                denyButton: 'rounded-xl px-4 py-3 font-black uppercase text-xs',
                cancelButton: 'rounded-xl px-4 py-3 font-black uppercase text-xs'
            }
        });

        if (result.isConfirmed) {
            cameraInputRef.current?.click();
        } else if (result.isDenied) {
            fileInputRef.current?.click();
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file || !id) return;
        const reader = new FileReader();
        reader.addEventListener("load", () => setImageToCrop(reader.result));
        reader.readAsDataURL(file);
    };

    const handleCropComplete = async (croppedFile) => {
        setImageToCrop(null);
        const formData = new FormData();
        formData.append("foto", croppedFile);
        try {
            const res = await uploadFoto(id, formData);
            setValue("fotoUrl", res.data.fotoUrl);
            showToast("Foto de perfil actualizada");
        } catch (error) {
            showAlert({ title: "Error", text: error.response?.data?.message || "Error al subir foto", icon: "error" });
        }
    };

    /* Cargar alumno */
    useEffect(() => {
        if (!id) { setCargando(false); return; }
        (async () => {
            const { data } = await getAlumno(id);
            setValue("nombre", data.nombre);
            setValue("apellido", data.apellido || "");
            setValue("celular", data.celular || "");
            setValue("faja", data.faja ?? "Branca");
            setValue("grado", String(data.grado ?? 0));
            setValue("clasesParaGraduacion", data.clasesParaGraduacion || 30);
            setValue("trackProgreso", data.trackProgreso ?? true);
            setValue("fotoUrl", data.fotoUrl || "");
            setCategoria(data.categoria || 'Adulto');
            if (data.ultimaGraduacion) {
                const local = toLocal(data.ultimaGraduacion);
                setValue("ultimaGraduacion", format(local, "yyyy-MM-dd"));
            }
            setAsistencias(data.asistencias ?? []);
            setCargando(false);
        })();
    }, [id, setValue]);

    /* Guardar */
    const onSubmit = handleSubmit(async (data) => {
        if (id) {
            try {
                await updateAlumno(id, { ...data, categoria });
                showToast("Alumno actualizado correctamente");
                setGuardado(true);
                setTimeout(() => setGuardado(false), 2500);
            } catch (error) {
                showAlert({
                    title: "Error",
                    text: "No se pudo actualizar el alumno.",
                    icon: "error"
                });
            }
        } else {
            try {
                const { data: nuevo } = await createAlumno({ ...data, categoria });
                showToast("Alumno creado correctamente");
                navigate(`/editar/${nuevo._id}`);
            } catch (error) {
                showAlert({
                    title: "Error",
                    text: error.response?.data?.[0] || "No se pudo crear el alumno.",
                    icon: "error"
                });
            }
        }
    });

    /* Sincronizar UI con datos del servidor tras modificar asistencias */
    const syncAlumnoData = (data) => {
        setAsistencias(data.asistencias);
        setValue("grado", String(data.grado ?? 0));
        if (data.ultimaGraduacion) {
            const local = toLocal(data.ultimaGraduacion);
            setValue("ultimaGraduacion", format(local, "yyyy-MM-dd"));
        } else {
            setValue("ultimaGraduacion", "");
        }
    };

    /* Asistencia */
    async function marcarHoy() {
        if (!id) return showAlert({ title: "Atención", text: "Guarda el alumno primero.", icon: "info" });
        try {
            await updateAlumno(id, watch());
            const { data } = await addAsistencia(id, new Date());
            syncAlumnoData(data);
            showToast("Asistencia (Hoy) registrada");
        } catch (e) {
            showAlert({ title: "Error", text: e.response?.data?.message ?? "Error", icon: "error" });
        }
    }

    async function marcarFecha() {
        if (!id) return showAlert({ title: "Atención", text: "Guarda el alumno primero.", icon: "info" });
        try {
            await updateAlumno(id, watch());
            const { data } = await addAsistencia(id, new Date(fechaManual + "T12:00:00"));
            syncAlumnoData(data);
            showToast("Asistencia manual registrada");
        } catch (e) {
            showAlert({ title: "Error", text: e.response?.data?.message ?? "Error", icon: "error" });
        }
    }

    async function eliminarAsistencia(fecha) {
        const confirm = await showAlert({
            title: "¿Eliminar asistencia?",
            text: "¿Estás seguro de que quieres borrar este registro?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Sí, borrar"
        });

        if (confirm.isConfirmed) {
            try {
                await updateAlumno(id, watch());
                const { data } = await removeAsistencia(id, fecha);
                syncAlumnoData(data);
                showToast("Asistencia eliminada", "info");
            } catch (e) {
                showAlert({ title: "Error", text: e.response?.data?.message ?? "Error", icon: "error" });
            }
        }
    }

    async function onDelete() {
        const confirm = await showAlert({
            title: "¿Eliminar alumno?",
            text: "Esta acción borrará permanentemente el perfil y todo su historial.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Sí, eliminar",
            cancelButtonText: "Cancelar"
        });

        if (confirm.isConfirmed) {
            try {
                await deleteAlumno(id);
                showToast("Alumno eliminado");
                navigate("/");
            } catch (error) {
                showAlert({ title: "Error", text: "No se pudo eliminar al alumno.", icon: "error" });
            }
        }
    }

    /* Agrupar asistencias por año/mes */
    const agrupadas = asistencias.reduce((acc, iso) => {
        const ld = toLocal(iso);
        const anio = ld.getFullYear();
        const mes = ld.getMonth();
        if (!acc[anio]) acc[anio] = {};
        if (!acc[anio][mes]) acc[anio][mes] = [];
        acc[anio][mes].push({ iso, dia: ld.getDate() });
        return acc;
    }, {});

    /* Asistencias válidas para la próxima graduación */
    const strUg = watch("ultimaGraduacion");
    const asistenciasValidas = strUg
        ? asistencias.filter(iso => {
            const ld = toLocal(iso);
            const strF = `${ld.getFullYear()}-${String(ld.getMonth() + 1).padStart(2, '0')}-${String(ld.getDate()).padStart(2, '0')}`;
            return strF >= strUg;
        })
        : asistencias;

    if (cargando) return (
        <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-slate-500 font-bold bg-slate-800/50 px-6 py-3 rounded-full animate-pulse border border-slate-700">Cargando perfil…</div>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-12 animate-in fade-in duration-500">
            {/* Header / Top Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/40 p-3 sm:p-4 rounded-3xl border border-slate-800 backdrop-blur-md shadow-lg">
                <button
                    onClick={() => navigate("/")}
                    className="flex items-center gap-2 text-slate-400 hover:text-white transition-all text-sm font-bold bg-slate-800/50 hover:bg-slate-700/80 px-5 py-2.5 rounded-2xl"
                >
                    <span aria-hidden="true" className="text-lg">&larr;</span> Volver al listado
                </button>
                <div className="flex gap-3 w-full sm:w-auto">
                    {id && (
                        <button
                            onClick={() => descargarPDF(id, `${watch("nombre") || ""} ${watch("apellido") || ""}`.trim())}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-5 py-2.5 rounded-2xl text-sm font-bold transition-all border border-slate-700 shadow-sm"
                        >
                            🖨️ <span className="hidden sm:inline">Imprimir Cartón</span>
                        </button>
                    )}
                    {id && (
                        <button
                            onClick={onDelete}
                            className="bg-slate-800/50 hover:bg-red-900/40 text-slate-400 hover:text-red-400 p-2.5 rounded-2xl border border-slate-700 transition-all active:scale-95"
                            title="Borrar Alumno"
                        >
                            🗑
                        </button>
                    )}
                    <button
                        onClick={onSubmit}
                        className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-bold transition-all shadow-lg ${
                            guardado 
                            ? "bg-green-500 hover:bg-green-400 text-white shadow-green-500/20" 
                            : "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-red-600/20 border border-red-500/50"
                        }`}
                    >
                        {guardado ? "✓ Guardado!" : (id ? "Guardar Cambios" : "Crear Alumno")}
                    </button>
                </div>
            </div>

            {/* Dos grandes columnas */}
            <div className="grid lg:grid-cols-12 gap-6 lg:gap-8">
                
                {/* PANEL IZQUIERDO: PERFIL DEL ALUMNO */}
                <div className="lg:col-span-7 bg-slate-800/30 backdrop-blur-2xl rounded-[2rem] p-6 text-white sm:p-8 border border-slate-700/50 shadow-2xl flex flex-col gap-6 relative overflow-hidden">
                    {/* Glow effect */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-slate-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>

                    <div className="flex items-center gap-5 border-b border-slate-700/40 pb-6 relative z-10">
                        <div 
                            className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center text-3xl shadow-inner flex-shrink-0 border border-slate-600/50 cursor-pointer overflow-hidden group"
                            onClick={handlePhotoClick}
                        >
                            {watch("fotoUrl") ? (
                                <img src={watch("fotoUrl").startsWith('http') ? watch("fotoUrl") : `${UPLOAD_URL}/${watch("fotoUrl")}`} alt="Perfil" className="w-full h-full object-cover" />
                            ) : (
                                <span>{watch("nombre")?.charAt(0)?.toUpperCase() || "👤"}</span>
                            )}
                            {id && (
                                <div className="absolute inset-0 bg-black/60 hidden group-hover:flex items-center justify-center transition-all backdrop-blur-sm">
                                    <span className="text-white text-xs font-bold text-center leading-tight tracking-wider">Cambiar<br/>Foto</span>
                                </div>
                            )}
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                            <input type="file" ref={cameraInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleFileChange} />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-2xl font-black tracking-tight">Datos del Alumno</h2>
                                {/* {id && (
                                    <button 
                                        onClick={() => setShowQR(true)}
                                        className="bg-blue-600/20 text-blue-400 border border-blue-500/20 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-600/30 transition-all flex items-center gap-1.5"
                                    >
                                        <span className="text-xs">📱</span> QR
                                    </button>
                                )} */}
                            </div>
                            <p className="text-sm text-slate-400 font-medium mt-0.5">Información principal y progreso</p>
                        </div>
                    </div>

                    <div className="space-y-6 relative z-10">
                        {/* Categoría */}
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Categoría</label>
                            <div className="flex gap-3">
                                {['Adulto', 'Infantil'].map(cat => (
                                    <button
                                        key={cat}
                                        type="button"
                                        onClick={() => {
                                            setCategoria(cat);
                                            setValue('faja', FAJAS_POR_CATEGORIA[cat][0]);
                                        }}
                                        className={`flex-1 py-3 rounded-2xl text-sm font-black transition-all border ${
                                            categoria === cat
                                                ? cat === 'Infantil'
                                                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/50'
                                                    : 'bg-blue-500/20 text-blue-400 border-blue-500/50'
                                                : 'bg-slate-900/60 text-slate-500 border-slate-700/60 hover:border-slate-600'
                                        }`}
                                    >
                                        {cat === 'Infantil' ? '👦 Infantil (hasta 15)' : '🥋 Adulto (16+)'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Seguimiento de Graduación Toggle */}
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Sistema de Graduación</label>
                            <div className="flex items-center gap-4 bg-slate-900/40 p-4 rounded-2xl border border-slate-700/40 hover:border-slate-600/60 transition-all cursor-pointer shadow-md" onClick={() => setValue("trackProgreso", watch("trackProgreso") === false ? true : false)}>
                                <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${watch("trackProgreso") !== false ? 'bg-red-600' : 'bg-slate-700'}`}>
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${watch("trackProgreso") !== false ? 'translate-x-6' : 'translate-x-1'}`} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-white tracking-wide">Seguimiento Automático</span>
                                    <span className="text-[10px] text-slate-400 font-medium">Habilitar cálculo de grados y barra de progreso</span>
                                </div>
                                <input type="checkbox" className="hidden" {...register("trackProgreso")} />
                            </div>
                        </div>

                        {/* Nombre y Apellido */}
                        <div className="grid sm:grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Nombre</label>
                                <input
                                    type="text"
                                    placeholder="Ej: Juan"
                                    className="w-full bg-slate-900/60 border border-slate-700/60 rounded-2xl px-5 py-3.5 text-white outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all font-semibold shadow-inner"
                                    {...register("nombre", { required: true })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Apellido</label>
                                <input
                                    type="text"
                                    placeholder="Ej: Pérez"
                                    className="w-full bg-slate-900/60 border border-slate-700/60 rounded-2xl px-5 py-3.5 text-white outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all font-semibold shadow-inner"
                                    {...register("apellido")}
                                />
                            </div>
                        </div>

                        {/* Celular */}
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Celular (WhatsApp)</label>
                            <input
                                type="text"
                                placeholder="Ej: +54 9 11 1234-5678"
                                className="w-full bg-slate-900/60 border border-slate-700/60 rounded-2xl px-5 py-3.5 text-white outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all font-semibold shadow-inner"
                                {...register("celular")}
                            />
                        </div>

                        {/* Fila Faja / Grado */}
                        <div className="grid sm:grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Faixa (Cinturão)</label>
                                <div className="relative">
                                    <select
                                        className="w-full bg-slate-900/60 border border-slate-700/60 rounded-2xl px-5 py-3.5 text-white outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all font-semibold appearance-none shadow-inner"
                                        {...register("faja")}
                                    >
                                        {FAJAS_POR_CATEGORIA[categoria].map(f => (
                                            <option key={f}>{f}</option>
                                        ))}
                                    </select>
                                    <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">▼</div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Grau (Listras)</label>
                                <div className="relative">
                                    <select
                                        className="w-full bg-slate-900/60 border border-slate-700/60 rounded-2xl px-5 py-3.5 text-white outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all font-semibold appearance-none shadow-inner"
                                        {...register("grado")}
                                    >
                                        {[0, 1, 2, 3, 4].map(g => <option key={g} value={g}>{g === 0 ? 'Sem Grau' : `${g}º Grau`}</option>)}
                                    </select>
                                    <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">▼</div>
                                </div>
                            </div>
                        </div>

                        {/* Fila Fecha / Metas */}
                        <div className="grid sm:grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <div className="flex justify-between items-end pl-1 pr-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Última Grad.</label>
                                    <button 
                                        type="button" 
                                        onClick={() => setValue("ultimaGraduacion", "")}
                                        className="text-[10px] uppercase font-bold text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                                    >
                                        Borrar
                                    </button>
                                </div>
                                <input
                                    type="date"
                                    className="w-full bg-slate-900/60 border border-slate-700/60 rounded-2xl px-5 py-3.5 text-white outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all font-semibold shadow-inner [color-scheme:dark]"
                                    {...register("ultimaGraduacion")}
                                />
                            </div>
                            {watch("trackProgreso") !== false && (
                                <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Req. p/ Graduar (Clases)</label>
                                    <input
                                        type="number"
                                        placeholder="Por defecto: 30"
                                        className="w-full bg-slate-900/60 border border-slate-700/60 rounded-2xl px-5 py-3.5 text-white outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all font-semibold shadow-inner"
                                        {...register("clasesParaGraduacion", { valueAsNumber: true })}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Progreso Visual */}
                        {id && watch("trackProgreso") !== false && (
                            <div className="pt-8 animate-in zoom-in-95 duration-500">
                                {(() => {
                                    const reqBase = watch("clasesParaGraduacion") || 30;
                                    const gradoActual = parseInt(watch("grado") || 0, 10);
                                    
                                    // Si la fecha es futura, la ignoramos para el cálculo de progreso (fail-safe)
                                    const strUg = watch("ultimaGraduacion");
                                    const isFuture = strUg && (new Date(strUg + "T12:00:00") > new Date());
                                    
                                    const validasoAcumuladas = (strUg && !isFuture) ? asistenciasValidas.length : asistencias.length;
                                    
                                    // Usamos el residuo (%) para que el progreso sea siempre relativo al próximo grado/faja
                                    // Si tiene grado 4, el progreso es hacia la faja. 
                                    // Si tiene grado 0-3, es hacia la siguiente raya.
                                    const clasesProgreso = validasoAcumuladas % reqBase;
                                    const pct = Math.min((clasesProgreso / reqBase) * 100, 100);
                                    
                                    return (
                                        <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-700/50 shadow-inner">
                                            <div className="flex justify-between items-end mb-4">
                                                <div>
                                                    <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-[0.2em] mb-1.5">PROGRESO ACTUAL</p>
                                                    <p className="text-lg font-black text-white">Hacia {gradoActual < 4 ? `Grado ${gradoActual + 1}` : "Nueva Faja"}</p>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-3xl font-black text-white">{clasesProgreso}</span>
                                                    <span className="text-sm text-slate-400 font-bold ml-1">/ {reqBase}</span>
                                                </div>
                                            </div>
                                            <div className="h-3.5 bg-slate-950 rounded-full overflow-hidden border border-black/30 shadow-inner">
                                                <div
                                                    className="h-full bg-gradient-to-r from-red-600 to-rose-400 rounded-full transition-all duration-700 ease-out shadow-[0_0_15px_rgba(225,29,72,0.4)]"
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                            <p className="text-xs text-slate-500 mt-4 font-medium text-center">
                                                {strUg && !isFuture 
                                                    ? `Clases desde última graduación: ${asistenciasValidas.length}` 
                                                    : `Total de clases acumuladas: ${asistencias.length}`}
                                            </p>
                                        </div>
                                    );
                                })()}
                            </div>
                        )}
                    </div>
                </div>

                {/* PANEL DERECHO: TOMA DE ASISTENCIA */}
                {id && (
                    <div className="lg:col-span-5 flex flex-col gap-6 lg:gap-8">
                        
                        {/* Widget de Acción Rápida */}
                        <div className="bg-gradient-to-br from-blue-900/40 to-slate-900/60 backdrop-blur-xl rounded-[2rem] p-6 sm:p-8 border border-blue-500/20 shadow-2xl relative overflow-hidden">
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
                            
                            <h2 className="text-xl font-black text-white tracking-tight mb-6 flex items-center gap-2">
                                <span className="bg-slate-700/50 text-slate-400 p-2 rounded-xl py-1.5 leading-none shadow-inner border border-slate-700/10">📅</span>
                                Historial Manual
                            </h2>

                            <div className="relative z-10">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2 pl-1">Agregar fecha específica</label>
                                <div className="flex gap-2">
                                    <input
                                        type="date"
                                        className="flex-1 bg-slate-900/80 border border-slate-700/60 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-semibold shadow-inner [color-scheme:dark]"
                                        value={fechaManual}
                                        onChange={e => setFechaManual(e.target.value)}
                                    />
                                    <button
                                        onClick={marcarFecha}
                                        className="bg-slate-700/80 hover:bg-slate-600 text-white px-5 py-3 rounded-xl text-sm font-bold transition-all border border-slate-600 shadow-sm active:scale-95"
                                    >
                                        Agregar
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Historial Interactivo */}
                        <div className="bg-slate-800/30 backdrop-blur-xl rounded-[2rem] p-6 border border-slate-700/50 shadow-xl flex-1 flex flex-col max-h-[420px]">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-5 flex items-center justify-between pl-1 pr-1 border-b border-slate-700/50 pb-4">
                                Historial de Clases
                                <span className="bg-slate-800 border border-slate-700 text-slate-300 py-1 px-3 rounded-full text-[10px] shadow-inner font-bold">{asistencias.length} TOTALES</span>
                            </h3>
                            
                            <div className="space-y-6 overflow-y-auto pr-3 custom-scrollbar flex-1 pb-4">
                                {Object.keys(agrupadas).sort((a, b) => b - a).map(anio => (
                                    <div key={anio}>
                                        <div className="inline-block bg-slate-900/80 border border-slate-700 px-3 py-1 rounded-lg mb-3">
                                            <p className="text-xs text-white font-black tracking-widest">{anio}</p>
                                        </div>
                                        <div className="space-y-5">
                                            {Object.keys(agrupadas[anio]).sort((a, b) => b - a).map(mes => (
                                                <div key={mes} className="pl-2 border-l-2 border-slate-700/50 relative">
                                                    <div className="absolute w-2 h-2 rounded-full bg-blue-500 -left-[5px] top-1"></div>
                                                    <p className="text-[10px] text-blue-400 font-black uppercase mb-2 ml-2 tracking-widest">{MESES_ES[mes]}</p>
                                                    <div className="flex flex-wrap gap-2 ml-2">
                                                        {agrupadas[anio][mes].sort((a, b) => a.dia - b.dia).map(({ iso, dia }) => (
                                                            <button
                                                                key={iso}
                                                                onClick={() => eliminarAsistencia(iso)}
                                                                title="Eliminar asistencia"
                                                                className="group relative flex items-center justify-center w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-600 hover:border-red-500 text-sm font-bold text-slate-300 transition-all shadow-sm overflow-hidden"
                                                            >
                                                                <span className="group-hover:-translate-y-8 transition-transform duration-300">
                                                                    {String(dia).padStart(2, "0")}
                                                                </span>
                                                                <span className="absolute inset-0 flex items-center justify-center bg-red-500/20 text-red-500 translate-y-8 group-hover:translate-y-0 transition-transform duration-300">
                                                                    ✕
                                                                </span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                                {asistencias.length === 0 && (
                                    <div className="h-full flex flex-col items-center justify-center pt-8 opacity-50">
                                        <span className="text-4xl mb-2">👻</span>
                                        <p className="text-white text-sm font-bold">Sin asistencias aún</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ── GRÁFICO DE PROGRESO (ancho completo) ── */}
            {id && asistencias.length > 0 && (
                <div className="bg-slate-800/30 backdrop-blur-xl rounded-[2rem] p-6 sm:p-8 border border-slate-700/50 shadow-2xl animate-in fade-in duration-700">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700/50 pb-4 mb-6">
                        <h3 className="text-sm font-black text-white flex items-center gap-2">
                            <span className="bg-blue-500/20 text-blue-400 p-2 rounded-xl leading-none border border-blue-500/20">📈</span>
                            Progreso de Entrenamiento
                        </h3>
                        <span className="text-xs text-slate-400 bg-slate-900/60 px-3 py-1 rounded-full border border-slate-700/50 font-bold">{anioFicha}</span>
                    </div>
                    <ProgresoChart
                        asistencias={asistencias}
                        anio={Number(anioFicha)}
                        clasesObjetivo={Number(watch("clasesParaGraduacion") || 30)}
                    />
                </div>
            )}

            {/* VISTA PREVIA DEL CARTÓN */}
            {id && (
                <div className="bg-slate-800/30 backdrop-blur-2xl rounded-[2rem] p-6 sm:p-8 border border-slate-700/50 shadow-2xl mt-4 relative overflow-hidden">
                    {/* Background decoration */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-red-500 opacity-30"></div>
                    
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                        <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-3">
                            <span className="bg-slate-800 border border-slate-700 p-2.5 rounded-xl leading-none text-xl shadow-inner">🖨️</span>
                            Vista Previa de Ficha
                        </h2>
                        <div className="flex items-center gap-3 bg-slate-900/60 px-4 py-2 rounded-xl border border-slate-700/50 shadow-inner">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Año a visualizar:</label>
                            <select 
                                value={anioFicha}
                                onChange={e => setAnioFicha(e.target.value)}
                                className="bg-transparent border-none outline-none focus:ring-0 text-sm font-black text-white cursor-pointer"
                            >
                                {Array.from(new Set([...Object.keys(agrupadas), new Date().getFullYear().toString()]))
                                    .sort((a, b) => b - a)
                                    .map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                    </div>
                    
                    <div className="relative group">
                        {/* Indicadores de Scroll Movil */}
                        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#0B1120] to-transparent z-10 pointer-events-none sm:hidden opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#0B1120] to-transparent z-10 pointer-events-none sm:hidden opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        
                        <div className="bg-[#0B1120] p-4 sm:p-6 rounded-2xl border border-slate-800 overflow-x-auto custom-scrollbar shadow-inner relative">
                            <div className="min-w-[850px] flex justify-center py-2 sm:py-4">
                                <CartaoFrequencia
                                    asistencias={asistencias.filter(iso => toLocal(iso).getFullYear().toString() === anioFicha)}
                                    alumnoNombre={`${watch("nombre") || ""} ${watch("apellido") || ""}`.trim()}
                                    faja={watch("faja")}
                                    grado={watch("grado")}
                                    ultimaGraduacion={watch("ultimaGraduacion")}
                                />
                            </div>
                        </div>
                        <p className="sm:hidden text-center text-[10px] text-slate-500 font-bold mt-3 uppercase tracking-widest animate-pulse">
                            ↔ Desliza para ver ficha completa ↔
                        </p>
                    </div>
                </div>
            )}

            {id && (
                <QRModal 
                    show={showQR} 
                    onClose={() => setShowQR(false)} 
                    alumnoId={id}
                    alumnoNombre={`${watch("nombre") || ""} ${watch("apellido") || ""}`.trim()}
                    alumnoCelular={watch("celular")}
                />
            )}

            {imageToCrop && (
                <PhotoCropModal
                    image={imageToCrop}
                    onCropComplete={handleCropComplete}
                    onCancel={() => setImageToCrop(null)}
                />
            )}
        </div>
    );
}

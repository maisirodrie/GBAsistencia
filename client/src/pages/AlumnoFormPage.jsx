import { useEffect, useState, useRef } from "react";
import { getFechaInicioFaja, getFechaUltimoGrado, evaluarGraduacion } from "../constants/graduation";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { getAlumno, createAlumno, updateAlumno, deleteAlumno, addAsistencia, removeAsistencia, descargarPDF, uploadFoto, revertPromotion } from "../api/alumnos";
import { UPLOAD_URL } from "../api/axios";
import { showAlert, showToast } from "../utils/alerts";
import CartaoFrequencia from "../components/CartaoFrequencia";
import ProgresoChart from "../components/ProgresoChart";
import QRModal from "../components/QRModal";
import PhotoCropModal from "../components/PhotoCropModal";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { FAJAS_POR_CATEGORIA } from "../utils/fajas";
import Swal from "sweetalert2";
import { useAuth } from "../context/AuthContext";

const MESES_ES = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

function toLocal(iso) {
    const d = new Date(iso);
    return new Date(d.getTime() + d.getTimezoneOffset() * 60000);
}

export default function AlumnoFormPage() {
    const { register, handleSubmit, setValue, watch, getValues, reset } = useForm();
    const { user } = useAuth();
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
    const [alumnoData, setAlumnoData] = useState(null);
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
            setAlumnoData(data);
            setValue("nombre", data.nombre);
            setValue("apellido", data.apellido || "");
            setValue("celular", data.celular || "");
            setValue("faja", data.faja ?? "Branca");
            setValue("grado", String(data.grado ?? 0));
            if (data.fechaNacimiento) {
                const localBirth = toLocal(data.fechaNacimiento);
                setValue("fechaNacimiento", format(localBirth, "yyyy-MM-dd"));
            } else {
                setValue("fechaNacimiento", "");
            }
            setValue("trackProgreso", data.trackProgreso ?? true);
            setValue("fotoUrl", data.fotoUrl || "");
            setValue("frecuenciaSemanal", data.frecuenciaSemanal ?? 3);
            setValue("clasesParaGraduacion", data.clasesParaGraduacion ?? 30);
            setValue("diasParaGraduacion", data.diasParaGraduacion ?? "");
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
        setAlumnoData(data);
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

    async function handleRevertPromotion() {
        const confirm = await showAlert({
            title: "¿Deshacer graduación?",
            text: "Se restaurará el cinturón, grado y fecha de graduación anterior. Esta acción borrará el último registro del historial.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Sí, deshacer"
        });

        if (confirm.isConfirmed) {
            try {
                const { data } = await revertPromotion(id);
                syncAlumnoData(data);
                // Actualizar los campos del formulario para reflejar la reversión
                setValue("faja", data.faja);
                setValue("grado", data.grado);
                setValue("ultimaGraduacion", data.ultimaGraduacion ? new Date(data.ultimaGraduacion).toISOString().split('T')[0] : "");
                showToast("Graduación revertida correctamente", "info");
            } catch (e) {
                showAlert({ title: "Error", text: e.response?.data?.message ?? "Error", icon: "error" });
            }
        }
    }



    async function eliminarHistorial(index) {
        const confirm = await showAlert({
            title: "¿Eliminar registro?",
            text: "Se eliminará esta entrada del historial de graduaciones.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Sí, eliminar",
            cancelButtonText: "Cancelar"
        });

        if (confirm.isConfirmed) {
            try {
                const historico = [...(alumnoData.historicoGraduaciones || [])];
                historico.splice(index, 1);
                const { data } = await updateAlumno(id, {
                    ...getValues(),
                    categoria,
                    historicoGraduaciones: historico
                });
                syncAlumnoData(data);
                showToast("Registro eliminado del historial", "info");
            } catch (e) {
                showAlert({ title: "Error", text: e.response?.data?.message ?? "Error", icon: "error" });
            }
        }
    }

    async function agregarHistorial() {
        const { value: formValues } = await Swal.fire({
            title: 'Agregar Graduación Histórica',
            html: `
                <div style="text-align: left; display: flex; flex-direction: column; gap: 15px;">
                    <div>
                        <label style="display: block; font-size: 11px; font-weight: 900; text-transform: uppercase; color: #94a3b8; margin-bottom: 5px;">Cinturón</label>
                        <select id="swal-faja" class="swal2-select" style="margin: 0; width: 100%; box-sizing: border-box; background: #0f172a; color: #f8fafc; border: 1px solid #334155; border-radius: 8px; padding: 8px;">
                            <option value="Branca">Blanco</option>
                            <option value="Azul" selected>Azul</option>
                            <option value="Roxa">Morado (Roxa)</option>
                            <option value="Marrom">Marrón (Marrom)</option>
                            <option value="Preta">Negro (Preta)</option>
                        </select>
                    </div>
                    <div>
                        <label style="display: block; font-size: 11px; font-weight: 900; text-transform: uppercase; color: #94a3b8; margin-bottom: 5px;">Grado</label>
                        <select id="swal-grado" class="swal2-select" style="margin: 0; width: 100%; box-sizing: border-box; background: #0f172a; color: #f8fafc; border: 1px solid #334155; border-radius: 8px; padding: 8px;">
                            <option value="0">Sin Grado</option>
                            <option value="1">1º Grado</option>
                            <option value="2">2º Grado</option>
                            <option value="3">3º Grado</option>
                            <option value="4">4º Grado</option>
                        </select>
                    </div>
                    <div>
                        <label style="display: block; font-size: 11px; font-weight: 900; text-transform: uppercase; color: #94a3b8; margin-bottom: 5px;">Fecha de Promoción</label>
                        <input id="swal-fecha" type="date" class="swal2-input" style="margin: 0; width: 100%; box-sizing: border-box; background: #0f172a; color: #f8fafc; border: 1px solid #334155; border-radius: 8px; padding: 8px; color-scheme: dark;" value="2025-05-20">
                    </div>
                </div>
            `,
            focusConfirm: false,
            background: '#0f172a',
            color: '#f8fafc',
            confirmButtonColor: '#2563eb',
            confirmButtonText: 'Guardar Registro',
            showCancelButton: true,
            cancelButtonText: 'Cancelar',
            cancelButtonColor: '#334155',
            preConfirm: () => {
                const faja = document.getElementById('swal-faja').value;
                const grado = parseInt(document.getElementById('swal-grado').value);
                const fecha = document.getElementById('swal-fecha').value;
                if (!fecha) {
                    Swal.showValidationMessage('Debes ingresar una fecha válida');
                    return false;
                }
                return { faja, grado, fecha };
            }
        });

        if (formValues) {
            const { faja, grado, fecha } = formValues;
            const historico = [...(alumnoData.historicoGraduaciones || [])];
            historico.push({
                faja,
                grado,
                ultimaGraduacion: new Date(fecha),
                fechaClasePromocion: new Date(fecha)
            });

            historico.sort((a, b) => new Date(a.fechaClasePromocion) - new Date(b.fechaClasePromocion));

            try {
                const { data } = await updateAlumno(id, {
                    ...getValues(),
                    categoria,
                    historicoGraduaciones: historico
                });
                syncAlumnoData(data);
                showToast("Registro agregado al historial", "success");
            } catch (e) {
                showAlert({ title: "Error", text: e.response?.data?.message ?? "Error", icon: "error" });
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
    /* Asistencias desde inicio de faja (acumulativo por cinturón) */
    const asistenciasValidas = (() => {
        if (!alumnoData) return asistencias;
        const fif = getFechaInicioFaja(alumnoData);
        const fifL = new Date(fif.getTime() + fif.getTimezoneOffset() * 60000);
        const strFif = `${fifL.getFullYear()}-${String(fifL.getMonth() + 1).padStart(2, '0')}-${String(fifL.getDate()).padStart(2, '0')}`;
        return asistencias.filter(iso => {
            const ld = toLocal(iso);
            const strF = `${ld.getFullYear()}-${String(ld.getMonth() + 1).padStart(2, '0')}-${String(ld.getDate()).padStart(2, '0')}`;
            return strF >= strFif;
        });
    })();

    if (cargando) return (
        <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-slate-500 font-bold bg-slate-800/50 px-6 py-3 rounded-full animate-pulse border border-slate-700">Cargando perfil…</div>
        </div>
    );

    // Motor de Graduación Gracie Barra (Cálculo a nivel de componente para evitar problemas de ámbito)
    const currentFaja = watch("faja") || (alumnoData ? alumnoData.faja : "Branca");
    const currentGrado = parseInt(watch("grado")) || 0;

    const fechaInicioFajaVal = alumnoData ? getFechaInicioFaja(alumnoData) : new Date();
    const fechaUltimoGradoVal = alumnoData ? getFechaUltimoGrado(alumnoData) : new Date();

    const evaluacion = evaluarGraduacion({
        cinturon_actual: currentFaja,
        grado_actual: currentGrado,
        fecha_ultimo_grado: fechaUltimoGradoVal,
        fecha_inicio_faja: fechaInicioFajaVal,
        fecha_nacimiento: watch("fechaNacimiento"),
        asistencias: asistencias,
        frecuencia_semanal: watch("frecuenciaSemanal") || (alumnoData ? alumnoData.frecuenciaSemanal : 2),
        clases_para_graduacion: watch("clasesParaGraduacion"),
        dias_para_graduacion: watch("diasParaGraduacion")
    });

    const listo = evaluacion.elegible;
    const pctClases = evaluacion.contadores_visuales?.grado 
        ? evaluacion.contadores_visuales.grado.porcentaje 
        : (evaluacion.clases_requeridas > 0 
            ? Math.min(evaluacion.clases_acumuladas / evaluacion.clases_requeridas, 1) * 100 
            : 100);
    const pctTiempo = evaluacion.contadores_visuales?.permanencia 
        ? evaluacion.contadores_visuales.permanencia.porcentaje 
        : (evaluacion.dias_requeridos > 0 
            ? Math.min(evaluacion.dias_transcurridos / evaluacion.dias_requeridos, 1) * 100 
            : 100);

    const clasesListas = pctClases >= 100;
    const tiempoListo = pctTiempo >= 100;

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
                    {id && ['Admin', 'Encargado'].includes(user?.role) && (
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
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onClick={e => e.stopPropagation()} onChange={handleFileChange} />
                            <input type="file" ref={cameraInputRef} className="hidden" accept="image/*" capture="environment" onClick={e => e.stopPropagation()} onChange={handleFileChange} />
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
                            <div className="flex flex-col sm:flex-row gap-3">
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

                        {/* Fecha de Nacimiento & Frecuencia Semanal */}
                        <div className="grid sm:grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Fecha de Nacimiento</label>
                                <input
                                    type="date"
                                    className="w-full bg-slate-900/60 border border-slate-700/60 rounded-2xl px-5 py-3.5 text-white outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all font-semibold shadow-inner [color-scheme:dark]"
                                    {...register("fechaNacimiento")}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Frecuencia Semanal Real</label>
                                <div className="w-full h-[54px] flex items-center justify-between px-5 bg-[#131926] border border-[#222f47] rounded-2xl text-slate-300 font-semibold shadow-inner">
                                    <span>🥋 Historial real:</span>
                                    <span className="text-blue-400 font-black">{id ? `${evaluacion.frecuencia_semanal_real} clases/semana` : "Auto-calculada"}</span>
                                </div>
                            </div>
                        </div>

                        {/* Fila Faja / Grado */}
                        <div className="grid sm:grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Cinturón (Faja)</label>
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
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Grado (Rayas)</label>
                                <div className="relative">
                                    <select
                                        className="w-full bg-slate-900/60 border border-slate-700/60 rounded-2xl px-5 py-3.5 text-white outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all font-semibold appearance-none shadow-inner"
                                        {...register("grado")}
                                    >
                                        {[0, 1, 2, 3, 4].map(g => <option key={g} value={g}>{g === 0 ? 'Sin Grado' : `${g}º Grado`}</option>)}
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
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Clases Meta (Graduación)</label>
                                <div className="w-full bg-slate-900/40 border border-slate-700/60 rounded-2xl px-5 py-3.5 text-slate-300 font-semibold shadow-inner flex items-center justify-between">
                                    <span>Requisito del tramo:</span>
                                    <span className="text-blue-400 font-black">
                                        {id ? (evaluacion.tieneDeuda ? `${evaluacion.clases_requeridas} clases (Bloqueado por Deuda)` : `${evaluacion.clases_requeridas} clases`) : "Auto-calculado"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Fila Requisitos de Graduación Manual (Sobrescribir Clases y Días) */}
                        <div className="grid sm:grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Clases Requeridas (Manual)</label>
                                <input
                                    type="number"
                                    placeholder="Ej: 32 (Vacío usa regla oficial)"
                                    className="w-full bg-slate-900/60 border border-slate-700/60 rounded-2xl px-5 py-3.5 text-white outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all font-semibold shadow-inner"
                                    {...register("clasesParaGraduacion")}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Días de Permanencia Requeridos (Manual)</label>
                                <input
                                    type="number"
                                    placeholder="Ej: 122 (Vacío usa regla oficial)"
                                    className="w-full bg-slate-900/60 border border-slate-700/60 rounded-2xl px-5 py-3.5 text-white outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all font-semibold shadow-inner"
                                    {...register("diasParaGraduacion")}
                                />
                            </div>
                        </div>

                        {/* Progreso Visual */}
                        {id && watch("trackProgreso") !== false && alumnoData && (
                            <div className="pt-8 animate-in zoom-in-95 duration-500">
                                <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-700/50 shadow-inner space-y-5">
                                    
                                    {/* Alertas de Edad (Consistencia / Migración) */}
                                    {evaluacion.alertas_edad && evaluacion.alertas_edad.map((al, idx) => (
                                        <div key={idx} className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-start gap-3 animate-pulse">
                                            <span className="text-red-400 text-xl leading-none">⚠️</span>
                                            <div className="space-y-1">
                                                <p className="text-xs font-black text-red-400 uppercase tracking-widest">Alerta de Control de Edad</p>
                                                <p className="text-xs font-bold text-slate-300 leading-relaxed">{al.mensaje}</p>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Alerta de Candado de Deuda Activo */}
                                    {evaluacion.tieneDeuda && evaluacion.msgDeuda && (
                                        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-start gap-3 animate-pulse">
                                            <span className="text-red-400 text-xl leading-none">🛑</span>
                                            <div className="space-y-1">
                                                <p className="text-red-400 font-bold uppercase tracking-widest">CANDADO DE DEUDA ACTIVO</p>
                                                <p className="text-sm font-semibold text-slate-100 leading-relaxed">{evaluacion.msgDeuda}</p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex flex-col gap-2">
                                        <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-[0.2em]">PROGRESO REQUERIDO</p>
                                        <div className="flex flex-row justify-between items-center w-full">
                                            <p className="text-lg font-black text-white">Hacia {currentGrado < 4 ? `Grado ${currentGrado + 1}` : "Nueva Faja"}</p>
                                            <div className="flex flex-row items-center gap-4 bg-slate-800/40 px-3 py-1.5 rounded-xl border border-slate-700/20">
                                                <span className="text-xs font-bold text-slate-400">
                                                    Clases: <span className="text-white font-extrabold">
                                                        {evaluacion.contadores_visuales?.grado ? evaluacion.contadores_visuales.grado.acumuladas : evaluacion.clases_acumuladas}
                                                    </span> / {evaluacion.contadores_visuales?.grado ? evaluacion.contadores_visuales.grado.requeridas : evaluacion.clases_requeridas}
                                                </span>
                                                <div className="h-3 w-px bg-slate-700"></div>
                                                <span className="text-xs font-bold text-slate-400">
                                                    {(evaluacion.estado_secuencial === 1 || evaluacion.estado_secuencial === 2) ? (
                                                        <>Permanencia: <span className="text-white font-extrabold">{evaluacion.contadores_visuales?.permanencia?.acumuladas}</span> / {evaluacion.contadores_visuales?.permanencia?.requeridas} clases</>
                                                    ) : (
                                                        <>Días: <span className="text-white font-extrabold">{evaluacion.dias_transcurridos}</span> / {evaluacion.dias_requeridos} días</>
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Barra de Clases */}
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                                            <span>{(evaluacion.estado_secuencial === 1 || evaluacion.estado_secuencial === 2) ? "Presencia de Clases (Completado)" : "Presencia de Clases del Tramo"}</span>
                                            <span>{Math.round(pctClases)}%</span>
                                        </div>
                                        <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-black/30 shadow-inner">
                                            <div
                                                className={`h-full rounded-full transition-all duration-700 ease-out ${clasesListas ? 'bg-green-500' : 'bg-blue-500'}`}
                                                style={{ width: `${pctClases}%` }}
                                            />
                                        </div>
                                    </div>
 
                                    {/* Barra de Tiempo (Permanencia) */}
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                                            <span>{(evaluacion.estado_secuencial === 1 || evaluacion.estado_secuencial === 2) ? "Permanencia de Faixa (Asistencia)" : "Permanencia Calendario"}</span>
                                            <span>{Math.round(pctTiempo)}%</span>
                                        </div>
                                        <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-black/30 shadow-inner">
                                            <div
                                                className={`h-full rounded-full transition-all duration-700 ease-out ${
                                                    tiempoListo ? 'bg-green-500' : ((evaluacion.estado_secuencial === 1 || evaluacion.estado_secuencial === 2) ? 'bg-amber-500' : 'bg-purple-500')
                                                }`}
                                                style={{ width: `${pctTiempo}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Factor de Freno & Proyección */}
                                    {evaluacion.bloqueo_factor !== "Ninguno" && (
                                        <div className="bg-slate-800/40 rounded-2xl p-4 border border-slate-700/30 space-y-3">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm">🛡️</span>
                                                <span className="text-xs font-black uppercase tracking-widest text-slate-400">Estado de Bloqueo</span>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                                    evaluacion.bloqueo_factor === "Bloqueado por Tiempo" 
                                                    ? "bg-amber-500/25 text-amber-400 border border-amber-500/35"
                                                    : evaluacion.bloqueo_factor === "Bloqueado por Asistencias"
                                                    ? "bg-red-500/25 text-red-400 border border-red-500/35"
                                                    : "bg-rose-500/25 text-rose-400 border border-rose-500/35"
                                                }`}>
                                                    {evaluacion.bloqueo_factor}
                                                </span>
                                            </div>
                                            <div className="text-xs text-slate-400 font-bold space-y-1">
                                                {evaluacion.dias_restantes > 0 && (
                                                    <p>⏳ Faltan <span className="text-white">{evaluacion.dias_restantes} días</span> de permanencia mínima.</p>
                                                )}
                                                {evaluacion.clases_restantes > 0 && (
                                                    <p>🥋 Faltan <span className="text-white">{evaluacion.clases_restantes} clases</span> técnicas del tramo.</p>
                                                )}
                                                {evaluacion.fecha_estimada_promocion && (
                                                    <div className="mt-3 px-3 py-2 bg-emerald-950/30 border border-emerald-800/40 rounded-xl text-emerald-400 text-xs font-bold flex items-center gap-2">
                                                        <span>📅 Proyección de promoción:</span>
                                                        <span className="font-extrabold text-sm">{evaluacion.fecha_estimada_promocion}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {evaluacion.elegible && (
                                        <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-4 flex items-start gap-3">
                                            <span className="text-green-400 text-xl leading-none">🏆</span>
                                            <div className="space-y-1">
                                                <p className="text-xs font-black text-green-400 uppercase tracking-widest">¡Elegible para Graduación!</p>
                                                <p className="text-xs font-bold text-slate-300 leading-relaxed">El alumno cumple con la doble condición AND requerida por la franquicia Gracie Barra.</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                                    {/* Botón de Promoción Manual (Siempre disponible para el profesor) */}
                                        <div className="mt-6 pt-6 border-t border-slate-700/50">
                                            <button
                                                type="button"
                                                onClick={async () => {
                                                    const currentGrado = Number(watch("grado"));
                                                    const currentFaja = watch("faja");
                                                    const fajasOrden = FAJAS_POR_CATEGORIA[categoria] || FAJAS_POR_CATEGORIA["Adulto"];
                                                    const currentIndex = fajasOrden.indexOf(currentFaja);

                                                    let nuevaFaja = currentFaja;
                                                    let nuevoGrado = currentGrado + 1;

                                                    const confirm = await showAlert({
                                                        title: "¿Confirmar Promoción?",
                                                        text: currentGrado >= 4 
                                                            ? `El alumno pasará de ${currentFaja} a ${fajasOrden[currentIndex + 1] || 'Siguiente Faja'}.`
                                                            : `Se agregará el grado ${nuevoGrado} a la faja ${currentFaja}.`,
                                                        icon: "question",
                                                        showCancelButton: true,
                                                        confirmButtonText: "Sí, promover"
                                                    });

                                                    if (confirm.isConfirmed) {
                                                        if (currentGrado >= 4) {
                                                            if (currentIndex < fajasOrden.length - 1) {
                                                                nuevaFaja = fajasOrden[currentIndex + 1];
                                                                nuevoGrado = 0;
                                                                showToast(`¡Promovido a cinturón ${nuevaFaja}!`, "success");
                                                            } else {
                                                                return showAlert({ title: "Atención", text: "El alumno ya está en la faja máxima de esta categoría.", icon: "info" });
                                                            }
                                                        }

                                                    const updatedValues = {
                                                        ...getValues(),
                                                        categoria,
                                                        faja: nuevaFaja,
                                                        grado: nuevoGrado,
                                                        ultimaGraduacion: new Date().toISOString(),
                                                        registrarHistorial: true
                                                    };

                                                    try {
                                                        const { data } = await updateAlumno(id, updatedValues);
                                                        syncAlumnoData(data);
                                                        // Sincronizar el formulario también
                                                        reset(data); 
                                                        showToast("¡Promovido con éxito!", "success");
                                                    } catch (e) {
                                                        showAlert({ title: "Error", text: "No se pudo procesar la promoción.", icon: "error" });
                                                    }
                                                }
                                            }}
                                                className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-blue-900/20 transition-all active:scale-95 border-b-4 border-blue-800 active:border-b-0 flex items-center justify-center gap-2"
                                            >
                                                <span>🎓</span> Promover Grado / Faja
                                            </button>
                                            
                                            {!listo && (
                                                <p className="text-[10px] text-slate-500 mt-3 font-bold text-center uppercase tracking-wider opacity-60">
                                                    Promoción manual (el alumno aún no cumple los requisitos automáticos)
                                                </p>
                                            )}
                                            {listo && (
                                                <p className="text-[10px] text-green-400 mt-3 font-black text-center uppercase tracking-wider animate-pulse">
                                                    ⭐ ¡Alumno elegible para promoción según el sistema!
                                                </p>
                                            )}

                                            {/* Botón de Deshacer (Si hay historial) */}
                                            {alumnoData?.historicoGraduaciones?.length > 0 && (
                                                <div className="mt-4 pt-4 border-t border-slate-700/30">
                                                    <button
                                                        type="button"
                                                        onClick={handleRevertPromotion}
                                                        className="w-full text-[10px] font-black text-red-400 hover:text-red-300 uppercase tracking-widest transition-all bg-red-500/5 hover:bg-red-500/10 py-3 rounded-xl border border-red-500/20 flex items-center justify-center gap-2"
                                                    >
                                                        ↩ Deshacer Última Graduación
                                                    </button>
                                                </div>
                                            )}
                                        </div>


                    </div>
                </div>

                {/* PANEL DERECHO: TOMA DE ASISTENCIA Y GRADUACIONES */}
                {id && (
                    <div className="lg:col-span-5 flex flex-col gap-6 lg:gap-8">
                            
                            {/* Historial de Graduaciones (Rayas/Fajas) */}
                            <div className="bg-slate-800/30 backdrop-blur-xl rounded-[2rem] p-6 border border-slate-700/50 shadow-xl flex flex-col">
                                <div className="flex items-center justify-between mb-5 border-b border-slate-700/50 pb-4">
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">
                                        Historial de Graduaciones
                                    </h3>
                                    <button
                                        type="button"
                                        onClick={agregarHistorial}
                                        className="text-[10px] font-black bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-xl border border-blue-500 shadow-sm active:scale-95 transition-all"
                                    >
                                        + Agregar Pasada
                                    </button>
                                </div>
                                
                                <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                                    {alumnoData?.historicoGraduaciones?.length > 0 ? (
                                        [...alumnoData.historicoGraduaciones].reverse().map((h, i) => (
                                            <div key={i} className="bg-slate-900/40 p-4 rounded-2xl border border-slate-700/30 flex justify-between items-center">
                                                <div>
                                                    <p className="text-white font-black text-sm">{h.faja} <span className="text-slate-400 font-bold">- {h.grado === 0 ? 'Sin Grado' : `${h.grado}º Grado`}</span></p>
                                                    <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">
                                                        Alcanzado el {format(toLocal(h.fechaClasePromocion), "d 'de' MMMM, yyyy", { locale: es })}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-black bg-slate-800 text-slate-400 px-2 py-1 rounded-md border border-slate-700">HISTORIAL</span>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); eliminarHistorial(alumnoData.historicoGraduaciones.length - 1 - i); }}
                                                        className="text-slate-600 hover:text-red-400 transition-colors p-1 rounded-lg hover:bg-red-500/10"
                                                        title="Eliminar registro"
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="py-8 text-center opacity-30">
                                            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Sin graduaciones registradas</p>
                                        </div>
                                    )}
                                </div>
                            </div>

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
                                    Asistencias Totales
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
                            <div className="min-w-[740px] flex justify-center py-2 sm:py-4">
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

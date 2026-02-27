import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { getAlumno, createAlumno, updateAlumno, addAsistencia, removeAsistencia } from "../api/alumnos";
import CartaoFrequencia from "../components/CartaoFrequencia";
import { format } from "date-fns";

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
    const [guardado, setGuardado] = useState(false);
    const [cargando, setCargando] = useState(!!id);

    /* Cargar alumno */
    useEffect(() => {
        if (!id) { setCargando(false); return; }
        (async () => {
            const { data } = await getAlumno(id);
            setValue("nombre", data.nombre);
            setValue("faja", data.faja ?? "Blanca");
            setValue("grado", String(data.grado ?? 0));
            if (data.ultimaGraduacion) {
                const local = toLocal(data.ultimaGraduacion);
                setValue("ultimaGraduacion", format(local, "yyyy-MM-dd"));
            }
            setAsistencias(data.asistencias ?? []);
            setCargando(false);
        })();
    }, [id]);

    /* Guardar */
    const onSubmit = handleSubmit(async (data) => {
        if (id) {
            await updateAlumno(id, data);
            setGuardado(true);
            setTimeout(() => setGuardado(false), 2500);
        } else {
            const { data: nuevo } = await createAlumno(data);
            navigate(`/editar/${nuevo._id}`);
        }
    });

    /* Asistencia */
    async function marcarHoy() {
        if (!id) return alert("Guarda el alumno primero.");
        try {
            const { data } = await addAsistencia(id, new Date());
            setAsistencias(data.asistencias);
        } catch (e) {
            alert(e.response?.data?.message ?? "Error");
        }
    }

    async function marcarFecha() {
        if (!id) return alert("Guarda el alumno primero.");
        try {
            const { data } = await addAsistencia(id, new Date(fechaManual + "T12:00:00"));
            setAsistencias(data.asistencias);
        } catch (e) {
            alert(e.response?.data?.message ?? "Error");
        }
    }

    async function eliminarAsistencia(fecha) {
        if (!window.confirm("¿Eliminar esta asistencia?")) return;
        const { data } = await removeAsistencia(id, fecha);
        setAsistencias(data.asistencias);
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

    if (cargando) return <div className="text-slate-400 text-center py-20">Cargando…</div>;

    return (
        <>
            {/* ── Cartón oculto para impresión (window.print) ─── */}
            <div className="hidden">
                <CartaoFrequencia
                    id="cartao-print"
                    asistencias={asistencias}
                    alumnoNombre={watch("nombre")}
                    faja={watch("faja")}
                    grado={watch("grado")}
                    ultimaGraduacion={watch("ultimaGraduacion")}
                />
            </div>

            {/* ── Layout visible ─────────────────────────────── */}
            <div className="max-w-5xl mx-auto space-y-8">

                {/* Barra de acciones */}
                <div className="flex justify-between items-center">
                    <button
                        onClick={() => navigate("/")}
                        className="text-slate-400 hover:text-white transition-colors text-sm"
                    >
                        ← Volver
                    </button>
                    <div className="flex gap-2">
                        {id && (
                            <button
                                onClick={() => window.print()}
                                className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg text-sm font-semibold transition-all border border-slate-600"
                            >
                                🖨️ Imprimir Cartón
                            </button>
                        )}
                        <button
                            onClick={onSubmit}
                            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-5 py-2 rounded-lg text-sm font-bold transition-all shadow-md"
                        >
                            {guardado ? "✓ Guardado" : (id ? "Actualizar" : "Guardar Alumno")}
                        </button>
                    </div>
                </div>

                {/* Formulario + toma de asistencia */}
                <div className="grid lg:grid-cols-2 gap-6">

                    {/* Datos del alumno */}
                    <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 space-y-4">
                        <h2 className="font-bold text-lg">Datos del Alumno</h2>

                        <div>
                            <label className="text-xs text-slate-400 mb-1 block">Nombre completo</label>
                            <input
                                type="text"
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-red-600"
                                {...register("nombre", { required: true })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-slate-400 mb-1 block">Faja</label>
                                <select
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-red-600"
                                    {...register("faja")}
                                >
                                    {["Blanca", "Azul", "Morada", "Marrón", "Negra"].map(f => (
                                        <option key={f}>{f}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-slate-400 mb-1 block">Grado</label>
                                <select
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-red-600"
                                    {...register("grado")}
                                >
                                    {[0, 1, 2, 3, 4].map(g => <option key={g}>{g}</option>)}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs text-slate-400 mb-1 block">Fecha última graduación</label>
                            <input
                                type="date"
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-red-600"
                                {...register("ultimaGraduacion")}
                            />
                        </div>

                        {/* Progreso */}
                        {id && (
                            <div className="pt-2 border-t border-slate-700">
                                <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                                    <span>Progreso hacia próxima graduación</span>
                                    <span className="font-bold text-white">{asistencias.length} / 30</span>
                                </div>
                                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-red-600 rounded-full transition-all"
                                        style={{ width: `${Math.min((asistencias.length / 30) * 100, 100)}%` }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Toma de asistencia */}
                    {id && (
                        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 space-y-4">
                            <h2 className="font-bold text-lg">Tomar Asistencia</h2>

                            {/* Botón HOY */}
                            <button
                                onClick={marcarHoy}
                                className="w-full bg-blue-700 hover:bg-blue-600 py-3 rounded-xl font-bold text-lg transition-all shadow-md active:scale-95"
                            >
                                ✔ Marcar HOY
                            </button>

                            {/* Fecha manual */}
                            <div className="flex gap-2">
                                <input
                                    type="date"
                                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-600"
                                    value={fechaManual}
                                    onChange={e => setFechaManual(e.target.value)}
                                />
                                <button
                                    onClick={marcarFecha}
                                    className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                                >
                                    Agregar
                                </button>
                            </div>

                            {/* Historial */}
                            <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                                {Object.keys(agrupadas).sort((a, b) => b - a).map(anio => (
                                    <div key={anio}>
                                        <p className="text-xs text-slate-500 font-black uppercase tracking-widest mb-1">{anio}</p>
                                        {Object.keys(agrupadas[anio]).sort((a, b) => b - a).map(mes => (
                                            <div key={mes} className="mb-2">
                                                <p className="text-[10px] text-blue-500 font-bold uppercase ml-1 mb-1">{MESES_ES[mes]}</p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {agrupadas[anio][mes].sort((a, b) => a.dia - b.dia).map(({ iso, dia }) => (
                                                        <button
                                                            key={iso}
                                                            onClick={() => eliminarAsistencia(iso)}
                                                            title="Click para eliminar"
                                                            className="bg-slate-900 hover:bg-red-900/40 border border-slate-700 hover:border-red-700 rounded-lg w-8 h-8 text-sm font-bold transition-all"
                                                        >
                                                            {String(dia).padStart(2, "0")}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                                {asistencias.length === 0 && (
                                    <p className="text-slate-600 text-sm italic text-center pt-4">Sin asistencias aún</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Vista previa del cartón */}
                {id && (
                    <div className="space-y-3">
                        <h2 className="font-bold text-lg flex items-center gap-2">
                            🖨️ Vista Previa del Cartón
                        </h2>
                        <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-700 overflow-x-auto">
                            <div className="min-w-[900px]">
                                <CartaoFrequencia
                                    asistencias={asistencias}
                                    alumnoNombre={watch("nombre")}
                                    faja={watch("faja")}
                                    grado={watch("grado")}
                                    ultimaGraduacion={watch("ultimaGraduacion")}
                                />
                            </div>
                        </div>
                        <p className="text-slate-500 text-xs italic text-center">
                            Pulsá "Imprimir Cartón" para abrir el diálogo de impresión / guardar como PDF.
                        </p>
                    </div>
                )}
            </div>
        </>
    );
}

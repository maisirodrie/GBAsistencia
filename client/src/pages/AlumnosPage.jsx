import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAlumnos, deleteAlumno } from "../api/alumnos";

const FAJA_STYLES = {
    Blanca: "bg-white text-gray-800 border border-gray-300",
    Azul: "bg-blue-700 text-white",
    Morada: "bg-purple-700 text-white",
    "Marrón": "bg-amber-900 text-white",
    Negra: "bg-black text-white border border-red-700",
};

export default function AlumnosPage() {
    const [alumnos, setAlumnos] = useState([]);
    const [filtro, setFiltro] = useState("");
    const navigate = useNavigate();

    useEffect(() => { cargar(); }, []);

    async function cargar() {
        try {
            const { data } = await getAlumnos();
            setAlumnos(data);
        } catch { /**/ }
    }

    async function handleEliminar(id, nombre) {
        if (!window.confirm(`¿Eliminar a ${nombre}?`)) return;
        await deleteAlumno(id);
        cargar();
    }

    const lista = alumnos.filter(a =>
        a.nombre.toLowerCase().includes(filtro.toLowerCase())
    );

    return (
        <div className="max-w-5xl mx-auto">

            {/* Buscador */}
            <div className="mb-6 flex gap-3 items-center">
                <input
                    type="text"
                    placeholder="Buscar alumno…"
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-base outline-none focus:ring-2 focus:ring-red-600 placeholder-slate-500"
                    value={filtro}
                    onChange={e => setFiltro(e.target.value)}
                />
                {filtro && (
                    <button
                        onClick={() => setFiltro("")}
                        className="text-slate-400 hover:text-white px-3 py-2 rounded-lg"
                    >✕</button>
                )}
            </div>

            {/* Lista */}
            {lista.length === 0 ? (
                <div className="text-center py-24 text-slate-500 border border-dashed border-slate-700 rounded-2xl">
                    {filtro ? "Sin resultados" : "No hay alumnos. Creá el primero →"}
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {lista.map(a => {
                        const asist = a.asistencias?.length ?? 0;
                        const pct = Math.min((asist / 30) * 100, 100);
                        const fecha = a.ultimaGraduacion
                            ? new Date(new Date(a.ultimaGraduacion).getTime() +
                                new Date(a.ultimaGraduacion).getTimezoneOffset() * 60000
                            ).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit" })
                            : "—";

                        return (
                            <div
                                key={a._id}
                                className="bg-slate-800 rounded-2xl p-5 border border-slate-700 hover:border-red-700/60 transition-all shadow-md flex flex-col gap-4"
                            >
                                {/* Header */}
                                <div className="flex justify-between items-start gap-2">
                                    <h3 className="font-bold text-lg leading-tight">{a.nombre}</h3>
                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded whitespace-nowrap ${FAJA_STYLES[a.faja] ?? "bg-slate-600"}`}>
                                        {a.faja?.toUpperCase()} {a.grado}°
                                    </span>
                                </div>

                                {/* Info */}
                                <div className="text-xs text-slate-400 space-y-1">
                                    <p>Última graduación: <span className="text-slate-200 font-semibold">{fecha}</span></p>
                                    <p>Asistencias: <span className="text-slate-200 font-semibold">{asist}</span></p>
                                </div>

                                {/* Barra progreso */}
                                <div>
                                    <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                                        <span>Progreso</span>
                                        <span>{asist}/30</span>
                                    </div>
                                    <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                        <div className="h-full bg-red-600 rounded-full" style={{ width: `${pct}%` }} />
                                    </div>
                                </div>

                                {/* Acciones */}
                                <div className="flex gap-2 mt-auto pt-2 border-t border-slate-700">
                                    <button
                                        onClick={() => navigate(`/editar/${a._id}`)}
                                        className="flex-1 bg-slate-700 hover:bg-slate-600 py-1.5 rounded-lg text-sm font-semibold transition-all"
                                    >
                                        Ver / Asistencia
                                    </button>
                                    <button
                                        onClick={() => handleEliminar(a._id, a.nombre)}
                                        className="px-3 py-1.5 rounded-lg text-red-500 hover:bg-red-900/30 transition-all text-sm"
                                    >
                                        ✕
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

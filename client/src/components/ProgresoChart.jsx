/**
 * ProgresoChart — Gráfico de progreso de entrenamiento del alumno
 * Usa Recharts para mostrar asistencias mensuales
 */
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, ReferenceLine, Cell, LabelList
} from "recharts";

const MESES_CORTO = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

function buildDataAnual(asistencias, anio) {
    const counts = Array(12).fill(0);
    for (const iso of asistencias) {
        const d = new Date(iso);
        const local = new Date(d.getTime() + d.getTimezoneOffset() * 60000);
        if (local.getFullYear() === anio) counts[local.getMonth()]++;
    }
    return counts.map((v, i) => ({ mes: MESES_CORTO[i], clases: v }));
}

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 shadow-2xl">
                <p className="font-black text-white text-sm mb-1">{label}</p>
                <p className="text-blue-400 font-bold text-lg">{payload[0].value} <span className="text-slate-400 text-xs font-normal">clases</span></p>
            </div>
        );
    }
    return null;
};

export default function ProgresoChart({ asistencias = [], anio, clasesObjetivo = 30 }) {
    const data = buildDataAnual(asistencias, anio);
    const totalAnio = data.reduce((s, d) => s + d.clases, 0);
    const mejorMes  = Math.max(...data.map(d => d.clases));
    const promMes   = totalAnio > 0 ? (totalAnio / 12).toFixed(1) : "0.0";
    const mesesActivos = data.filter(d => d.clases > 0).length;

    const getBarColor = (clases) => {
        if (clases === 0) return "#1e293b";
        if (clases >= clasesObjetivo) return "#22c55e";
        if (clases >= clasesObjetivo * 0.6) return "#3b82f6";
        return "#6366f1";
    };

    return (
        <div className="space-y-6">
            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: "Total en el año", value: totalAnio, unit: "clases", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
                    { label: "Mejor mes", value: mejorMes, unit: "clases", color: "text-green-400", bg: "bg-green-500/10 border-green-500/20" },
                    { label: "Promedio/mes", value: promMes, unit: "clases", color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
                    { label: "Meses activos", value: mesesActivos, unit: "de 12", color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20" },
                ].map(({ label, value, unit, color, bg }) => (
                    <div key={label} className={`rounded-2xl p-4 border ${bg} text-center`}>
                        <p className={`text-3xl font-black ${color} leading-none`}>{value}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-2">{label}</p>
                        <p className="text-[10px] text-slate-600 font-medium">{unit}</p>
                    </div>
                ))}
            </div>

            {/* Barra de contexto */}
            <div className="flex items-center gap-3 bg-slate-900/40 rounded-xl px-4 py-3 border border-slate-700/40">
                <span className="text-xs text-slate-400">Meta mensual:</span>
                <span className="text-white font-black text-sm">{clasesObjetivo} clases</span>
                <span className="ml-auto text-xs text-slate-500">
                    {totalAnio >= clasesObjetivo * 12
                        ? <span className="text-green-400 font-bold">🏆 Objetivo anual cumplido</span>
                        : <span>Faltan <span className="text-white font-bold">{Math.max(0, clasesObjetivo * 12 - totalAnio)}</span> clases para el objetivo anual</span>
                    }
                </span>
            </div>

            {/* Gráfico */}
            <div style={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 20, right: 10, left: -15, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis
                            dataKey="mes"
                            tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 700 }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            tick={{ fill: "#64748b", fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                            allowDecimals={false}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(148,163,184,0.05)", radius: 8 }} />
                        <ReferenceLine
                            y={clasesObjetivo}
                            stroke="#f59e0b"
                            strokeDasharray="6 4"
                            strokeWidth={1.5}
                            label={{
                                value: `Meta: ${clasesObjetivo}`,
                                fill: "#f59e0b",
                                fontSize: 10,
                                fontWeight: 700,
                                position: "insideTopRight",
                                dy: -6
                            }}
                        />
                        <Bar dataKey="clases" radius={[8, 8, 2, 2]} maxBarSize={48}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={getBarColor(entry.clases)} />
                            ))}
                            <LabelList
                                dataKey="clases"
                                position="top"
                                style={{ fill: "#94a3b8", fontSize: 11, fontWeight: 700 }}
                                formatter={v => v > 0 ? v : ""}
                            />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Leyenda compacta */}
            <div className="flex items-center gap-5 flex-wrap text-[11px] text-slate-500 px-1">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-green-500 inline-block flex-shrink-0" /> Objetivo cumplido</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-blue-500 inline-block flex-shrink-0" /> Buen ritmo (≥60%)</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-indigo-500 inline-block flex-shrink-0" /> Asistencia regular</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm border border-slate-600 inline-block flex-shrink-0" /> Sin clases</span>
                <span className="flex items-center gap-1.5 ml-auto"><span className="w-5 border-b-2 border-dashed border-yellow-500 inline-block" /> Meta mensual</span>
            </div>
        </div>
    );
}

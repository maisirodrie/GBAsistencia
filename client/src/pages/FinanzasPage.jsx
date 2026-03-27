import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import {
    getConfiguracion, updateConfiguracion,
    getResumen, crearTransaccion, eliminarTransaccion,
    pagarMembresia, getEstadoMembresias
} from "../api/finanzas";

const MESES_ES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const CATEGORIAS_INGRESO = ["Membresía","Artículo","Certificado/Graduación","Otros"];
const CATEGORIAS_EGRESO  = ["Mantenimiento/Servicios","Artículo","Otros"];
const FAJA_COLORS = { Blanca:"bg-white text-gray-900", Azul:"bg-blue-700 text-white", Morada:"bg-purple-700 text-white", "Marrón":"bg-amber-900 text-white", Negra:"bg-black text-white" };

function fmt(n) { return Number(n || 0).toLocaleString("es-AR", { minimumFractionDigits: 0 }); }

const initialForm = { tipo:"INGRESO", categoria:"Artículo", monto:"", descripcion:"", fecha: format(new Date(),"yyyy-MM-dd"), alumnoId:"" };

export default function FinanzasPage() {
    const today = new Date();
    const [mesActual, setMesActual] = useState(`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}`);
    const [resumen, setResumen] = useState({ totalIngresos:0, totalEgresos:0, gananciaNeta:0, transacciones:[] });
    const [config, setConfig] = useState({ precioMembresia:0, porcentajeRecargo:10, diaCierreCobranza:10, moneda:"$" });
    const [estadoMem, setEstadoMem] = useState([]);
    const [tab, setTab] = useState("resumen"); // resumen | membresias | config
    const [showModal, setShowModal] = useState(null); // null | "ingreso" | "egreso"
    const [form, setForm] = useState(initialForm);
    const [loading, setLoading] = useState(false);
    const [configEdit, setConfigEdit] = useState(null);

    const cargarResumen = useCallback(async () => {
        const { data } = await getResumen(mesActual);
        setResumen(data);
    }, [mesActual]);

    const cargarMembresias = useCallback(async () => {
        const { data } = await getEstadoMembresias(mesActual);
        setEstadoMem(data);
    }, [mesActual]);

    const cargarConfig = useCallback(async () => {
        const { data } = await getConfiguracion();
        setConfig(data);
        setConfigEdit({ ...data });
    }, []);

    useEffect(() => { cargarResumen(); }, [cargarResumen]);
    useEffect(() => { if (tab === "membresias") cargarMembresias(); }, [tab, cargarMembresias]);
    useEffect(() => { if (tab === "config") cargarConfig(); }, [tab, cargarConfig]);

    async function handleGuardarConfig() {
        try {
            setLoading(true);
            const { data } = await updateConfiguracion(configEdit);
            setConfig(data);
            alert("✅ Configuración guardada.");
        } catch(e) { alert(e.response?.data?.message || "Error"); }
        finally { setLoading(false); }
    }

    async function handleCrearTransaccion() {
        if (!form.monto || Number(form.monto) <= 0) return alert("Ingresá un monto válido.");
        if (!form.categoria) return alert("Seleccioná una categoría.");
        try {
            setLoading(true);
            await crearTransaccion({ ...form, tipo: showModal === "ingreso" ? "INGRESO" : "EGRESO", monto: Number(form.monto) });
            setShowModal(null);
            setForm(initialForm);
            cargarResumen();
        } catch(e) { alert(e.response?.data?.message || "Error"); }
        finally { setLoading(false); }
    }

    async function handleEliminar(id) {
        if (!window.confirm("¿Eliminar esta transacción?")) return;
        await eliminarTransaccion(id);
        cargarResumen();
    }

    async function handlePagarMembresia(alumnoId) {
        const diaHoy = new Date().getDate();
        const hayRecargo = diaHoy > config.diaCierreCobranza;
        const montoFinal = hayRecargo
            ? Math.round(config.precioMembresia * (1 + config.porcentajeRecargo / 100))
            : config.precioMembresia;
        const msg = hayRecargo
            ? `¿Confirmar pago de membresía?\n\nBase: ${config.moneda}${fmt(config.precioMembresia)}\nRecargo (${config.porcentajeRecargo}%): +${config.moneda}${fmt(montoFinal - config.precioMembresia)}\n\nTotal: ${config.moneda}${fmt(montoFinal)}`
            : `¿Confirmar pago de membresía?\nMonto: ${config.moneda}${fmt(montoFinal)}`;
        if (!window.confirm(msg)) return;
        try {
            await pagarMembresia({ alumnoId, periodo: mesActual });
            cargarMembresias();
            cargarResumen();
        } catch(e) { alert(e.response?.data?.message || "Error"); }
    }

    const [anio, mes] = mesActual.split("-");
    const mesLabel = `${MESES_ES[Number(mes)-1]} ${anio}`;

    return (
        <div className="max-w-6xl mx-auto pb-16 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/40 p-4 rounded-3xl border border-slate-800">
                <div>
                    <h1 className="text-2xl font-black tracking-tight">💰 Finanzas</h1>
                    <p className="text-slate-400 text-sm mt-0.5">Control de ingresos y egresos del Dojo</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => { const [y,m] = mesActual.split('-'); const d = new Date(Number(y), Number(m)-2, 1); setMesActual(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`); }} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-all text-lg">&larr;</button>
                    <span className="font-bold text-white text-sm min-w-[150px] text-center bg-slate-800 px-4 py-2 rounded-xl border border-slate-700">{mesLabel}</span>
                    <button onClick={() => { const [y,m] = mesActual.split('-'); const d = new Date(Number(y), Number(m), 1); setMesActual(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`); }} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-all text-lg">&rarr;</button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 bg-slate-800/40 p-1.5 rounded-2xl border border-slate-700/50">
                {[["resumen","📊 Resumen"],["membresias","👥 Membresías"],["config","⚙️ Configuración"]].map(([k,lbl]) => (
                    <button key={k} onClick={() => setTab(k)}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${tab===k ? "bg-slate-900 text-white shadow-md border border-slate-600" : "text-slate-400 hover:text-white"}`}>
                        {lbl}
                    </button>
                ))}
            </div>

            {/* ───── TAB: RESUMEN ───── */}
            {tab === "resumen" && <>
                {/* Tarjetas de resumen */}
                <div className="grid sm:grid-cols-3 gap-4">
                    <div className="bg-green-900/30 border border-green-700/40 rounded-2xl p-5 shadow-lg">
                        <p className="text-xs font-black text-green-400 uppercase tracking-widest mb-2">Ingresos</p>
                        <p className="text-3xl font-black text-white">{config.moneda}{fmt(resumen.totalIngresos)}</p>
                    </div>
                    <div className="bg-red-900/30 border border-red-700/40 rounded-2xl p-5 shadow-lg">
                        <p className="text-xs font-black text-red-400 uppercase tracking-widest mb-2">Egresos</p>
                        <p className="text-3xl font-black text-white">{config.moneda}{fmt(resumen.totalEgresos)}</p>
                    </div>
                    <div className={`${resumen.gananciaNeta >= 0 ? "bg-blue-900/30 border-blue-700/40" : "bg-orange-900/30 border-orange-700/40"} border rounded-2xl p-5 shadow-lg`}>
                        <p className={`text-xs font-black uppercase tracking-widest mb-2 ${resumen.gananciaNeta >= 0 ? "text-blue-400" : "text-orange-400"}`}>Ganancia Neta</p>
                        <p className="text-3xl font-black text-white">{config.moneda}{fmt(resumen.gananciaNeta)}</p>
                    </div>
                </div>

                {/* Botones de acción */}
                <div className="flex gap-3 flex-wrap">
                    <button onClick={() => { setForm({...initialForm, tipo:"INGRESO", categoria:"Artículo"}); setShowModal("ingreso"); }}
                        className="flex-1 sm:flex-none bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-2xl font-bold shadow-lg transition-all active:scale-95 border border-green-500/50">
                        + Registrar Ingreso
                    </button>
                    <button onClick={() => { setForm({...initialForm, tipo:"EGRESO", categoria:"Mantenimiento/Servicios"}); setShowModal("egreso"); }}
                        className="flex-1 sm:flex-none bg-red-700 hover:bg-red-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg transition-all active:scale-95 border border-red-600/50">
                        − Registrar Egreso
                    </button>
                </div>

                {/* Listado de transacciones */}
                <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 overflow-hidden shadow-xl">
                    <div className="px-6 py-4 border-b border-slate-700/50 flex justify-between items-center">
                        <h3 className="font-black text-white">Movimientos del mes</h3>
                        <span className="text-xs text-slate-400 bg-slate-900 px-3 py-1 rounded-full border border-slate-700">{resumen.transacciones.length} registros</span>
                    </div>
                    {resumen.transacciones.length === 0 ? (
                        <div className="py-16 text-center text-slate-500">
                            <p className="text-3xl mb-2">📭</p>
                            <p className="font-bold">Sin movimientos este mes</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-700/30">
                            {resumen.transacciones.map(t => (
                                <div key={t._id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-800/50 transition-all">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black flex-shrink-0 ${t.tipo==="INGRESO" ? "bg-green-900/50 text-green-400 border border-green-700/40" : "bg-red-900/50 text-red-400 border border-red-700/40"}`}>
                                        {t.tipo==="INGRESO" ? "↑" : "↓"}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-white text-sm truncate">{t.descripcion || t.categoria}</p>
                                        <p className="text-xs text-slate-400 mt-0.5">
                                            <span className="bg-slate-900 px-1.5 py-0.5 rounded-md border border-slate-700 mr-1">{t.categoria}</span>
                                            {t.alumnoId && <span className="text-blue-400">{t.alumnoId.nombre} {t.alumnoId.apellido || ""}</span>}
                                            {t.tuvoRecargo && <span className="text-orange-400 ml-1">⚠ Con mora</span>}
                                        </p>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <p className={`font-black text-lg ${t.tipo==="INGRESO" ? "text-green-400" : "text-red-400"}`}>
                                            {t.tipo==="INGRESO" ? "+" : "-"}{config.moneda}{fmt(t.monto)}
                                        </p>
                                        <p className="text-[10px] text-slate-500">{format(new Date(t.fecha),"dd/MM/yyyy")}</p>
                                    </div>
                                    <button onClick={() => handleEliminar(t._id)} className="text-slate-600 hover:text-red-500 transition-colors ml-2 flex-shrink-0" title="Eliminar">✕</button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </>}

            {/* ───── TAB: MEMBRESÍAS ───── */}
            {tab === "membresias" && <>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xl font-black text-white">Estado de Membresías · {mesLabel}</p>
                        <p className="text-slate-400 text-sm mt-1">Precio base: <span className="text-white font-bold">{config.moneda}{fmt(config.precioMembresia)}</span> · Mora del día {config.diaCierreCobranza + 1} en adelante (+{config.porcentajeRecargo}%)</p>
                    </div>
                    <div className="flex gap-3 text-sm">
                        <span className="bg-green-900/30 text-green-400 border border-green-700/30 px-3 py-1 rounded-full font-bold">{estadoMem.filter(e=>e.pago).length} pagaron</span>
                        <span className="bg-red-900/30 text-red-400 border border-red-700/30 px-3 py-1 rounded-full font-bold">{estadoMem.filter(e=>!e.pago).length} pendientes</span>
                    </div>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {estadoMem.map(({ alumno, pago }) => (
                        <div key={alumno._id} className={`rounded-2xl p-4 border shadow-lg flex flex-col gap-3 ${pago ? "bg-green-900/20 border-green-700/40" : "bg-slate-800/30 border-slate-700/50"}`}>
                            <div className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center text-lg flex-shrink-0 border border-slate-600/50 overflow-hidden">
                                    {alumno.fotoUrl
                                        ? <img src={`http://localhost:4000/uploads/${alumno.fotoUrl}`} alt="Perfil" className="w-full h-full object-cover" />
                                        : <span className="text-white">{alumno.nombre?.charAt(0)}</span>}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-white text-sm truncate">{alumno.nombre} {alumno.apellido || ""}</p>
                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${FAJA_COLORS[alumno.faja] || "bg-slate-600 text-white"}`}>{alumno.faja} {alumno.grado}°</span>
                                </div>
                            </div>

                            {pago ? (
                                <div className="bg-green-900/30 border border-green-700/30 rounded-xl px-3 py-2 text-center">
                                    <p className="text-green-400 font-black text-sm">✔ Pago</p>
                                    <p className="text-green-300 text-xs">{config.moneda}{fmt(pago.monto)} · {format(new Date(pago.fecha),"dd/MM")}{pago.tuvoRecargo && " ⚠ mora"}</p>
                                </div>
                            ) : (
                                <button onClick={() => handlePagarMembresia(alumno._id)}
                                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl text-sm transition-all active:scale-95 border border-blue-500/50 shadow-md">
                                    Cobrar Membresía
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </>}

            {/* ───── TAB: CONFIGURACIÓN ───── */}
            {tab === "config" && configEdit && (
                <div className="max-w-lg mx-auto bg-slate-800/30 rounded-2xl border border-slate-700/50 p-8 shadow-xl space-y-6">
                    <h2 className="text-xl font-black text-white">Configuración de Finanzas</h2>

                    <div className="space-y-4">
                        {[
                            { label:"Precio de Membresía Mensual", key:"precioMembresia", help:"Monto base que pagan todos los alumnos." },
                            { label:"% Recargo por Mora", key:"porcentajeRecargo", help:"Porcentaje que se suma después del día de cierre." },
                            { label:"Día de Cierre de Cobranza", key:"diaCierreCobranza", help:"Hasta este día se cobra sin recargo." },
                        ].map(({ label, key, help }) => (
                            <div key={key} className="space-y-1.5">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{label}</label>
                                <input
                                    type="number"
                                    value={configEdit[key] ?? ""}
                                    onChange={e => setConfigEdit(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                                    className="w-full bg-slate-900/60 border border-slate-700/60 rounded-xl px-4 py-3 text-white outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all font-semibold"
                                />
                                <p className="text-xs text-slate-500">{help}</p>
                            </div>
                        ))}
                        <div className="space-y-1.5">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Símbolo de Moneda</label>
                            <input
                                type="text"
                                value={configEdit.moneda ?? ""}
                                onChange={e => setConfigEdit(prev => ({ ...prev, moneda: e.target.value }))}
                                className="w-full bg-slate-900/60 border border-slate-700/60 rounded-xl px-4 py-3 text-white outline-none focus:border-red-500 transition-all font-semibold"
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleGuardarConfig}
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black py-3.5 rounded-2xl shadow-lg transition-all active:scale-95 disabled:opacity-50">
                        {loading ? "Guardando…" : "Guardar Configuración"}
                    </button>
                </div>
            )}

            {/* ───── MODAL Ingreso / Egreso ───── */}
            {showModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={e => { if(e.target===e.currentTarget) setShowModal(null); }}>
                    <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-5">
                        <div className="flex justify-between items-center">
                            <h2 className={`text-xl font-black ${showModal==="ingreso" ? "text-green-400" : "text-red-400"}`}>
                                {showModal==="ingreso" ? "+ Nuevo Ingreso" : "− Nuevo Egreso"}
                            </h2>
                            <button onClick={() => setShowModal(null)} className="text-slate-500 hover:text-white transition-colors text-xl">✕</button>
                        </div>

                        {[
                            { label:"Categoría", type:"select", key:"categoria", options: showModal==="ingreso" ? CATEGORIAS_INGRESO : CATEGORIAS_EGRESO },
                            { label:"Descripción", type:"text", key:"descripcion", placeholder: showModal==="ingreso" ? "Ej: Kimono talle M, Remera GB" : "Ej: Alquiler Dojo, Limpieza" },
                            { label:"Monto", type:"number", key:"monto", placeholder:"0" },
                            { label:"Fecha", type:"date", key:"fecha" },
                        ].map(({ label, type, key, options, placeholder }) => (
                            <div key={key} className="space-y-1.5">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{label}</label>
                                {type === "select" ? (
                                    <select value={form[key]} onChange={e => setForm(p => ({...p, [key]: e.target.value}))}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-red-500 transition-all font-semibold">
                                        {options.map(o => <option key={o}>{o}</option>)}
                                    </select>
                                ) : (
                                    <input type={type} placeholder={placeholder} value={form[key]}
                                        onChange={e => setForm(p => ({...p, [key]: e.target.value}))}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-red-500 transition-all font-semibold [color-scheme:dark]"
                                    />
                                )}
                            </div>
                        ))}

                        <button onClick={handleCrearTransaccion} disabled={loading}
                            className={`w-full font-black py-3.5 rounded-2xl shadow-lg transition-all active:scale-95 disabled:opacity-50 text-white ${showModal==="ingreso" ? "bg-green-600 hover:bg-green-500" : "bg-red-600 hover:bg-red-500"}`}>
                            {loading ? "Guardando…" : "Confirmar"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

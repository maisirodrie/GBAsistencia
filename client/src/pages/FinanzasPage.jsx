import { useEffect, useState, useCallback } from "react";
import Swal from "sweetalert2";
import { format } from "date-fns";
import {
    getConfiguracion, updateConfiguracion,
    getResumen, crearTransaccion, eliminarTransaccion,
    pagarMembresia, getEstadoMembresias
} from "../api/finanzas";
import { showAlert, showToast } from "../utils/alerts";

const MESES_ES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const CATEGORIAS_INGRESO = ["Membresía","Artículo","Certificado/Graduación","Otros"];
const CATEGORIAS_EGRESO  = ["Mantenimiento/Servicios","Artículo","Otros"];
const FAJA_COLORS = { Blanca:"bg-white text-gray-900", Azul:"bg-blue-700 text-white", Morada:"bg-purple-700 text-white", "Marrón":"bg-amber-900 text-white", Negra:"bg-black text-white" };

function fmt(n) { return Number(n || 0).toLocaleString("es-AR", { minimumFractionDigits: 0 }); }
// Helper para formatear fecha evitando el shift de zona horaria (mantiene el día real)
function fmtFecha(d, f = "dd/MM") {
    const date = new Date(d);
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    return format(new Date(date.getTime() + userTimezoneOffset), f);
}

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
    const [filtro, setFiltro] = useState("");

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
            showToast("Configuración guardada", "success");
        } catch(e) { 
            showAlert({ title: "Error", text: e.response?.data?.message || "No se pudo guardar la configuración", icon: "error" });
        }
        finally { setLoading(false); }
    }

    async function handleCrearTransaccion() {
        if (!form.monto || Number(form.monto) <= 0) return showAlert({ title: "Atención", text: "Ingresá un monto válido.", icon: "warning" });
        if (!form.categoria) return showAlert({ title: "Atención", text: "Seleccioná una categoría.", icon: "warning" });
        try {
            setLoading(true);
            await crearTransaccion({ ...form, tipo: showModal === "ingreso" ? "INGRESO" : "EGRESO", monto: Number(form.monto) });
            setShowModal(null);
            setForm(initialForm);
            cargarResumen();
            showToast("Movimiento registrado");
        } catch(e) { 
            showAlert({ title: "Error", text: e.response?.data?.message || "Error al crear transacción", icon: "error" });
        }
        finally { setLoading(false); }
    }

    async function handleEliminar(id) {
        const confirm = await showAlert({
            title: "¿Eliminar transacción?",
            text: "Esta acción no se puede deshacer.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Sí, eliminar"
        });
        if (!confirm.isConfirmed) return;
        
        try {
            await eliminarTransaccion(id);
            cargarResumen();
            showToast("Transacción eliminada", "info");
        } catch (e) {
            showAlert({ title: "Error", text: "No se pudo eliminar la transacción", icon: "error" });
        }
    }

    async function handlePagarMembresia(alumnoId) {
        const today = new Date().toISOString().split('T')[0];
        
        const { value: fechaPago } = await Swal.fire({
            title: 'Cobrar Membresía',
            html: `
                <div class="space-y-4 text-left">
                    <div>
                        <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Fecha de Pago</label>
                        <input id="fecha-pago" type="date" value="${today}" 
                            class="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-red-500 transition-all font-semibold [color-scheme:dark]"
                        >
                    </div>
                    <div id="pago-detalle" class="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50 space-y-2">
                        {/* El detalle se carga dinámicamente aquí */}
                    </div>
                </div>
            `,
            background: '#0f172a',
            color: '#f8fafc',
            showCancelButton: true,
            confirmButtonText: 'Confirmar Pago',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#e11d48',
            cancelButtonColor: '#334155',
            customClass: {
                popup: 'rounded-[2rem] border border-slate-800 shadow-2xl',
                confirmButton: 'rounded-xl px-6 py-3 font-black uppercase tracking-widest text-xs',
                cancelButton: 'rounded-xl px-6 py-3 font-black uppercase tracking-widest text-xs'
            },
            didOpen: () => {
                const input = document.getElementById('fecha-pago');
                const detalle = document.getElementById('pago-detalle');
                
                const actualizarDetalle = (fechaStr) => {
                    const d = new Date(fechaStr + "T12:00:00"); // Evitar problemas de zona horaria
                    const dia = d.getDate();
                    const hayRecargo = dia > config.diaCierreCobranza;
                    const montoFinal = hayRecargo
                        ? Math.round(config.precioMembresia * (1 + config.porcentajeRecargo / 100))
                        : config.precioMembresia;

                    detalle.innerHTML = `
                        <div class="flex justify-between text-sm">
                            <span class="text-slate-400">Base:</span>
                            <span class="font-bold text-white">${config.moneda}${fmt(config.precioMembresia)}</span>
                        </div>
                        ${hayRecargo ? `
                        <div class="flex justify-between text-sm">
                            <span class="text-orange-400">Recargo (${config.porcentajeRecargo}%):</span>
                            <span class="font-bold text-orange-400">+${config.moneda}${fmt(montoFinal - config.precioMembresia)}</span>
                        </div>
                        ` : ''}
                        <div class="pt-2 border-t border-slate-700 flex justify-between items-end">
                            <span class="text-xs font-black text-slate-400 uppercase">Total:</span>
                            <span class="text-2xl font-black text-white">${config.moneda}${fmt(montoFinal)}</span>
                        </div>
                        <p class="text-[9px] font-bold text-slate-500 mt-2 uppercase text-center">
                            ${hayRecargo ? '⚠️ Se aplica mora por pago fuera de término' : '✅ Pago en término'}
                        </p>
                    `;
                };

                input.addEventListener('change', (e) => actualizarDetalle(e.target.value));
                actualizarDetalle(today);
            },
            preConfirm: () => {
                return document.getElementById('fecha-pago').value;
            }
        });

        if (!fechaPago) return;

        try {
            // El backend ya calcula el recargo según la fecha que le enviemos
            await pagarMembresia({ alumnoId, periodo: mesActual, fechaPago });
            showToast("Pago registrado con éxito");
            cargarMembresias();
            cargarResumen();
        } catch(e) { 
            showAlert({ title: "Error", text: e.response?.data?.message || "No se pudo registrar el pago", icon: "error" });
        }
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
                                <div key={t._id} className="flex items-start sm:items-center gap-3 sm:gap-4 px-4 sm:px-6 py-4 hover:bg-slate-800/50 transition-all border-b border-slate-700/10 last:border-0 relative">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black flex-shrink-0 mt-1 sm:mt-0 ${t.tipo==="INGRESO" ? "bg-green-900/50 text-green-400 border border-green-700/40" : "bg-red-900/50 text-red-400 border border-red-700/40"}`}>
                                        {t.tipo==="INGRESO" ? "↑" : "↓"}
                                    </div>
                                    <div className="flex-1 min-w-0 pr-2">
                                        <p className="font-bold text-white text-sm sm:text-base leading-tight break-words">
                                            {t.descripcion || t.categoria}
                                        </p>
                                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                            {/* Solo mostrar categoría si no es Membresía (ya está en la descripción) */}
                                            {t.categoria !== 'Membresía' && (
                                                <span className="bg-slate-900 px-1.5 py-0.5 rounded-md border border-slate-700 text-[9px] text-slate-400 font-black uppercase tracking-wider flex-shrink-0">{t.categoria}</span>
                                            )}
                                            
                                            {/* Solo mostrar nombre si no está ya incluido en la descripción (evita redundancia) */}
                                            {t.alumnoId && !t.descripcion?.includes(t.alumnoId.nombre) && (
                                                <span className="text-blue-400 text-[11px] font-bold truncate max-w-[120px]">
                                                    {t.alumnoId.nombre} {t.alumnoId.apellido || ""}
                                                </span>
                                            )}
                                            
                                            {t.tuvoRecargo && (
                                                <span className="text-orange-400 text-[9px] font-black uppercase tracking-tighter bg-orange-500/10 px-1.5 py-0.5 rounded border border-orange-500/20 flex-shrink-0">
                                                    ⚠ Mora
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right flex-shrink-0 flex flex-col items-end gap-0.5 pr-6 sm:pr-0">
                                        <p className={`font-black text-base sm:text-lg leading-none ${t.tipo==="INGRESO" ? "text-green-400" : "text-red-400"}`}>
                                            {t.tipo==="INGRESO" ? "+" : "-"}{config.moneda}{fmt(t.monto)}
                                        </p>
                                        <p className="text-[10px] text-slate-500 font-bold">{fmtFecha(t.fecha, "dd/MM/yy")}</p>
                                    </div>
                                    <button onClick={() => handleEliminar(t._id)} className="absolute top-4 right-1 sm:static text-slate-600 hover:text-red-500 transition-colors sm:ml-2 flex-shrink-0 p-1 bg-slate-900/40 rounded-md sm:bg-transparent" title="Eliminar">✕</button>
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

                {/* Buscador de Alumnos */}
                <div className="relative group">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-blue-400 transition-colors">
                        <span className="text-xl">🔍</span>
                    </div>
                    <input 
                        type="text"
                        placeholder="Buscar alumno por nombre o apellido..."
                        value={filtro}
                        onChange={(e) => setFiltro(e.target.value)}
                        className="w-full bg-slate-900/50 border border-slate-700/50 rounded-2xl py-4 pl-12 pr-4 text-white outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium placeholder:text-slate-600"
                    />
                    {filtro && (
                        <button 
                            onClick={() => setFiltro("")}
                            className="absolute inset-y-0 right-4 flex items-center text-slate-500 hover:text-white"
                        >
                            ✕
                        </button>
                    )}
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {estadoMem
                        .filter(({ alumno }) => {
                            const term = filtro.toLowerCase();
                            return (alumno.nombre?.toLowerCase().includes(term) || alumno.apellido?.toLowerCase().includes(term));
                        })
                        .map(({ alumno, pago }) => (
                        <div key={alumno._id} className={`rounded-2xl p-4 border shadow-lg flex flex-col gap-3 ${pago ? "bg-green-900/20 border-green-700/40" : "bg-slate-800/30 border-slate-700/50"}`}>
                            <div className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center text-lg flex-shrink-0 border border-slate-600/50 overflow-hidden">
                                    {alumno.fotoUrl ? (
                                        <img 
                                            src={alumno.fotoUrl.startsWith('http') ? alumno.fotoUrl : `http://${window.location.hostname}:4000/uploads/${alumno.fotoUrl}`} 
                                            alt="Perfil" 
                                            className="w-full h-full object-cover" 
                                        />
                                    ) : (
                                        <span className="text-white">{alumno.nombre?.charAt(0)}</span>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0 pr-1">
                                    <p className="block font-bold text-white text-[13px] leading-tight mb-1 break-words">{alumno.nombre} {alumno.apellido || ""}</p>
                                    <span className={`inline-block text-[9px] font-black px-2 py-0.5 rounded-full ${FAJA_COLORS[alumno.faja] || "bg-slate-600 text-white"}`}>{alumno.faja} {alumno.grado}°</span>
                                </div>
                            </div>

                            {pago ? (
                                <div className="bg-green-900/30 border border-green-700/30 rounded-xl px-3 py-2 text-center">
                                    <p className="text-green-400 font-black text-sm">✔ Pago</p>
                                    <p className="text-green-300 text-xs">{config.moneda}{fmt(pago.monto)} · {fmtFecha(pago.fecha)}{pago.tuvoRecargo && " ⚠ mora"}</p>
                                </div>
                            ) : (
                                <button onClick={() => handlePagarMembresia(alumno._id)}
                                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl text-sm transition-all active:scale-95 border border-blue-500/50 shadow-md">
                                    Cobrar Membresía
                                </button>
                            )}
                        </div>
                    ))}
                    {estadoMem.length > 0 && estadoMem.filter(({ alumno }) => (alumno.nombre?.toLowerCase().includes(filtro.toLowerCase()) || alumno.apellido?.toLowerCase().includes(filtro.toLowerCase()))).length === 0 && (
                        <div className="col-span-full py-12 text-center text-slate-500">
                            <p className="text-3xl mb-2">🔍</p>
                            <p className="font-bold text-lg">No se encontraron alumnos con "{filtro}"</p>
                        </div>
                    )}
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

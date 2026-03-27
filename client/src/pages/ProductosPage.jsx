import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { format } from "date-fns";
import { getAlumnos } from "../api/alumnos";
import {
    getTodosProductos, crearProducto, updateProducto,
    deleteProducto, ajustarStock, venderProducto, getVentasProductos
} from "../api/productos";
import { getPlanesAlumno, crearPlan, pagarCuota, cancelarPlan } from "../api/planes";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";

const CATEGORIAS = ['Kimono', 'Remera', 'Cinturón', 'Certificado/Graduación', 'Protección', 'Otros'];
const CAT_ICONS = { 'Kimono':'🥋', 'Remera':'👕', 'Cinturón':'🟫', 'Certificado/Graduación':'📜', 'Protección':'🛡️', 'Otros':'📦' };
const CAT_COLORS = { 'Kimono':'#3b82f6', 'Remera':'#8b5cf6', 'Cinturón':'#f59e0b', 'Certificado/Graduación':'#10b981', 'Protección':'#ef4444', 'Otros':'#94a3b8' };
const STOCK_MIN = 3;
const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const PLAN_ESTADOS = { pendiente:"bg-yellow-900/30 text-yellow-400 border-yellow-700/30", completado:"bg-green-900/30 text-green-400 border-green-700/30", cancelado:"bg-slate-700/40 text-slate-400 border-slate-600/30" };

function fmt(n) { return Number(n || 0).toLocaleString("es-AR", { minimumFractionDigits: 0 }); }
const emptyProducto = { nombre:'', descripcion:'', categoria:'Kimono', precio:'', stock:'' };

// Portal helper para modales — escapa stacking contexts de backdrop-blur
function PortalModal({ show, onClose, children }) {
    if (!show) return null;
    return createPortal(
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
            style={{ zIndex: 9999 }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            {children}
        </div>,
        document.body
    );
}

// ─── Gráfico de ventas mensuales ───
function buildMensual(ventas) {
    const anio = new Date().getFullYear();
    const counts = Array(12).fill(0).map((_, i) => ({ mes: MESES[i], ventas: 0, monto: 0 }));
    for (const v of ventas) {
        const d = new Date(v.fecha);
        if (d.getFullYear() === anio) {
            counts[d.getMonth()].ventas += v.cantidad;
            counts[d.getMonth()].monto += v.montoTotal;
        }
    }
    return counts;
}

function buildPorCategoria(ventas) {
    const map = {};
    for (const v of ventas) {
        // Normalizar categoría para intentar matchear con iconos/colores
        const rawCat = v.productoId?.categoria || 'Otros';
        const matchedCat = CATEGORIAS.find(c => c.toLowerCase() === rawCat.toLowerCase());
        const cat = matchedCat || rawCat;
        
        if (!map[cat]) map[cat] = { name: cat, value: 0, monto: 0 };
        map[cat].value += (v.cantidad || 1);
        map[cat].monto += (v.montoTotal || 0);
    }
    return Object.values(map);
}

const CustomTooltipBar = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 shadow-xl text-xs">
            <p className="font-black text-white mb-1">{label}</p>
            <p className="text-blue-400">{payload[0]?.value} unidades</p>
            {payload[1] && <p className="text-green-400">${fmt(payload[1]?.value)}</p>}
        </div>
    );
};

// ─── Panel de Planes por alumno ───
function PlanesSection({ alumnos, onUpdate }) {
    const [selAlumnoId, setSelAlumnoId] = useState('');
    const [planes, setPlanes] = useState([]);
    const [productos, setProductos] = useState([]);
    const [modal, setModal] = useState(null);
    const [selPlan, setSelPlan] = useState(null);
    const [form, setForm] = useState({ descripcion:'', productoId:'', montoTotal:'', notas:'', esPlan: true });
    const [pagoForm, setPagoForm] = useState({ monto:'', nota:'' });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        getTodosProductos().then(({ data }) => setProductos(data)).catch(() => {});
    }, []);

    useEffect(() => {
        if (!selAlumnoId) { setPlanes([]); return; }
        getPlanesAlumno(selAlumnoId).then(({ data }) => setPlanes(data)).catch(() => {});
    }, [selAlumnoId]);

    const recargar = () => {
        if (selAlumnoId) getPlanesAlumno(selAlumnoId).then(({ data }) => setPlanes(data)).catch(() => {});
    };

    async function handleCrear() {
        if (!selAlumnoId) return alert("Seleccioná un alumno primero.");
        if (!form.descripcion || !form.montoTotal) return alert("Descripción y monto son obligatorios.");
        setLoading(true);
        try {
            if (form.esPlan) {
                await crearPlan({ alumnoId: selAlumnoId, productoId: form.productoId || null, descripcion: form.descripcion, montoTotal: Number(form.montoTotal), notas: form.notas });
            } else {
                // Venta directa
                await venderProducto({ productoId: form.productoId || null, alumnoId: selAlumnoId, montoTotal: Number(form.montoTotal), nota: form.notas || 'Venta directa' });
            }
            setModal(null); setForm({ descripcion:'', productoId:'', montoTotal:'', notas:'', esPlan: true }); recargar();
            if (onUpdate) onUpdate();
        } catch(e) { alert(e.response?.data?.message || "Error"); }
        finally { setLoading(false); }
    }

    async function handlePagar() {
        if (!pagoForm.monto || Number(pagoForm.monto) <= 0) return alert("Ingresá un monto válido.");
        setLoading(true);
        try {
            await pagarCuota(selPlan._id, { monto: Number(pagoForm.monto), nota: pagoForm.nota });
            setModal(null); setPagoForm({ monto:'', nota:'' }); recargar();
        } catch(e) { alert(e.response?.data?.message || "Error"); }
        finally { setLoading(false); }
    }

    async function handleCancelar(id) {
        if (!window.confirm("¿Cancelar este plan?")) return;
        await cancelarPlan(id); recargar();
        if (onUpdate) onUpdate();
    }

    const deudaTotal = planes.filter(p => p.estado === 'pendiente').reduce((s, p) => s + (p.montoTotal - p.montoPagado), 0);

    return (
        <div className="space-y-5">
            {/* Selector de alumno */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
                <div className="flex-1 space-y-1.5">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Alumno</label>
                    <select value={selAlumnoId} onChange={e => setSelAlumnoId(e.target.value)}
                        className="w-full bg-slate-800/60 border border-slate-700 rounded-2xl px-4 py-3 text-white outline-none focus:border-blue-500 transition-all font-semibold">
                        <option value="">— Seleccioná un alumno —</option>
                        {alumnos.map(a => <option key={a._id} value={a._id}>{a.nombre} {a.apellido || ''}</option>)}
                    </select>
                </div>
                {selAlumnoId && (
                    <button onClick={() => setModal("crear")}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-3 rounded-2xl text-sm transition-all active:scale-95 border border-blue-500/50">
                        + Nueva Venta / Plan
                    </button>
                )}
            </div>

            {/* Deuda resumen */}
            {deudaTotal > 0 && (
                <div className="bg-orange-900/20 border border-orange-700/30 rounded-2xl px-5 py-3 flex items-center gap-3">
                    <span className="text-orange-400 text-xl">⚠</span>
                    <div>
                        <p className="text-xs text-orange-400 font-black uppercase tracking-wider">Saldo pendiente del alumno</p>
                        <p className="text-white font-black text-lg">${fmt(deudaTotal)}</p>
                    </div>
                </div>
            )}

            {/* Sin alumno seleccionado */}
            {!selAlumnoId && (
                <div className="text-center py-16 text-slate-600 border border-dashed border-slate-700 rounded-2xl">
                    <p className="text-4xl mb-2">👥</p>
                    <p className="font-bold text-sm">Seleccioná un alumno para ver sus cuotas</p>
                </div>
            )}

            {/* Lista de planes */}
            {selAlumnoId && planes.length === 0 && (
                <div className="text-center py-10 text-slate-600">
                    <p className="text-3xl mb-2">💳</p>
                    <p className="font-bold text-sm">Este alumno no tiene planes de pago activos</p>
                </div>
            )}

            {selAlumnoId && planes.length > 0 && (
                <div className="grid gap-4 sm:grid-cols-2">
                    {planes.map(plan => {
                        const saldo = Math.max(0, plan.montoTotal - plan.montoPagado);
                        const pct = Math.min((plan.montoPagado / plan.montoTotal) * 100, 100);
                        return (
                            <div key={plan._id} className="bg-slate-800/40 rounded-2xl p-5 border border-slate-700/50 space-y-4">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-black text-white leading-tight">{plan.descripcion}</p>
                                        {plan.productoId && <p className="text-xs text-slate-400 mt-0.5">{CAT_ICONS[plan.productoId.categoria] || '📦'} {plan.productoId.nombre}</p>}
                                        {plan.notas && <p className="text-xs text-slate-500 mt-0.5 italic">"{plan.notas}"</p>}
                                    </div>
                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border flex-shrink-0 ${PLAN_ESTADOS[plan.estado]}`}>
                                        {plan.estado.toUpperCase()}
                                    </span>
                                </div>
                                {/* Progress */}
                                <div>
                                    <div className="flex justify-between text-xs mb-2">
                                        <span className="text-slate-400">Pagado: <span className="text-green-400 font-black">${fmt(plan.montoPagado)}</span></span>
                                        <span className="text-slate-400">Total: <span className="text-white font-black">${fmt(plan.montoTotal)}</span></span>
                                    </div>
                                    <div className="h-3 bg-slate-950 rounded-full overflow-hidden border border-black/30 shadow-inner">
                                        <div className={`h-full rounded-full transition-all duration-500 ${plan.estado === 'completado' ? 'bg-green-500' : 'bg-gradient-to-r from-blue-500 to-cyan-400'}`}
                                            style={{ width: `${pct}%` }} />
                                    </div>
                                    {saldo > 0 && <p className="text-xs text-orange-400 font-bold mt-1.5 text-right">Saldo: ${fmt(saldo)}</p>}
                                </div>
                                {/* Historial */}
                                {plan.pagos.length > 0 && (
                                    <div className="border-t border-slate-700/40 pt-3 space-y-1.5">
                                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-wider mb-1">Últimos pagos</p>
                                        {plan.pagos.slice(-4).map((p, i) => (
                                            <div key={i} className="flex justify-between text-xs">
                                                <span className="text-slate-400">{format(new Date(p.fecha), "dd/MM/yy")}{p.nota ? ` · ${p.nota}` : ''}</span>
                                                <span className="text-green-400 font-bold">+${fmt(p.monto)}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {/* Acciones */}
                                {plan.estado === 'pendiente' && (
                                    <div className="flex gap-2 pt-1">
                                        <button onClick={() => { setSelPlan(plan); setPagoForm({ monto:'', nota:'' }); setModal("pagar"); }}
                                            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold py-2.5 rounded-xl transition-all active:scale-95">
                                            💵 Registrar Pago
                                        </button>
                                        <button onClick={() => handleCancelar(plan._id)}
                                            className="px-3 text-slate-500 hover:text-red-400 text-sm transition-all" title="Cancelar plan">✕</button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modales via Portal */}
            <PortalModal show={modal === "crear"} onClose={() => setModal(null)}>
                <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-black text-blue-400">+ {form.esPlan ? "Nuevo Plan de Pago" : "Venta Directa"}</h2>
                        <button onClick={() => setModal(null)} className="text-slate-500 hover:text-white text-xl">✕</button>
                    </div>
                    {/* Toggle Plan vs Directa */}
                    <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
                        <button onClick={() => setForm(p=>({...p, esPlan:false}))} className={`flex-1 py-2 rounded-lg text-xs font-black transition-all ${!form.esPlan ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}>PAGO TOTAL</button>
                        <button onClick={() => setForm(p=>({...p, esPlan:true}))} className={`flex-1 py-2 rounded-lg text-xs font-black transition-all ${form.esPlan ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}>A CUOTAS (PLAN)</button>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Artículo del stock (opcional)</label>
                        <select value={form.productoId} onChange={e => {
                            const p = productos.find(x => x._id === e.target.value);
                            setForm(prev => ({ ...prev, productoId: e.target.value, descripcion: p ? p.nombre : prev.descripcion, montoTotal: p ? p.precio : prev.montoTotal }));
                        }} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 transition-all font-semibold">
                            <option value="">— Ingresar manualmente —</option>
                            {productos.map(p => <option key={p._id} value={p._id}>{CAT_ICONS[p.categoria] || '📦'} {p.nombre} · ${fmt(p.precio)}</option>)}
                        </select>
                    </div>
                    {[
                        { label:"Descripción", key:"descripcion", type:"text", placeholder:"Ej: Kimono GB Talle M" },
                        { label:"Monto Total ($)", key:"montoTotal", type:"number", placeholder:"0" },
                        { label:"Notas (opcional)", key:"notas", type:"text", placeholder:"Ej: 3 cuotas acordadas" },
                    ].map(({ label,key,type,placeholder }) => (
                        <div key={key} className="space-y-1.5">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{label}</label>
                            <input type={type} placeholder={placeholder} value={form[key]}
                                onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 transition-all font-semibold" />
                        </div>
                    ))}
                    <button onClick={handleCrear} disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-3.5 rounded-2xl shadow-lg transition-all active:scale-95 disabled:opacity-50">
                        {loading ? "Guardando…" : form.esPlan ? "Crear Plan" : "Confirmar Venta Total"}
                    </button>
                </div>
            </PortalModal>

            <PortalModal show={modal === "pagar" && !!selPlan} onClose={() => setModal(null)}>
                {selPlan && (
                    <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-black text-green-400">💵 Registrar Pago</h2>
                            <button onClick={() => setModal(null)} className="text-slate-500 hover:text-white text-xl">✕</button>
                        </div>
                        <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/50">
                            <p className="font-bold text-white text-sm">{selPlan.descripcion}</p>
                            <p className="text-xs text-orange-400 mt-1 font-bold">Saldo: ${fmt(selPlan.montoTotal - selPlan.montoPagado)}</p>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Monto a abonar</label>
                            <input type="number" placeholder="0" value={pagoForm.monto}
                                onChange={e => setPagoForm(prev => ({ ...prev, monto: e.target.value }))}
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-green-500 transition-all font-black text-2xl text-center" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Nota (opcional)</label>
                            <input type="text" placeholder="Ej: Cuota 2 de 3" value={pagoForm.nota}
                                onChange={e => setPagoForm(prev => ({ ...prev, nota: e.target.value }))}
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-green-500 transition-all font-semibold" />
                        </div>
                        <button onClick={handlePagar} disabled={loading}
                            className="w-full bg-green-600 hover:bg-green-500 text-white font-black py-3.5 rounded-2xl shadow-lg transition-all active:scale-95 disabled:opacity-50">
                            {loading ? "Guardando…" : "Confirmar Pago"}
                        </button>
                    </div>
                )}
            </PortalModal>
        </div>
    );
}

// ─── Componente principal ───
export default function ProductosPage() {
    const [productos, setProductos] = useState([]);
    const [ventas, setVentas] = useState([]);
    const [planes, setPlanes] = useState([]);
    const [alumnos, setAlumnos] = useState([]);
    const [tab, setTab] = useState("stock");
    const [modal, setModal] = useState(null);
    const [selProducto, setSelProducto] = useState(null);
    const [form, setForm] = useState(emptyProducto);
    const [ventaForm, setVentaForm] = useState({ alumnoId:'', cantidad:1, nota:'' });
    const [stockEdit, setStockEdit] = useState('');
    const [loading, setLoading] = useState(false);

    const cargarProductos = useCallback(async () => { const { data } = await getTodosProductos(); setProductos(data); }, []);
    const cargarVentas = useCallback(async () => { const { data } = await getVentasProductos(); setVentas(data); }, []);
    const cargarPlanesDashboard = useCallback(async () => { const { data } = await getTodosPlanes(); setPlanes(data); }, []);

    useEffect(() => { cargarProductos(); }, [cargarProductos]);
    useEffect(() => {
        if (tab === "ventas" || tab === "graficos") {
            cargarVentas();
            cargarPlanesDashboard();
        }
    }, [tab, cargarVentas, cargarPlanesDashboard]);
    useEffect(() => { getAlumnos().then(({ data }) => setAlumnos(data)).catch(() => {}); }, []);

    const openCrear  = () => { setForm(emptyProducto); setModal("crear"); };
    const openEditar = (p) => { setSelProducto(p); setForm({ nombre:p.nombre, descripcion:p.descripcion, categoria:p.categoria, precio:p.precio, stock:p.stock }); setModal("editar"); };
    const openVender = (p) => { setSelProducto(p); setVentaForm({ alumnoId:'', cantidad:1, nota:'' }); setModal("vender"); };
    const openStock  = (p) => { setSelProducto(p); setStockEdit(String(p.stock)); setModal("stock"); };

    async function handleCrear() {
        if (!form.nombre || !form.precio) return alert("Nombre y precio son obligatorios.");
        setLoading(true);
        try { await crearProducto({ ...form, precio:Number(form.precio), stock:Number(form.stock||0) }); setModal(null); cargarProductos(); }
        catch(e) { alert(e.response?.data?.message||"Error"); } finally { setLoading(false); }
    }
    async function handleEditar() {
        setLoading(true);
        try { await updateProducto(selProducto._id, { ...form, precio:Number(form.precio), stock:Number(form.stock) }); setModal(null); cargarProductos(); }
        catch(e) { alert(e.response?.data?.message||"Error"); } finally { setLoading(false); }
    }

    async function handleAjusteStock() {
        if (stockEdit===''||Number(stockEdit)<0) return alert("Stock inválido.");
        setLoading(true);
        try { await ajustarStock(selProducto._id, Number(stockEdit)); setModal(null); cargarProductos(); cargarVentas(); cargarPlanesDashboard(); }
        catch(e) { alert(e.response?.data?.message||"Error"); } finally { setLoading(false); }
    }
    async function handleDelete(p) {
        if (!window.confirm(`¿Desactivar "${p.nombre}"?`)) return;
        await deleteProducto(p._id); cargarProductos();
    }

    const stockBajo = productos.filter(p => p.activo && p.stock > 0 && p.stock <= STOCK_MIN).length;
    const sinStockCount = productos.filter(p => p.activo && p.stock === 0).length;

    // Chart data
    const dataMensual = buildMensual(ventas);
    const dataCategorias = buildPorCategoria(ventas);
    const totalVentas = ventas.reduce((s, v) => s + (v.montoTotal || 0), 0);
    const totalPendiente = planes.filter(p => p.estado === 'pendiente').reduce((s, p) => s + (p.montoTotal - p.montoPagado), 0);
    const totalCobrado = totalVentas - totalPendiente;
    const totalUnidades = ventas.reduce((s, v) => s + (v.cantidad || 1), 0);

    const TABS = [
        ["stock","📦 Inventario"],
        ["graficos","📊 Gráficos"],
        ["planes","💳 Ventas"],
        ["ventas","🧾 Historial"],
    ];

    return (
        <div className="max-w-6xl mx-auto pb-16 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/40 p-4 rounded-3xl border border-slate-800">
                <div>
                    <h1 className="text-2xl font-black tracking-tight">📦 Stock & Artículos</h1>
                    <p className="text-slate-400 text-sm mt-0.5">Inventario, ventas y cuotas del Dojo</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => { cargarProductos(); cargarVentas(); }} title="Recargar datos"
                        className="bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white p-2.5 rounded-2xl border border-slate-700 transition-all active:rotate-180">
                        🔄
                    </button>
                    <button onClick={openCrear} className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold px-5 py-2.5 rounded-2xl text-sm shadow-lg transition-all active:scale-95 border border-red-500/50">
                        + Nuevo Artículo
                    </button>
                </div>
            </div>

            {/* Alertas */}
            {(stockBajo > 0 || sinStockCount > 0) && (
                <div className="flex gap-3 flex-wrap">
                    {sinStockCount > 0 && <div className="bg-red-900/30 border border-red-700/40 rounded-2xl px-5 py-3 flex items-center gap-2"><span className="text-red-400 font-black text-sm">❌ Sin stock:</span><span className="text-white font-bold text-sm">{sinStockCount} artículo{sinStockCount>1?'s':''}</span></div>}
                    {stockBajo > 0 && <div className="bg-orange-900/30 border border-orange-700/40 rounded-2xl px-5 py-3 flex items-center gap-2"><span className="text-orange-400 font-black text-sm">⚠ Stock bajo:</span><span className="text-white font-bold text-sm">{stockBajo} artículo{stockBajo>1?'s':''}</span></div>}
                </div>
            )}

            {/* Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-800/40 p-1.5 rounded-2xl border border-slate-700/50">
                {TABS.map(([k,lbl]) => (
                    <button key={k} onClick={() => setTab(k)}
                        className={`py-2.5 rounded-xl text-sm font-bold transition-all ${tab===k ? "bg-slate-900 text-white shadow-md border border-slate-600" : "text-slate-400 hover:text-white"}`}>
                        {lbl}
                    </button>
                ))}
            </div>

            {/* ─── TAB: INVENTARIO ─── */}
            {tab === "stock" && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {productos.filter(p => p.activo).length === 0 && (
                        <div className="col-span-3 text-center py-20 text-slate-500 border border-dashed border-slate-700 rounded-2xl">
                            <p className="text-4xl mb-3">📭</p>
                            <p className="font-bold">No hay artículos cargados</p>
                            <button onClick={openCrear} className="mt-4 bg-red-600 hover:bg-red-500 text-white px-5 py-2 rounded-xl font-bold text-sm">+ Agregar primer artículo</button>
                        </div>
                    )}
                    {productos.filter(p => p.activo).map(p => {
                        const ok = p.stock > STOCK_MIN;
                        const warn = p.stock > 0 && p.stock <= STOCK_MIN;
                        const sin = p.stock === 0;
                        return (
                            <div key={p._id} className="bg-slate-800/30 rounded-2xl border border-slate-700/50 shadow-lg overflow-hidden flex flex-col">
                                <div className="p-5 flex-1">
                                    <div className="flex items-start justify-between gap-3 mb-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl">{CAT_ICONS[p.categoria]||'📦'}</span>
                                            <div>
                                                <h3 className="font-black text-white text-base leading-tight">{p.nombre}</h3>
                                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{p.categoria}</span>
                                            </div>
                                        </div>
                                        <div className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-black border ${ok?'bg-green-900/30 text-green-400 border-green-700/30':warn?'bg-orange-900/30 text-orange-400 border-orange-700/30':'bg-red-900/30 text-red-400 border-red-700/30'}`}>
                                            {sin?'Sin stock':`${p.stock} unid.`}
                                        </div>
                                    </div>
                                    {p.descripcion && <p className="text-xs text-slate-400 mb-3">{p.descripcion}</p>}
                                    <p className="text-2xl font-black text-white">${fmt(p.precio)}</p>
                                </div>
                                <div className="border-t border-slate-700/50 p-3 flex gap-2">
                                    <button onClick={() => openStock(p)} className="flex-1 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white border border-slate-600 text-sm font-bold transition-all" title="Ajustar Stock">Stock: + / −</button>
                                    <button onClick={() => openEditar(p)} className="px-3 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white border border-slate-600 text-sm transition-all" title="Editar">✏️</button>
                                    <button onClick={() => handleDelete(p)} className="px-3 py-2.5 rounded-xl bg-slate-700 hover:bg-red-800/60 text-slate-400 hover:text-red-400 border border-slate-600 text-sm transition-all" title="Desactivar">🗑</button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ─── TAB: GRÁFICOS ─── */}
            {tab === "graficos" && (
                <div className="space-y-6">
                    {/* Summary cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { label:"Vendido (Total)", value:`$${fmt(totalVentas)}`, color:"text-white", bg:"bg-slate-800/30 border-slate-700/50" },
                            { label:"Cobrado (Efectivo)", value:`$${fmt(totalCobrado)}`, color:"text-green-400", bg:"bg-green-500/10 border-green-500/20" },
                            { label:"Pendiente (Deuda)", value:`$${fmt(totalPendiente)}`, color:"text-orange-400", bg:"bg-orange-500/10 border-orange-500/20" },
                            { label:"En Stock", value:productos.filter(p=>p.activo).reduce((s,p)=>s+p.stock,0), color:"text-purple-400", bg:"bg-purple-500/10 border-purple-500/20" },
                        ].map(({label,value,color,bg}) => (
                            <div key={label} className={`rounded-xl p-4 border ${bg} text-center shadow-sm`}>
                                <p className={`text-2xl font-black ${color}`}>{value}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1.5">{label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Ventas mensuales */}
                    <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 p-6 shadow-xl">
                        <h3 className="font-black text-white mb-1">Ventas Mensuales {new Date().getFullYear()}</h3>
                        <p className="text-xs text-slate-400 mb-5">Unidades vendidas y recaudación por mes</p>
                        <div style={{ height: 260 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={dataMensual} margin={{ top:10, right:10, left:-15, bottom:0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                    <XAxis dataKey="mes" tick={{ fill:"#94a3b8", fontSize:11, fontWeight:700 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fill:"#64748b", fontSize:11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                                    <Tooltip content={<CustomTooltipBar />} cursor={{ fill:"rgba(148,163,184,0.05)" }} />
                                    <Bar dataKey="ventas" name="Unidades" fill="#3b82f6" radius={[6,6,2,2]} maxBarSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Por categoría */}
                    {dataCategorias.length > 0 && (
                        <div className="grid sm:grid-cols-2 gap-6">
                            <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 p-6 shadow-xl">
                                <h3 className="font-black text-white mb-1">Ventas por Categoría</h3>
                                <p className="text-xs text-slate-400 mb-5">Unidades vendidas por tipo de artículo</p>
                                <div style={{ height: 220 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={dataCategorias} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} paddingAngle={3}>
                                                {dataCategorias.map((entry) => (
                                                    <Cell key={entry.name} fill={CAT_COLORS[entry.name] || '#94a3b8'} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(v, n) => [`${v} unid.`, n]} contentStyle={{ background:'#0f172a', border:'1px solid #334155', borderRadius:'12px', fontSize:'12px' }} />
                                            <Legend formatter={(v) => <span style={{ color:'#94a3b8', fontSize:'11px', fontWeight:700 }}>{CAT_ICONS[v]||'📦'} {v}</span>} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                            <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 p-6 shadow-xl">
                                <h3 className="font-black text-white mb-4">Recaudación por Categoría</h3>
                                <div className="space-y-3">
                                    {dataCategorias.sort((a,b) => b.monto - a.monto).map(cat => (
                                        <div key={cat.name}>
                                            <div className="flex justify-between items-center text-sm mb-1">
                                                <span className="text-slate-300 font-bold">{CAT_ICONS[cat.name]||'📦'} {cat.name}</span>
                                                <span className="text-white font-black">${fmt(cat.monto)}</span>
                                            </div>
                                            <div className="h-2 bg-slate-950 rounded-full overflow-hidden">
                                                <div className="h-full rounded-full" style={{ width:`${(cat.monto/totalVentas*100)||0}%`, background: CAT_COLORS[cat.name]||'#94a3b8' }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                    {dataCategorias.length === 0 && (
                        <div className="text-center py-16 text-slate-600 border border-dashed border-slate-700 rounded-2xl">
                            <p className="text-4xl mb-2">📊</p>
                            <p className="font-bold">Sin ventas registradas aún</p>
                        </div>
                    )}
                </div>
            )}

            {/* ─── TAB: HISTORIAL ─── */}
            {tab === "ventas" && (
                <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 overflow-hidden shadow-xl">
                    <div className="px-6 py-4 border-b border-slate-700/50 flex justify-between items-center">
                        <h3 className="font-black text-white">Historial de Ventas</h3>
                        <span className="text-xs text-slate-400 bg-slate-900 px-3 py-1 rounded-full border border-slate-700">{ventas.length} registros</span>
                    </div>
                    {ventas.length === 0 ? (
                        <div className="py-16 text-center text-slate-500"><p className="text-3xl mb-2">🧾</p><p className="font-bold">Sin ventas</p></div>
                    ) : (
                        <div className="divide-y divide-slate-700/30">
                            {ventas.map(v => (
                                <div key={v._id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-800/40 transition-all">
                                    <div className="text-2xl w-10 text-center flex-shrink-0">{CAT_ICONS[v.productoId?.categoria]||'📦'}</div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-white text-sm">{v.productoId?.nombre||'Producto eliminado'}{v.cantidad>1&&<span className="text-slate-400 ml-1">×{v.cantidad}</span>}</p>
                                        <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                                            {v.alumnoId ? <span className="text-blue-400">{v.alumnoId.nombre} {v.alumnoId.apellido||''}</span> : <span>Sin alumno</span>}
                                            {v.nota?.includes('cuotas') && <span className="bg-blue-900/30 text-blue-400 text-[10px] font-black px-1.5 py-0.5 rounded border border-blue-700/30 uppercase tracking-tighter">Cuotas</span>}
                                            {v.nota && !v.nota.includes('cuotas') && <span className="text-slate-500">· {v.nota}</span>}
                                        </p>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <p className="font-black text-green-400">+${fmt(v.montoTotal)}</p>
                                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter mb-1">Venta Total</p>
                                        <p className="text-[10px] text-slate-600">{format(new Date(v.fecha), "dd/MM/yyyy HH:mm")}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ─── TAB: CUOTAS ─── */}
            {tab === "planes" && (
                <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 p-6 shadow-xl">
                    <div className="flex items-center gap-2 border-b border-slate-700/50 pb-4 mb-6">
                        <span className="bg-blue-500/20 text-blue-400 p-2 rounded-xl border border-blue-500/20 text-base">💳</span>
                        <div>
                            <h3 className="font-black text-white">Gestión de Ventas</h3>
                            <p className="text-xs text-slate-400 mt-0.5">Ventas directas o planes de pago por alumno</p>
                        </div>
                    </div>
                    <PlanesSection alumnos={alumnos} onUpdate={() => { cargarProductos(); cargarVentas(); cargarPlanesDashboard(); }} />
                </div>
            )}

            {/* ─── MODALES (Productos) ─── */}
            <PortalModal show={modal === "crear" || modal === "editar"} onClose={() => setModal(null)}>
                <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-black text-white">{modal==="crear" ? "+ Nuevo Artículo" : "✏️ Editar Artículo"}</h2>
                        <button onClick={() => setModal(null)} className="text-slate-500 hover:text-white text-xl">✕</button>
                    </div>
                    {[
                        { label:"Nombre", type:"text", key:"nombre", placeholder:"Ej: Kimono GB Talle M" },
                        { label:"Descripción (opcional)", type:"text", key:"descripcion", placeholder:"Ej: Color blanco, talle M" },
                        { label:"Precio", type:"number", key:"precio", placeholder:"0" },
                        { label:"Stock inicial", type:"number", key:"stock", placeholder:"0" },
                    ].map(({ label,type,key,placeholder }) => (
                        <div key={key} className="space-y-1.5">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{label}</label>
                            <input type={type} placeholder={placeholder} value={form[key]}
                                onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-red-500 transition-all font-semibold" />
                        </div>
                    ))}
                    <div className="space-y-1.5">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Categoría</label>
                        <select value={form.categoria} onChange={e => setForm(p => ({ ...p, categoria: e.target.value }))}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-red-500 transition-all font-semibold">
                            {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
                        </select>
                    </div>
                    <button onClick={modal==="crear" ? handleCrear : handleEditar} disabled={loading}
                        className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black py-3.5 rounded-2xl shadow-lg transition-all active:scale-95 disabled:opacity-50">
                        {loading ? "Guardando…" : modal==="crear" ? "Crear Artículo" : "Guardar Cambios"}
                    </button>
                </div>
            </PortalModal>



            <PortalModal show={modal === "stock" && !!selProducto} onClose={() => setModal(null)}>
                {selProducto && (
                    <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-black text-white">Ajustar Stock</h2>
                            <button onClick={() => setModal(null)} className="text-slate-500 hover:text-white text-xl">✕</button>
                        </div>
                        <p className="text-slate-300 font-bold">{selProducto.nombre}</p>
                        <div className="space-y-1.5">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Nuevo valor de stock</label>
                            <input type="number" min={0} value={stockEdit} onChange={e => setStockEdit(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-red-500 transition-all font-black text-2xl text-center" />
                        </div>
                        <button onClick={handleAjusteStock} disabled={loading}
                            className="w-full bg-gradient-to-r from-red-600 to-rose-600 text-white font-black py-3.5 rounded-2xl shadow-lg transition-all active:scale-95 disabled:opacity-50">
                            {loading ? "Guardando…" : "Actualizar Stock"}
                        </button>
                    </div>
                )}
            </PortalModal>
        </div>
    );
}

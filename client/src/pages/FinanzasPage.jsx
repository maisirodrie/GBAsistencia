import { useEffect, useState, useCallback } from "react";
import Swal from "sweetalert2";
import { format } from "date-fns";
import {
    getConfiguracion, updateConfiguracion,
    getResumen, crearTransaccion, eliminarTransaccion,
    pagarMembresia, getEstadoMembresias
} from "../api/finanzas";
import { 
    getTodosProductos, crearProducto, updateProducto, 
    deleteProducto, ajustarStock, venderProducto, getVentasProductos 
} from "../api/productos";
import { getAlumnos } from "../api/alumnos";
import { getPlanesAlumno, crearPlan, pagarCuota, cancelarPlan } from "../api/planes";
import { showAlert, showToast } from "../utils/alerts";
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
    ResponsiveContainer, PieChart, Pie, Cell, Legend 
} from "recharts";
import BeltBadge from "../components/BeltBadge";
import { createPortal } from "react-dom";

const MESES_ES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const CATEGORIAS_INGRESO = ["Membresía","Artículo","Certificado/Graduación","Otros"];
const CATEGORIAS_EGRESO  = ["Mantenimiento/Servicios","Artículo","Otros"];
const FAJA_COLORS = { Blanca:"bg-white text-gray-900", Azul:"bg-blue-700 text-white", Morada:"bg-purple-700 text-white", "Marrón":"bg-amber-900 text-white", Negra:"bg-black text-white" };

function fmt(n) { return Number(n || 0).toLocaleString("es-AR", { minimumFractionDigits: 0 }); }
// Helper para formatear fecha evitando el shift de zona horaria (mantiene el día real)
function fmtFecha(d, f = "dd/MM") {
    if (!d) return "-";
    const date = new Date(d);
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    return format(new Date(date.getTime() + userTimezoneOffset), f);
}

const CATEGORIAS_STOCK = ['Kimono', 'Remera', 'Cinturón', 'Certificado/Graduación', 'Protección', 'Otros'];
const CAT_ICONS = { 'Kimono':'🥋', 'Remera':'👕', 'Cinturón':'🟫', 'Certificado/Graduación':'📜', 'Protección':'🛡️', 'Otros':'📦' };
const CAT_COLORS = { 'Kimono':'#3b82f6', 'Remera':'#8b5cf6', 'Cinturón':'#f59e0b', 'Certificado/Graduación':'#10b981', 'Protección':'#ef4444', 'Otros':'#94a3b8' };
const PLAN_ESTADOS = { pendiente:"bg-yellow-900/30 text-yellow-400 border-yellow-700/30", completado:"bg-green-900/30 text-green-400 border-green-700/30", cancelado:"bg-slate-700/40 text-slate-400 border-slate-600/30" };
const STOCK_MIN = 3;

// Portal helper para modales
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

const initialForm = { tipo:"INGRESO", categoria:"Artículo", monto:"", descripcion:"", fecha: format(new Date(),"yyyy-MM-dd"), alumnoId:"" };
const emptyProducto = { nombre:'', descripcion:'', categoria:'Kimono', precio:'', stock:'' };

function buildMensual(ventas) {
    const anio = new Date().getFullYear();
    const MESES_CHART = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
    const counts = Array(12).fill(0).map((_, i) => ({ mes: MESES_CHART[i], ventas: 0, monto: 0 }));
    for (const v of ventas) {
        const d = new Date(v.fecha);
        if (d.getFullYear() === anio) {
            counts[d.getMonth()].ventas += (v.cantidad || 1);
            counts[d.getMonth()].monto += v.montoTotal;
        }
    }
    return counts;
}

function buildPorCategoria(ventas) {
    const map = {};
    for (const v of ventas) {
        const cat = v.productoId?.categoria || 'Otros';
        if (!map[cat]) map[cat] = { name: cat, value: 0, monto: 0 };
        map[cat].value += (v.cantidad || 1);
        map[cat].monto += (v.montoTotal || 0);
    }
    return Object.values(map);
}

export default function FinanzasPage() {
    const today = new Date();
    const [mesActual, setMesActual] = useState(`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}`);
    const [resumen, setResumen] = useState({ totalIngresos:0, totalEgresos:0, gananciaNeta:0, transacciones:[] });
    const [config, setConfig] = useState({ precioMembresia:0, porcentajeRecargo:10, diaCierreCobranza:10, moneda:"$" });
    const [estadoMem, setEstadoMem] = useState([]);
    const [tab, setTab] = useState("resumen"); // resumen | membresias | stock | tienda | config
    const [showModal, setShowModal] = useState(null); // null | "ingreso" | "egreso" | "stock" | "vender" | "plan"
    const [form, setForm] = useState(initialForm);
    const [loading, setLoading] = useState(false);
    const [configEdit, setConfigEdit] = useState(null);
    const [filtro, setFiltro] = useState("");

    // Stock & Tienda states
    const [productos, setProductos] = useState([]);
    const [ventas, setVentas] = useState([]);
    const [alumnos, setAlumnos] = useState([]);
    const [selProducto, setSelProducto] = useState(null);
    const [productoForm, setProductoForm] = useState(emptyProducto);
    const [stockEdit, setStockEdit] = useState('');
    const [selAlumnoId, setSelAlumnoId] = useState('');
    const [searchTermAlumno, setSearchTermAlumno] = useState('');
    const [planes, setPlanes] = useState([]);
    const [selPlan, setSelPlan] = useState(null);
    const [pagoForm, setPagoForm] = useState({ monto:'', nota:'' });
    const [ventaPlanForm, setVentaPlanForm] = useState({ descripcion:'', productoId:'', montoTotal:'', notas:'', esPlan: true });

    // Pagination states
    const [pageResumen, setPageResumen] = useState(1);
    const [pageMem, setPageMem] = useState(1);
    const [pageStock, setPageStock] = useState(1);
    const [pageTienda, setPageTienda] = useState(1);

    const LIMIT_RESUMEN = 12;
    const LIMIT_MEM = 30;
    const LIMIT_STOCK = 8;
    const LIMIT_TIENDA = 6;

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

    const cargarStock = useCallback(async () => {
        const { data } = await getTodosProductos();
        setProductos(data);
    }, []);

    const cargarTienda = useCallback(async () => {
        const { data: v } = await getVentasProductos();
        setVentas(v);
        const { data: a } = await getAlumnos();
        setAlumnos(a);
    }, []);

    const cargarPlanes = useCallback(async () => {
        if (!selAlumnoId) { setPlanes([]); return; }
        const { data } = await getPlanesAlumno(selAlumnoId);
        setPlanes(data);
    }, [selAlumnoId]);

    useEffect(() => { cargarResumen(); setPageResumen(1); }, [cargarResumen]);
    useEffect(() => { if (tab === "membresias") { cargarMembresias(); setPageMem(1); } }, [tab, cargarMembresias]);
    useEffect(() => { if (tab === "config") cargarConfig(); }, [tab, cargarConfig]);
    useEffect(() => { if (tab === "stock") { cargarStock(); setPageStock(1); } }, [tab, cargarStock]);
    useEffect(() => { if (tab === "tienda") { cargarTienda(); setPageTienda(1); } }, [tab, cargarTienda]);
    useEffect(() => { if (tab === "tienda" && selAlumnoId) { cargarPlanes(); setPageTienda(1); } }, [tab, selAlumnoId, cargarPlanes]);
    useEffect(() => { setPageMem(1); }, [filtro]);

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

    async function handlePagarMembresia(idAlu) {
        const alu = estadoMem.find(a => a.alumno._id === idAlu);
        const today = format(new Date(), 'yyyy-MM-dd');
        
        const { value: formValues } = await Swal.fire({
            title: 'Cobrar Membresía',
            html: `
                <div class="space-y-4 text-left">
                    <p class="text-xs text-slate-400 font-bold uppercase tracking-widest">${alu.alumno.nombre} ${alu.alumno.apellido}</p>
                    <div>
                        <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Fecha de Pago Real</label>
                        <input id="swal-fecha" type="date" value="${today}" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-red-500 transition-all font-semibold [color-scheme:dark]">
                    </div>
                    <div id="pago-detalle" class="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50 space-y-2">
                        {/* Se carga dinámicamente */}
                    </div>
                </div>
            `,
            background: '#0f172a', color: '#f8fafc',
            showCancelButton: true, confirmButtonText: 'Confirmar Pago',
            didOpen: () => {
                const input = document.getElementById('swal-fecha');
                const detalle = document.getElementById('pago-detalle');
                const update = (f) => {
                    const d = new Date(f + "T12:00:00");
                    const dia = d.getDate();
                    const mora = dia > config.diaCierreCobranza;
                    const final = mora ? Math.round(config.precioMembresia * (1 + config.porcentajeRecargo / 100)) : config.precioMembresia;
                    detalle.innerHTML = `<div class="flex justify-between text-sm"><span class="text-slate-400">Base:</span><span class="font-bold">$${fmt(config.precioMembresia)}</span></div>
                        ${mora ? `<div class="flex justify-between text-sm text-orange-400"><span>Recargo:</span><span>+$${fmt(final - config.precioMembresia)}</span></div>` : ''}
                        <div class="pt-2 border-t border-slate-700 flex justify-between items-end"><span class="text-xs font-black text-slate-400">TOTAL:</span><span class="text-2xl font-black">$${fmt(final)}</span></div>`;
                };
                input.addEventListener('change', (e) => update(e.target.value));
                update(today);
            },
            preConfirm: () => [document.getElementById('swal-fecha').value]
        });

        if (formValues) {
            try {
                setLoading(true);
                const [fechaPago] = formValues;
                const d = new Date(fechaPago + "T12:00:00");
                const monto = d.getDate() > config.diaCierreCobranza ? Math.round(config.precioMembresia * (1 + config.porcentajeRecargo / 100)) : config.precioMembresia;
                await pagarMembresia(idAlu, { mes: mesActual, monto, fechaPago });
                cargarResumen(); cargarMembresias();
                showToast("Pago registrado");
            } catch (e) { showAlert({ title: "Error", text: "No se pudo registrar el pago", icon: "error" }); }
            finally { setLoading(false); }
        }
    }

    // ─── LÓGICA STOCK ───
    async function handleCrearProducto() {
        if (!productoForm.nombre || !productoForm.precio) return showAlert({ title: "Atención", text: "Nombre y precio son obligatorios.", icon: "warning" });
        try {
            setLoading(true);
            if (selProducto) await updateProducto(selProducto._id, { ...productoForm, precio: Number(productoForm.precio), stock: Number(productoForm.stock) });
            else await crearProducto({ ...productoForm, precio: Number(productoForm.precio), stock: Number(productoForm.stock || 0) });
            setShowModal(null); cargarStock(); showToast("Producto guardado");
        } catch (e) { showAlert({ title: "Error", text: "Error al guardar producto", icon: "error" }); }
        finally { setLoading(false); }
    }

    async function handleAjusteStock() {
        if (stockEdit === '' || Number(stockEdit) < 0) return showAlert({ title: "Atención", text: "Monto inválido.", icon: "warning" });
        try {
            setLoading(true);
            await ajustarStock(selProducto._id, Number(stockEdit));
            setShowModal(null); cargarStock(); showToast("Stock actualizado");
        } catch (e) { showAlert({ title: "Error", text: "Error al ajustar stock", icon: "error" }); }
        finally { setLoading(false); }
    }

    async function handleEliminarProducto(p) {
        const confirm = await showAlert({ title: `¿Desactivar ${p.nombre}?`, icon: "warning", showCancelButton: true });
        if (confirm.isConfirmed) { await deleteProducto(p._id); cargarStock(); }
    }

    // ─── LÓGICA VENTAS/PLANES ───
    async function handleCrearVentaPlan() {
        if (!selAlumnoId) return showAlert({ title: "Atención", text: "Seleccioná un alumno.", icon: "warning" });
        if (!ventaPlanForm.descripcion || !ventaPlanForm.montoTotal) return showAlert({ title: "Atención", text: "Descripción y monto obligatorios.", icon: "warning" });
        try {
            setLoading(true);
            if (ventaPlanForm.esPlan) await crearPlan({ alumnoId: selAlumnoId, productoId: ventaPlanForm.productoId || null, descripcion: ventaPlanForm.descripcion, montoTotal: Number(ventaPlanForm.montoTotal), notas: ventaPlanForm.notas });
            else await venderProducto({ productoId: ventaPlanForm.productoId || null, alumnoId: selAlumnoId, montoTotal: Number(ventaPlanForm.montoTotal), nota: ventaPlanForm.notas || 'Venta directa' });
            setShowModal(null); setVentaPlanForm({ descripcion: '', productoId: '', montoTotal: '', notas: '', esPlan: true });
            cargarResumen(); cargarTienda(); cargarPlanes(); showToast("Venta registrada");
        } catch (e) { showAlert({ title: "Error", text: "Error al crear venta", icon: "error" }); }
        finally { setLoading(false); }
    }

    async function handlePagarCuota() {
        if (!pagoForm.monto || Number(pagoForm.monto) <= 0) return showAlert({ title: "Atención", text: "Monto inválido.", icon: "warning" });
        try {
            setLoading(true);
            await pagarCuota(selPlan._id, { monto: Number(pagoForm.monto), nota: pagoForm.nota });
            setShowModal(null); setPagoForm({ monto: '', nota: '' });
            cargarResumen(); cargarPlanes(); showToast("Cuota pagada");
        } catch (e) { showAlert({ title: "Error", text: "Error al pagar cuota", icon: "error" }); }
        finally { setLoading(false); }
    }

    async function handleCancelarPlan(id) {
        const confirm = await showAlert({ title: "¿Cancelar plan?", icon: "warning", showCancelButton: true });
        if (confirm.isConfirmed) { await cancelarPlan(id); cargarResumen(); cargarPlanes(); }
    }

    const dataMensual = buildMensual(ventas);
    const dataCategorias = buildPorCategoria(ventas);
    const totalVentasStock = ventas.reduce((s, v) => s + (v.montoTotal || 0), 0);
    const totalPendienteStock = planes.filter(p => p.estado === 'pendiente').reduce((s, p) => s + (p.montoTotal - p.montoPagado), 0);

    const TABS = [
        { id: "resumen", label: "Caja", icon: "📊" },
        { id: "membresias", label: "Membresías", icon: "🥋" },
        { id: "stock", label: "Inventario", icon: "📦" },
        { id: "tienda", label: "Tienda", icon: "💳" },
        { id: "config", label: "Ajustes", icon: "⚙️" },
    ];

    return (
        <div className="max-w-7xl mx-auto pb-20 space-y-6">
            
            {/* --- HEADER --- */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5 sm:gap-6 bg-slate-900/40 p-5 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-slate-800 shadow-2xl relative overflow-hidden">
                <div className="relative z-10">
                    <h1 className="text-3xl font-black tracking-tighter text-white flex items-center gap-3">
                        <span className="bg-slate-800 p-2.5 rounded-2xl border border-slate-700 shadow-inner">💰</span> Gestión Económica
                    </h1>
                    <p className="text-slate-400 text-sm mt-1 font-medium">Control unificado de caja, alumnos y stock</p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 relative z-10 w-full lg:w-auto">
                    <div className="flex justify-between items-center bg-slate-800/80 rounded-2xl border border-slate-700 p-1.5 shadow-inner w-full lg:w-auto">
                        <button onClick={() => {
                            const [y, m] = mesActual.split("-").map(Number);
                            const prev = new Date(y, m - 2, 1);
                            setMesActual(`${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`);
                        }} className="p-2 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white transition-all flex-shrink-0">◀</button>
                        
                        <div className="flex-1 flex justify-center items-center overflow-hidden">
                            <input type="month" value={mesActual} onChange={e => setMesActual(e.target.value)}
                                className="bg-transparent border-none text-white font-black text-xs sm:text-sm uppercase px-0 outline-none text-center tracking-tighter sm:tracking-normal [color-scheme:dark] w-auto max-w-full" />
                        </div>
                        
                        <button onClick={() => {
                            const [y, m] = mesActual.split("-").map(Number);
                            const next = new Date(y, m, 1);
                            setMesActual(`${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`);
                        }} className="p-2 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white transition-all flex-shrink-0">▶</button>
                    </div>

                    <div className="flex gap-2 w-full lg:w-auto">
                        <button onClick={() => { setForm(initialForm); setShowModal("ingreso"); }} className="flex-1 flex flex-col items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white px-3 sm:px-5 py-2.5 rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-widest shadow-lg transition-all active:scale-95 border-b-4 border-emerald-800 active:border-b-0">
                            <span className="text-lg leading-none">+</span>
                            <span>Ingreso</span>
                        </button>
                        <button onClick={() => { setForm(initialForm); setShowModal("egreso"); }} className="flex-1 flex flex-col items-center justify-center gap-1 bg-rose-600 hover:bg-rose-500 text-white px-3 sm:px-5 py-2.5 rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-widest shadow-lg transition-all active:scale-95 border-b-4 border-rose-800 active:border-b-0">
                            <span className="text-lg leading-none">-</span>
                            <span>Egreso</span>
                        </button>
                    </div>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[100px] rounded-full -mr-20 -mt-20"></div>
            </div>

            {/* --- TABS --- */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 bg-slate-800/20 p-2 rounded-[1.8rem] border border-slate-800/50">
                {TABS.map(t => (
                    <button key={t.id} onClick={() => setTab(t.id)}
                        className={`flex items-center justify-center gap-2 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${tab === t.id ? "bg-slate-800 text-white shadow-xl border border-slate-700 scale-[1.02]" : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/40"}`}>
                        <span>{t.icon}</span> {t.label}
                    </button>
                ))}
            </div>

            {/* ─── TAB: CAJA (Resumen + Historial) ─── */}
            {tab === "resumen" && (
                <div className="space-y-6 animate-in fade-in duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-emerald-500/10 p-8 rounded-[2.2rem] border border-emerald-500/20 shadow-2xl relative overflow-hidden group">
                            <p className="text-[10px] font-black text-emerald-500/60 uppercase tracking-widest mb-2">Ingresos {MESES_ES[Number(mesActual.split("-")[1]) - 1]}</p>
                            <h2 className="text-4xl font-black text-white tracking-tighter">${fmt(resumen.totalIngresos)}</h2>
                            <div className="absolute top-0 right-0 p-6 text-5xl opacity-10 group-hover:scale-110 transition-transform">💰</div>
                        </div>
                        <div className="bg-rose-500/10 p-8 rounded-[2.2rem] border border-rose-500/20 shadow-2xl relative overflow-hidden group">
                            <p className="text-[10px] font-black text-rose-500/60 uppercase tracking-widest mb-2">Egresos del Mes</p>
                            <h2 className="text-4xl font-black text-white tracking-tighter">${fmt(resumen.totalEgresos)}</h2>
                            <div className="absolute top-0 right-0 p-6 text-5xl opacity-10 group-hover:scale-110 transition-transform">📉</div>
                        </div>
                        <div className="bg-blue-500/10 p-8 rounded-[2.2rem] border border-blue-500/20 shadow-2xl relative overflow-hidden group">
                            <p className="text-[10px] font-black text-blue-500/60 uppercase tracking-widest mb-2">Ganancia Neta</p>
                            <h2 className="text-4xl font-black text-white tracking-tighter">${fmt(resumen.gananciaNeta)}</h2>
                            <div className="absolute top-0 right-0 p-6 text-5xl opacity-10 group-hover:scale-110 transition-transform">💎</div>
                        </div>
                    </div>

                    <div className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
                        <div className="px-8 py-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/20">
                            <h3 className="font-black text-lg text-white">Historial de Transacciones</h3>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{resumen.transacciones.length} registros</span>
                        </div>
                        <div className="divide-y divide-slate-800/50">
                            {resumen.transacciones.length === 0 ? (
                                <div className="py-20 text-center opacity-30">
                                    <span className="text-6xl mb-4 block">🧾</span>
                                    <p className="font-black uppercase tracking-widest text-sm">Sin movimientos este mes</p>
                                </div>
                            ) : resumen.transacciones.slice((pageResumen - 1) * LIMIT_RESUMEN, pageResumen * LIMIT_RESUMEN).map(t => (
                                <div key={t._id} className="flex items-center gap-6 px-8 py-5 hover:bg-slate-800/30 transition-all group">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-inner border ${t.tipo === 'INGRESO' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'}`}>
                                        {t.tipo === 'INGRESO' ? '▲' : '▼'}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <p className="font-black text-white text-sm uppercase tracking-tight">{t.descripcion}</p>
                                            <span className="text-[9px] font-black bg-slate-800 text-slate-500 px-2 py-0.5 rounded border border-slate-700 uppercase">{t.categoria}</span>
                                        </div>
                                        <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-wider">{fmtFecha(t.fecha, "dd MMMM, yyyy")}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-xl font-black tracking-tighter ${t.tipo === 'INGRESO' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            {t.tipo === 'INGRESO' ? '+' : '-'}${fmt(t.monto)}
                                        </p>
                                        <button onClick={() => handleEliminar(t._id)} className="text-[9px] font-black text-slate-600 hover:text-rose-500 uppercase tracking-widest mt-1 transition-colors opacity-0 group-hover:opacity-100">Eliminar</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {resumen.transacciones.length > LIMIT_RESUMEN && (
                            <div className="flex justify-center items-center gap-4 py-6 border-t border-slate-800 bg-slate-800/10">
                                <button onClick={() => setPageResumen(p => Math.max(1, p - 1))} disabled={pageResumen === 1} className="p-2 bg-slate-900 rounded-xl border border-slate-700 text-slate-400 disabled:opacity-20 hover:text-white transition-all">◀</button>
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Página {pageResumen} de {Math.ceil(resumen.transacciones.length / LIMIT_RESUMEN)}</span>
                                <button onClick={() => setPageResumen(p => Math.min(Math.ceil(resumen.transacciones.length / LIMIT_RESUMEN), p + 1))} disabled={pageResumen === Math.ceil(resumen.transacciones.length / LIMIT_RESUMEN)} className="p-2 bg-slate-900 rounded-xl border border-slate-700 text-slate-400 disabled:opacity-20 hover:text-white transition-all">▶</button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ─── TAB: MEMBRESÍAS ─── */}
            {tab === "membresias" && (
                <div className="space-y-6 animate-in fade-in duration-500">
                    <div className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 pb-6 border-b border-slate-800">
                            <div>
                                <h3 className="text-xl font-black text-white uppercase tracking-tighter">Estado de Alumnos</h3>
                                <p className="text-xs text-slate-500 font-bold mt-1 uppercase tracking-widest">Control de pagos de membresía mensual</p>
                            </div>
                            <div className="relative w-full md:w-80">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-lg">🔍</span>
                                <input type="text" placeholder="Buscar alumno..." value={filtro} onChange={e => setFiltro(e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-2xl pl-12 pr-4 py-3 text-white font-semibold outline-none focus:border-blue-500 transition-all shadow-inner" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {estadoMem
                                .filter(a => a.alumno && `${a.alumno.nombre} ${a.alumno.apellido}`.toLowerCase().includes(filtro.toLowerCase()))
                                .slice((pageMem - 1) * LIMIT_MEM, pageMem * LIMIT_MEM)
                                .map(a => (
                                <div key={a.alumno._id} className={`group p-5 rounded-3xl border transition-all flex items-center gap-4 shadow-lg ${a.pago ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-slate-800/40 border-slate-700'}`}>
                                    <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-slate-800 group-hover:border-blue-500/30 transition-all shadow-xl flex-shrink-0">
                                        {a.alumno.fotoUrl ? (
                                            <img src={a.alumno.fotoUrl.startsWith('http') ? a.alumno.fotoUrl : `${UPLOAD_URL}/${a.alumno.fotoUrl}`} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-slate-800 flex items-center justify-center font-black text-slate-500 uppercase text-xl">{a.alumno.nombre[0]}</div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-black text-white text-sm truncate leading-tight mb-1">{a.alumno.nombre} <span className="opacity-70">{a.alumno.apellido}</span></p>
                                        <div className="flex items-center gap-2">
                                            <BeltBadge faja={a.alumno.faja} grado={a.alumno.grado} size="xs" showLabel={false} />
                                            <span className={`text-[9px] font-black uppercase tracking-widest ${a.pago ? 'text-emerald-400' : 'text-slate-500'}`}>
                                                {a.pago ? 'Pagado' : 'Pendiente'}
                                            </span>
                                        </div>
                                    </div>
                                    {!a.pago && (
                                        <button onClick={() => handlePagarMembresia(a.alumno._id)} className="bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-xl shadow-lg transition-all active:scale-90 border-b-2 border-blue-800">💵</button>
                                    )}
                                </div>
                            ))}
                        </div>

                        {estadoMem.filter(a => a.alumno && `${a.alumno.nombre} ${a.alumno.apellido}`.toLowerCase().includes(filtro.toLowerCase())).length > LIMIT_MEM && (
                            <div className="flex justify-center items-center gap-4 mt-8 pt-6 border-t border-slate-800">
                                <button onClick={() => setPageMem(p => Math.max(1, p - 1))} disabled={pageMem === 1} className="p-2 bg-slate-800 rounded-xl border border-slate-700 text-slate-400 disabled:opacity-20">◀</button>
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Página {pageMem} de {Math.ceil(estadoMem.filter(a => a.alumno && `${a.alumno.nombre} ${a.alumno.apellido}`.toLowerCase().includes(filtro.toLowerCase())).length / LIMIT_MEM)}</span>
                                <button onClick={() => setPageMem(p => Math.min(Math.ceil(estadoMem.filter(a => a.alumno && `${a.alumno.nombre} ${a.alumno.apellido}`.toLowerCase().includes(filtro.toLowerCase())).length / LIMIT_MEM), p + 1))} disabled={pageMem === Math.ceil(estadoMem.filter(a => a.alumno && `${a.alumno.nombre} ${a.alumno.apellido}`.toLowerCase().includes(filtro.toLowerCase())).length / LIMIT_MEM)} className="p-2 bg-slate-800 rounded-xl border border-slate-700 text-slate-400 disabled:opacity-20">▶</button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ─── TAB: STOCK ─── */}
            {tab === "stock" && (
                <div className="space-y-6 animate-in fade-in duration-500">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { label: "Vendido Total", value: `$${fmt(totalVentasStock)}`, color: "text-white", icon: "💰" },
                            { label: "Pendiente", value: `$${fmt(totalPendienteStock)}`, color: "text-orange-400", icon: "⏳" },
                            { label: "Artículos", value: productos.length, color: "text-blue-400", icon: "📦" },
                            { label: "Stock Total", value: productos.reduce((s, p) => s + p.stock, 0), color: "text-emerald-400", icon: "🛒" },
                        ].map(k => (
                            <div key={k.label} className="bg-slate-900/40 p-6 rounded-[2rem] border border-slate-800 shadow-xl flex items-center gap-4">
                                <div className="text-3xl">{k.icon}</div>
                                <div>
                                    <p className={`text-xl font-black ${k.color} tracking-tighter`}>{k.value}</p>
                                    <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">{k.label}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-between items-center bg-slate-900/40 p-6 rounded-[2rem] border border-slate-800 shadow-xl">
                        <h3 className="font-black text-white uppercase tracking-tighter ml-2">Gestión de Inventario</h3>
                        <button onClick={() => { setSelProducto(null); setProductoForm(emptyProducto); setShowModal("stock_form"); }} 
                            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg transition-all">+ Nuevo Artículo</button>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {productos.filter(p => p.activo).slice((pageStock - 1) * LIMIT_STOCK, pageStock * LIMIT_STOCK).map(p => {
                            const sin = p.stock === 0;
                            const bajo = p.stock > 0 && p.stock <= STOCK_MIN;
                            return (
                                <div key={p._id} className="bg-slate-800/30 rounded-3xl border border-slate-700/50 shadow-xl overflow-hidden flex flex-col group hover:border-blue-500/30 transition-all">
                                    <div className="p-6 flex-1 flex flex-col gap-3">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <span className="text-3xl">{CAT_ICONS[p.categoria]}</span>
                                                <div>
                                                    <h3 className="font-black text-white text-base leading-tight">{p.nombre}</h3>
                                                    <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">{p.categoria}</p>
                                                </div>
                                            </div>
                                            <div className={`px-3 py-1 rounded-full text-[10px] font-black border tabular-nums ${sin ? 'bg-rose-900/30 text-rose-400 border-rose-700/30' : bajo ? 'bg-orange-900/30 text-orange-400 border-orange-700/30' : 'bg-emerald-900/30 text-emerald-400 border-emerald-700/30'}`}>
                                                {sin ? 'Sin stock' : `${p.stock} u.`}
                                            </div>
                                        </div>
                                        <p className="text-2xl font-black text-white mt-auto pt-4">${fmt(p.precio)}</p>
                                    </div>
                                    <div className="bg-slate-900/40 p-4 flex gap-2 border-t border-slate-700/30">
                                        <button onClick={() => { setSelProducto(p); setStockEdit(String(p.stock)); setShowModal("stock_ajuste"); }} className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-black uppercase border border-slate-700">Stock</button>
                                        <button onClick={() => { setSelProducto(p); setProductoForm(p); setShowModal("stock_form"); }} className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-black border border-slate-700">✏️</button>
                                        <button onClick={() => handleEliminarProducto(p)} className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-rose-900/40 text-slate-500 hover:text-rose-400 border border-slate-700">🗑</button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    {productos.filter(p => p.activo).length > LIMIT_STOCK && (
                        <div className="flex justify-center items-center gap-4 mt-8 pt-6 border-t border-slate-800">
                            <button onClick={() => setPageStock(p => Math.max(1, p - 1))} disabled={pageStock === 1} className="p-2 bg-slate-800 rounded-xl border border-slate-700 text-slate-400 disabled:opacity-20">◀</button>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Página {pageStock} de {Math.ceil(productos.filter(p => p.activo).length / LIMIT_STOCK)}</span>
                            <button onClick={() => setPageStock(p => Math.min(Math.ceil(productos.filter(p => p.activo).length / LIMIT_STOCK), p + 1))} disabled={pageStock === Math.ceil(productos.filter(p => p.activo).length / LIMIT_STOCK)} className="p-2 bg-slate-800 rounded-xl border border-slate-700 text-slate-400 disabled:opacity-20">▶</button>
                        </div>
                    )}
                </div>
            )}

            {/* ─── TAB: TIENDA ─── */}
            {tab === "tienda" && (
                <div className="space-y-6 animate-in fade-in duration-500">
                    <div className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl">
                        <div className="flex items-center gap-4 border-b border-slate-800 pb-6 mb-8">
                            <span className="bg-blue-600/20 text-blue-400 p-3 rounded-2xl border border-blue-600/20 text-xl">🛒</span>
                            <div>
                                <h3 className="text-xl font-black text-white tracking-tighter uppercase">Terminal de Ventas</h3>
                                <p className="text-xs text-slate-500 font-bold mt-1 uppercase tracking-widest">Registro de ventas directas y planes de pago</p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 items-end mb-8">
                            <div className="flex-1 space-y-2 w-full">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Buscar y Seleccionar Alumno</label>
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <div className="relative flex-1">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">🔍</span>
                                        <input type="text" placeholder="Filtrar por nombre..." value={searchTermAlumno} onChange={e => setSearchTermAlumno(e.target.value)} 
                                            className="w-full bg-slate-800 border border-slate-700 rounded-2xl pl-11 pr-4 py-4 text-white font-semibold outline-none focus:border-blue-500 transition-all shadow-inner" />
                                    </div>
                                    <select value={selAlumnoId} onChange={e => setSelAlumnoId(e.target.value)}
                                        className="flex-1 bg-slate-800 border border-slate-700 rounded-2xl px-5 py-4 text-white font-semibold outline-none focus:border-blue-500 transition-all shadow-inner">
                                        <option value="">— Elegir alumno —</option>
                                        {alumnos.filter(a => `${a.nombre} ${a.apellido}`.toLowerCase().includes(searchTermAlumno.toLowerCase())).map(a => <option key={a._id} value={a._id}>{a.nombre} {a.apellido}</option>)}
                                    </select>
                                </div>
                            </div>
                            {selAlumnoId && (
                                <button onClick={() => setShowModal("vender")} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-900/20 transition-all">+ Nueva Venta</button>
                            )}
                        </div>

                        {!selAlumnoId ? (
                            <div className="py-20 text-center opacity-30 border-2 border-dashed border-slate-800 rounded-[2rem]">
                                <span className="text-6xl mb-4 block">👤</span>
                                <p className="font-black uppercase tracking-widest text-sm text-slate-500">Elegí un alumno para gestionar sus compras</p>
                            </div>
                        ) : (
                            <>
                                <div className="grid gap-6 sm:grid-cols-2">
                                    {planes.length === 0 && (
                                        <div className="col-span-full py-12 text-center text-slate-500 bg-slate-800/20 rounded-3xl border border-slate-800 border-dashed">
                                            <p className="text-3xl mb-2">🛍️</p>
                                            <p className="font-bold text-sm">Este alumno no tiene planes o ventas registradas</p>
                                        </div>
                                    )}
                                    {planes.slice((pageTienda - 1) * LIMIT_TIENDA, pageTienda * LIMIT_TIENDA).map(plan => {
                                        const saldo = Math.max(0, plan.montoTotal - plan.montoPagado);
                                        const pct = (plan.montoPagado / plan.montoTotal) * 100;
                                        return (
                                            <div key={plan._id} className="bg-slate-800/40 rounded-[2rem] p-6 border border-slate-700/50 space-y-4 shadow-xl">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <p className="font-black text-white text-base leading-tight uppercase">{plan.descripcion}</p>
                                                        <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-widest">{fmtFecha(plan.fecha, "dd/MM/yy")}</p>
                                                    </div>
                                                    <span className={`text-[9px] font-black px-3 py-1 rounded-full border ${PLAN_ESTADOS[plan.estado]}`}>{plan.estado.toUpperCase()}</span>
                                                </div>
                                                <div>
                                                    <div className="flex justify-between text-[10px] font-black uppercase mb-2">
                                                        <span className="text-slate-400">Pagado: <span className="text-emerald-400">${fmt(plan.montoPagado)}</span></span>
                                                        <span className="text-slate-400">Total: <span className="text-white">${fmt(plan.montoTotal)}</span></span>
                                                    </div>
                                                    <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800 shadow-inner">
                                                        <div className={`h-full transition-all duration-700 ${plan.estado === 'completado' ? 'bg-emerald-500' : 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]'}`} style={{ width: `${pct}%` }} />
                                                    </div>
                                                    {saldo > 0 && <p className="text-right text-[10px] font-black text-orange-400 mt-2 uppercase tracking-widest">Saldo: ${fmt(saldo)}</p>}
                                                </div>
                                                {plan.estado === 'pendiente' && (
                                                    <div className="flex gap-2 pt-2">
                                                        <button onClick={() => { setSelPlan(plan); setShowModal("plan_pagar"); }} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-black py-3 rounded-xl text-xs uppercase tracking-widest shadow-lg transition-all active:scale-95">💵 Pagar Cuota</button>
                                                        <button onClick={() => handleCancelarPlan(plan._id)} className="px-4 py-3 bg-slate-800 hover:bg-rose-900/40 text-slate-500 hover:text-rose-400 rounded-xl transition-all border border-slate-700">✕</button>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                                {planes.length > LIMIT_TIENDA && (
                                    <div className="flex justify-center items-center gap-4 mt-8 pt-6 border-t border-slate-800">
                                        <button onClick={() => setPageTienda(p => Math.max(1, p - 1))} disabled={pageTienda === 1} className="p-2 bg-slate-800 rounded-xl border border-slate-700 text-slate-400 disabled:opacity-20">◀</button>
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Página {pageTienda} de {Math.ceil(planes.length / LIMIT_TIENDA)}</span>
                                        <button onClick={() => setPageTienda(p => Math.min(Math.ceil(planes.length / LIMIT_TIENDA), p + 1))} disabled={pageTienda === Math.ceil(planes.length / LIMIT_TIENDA)} className="p-2 bg-slate-800 rounded-xl border border-slate-700 text-slate-400 disabled:opacity-20">▶</button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Dashboard de Ventas Visual */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in slide-in-from-bottom-4 duration-700">
                        <div className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl">
                            <h4 className="text-sm font-black text-white uppercase tracking-widest mb-8 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></span> Tendencia de Ventas (Anual)
                            </h4>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={dataMensual}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                        <XAxis dataKey="mes" stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} />
                                        <YAxis stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v/1000}k`} />
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '16px', fontSize: '12px' }}
                                            itemStyle={{ color: '#f8fafc', fontWeight: 'bold' }}
                                            cursor={{ fill: '#1e293b', opacity: 0.4 }}
                                        />
                                        <Bar dataKey="monto" fill="url(#colorVentas)" radius={[6, 6, 0, 0]} />
                                        <defs>
                                            <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl">
                            <h4 className="text-sm font-black text-white uppercase tracking-widest mb-8 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]"></span> Distribución por Categoría
                            </h4>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={dataCategorias} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="monto">
                                            {dataCategorias.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={CAT_COLORS[entry.name] || '#8b5cf6'} stroke="none" />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '16px', fontSize: '12px' }}
                                            itemStyle={{ color: '#f8fafc', fontWeight: 'bold' }}
                                        />
                                        <Legend verticalAlign="bottom" height={36} formatter={(v) => <span className="text-[10px] font-black uppercase text-slate-400">{v}</span>} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── TAB: AJUSTES ─── */}
            {tab === "config" && configEdit && (
                <div className="max-w-2xl mx-auto animate-in zoom-in-95 duration-500">
                    <div className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-10 shadow-2xl space-y-8">
                        <div className="border-b border-slate-800 pb-6">
                            <h3 className="text-2xl font-black text-white tracking-tighter uppercase">Configuración de Precios</h3>
                            <p className="text-xs text-slate-500 font-bold mt-1 uppercase tracking-widest">Reglas de negocio y moneda del Dojo</p>
                        </div>
                        
                        <div className="grid gap-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1">Precio de Membresía Base</label>
                                <div className="relative">
                                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 font-black text-xl">$</span>
                                    <input type="number" value={configEdit.precioMembresia} onChange={e => setConfigEdit({...configEdit, precioMembresia: Number(e.target.value)})}
                                        className="w-full bg-slate-800/80 border border-slate-700 rounded-2xl pl-10 pr-6 py-5 text-white font-black text-2xl outline-none focus:border-blue-500 transition-all shadow-inner" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Día de Vencimiento</label>
                                    <input type="number" value={configEdit.diaCierreCobranza} onChange={e => setConfigEdit({...configEdit, diaCierreCobranza: Number(e.target.value)})}
                                        className="w-full bg-slate-800/80 border border-slate-700 rounded-2xl px-6 py-4 text-white font-black text-xl outline-none focus:border-blue-500 transition-all shadow-inner" />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">% Recargo por Mora</label>
                                    <input type="number" value={configEdit.porcentajeRecargo} onChange={e => setConfigEdit({...configEdit, porcentajeRecargo: Number(e.target.value)})}
                                        className="w-full bg-slate-800/80 border border-slate-700 rounded-2xl px-6 py-4 text-white font-black text-xl outline-none focus:border-blue-500 transition-all shadow-inner" />
                                </div>
                            </div>
                        </div>
                        
                        <button onClick={handleGuardarConfig} disabled={loading}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-5 rounded-2xl text-sm uppercase tracking-[0.2em] shadow-xl shadow-emerald-900/20 transition-all active:scale-[0.98] border-b-4 border-emerald-800 active:border-b-0">
                            {loading ? "Guardando..." : "Guardar Configuración"}
                        </button>
                    </div>
                </div>
            )}

            {/* ─── MODALES ─── */}
            
            <PortalModal show={showModal === "ingreso" || showModal === "egreso"} onClose={() => setShowModal(null)}>
                <div className="bg-slate-900 border border-slate-700 rounded-[2.5rem] p-10 w-full max-w-md shadow-2xl space-y-6 animate-in zoom-in-95 duration-300">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                        <h2 className={`text-xl font-black uppercase tracking-widest ${showModal === 'ingreso' ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {showModal === 'ingreso' ? '▲ Nuevo Ingreso' : '▼ Nuevo Egreso'}
                        </h2>
                        <button onClick={() => setShowModal(null)} className="text-slate-500 hover:text-white text-2xl">✕</button>
                    </div>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoría</label>
                            <select value={form.categoria} onChange={e => setForm({...form, categoria: e.target.value})}
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-5 py-3.5 text-white font-semibold outline-none focus:border-blue-500 transition-all">
                                {(showModal === "ingreso" ? CATEGORIAS_INGRESO : CATEGORIAS_EGRESO).map(c => <option key={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Monto ($)</label>
                            <input type="number" placeholder="0" value={form.monto} onChange={e => setForm({...form, monto: e.target.value})}
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-5 py-4 text-white font-black text-2xl outline-none focus:border-blue-500 transition-all text-center" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Descripción</label>
                            <input type="text" placeholder="Ej: Pago de luz..." value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})}
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-5 py-3.5 text-white font-semibold outline-none focus:border-blue-500 transition-all" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha</label>
                            <input type="date" value={form.fecha} onChange={e => setForm({...form, fecha: e.target.value})}
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-5 py-3.5 text-white font-semibold outline-none focus:border-blue-500 transition-all [color-scheme:dark]" />
                        </div>
                    </div>
                    <button onClick={handleCrearTransaccion} disabled={loading}
                        className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all active:scale-95 ${showModal === 'ingreso' ? 'bg-emerald-600 hover:bg-emerald-500 border-b-4 border-emerald-800' : 'bg-rose-600 hover:bg-rose-500 border-b-4 border-rose-800'}`}>
                        {loading ? "Registrando..." : "Confirmar Movimiento"}
                    </button>
                </div>
            </PortalModal>

            <PortalModal show={showModal === "stock_form"} onClose={() => setShowModal(null)}>
                <div className="bg-slate-900 border border-slate-700 rounded-[2.5rem] p-10 w-full max-w-md shadow-2xl space-y-6">
                    <h2 className="text-xl font-black text-white uppercase tracking-widest">{selProducto ? '✏️ Editar Artículo' : '+ Nuevo Artículo'}</h2>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nombre</label>
                            <input type="text" value={productoForm.nombre} onChange={e => setProductoForm({...productoForm, nombre: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-5 py-3 text-white font-semibold" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Precio</label>
                                <input type="number" value={productoForm.precio} onChange={e => setProductoForm({...productoForm, precio: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-5 py-3 text-white font-bold" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Stock</label>
                                <input type="number" value={productoForm.stock} onChange={e => setProductoForm({...productoForm, stock: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-5 py-3 text-white font-bold" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoría</label>
                            <select value={productoForm.categoria} onChange={e => setProductoForm({...productoForm, categoria: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-5 py-3 text-white font-semibold">
                                {CATEGORIAS_STOCK.map(c => <option key={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>
                    <button onClick={handleCrearProducto} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl shadow-lg transition-all active:scale-95">GUARDAR ARTÍCULO</button>
                </div>
            </PortalModal>

            <PortalModal show={showModal === "stock_ajuste"} onClose={() => setShowModal(null)}>
                <div className="bg-slate-900 border border-slate-700 rounded-[2rem] p-8 w-full max-sm shadow-2xl space-y-6">
                    <h2 className="text-xl font-black text-white uppercase tracking-widest text-center">Ajustar Stock</h2>
                    <p className="text-center text-slate-400 text-sm font-bold uppercase">{selProducto?.nombre}</p>
                    <input type="number" value={stockEdit} onChange={e => setStockEdit(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-6 py-6 text-white font-black text-4xl text-center outline-none focus:border-blue-500" />
                    <button onClick={handleAjusteStock} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl transition-all">ACTUALIZAR VALOR</button>
                </div>
            </PortalModal>

            <PortalModal show={showModal === "vender"} onClose={() => setShowModal(null)}>
                <div className="bg-slate-900 border border-slate-700 rounded-[2.5rem] p-10 w-full max-w-md shadow-2xl space-y-6">
                    <h2 className="text-xl font-black text-white uppercase tracking-widest">+ Nueva Venta</h2>
                    <div className="flex bg-slate-800 p-1.5 rounded-2xl border border-slate-700">
                        <button onClick={() => setVentaPlanForm({...ventaPlanForm, esPlan: false})} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black transition-all ${!ventaPlanForm.esPlan ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'}`}>PAGO TOTAL</button>
                        <button onClick={() => setVentaPlanForm({...ventaPlanForm, esPlan: true})} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black transition-all ${ventaPlanForm.esPlan ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'}`}>A CUOTAS (PLAN)</button>
                    </div>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Artículo del Stock (opcional)</label>
                            <select value={ventaPlanForm.productoId} onChange={e => {
                                const p = productos.find(x => x._id === e.target.value);
                                setVentaPlanForm({...ventaPlanForm, productoId: e.target.value, descripcion: p ? p.nombre : ventaPlanForm.descripcion, montoTotal: p ? p.precio : ventaPlanForm.montoTotal});
                            }} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-5 py-3 text-white font-semibold">
                                <option value="">— Ingresar manualmente —</option>
                                {productos.map(p => <option key={p._id} value={p._id}>{CAT_ICONS[p.categoria]} {p.nombre} · ${fmt(p.precio)}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Descripción</label>
                            <input type="text" value={ventaPlanForm.descripcion} onChange={e => setVentaPlanForm({...ventaPlanForm, descripcion: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-5 py-3 text-white font-semibold" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Monto Total ($)</label>
                            <input type="number" value={ventaPlanForm.montoTotal} onChange={e => setVentaPlanForm({...ventaPlanForm, montoTotal: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-5 py-4 text-white font-black text-2xl outline-none focus:border-blue-500 text-center" />
                        </div>
                    </div>
                    <button onClick={handleCrearVentaPlan} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl shadow-lg transition-all active:scale-95 uppercase tracking-widest text-xs">Confirmar Venta</button>
                </div>
            </PortalModal>

            <PortalModal show={showModal === "plan_pagar"} onClose={() => setShowModal(null)}>
                <div className="bg-slate-900 border border-slate-700 rounded-[2.5rem] p-10 w-full max-w-sm shadow-2xl space-y-6">
                    <h2 className="text-xl font-black text-emerald-400 uppercase tracking-widest text-center">Registrar Pago</h2>
                    <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/50">
                        <p className="font-black text-white text-xs uppercase text-center">{selPlan?.descripcion}</p>
                        <p className="text-center text-orange-400 font-bold mt-1 text-sm">Saldo: ${fmt((selPlan?.montoTotal || 0) - (selPlan?.montoPagado || 0))}</p>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center block">Monto a abonar</label>
                        <input type="number" value={pagoForm.monto} onChange={e => setPagoForm({...pagoForm, monto: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-6 py-6 text-white font-black text-4xl text-center outline-none focus:border-emerald-500 shadow-inner" />
                    </div>
                    <button onClick={handlePagarCuota} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-2xl shadow-lg transition-all active:scale-95 uppercase tracking-widest text-xs">Confirmar Pago</button>
                </div>
            </PortalModal>

        </div>
    );
}

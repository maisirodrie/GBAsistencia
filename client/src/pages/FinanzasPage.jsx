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
import { UPLOAD_URL } from "../api/axios";
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
    ResponsiveContainer, PieChart, Pie, Cell, Legend 
} from "recharts";
import BeltBadge from "../components/BeltBadge";
import { createPortal } from "react-dom";
import { 
    TrendingUp, TrendingDown, DollarSign, Wallet, Package, 
    ShoppingCart, Settings, Users, Plus, Minus, ArrowUpRight, 
    ArrowDownRight, Trash2, Pencil, X, Calendar, Search, CreditCard
} from "lucide-react";

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
            confirmButtonColor: '#10b981',
            cancelButtonColor: '#ef4444',
            customClass: {
                popup: 'rounded-[2rem] border border-slate-800 shadow-2xl',
                title: 'font-black tracking-tight',
                confirmButton: 'rounded-xl px-6 py-3 font-black uppercase tracking-widest text-xs',
                cancelButton: 'rounded-xl px-6 py-3 font-black uppercase tracking-widest text-xs'
            },
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
        <div className="max-w-7xl mx-auto pb-16 space-y-6 animate-in fade-in duration-500">
            
            {/* --- HEADER TAILADMIN --- */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-slate-900/40 p-6 rounded-2xl border border-slate-800 backdrop-blur-md shadow-sm">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                            <DollarSign size={22} />
                        </div>
                        Gestión Económica
                    </h1>
                    <p className="text-sm font-medium text-slate-400 mt-1">Control unificado de caja, membresías e inventario</p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                    <div className="flex items-center bg-slate-950/60 rounded-xl border border-slate-800 p-1 w-full sm:w-auto justify-between">
                        <button onClick={() => {
                            const [y, m] = mesActual.split("-").map(Number);
                            const prev = new Date(y, m - 2, 1);
                            setMesActual(`${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`);
                        }} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">◀</button>
                        
                        <input type="month" value={mesActual} onChange={e => setMesActual(e.target.value)}
                            className="bg-transparent border-none text-white font-bold text-xs sm:text-sm uppercase px-2 outline-none text-center [color-scheme:dark]" />
                        
                        <button onClick={() => {
                            const [y, m] = mesActual.split("-").map(Number);
                            const next = new Date(y, m, 1);
                            setMesActual(`${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`);
                        }} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">▶</button>
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto">
                        <button onClick={() => { setForm(initialForm); setShowModal("ingreso"); }} 
                            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-900/20 transition-all active:scale-95">
                            <Plus size={15} />
                            <span>Ingreso</span>
                        </button>
                        <button onClick={() => { setForm(initialForm); setShowModal("egreso"); }} 
                            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-500 text-white px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-red-900/20 transition-all active:scale-95">
                            <Minus size={15} />
                            <span>Egreso</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* --- TABS TAILADMIN --- */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-slate-800/80">
                {TABS.map(t => (
                    <button key={t.id} onClick={() => setTab(t.id)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                            tab === t.id 
                                ? "bg-red-600 text-white shadow-lg shadow-red-600/20" 
                                : "bg-slate-900/40 text-slate-400 hover:text-white hover:bg-slate-800/50 border border-slate-800/80"
                        }`}>
                        <span>{t.icon}</span> {t.label}
                    </button>
                ))}
            </div>

            {/* ─── TAB: CAJA (Resumen + Historial) ─── */}
            {tab === "resumen" && (
                <div className="space-y-6 animate-in fade-in duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-md shadow-sm flex items-center justify-between">
                            <div>
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Ingresos {MESES_ES[Number(mesActual.split("-")[1]) - 1]}</span>
                                <h3 className="text-2xl sm:text-3xl font-bold text-white mt-1 tracking-tight">${fmt(resumen.totalIngresos)}</h3>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                                <ArrowUpRight size={22} />
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-md shadow-sm flex items-center justify-between">
                            <div>
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Egresos del Mes</span>
                                <h3 className="text-2xl sm:text-3xl font-bold text-white mt-1 tracking-tight">${fmt(resumen.totalEgresos)}</h3>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                                <ArrowDownRight size={22} />
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-md shadow-sm flex items-center justify-between">
                            <div>
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Ganancia Neta</span>
                                <h3 className="text-2xl sm:text-3xl font-bold text-white mt-1 tracking-tight">${fmt(resumen.gananciaNeta)}</h3>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                                <Wallet size={22} />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-md overflow-hidden shadow-sm">
                        <div className="px-6 py-4 border-b border-slate-800/80 flex justify-between items-center bg-slate-950/30">
                            <h3 className="font-bold text-sm uppercase tracking-wider text-slate-300">Historial de Transacciones</h3>
                            <span className="text-xs font-semibold text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/50">
                                {resumen.transacciones.length} {resumen.transacciones.length === 1 ? 'registro' : 'registros'}
                            </span>
                        </div>

                        {resumen.transacciones.length === 0 ? (
                            <div className="py-20 text-center text-slate-500">
                                <span className="text-4xl mb-2 block opacity-40">🧾</span>
                                <p className="font-bold text-sm">Sin movimientos registrados este mes</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-[700px]">
                                    <thead>
                                        <tr className="border-b border-slate-800/80 bg-slate-950/50 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                            <th className="py-4 px-6">Tipo</th>
                                            <th className="py-4 px-6">Descripción</th>
                                            <th className="py-4 px-6">Categoría</th>
                                            <th className="py-4 px-6">Fecha</th>
                                            <th className="py-4 px-6 text-right">Monto</th>
                                            <th className="py-4 px-6 text-right">Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/40 text-sm">
                                        {resumen.transacciones.slice((pageResumen - 1) * LIMIT_RESUMEN, pageResumen * LIMIT_RESUMEN).map(t => (
                                            <tr key={t._id} className="hover:bg-slate-800/25 transition-colors">
                                                <td className="py-4 px-6">
                                                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                                                        t.tipo === 'INGRESO'
                                                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                            : 'bg-red-500/10 text-red-400 border-red-500/20'
                                                    }`}>
                                                        {t.tipo === 'INGRESO' ? '▲ Ingreso' : '▼ Egreso'}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6 font-semibold text-white">
                                                    {t.descripcion}
                                                </td>
                                                <td className="py-4 px-6">
                                                    <span className="text-[10px] font-bold bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700/60 uppercase">
                                                        {t.categoria}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6 text-xs text-slate-400 font-medium">
                                                    {fmtFecha(t.fecha, "dd MMMM, yyyy")}
                                                </td>
                                                <td className={`py-4 px-6 text-right font-bold tabular-nums ${t.tipo === 'INGRESO' ? 'text-emerald-400' : 'text-red-400'}`}>
                                                    {t.tipo === 'INGRESO' ? '+' : '-'}${fmt(t.monto)}
                                                </td>
                                                <td className="py-4 px-6 text-right">
                                                    <button onClick={() => handleEliminar(t._id)} className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all" title="Eliminar registro">
                                                        <Trash2 size={15} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {resumen.transacciones.length > LIMIT_RESUMEN && (
                            <div className="flex justify-center items-center gap-3 py-4 border-t border-slate-800/80 bg-slate-950/20">
                                <button onClick={() => setPageResumen(p => Math.max(1, p - 1))} disabled={pageResumen === 1} className="p-2 bg-slate-800 rounded-xl border border-slate-700 text-slate-400 disabled:opacity-20 hover:text-white transition-all text-xs">◀</button>
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Página {pageResumen} de {Math.ceil(resumen.transacciones.length / LIMIT_RESUMEN)}</span>
                                <button onClick={() => setPageResumen(p => Math.min(Math.ceil(resumen.transacciones.length / LIMIT_RESUMEN), p + 1))} disabled={pageResumen === Math.ceil(resumen.transacciones.length / LIMIT_RESUMEN)} className="p-2 bg-slate-800 rounded-xl border border-slate-700 text-slate-400 disabled:opacity-20 hover:text-white transition-all text-xs">▶</button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ─── TAB: MEMBRESÍAS ─── */}
            {tab === "membresias" && (
                <div className="space-y-6 animate-in fade-in duration-500">
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-md shadow-sm">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-6 border-b border-slate-800/80">
                            <div>
                                <h3 className="text-lg font-bold text-white uppercase tracking-tight">Estado de Alumnos</h3>
                                <p className="text-xs text-slate-400 font-medium mt-0.5">Control de pagos de cuota mensual y membresía</p>
                            </div>
                            <div className="relative w-full sm:w-80">
                                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input type="text" placeholder="Buscar alumno..." value={filtro} onChange={e => setFiltro(e.target.value)}
                                    className="w-full bg-slate-950/60 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-white font-medium text-sm outline-none focus:border-red-500 transition-all" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {estadoMem
                                .filter(a => a.alumno && `${a.alumno.nombre} ${a.alumno.apellido}`.toLowerCase().includes(filtro.toLowerCase()))
                                .slice((pageMem - 1) * LIMIT_MEM, pageMem * LIMIT_MEM)
                                .map(a => (
                                <div key={a.alumno._id} className={`p-4 rounded-2xl border transition-all flex items-center gap-3.5 shadow-sm ${
                                    a.pago ? 'bg-slate-900/60 border-slate-800/80' : 'bg-slate-900/40 border-amber-500/20'
                                }`}>
                                    <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-800 flex-shrink-0 bg-slate-800">
                                        {a.alumno.fotoUrl ? (
                                            <img src={a.alumno.fotoUrl.startsWith('http') ? a.alumno.fotoUrl : `${UPLOAD_URL}/${a.alumno.fotoUrl}`} className="w-full h-full object-cover" alt="" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center font-bold text-slate-400 uppercase text-sm">{a.alumno.nombre?.[0]}</div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-white text-sm truncate">{a.alumno.nombre} <span className="opacity-70">{a.alumno.apellido}</span></p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <BeltBadge faja={a.alumno.faja} grado={a.alumno.grado} size="xs" showLabel={false} />
                                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                                                a.pago ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                            }`}>
                                                {a.pago ? 'Al Día' : 'Pendiente'}
                                            </span>
                                        </div>
                                    </div>
                                    {!a.pago && (
                                        <button onClick={() => handlePagarMembresia(a.alumno._id)} 
                                            className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm transition-all active:scale-95 flex items-center gap-1 flex-shrink-0">
                                            <CreditCard size={14} />
                                            <span>Cobrar</span>
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        {estadoMem.filter(a => a.alumno && `${a.alumno.nombre} ${a.alumno.apellido}`.toLowerCase().includes(filtro.toLowerCase())).length > LIMIT_MEM && (
                            <div className="flex justify-center items-center gap-3 mt-8 pt-6 border-t border-slate-800/80">
                                <button onClick={() => setPageMem(p => Math.max(1, p - 1))} disabled={pageMem === 1} className="p-2 bg-slate-800 rounded-xl border border-slate-700 text-slate-400 disabled:opacity-20 text-xs">◀</button>
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Página {pageMem} de {Math.ceil(estadoMem.filter(a => a.alumno && `${a.alumno.nombre} ${a.alumno.apellido}`.toLowerCase().includes(filtro.toLowerCase())).length / LIMIT_MEM)}</span>
                                <button onClick={() => setPageMem(p => Math.min(Math.ceil(estadoMem.filter(a => a.alumno && `${a.alumno.nombre} ${a.alumno.apellido}`.toLowerCase().includes(filtro.toLowerCase())).length / LIMIT_MEM), p + 1))} disabled={pageMem === Math.ceil(estadoMem.filter(a => a.alumno && `${a.alumno.nombre} ${a.alumno.apellido}`.toLowerCase().includes(filtro.toLowerCase())).length / LIMIT_MEM)} className="p-2 bg-slate-800 rounded-xl border border-slate-700 text-slate-400 disabled:opacity-20 text-xs">▶</button>
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
                            <div key={k.label} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur-md shadow-sm flex items-center gap-3.5">
                                <div className="text-2xl sm:text-3xl">{k.icon}</div>
                                <div>
                                    <p className={`text-lg sm:text-xl font-bold ${k.color} tracking-tight`}>{k.value}</p>
                                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{k.label}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-between items-center bg-slate-900/50 p-5 rounded-2xl border border-slate-800 shadow-sm backdrop-blur-md">
                        <h3 className="font-bold text-white uppercase text-sm tracking-wider">Gestión de Inventario</h3>
                        <button onClick={() => { setSelProducto(null); setProductoForm(emptyProducto); setShowModal("stock_form"); }} 
                            className="bg-red-600 hover:bg-red-500 text-white px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-red-600/20 transition-all flex items-center gap-1.5">
                            <Plus size={15} />
                            <span>Nuevo Artículo</span>
                        </button>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {productos.filter(p => p.activo).slice((pageStock - 1) * LIMIT_STOCK, pageStock * LIMIT_STOCK).map(p => {
                            const sin = p.stock === 0;
                            const bajo = p.stock > 0 && p.stock <= STOCK_MIN;
                            return (
                                <div key={p._id} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 shadow-sm overflow-hidden flex flex-col group hover:border-slate-700 transition-all">
                                    <div className="flex-1 flex flex-col gap-3">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl">{CAT_ICONS[p.categoria]}</span>
                                                <div>
                                                    <h4 className="font-bold text-white text-sm leading-snug">{p.nombre}</h4>
                                                    <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">{p.categoria}</p>
                                                </div>
                                            </div>
                                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border tabular-nums ${
                                                sin 
                                                    ? 'bg-red-500/10 text-red-400 border-red-500/25' 
                                                    : bajo 
                                                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/25' 
                                                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                                            }`}>
                                                {sin ? 'Sin stock' : `${p.stock} u.`}
                                            </span>
                                        </div>
                                        <p className="text-xl font-bold text-white mt-auto pt-3">${fmt(p.precio)}</p>
                                    </div>
                                    <div className="pt-3.5 mt-3 border-t border-slate-800 flex gap-2">
                                        <button onClick={() => { setSelProducto(p); setStockEdit(String(p.stock)); setShowModal("stock_ajuste"); }} 
                                            className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold uppercase tracking-wider border border-slate-700 transition-colors">
                                            Stock
                                        </button>
                                        <button onClick={() => { setSelProducto(p); setProductoForm(p); setShowModal("stock_form"); }} 
                                            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 transition-colors">
                                            <Pencil size={14} />
                                        </button>
                                        <button onClick={() => handleEliminarProducto(p)} 
                                            className="p-2 rounded-xl bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-700 transition-colors">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    {productos.filter(p => p.activo).length > LIMIT_STOCK && (
                        <div className="flex justify-center items-center gap-3 mt-8 pt-6 border-t border-slate-800/80">
                            <button onClick={() => setPageStock(p => Math.max(1, p - 1))} disabled={pageStock === 1} className="p-2 bg-slate-800 rounded-xl border border-slate-700 text-slate-400 disabled:opacity-20 text-xs">◀</button>
                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Página {pageStock} de {Math.ceil(productos.filter(p => p.activo).length / LIMIT_STOCK)}</span>
                            <button onClick={() => setPageStock(p => Math.min(Math.ceil(productos.filter(p => p.activo).length / LIMIT_STOCK), p + 1))} disabled={pageStock === Math.ceil(productos.filter(p => p.activo).length / LIMIT_STOCK)} className="p-2 bg-slate-800 rounded-xl border border-slate-700 text-slate-400 disabled:opacity-20 text-xs">▶</button>
                        </div>
                    )}
                </div>
            )}

            {/* ─── TAB: TIENDA ─── */}
            {tab === "tienda" && (
                <div className="space-y-6 animate-in fade-in duration-500">
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-md shadow-sm">
                        <div className="flex items-center gap-3 border-b border-slate-800/80 pb-5 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                                <ShoppingCart size={20} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white uppercase tracking-tight">Terminal de Ventas</h3>
                                <p className="text-xs text-slate-400 font-medium">Registro de ventas directas y planes de pago a cuotas</p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 items-end mb-8">
                            <div className="flex-1 space-y-1.5 w-full">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Buscar y Seleccionar Alumno</label>
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <div className="relative flex-1">
                                        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                                        <input type="text" placeholder="Filtrar por nombre..." value={searchTermAlumno} onChange={e => setSearchTermAlumno(e.target.value)} 
                                            className="w-full bg-slate-950/60 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-white font-medium text-sm outline-none focus:border-red-500 transition-all" />
                                    </div>
                                    <select value={selAlumnoId} onChange={e => setSelAlumnoId(e.target.value)}
                                        className="flex-1 bg-slate-950/60 border border-slate-700/80 rounded-xl px-4 py-2.5 text-white font-medium text-sm outline-none focus:border-red-500 transition-all">
                                        <option value="">— Elegir alumno —</option>
                                        {alumnos.filter(a => `${a.nombre} ${a.apellido}`.toLowerCase().includes(searchTermAlumno.toLowerCase())).map(a => (
                                            <option key={a._id} value={a._id}>{a.nombre} {a.apellido}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            {selAlumnoId && (
                                <button onClick={() => setShowModal("vender")} className="w-full sm:w-auto bg-red-600 hover:bg-red-500 text-white px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-red-600/20 transition-all flex items-center justify-center gap-1.5">
                                    <Plus size={15} />
                                    <span>Nueva Venta</span>
                                </button>
                            )}
                        </div>

                        {!selAlumnoId ? (
                            <div className="py-16 text-center text-slate-500 border border-dashed border-slate-800 rounded-2xl bg-slate-950/20">
                                <Users size={40} className="mx-auto mb-2 opacity-30 text-slate-400" />
                                <p className="font-semibold text-xs uppercase tracking-wider">Elige un alumno arriba para gestionar sus compras y cuotas</p>
                            </div>
                        ) : (
                            <>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    {planes.length === 0 && (
                                        <div className="col-span-full py-12 text-center text-slate-500 bg-slate-950/20 rounded-2xl border border-slate-800 border-dashed">
                                            <p className="font-semibold text-xs">Este alumno no posee planes de pago ni compras registradas</p>
                                        </div>
                                    )}
                                    {planes.slice((pageTienda - 1) * LIMIT_TIENDA, pageTienda * LIMIT_TIENDA).map(plan => {
                                        const saldo = Math.max(0, plan.montoTotal - plan.montoPagado);
                                        const pct = (plan.montoPagado / plan.montoTotal) * 100;
                                        return (
                                            <div key={plan._id} className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5 space-y-3.5 shadow-sm">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <p className="font-bold text-white text-sm uppercase">{plan.descripcion}</p>
                                                        <p className="text-[10px] text-slate-500 font-medium mt-0.5">{fmtFecha(plan.fecha, "dd/MM/yyyy")}</p>
                                                    </div>
                                                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${PLAN_ESTADOS[plan.estado]}`}>
                                                        {plan.estado}
                                                    </span>
                                                </div>
                                                <div>
                                                    <div className="flex justify-between text-xs font-medium text-slate-400 mb-1.5">
                                                        <span>Pagado: <strong className="text-emerald-400">${fmt(plan.montoPagado)}</strong></span>
                                                        <span>Total: <strong className="text-white">${fmt(plan.montoTotal)}</strong></span>
                                                    </div>
                                                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
                                                        <div className={`h-full transition-all duration-700 ${plan.estado === 'completado' ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${pct}%` }} />
                                                    </div>
                                                    {saldo > 0 && <p className="text-right text-xs font-bold text-amber-400 mt-1.5">Saldo pendiente: ${fmt(saldo)}</p>}
                                                </div>
                                                {plan.estado === 'pendiente' && (
                                                    <div className="flex gap-2 pt-1">
                                                        <button onClick={() => { setSelPlan(plan); setShowModal("plan_pagar"); }} 
                                                            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-xl text-xs uppercase tracking-wider shadow-sm transition-all active:scale-95">
                                                            Pagar Cuota
                                                        </button>
                                                        <button onClick={() => handleCancelarPlan(plan._id)} 
                                                            className="px-3 py-2 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-xl transition-all border border-slate-700 text-xs">
                                                            ✕
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                                {planes.length > LIMIT_TIENDA && (
                                    <div className="flex justify-center items-center gap-3 mt-6 pt-5 border-t border-slate-800/80">
                                        <button onClick={() => setPageTienda(p => Math.max(1, p - 1))} disabled={pageTienda === 1} className="p-2 bg-slate-800 rounded-xl border border-slate-700 text-slate-400 disabled:opacity-20 text-xs">◀</button>
                                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Página {pageTienda} de {Math.ceil(planes.length / LIMIT_TIENDA)}</span>
                                        <button onClick={() => setPageTienda(p => Math.min(Math.ceil(planes.length / LIMIT_TIENDA), p + 1))} disabled={pageTienda === Math.ceil(planes.length / LIMIT_TIENDA)} className="p-2 bg-slate-800 rounded-xl border border-slate-700 text-slate-400 disabled:opacity-20 text-xs">▶</button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Dashboard de Ventas Visual */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-md shadow-sm">
                            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-blue-500"></span> Tendencia de Ventas (Anual)
                            </h4>
                            <div className="h-[280px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={dataMensual}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                        <XAxis dataKey="mes" stroke="#94a3b8" fontSize={11} axisLine={false} tickLine={false} />
                                        <YAxis stroke="#94a3b8" fontSize={11} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v/1000}k`} />
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', fontSize: '12px' }}
                                            itemStyle={{ color: '#f8fafc', fontWeight: 'bold' }}
                                            cursor={{ fill: '#1e293b', opacity: 0.4 }}
                                        />
                                        <Bar dataKey="monto" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-md shadow-sm">
                            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-purple-500"></span> Distribución por Categoría
                            </h4>
                            <div className="h-[280px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={dataCategorias} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={4} dataKey="monto">
                                            {dataCategorias.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={CAT_COLORS[entry.name] || '#8b5cf6'} stroke="none" />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', fontSize: '12px' }}
                                            itemStyle={{ color: '#f8fafc', fontWeight: 'bold' }}
                                        />
                                        <Legend verticalAlign="bottom" height={36} formatter={(v) => <span className="text-[11px] font-semibold text-slate-400 uppercase">{v}</span>} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── TAB: AJUSTES ─── */}
            {tab === "config" && configEdit && (
                <div className="max-w-2xl mx-auto animate-in zoom-in-95 duration-300">
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 sm:p-8 backdrop-blur-md shadow-sm space-y-6">
                        <div className="border-b border-slate-800/80 pb-4">
                            <h3 className="text-xl font-bold text-white tracking-tight">Configuración de Precios y Reglas</h3>
                            <p className="text-xs text-slate-400 font-medium mt-1">Parámetros comerciales y vencimientos de la Academia</p>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Precio de Cuota / Membresía Mensual</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</span>
                                    <input type="number" value={configEdit.precioMembresia} onChange={e => setConfigEdit({...configEdit, precioMembresia: Number(e.target.value)})}
                                        className="w-full bg-slate-950/60 border border-slate-700/80 rounded-xl pl-8 pr-4 py-3 text-white font-bold text-lg outline-none focus:border-red-500 transition-all" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Día Límite de Pago</label>
                                    <input type="number" value={configEdit.diaCierreCobranza} onChange={e => setConfigEdit({...configEdit, diaCierreCobranza: Number(e.target.value)})}
                                        className="w-full bg-slate-950/60 border border-slate-700/80 rounded-xl px-4 py-3 text-white font-semibold outline-none focus:border-red-500 transition-all text-sm" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">% Recargo por Pago Tardío</label>
                                    <input type="number" value={configEdit.porcentajeRecargo} onChange={e => setConfigEdit({...configEdit, porcentajeRecargo: Number(e.target.value)})}
                                        className="w-full bg-slate-950/60 border border-slate-700/80 rounded-xl px-4 py-3 text-white font-semibold outline-none focus:border-red-500 transition-all text-sm" />
                                </div>
                            </div>
                        </div>
                        
                        <button onClick={handleGuardarConfig} disabled={loading}
                            className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3.5 rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-red-600/20 transition-all active:scale-98 disabled:opacity-50">
                            {loading ? "Guardando..." : "Guardar Configuración"}
                        </button>
                    </div>
                </div>
            )}

            {/* ─── MODALES TAILADMIN ─── */}
            
            <PortalModal show={showModal === "ingreso" || showModal === "egreso"} onClose={() => setShowModal(null)}>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-7 w-full max-w-md shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
                    <div className="flex justify-between items-center border-b border-slate-800/80 pb-3.5">
                        <h2 className={`text-base font-bold uppercase tracking-wider ${showModal === 'ingreso' ? 'text-emerald-400' : 'text-red-400'}`}>
                            {showModal === 'ingreso' ? '▲ Nuevo Ingreso' : '▼ Nuevo Egreso'}
                        </h2>
                        <button onClick={() => setShowModal(null)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800">
                            <X size={18} />
                        </button>
                    </div>
                    <div className="space-y-3.5">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Categoría</label>
                            <select value={form.categoria} onChange={e => setForm({...form, categoria: e.target.value})}
                                className="w-full bg-slate-950/60 border border-slate-700/80 rounded-xl px-4 py-2.5 text-white font-medium text-sm outline-none focus:border-red-500 transition-all">
                                {(showModal === "ingreso" ? CATEGORIAS_INGRESO : CATEGORIAS_EGRESO).map(c => <option key={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Monto ($)</label>
                            <input type="number" placeholder="0" value={form.monto} onChange={e => setForm({...form, monto: e.target.value})}
                                className="w-full bg-slate-950/60 border border-slate-700/80 rounded-xl px-4 py-3 text-white font-bold text-xl outline-none focus:border-red-500 text-center" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Descripción</label>
                            <input type="text" placeholder="Ej: Pago de servicios..." value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})}
                                className="w-full bg-slate-950/60 border border-slate-700/80 rounded-xl px-4 py-2.5 text-white font-medium text-sm outline-none focus:border-red-500 transition-all" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Fecha</label>
                            <input type="date" value={form.fecha} onChange={e => setForm({...form, fecha: e.target.value})}
                                className="w-full bg-slate-950/60 border border-slate-700/80 rounded-xl px-4 py-2.5 text-white font-medium text-sm outline-none focus:border-red-500 transition-all [color-scheme:dark]" />
                        </div>
                    </div>
                    <div className="flex flex-col gap-2 pt-2">
                        <button onClick={handleCrearTransaccion} disabled={loading}
                            className={`w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider text-white shadow-lg transition-all active:scale-98 ${
                                showModal === 'ingreso' ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/20' : 'bg-red-600 hover:bg-red-500 shadow-red-900/20'
                            }`}>
                            {loading ? "Registrando..." : "Confirmar Movimiento"}
                        </button>
                        <button onClick={() => setShowModal(null)} className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 rounded-xl transition-all text-xs uppercase tracking-wider">
                            Cancelar
                        </button>
                    </div>
                </div>
            </PortalModal>

            <PortalModal show={showModal === "stock_form"} onClose={() => setShowModal(null)}>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-7 w-full max-w-md shadow-2xl space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
                        <h2 className="text-base font-bold text-white uppercase tracking-wider">{selProducto ? 'Editar Artículo' : 'Nuevo Artículo'}</h2>
                        <button onClick={() => setShowModal(null)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                            <X size={18} />
                        </button>
                    </div>
                    <div className="space-y-3">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Nombre</label>
                            <input type="text" value={productoForm.nombre} onChange={e => setProductoForm({...productoForm, nombre: e.target.value})} 
                                className="w-full bg-slate-950/60 border border-slate-700/80 rounded-xl px-4 py-2.5 text-white font-medium text-sm outline-none focus:border-red-500" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Precio ($)</label>
                                <input type="number" value={productoForm.precio} onChange={e => setProductoForm({...productoForm, precio: e.target.value})} 
                                    className="w-full bg-slate-950/60 border border-slate-700/80 rounded-xl px-4 py-2.5 text-white font-bold text-sm outline-none focus:border-red-500" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Stock Inicial</label>
                                <input type="number" value={productoForm.stock} onChange={e => setProductoForm({...productoForm, stock: e.target.value})} 
                                    className="w-full bg-slate-950/60 border border-slate-700/80 rounded-xl px-4 py-2.5 text-white font-bold text-sm outline-none focus:border-red-500" />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Categoría</label>
                            <select value={productoForm.categoria} onChange={e => setProductoForm({...productoForm, categoria: e.target.value})} 
                                className="w-full bg-slate-950/60 border border-slate-700/80 rounded-xl px-4 py-2.5 text-white font-medium text-sm outline-none focus:border-red-500">
                                {CATEGORIAS_STOCK.map(c => <option key={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2 pt-2">
                        <button onClick={handleCrearProducto} className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-red-600/20 transition-all active:scale-98 text-xs uppercase tracking-wider">
                            GUARDAR ARTÍCULO
                        </button>
                        <button onClick={() => setShowModal(null)} className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 rounded-xl transition-all text-xs uppercase tracking-wider">
                            Cancelar
                        </button>
                    </div>
                </div>
            </PortalModal>

            <PortalModal show={showModal === "stock_ajuste"} onClose={() => setShowModal(null)}>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-4">
                    <h2 className="text-base font-bold text-white uppercase tracking-wider text-center">Ajustar Stock</h2>
                    <p className="text-center text-slate-400 text-xs font-medium uppercase">{selProducto?.nombre}</p>
                    <input type="number" value={stockEdit} onChange={e => setStockEdit(e.target.value)} 
                        className="w-full bg-slate-950/60 border border-slate-700/80 rounded-xl px-4 py-4 text-white font-bold text-3xl text-center outline-none focus:border-red-500" />
                    <div className="flex flex-col gap-2 pt-2">
                        <button onClick={handleAjusteStock} className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl transition-all text-xs uppercase tracking-wider active:scale-98 shadow-md shadow-red-600/20">
                            ACTUALIZAR STOCK
                        </button>
                        <button onClick={() => setShowModal(null)} className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 rounded-xl transition-all text-xs uppercase tracking-wider">
                            Cancelar
                        </button>
                    </div>
                </div>
            </PortalModal>

            <PortalModal show={showModal === "vender"} onClose={() => setShowModal(null)}>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-7 w-full max-w-md shadow-2xl space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
                        <h2 className="text-base font-bold text-white uppercase tracking-wider">Nueva Venta</h2>
                        <button onClick={() => setShowModal(null)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                            <X size={18} />
                        </button>
                    </div>
                    <div className="flex bg-slate-950/60 p-1 rounded-xl border border-slate-800">
                        <button onClick={() => setVentaPlanForm({...ventaPlanForm, esPlan: false})} 
                            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${!ventaPlanForm.esPlan ? 'bg-red-600 text-white shadow-sm' : 'text-slate-400'}`}>
                            PAGO DIRECTO
                        </button>
                        <button onClick={() => setVentaPlanForm({...ventaPlanForm, esPlan: true})} 
                            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${ventaPlanForm.esPlan ? 'bg-red-600 text-white shadow-sm' : 'text-slate-400'}`}>
                            A CUOTAS (PLAN)
                        </button>
                    </div>
                    <div className="space-y-3">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Artículo del Stock (opcional)</label>
                            <select value={ventaPlanForm.productoId} onChange={e => {
                                const p = productos.find(x => x._id === e.target.value);
                                setVentaPlanForm({...ventaPlanForm, productoId: e.target.value, descripcion: p ? p.nombre : ventaPlanForm.descripcion, montoTotal: p ? p.precio : ventaPlanForm.montoTotal});
                            }} className="w-full bg-slate-950/60 border border-slate-700/80 rounded-xl px-4 py-2.5 text-white font-medium text-sm outline-none focus:border-red-500">
                                <option value="">— Ingresar manualmente —</option>
                                {productos.map(p => <option key={p._id} value={p._id}>{CAT_ICONS[p.categoria]} {p.nombre} · ${fmt(p.precio)}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Descripción</label>
                            <input type="text" value={ventaPlanForm.descripcion} onChange={e => setVentaPlanForm({...ventaPlanForm, descripcion: e.target.value})} 
                                className="w-full bg-slate-950/60 border border-slate-700/80 rounded-xl px-4 py-2.5 text-white font-medium text-sm outline-none focus:border-red-500" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Monto Total ($)</label>
                            <input type="number" value={ventaPlanForm.montoTotal} onChange={e => setVentaPlanForm({...ventaPlanForm, montoTotal: e.target.value})} 
                                className="w-full bg-slate-950/60 border border-slate-700/80 rounded-xl px-4 py-3 text-white font-bold text-xl outline-none focus:border-red-500 text-center" />
                        </div>
                    </div>
                    <div className="flex flex-col gap-2 pt-2">
                        <button onClick={handleCrearVentaPlan} className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-red-600/20 transition-all active:scale-98 uppercase tracking-wider text-xs">
                            Confirmar Venta
                        </button>
                        <button onClick={() => setShowModal(null)} className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 rounded-xl transition-all text-xs uppercase tracking-wider">
                            Cancelar
                        </button>
                    </div>
                </div>
            </PortalModal>

            <PortalModal show={showModal === "plan_pagar"} onClose={() => setShowModal(null)}>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
                        <h2 className="text-base font-bold text-emerald-400 uppercase tracking-wider">Registrar Pago de Cuota</h2>
                        <button onClick={() => setShowModal(null)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                            <X size={18} />
                        </button>
                    </div>
                    <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800 text-center">
                        <p className="font-bold text-white text-xs uppercase">{selPlan?.descripcion}</p>
                        <p className="text-amber-400 font-semibold mt-0.5 text-xs">Saldo: ${fmt((selPlan?.montoTotal || 0) - (selPlan?.montoPagado || 0))}</p>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block text-center">Monto a abonar ($)</label>
                        <input type="number" value={pagoForm.monto} onChange={e => setPagoForm({...pagoForm, monto: e.target.value})} 
                            className="w-full bg-slate-950/60 border border-slate-700/80 rounded-xl px-4 py-4 text-white font-bold text-2xl text-center outline-none focus:border-emerald-500" />
                    </div>
                    <div className="flex flex-col gap-2 pt-2">
                        <button onClick={handlePagarCuota} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all active:scale-98 uppercase tracking-wider text-xs">
                            Confirmar Pago
                        </button>
                        <button onClick={() => setShowModal(null)} className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 rounded-xl transition-all text-xs uppercase tracking-wider">
                            Cancelar
                        </button>
                    </div>
                </div>
            </PortalModal>

        </div>
    );
}

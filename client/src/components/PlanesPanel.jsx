/**
 * PlanesPanel — Panel de Cuotas y Pagos Parciales del Alumno
 * Se integra en AlumnoFormPage.jsx
 */
import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { format } from "date-fns";
import { getPlanesAlumno, crearPlan, pagarCuota, cancelarPlan } from "../api/planes";
import { getProductos } from "../api/productos";

function fmt(n) { return Number(n || 0).toLocaleString("es-AR", { minimumFractionDigits: 0 }); }

const ESTADO_STYLES = {
    pendiente:  "bg-yellow-900/30 text-yellow-400 border-yellow-700/30",
    completado: "bg-green-900/30 text-green-400 border-green-700/30",
    cancelado:  "bg-slate-700/40 text-slate-400 border-slate-600/30",
};

// Modal renderizado en document.body para escapar del stacking context de backdrop-blur
function PortalModal({ show, onClose, children }) {
    if (!show) return null;
    return createPortal(
        <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
            style={{ zIndex: 9999 }}
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
            {children}
        </div>,
        document.body
    );
}

export default function PlanesPanel({ alumnoId }) {
    const [planes, setPlanes] = useState([]);
    const [productos, setProductos] = useState([]);
    const [modal, setModal] = useState(null); // null | "crear" | "pagar"
    const [selPlan, setSelPlan] = useState(null);
    const [form, setForm] = useState({ descripcion: "", productoId: "", montoTotal: "", notas: "" });
    const [pagoForm, setPagoForm] = useState({ monto: "", nota: "" });
    const [loading, setLoading] = useState(false);

    const cargar = useCallback(async () => {
        if (!alumnoId) return;
        const { data } = await getPlanesAlumno(alumnoId);
        setPlanes(data);
    }, [alumnoId]);

    useEffect(() => { cargar(); }, [cargar]);
    useEffect(() => {
        getProductos().then(({ data }) => setProductos(data)).catch(() => {});
    }, []);

    async function handleCrear() {
        if (!form.descripcion || !form.montoTotal) return alert("Descripción y monto son obligatorios.");
        setLoading(true);
        try {
            await crearPlan({
                alumnoId,
                productoId: form.productoId || null,
                descripcion: form.descripcion,
                montoTotal: Number(form.montoTotal),
                notas: form.notas
            });
            setModal(null);
            setForm({ descripcion: "", productoId: "", montoTotal: "", notas: "" });
            cargar();
        } catch (e) { alert(e.response?.data?.message || "Error"); }
        finally { setLoading(false); }
    }

    async function handlePagar() {
        if (!pagoForm.monto || Number(pagoForm.monto) <= 0) return alert("Ingresá un monto válido.");
        setLoading(true);
        try {
            await pagarCuota(selPlan._id, { monto: Number(pagoForm.monto), nota: pagoForm.nota });
            setModal(null);
            setPagoForm({ monto: "", nota: "" });
            cargar();
        } catch (e) { alert(e.response?.data?.message || "Error"); }
        finally { setLoading(false); }
    }

    async function handleCancelar(id) {
        if (!window.confirm("¿Cancelar este plan de pago?")) return;
        await cancelarPlan(id);
        cargar();
    }

    const pendientes = planes.filter(p => p.estado === "pendiente");
    const deudaTotal = pendientes.reduce((s, p) => s + (p.montoTotal - p.montoPagado), 0);

    return (
        <div className="space-y-5">
            {/* Encabezado */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Cuotas & Pagos en Curso</h3>
                    {deudaTotal > 0 && (
                        <p className="text-xs text-orange-400 font-bold mt-0.5">Saldo pendiente total: <span className="text-white">${fmt(deudaTotal)}</span></p>
                    )}
                </div>
                <button
                    onClick={() => setModal("crear")}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-3 py-2 rounded-xl transition-all active:scale-95 border border-blue-500/50 shadow-sm"
                >
                    + Nuevo Plan
                </button>
            </div>

            {/* Lista de planes */}
            {planes.length === 0 ? (
                <div className="text-center py-8 text-slate-600">
                    <p className="text-2xl mb-1">💳</p>
                    <p className="text-sm font-bold">Sin planes de pago activos</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {planes.map(plan => {
                        const saldo = Math.max(0, plan.montoTotal - plan.montoPagado);
                        const pct = Math.min((plan.montoPagado / plan.montoTotal) * 100, 100);
                        return (
                            <div key={plan._id} className="bg-slate-900/50 rounded-2xl p-4 border border-slate-700/40 space-y-3">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-white text-sm truncate">{plan.descripcion}</p>
                                        {plan.productoId && <p className="text-xs text-slate-400">{plan.productoId.nombre} · {plan.productoId.categoria}</p>}
                                    </div>
                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border flex-shrink-0 ${ESTADO_STYLES[plan.estado]}`}>
                                        {plan.estado.toUpperCase()}
                                    </span>
                                </div>

                                {/* Monto y barra */}
                                <div>
                                    <div className="flex justify-between text-xs mb-1.5">
                                        <span className="text-slate-400">Pagado: <span className="text-green-400 font-bold">${fmt(plan.montoPagado)}</span></span>
                                        <span className="text-slate-400">Total: <span className="text-white font-bold">${fmt(plan.montoTotal)}</span></span>
                                    </div>
                                    <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-black/30 shadow-inner">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${plan.estado === "completado" ? "bg-green-500" : "bg-gradient-to-r from-blue-500 to-cyan-400"}`}
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                    {saldo > 0 && <p className="text-[11px] text-orange-400 font-bold mt-1 text-right">Saldo: ${fmt(saldo)}</p>}
                                </div>

                                {/* Historial de pagos */}
                                {plan.pagos.length > 0 && (
                                    <div className="border-t border-slate-700/40 pt-2 space-y-1">
                                        {plan.pagos.slice(-3).map((p, i) => (
                                            <div key={i} className="flex justify-between text-[10px] text-slate-400">
                                                <span>{format(new Date(p.fecha), "dd/MM/yyyy")}{p.nota ? ` · ${p.nota}` : ""}</span>
                                                <span className="text-green-400 font-bold">+${fmt(p.monto)}</span>
                                            </div>
                                        ))}
                                        {plan.pagos.length > 3 && <p className="text-[10px] text-slate-600 text-center">+{plan.pagos.length - 3} pagos anteriores</p>}
                                    </div>
                                )}

                                {/* Acciones */}
                                {plan.estado === "pendiente" && (
                                    <div className="flex gap-2 pt-1">
                                        <button
                                            onClick={() => { setSelPlan(plan); setPagoForm({ monto: "", nota: "" }); setModal("pagar"); }}
                                            className="flex-1 bg-blue-600/80 hover:bg-blue-600 text-white text-xs font-bold py-2 rounded-xl transition-all active:scale-95"
                                        >
                                            💵 Registrar Pago
                                        </button>
                                        <button
                                            onClick={() => handleCancelar(plan._id)}
                                            className="px-3 py-2 text-slate-500 hover:text-red-400 text-xs transition-all"
                                            title="Cancelar plan"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal: Crear Plan — renderizado en document.body via Portal */}
            <PortalModal show={modal === "crear"} onClose={() => setModal(null)}>
                <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-black text-blue-400">+ Nuevo Plan de Pago</h2>
                        <button onClick={() => setModal(null)} className="text-slate-500 hover:text-white text-xl">✕</button>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Artículo del stock (opcional)</label>
                        <select value={form.productoId} onChange={e => {
                            const p = productos.find(x => x._id === e.target.value);
                            setForm(prev => ({ ...prev, productoId: e.target.value, descripcion: p ? p.nombre : prev.descripcion, montoTotal: p ? p.precio : prev.montoTotal }));
                        }} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 transition-all font-semibold">
                            <option value="">— Ingresar manualmente —</option>
                            {productos.map(p => <option key={p._id} value={p._id}>{p.nombre} · ${fmt(p.precio)}</option>)}
                        </select>
                    </div>

                    {[
                        { label: "Descripción", key: "descripcion", type: "text", placeholder: "Ej: Kimono GB Talle M" },
                        { label: "Monto Total", key: "montoTotal", type: "number", placeholder: "0" },
                        { label: "Notas (opcional)", key: "notas", type: "text", placeholder: "Ej: 3 cuotas acordadas" },
                    ].map(({ label, key, type, placeholder }) => (
                        <div key={key} className="space-y-1.5">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{label}</label>
                            <input type={type} placeholder={placeholder} value={form[key]}
                                onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 transition-all font-semibold"
                            />
                        </div>
                    ))}

                    <button onClick={handleCrear} disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-3.5 rounded-2xl shadow-lg transition-all active:scale-95 disabled:opacity-50">
                        {loading ? "Guardando…" : "Crear Plan"}
                    </button>
                </div>
            </PortalModal>

            {/* Modal: Registrar Pago — renderizado en document.body via Portal */}
            <PortalModal show={modal === "pagar" && !!selPlan} onClose={() => setModal(null)}>
                {selPlan && (
                    <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-black text-green-400">💵 Registrar Pago</h2>
                            <button onClick={() => setModal(null)} className="text-slate-500 hover:text-white text-xl">✕</button>
                        </div>
                        <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/50">
                            <p className="font-bold text-white text-sm">{selPlan.descripcion}</p>
                            <p className="text-xs text-orange-400 mt-1 font-bold">Saldo pendiente: ${fmt(selPlan.montoTotal - selPlan.montoPagado)}</p>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Monto a abonar</label>
                            <input type="number" placeholder="0" value={pagoForm.monto}
                                onChange={e => setPagoForm(prev => ({ ...prev, monto: e.target.value }))}
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-green-500 transition-all font-black text-xl text-center"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Nota (opcional)</label>
                            <input type="text" placeholder="Ej: Cuota 2 de 3" value={pagoForm.nota}
                                onChange={e => setPagoForm(prev => ({ ...prev, nota: e.target.value }))}
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-green-500 transition-all font-semibold"
                            />
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

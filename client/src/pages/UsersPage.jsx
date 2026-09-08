import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getUsersRequest, deleteUserRequest, updateUserRequest } from "../api/auth";
import { UserPlus, Trash2, Shield, Mail, Contact, Loader2, X, Pencil, User as UserIcon, CheckCircle2, Clock } from "lucide-react";
import { showAlert, showToast } from "../utils/alerts";

const EMPTY_FORM = { dni: "", email: "", nombre: "", apellido: "", role: "Profesor" };

export default function UsersPage() {
    const { signup, user: currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal crear
    const [showCreate, setShowCreate] = useState(false);
    const [createForm, setCreateForm] = useState(EMPTY_FORM);
    const [createLoading, setCreateLoading] = useState(false);
    const [createError, setCreateError] = useState(null);

    // Modal editar
    const [showEdit, setShowEdit] = useState(false);
    const [editForm, setEditForm] = useState(EMPTY_FORM);
    const [editTarget, setEditTarget] = useState(null);
    const [editLoading, setEditLoading] = useState(false);
    const [editError, setEditError] = useState(null);

    useEffect(() => { loadUsers(); }, []);

    async function loadUsers() {
        try {
            const res = await getUsersRequest();
            setUsers(res.data);
        } catch (error) {
            const msg = error.response?.data?.message || "Error al cargar usuarios";
            showAlert({ title: "Error", text: msg, icon: "error" });
        } finally {
            setLoading(false);
        }
    }

    // ── Crear ──────────────────────────────────────────────────────────────────
    const handleCreate = async (e) => {
        e.preventDefault();
        setCreateLoading(true);
        setCreateError(null);
        try {
            await signup(createForm);
            setShowCreate(false);
            setCreateForm(EMPTY_FORM);
            loadUsers();
            showAlert({
                title: "¡Usuario Registrado!",
                text: `Se envió un correo con las credenciales a ${createForm.email}`,
                icon: "success"
            });
        } catch (error) {
            const msg = error.response?.data?.[0] || error.response?.data?.message || "Error al registrar usuario";
            setCreateError(msg);
        } finally {
            setCreateLoading(false);
        }
    };

    // ── Editar ─────────────────────────────────────────────────────────────────
    const openEdit = (u) => {
        setEditTarget(u);
        setEditForm({ nombre: u.nombre, apellido: u.apellido, email: u.email, role: u.role });
        setEditError(null);
        setShowEdit(true);
    };

    const handleEdit = async (e) => {
        e.preventDefault();
        setEditLoading(true);
        setEditError(null);
        try {
            const res = await updateUserRequest(editTarget._id, editForm);
            setUsers(prev => prev.map(u => u._id === editTarget._id ? res.data : u));
            setShowEdit(false);
            showToast("Datos actualizados correctamente", "success");
        } catch (error) {
            const msg = error.response?.data?.message || "Error al actualizar usuario";
            setEditError(msg);
        } finally {
            setEditLoading(false);
        }
    };

    // ── Eliminar ───────────────────────────────────────────────────────────────
    const handleDelete = async (id, nombre) => {
        if (id === currentUser?.id) {
            return showAlert({ title: "Atención", text: "No puedes eliminar tu propia cuenta.", icon: "info" });
        }
        const confirm = await showAlert({
            title: `¿Eliminar a ${nombre}?`,
            text: "Esta persona ya no podrá acceder al sistema.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Sí, eliminar"
        });
        if (confirm.isConfirmed) {
            try {
                await deleteUserRequest(id);
                setUsers(users.filter(u => u._id !== id));
                showToast("Usuario eliminado");
            } catch (error) {
                showAlert({ title: "Error", text: "No se pudo eliminar al usuario.", icon: "error" });
            }
        }
    };

    if (loading) return (
        <div className="flex h-[60vh] items-center justify-center">
            <Loader2 className="w-10 h-10 text-red-500 animate-spin" />
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500 pb-12">

            {/* Header TailAdmin */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-slate-900/40 p-6 rounded-2xl border border-slate-800 backdrop-blur-md shadow-sm">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
                            <Shield size={22} />
                        </div>
                        Gestión de Staff
                    </h1>
                    <p className="text-sm font-medium text-slate-400 mt-1">
                        Administra los accesos y credenciales de Profesores y Administradores
                    </p>
                </div>
                <button
                    onClick={() => { setCreateForm(EMPTY_FORM); setCreateError(null); setShowCreate(true); }}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-500 text-white px-5 py-3 font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-red-600/20 active:scale-95"
                >
                    <UserPlus size={16} />
                    NUEVO INTEGRANTE
                </button>
            </div>

            {/* Tabla Estilo TailAdmin */}
            {users.length === 0 ? (
                <div className="text-center py-20 text-slate-500 border border-dashed border-slate-800 rounded-2xl bg-slate-900/20">
                    <UserIcon size={48} className="mx-auto mb-3 opacity-30 text-slate-400" />
                    <p className="font-bold text-sm">No hay integrantes del staff registrados aún.</p>
                </div>
            ) : (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-md shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/30">
                        <h2 className="font-bold text-sm uppercase tracking-wider text-slate-300">Equipo Docente y Administrativo</h2>
                        <span className="text-xs font-semibold text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/50">
                            {users.length} {users.length === 1 ? 'miembro' : 'miembros'}
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[720px]">
                            <thead>
                                <tr className="border-b border-slate-800/80 bg-slate-950/50 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                    <th className="py-4 px-6">Integrante</th>
                                    <th className="py-4 px-6">DNI / Usuario</th>
                                    <th className="py-4 px-6">Email</th>
                                    <th className="py-4 px-6">Rol</th>
                                    <th className="py-4 px-6">Estado</th>
                                    <th className="py-4 px-6 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/40 text-sm">
                                {users.map(u => {
                                    const isSelf = u._id === currentUser?.id;
                                    return (
                                        <tr key={u._id} className="hover:bg-slate-800/25 transition-colors">
                                            {/* Integrante */}
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-sm font-bold text-white border border-slate-700 shadow-sm flex-shrink-0">
                                                        {u.nombre?.charAt(0)?.toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-white flex items-center gap-1.5">
                                                            {u.nombre} {u.apellido}
                                                            {isSelf && (
                                                                <span className="text-[9px] font-bold bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">Tú</span>
                                                            )}
                                                        </div>
                                                        <span className="text-xs text-slate-500 font-medium">{u.role}</span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* DNI */}
                                            <td className="py-4 px-6">
                                                <span className="font-mono text-xs text-slate-300 font-semibold bg-slate-950/40 px-2.5 py-1 rounded-md border border-slate-800">
                                                    {u.dni || "—"}
                                                </span>
                                            </td>

                                            {/* Email */}
                                            <td className="py-4 px-6 text-slate-300 text-xs font-medium">
                                                {u.email}
                                            </td>

                                            {/* Rol Badge */}
                                            <td className="py-4 px-6">
                                                <span className={`inline-flex items-center text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border ${
                                                    u.role === 'Admin'
                                                        ? 'bg-red-500/10 text-red-400 border-red-500/25'
                                                        : u.role === 'Encargado'
                                                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/25'
                                                            : u.role === 'Profesor'
                                                                ? 'bg-blue-500/10 text-blue-400 border-blue-500/25'
                                                                : 'bg-slate-500/10 text-slate-400 border-slate-500/25'
                                                }`}>
                                                    {u.role === 'Encargado' ? 'Prof. Encargado' : u.role}
                                                </span>
                                            </td>

                                            {/* Estado */}
                                            <td className="py-4 px-6">
                                                {u.mustChangePassword ? (
                                                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                                                        <Clock size={12} className="animate-pulse text-amber-400" />
                                                        Pendiente clave
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                                                        <CheckCircle2 size={12} className="text-emerald-400" />
                                                        Activo
                                                    </span>
                                                )}
                                            </td>

                                            {/* Acciones */}
                                            <td className="py-4 px-6 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        onClick={() => openEdit(u)}
                                                        className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"
                                                        title="Editar datos"
                                                    >
                                                        <Pencil size={15} />
                                                    </button>
                                                    {!isSelf && (
                                                        <button
                                                            onClick={() => handleDelete(u._id, u.nombre)}
                                                            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                                            title="Eliminar integrante"
                                                        >
                                                            <Trash2 size={15} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ── Modal Crear ──────────────────────────────────────────────────── */}
            {showCreate && (
                <Modal title="Registrar Nuevo Integrante" onClose={() => setShowCreate(false)}>
                    {createError && <ErrorBanner msg={createError} />}
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field label="Nombre" name="nombre" value={createForm.nombre}
                                onChange={e => setCreateForm(p => ({ ...p, nombre: e.target.value }))}
                                placeholder="Ej: Pedro" required />
                            <Field label="Apellido" name="apellido" value={createForm.apellido}
                                onChange={e => setCreateForm(p => ({ ...p, apellido: e.target.value }))}
                                placeholder="Ej: Gómez" required />
                        </div>
                        <Field label="DNI (usuario de ingreso)" name="dni" value={createForm.dni}
                            onChange={e => setCreateForm(p => ({ ...p, dni: e.target.value }))}
                            placeholder="Sin puntos ni espacios" required />
                        <Field label="Email institucional o personal" name="email" type="email" value={createForm.email}
                            onChange={e => setCreateForm(p => ({ ...p, email: e.target.value }))}
                            placeholder="profesor@graciebarra.com" required />
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Rol Asignado</label>
                            <select
                                value={createForm.role}
                                onChange={e => setCreateForm(p => ({ ...p, role: e.target.value }))}
                                className="w-full bg-slate-950/60 border border-slate-700/80 rounded-xl px-4 py-3 text-white outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20 transition-all font-medium text-sm"
                            >
                                <option value="Profesor">Profesor (Clases + Asistencia)</option>
                                <option value="Ayudante">Ayudante (Asistencia)</option>
                                <option value="Encargado">Profesor Encargado (Finanzas + Clases)</option>
                                <option value="Admin">Administrador (Control Total)</option>
                            </select>
                        </div>
                        <div className="pt-2">
                            <SubmitBtn loading={createLoading} icon={<Mail size={16} />} label="REGISTRAR Y ENVIAR CREDENCIALES" />
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium text-center">
                            Se enviará una contraseña provisoria al correo indicado para su primer acceso.
                        </p>
                    </form>
                </Modal>
            )}

            {/* ── Modal Editar ──────────────────────────────────────────────────── */}
            {showEdit && editTarget && (
                <Modal title={`Editar Integrante — ${editTarget.nombre} ${editTarget.apellido}`} onClose={() => setShowEdit(false)}>
                    {editError && <ErrorBanner msg={editError} />}
                    <form onSubmit={handleEdit} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field label="Nombre" value={editForm.nombre}
                                onChange={e => setEditForm(p => ({ ...p, nombre: e.target.value }))}
                                placeholder="Nombre" required />
                            <Field label="Apellido" value={editForm.apellido}
                                onChange={e => setEditForm(p => ({ ...p, apellido: e.target.value }))}
                                placeholder="Apellido" required />
                        </div>
                        <Field label="Email" type="email" value={editForm.email}
                            onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))}
                            placeholder="correo@ejemplo.com" required />
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Rol Asignado</label>
                            <select
                                value={editForm.role}
                                onChange={e => setEditForm(p => ({ ...p, role: e.target.value }))}
                                className="w-full bg-slate-950/60 border border-slate-700/80 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all font-medium text-sm"
                            >
                                <option value="Profesor">Profesor (Clases + Asistencia)</option>
                                <option value="Ayudante">Ayudante (Asistencia)</option>
                                <option value="Encargado">Profesor Encargado (Finanzas + Clases)</option>
                                <option value="Admin">Administrador (Control Total)</option>
                            </select>
                        </div>
                        <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800 text-xs text-slate-400 font-medium">
                            ℹ️ El DNI ({editTarget.dni}) no se puede modificar ya que es el identificador de login de la cuenta.
                        </div>
                        <div className="pt-2">
                            <SubmitBtn
                                loading={editLoading}
                                icon={<Pencil size={16} />}
                                label="GUARDAR CAMBIOS"
                                className="bg-blue-600 hover:bg-blue-500 shadow-blue-600/20"
                            />
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
}

// ── Componentes auxiliares ────────────────────────────────────────────────────

function Modal({ title, onClose, children }) {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md bg-black/60 overflow-y-auto">
            <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl p-6 sm:p-7 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
                <div className="flex justify-between items-center pb-4 mb-5 border-b border-slate-800">
                    <h2 className="text-lg font-bold text-white tracking-tight">{title}</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors">
                        <X size={18} />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}

function Field({ label, name, value, onChange, placeholder, type = "text", required }) {
    return (
        <div className="space-y-1.5">
            {label && <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</label>}
            <input
                required={required}
                name={name}
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="w-full bg-slate-950/60 border border-slate-700/80 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20 transition-all font-medium placeholder:text-slate-500"
            />
        </div>
    );
}

function ErrorBanner({ msg }) {
    return (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-semibold flex items-center gap-2">
            <span className="text-base">⚠️</span>
            <span>{msg}</span>
        </div>
    );
}

function SubmitBtn({ loading, icon, label, className = "bg-red-600 hover:bg-red-500 shadow-red-600/20" }) {
    return (
        <button
            type="submit"
            disabled={loading}
            className={`w-full text-white font-bold py-3.5 px-4 rounded-xl shadow-lg active:scale-98 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider disabled:opacity-50 ${className}`}
        >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>{icon}<span>{label}</span></>}
        </button>
    );
}

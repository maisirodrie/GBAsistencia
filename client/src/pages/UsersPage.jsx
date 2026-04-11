import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getUsersRequest, deleteUserRequest, updateUserRequest } from "../api/auth";
import { registerRequest } from "../api/auth";
import { UserPlus, Trash2, Shield, Mail, Contact, Loader2, X, Pencil, User as UserIcon } from "lucide-react";
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
        if (id === currentUser.id) return showAlert({ title: "Atención", text: "No puedes eliminar tu propia cuenta.", icon: "info" });
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
            <Loader2 className="w-10 h-10 text-rose-500 animate-spin" />
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-10">

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/40 p-6 rounded-3xl border border-slate-800 backdrop-blur-md shadow-lg">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        <Shield className="text-rose-500" size={32} />
                        Gestión de Staff
                    </h1>
                    <p className="text-slate-400 font-medium mt-1">Administra los accesos de Profesores y Administradores</p>
                </div>
                <button
                    onClick={() => { setCreateForm(EMPTY_FORM); setCreateError(null); setShowCreate(true); }}
                    className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white px-6 py-3 rounded-2xl font-black transition-all shadow-lg shadow-red-600/20 active:scale-95"
                >
                    <UserPlus size={20} />
                    NUEVO INTEGRANTE
                </button>
            </div>

            {/* Listado */}
            {users.length === 0 ? (
                <div className="text-center py-20 text-slate-500 border border-dashed border-slate-700 rounded-3xl">
                    <UserIcon size={48} className="mx-auto mb-3 opacity-30" />
                    <p className="font-bold">No hay integrantes del staff aún.</p>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {users.map(u => (
                        <div key={u._id} className="bg-slate-800/40 border border-slate-700/50 rounded-[2rem] p-6 hover:bg-slate-800/60 transition-all group relative overflow-hidden">

                            {/* Acciones */}
                            <div className="absolute top-4 right-4 flex gap-1">
                                <button
                                    onClick={() => openEdit(u)}
                                    className="p-2 text-slate-500 hover:text-blue-400 hover:bg-blue-400/10 rounded-xl transition-all"
                                    title="Editar datos"
                                >
                                    <Pencil size={16} />
                                </button>
                                {u._id !== currentUser.id && (
                                    <button
                                        onClick={() => handleDelete(u._id, u.nombre)}
                                        className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
                                        title="Eliminar acceso"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>

                            {/* Avatar + Nombre */}
                            <div className="flex items-center gap-4 mb-5 pr-16">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-2xl font-black text-white border border-slate-600/50 flex-shrink-0 group-hover:scale-105 transition-transform">
                                    {u.nombre.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-lg font-black text-white leading-tight truncate">
                                        {u.nombre} {u.apellido}
                                    </h3>
                                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-widest mt-1 inline-block ${
                                        u.role === 'Admin'
                                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                            : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                    }`}>
                                        {u.role}
                                    </span>
                                </div>
                            </div>

                            {/* Info */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-3 text-slate-400 text-sm bg-slate-900/40 p-3 rounded-xl">
                                    <Contact size={15} className="flex-shrink-0" />
                                    <span className="font-bold">{u.dni}</span>
                                </div>
                                <div className="flex items-center gap-3 text-slate-400 text-sm bg-slate-900/40 p-3 rounded-xl">
                                    <Mail size={15} className="flex-shrink-0" />
                                    <span className="font-medium truncate">{u.email}</span>
                                </div>
                            </div>

                            {/* Estado */}
                            <div className="mt-4 pl-1">
                                {u.mustChangePassword ? (
                                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-amber-500 uppercase tracking-widest">
                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500/50 animate-pulse" />
                                        Pendiente de activación
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-green-500 uppercase tracking-widest">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                        Activo
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Modal Crear ──────────────────────────────────────────────────── */}
            {showCreate && (
                <Modal title="Nuevo Integrante" onClose={() => setShowCreate(false)}>
                    {createError && <ErrorBanner msg={createError} />}
                    <form onSubmit={handleCreate} className="space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field label="Nombre" name="nombre" value={createForm.nombre}
                                onChange={e => setCreateForm(p => ({ ...p, nombre: e.target.value }))}
                                placeholder="Ej: Pedro" required />
                            <Field label="Apellido" name="apellido" value={createForm.apellido}
                                onChange={e => setCreateForm(p => ({ ...p, apellido: e.target.value }))}
                                placeholder="Ej: Gómez" required />
                        </div>
                        <Field label="DNI (usuario de login)" name="dni" value={createForm.dni}
                            onChange={e => setCreateForm(p => ({ ...p, dni: e.target.value }))}
                            placeholder="Sin puntos ni espacios" required />
                        <Field label="Email (recibirá las credenciales)" name="email" type="email" value={createForm.email}
                            onChange={e => setCreateForm(p => ({ ...p, email: e.target.value }))}
                            placeholder="nombre@ejemplo.com" required />
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Rol en el Sistema</label>
                            <select
                                value={createForm.role}
                                onChange={e => setCreateForm(p => ({ ...p, role: e.target.value }))}
                                className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-5 py-3.5 text-white outline-none focus:border-rose-500 transition-all font-semibold appearance-none"
                            >
                                <option value="Profesor">Profesor (Instructor)</option>
                                <option value="Admin">Administrador (Control Total)</option>
                            </select>
                        </div>
                        <SubmitBtn loading={createLoading} icon={<Mail size={20} />} label="REGISTRAR Y ENVIAR EMAIL" />
                        <p className="text-[10px] text-slate-500 font-bold text-center uppercase tracking-[0.05em]">Al registrar se enviará una clave provisoria al correo indicado</p>
                    </form>
                </Modal>
            )}

            {/* ── Modal Editar ──────────────────────────────────────────────────── */}
            {showEdit && editTarget && (
                <Modal title={`Editar — ${editTarget.nombre} ${editTarget.apellido}`} onClose={() => setShowEdit(false)}>
                    {editError && <ErrorBanner msg={editError} />}
                    <form onSubmit={handleEdit} className="space-y-5">
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
                            placeholder="nombre@ejemplo.com" required />
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Rol en el Sistema</label>
                            <select
                                value={editForm.role}
                                onChange={e => setEditForm(p => ({ ...p, role: e.target.value }))}
                                className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-5 py-3.5 text-white outline-none focus:border-blue-500 transition-all font-semibold appearance-none"
                            >
                                <option value="Profesor">Profesor (Instructor)</option>
                                <option value="Admin">Administrador (Control Total)</option>
                            </select>
                        </div>
                        <div className="p-3 bg-slate-900/60 rounded-xl text-xs text-slate-500 font-medium">
                            ℹ️ El DNI no se puede editar ya que es el identificador de login del usuario.
                        </div>
                        <SubmitBtn loading={editLoading} icon={<Pencil size={18} />} label="GUARDAR CAMBIOS"
                            className="bg-gradient-to-r from-blue-600 to-blue-500 shadow-blue-600/20" />
                    </form>
                </Modal>
            )}
        </div>
    );
}

// ── Componentes auxiliares ────────────────────────────────────────────────────

function Modal({ title, onClose, children }) {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md bg-black/40">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in duration-300 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-xl font-black text-white tracking-tight">{title}</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-white p-2 transition-colors">
                        <X size={22} />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}

function Field({ label, name, value, onChange, placeholder, type = "text", required }) {
    return (
        <div className="space-y-2">
            {label && <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">{label}</label>}
            <input
                required={required}
                name={name}
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-5 py-3.5 text-white outline-none focus:border-rose-500 transition-all font-semibold placeholder:text-slate-600"
            />
        </div>
    );
}

function ErrorBanner({ msg }) {
    return (
        <div className="mb-5 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl text-sm font-bold flex items-center gap-3">
            <span className="text-xl">⚠️</span>
            {msg}
        </div>
    );
}

function SubmitBtn({ loading, icon, label, className = "bg-gradient-to-r from-red-600 to-rose-600 shadow-red-600/20" }) {
    return (
        <button
            type="submit"
            disabled={loading}
            className={`w-full text-white font-black py-4 rounded-2xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${className}`}
        >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>{icon}<span>{label}</span></>}
        </button>
    );
}

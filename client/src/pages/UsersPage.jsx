import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getUsersRequest, deleteUserRequest } from "../api/auth";
import { UserPlus, Trash2, Shield, User as UserIcon, Mail, Contact, Loader2, X } from "lucide-react";
import { showAlert, showToast } from "../utils/alerts";

export default function UsersPage() {
    const { signup, user: currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    
    // Form state
    const [formData, setFormData] = useState({
        dni: "",
        email: "",
        nombre: "",
        apellido: "",
        role: "Mestre"
    });
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState(null);

    useEffect(() => {
        loadUsers();
    }, []);

    async function loadUsers() {
        try {
            const res = await getUsersRequest();
            setUsers(res.data);
        } catch (error) {
            const msg = error.response?.data?.[0] || error.response?.data?.message || "Error al cargar usuarios";
            setFormError(msg);
            showAlert({ title: "Error", text: msg, icon: "error" });
        } finally {
            setLoading(false);
        }
    }

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormLoading(true);
        setFormError(null);
        try {
            await signup(formData); // Esto llama a api.post('/register') y envía el correo
            setShowModal(false);
            setFormData({ dni: "", email: "", nombre: "", apellido: "", role: "Mestre" });
            loadUsers();
            showAlert({
                title: "¡Usuario Registrado!",
                text: `Se ha enviado un correo con las credenciales a ${formData.email}`,
                icon: "success"
            });
        } catch (error) {
            const msg = error.response?.data?.[0] || error.response?.data?.message || "Error al registrar usuario";
            setFormError(msg);
            showAlert({ title: "Error", text: msg, icon: "error" });
        } finally {
            setFormLoading(false);
        }
    };

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
                    <p className="text-slate-400 font-medium mt-1">Administra los accesos de Instructores y Administradores</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white px-6 py-3 rounded-2xl font-black transition-all shadow-lg shadow-red-600/20 active:scale-95"
                >
                    <UserPlus size={20} />
                    NUEVO INTEGRANTE
                </button>
            </div>

            {/* Listado */}
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {users.map(u => (
                    <div key={u._id} className="bg-slate-800/40 border border-slate-700/50 rounded-[2rem] p-6 hover:bg-slate-800/60 transition-all group relative overflow-hidden">
                        <div className="flex items-start gap-4 mb-6">
                            <div className="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center text-2xl font-black text-slate-400 border border-slate-700/50 group-hover:scale-110 transition-transform">
                                {u.nombre.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-black text-white leading-tight">{u.apellido}, {u.nombre}</h3>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-widest ${
                                        u.role === 'Admin' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                    }`}>
                                        {u.role}
                                    </span>
                                </div>
                            </div>
                            {u._id !== currentUser.id && (
                                <button 
                                    onClick={() => handleDelete(u._id, u.nombre)}
                                    className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
                                    title="Eliminar acceso"
                                >
                                    <Trash2 size={18} />
                                </button>
                            )}
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center gap-3 text-slate-400 text-sm bg-slate-900/40 p-3 rounded-xl">
                                <Contact size={16} />
                                <span className="font-bold">{u.dni}</span>
                            </div>
                            <div className="flex items-center gap-3 text-slate-400 text-sm bg-slate-900/40 p-3 rounded-xl">
                                <Mail size={16} />
                                <span className="font-medium truncate">{u.email}</span>
                            </div>
                        </div>

                        {/* Status indication */}
                        <div className="mt-6 flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">
                            {u.mustChangePassword ? (
                                <span className="flex items-center gap-1.5 text-amber-500">
                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500/50 animate-pulse"></div>
                                    Pendiente de activación
                                </span>
                            ) : (
                                <span className="flex items-center gap-1.5 text-green-500">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                    Activo
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal de Registro */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md bg-black/40">
                    <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in duration-300">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-black text-white tracking-tight">Nuevo Integrante</h2>
                            <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-white p-2">
                                <X size={24} />
                            </button>
                        </div>

                        {formError && (
                            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl text-sm font-bold flex items-center gap-3">
                                <span className="text-xl">⚠️</span>
                                {formError}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Nombre</label>
                                    <input 
                                        required name="nombre" value={formData.nombre} onChange={handleInputChange}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-5 py-3.5 text-white outline-none focus:border-rose-500 transition-all font-semibold"
                                        placeholder="Ej: Pedro"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Apellido</label>
                                    <input 
                                        required name="apellido" value={formData.apellido} onChange={handleInputChange}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-5 py-3.5 text-white outline-none focus:border-rose-500 transition-all font-semibold"
                                        placeholder="Ej: Gómez"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">DNI (Usuario)</label>
                                <input 
                                    required name="dni" value={formData.dni} onChange={handleInputChange}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-5 py-3.5 text-white outline-none focus:border-rose-500 transition-all font-semibold italic"
                                    placeholder="Sin puntos ni espacios"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Email (Donde recibirá las credenciales)</label>
                                <input 
                                    required type="email" name="email" value={formData.email} onChange={handleInputChange}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-5 py-3.5 text-white outline-none focus:border-rose-500 transition-all font-semibold"
                                    placeholder="nombre@ejemplo.com"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Rol en el Sistema</label>
                                <select 
                                    name="role" value={formData.role} onChange={handleInputChange}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-5 py-3.5 text-white outline-none focus:border-rose-500 transition-all font-semibold appearance-none"
                                >
                                    <option value="Mestre">Mestre (Instructor)</option>
                                    <option value="Admin">Administrador (Control Total)</option>
                                </select>
                            </div>

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={formLoading}
                                    className="w-full bg-gradient-to-r from-red-600 to-rose-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-red-600/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {formLoading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            <Mail size={20} />
                                            <span>REGISTRAR Y ENVIAR EMAIL</span>
                                        </>
                                    )}
                                </button>
                                <p className="text-[10px] text-slate-500 font-bold text-center mt-4 uppercase tracking-[0.05em]">Al registrar se enviará una clave provisoria al correo indicado</p>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

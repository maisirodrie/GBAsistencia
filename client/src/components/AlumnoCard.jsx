import { useNavigate } from "react-router-dom";
import { Edit2, Trash2, Calendar, Award } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { deleteAlumnoRequest } from "../api/alumnos";

function AlumnoCard({ alumno, onDelete }) {
    const navigate = useNavigate();

    const fajaColors = {
        'Blanca': 'bg-white text-gray-800',
        'Azul': 'bg-blue-600 text-white',
        'Morada': 'bg-purple-700 text-white',
        'Marrón': 'bg-amber-900 text-white',
        'Negra': 'bg-black text-white border border-red-600'
    };

    const handleDelete = async () => {
        if (window.confirm("¿Seguro quieres eliminar este alumno?")) {
            await deleteAlumnoRequest(alumno._id);
            onDelete();
        }
    };

    return (
        <div className="bg-slate-800 rounded-xl p-5 shadow-xl border border-slate-700 hover:border-red-600/50 transition-all group">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-xl font-bold group-hover:text-red-500 transition-colors">
                        {alumno.nombre}
                    </h3>
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold mt-1 shadow-sm ${fajaColors[alumno.faja]}`}>
                        {alumno.faja.toUpperCase()} - GRADO {alumno.grado}
                    </span>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => navigate(`/editar/${alumno._id}`)}
                        className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-all shadow-sm"
                    >
                        <Edit2 size={18} />
                    </button>
                    <button
                        onClick={handleDelete}
                        className="p-2 hover:bg-red-900/30 rounded-lg text-slate-400 hover:text-red-500 transition-all shadow-sm"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>

            <div className="space-y-3 text-slate-300">
                <div className="flex items-center gap-2 text-sm bg-slate-900/50 p-2 rounded-lg">
                    <Calendar size={16} className="text-red-500" />
                    <span>Última graduación: <span className="text-white font-medium">
                        {(() => {
                            const date = new Date(alumno.ultimaGraduacion);
                            const localDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
                            return format(localDate, "dd/MM/yyyy");
                        })()}
                    </span></span>
                </div>
                <div className="flex items-center gap-2 text-sm bg-slate-900/50 p-2 rounded-lg relative overflow-hidden">
                    <Award size={16} className="text-red-500" />
                    <span>Asistencias totales: <span className="text-white font-medium">{alumno.asistencias.length}</span></span>
                    {alumno.asistencias.length >= 30 && (
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 bg-green-500/20 text-green-500 text-[10px] px-2 py-0.5 rounded-full font-black border border-green-500/50 animate-pulse">
                            LISTO
                        </span>
                    )}
                </div>
            </div>

            <button
                onClick={() => navigate(`/editar/${alumno._id}`)}
                className="w-full mt-5 bg-slate-900 hover:bg-red-600 py-2.5 rounded-lg text-sm font-semibold transition-all border border-slate-700 hover:border-red-600 shadow-md"
            >
                Ver Cartón / Tomar Asistencia
            </button>
        </div>
    );
}

export default AlumnoCard;

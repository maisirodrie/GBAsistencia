import { useParams, useNavigate } from "react-router-dom";
import QRCode from "react-qr-code";
import { useEffect, useState } from "react";
import { getAlumno } from "../api/alumnos";

export default function PublicQRPage() {
    const { id } = useParams();
    const [alumno, setAlumno] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        (async () => {
            try {
                const { data } = await getAlumno(id);
                setAlumno(data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    if (loading) return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
    );

    if (!alumno) return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
            <h1 className="text-2xl font-bold text-white mb-2">Código Incorrecto</h1>
            <p className="text-slate-400">No pudimos encontrar este perfil.</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0B1120] flex flex-col items-center justify-center p-6 sm:p-12">
            {/* Background */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-30">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600 rounded-full blur-[140px]"></div>
            </div>

            <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-[3rem] p-10 shadow-2xl relative z-10 text-center flex flex-col items-center">
                <div className="flex items-center gap-2 mb-8 select-none">
                    <span className="text-4xl font-black italic text-slate-100 tracking-tight">GB</span>
                    <div className="bg-blue-600 text-white w-8 h-8 flex items-center justify-center rounded-lg font-black text-xl italic">1</div>
                </div>

                <h1 className="text-xl font-black text-white mb-1 uppercase tracking-tight">{alumno.nombre} {alumno.apellido}</h1>
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-8">Pase Digital de Asistencia</p>

                <div className="bg-white p-6 rounded-[2.5rem] shadow-2xl border-4 border-slate-800 mb-8 transition-transform active:scale-[1.05] duration-500">
                    <QRCode
                        size={220}
                        style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                        value={id}
                        viewBox={`0 0 256 256`}
                    />
                </div>

                <div className="bg-slate-800/50 rounded-2xl p-4 w-full border border-slate-700/50 mb-8">
                    <p className="text-xs text-slate-400 font-bold leading-relaxed">
                        Presentá este código frente a la cámara al llegar al Dojo para registrar tu asistencia automáticamente.
                    </p>
                </div>

                <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">Gracie Barra Academy Manager</p>
            </div>
        </div>
    );
}

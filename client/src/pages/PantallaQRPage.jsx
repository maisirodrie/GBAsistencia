import { useState, useEffect } from "react";
import QRCode from "react-qr-code";
import { getQrToken } from "../api/alumnos";
import { Maximize, Minimize, ArrowLeft, RefreshCw, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function PantallaQRPage() {
    const navigate = useNavigate();
    const [token, setToken] = useState("");
    const [secondsLeft, setSecondsLeft] = useState(30);
    const [loading, setLoading] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Cargar nuevo token rotativo del servidor
    const fetchNewToken = async () => {
        try {
            const res = await getQrToken();
            if (res.data?.token) {
                setToken(res.data.token);
                setSecondsLeft(30);
            }
        } catch (err) {
            console.error("Error al obtener token de QR:", err);
        } finally {
            setLoading(false);
        }
    };

    // Al montar la pantalla, pedir el primer token
    useEffect(() => {
        fetchNewToken();
    }, []);

    // Temporizador de 30 segundos
    useEffect(() => {
        const interval = setInterval(() => {
            setSecondsLeft((prev) => {
                if (prev <= 1) {
                    fetchNewToken();
                    return 30;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    // Fullscreen toggle
    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
        } else {
            document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
        }
    };

    const qrUrl = token 
        ? `${window.location.origin}/asistencia?token=${token}` 
        : `${window.location.origin}/asistencia`;

    const progressPercent = ((30 - secondsLeft) / 30) * 100;

    return (
        <div className="min-h-screen bg-[#070b14] text-white flex flex-col items-center justify-between p-4 sm:p-8 relative overflow-hidden select-none">
            {/* Ambient Background Glows */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-30">
                <div className="absolute top-0 -left-40 w-[600px] h-[600px] bg-red-600 rounded-full blur-[180px]"></div>
                <div className="absolute bottom-0 -right-40 w-[600px] h-[600px] bg-blue-600 rounded-full blur-[180px]"></div>
            </div>

            {/* Top Toolbar */}
            <header className="w-full max-w-4xl flex items-center justify-between relative z-10 pt-2">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-slate-400 hover:text-white font-bold text-xs uppercase tracking-widest bg-slate-900/80 border border-slate-800 px-4 py-2.5 rounded-xl backdrop-blur-md transition-all"
                >
                    <ArrowLeft size={16} />
                    <span>Volver</span>
                </button>

                <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-1.5 rounded-full text-xs font-black tracking-wider uppercase">
                    <ShieldCheck size={16} />
                    <span>Código QR Dinámico Activo</span>
                </div>

                <button
                    onClick={toggleFullscreen}
                    className="flex items-center gap-2 text-slate-400 hover:text-white bg-slate-900/80 border border-slate-800 p-2.5 rounded-xl backdrop-blur-md transition-all"
                    title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
                >
                    {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
                </button>
            </header>

            {/* Central Display Card */}
            <main className="w-full max-w-xl my-auto py-4 flex flex-col items-center relative z-10">
                <div className="w-full bg-slate-900/90 backdrop-blur-2xl border border-slate-800 rounded-[3rem] p-8 sm:p-12 shadow-2xl flex flex-col items-center text-center relative overflow-hidden">
                    {/* Gracie Barra Header */}
                    <div className="flex flex-col items-center mb-6">
                        <img 
                            src="/gbnorte_v4.png" 
                            alt="Gracie Barra" 
                            className="h-24 sm:h-28 w-auto object-contain mb-2 drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]" 
                        />
                        <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white flex items-center gap-3">
                            Gracie Barra
                            <span className="text-red-500 font-extrabold text-base sm:text-lg tracking-widest px-2.5 py-1 rounded-xl bg-red-500/10 border border-red-500/30">
                                Check-in
                            </span>
                        </h1>
                        <p className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">
                            Escaneá este código para marcar tu presente
                        </p>
                    </div>

                    {/* QR Code Container */}
                    <div className="relative bg-white p-6 sm:p-8 rounded-[2.5rem] shadow-2xl border-4 border-slate-700/80 mb-6 flex items-center justify-center transition-all">
                        {loading ? (
                            <div className="w-64 h-64 flex flex-col items-center justify-center gap-3 text-slate-800">
                                <RefreshCw size={36} className="animate-spin text-red-600" />
                                <span className="text-xs font-black uppercase tracking-wider">Generando QR...</span>
                            </div>
                        ) : (
                            <QRCode
                                size={260}
                                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                value={qrUrl}
                                viewBox="0 0 256 256"
                            />
                        )}
                    </div>

                    {/* Rotating countdown bar */}
                    <div className="w-full max-w-sm flex flex-col items-center gap-2">
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-700/50">
                            <div 
                                className="bg-gradient-to-r from-red-600 to-amber-500 h-full transition-all duration-1000 ease-linear rounded-full"
                                style={{ width: `${progressPercent}%` }}
                            ></div>
                        </div>
                        <div className="flex items-center justify-between w-full text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
                            <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                                Actualización en vivo
                            </span>
                            <span className="text-amber-400 font-black">
                                {secondsLeft}s restantes
                            </span>
                        </div>
                    </div>

                    {/* Anti-tamper badge */}
                    <p className="mt-6 text-[10px] text-slate-500 font-bold uppercase tracking-widest max-w-xs">
                        Este código vence automáticamente para evitar el reenvío de enlaces. Escaneá directamente de esta pantalla.
                    </p>
                </div>
            </main>

            {/* Footer */}
            <footer className="w-full max-w-4xl flex items-center justify-between py-2 text-[10px] font-bold text-slate-600 uppercase tracking-widest relative z-10">
                <span>Gracie Barra Norte • Totem en Vivo</span>
                <span>Protección Anti-Reenvío Activa</span>
            </footer>
        </div>
    );
}

import { useEffect, useState, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { checkIn } from "../api/alumnos";
import { useNavigate } from "react-router-dom";
import { showAlert } from "../utils/alerts";

export default function CheckInPage() {
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const scannerRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const scanner = new Html5QrcodeScanner("reader", {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
        });

        scanner.render(onScanSuccess, onScanFailure);

        function onScanSuccess(decodedText) {
            if (loading) return; 
            handleCheckIn(decodedText);
            // No detenemos el scanner para permitir múltiples check-ins seguidos
        }

        function onScanFailure(err) {
            // Manejar errores de lectura (opcional, suele ser ruidoso)
        }

        return () => {
            scanner.clear().catch(e => console.error("Scanner cleanup error", e));
        };
    }, []);

    const handleCheckIn = async (id) => {
        setLoading(true);
        setError(null);
        setResult(null);
        try {
            const res = await checkIn(id);
            setResult(res.data);
            
            showAlert({
                title: res.data.message,
                text: res.data.mensajeGrad || "Asistencia registrada correctamente.",
                icon: "success"
            });
            
            // Limpiar mensaje después de 5 segundos para el siguiente
            setTimeout(() => setResult(null), 5000);
        } catch (err) {
            const msg = err.response?.data?.message || "Error al procesar el Check-in";
            setError(msg);
            
            showAlert({
                title: "Error de Check-in",
                text: msg,
                icon: "error"
            });
            
            setTimeout(() => setError(null), 5000);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0B1120] text-white flex flex-col items-center justify-center p-6 sm:p-12 animate-in fade-in duration-700">
            {/* Background Decorations */}
            <div className="fixed top-0 left-0 w-full h-full pointer-events-none opacity-20">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500 rounded-full blur-[120px] animate-pulse delay-700"></div>
            </div>

            <div className="w-full max-w-2xl bg-slate-900/60 backdrop-blur-2xl border border-slate-800 rounded-[3.5rem] p-8 sm:p-12 shadow-2xl relative z-10 flex flex-col items-center overflow-hidden group">
                {/* Header Decoration */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-red-600"></div>
                
                <header className="text-center mb-10 w-full">
                    <div className="flex justify-center mb-4">
                        <span className="bg-blue-500/10 text-blue-400 p-4 rounded-3xl border border-blue-500/20 shadow-inner text-3xl">📷</span>
                    </div>
                    <h1 className="text-4xl font-black tracking-tight mb-2">Check-in Academy</h1>
                    <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-xs">Gracie Barra Estructura Digital</p>
                </header>

                {/* Scanner Container */}
                <div className="w-full max-w-[350px] aspect-square rounded-[3rem] overflow-hidden border-8 border-slate-800 shadow-2xl bg-black relative mb-12">
                    <div id="reader" className="w-full h-full scale-110"></div>
                    {/* Visual Frame */}
                    <div className="absolute inset-0 border-[2px] border-blue-500/30 pointer-events-none rounded-[3rem] animate-pulse"></div>
                    <div className="absolute top-1/2 left-0 w-full h-0.5 bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.8)] animate-scan"></div>
                </div>

                {/* Feedback Area */}
                <div className="w-full min-h-[120px] flex flex-col items-center justify-center text-center">
                    {loading && (
                        <div className="flex flex-col items-center gap-3 animate-pulse">
                            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-blue-400 font-black uppercase tracking-widest text-sm">Procesando...</p>
                        </div>
                    )}

                    {!loading && result && (
                        <div className="bg-green-500/10 border border-green-500/30 rounded-3xl p-6 sm:px-10 animate-in zoom-in duration-300 w-full">
                            <h2 className="text-2xl font-black text-green-400 mb-2">{result.message}</h2>
                            {result.mensajeGrad && (
                                <p className="text-yellow-400 font-bold text-sm bg-yellow-400/10 border border-yellow-400/20 py-2 px-4 rounded-xl mt-3 inline-block animate-bounce">
                                    🌟 {result.mensajeGrad}
                                </p>
                            )}
                        </div>
                    )}

                    {!loading && error && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-3xl p-6 sm:px-10 animate-in shake duration-500 w-full">
                            <p className="text-red-400 font-black text-lg">{error}</p>
                        </div>
                    )}

                    {!loading && !result && !error && (
                        <p className="text-slate-400 font-bold text-lg animate-pulse">
                            Alineá tu código QR en el centro para registrar asistencia
                        </p>
                    )}
                </div>

                <button 
                    onClick={() => navigate("/")}
                    className="mt-12 text-slate-500 hover:text-white font-bold text-sm transition-all hover:tracking-widest"
                >
                    &larr; VOLVER AL INICIO
                </button>
            </div>

            <style>{`
                #reader button {
                    background: #1e293b !important;
                    color: white !important;
                    border: 1px solid #334155 !important;
                    padding: 8px 16px !important;
                    border-radius: 12px !important;
                    font-weight: 900 !important;
                    text-transform: uppercase !important;
                    font-size: 10px !important;
                    margin-top: 20px !important;
                    transition: all 0.2s !important;
                }
                #reader button:hover {
                    background: #334155 !important;
                }
                #reader__scan_region video {
                    object-fit: cover !important;
                    border-radius: 40px !important;
                }
                #reader__dashboard_section_csr span {
                    display: none !important;
                }
                @keyframes scan {
                    0% { top: 0; }
                    100% { top: 100%; }
                }
                .animate-scan {
                    animation: scan 2s linear infinite;
                    position: absolute;
                }
            `}</style>
        </div>
    );
}

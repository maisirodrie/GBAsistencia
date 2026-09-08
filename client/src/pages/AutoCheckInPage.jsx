import { useState, useEffect, useRef } from "react";
import { checkInByDni } from "../api/alumnos";
import { UPLOAD_URL } from "../api/axios";

export default function AutoCheckInPage() {
    const [dni, setDni] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [countdown, setCountdown] = useState(0);
    const inputRef = useRef(null);

    // Auto-focus en el campo DNI al cargar o al resetear
    useEffect(() => {
        if (!result) {
            inputRef.current?.focus();
        }
    }, [result]);

    // Cuenta regresiva para volver a dejar la pantalla lista para el siguiente alumno
    useEffect(() => {
        if (!result) return;
        setCountdown(6);
        const interval = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    handleReset();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [result]);

    const handleReset = () => {
        setResult(null);
        setError(null);
        setDni("");
        setTimeout(() => inputRef.current?.focus(), 100);
    };

    const handleSubmit = async (e) => {
        e?.preventDefault();
        const clean = dni.replace(/\D/g, "");
        if (!clean) {
            setError("Por favor, ingresá tu número de DNI.");
            return;
        }

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const res = await checkInByDni(clean);
            setResult(res.data);
        } catch (err) {
            const msg = err.response?.data?.message || "No se pudo registrar la asistencia. Reintentá.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#070b14] text-white flex flex-col items-center justify-between p-4 sm:p-8 relative overflow-x-hidden select-none">
            {/* Ambient Background Glows */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-25">
                <div className="absolute -top-32 -left-32 w-96 h-96 bg-red-600 rounded-full blur-[140px]"></div>
                <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-600 rounded-full blur-[140px]"></div>
            </div>

            {/* Top Bar / Brand */}
            <header className="w-full max-w-md flex flex-col items-center justify-center pt-2 sm:pt-4 relative z-10">
                <img 
                    src="/gbnorte_v4.png" 
                    alt="Gracie Barra Logo" 
                    className="h-20 sm:h-24 w-auto object-contain drop-shadow-[0_10px_25px_rgba(0,0,0,0.5)] mb-2" 
                />
                <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white flex items-center gap-2">
                    Gracie Barra
                    <span className="text-red-500 font-extrabold text-sm sm:text-base tracking-widest px-2 py-0.5 rounded-lg bg-red-500/10 border border-red-500/20">
                        Check-in
                    </span>
                </h1>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1 text-center">
                    Registro de Asistencia del Alumno
                </p>
            </header>

            {/* Main Interactive Card */}
            <main className="w-full max-w-md my-auto py-6 relative z-10">
                {!result ? (
                    <div className="bg-slate-900/80 backdrop-blur-2xl border border-slate-800 rounded-[2.5rem] p-6 sm:p-8 shadow-2xl flex flex-col items-center relative overflow-hidden">
                        {/* Status bar header */}
                        <div className="w-full text-center mb-6">
                            <div className="inline-flex items-center gap-2 bg-slate-800/80 border border-slate-700/60 rounded-full px-4 py-1.5 text-xs font-bold text-slate-300 mb-3 shadow-inner">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                                Dojo Activo • Hoy
                            </div>
                            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                                ¡Bienvenido!
                            </h2>
                            <p className="text-xs text-slate-400 font-semibold mt-1">
                                Ingresá tu número de DNI para confirmar tu presente
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
                            <div className="relative w-full">
                                <input
                                    ref={inputRef}
                                    type="tel"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    maxLength={10}
                                    value={dni}
                                    onChange={(e) => {
                                        setError(null);
                                        setDni(e.target.value.replace(/\D/g, ""));
                                    }}
                                    placeholder="Ej: 38123456"
                                    disabled={loading}
                                    className="w-full bg-slate-950/80 border-2 border-slate-700/80 focus:border-red-500 rounded-3xl py-4 sm:py-5 px-4 text-center text-3xl sm:text-4xl font-black tracking-widest text-white placeholder-slate-600 outline-none transition-all shadow-inner focus:ring-4 focus:ring-red-500/20"
                                    autoFocus
                                />
                                {dni && (
                                    <button
                                        type="button"
                                        onClick={() => setDni("")}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-slate-800 hover:bg-slate-700 text-slate-400 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="bg-red-500/15 border border-red-500/40 rounded-2xl p-4 text-center text-red-400 text-xs font-bold animate-shake">
                                    ⚠️ {error}
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading || !dni}
                                className={`w-full py-4 sm:py-5 rounded-2xl font-black text-base uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-2 ${
                                    !dni || loading
                                        ? "bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed"
                                        : "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white shadow-red-900/30 active:scale-[0.98] border-b-4 border-red-900 active:border-b-0"
                                }`}
                            >
                                {loading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        <span>Buscando...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>🥋</span>
                                        <span>Confirmar Presente</span>
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-6 text-center text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                            ¿Primera vez o no figura tu DNI? Avisale al profesor en recepción.
                        </div>
                    </div>
                ) : (
                    /* Check-in Success / Already Checked Card */
                    <div className="bg-slate-900/90 backdrop-blur-2xl border border-slate-800 rounded-[2.5rem] p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center relative overflow-hidden animate-in zoom-in-95 duration-300">
                        {/* Top banner */}
                        <div className={`w-full py-2.5 px-4 rounded-2xl mb-6 flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest ${
                            result.alreadyCheckedIn 
                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40" 
                                : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        }`}>
                            <span>{result.alreadyCheckedIn ? "⚠️" : "✅"}</span>
                            <span>{result.alreadyCheckedIn ? "Asistencia ya tomada hoy" : "¡Asistencia Confirmada!"}</span>
                        </div>

                        {/* Student Avatar / Photo */}
                        <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-3xl overflow-hidden border-4 border-slate-700 shadow-2xl bg-slate-800 mb-4 flex items-center justify-center flex-shrink-0">
                            {result.alumno?.fotoUrl ? (
                                <img 
                                    src={result.alumno.fotoUrl.startsWith("http") ? result.alumno.fotoUrl : `${UPLOAD_URL}/${result.alumno.fotoUrl}`} 
                                    alt="Foto" 
                                    className="w-full h-full object-cover" 
                                />
                            ) : (
                                <span className="text-5xl">🥋</span>
                            )}
                        </div>

                        {/* Student Name */}
                        <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
                            {result.alumno?.nombre} {result.alumno?.apellido}
                        </h2>

                        {/* Student Belt and Degree */}
                        <div className="mt-2 inline-flex items-center gap-2 bg-slate-950/70 border border-slate-800 px-4 py-2 rounded-xl text-xs font-bold text-slate-300 shadow-inner">
                            <span>Cinturón:</span>
                            <span className="text-red-400 font-black">{result.alumno?.faja}</span>
                            <span>•</span>
                            <span className="text-yellow-400 font-black">
                                {result.alumno?.grado === 0 ? "Sin Grados" : `${result.alumno?.grado}º Grado`}
                            </span>
                        </div>

                        <p className="text-sm font-bold text-slate-300 mt-5 leading-relaxed">
                            {result.message}
                        </p>

                        <div className="w-full border-t border-slate-800/80 mt-6 pt-5 flex flex-col items-center gap-3">
                            <button
                                onClick={handleReset}
                                className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md active:scale-95"
                            >
                                Listo / Siguiente Alumno ({countdown}s)
                            </button>
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                                Esta pantalla se reiniciará automáticamente
                            </span>
                        </div>
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="w-full text-center py-2 text-[10px] font-bold text-slate-600 uppercase tracking-widest relative z-10">
                Gracie Barra Norte • Estructura Digital
            </footer>
        </div>
    );
}

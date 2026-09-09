import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { checkInByDni, verifyKioskPin } from "../api/alumnos";
import { UPLOAD_URL } from "../api/axios";
import { getDeviceFingerprint } from "../utils/fingerprint";


// Generar o recuperar ID único persistente del dispositivo
function getOrCreateDeviceId() {
    let id = localStorage.getItem("gb_device_id");
    if (!id) {
        id = "dev_" + Date.now().toString(36) + "_" + Math.random().toString(36).substring(2, 10);
        localStorage.setItem("gb_device_id", id);
    }
    return id;
}

// Fecha actual en huso horario de Argentina (UTC-3) formato YYYY-MM-DD
function getTodayStr() {
    const d = new Date(Date.now() - 3 * 60 * 60 * 1000);
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

export default function AutoCheckInPage() {
    const [searchParams] = useSearchParams();
    const qrToken = searchParams.get("token"); // Si viene escaneado de pantalla en vivo

    const [dni, setDni] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isFraudBlocked, setIsFraudBlocked] = useState(false);
    const [isOutOfRange, setIsOutOfRange] = useState(false);
    const [isQrExpired, setIsQrExpired] = useState(false);
    const [countdown, setCountdown] = useState(0);

    // Geolocalización GPS (para el cartel impreso)
    const [coords, setCoords] = useState(null);
    const [gpsStatus, setGpsStatus] = useState("idle"); // idle, locating, success, denied

    // Modo Recepción / Kiosco (para tablets compartidas en recepción del Dojo)
    const [isKiosk, setIsKiosk] = useState(() => sessionStorage.getItem("gb_kiosk_mode") === "true");
    const [kioskPin, setKioskPin] = useState(() => sessionStorage.getItem("gb_kiosk_pin") || "");
    const [showPinModal, setShowPinModal] = useState(false);
    const [pinInput, setPinInput] = useState("");
    const [pinError, setPinError] = useState("");

    // Solicitar GPS automáticamente si no viene de pantalla en vivo y no es Kiosco
    useEffect(() => {
        if (!qrToken && !isKiosk && "geolocation" in navigator) {
            setGpsStatus("locating");
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setCoords({
                        lat: pos.coords.latitude,
                        lng: pos.coords.longitude
                    });
                    setGpsStatus("success");
                },
                (err) => {
                    console.warn("Geolocation warning:", err.message);
                    setGpsStatus("denied");
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
            );
        }
    }, [qrToken, isKiosk]);

    // Cargar si este dispositivo ya tiene asistencia registrada para hoy
    const [result, setResult] = useState(() => {
        const today = getTodayStr();
        const stored = localStorage.getItem("gb_checkin_today");
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                if (parsed.fecha === today && parsed.alumno) {
                    return parsed;
                } else {
                    localStorage.removeItem("gb_checkin_today");
                }
            } catch {
                localStorage.removeItem("gb_checkin_today");
            }
        }
        return null;
    });

    const inputRef = useRef(null);
    const pinInputRef = useRef(null);

    // Auto-focus en el campo DNI al estar listo
    useEffect(() => {
        if (!result && !showPinModal) {
            inputRef.current?.focus();
        }
    }, [result, showPinModal]);

    // Focus en PIN modal
    useEffect(() => {
        if (showPinModal) {
            setTimeout(() => pinInputRef.current?.focus(), 100);
        }
    }, [showPinModal]);

    // Cuenta regresiva SOLO si está en MODO KIOSCO (en celular personal el pase queda fijo)
    useEffect(() => {
        if (!result || !isKiosk) return;

        setCountdown(6);
        const interval = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    handleKioskReset();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [result, isKiosk]);

    const handleKioskReset = () => {
        setResult(null);
        setError(null);
        setIsFraudBlocked(false);
        setIsOutOfRange(false);
        setIsQrExpired(false);
        setDni("");
        setTimeout(() => inputRef.current?.focus(), 100);
    };

    const handleSubmit = async (e) => {
        e?.preventDefault();
        const clean = dni.replace(/\D/g, "");
        if (!clean) {
            setError("Por favor, ingresá tu número de DNI.");
            setIsFraudBlocked(false);
            setIsOutOfRange(false);
            setIsQrExpired(false);
            return;
        }

        setLoading(true);
        setError(null);
        setIsFraudBlocked(false);
        setIsOutOfRange(false);
        setIsQrExpired(false);

        const deviceId = getOrCreateDeviceId();
        const deviceFingerprint = await getDeviceFingerprint();
        const todayStr = getTodayStr();

        // Si no tenemos coords y se necesita GPS, intentar obtener una rápida
        let activeCoords = coords;
        if (!activeCoords && !qrToken && !isKiosk && "geolocation" in navigator) {
            try {
                activeCoords = await new Promise((resolve) => {
                    navigator.geolocation.getCurrentPosition(
                        (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
                        () => resolve(null),
                        { enableHighAccuracy: true, timeout: 5000 }
                    );
                });
                if (activeCoords) {
                    setCoords(activeCoords);
                    setGpsStatus("success");
                }
            } catch {}
        }

        try {
            const res = await checkInByDni(clean, deviceId, deviceFingerprint, isKiosk, kioskPin, activeCoords, qrToken);
            const dataWithDate = {
                ...res.data,
                fecha: res.data.fecha || todayStr
            };
            setResult(dataWithDate);

            // Si es dispositivo personal, guardar para mostrar su pase durante todo el día
            if (!isKiosk) {
                localStorage.setItem("gb_checkin_today", JSON.stringify(dataWithDate));
            }
        } catch (err) {
            const status = err.response?.status;
            const data = err.response?.data;
            const msg = data?.message || "No se pudo registrar la asistencia. Reintentá.";

            setIsFraudBlocked(Boolean(status === 403 && data?.isDeviceLocked));
            setIsOutOfRange(Boolean(status === 403 && data?.isOutOfRange));
            setIsQrExpired(Boolean(status === 400 && data?.isQrExpired));
            setError(msg);
        } finally {
            setLoading(false);
        }
    };


    // Activar o desactivar modo kiosco mediante PIN
    const handleVerifyPin = async (e) => {
        e?.preventDefault();
        setPinError("");
        if (!pinInput.trim()) {
            setPinError("Ingresá el PIN de profesor.");
            return;
        }

        try {
            await verifyKioskPin(pinInput.trim());
            const newKioskState = !isKiosk;
            setIsKiosk(newKioskState);
            if (newKioskState) {
                setKioskPin(pinInput.trim());
                sessionStorage.setItem("gb_kiosk_mode", "true");
                sessionStorage.setItem("gb_kiosk_pin", pinInput.trim());
            } else {
                setKioskPin("");
                sessionStorage.removeItem("gb_kiosk_mode");
                sessionStorage.removeItem("gb_kiosk_pin");
            }
            setShowPinModal(false);
            setPinInput("");
            // Si desbloqueamos, limpiamos bloqueos de pantalla
            setIsFraudBlocked(false);
            setIsOutOfRange(false);
            setError(null);
        } catch (err) {
            setPinError(err.response?.data?.message || "PIN incorrecto. Solicitá el PIN al profesor.");
        }
    };


    const handleClearDeviceLock = () => {
        localStorage.removeItem("gb_checkin_today");
        setResult(null);
        setError(null);
        setIsFraudBlocked(false);
        setDni("");
    };

    return (
        <div className="min-h-screen bg-[#070b14] text-white flex flex-col items-center justify-between p-4 sm:p-8 relative overflow-x-hidden select-none">
            {/* Ambient Background Glows */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-25">
                <div className="absolute -top-32 -left-32 w-96 h-96 bg-red-600 rounded-full blur-[140px]"></div>
                <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-600 rounded-full blur-[140px]"></div>
            </div>

            {/* Top Bar / Header */}
            <header className="w-full max-w-md flex flex-col items-center justify-center pt-2 sm:pt-4 relative z-10">
                {/* Banner de Modo Recepción si está activo */}
                {isKiosk && (
                    <div className="w-full mb-3 bg-amber-500/15 border border-amber-500/40 text-amber-300 rounded-2xl px-4 py-2 flex items-center justify-between text-xs font-bold shadow-lg animate-pulse">
                        <div className="flex items-center gap-2">
                            <span>🏢</span>
                            <span>Modo Recepción Activo (Múltiples Alumnos)</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                setIsKiosk(false);
                                setKioskPin("");
                                sessionStorage.removeItem("gb_kiosk_mode");
                                sessionStorage.removeItem("gb_kiosk_pin");
                            }}
                            className="bg-amber-500/30 hover:bg-amber-500/40 text-amber-200 px-2.5 py-1 rounded-lg text-[10px] uppercase font-black tracking-wider transition-all"
                        >
                            Salir
                        </button>
                    </div>
                )}

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
                                {qrToken ? (
                                    <>
                                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                        <span>⏱️ Pantalla en Vivo (Token Activo)</span>
                                    </>
                                ) : gpsStatus === "success" ? (
                                    <>
                                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                                        <span>📍 Ubicación Dojo Verificada</span>
                                    </>
                                ) : gpsStatus === "locating" ? (
                                    <>
                                        <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping"></span>
                                        <span>📡 Verificando ubicación...</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="w-2 h-2 rounded-full bg-red-400"></span>
                                        <span>🥋 Registro Presencial</span>
                                    </>
                                )}
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
                                        setIsFraudBlocked(false);
                                        setIsOutOfRange(false);
                                        setIsQrExpired(false);
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

                            {/* Alerta de Error: Antifraude, GPS Fuera de Radio, QR Caducado o Error General */}
                            {error && (
                                <div className={`rounded-2xl p-4 text-center text-xs font-bold flex flex-col gap-2 ${
                                    isFraudBlocked || isOutOfRange || isQrExpired
                                        ? "bg-amber-500/15 border-2 border-amber-500/40 text-amber-300"
                                        : "bg-red-500/15 border border-red-500/40 text-red-400"
                                }`}>
                                    <div className="flex items-center justify-center gap-2 text-sm font-black">
                                        <span>
                                            {isOutOfRange ? "📍" : isQrExpired ? "⏱️" : isFraudBlocked ? "🛑" : "⚠️"}
                                        </span>
                                        <span>
                                            {isOutOfRange 
                                                ? "Fuera del Radio de la Academia" 
                                                : isQrExpired 
                                                ? "Código QR Caducado" 
                                                : isFraudBlocked 
                                                ? "Dispositivo ya registrado hoy" 
                                                : "Atención"}
                                        </span>
                                    </div>
                                    <p className="leading-relaxed">{error}</p>
                                    
                                    {(isFraudBlocked || isOutOfRange) && (
                                        <div className="mt-2 pt-2 border-t border-amber-500/20 text-[11px] text-amber-200/80 flex flex-col gap-2">
                                            <span>¿Estás en el dojo o necesitás asistencia del profesor?</span>
                                            <button
                                                type="button"
                                                onClick={() => setShowPinModal(true)}
                                                className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 py-2 px-3 rounded-xl font-black uppercase tracking-wider text-[10px] transition-all"
                                            >
                                                Desbloquear con PIN de Profesor
                                            </button>
                                        </div>
                                    )}
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
                                        <span>Verificando...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>🥋</span>
                                        <span>Confirmar Presente</span>
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-6 text-center text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center justify-center gap-2">
                            <span>Dispositivo Único por Alumno</span>
                            <span>•</span>
                            <button 
                                type="button"
                                onClick={() => setShowPinModal(true)}
                                className="text-slate-500 hover:text-slate-300 underline underline-offset-2 transition-colors"
                            >
                                {isKiosk ? "Desactivar Kiosco" : "Modo Recepción"}
                            </button>
                        </div>
                    </div>
                ) : (
                    /* Check-in Success Card */
                    <div className="bg-slate-900/90 backdrop-blur-2xl border border-slate-800 rounded-[2.5rem] p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center relative overflow-hidden animate-in zoom-in-95 duration-300">
                        {/* Top banner */}
                        <div className={`w-full py-2.5 px-4 rounded-2xl mb-6 flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest ${
                            result.alreadyCheckedIn 
                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40" 
                                : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        }`}>
                            <span>{result.alreadyCheckedIn ? "📋" : "✅"}</span>
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

                        {/* Bottom Actions based on Kiosk Mode vs Personal Phone */}
                        <div className="w-full border-t border-slate-800/80 mt-6 pt-5 flex flex-col items-center gap-3">
                            {isKiosk ? (
                                <>
                                    <button
                                        onClick={handleKioskReset}
                                        className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md active:scale-95"
                                    >
                                        Listo / Siguiente Alumno ({countdown}s)
                                    </button>
                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                                        Modo Kiosco • Reinicio automático
                                    </span>
                                </>
                            ) : (
                                <div className="w-full flex flex-col items-center gap-2">
                                    <div className="w-full py-2.5 px-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-bold flex items-center justify-center gap-2">
                                        <span>🔒</span>
                                        <span>Pase del día activo en este dispositivo</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-1">
                                        Tu presente ya está computado. ¡Excelente entrenamiento! Oss.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={handleClearDeviceLock}
                                        className="mt-3 text-[11px] text-slate-500 hover:text-slate-300 underline underline-offset-4 transition-colors"
                                    >
                                        ¿No sos vos o querés cambiar de DNI?
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>

            {/* Modal PIN Modo Recepción */}
            {showPinModal && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-black text-white flex items-center gap-2">
                                <span>🔐</span>
                                <span>Modo Recepción</span>
                            </h3>
                            <button 
                                onClick={() => {
                                    setShowPinModal(false);
                                    setPinInput("");
                                    setPinError("");
                                }}
                                className="text-slate-400 hover:text-white text-sm font-bold w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center"
                            >
                                ✕
                            </button>
                        </div>

                        <p className="text-xs text-slate-400 leading-relaxed mb-4">
                            {isKiosk 
                                ? "Ingresá el PIN de profesor para desactivar el modo recepción y volver al modo de dispositivo único por alumno."
                                : "Habilitá este dispositivo para permitir que varios alumnos registren su presente de forma continua (ej. tablet de recepción)."
                            }
                        </p>

                        <form onSubmit={handleVerifyPin} className="flex flex-col gap-3">
                            <input
                                ref={pinInputRef}
                                type="password"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength={6}
                                value={pinInput}
                                onChange={(e) => {
                                    setPinError("");
                                    setPinInput(e.target.value);
                                }}
                                placeholder="PIN de Profesor"
                                className="w-full bg-slate-950 border-2 border-slate-700 focus:border-red-500 rounded-2xl py-3 px-4 text-center text-2xl font-black tracking-widest text-white outline-none"
                            />

                            {pinError && (
                                <div className="text-red-400 text-xs font-bold text-center">
                                    ⚠️ {pinError}
                                </div>
                            )}

                            <div className="flex gap-2 mt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowPinModal(false);
                                        setPinInput("");
                                        setPinError("");
                                    }}
                                    className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs uppercase tracking-wider transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-red-900/30"
                                >
                                    {isKiosk ? "Desactivar" : "Activar"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Footer */}
            <footer className="w-full flex items-center justify-between max-w-md py-2 text-[10px] font-bold text-slate-600 uppercase tracking-widest relative z-10">
                <span>Gracie Barra Norte</span>
                <div className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span>1 Dispositivo por Alumno</span>
                </div>
            </footer>
        </div>
    );
}


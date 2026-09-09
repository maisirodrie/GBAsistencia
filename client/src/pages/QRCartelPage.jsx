import QRCode from "react-qr-code";
import { Printer, Copy, ArrowLeft, MapPin, Tv, Loader2, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { showToast } from "../utils/alerts";
import { printCartelQR } from "../utils/printCartel";
import { getDojoLocation, setDojoLocation } from "../api/alumnos";

export default function QRCartelPage() {
    const navigate = useNavigate();
    const checkInUrl = `${window.location.origin}/asistencia`;
    const [dojoConfig, setDojoConfig] = useState(null);
    const [calibrating, setCalibrating] = useState(false);

    useEffect(() => {
        getDojoLocation()
            .then((res) => setDojoConfig(res.data))
            .catch(() => {});
    }, []);

    const handlePrint = () => {
        printCartelQR("cartel-dojo");
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(checkInUrl);
        showToast("Enlace de check-in copiado al portapapeles", "success");
    };

    const handleCalibrateLocation = () => {
        if (!("geolocation" in navigator)) {
            showToast("Tu navegador no soporta geolocalización.", "error");
            return;
        }

        setCalibrating(true);
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                try {
                    const lat = pos.coords.latitude;
                    const lng = pos.coords.longitude;
                    const res = await setDojoLocation({
                        lat,
                        lng,
                        radius: 200,
                        gpsObligatorio: true
                    });
                    setDojoConfig(res.data.config);
                    showToast("¡Ubicación del Dojo calibrada con éxito en este punto! (Radio: 200m)", "success");
                } catch (err) {
                    showToast(err.response?.data?.message || "No se pudo guardar la ubicación.", "error");
                } finally {
                    setCalibrating(false);
                }
            },
            (err) => {
                setCalibrating(false);
                showToast(`No se pudo obtener el GPS: ${err.message}. Asegurate de activar la ubicación.`, "error");
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 sm:p-8">
            {/* Top Toolbar (Hidden on print) */}
            <div className="w-full max-w-lg flex flex-col gap-3 mb-6 print:hidden">
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-slate-400 hover:text-white font-bold text-xs uppercase tracking-widest bg-slate-900 border border-slate-800 px-4 py-2.5 rounded-xl transition-all"
                    >
                        <ArrowLeft size={16} />
                        <span>Volver</span>
                    </button>
                    <div className="flex gap-2">
                        <button
                            onClick={() => navigate("/pantalla-qr")}
                            className="flex items-center gap-2 text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all"
                            title="Abrir vista para TV o Tablet con QR rotativo"
                        >
                            <Tv size={16} />
                            <span>Pantalla en Vivo</span>
                        </button>
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 text-white bg-red-600 hover:bg-red-500 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-red-900/30 active:scale-95"
                        >
                            <Printer size={16} />
                            <span>Imprimir</span>
                        </button>
                    </div>
                </div>

                {/* Dojo GPS Geofencing Status Bar */}
                <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-slate-300">
                        <MapPin size={16} className={dojoConfig?.dojoLat ? "text-emerald-400" : "text-amber-400"} />
                        {dojoConfig?.dojoLat ? (
                            <span className="text-[11px] font-bold">
                                GPS Dojo: <span className="text-emerald-400">Activo</span> ({dojoConfig.dojoRadioMetros}m de radio)
                            </span>
                        ) : (
                            <span className="text-[11px] font-bold text-amber-300">
                                Sin calibrar (Tocá para fijar aquí)
                            </span>
                        )}
                    </div>

                    <button
                        onClick={handleCalibrateLocation}
                        disabled={calibrating}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all"
                    >
                        {calibrating ? (
                            <>
                                <Loader2 size={12} className="animate-spin text-red-500" />
                                <span>Obteniendo GPS...</span>
                            </>
                        ) : (
                            <>
                                <CheckCircle2 size={12} className="text-emerald-400" />
                                <span>Calibrar Aquí</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Poster for Dojo */}
            <div 
                id="cartel-dojo"
                className="w-full max-w-lg bg-white text-slate-900 rounded-[2.5rem] p-8 sm:p-12 shadow-2xl border-4 border-red-600 flex flex-col items-center text-center relative overflow-hidden"
            >
                {/* Header */}
                <div className="flex flex-col items-center mb-6">
                    <img 
                        src="/gbnorte_v4.png" 
                        alt="Gracie Barra" 
                        className="h-24 sm:h-28 w-auto object-contain mb-2" 
                    />
                    <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-red-600">
                        GRACIE BARRA
                    </h1>
                    <p className="text-xs sm:text-sm font-black tracking-[0.25em] text-slate-700 uppercase mt-1">
                        REGISTRO DE ASISTENCIA
                    </p>
                </div>

                {/* QR Code */}
                <div className="bg-slate-50 p-6 rounded-[2rem] border-2 border-slate-200 shadow-inner mb-8 flex items-center justify-center">
                    <QRCode
                        size={240}
                        style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                        value={checkInUrl}
                        viewBox="0 0 256 256"
                    />
                </div>

                {/* Steps */}
                <div className="w-full bg-red-50 border-2 border-red-200 rounded-2xl p-5 mb-6 text-left">
                    <h2 className="text-xs sm:text-sm font-black uppercase tracking-widest text-red-700 mb-3 text-center">
                        ¿Cómo marcar tu presente?
                    </h2>
                    <ol className="space-y-2.5 text-xs sm:text-sm font-bold text-slate-800">
                        <li className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center text-xs font-black flex-shrink-0">1</span>
                            <span>Escaneá este código QR con tu celular.</span>
                        </li>
                        <li className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center text-xs font-black flex-shrink-0">2</span>
                            <span>Ingresá tu número de DNI.</span>
                        </li>
                        <li className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center text-xs font-black flex-shrink-0">3</span>
                            <span>¡Listo! Tu asistencia queda registrada al instante 🥋</span>
                        </li>
                    </ol>
                </div>

                <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                    Sistema Oficial de Control de Asistencia • GB Norte
                </p>
            </div>

            <style>{`
                @media print {
                    body {
                        background: white !important;
                        padding: 0 !important;
                        margin: 0 !important;
                    }
                    .print\\:hidden {
                        display: none !important;
                    }
                    #cartel-dojo {
                        box-shadow: none !important;
                        border: 6px solid #dc2626 !important;
                        max-width: 100% !important;
                        width: 90% !important;
                        margin: 40px auto !important;
                        padding: 40px !important;
                    }
                }
            `}</style>
        </div>
    );
}

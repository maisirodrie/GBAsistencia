import QRCode from "react-qr-code";
import { Printer, Copy, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { showToast } from "../utils/alerts";

export default function QRCartelPage() {
    const navigate = useNavigate();
    const checkInUrl = `${window.location.origin}/asistencia`;

    const handlePrint = () => {
        window.print();
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(checkInUrl);
        showToast("Enlace de check-in copiado al portapapeles", "success");
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 sm:p-8">
            {/* Top Toolbar (Hidden on print) */}
            <div className="w-full max-w-lg flex items-center justify-between mb-6 print:hidden">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-slate-400 hover:text-white font-bold text-xs uppercase tracking-widest bg-slate-900 border border-slate-800 px-4 py-2.5 rounded-xl transition-all"
                >
                    <ArrowLeft size={16} />
                    <span>Volver</span>
                </button>
                <div className="flex gap-2">
                    <button
                        onClick={handleCopy}
                        className="flex items-center gap-2 text-slate-300 hover:text-white bg-slate-900 border border-slate-800 px-4 py-2.5 rounded-xl text-xs font-bold transition-all"
                    >
                        <Copy size={16} />
                        <span>Copiar URL</span>
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

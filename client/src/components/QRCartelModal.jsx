import { useRef, useEffect } from "react";
import QRCode from "react-qr-code";
import { Printer, Copy, X, ExternalLink, QrCode } from "lucide-react";
import { showToast } from "../utils/alerts";

export default function QRCartelModal({ isOpen, onClose }) {
    const printRef = useRef(null);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape") {
                onClose();
            }
        };
        if (isOpen) {
            window.addEventListener("keydown", handleKeyDown);
        }
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const checkInUrl = `${window.location.origin}/asistencia`;

    const handlePrint = () => {
        window.print();
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(checkInUrl);
        showToast("Enlace de check-in copiado al portapapeles", "success");
    };

    return (
        <div 
            className="fixed inset-0 z-[9999] overflow-y-auto bg-black/85 backdrop-blur-md p-3 sm:p-6 flex items-center justify-center animate-in fade-in duration-200"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            {/* Modal Container */}
            <div className="bg-slate-900 border border-slate-700/80 rounded-3xl sm:rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden relative flex flex-col max-h-[92vh] my-auto">
                {/* Modal Header */}
                <div className="p-4 sm:p-6 border-b border-slate-800 flex items-center justify-between flex-shrink-0 bg-slate-900 z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-red-600/10 border border-red-600/20 text-red-500 rounded-2xl">
                            <QrCode size={22} />
                        </div>
                        <div>
                            <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-tight">Cartel QR de la Academia</h2>
                            <p className="text-xs text-slate-400 font-medium">Imprimí y pegá este cartel en la recepción</p>
                        </div>
                    </div>
                    <button 
                        type="button"
                        onClick={onClose}
                        className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-all border border-slate-700"
                        title="Cerrar (Esc)"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Scrollable Printable Poster Area */}
                <div className="p-4 sm:p-6 flex flex-col items-center bg-slate-950/50 overflow-y-auto flex-1">
                    <div 
                        ref={printRef} 
                        id="printable-cartel"
                        className="w-full bg-white text-slate-900 rounded-[2rem] p-6 sm:p-8 shadow-xl border-4 border-red-600 flex flex-col items-center text-center relative overflow-hidden"
                    >
                        {/* Header Poster */}
                        <div className="flex flex-col items-center mb-4">
                            <img 
                                src="/gbnorte_v4.png" 
                                alt="Gracie Barra" 
                                className="h-16 sm:h-20 w-auto object-contain mb-1.5" 
                            />
                            <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-red-600">
                                GRACIE BARRA
                            </h3>
                            <p className="text-[11px] sm:text-xs font-black tracking-[0.25em] text-slate-700 uppercase mt-0.5">
                                REGISTRO DE ASISTENCIA
                            </p>
                        </div>

                        {/* QR Code Container */}
                        <div className="bg-slate-50 p-4 sm:p-5 rounded-[1.75rem] border-2 border-slate-200 shadow-inner mb-4 flex items-center justify-center">
                            <QRCode
                                size={190}
                                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                value={checkInUrl}
                                viewBox="0 0 256 256"
                            />
                        </div>

                        {/* Steps instructions */}
                        <div className="w-full bg-red-50 border border-red-200 rounded-2xl p-3.5 sm:p-4 mb-3 text-left">
                            <h4 className="text-[11px] sm:text-xs font-black uppercase tracking-widest text-red-700 mb-2 text-center">
                                ¿Cómo marcar tu presente?
                            </h4>
                            <ol className="space-y-1.5 text-xs sm:text-sm font-bold text-slate-800">
                                <li className="flex items-center gap-2.5">
                                    <span className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-[11px] font-black flex-shrink-0">1</span>
                                    <span>Escaneá este código QR con la cámara de tu celular.</span>
                                </li>
                                <li className="flex items-center gap-2.5">
                                    <span className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-[11px] font-black flex-shrink-0">2</span>
                                    <span>Ingresá tu número de DNI.</span>
                                </li>
                                <li className="flex items-center gap-2.5">
                                    <span className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-[11px] font-black flex-shrink-0">3</span>
                                    <span>¡Listo! Tu asistencia queda registrada al instante 🥋</span>
                                </li>
                            </ol>
                        </div>

                        {/* Poster Footer */}
                        <p className="text-[9px] sm:text-[10px] font-black tracking-widest text-slate-400 uppercase mt-1">
                            Sistema Oficial de Control de Asistencia • GB Norte
                        </p>
                    </div>
                </div>

                {/* Actions Bar (Fixed at bottom) */}
                <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-900 flex flex-wrap items-center justify-end gap-2.5 flex-shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all border border-slate-700"
                    >
                        Cerrar
                    </button>
                    <button
                        type="button"
                        onClick={handleCopy}
                        className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all border border-slate-700"
                        title="Copiar URL"
                    >
                        <Copy size={16} />
                        <span className="hidden sm:inline">Copiar Enlace</span>
                    </button>
                    <a
                        href="/asistencia"
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all border border-slate-700"
                        title="Abrir página de check-in en nueva pestaña"
                    >
                        <ExternalLink size={16} />
                        <span>Probar</span>
                    </a>
                    <button
                        type="button"
                        onClick={handlePrint}
                        className="flex-1 sm:flex-initial px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-red-900/30 transition-all active:scale-95"
                    >
                        <Printer size={16} />
                        <span>Imprimir</span>
                    </button>
                </div>
            </div>

            {/* Print Styles */}
            <style>{`
                @media print {
                    body * {
                        visibility: hidden !important;
                    }
                    #printable-cartel, #printable-cartel * {
                        visibility: visible !important;
                    }
                    #printable-cartel {
                        position: fixed !important;
                        left: 50% !important;
                        top: 50% !important;
                        transform: translate(-50%, -50%) !important;
                        width: 85% !important;
                        max-width: 600px !important;
                        border: 6px solid #dc2626 !important;
                        box-shadow: none !important;
                        margin: 0 !important;
                        padding: 35px !important;
                    }
                }
            `}</style>
        </div>
    );
}

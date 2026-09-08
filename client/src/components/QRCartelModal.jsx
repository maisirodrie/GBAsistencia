import { useRef } from "react";
import QRCode from "react-qr-code";
import { Printer, Copy, X, ExternalLink, QrCode } from "lucide-react";
import { showToast } from "../utils/alerts";

export default function QRCartelModal({ isOpen, onClose }) {
    const printRef = useRef(null);

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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
            {/* Modal Container */}
            <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] w-full max-w-xl shadow-2xl overflow-hidden relative my-auto">
                {/* Modal Header */}
                <div className="p-6 sm:p-8 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-red-600/10 border border-red-600/20 text-red-500 rounded-2xl">
                            <QrCode size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white uppercase tracking-tight">Cartel QR del Dojo</h2>
                            <p className="text-xs text-slate-400 font-medium">Imprimí y pegá este cartel en la recepción</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-all"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Printable Poster Area */}
                <div className="p-6 sm:p-8 flex flex-col items-center bg-slate-950/40">
                    <div 
                        ref={printRef} 
                        id="printable-cartel"
                        className="w-full bg-white text-slate-900 rounded-[2rem] p-8 sm:p-10 shadow-xl border-4 border-red-600 flex flex-col items-center text-center relative overflow-hidden"
                    >
                        {/* Header Poster */}
                        <div className="flex flex-col items-center mb-6">
                            <img 
                                src="/gbnorte_v4.png" 
                                alt="Gracie Barra" 
                                className="h-20 sm:h-24 w-auto object-contain mb-2" 
                            />
                            <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-red-600">
                                GRACIE BARRA
                            </h3>
                            <p className="text-xs font-black tracking-[0.25em] text-slate-700 uppercase mt-0.5">
                                REGISTRO DE ASISTENCIA
                            </p>
                        </div>

                        {/* QR Code Container */}
                        <div className="bg-slate-50 p-6 rounded-[2rem] border-2 border-slate-200 shadow-inner mb-6 flex items-center justify-center">
                            <QRCode
                                size={220}
                                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                value={checkInUrl}
                                viewBox="0 0 256 256"
                            />
                        </div>

                        {/* Steps instructions */}
                        <div className="w-full bg-red-50 border border-red-200 rounded-2xl p-4 sm:p-5 mb-4 text-left">
                            <h4 className="text-xs font-black uppercase tracking-widest text-red-700 mb-3 text-center">
                                ¿Cómo marcar tu presente?
                            </h4>
                            <ol className="space-y-2 text-xs sm:text-sm font-bold text-slate-800">
                                <li className="flex items-center gap-2.5">
                                    <span className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center text-xs font-black flex-shrink-0">1</span>
                                    <span>Escaneá este código QR con la cámara de tu celular.</span>
                                </li>
                                <li className="flex items-center gap-2.5">
                                    <span className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center text-xs font-black flex-shrink-0">2</span>
                                    <span>Ingresá tu número de DNI.</span>
                                </li>
                                <li className="flex items-center gap-2.5">
                                    <span className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center text-xs font-black flex-shrink-0">3</span>
                                    <span>¡Listo! Tu asistencia queda registrada al instante 🥋</span>
                                </li>
                            </ol>
                        </div>

                        {/* Poster Footer */}
                        <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase mt-2">
                            Sistema Oficial de Control de Asistencia • GB Norte
                        </p>
                    </div>
                </div>

                {/* Actions Bar */}
                <div className="p-6 sm:p-8 border-t border-slate-800 bg-slate-900 flex flex-col sm:flex-row items-center gap-3">
                    <button
                        onClick={handlePrint}
                        className="w-full sm:flex-1 bg-red-600 hover:bg-red-500 text-white py-4 px-6 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-red-900/30 transition-all active:scale-95"
                    >
                        <Printer size={18} />
                        <span>Imprimir en Papel</span>
                    </button>
                    <button
                        onClick={handleCopy}
                        className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white py-4 px-6 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all border border-slate-700"
                        title="Copiar URL"
                    >
                        <Copy size={18} />
                        <span>Copiar Enlace</span>
                    </button>
                    <a
                        href="/asistencia"
                        target="_blank"
                        rel="noreferrer"
                        className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white py-4 px-6 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all border border-slate-700"
                        title="Abrir página de check-in en nueva pestaña"
                    >
                        <ExternalLink size={18} />
                        <span>Probar</span>
                    </a>
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
                        max-width: 650px !important;
                        border: 6px solid #dc2626 !important;
                        box-shadow: none !important;
                        margin: 0 !important;
                        padding: 40px !important;
                    }
                }
            `}</style>
        </div>
    );
}

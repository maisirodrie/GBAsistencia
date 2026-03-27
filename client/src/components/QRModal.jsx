import QRCode from "react-qr-code";

export default function QRModal({ show, onClose, alumnoId, alumnoNombre, alumnoCelular }) {
    if (!show) return null;

    const handleWhatsApp = () => {
        const url = `${window.location.origin}/mi-pase/${alumnoId}`;
        const mensaje = encodeURIComponent(`¡Hola ${alumnoNombre}! 🔺 Aquí tenés tu pase digital para realizar el check-in en Gracie Barra: ${url}`);
        const link = `https://wa.me/${alumnoCelular?.replace(/\D/g,'')}?text=${mensaje}`;
        window.open(link, "_blank");
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
                {/* Decoration */}
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all duration-700"></div>

                <div className="flex justify-between items-center mb-6 relative z-10">
                    <div>
                        <h2 className="text-xl font-black text-white tracking-tight">Código de Check-in</h2>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Identificador personal</p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all">✕</button>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-inner flex flex-col items-center gap-4 border-4 border-slate-800 relative z-10 transition-transform hover:scale-[1.02] duration-300">
                    <QRCode
                        size={220}
                        style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                        value={alumnoId}
                        viewBox={`0 0 256 256`}
                    />
                </div>

                <div className="mt-8 space-y-4 relative z-10">
                    <div className="text-center">
                        <p className="text-sm font-black text-blue-400 uppercase tracking-widest">{alumnoNombre}</p>
                        <p className="text-[10px] text-slate-500 font-bold mt-1">Presentá este código en recepción para marcar tu asistencia</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <button 
                            onClick={() => window.print()}
                            className="bg-slate-800 hover:bg-slate-700 text-white font-black py-4 rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2 border border-slate-700 shadow-lg text-xs"
                        >
                            🖨️ Imprimir
                        </button>
                        <button 
                            onClick={handleWhatsApp}
                            className="bg-green-600 hover:bg-green-500 text-white font-black py-4 rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg text-xs"
                        >
                            📲 WhatsApp
                        </button>
                    </div>
                    
                    <button 
                        onClick={onClose}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl transition-all active:scale-95 shadow-[0_10px_20px_rgba(37,99,235,0.2)]"
                    >
                        Listo
                    </button>
                </div>
            </div>
        </div>
    );
}

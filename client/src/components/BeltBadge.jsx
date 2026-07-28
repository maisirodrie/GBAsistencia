import { FAJA_META } from "../utils/fajas";

/**
 * BeltBadge — renderiza un cinturón BJJ visualmente.
 * Muestra el color de la faja, el color secundario (para fajas bicolores de infantil)
 * y las rayas del grau en la punta negra.
 */
export default function BeltBadge({ faja, grado, showLabel = true, size = "md" }) {
    const meta = FAJA_META[faja] || { bg: '#475569', text: '#fff', border: '#334155', stripeColor: '#fff' };
    const numGrau = Math.max(0, Math.min(4, parseInt(grado) || 0));

    const sizes = {
        xs: { height: 'h-2.5',  tipW: 14, stripeH: 6,  stripeW: 1.5, gap: 1,   text: 'text-[8px]',  w: 'w-full sm:w-16', cierre: 'w-2' },
        sm: { height: 'h-3',    tipW: 18, stripeH: 8,  stripeW: 2, gap: 1.5, text: 'text-[9px]',  w: 'w-full sm:w-40', cierre: 'w-3' },
        md: { height: 'h-4',    tipW: 22, stripeH: 10, stripeW: 2, gap: 2,   text: 'text-[10px]', w: 'w-full sm:w-28', cierre: 'w-4' },
        lg: { height: 'h-5',    tipW: 28, stripeH: 13, stripeW: 3, gap: 2.5, text: 'text-xs',     w: 'w-full sm:w-36', cierre: 'w-5' },
    };
    const s = sizes[size] || sizes.md;

    return (
        <div className="flex flex-col items-start min-w-0 flex-1 w-full gap-1">
            {/* ── Cinturón visual ── */}
            <div
                className={`flex items-stretch ${s.height} ${s.w} rounded-full overflow-hidden shadow-md border`}
                style={{ borderColor: meta.border }}
            >
                {/* Cuerpo inicial del cinturón */}
                <div className={`flex-1 flex ${meta.bg2 ? 'flex-col' : ''}`}>
                    {meta.bg2 ? (
                        <>
                            <div className="flex-1" style={{ background: meta.bg }} />
                            <div className="flex-1" style={{ background: meta.bg2 }} />
                            <div className="flex-1" style={{ background: meta.bg }} />
                        </>
                    ) : (
                        <div className="flex-1" style={{ background: meta.bg }} />
                    )}
                </div>

                {/* Punta negra (o roja para faja negra) con rayas del grau */}
                <div
                    className="flex flex-row-reverse items-center justify-start flex-shrink-0"
                    style={{ 
                        minWidth: '30px', 
                        paddingLeft: '4px', 
                        paddingRight: '4px',
                        gap: '4px',
                        backgroundColor: meta.tipColor || '#0a0a0a'
                    }}
                >
                    {numGrau === 0 ? null :
                        [...Array(numGrau)].map((_, i) => (
                            <div
                                key={i}
                                className="rounded-[1px] flex-shrink-0"
                                style={{
                                    width: s.stripeW,
                                    height: s.stripeH,
                                    background: meta.stripeColor,
                                }}
                            />
                        ))
                    }
                </div>

                {/* Cierre del cinturón (el color sigue después de la punta) */}
                <div className={`flex-shrink-0 ${s.cierre} flex ${meta.bg2 ? 'flex-col' : ''}`}>
                    {meta.bg2 ? (
                        <>
                            <div className="flex-1" style={{ background: meta.bg }} />
                            <div className="flex-1" style={{ background: meta.bg2 }} />
                            <div className="flex-1" style={{ background: meta.bg }} />
                        </>
                    ) : (
                        <div className="flex-1" style={{ background: meta.bg }} />
                    )}
                </div>
            </div>


            {/* Nombre de la faja + grau (opcional) */}
            {showLabel && (
                <span className={`${s.text} font-black text-slate-400 leading-none pl-0.5`}>
                    {faja}{numGrau > 0 ? ` - Grado ${numGrau}` : ''}
                </span>
            )}
        </div>
    );
}

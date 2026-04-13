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
        sm: { height: 'h-3',    tipW: 18, stripeH: 8,  stripeW: 2, gap: 1.5, text: 'text-[9px]',  w: 'w-20' },
        md: { height: 'h-4',    tipW: 22, stripeH: 10, stripeW: 2, gap: 2,   text: 'text-[10px]', w: 'w-28' },
        lg: { height: 'h-5',    tipW: 28, stripeH: 13, stripeW: 3, gap: 2.5, text: 'text-xs',     w: 'w-36' },
    };
    const s = sizes[size] || sizes.md;

    return (
        <div className="flex flex-col items-start gap-1">
            {/* ── Cinturón visual ── */}
            <div
                className={`flex items-stretch ${s.height} ${s.w} rounded-full overflow-hidden shadow-md border`}
                style={{ borderColor: meta.border }}
            >
                {/* Cuerpo inicial del cinturón */}
                <div className="flex-[4] flex">
                    {/* Color primario */}
                    <div
                        className="flex-1"
                        style={{ background: meta.bg }}
                    />
                    {/* Color secundario para fajas bicolores (infantil) */}
                    {meta.bg2 && (
                        <div
                            className="flex-1"
                            style={{ background: meta.bg2 }}
                        />
                    )}
                </div>

                {/* Punta negra con rayas del grau */}
                <div
                    className="flex flex-row-reverse items-center justify-start gap-[2px] bg-[#0a0a0a] flex-shrink-0"
                    style={{ minWidth: s.tipW, paddingLeft: 4, paddingRight: 4 }}
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
                <div 
                    className="flex-1"
                    style={{ background: meta.bg }}
                />
            </div>


            {/* Nombre de la faja + grau (opcional) */}
            {showLabel && (
                <span className={`${s.text} font-black text-slate-400 leading-none pl-0.5`}>
                    {faja}{numGrau > 0 ? ` · ${numGrau}º` : ''}
                </span>
            )}
        </div>
    );
}

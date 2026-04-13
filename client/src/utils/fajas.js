// Sistema de fajas de BJJ (Gracie Barra)
// Nomenclatura en portugués, separado por categoría

export const CATEGORIAS = ['Adulto', 'Infantil'];

export const FAJAS_POR_CATEGORIA = {
    Adulto: [
        'Branca',
        'Azul',
        'Roxa',
        'Marrom',
        'Preta'
    ],
    Infantil: [
        'Branca',
        'Cinza e Branca',
        'Cinza',
        'Cinza e Preta',
        'Amarela e Branca',
        'Amarela',
        'Amarela e Preta',
        'Laranja e Branca',
        'Laranja',
        'Laranja e Preta',
        'Verde e Branca',
        'Verde',
        'Verde e Preta'
    ]
};

// Colores visuales para cada faja (bg, bg2 para bicolores, stripeColor para rayas de grau)
export const FAJA_META = {
    // ── Adulto ─────────────────────────────────────────
    'Branca':            { bg: '#e2e8f0', text: '#0f172a', border: '#94a3b8',  stripeColor: '#0f172a' },
    'Azul':              { bg: '#1d4ed8', text: '#ffffff', border: '#1e3a8a',  stripeColor: '#ffffff' },
    'Roxa':              { bg: '#7c3aed', text: '#ffffff', border: '#4c1d95',  stripeColor: '#ffffff' },
    'Marrom':            { bg: '#78350f', text: '#fde68a', border: '#451a03',  stripeColor: '#ffffff' },
    'Preta':             { bg: '#020617', text: '#ef4444', border: '#dc2626',  stripeColor: '#ef4444' },
    // ── Infantil ────────────────────────────────────────
    'Cinza e Branca':    { bg: '#64748b', bg2: '#e2e8f0', text: '#0f172a', border: '#64748b',  stripeColor: '#ffffff' },
    'Cinza':             { bg: '#64748b', text: '#ffffff', border: '#334155',  stripeColor: '#ffffff' },
    'Cinza e Preta':     { bg: '#64748b', bg2: '#0f172a', text: '#e2e8f0', border: '#0f172a',  stripeColor: '#ffffff' },
    'Amarela e Branca':  { bg: '#eab308', bg2: '#f1f5f9', text: '#713f12', border: '#eab308',  stripeColor: '#0f172a' },
    'Amarela':           { bg: '#eab308', text: '#1c1917', border: '#713f12',  stripeColor: '#0f172a' },
    'Amarela e Preta':   { bg: '#eab308', bg2: '#0f172a', text: '#fde68a', border: '#1c1917',  stripeColor: '#ffffff' },
    'Laranja e Branca':  { bg: '#f97316', bg2: '#f1f5f9', text: '#7c2d12', border: '#f97316',  stripeColor: '#0f172a' },
    'Laranja':           { bg: '#f97316', text: '#ffffff', border: '#7c2d12',  stripeColor: '#ffffff' },
    'Laranja e Preta':   { bg: '#f97316', bg2: '#0f172a', text: '#ffffff', border: '#431407',  stripeColor: '#ffffff' },
    'Verde e Branca':    { bg: '#16a34a', bg2: '#f1f5f9', text: '#14532d', border: '#16a34a',  stripeColor: '#0f172a' },
    'Verde':             { bg: '#16a34a', text: '#ffffff', border: '#14532d',  stripeColor: '#ffffff' },
    'Verde e Preta':     { bg: '#16a34a', bg2: '#0f172a', text: '#86efac', border: '#052e16',  stripeColor: '#ffffff' },
};

// Helper: devuelve los estilos CSS inline para el badge de faja
export const getFajaStyle = (faja) => {
    const meta = FAJA_META[faja];
    if (!meta) return { backgroundColor: '#475569', color: '#fff', borderColor: '#334155' };
    return {
        backgroundColor: meta.bg,
        color: meta.text,
        borderColor: meta.border,
    };
};

// Texto del grau en portugués
export const grauLabel = (grau) => {
    const n = Number(grau);
    if (n === 0) return 'Sem Grau';
    return `${n}º Grau`;
};

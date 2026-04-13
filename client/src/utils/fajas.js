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

// Colores visuales para cada faja (bg, text, border)
export const FAJA_META = {
    // ── Adulto ────────────────────────────────
    'Branca':            { bg: '#e2e8f0', text: '#0f172a', border: '#94a3b8' },
    'Azul':              { bg: '#1d4ed8', text: '#ffffff', border: '#1e3a8a' },
    'Roxa':              { bg: '#7c3aed', text: '#ffffff', border: '#4c1d95' },
    'Marrom':            { bg: '#78350f', text: '#fde68a', border: '#451a03' },
    'Preta':             { bg: '#020617', text: '#ef4444', border: '#dc2626' },
    // ── Infantil ──────────────────────────────
    'Cinza e Branca':    { bg: '#cbd5e1', text: '#0f172a', border: '#64748b' },
    'Cinza':             { bg: '#64748b', text: '#ffffff', border: '#334155' },
    'Cinza e Preta':     { bg: '#334155', text: '#e2e8f0', border: '#0f172a' },
    'Amarela e Branca':  { bg: '#fef08a', text: '#713f12', border: '#eab308' },
    'Amarela':           { bg: '#eab308', text: '#1c1917', border: '#713f12' },
    'Amarela e Preta':   { bg: '#ca8a04', text: '#0f172a', border: '#1c1917' },
    'Laranja e Branca':  { bg: '#fdba74', text: '#7c2d12', border: '#f97316' },
    'Laranja':           { bg: '#f97316', text: '#ffffff', border: '#7c2d12' },
    'Laranja e Preta':   { bg: '#c2410c', text: '#ffffff', border: '#431407' },
    'Verde e Branca':    { bg: '#86efac', text: '#14532d', border: '#16a34a' },
    'Verde':             { bg: '#16a34a', text: '#ffffff', border: '#14532d' },
    'Verde e Preta':     { bg: '#14532d', text: '#86efac', border: '#052e16' },
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

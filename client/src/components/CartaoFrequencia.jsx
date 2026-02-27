/**
 * CartaoFrequencia — Réplica visual del cartón físico de Gracie Barra.
 * Se usa tanto para la Vista Previa en pantalla como para imprimir (id="cartao-print").
 */

const MESES = [
    "JANEIRO", "FEVEREIRO", "MARÇO", "ABRIL", "MAIO", "JUNHO",
    "JULHO", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO"
];
const DIAS = Array.from({ length: 31 }, (_, i) => i + 1);

const FAJAS = [
    { label: "FAIXA-BRANCA", value: "Blanca", cls: "bg-white text-gray-900" },
    { label: "FAIXA-AZUL", value: "Azul", cls: "bg-blue-700 text-white" },
    { label: "FAIXA-ROXA", value: "Morada", cls: "bg-purple-700 text-white" },
    { label: "FAIXA-MARROM", value: "Marrón", cls: "bg-amber-900 text-white" },
    { label: "FAIXA-PRETA", value: "Negra", cls: "bg-black text-white" },
];

function asistioEnDia(asistencias, mesIdx, dia) {
    return asistencias.some(a => {
        const d = new Date(a);
        const local = new Date(d.getTime() + d.getTimezoneOffset() * 60000);
        return local.getMonth() === mesIdx && local.getDate() === dia;
    });
}

export default function CartaoFrequencia({
    id = "cartao-print",
    asistencias = [],
    alumnoNombre = "",
    faja = "Blanca",
    grado = 0,
    ultimaGraduacion = "",
}) {
    /* Fecha de última graduación */
    let fechaGrad = "";
    if (ultimaGraduacion) {
        try {
            const [y, m, d] = ultimaGraduacion.split("-");
            fechaGrad = `${d}/${m}`;
        } catch { /**/ }
    }

    return (
        <div
            id={id}
            style={{
                fontFamily: "'Montserrat', sans-serif",
                backgroundColor: "#49A9DE",
                position: "relative",
            }}
            className="border-[10px] border-[#5a9fd4] p-3 shadow-2xl overflow-hidden"
        >
            {/* Fondo vectorial: fondovector.png como máscara, color exacto #78B7E4 */}
            <div
                aria-hidden="true"
                style={{
                    position: "absolute",
                    inset: 0,
                    backgroundColor: "#78B7E4",
                    maskImage: "url('/fondovector.png')",
                    WebkitMaskImage: "url('/fondovector.png')",
                    maskSize: "110%",
                    WebkitMaskSize: "110%",
                    maskRepeat: "no-repeat",
                    WebkitMaskRepeat: "no-repeat",
                    maskPosition: "-110% center",
                    WebkitMaskPosition: "-110% center",
                    pointerEvents: "none",
                    userSelect: "none",
                }}
            />

            {/* ── TOP: GB1 logo + tabla FAIXA ────────────────────── */}
            <div className="flex justify-end items-start relative z-10 mb-1">
                <div className="flex flex-col items-center gap-0.5">

                    {/* Logo GB1 */}
                    <div style={{ display: "flex", alignItems: "center", lineHeight: 1, userSelect: "none" }}>
                        {/* GB — Stereo Gothic 700 */}
                        <span style={{
                            fontFamily: "'Stereo Gothic', sans-serif",
                            fontStyle: "normal",
                            fontWeight: 700,
                            fontSize: "56px",
                            color: "#111111",
                            lineHeight: 1,
                            display: "inline-block",
                            letterSpacing: "-1px",
                            marginRight: "5px",
                        }}>GB</span>
                        <div style={{
                            background: "#1D6CB5",
                            color: "white",
                            width: "40px",
                            height: "40px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: "6px",
                            fontWeight: 700,
                            fontStyle: "normal",
                            fontSize: "26px",
                            flexShrink: 0,
                            fontFamily: "'Stereo Gothic', sans-serif",
                        }}>
                            1
                        </div>

                    </div>

                    {/* Tabla FAIXA/GRAU */}
                    <table style={{ borderCollapse: "collapse", fontSize: "8px", minWidth: "160px" }}>
                        <thead>
                            <tr style={{ background: "#e8e8e8" }}>
                                <th style={{ border: "1px solid #000", padding: "1px 4px", fontWeight: 900, textAlign: "left", color: "#000", whiteSpace: "nowrap" }}>
                                    FAIXA/GRAU
                                </th>
                                {[1, 2, 3, 4].map(g => (
                                    <th key={g} style={{ border: "1px solid #000", width: "20px", textAlign: "center", fontWeight: 900, color: "#000" }}>
                                        {g}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {[
                                { label: "FAIXA-BRANCA", value: "Blanca", bg: "#f0f0f0", color: "#000" },
                                { label: "FAIXA-AZUL", value: "Azul", bg: "#1a4bb8", color: "#fff" },
                                { label: "FAIXA-ROXA", value: "Morada", bg: "#6b21a8", color: "#fff" },
                                { label: "FAIXA-MARROM", value: "Marrón", bg: "#4e2d12", color: "#fff" },
                                { label: "FAIXA-PRETA", value: "Negra", bg: "#0a0a0a", color: "#fff" },
                            ].map(f => (
                                <tr key={f.value} style={{ background: f.bg }}>
                                    <td style={{ border: "1px solid #000", padding: "1px 4px", fontWeight: 700, color: f.color, fontSize: "7px", whiteSpace: "nowrap" }}>
                                        {f.label}
                                    </td>
                                    {[1, 2, 3, 4].map(g => (
                                        <td key={g} style={{ border: "1px solid #000", width: "20px", textAlign: "center", fontWeight: 900, color: f.color, fontSize: "10px" }}>
                                            {faja === f.value && parseInt(grado) >= g ? "■" : ""}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Título + Nombre ─────────────────────────────────── */}
            <div className="text-center mb-3 relative z-10">
                <h1 className="text-2xl font-black italic text-blue-900 tracking-tight">
                    CARTÃO DE FREQUÊNCIA <span className="font-black">GB1</span>
                </h1>
                <div className="mx-auto mt-2 max-w-2xl bg-white/30 border-b-2 border-blue-900 px-6 py-1 flex items-center gap-3">
                    <span className="text-[9px] font-black text-blue-900 uppercase whitespace-nowrap">NOME DO ALUNO:</span>
                    <span className="text-xl font-black text-blue-900 uppercase tracking-wide">
                        {alumnoNombre || <span className="opacity-30">—</span>}
                    </span>
                </div>
            </div>

            {/* ── Grilla + columna derecha ─────────────────────────── */}
            <div className="flex gap-3 relative z-10">

                {/* Grilla de asistencias */}
                <div className="flex-1 overflow-x-auto border border-blue-900 shadow">
                    <table className="border-collapse bg-white w-full">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="border border-blue-900 w-16 p-0" />
                                {DIAS.map(d => (
                                    <th key={d} className="border border-blue-900 w-5 p-0.5 text-[7px] font-black text-blue-900 text-center">
                                        {d}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {MESES.map((mes, mi) => (
                                <tr key={mes} className="h-7">
                                    <td className="border border-blue-900 font-black px-1 text-[9px] text-blue-900 bg-gray-100 uppercase">
                                        {mes}
                                    </td>
                                    {DIAS.map(dia => {
                                        const ok = asistioEnDia(asistencias, mi, dia);
                                        return (
                                            <td
                                                key={dia}
                                                className={`border border-blue-900 text-center relative h-7 ${ok ? "bg-blue-50" : ""}`}
                                            >
                                                {ok && (
                                                    <span className="absolute inset-0 flex items-center justify-center text-red-600 font-black text-lg leading-none select-none">
                                                        X
                                                    </span>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Columna derecha: graduación + logo */}
                <div className="w-40 flex flex-col gap-3 shrink-0">
                    <div className="bg-white border border-blue-900 p-2 shadow flex flex-col gap-1.5">
                        <p className="text-[8px] font-black text-blue-900 leading-tight">Data da Última<br />Graduação:</p>
                        {[0, 1, 2, 3, 4].map(i => (
                            <div key={i} className="h-5 border border-gray-300 bg-gray-50 flex items-center px-1 font-black text-xs text-blue-900">
                                {i === 0 ? fechaGrad : ""}
                            </div>
                        ))}
                    </div>

                    {/* Logo BARRA */}
                    <div className="flex items-center justify-center mt-auto pt-2">
                        <img
                            src="/logo-gb.png"
                            alt="Logo Gracie Barra"
                            className="w-20 h-20 object-contain drop-shadow-md"
                        />
                    </div>
                </div>
            </div>

            {/* ── Footer ───────────────────────────────────────────── */}
            <div className="mt-3 pt-2 border-t-2 border-blue-900 grid grid-cols-2 gap-6 text-[6px] text-blue-900 italic relative z-10">
                <p>
                    <strong>PROPÓSITO:</strong> O cartão de frequência é uma ferramenta de controle personalizada para monitorar a constância, fomentar a disciplina e avaliar o progresso necessário para mudanças de grau ou faixa.
                </p>
                <p className="text-right">
                    <strong>IMPORTÂNCIA:</strong> A constância refletida neste cartão é fundamental para a avaliação do desenvolvimento técnico e dedicação do aluno pela equipe de professores da <strong>GRACIE BARRA</strong>.
                </p>
            </div>
        </div>
    );
}

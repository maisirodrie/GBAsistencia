/**
 * CartaoFrequencia — Réplica visual del cartón físico de Gracie Barra.
 * Dimensiones exactas: 20cm × 14cm.
 * Doble borde: marco exterior azul claro + borde oscuro interior.
 */

const MESES = [
    "JANEIRO", "FEVEREIRO", "MARÇO", "ABRIL", "MAIO", "JUNHO",
    "JULHO", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO"
];
const DIAS = Array.from({ length: 31 }, (_, i) => i + 1);

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
    let fechaGrad = "";
    if (ultimaGraduacion) {
        try {
            const [, m, d] = ultimaGraduacion.split("-");
            fechaGrad = `${d}/${m}`;
        } catch { /**/ }
    }

    return (
        <div
            id={id}
            style={{
                width: "19.4cm",
                height: "13.4cm",
                boxSizing: "border-box",
                border: "0.3cm solid rgb(73, 169, 222)",
                backgroundColor: "#49A9DE",
                position: "relative",
                overflow: "hidden",
                WebkitPrintColorAdjust: "exact",
                printColorAdjust: "exact",
                margin: "auto",
            }}
        >
            {/* Marco interno oscuro */}
            <div style={{
                fontFamily: "'643', sans-serif",
                width: "100%",
                height: "100%",
                boxSizing: "border-box",
                border: "0.3cm solid rgb(26, 82, 118)",
                padding: "0.3cm",
                display: "flex",
                flexDirection: "column",
                gap: "0.15cm",
                position: "relative",
                zIndex: 1,
            }}>
                {/* ── Fondo vectorial ── */}
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

                {/* ══ TOP: título+nome derecha-abajo / GB1+FAIXA derecha-arriba ══ */}
                <div style={{ display: "flex", position: "relative", zIndex: 10, flexShrink: 0 }}>

                    {/* Izquierda: vacío arriba + Título + Nome abajo, alineados a derecha */}
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "flex-end", gap: "0.2cm" }}>

                        {/* Título — 7.5cm × 0.6cm */}
                        <div style={{
                            fontFamily: "'643', sans-serif",
                            fontWeight: 900,
                            fontSize: "0.75cm",
                            color: "rgb(17, 17, 17)",
                            letterSpacing: "0.01cm",
                            textTransform: "uppercase",
                            display: "flex",
                            alignItems: "baseline",
                            justifyContent: "center",
                            gap: "0.12cm",
                            lineHeight: 1,
                            height: "0.6cm",
                        }}>
                            <span className="dinpro-text">CARTÃO DE FREQUÊNCIA</span>
                            <span className="dinpro-bold-text">GB1</span>
                        </div>

                        {/* NOME */}
                        <div style={{ display: "flex", alignItems: "center", gap: "0.1cm" }}>
                            <span style={{
                                fontFamily: "'643', sans-serif",
                                fontWeight: 900,
                                fontSize: "0.38cm",
                                color: "#111111",
                                whiteSpace: "nowrap",
                                letterSpacing: "0.03cm",
                            }}>NOME:</span>
                            <div style={{
                                width: "8cm",
                                height: "0.5cm",
                                background: "white",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "0.35cm",
                                fontWeight: 900,
                                color: "#000000",
                                fontFamily: "'643', sans-serif",
                                boxSizing: "border-box",
                            }}>
                                {alumnoNombre || ""}
                            </div>
                        </div>
                    </div>

                    {/* Derecha: GB1 (4cm×1cm) + FAIXA (4cm×2.5cm), 1cm del borde */}
                    <div style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.1cm",
                        alignItems: "flex-end",
                    }}>
                        {/* GB1 logo — 4cm × 1cm */}
                        <div style={{
                            width: "4cm",
                            height: "1cm",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "flex-end",
                            gap: "0.08cm",
                            lineHeight: 1,
                            userSelect: "none",
                            overflow: "hidden",
                        }}>
                            <span className="gb-text" style={{
                                fontFamily: "'Stereo Gothic', sans-serif",
                                fontWeight: 700,
                                fontSize: "1.1cm",
                                color: "#111111",
                                lineHeight: 1,
                            }}>GB</span>
                            <div style={{
                                background: "#1D6CB5",
                                color: "white",
                                width: "0.95cm",
                                height: "0.95cm",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                clipPath: "polygon(12% 0, 88% 0, 100% 12%, 100% 88%, 88% 100%, 12% 100%, 0 88%, 0 12%)",
                                fontWeight: 900,
                                fontSize: "0.7cm",
                                fontFamily: "'643', sans-serif",
                                flexShrink: 0,
                            }}>1</div>
                        </div>

                        {/* FAIXA/GRAU — 4cm × 2.5cm */}
                        <table style={{ borderCollapse: "separate", borderSpacing: 0, width: "3.7cm", height: "2.5cm", fontSize: "0.2cm", borderTop: "1px solid #000", borderLeft: "1px solid #000" }}>
                            <thead>
                                <tr style={{ background: "#e8e8e8", height: "0.4cm", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
                                    <th style={{ borderRight: "1px solid #000", borderBottom: "1px solid #000", width: "1.9cm", padding: "0.05cm 0.1cm", fontWeight: 900, textAlign: "left", color: "#000", whiteSpace: "nowrap", fontSize: "0.22cm" }}>
                                        FAIXA/GRAU
                                    </th>
                                    {[1, 2, 3, 4].map(g => (
                                        <th key={g} style={{ borderRight: "1px solid #000", borderBottom: "1px solid #000", width: "0.4cm", height: "0.4cm", textAlign: "center", fontWeight: 900, color: "#000", fontSize: "0.22cm" }}>
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
                                ].map(f => {
                                    const faixaFontSize = "0.25cm"; /* ← cambiar aquí para ajustar el tamaño de la letra */
                                    return (
                                        <tr key={f.value} style={{ height: "0.4cm" }}>
                                            {/* Solo la celda de nombre lleva el color de faixa */}
                                            <td style={{ borderRight: "1px solid #000", borderBottom: "1px solid #000", width: "1.9cm", padding: "0.04cm 0.08cm", fontWeight: 700, color: f.color, backgroundColor: f.bg, fontSize: faixaFontSize, whiteSpace: "nowrap", lineHeight: 1, overflow: "hidden", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
                                                {f.label}
                                            </td>
                                            {/* Las celdas de grado son blancas */}
                                            {[1, 2, 3, 4].map(g => (
                                                <td key={g} style={{ borderRight: "1px solid #000", borderBottom: "1px solid #000", width: "0.4cm", height: "0.4cm", textAlign: "center", fontWeight: 900, backgroundColor: "white", color: "#000", fontSize: "0.3cm", lineHeight: 1, overflow: "hidden" }}>
                                                    {faja === f.value && parseInt(grado) >= g ? "X" : ""}
                                                </td>
                                            ))}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* ══ BOTTOM: Calendario + Data/Logo ══ */}
                <div style={{ display: "flex", gap: "0.15cm", flex: 1, position: "relative", zIndex: 10, minHeight: 0 }}>

                    {/* Calendario */}
                    <div style={{ width: "14.5cm", height: "8.5cm", flexShrink: 0, overflow: "hidden" }}>
                        <table style={{ borderCollapse: "separate", borderSpacing: 0, backgroundColor: "white", width: "14.5cm", tableLayout: "fixed", borderTop: "1px solid #1a3d7c", borderLeft: "1px solid #1a3d7c" }}>
                            <thead>
                                <tr>
                                    <th style={{ borderRight: "1px solid #1a3d7c", borderBottom: "1px solid #1a3d7c", width: "2cm", padding: 0, backgroundColor: "#f0f0f0", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
                                    {DIAS.map(d => (
                                        <th key={d} style={{
                                            borderRight: "1px solid #1a3d7c",
                                            borderBottom: "1px solid #1a3d7c",
                                            width: "0.4cm",
                                            height: "0.5cm",
                                            padding: 0,
                                            fontSize: "0.2cm",
                                            fontWeight: 900,
                                            lineHeight: 1,
                                            color: "#000000",
                                            textAlign: "center",
                                            fontFamily: "'643', sans-serif",
                                            backgroundColor: "#f0f0f0",
                                            WebkitPrintColorAdjust: "exact",
                                            printColorAdjust: "exact",
                                        }}>
                                            {d}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {MESES.map((mes, mi) => (
                                    <tr key={mes}>
                                        <td style={{
                                            borderRight: "1px solid #1a3d7c",
                                            borderBottom: "1px solid #1a3d7c",
                                            fontWeight: 900,
                                            fontSize: "0.3cm",
                                            lineHeight: 1,
                                            overflow: "hidden",
                                            letterSpacing: "1px",
                                            color: "#000000",
                                            backgroundColor: "#f0f0f0",
                                            fontFamily: "'643', sans-serif",
                                            whiteSpace: "nowrap",
                                            height: "0.5cm",
                                            width: "2cm",
                                            textAlign: "center",
                                        }}>
                                            {mes}
                                        </td>
                                        {DIAS.map(dia => {
                                            const ok = asistioEnDia(asistencias, mi, dia);
                                            return (
                                                <td key={dia} style={{
                                                    borderRight: "1px solid #1a3d7c",
                                                    borderBottom: "1px solid #1a3d7c",
                                                    textAlign: "center",
                                                    position: "relative",
                                                    backgroundColor: ok ? "#e0f0ff" : "white",
                                                }}>
                                                    {ok && (
                                                        <span style={{
                                                            position: "absolute",
                                                            inset: 0,
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            color: "#cc0000",
                                                            fontWeight: 900,
                                                            fontSize: "0.3cm",
                                                            lineHeight: 1,
                                                            userSelect: "none",
                                                            fontFamily: "'643', sans-serif",
                                                        }}>X</span>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Data da Última Graduação + Logo */}
                    <div style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.3cm",
                        alignItems: "center",
                    }}>
                        <p style={{
                            fontSize: "0.38cm",
                            fontWeight: 900,
                            color: "#111111",
                            lineHeight: 1.3,
                            letterSpacing: "0.5px",
                            fontFamily: "'643', sans-serif",
                            margin: 0,
                            width: "2.5cm",
                            textAlign: "left",
                        }}>Data da Última<br />Graduação:</p>

                        {[0, 1, 2, 3, 4].map(i => (
                            <div key={i} style={{
                                width: "2.5cm",
                                height: "0.5cm",
                                backgroundColor: "white",
                                border: "1px solid #000",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: 900,
                                fontSize: "0.35cm",
                                color: "#000000",
                                fontFamily: "'643', sans-serif",
                                boxSizing: "border-box",
                            }}>
                                {i === 0 ? fechaGrad : ""}
                            </div>
                        ))}

                        {/* Logo — 2.5cm × 2.5cm, 2mm del borde */}
                        <div style={{
                            width: "2.5cm",
                            display: "flex",
                            justifyContent: "center",
                        }}>
                            <img
                                src="/logo-gb.png"
                                alt="Logo Gracie Barra"
                                style={{ width: "2.5cm", height: "2.5cm", objectFit: "contain" }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

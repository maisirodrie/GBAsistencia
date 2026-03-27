import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ruta a los fonts y assets del cliente
const FONTS_DIR = path.resolve(__dirname, '../../client/public/fonts');
const ASSETS_DIR = path.resolve(__dirname, '../../client/public');

function fontToBase64(filename) {
    const p = path.join(FONTS_DIR, filename);
    const buf = fs.readFileSync(p);
    const ext = filename.endsWith('.ttf') ? 'truetype' : 'opentype';
    return `data:font/${ext};base64,${buf.toString('base64')}`;
}

function imageToBase64(filename) {
    const p = path.join(ASSETS_DIR, filename);
    const buf = fs.readFileSync(p);
    return `data:image/png;base64,${buf.toString('base64')}`;
}

const MESES = [
    "JANEIRO", "FEVEREIRO", "MARÇO", "ABRIL", "MAIO", "JUNHO",
    "JULHO", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO"
];

function asistioEnDia(asistencias, mesIdx, dia) {
    return asistencias.some(a => {
        const d = new Date(a);
        const local = new Date(d.getTime() + d.getTimezoneOffset() * 60000);
        return local.getMonth() === mesIdx && local.getDate() === dia;
    });
}

/**
 * Genera el HTML completo de la ficha con fuentes embebidas.
 */
export function generarCartaoHTML({ nombre, faja, grado, ultimaGraduacion, asistencias }) {
    // Convertir fonts a base64
    const font643 = fontToBase64('643-font.otf');
    const fontStereo = fontToBase64('StereoGothic-850.ttf');
    const fontDinproLight = fontToBase64('dinpro_condensedlight.otf');
    const fontDinproBold = fontToBase64('dinpro_condensedbold.otf');

    // Convertir imágenes a base64
    const fondovectorB64 = imageToBase64('fondovector.png');
    const logoB64 = imageToBase64('logo-gb.png');

    // Fecha de graduación
    let fechaGrad = '';
    if (ultimaGraduacion) {
        try {
            const d = new Date(ultimaGraduacion);
            const local = new Date(d.getTime() + d.getTimezoneOffset() * 60000);
            fechaGrad = `${String(local.getDate()).padStart(2, '0')}/${String(local.getMonth() + 1).padStart(2, '0')}`;
        } catch { /* */ }
    }

    // FAIXA data
    const faixas = [
        { label: "FAIXA-BRANCA", value: "Blanca", bg: "#f0f0f0", color: "#000" },
        { label: "FAIXA-AZUL", value: "Azul", bg: "#1a4bb8", color: "#fff" },
        { label: "FAIXA-ROXA", value: "Morada", bg: "#6b21a8", color: "#fff" },
        { label: "FAIXA-MARROM", value: "Marrón", bg: "#4e2d12", color: "#fff" },
        { label: "FAIXA-PRETA", value: "Negra", bg: "#0a0a0a", color: "#fff" },
    ];

    // Generar filas de faixa
    const faixaRows = faixas.map(f => {
        const gradoCells = [1, 2, 3, 4].map(g => {
            const mark = (faja === f.value && parseInt(grado) >= g) ? '✕' : '';
            return `<td style="border-right:1px solid #000;border-bottom:1px solid #000;width:0.4cm;height:0.4cm;text-align:center;font-weight:900;background-color:white;color:#000;font-size:0.25cm;line-height:1;overflow:hidden">${mark}</td>`;
        }).join('');
        return `<tr style="height:0.4cm">
            <td style="border-right:1px solid #000;border-bottom:1px solid #000;width:1.9cm;padding:0.04cm 0.08cm;font-weight:700;color:${f.color};background-color:${f.bg};font-size:0.25cm;white-space:nowrap;line-height:1;overflow:hidden;-webkit-print-color-adjust:exact !important;print-color-adjust:exact !important">${f.label}</td>
            ${gradoCells}
        </tr>`;
    }).join('\n');

    // Generar días header
    const diasHeader = Array.from({ length: 31 }, (_, i) => i + 1).map(d =>
        `<th style="border-right:1px solid #1a3d7c;border-bottom:1px solid #1a3d7c;width:0.4cm;height:0.5cm;padding:0;font-size:0.2cm;font-weight:900;line-height:1;color:#000;text-align:center;font-family:'643',sans-serif;background:#f0f0f0;-webkit-print-color-adjust:exact !important;print-color-adjust:exact !important">${d}</th>`
    ).join('');

    // Generar filas de meses
    const mesRows = MESES.map((mes, mi) => {
        const diasCells = Array.from({ length: 31 }, (_, i) => i + 1).map(dia => {
            const ok = asistioEnDia(asistencias || [], mi, dia);
            const bg = ok ? '#e0f0ff' : 'white';
            const xMark = ok ? `<span style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#cc0000;font-weight:900;font-size:0.35cm;line-height:1;font-family:'643',sans-serif">X</span>` : '';
            return `<td style="border-right:1px solid #1a3d7c;border-bottom:1px solid #1a3d7c;text-align:center;position:relative;background:${bg};-webkit-print-color-adjust:exact !important;print-color-adjust:exact !important">${xMark}</td>`;
        }).join('');
        let rowHTML = `<tr><td style="border-right:1px solid #1a3d7c;border-bottom:1px solid #1a3d7c;font-weight:900;font-size:0.3cm;line-height:1;overflow:hidden;letter-spacing:1px;color:#000;background:#f0f0f0;white-space:nowrap;height:0.5cm;width:2cm;text-align:center;-webkit-print-color-adjust:exact !important;print-color-adjust:exact !important">${mes}</td>`;
        rowHTML += diasCells;
        rowHTML += `</tr>`;
        return rowHTML;
    }).join('\n');

    // Generar cajas de graduación
    const gradBoxes = [0, 1, 2, 3, 4].map(i =>
        `<div style="width:2.5cm;height:0.5cm;background:white;border:1px solid #000;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:0.35cm;color:#000;font-family:'643',sans-serif;box-sizing:border-box">${i === 0 ? fechaGrad : ''}</div>`
    ).join('\n');

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
@font-face {
    font-family: '643';
    src: url('${font643}') format('opentype');
    font-weight: normal;
    font-style: normal;
}
@font-face {
    font-family: 'Stereo Gothic';
    src: url('${fontStereo}') format('truetype');
    font-weight: 700;
    font-style: normal;
}
@font-face {
    font-family: 'DinPro-CondensedLight';
    src: url('${fontDinproLight}') format('opentype');
    font-weight: 300;
    font-style: normal;
}
@font-face {
    font-family: 'DinPro-CondensedBold';
    src: url('${fontDinproBold}') format('opentype');
    font-weight: 700;
    font-style: normal;
}
* { 
    margin: 0; 
    padding: 0; 
    box-sizing: border-box; 
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
}
html, body { 
    margin: 0; padding: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
}
@page {
    size: A4 landscape;
    margin: 0;
}
</style>
</head>
<body>
<!-- Tarjeta principal con doble borde -->
<div style="width:19.4cm;height:13.4cm;box-sizing:border-box;border:0.3cm solid rgb(73,169,222);background:#49A9DE;position:relative;overflow:hidden;margin:auto;-webkit-print-color-adjust:exact !important;print-color-adjust:exact !important;">
    <!-- Marco interno oscuro -->
    <div style="font-family:'643',sans-serif;width:100%;height:100%;box-sizing:border-box;border:0.3cm solid rgb(26,82,118);padding:0.3cm;display:flex;flex-direction:column;gap:0.15cm;position:relative;z-index:1;">

        <!-- Fondo vectorial -->
        <div style="position:absolute;inset:0;background:#78B7E4;-webkit-mask-image:url('${fondovectorB64}');mask-image:url('${fondovectorB64}');-webkit-mask-size:110%;mask-size:110%;-webkit-mask-repeat:no-repeat;mask-repeat:no-repeat;-webkit-mask-position:-110% center;mask-position:-110% center;pointer-events:none;user-select:none"></div>

        <!-- TOP: título+nome izquierda / GB1+FAIXA derecha -->
        <div style="display:flex;position:relative;z-index:10;flex-shrink:0">
            <!-- Izquierda: Título + Nome -->
            <div style="flex:1;display:flex;flex-direction:column;justify-content:flex-end;align-items:flex-end;gap:0.2cm">
                <!-- Título -->
                <div style="font-family:'643',sans-serif;font-weight:900;font-size:0.75cm;color:rgb(17,17,17);letter-spacing:0.01cm;text-transform:uppercase;display:flex;align-items:baseline;justify-content:center;gap:0.12cm;line-height:1;height:0.6cm">
                    <span style="font-family:'DinPro-CondensedLight',sans-serif">CARTÃO DE FREQUÊNCIA</span>
                    <span style="font-family:'DinPro-CondensedBold',sans-serif">GB1</span>
                </div>
                <!-- NOME -->
                <div style="display:flex;align-items:center;gap:0.1cm">
                    <span style="font-family:'643',sans-serif;font-weight:900;font-size:0.38cm;color:#111;white-space:nowrap;letter-spacing:0.03cm">NOME:</span>
                    <div style="width:8cm;height:0.5cm;background:white;display:flex;align-items:center;justify-content:center;font-size:0.35cm;font-weight:900;color:#000;font-family:'643',sans-serif;box-sizing:border-box">${nombre || ''}</div>
                </div>
            </div>

            <!-- Derecha: GB1 logo + FAIXA -->
            <div style="display:flex;flex-direction:column;gap:0.1cm;align-items:flex-end">
                <!-- GB1 logo -->
                <div style="width:4cm;height:1cm;display:flex;align-items:center;justify-content:flex-end;gap:0.08cm;line-height:1;overflow:hidden">
                    <span style="font-family:'Stereo Gothic',sans-serif;font-weight:700;font-size:1.1cm;color:#111;line-height:1">GB</span>
                    <div style="background:#1D6CB5;color:white;width:0.95cm;height:0.95cm;display:flex;align-items:center;justify-content:center;clip-path:polygon(12% 0,88% 0,100% 12%,100% 88%,88% 100%,12% 100%,0 88%,0 12%);font-weight:900;font-size:0.7cm;font-family:'643',sans-serif;flex-shrink:0">1</div>
                </div>
                <!-- FAIXA/GRAU -->
                <table style="border-collapse:separate;border-spacing:0;width:3.7cm;height:2.5cm;font-size:0.2cm;font-family:'643',sans-serif;border-top:1px solid #000;border-left:1px solid #000">
                    <thead>
                        <tr style="background:#e8e8e8;height:0.4cm;-webkit-print-color-adjust:exact !important;print-color-adjust:exact !important">
                            <th style="border-right:1px solid #000;border-bottom:1px solid #000;width:1.9cm;padding:0.05cm 0.1cm;font-weight:900;text-align:left;color:#000;white-space:nowrap;font-size:0.22cm">FAIXA/GRAU</th>
                            ${[1, 2, 3, 4].map(g => `<th style="border-right:1px solid #000;border-bottom:1px solid #000;width:0.4cm;height:0.4cm;text-align:center;font-weight:900;color:#000;font-size:0.22cm">${g}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${faixaRows}
                    </tbody>
                </table>
            </div>
        </div>

        <!-- BOTTOM: Calendario + Data/Logo -->
        <div style="display:flex;gap:0.15cm;flex:1;position:relative;z-index:10;min-height:0">
            <!-- Calendario -->
            <div style="width:14.5cm;height:8.5cm;flex-shrink:0;overflow:hidden">
                <table style="border-collapse:separate;border-spacing:0;background:white;width:14.5cm;table-layout:fixed;font-family:'643',sans-serif;border-top:1px solid #1a3d7c;border-left:1px solid #1a3d7c">
                    <thead>
                        <tr>
                            <th style="border-right:1px solid #1a3d7c;border-bottom:1px solid #1a3d7c;width:2cm;padding:0;background:#f0f0f0;-webkit-print-color-adjust:exact !important;print-color-adjust:exact !important"></th>
                            ${diasHeader}
                        </tr>
                    </thead>
                    <tbody>
                        ${mesRows}
                    </tbody>
                </table>
            </div>

            <!-- Data da Última Graduação + Logo -->
            <div style="flex:1;display:flex;flex-direction:column;gap:0.3cm;align-items:center;font-family:'643',sans-serif">
                <p style="font-size:0.38cm;font-weight:900;color:#111;line-height:1.3;letter-spacing:0.5px;font-family:'643',sans-serif;margin:0;width:2.5cm;text-align:left">Data da Última<br>Graduação:</p>
                ${gradBoxes}
                <!-- Logo -->
                <div style="width:2.5cm;display:flex;justify-content:center">
                    <img src="${logoB64}" style="width:2.5cm;height:2.5cm;object-fit:contain" />
                </div>
            </div>
        </div>
    </div>
</div>
</body>
</html>`;
}

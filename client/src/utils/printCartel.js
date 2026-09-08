export const printCartelQR = (cartelContainerId = "printable-cartel") => {
    const cartelElement = document.getElementById(cartelContainerId) || document.querySelector("#printable-cartel, #cartel-dojo");
    if (!cartelElement) {
        window.print();
        return;
    }

    const svgElement = cartelElement.querySelector("svg");
    const svgHtml = svgElement ? svgElement.outerHTML : "";
    const origin = window.location.origin;

    // Remove any previous print iframe to avoid stacking
    const oldFrame = document.getElementById("gb-print-frame");
    if (oldFrame) {
        oldFrame.remove();
    }

    const printIframe = document.createElement("iframe");
    printIframe.id = "gb-print-frame";
    printIframe.style.position = "fixed";
    printIframe.style.right = "-9999px";
    printIframe.style.bottom = "-9999px";
    printIframe.style.width = "0px";
    printIframe.style.height = "0px";
    printIframe.style.border = "none";
    document.body.appendChild(printIframe);

    const doc = printIframe.contentDocument || printIframe.contentWindow.document;
    doc.open();
    doc.write(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="utf-8" />
            <title>Cartel QR - Gracie Barra</title>
            <style>
                @page {
                    size: A4 portrait;
                    margin: 12mm 15mm;
                }
                * {
                    box-sizing: border-box;
                    margin: 0;
                    padding: 0;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                }
                body {
                    background: #ffffff !important;
                    color: #0f172a !important;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    min-height: 95vh;
                    padding: 20px 0;
                }
                .cartel-card {
                    width: 100%;
                    max-width: 480px;
                    border: 5px solid #dc2626;
                    border-radius: 28px;
                    padding: 32px 28px;
                    text-align: center;
                    background: #ffffff;
                    margin: 0 auto;
                }
                .logo-img {
                    height: 75px;
                    width: auto;
                    object-fit: contain;
                    margin-bottom: 8px;
                    display: block;
                    margin-left: auto;
                    margin-right: auto;
                }
                .brand-title {
                    font-size: 28px;
                    font-weight: 900;
                    color: #dc2626;
                    letter-spacing: -0.5px;
                    text-transform: uppercase;
                    margin: 0;
                    line-height: 1.1;
                }
                .brand-sub {
                    font-size: 11px;
                    font-weight: 900;
                    letter-spacing: 3px;
                    color: #334155;
                    text-transform: uppercase;
                    margin-top: 4px;
                    margin-bottom: 20px;
                }
                .qr-container {
                    background: #f8fafc;
                    border: 2px solid #e2e8f0;
                    border-radius: 22px;
                    padding: 16px;
                    margin: 0 auto 20px auto;
                    display: inline-block;
                }
                .qr-container svg {
                    width: 210px !important;
                    height: 210px !important;
                    display: block;
                }
                .instructions-box {
                    background: #fef2f2;
                    border: 1.5px solid #fecaca;
                    border-radius: 18px;
                    padding: 14px 18px;
                    margin-bottom: 18px;
                    text-align: left;
                }
                .instructions-header {
                    font-size: 11px;
                    font-weight: 900;
                    text-transform: uppercase;
                    letter-spacing: 1.5px;
                    color: #b91c1c;
                    text-align: center;
                    margin-bottom: 10px;
                }
                .step-row {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-size: 12.5px;
                    font-weight: 700;
                    color: #1e293b;
                    margin-bottom: 8px;
                }
                .step-row:last-child {
                    margin-bottom: 0;
                }
                .badge-num {
                    width: 22px;
                    height: 22px;
                    border-radius: 50%;
                    background: #dc2626;
                    color: #ffffff;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 11px;
                    font-weight: 900;
                    flex-shrink: 0;
                }
                .legal-footer {
                    font-size: 9.5px;
                    font-weight: 900;
                    letter-spacing: 1.5px;
                    text-transform: uppercase;
                    color: #94a3b8;
                }
            </style>
        </head>
        <body>
            <div class="cartel-card">
                <img src="${origin}/gbnorte_v4.png" class="logo-img" alt="Gracie Barra" />
                <h1 class="brand-title">GRACIE BARRA</h1>
                <p class="brand-sub">REGISTRO DE ASISTENCIA</p>
                
                <div class="qr-container">
                    ${svgHtml}
                </div>

                <div class="instructions-box">
                    <div class="instructions-header">¿CÓMO MARCAR TU PRESENTE?</div>
                    <div class="step-row">
                        <span class="badge-num">1</span>
                        <span>Escaneá este código QR con la cámara de tu celular.</span>
                    </div>
                    <div class="step-row">
                        <span class="badge-num">2</span>
                        <span>Ingresá tu número de DNI.</span>
                    </div>
                    <div class="step-row">
                        <span class="badge-num">3</span>
                        <span>¡Listo! Tu asistencia queda registrada al instante 🥋</span>
                    </div>
                </div>

                <p class="legal-footer">SISTEMA OFICIAL DE CONTROL DE ASISTENCIA • GB NORTE</p>
            </div>
        </body>
        </html>
    `);
    doc.close();

    setTimeout(() => {
        try {
            printIframe.contentWindow.focus();
            printIframe.contentWindow.print();
        } catch (e) {
            console.error("Error invoking print on iframe:", e);
            window.print();
        }
    }, 250);
};

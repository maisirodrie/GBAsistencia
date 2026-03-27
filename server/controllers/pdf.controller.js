import puppeteer from 'puppeteer';
import Alumno from '../models/Alumno.js';
import { generarCartaoHTML } from '../utils/cartaoTemplate.js';

export const generarCartaoPDF = async (req, res) => {
    try {
        const alumno = await Alumno.findById(req.params.id);
        if (!alumno) return res.status(404).json({ message: 'Alumno no encontrado' });

        // Generar HTML de la ficha
        const html = generarCartaoHTML({
            nombre: alumno.nombre,
            faja: alumno.faja || 'Blanca',
            grado: alumno.grado || 0,
            ultimaGraduacion: alumno.ultimaGraduacion,
            asistencias: alumno.asistencias || [],
        });

        // Lanzar Puppeteer y generar PDF
        const browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });

        const page = await browser.newPage();

        // Fijar el viewport al tamaño de una hoja A4 Landscape (29.7cm × 21cm a 96dpi)
        // 1cm = 96/2.54 px ≈ 37.795px
        const PX_PER_CM = 96 / 2.54;
        await page.setViewport({
            width:  Math.round(29.7 * PX_PER_CM),
            height: Math.round(21.0 * PX_PER_CM),
            deviceScaleFactor: 2, // Más nitidez
        });

        await page.setContent(html, { waitUntil: 'networkidle0' });
        
        // Forzar media y colores desde JS
        await page.emulateMediaType('screen');
        await page.evaluate(() => {
            const style = document.createElement('style');
            style.textContent = `
                * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                @page { size: A4 landscape; margin: 0; }
                html, body { 
                    width: 100%; height: 100%; margin: 0; padding: 0; 
                    display: flex; align-items: center; justify-content: center; 
                    background: white; 
                }
            `;
            document.head.appendChild(style);
        });

        const pdfData = await page.pdf({
            format: 'A4',
            landscape: true,
            printBackground: true,
            omitBackground: false,
            margin: { top: 0, right: 0, bottom: 0, left: 0 },
            pageRanges: '1',
        });
        
        const pdfBuffer = Buffer.from(pdfData);

        await browser.close();

        // Enviar PDF como descarga
        const filename = `Carton_${(alumno.nombre || 'alumno').replace(/\s+/g, '_')}.pdf`;
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Content-Length': pdfBuffer.length,
        });
        res.send(pdfBuffer);

    } catch (error) {
        console.error('Error al generar PDF:', error);
        return res.status(500).json({ message: 'Error al generar el PDF: ' + error.message });
    }
};

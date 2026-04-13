import app from './app.js';
import { connectDB } from './db.js';
import { PORT, FRONTEND_URL } from './config.js';
import https from 'https';

console.log('--- Iniciando Servidor GB Asistencia ---');
console.log('Puerto asignado:', PORT);
console.log('Frontend Permitido:', FRONTEND_URL);
console.log('---------------------------------------');

// Iniciamos la conexión a la DB en segundo plano
connectDB();

// Escuchamos el puerto inmediatamente para evitar Timeouts en Render
app.listen(PORT, () => {
    console.log(`🚀 Servidor listo en puerto ${PORT}`);

    // ── Auto-ping para evitar el "cold start" de Render (plan gratuito) ──────
    // El servidor se llama a sí mismo cada 14 minutos para mantenerse activo.
    // No requiere ningún servicio externo.
    const BACKEND_URL = process.env.BACKEND_URL;
    if (BACKEND_URL) {
        const INTERVALO = 14 * 60 * 1000; // 14 minutos en ms
        setInterval(() => {
            https.get(`${BACKEND_URL}/healthz`, (res) => {
                console.log(`♻️  Keep-alive ping → ${res.statusCode} OK`);
            }).on('error', (err) => {
                console.warn(`♻️  Keep-alive error: ${err.message}`);
            });
        }, INTERVALO);
        console.log(`♻️  Auto-ping activo → cada 14 min a ${BACKEND_URL}/healthz`);
    }
    // ─────────────────────────────────────────────────────────────────────────
});


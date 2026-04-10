import express from 'express';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.routes.js';
import alumnoRoutes from './routes/alumno.routes.js';
import finanzasRoutes from './routes/finanzas.routes.js';
import productosRoutes from './routes/productos.routes.js';
import planPagoRoutes from './routes/planPago.routes.js';
import { validateToken } from './middlewares/validateToken.js';
import { FRONTEND_URL } from './config.js';
import { sendEmail } from './utils/nodemailer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(cors({
    origin: (origin, callback) => {
        const allowedOrigins = [FRONTEND_URL, 'http://localhost:5173', 'https://gb-asistencia.vercel.app', 'https://gbasistencia.vercel.app'];
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.log("⚠️ CORS bloqueado para:", origin);
            callback(new Error('No permitido por CORS'));
        }
    },
    credentials: true
}));

app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());

app.get('/healthz', (req, res) => res.status(200).send('OK'));
app.get('/', (req, res) => res.status(200).send('¡Servidor de GB ASISTENTE funcionando!'));

// RUTA DE DIAGNÓSTICO ROOT (Totalmente Pública y comprobada)
app.get('/diagnostic-email', async (req, res) => {
    try {
        console.log('[DIAGNOSTIC] Iniciando prueba root...');
        const user = process.env.EMAIL_USER;
        const pass = process.env.EMAIL_PASS ? 'Configurada' : 'NO CONFIGURADA';
        const info = await sendEmail(user, 'Diagnóstico Final', '<p>Si lees esto, el servidor de Render puede enviar correos.</p>');
        res.json({ success: true, messageId: info.messageId, user, pass });
    } catch (error) {
        console.error('[DIAGNOSTIC] Error en raíz:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message, 
            code: error.code,
            user: process.env.EMAIL_USER,
            passStatus: process.env.EMAIL_PASS ? 'Presente' : 'Faltante'
        });
    }
});

app.use('/api', authRoutes);
app.use('/api', validateToken, alumnoRoutes);
app.use('/api', validateToken, finanzasRoutes);
app.use('/api', validateToken, productosRoutes);
app.use('/api', validateToken, planPagoRoutes);

export default app;

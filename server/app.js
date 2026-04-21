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
import dashboardRoutes from './routes/dashboard.routes.js';
import { validateToken } from './middlewares/validateToken.js';
import { FRONTEND_URL } from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(cors({
    origin: (origin, callback) => {
        const allowedOrigins = [FRONTEND_URL, 'http://localhost:5173', 'https://gb-asistencia.vercel.app', 'https://gbasistencia.vercel.app'];
        
        // Permitir cualquier IP local en la red (192.168.x.x o 10.x.x.x) para acceso desde tablets/celulares
        const isLocalNetwork = origin && (
            /^http:\/\/192\.168\.\d+\.\d+(:\d+)?$/.test(origin) ||
            /^http:\/\/10\.\d+\.\d+\.\d+(:\d+)?$/.test(origin) ||
            /^http:\/\/172\.(1[6-9]|2\d|3[01])\.\d+\.\d+(:\d+)?$/.test(origin)
        );

        if (!origin || allowedOrigins.includes(origin) || isLocalNetwork) {
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
app.get('/', (req, res) => res.status(200).send(`¡Servidor de GB ASISTENTE funcionando! (v.1.1.2)`));

app.use('/api', authRoutes);
app.use('/api', validateToken, alumnoRoutes);
app.use('/api', validateToken, finanzasRoutes);
app.use('/api', validateToken, productosRoutes);
app.use('/api', validateToken, planPagoRoutes);
app.use('/api', validateToken, dashboardRoutes);

export default app;

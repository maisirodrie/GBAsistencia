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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(cors({
    origin: FRONTEND_URL,
    credentials: true
}));

app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());

app.get('/healthz', (req, res) => res.status(200).send('OK'));
app.get('/', (req, res) => res.status(200).send('Servidor de Asistente Mestre funcionando!'));

app.use('/api', authRoutes);
app.use('/api', validateToken, alumnoRoutes);
app.use('/api', validateToken, finanzasRoutes);
app.use('/api', validateToken, productosRoutes);
app.use('/api', validateToken, planPagoRoutes);

export default app;

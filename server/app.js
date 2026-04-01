import express from 'express';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import alumnoRoutes from './routes/alumno.routes.js';
import finanzasRoutes from './routes/finanzas.routes.js';
import productosRoutes from './routes/productos.routes.js';
import planPagoRoutes from './routes/planPago.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(cors({
    origin: (origin, callback) => {
        // En desarrollo, permitimos cualquier origen que venga de la red local
        if (!origin || origin.startsWith('http://localhost') || origin.startsWith('http://192.168') || origin.startsWith('http://172') || origin.startsWith('http://10')) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());

// Health check para Render
app.get('/healthz', (req, res) => res.status(200).send('OK'));
app.get('/', (req, res) => res.status(200).send('Servidor de Asistente Mestre funcionando!'));

app.use('/api', alumnoRoutes);
app.use('/api', finanzasRoutes);
app.use('/api', productosRoutes);
app.use('/api', planPagoRoutes);

export default app;

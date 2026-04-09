import app from './app.js';
import { connectDB } from './db.js';
import { PORT, FRONTEND_URL } from './config.js';

console.log('--- Iniciando Servidor GB Asistencia ---');
console.log('Puerto asignado:', PORT);
console.log('Frontend Permitido:', FRONTEND_URL);
console.log('---------------------------------------');

// Iniciamos la conexión a la DB en segundo plano
connectDB();

// Escuchamos el puerto inmediatamente para evitar Timeouts en Render
app.listen(PORT, () => {
    console.log(`🚀 Servidor listo en puerto ${PORT}`);
});

import app from './app.js';
import { connectDB } from './db.js';
import dotenv from 'dotenv';

import { PORT, FRONTEND_URL, MONGODB_URI } from './config.js';

dotenv.config();

console.log('--- Configuración del Servidor ---');
console.log('Puerto:', PORT);
console.log('Frontend URL permitida:', FRONTEND_URL);
console.log('DB URI (primeros 20 caracteres):', MONGODB_URI?.substring(0, 20) + '...');
console.log('---------------------------------');

connectDB();

app.listen(PORT, () => {
    console.log(`Server on port ${PORT}`);
});

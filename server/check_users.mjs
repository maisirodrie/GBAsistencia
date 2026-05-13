import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

async function checkUsers() {
    try {
        await mongoose.connect(process.env.MONGODB_URI.replace('/gbasistencia', '/asistente_mestre'));
        const User = mongoose.connection.db.collection('users');
        const users = await User.find({}).toArray();
        console.log("Usuarios en asistente_mestre:");
        users.forEach(u => console.log(` - DNI: ${u.dni}, Nombre: ${u.nombre}`));
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

checkUsers();

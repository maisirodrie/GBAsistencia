import mongoose from 'mongoose';
import User from '../models/User.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const initAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Conectado a MongoDB");

        const dni = process.argv[2];
        const email = process.argv[3];
        const nombre = process.argv[4] || 'Admin';
        const apellido = process.argv[5] || 'Sistema';
        const password = process.argv[6] || 'admin123';

        if (!dni || !email) {
            console.log("Uso: node initAdmin.js <DNI> <EMAIL> <NOMBRE> <APELLIDO> <PASSWORD>");
            process.exit(1);
        }

        const existingUser = await User.findOne({ $or: [{ dni }, { email }] });
        if (existingUser) {
            console.log("Error: El DNI o Email ya están registrados.");
            process.exit(1);
        }

        const admin = new User({
            dni,
            email,
            nombre,
            apellido,
            password,
            role: 'Admin',
            mustChangePassword: false // El primer admin no necesita cambiarla si la elige él
        });

        await admin.save();
        console.log(`Usuario administrador creado con éxito:
        DNI: ${dni}
        Email: ${email}
        Nombre: ${nombre} ${apellido}
        Rol: Admin`);

        process.exit(0);
    } catch (error) {
        console.error("Error al crear el administrador:", error);
        process.exit(1);
    }
};

initAdmin();

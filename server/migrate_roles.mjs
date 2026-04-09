import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';
dotenv.config();

async function migrate() {
    try {
        console.log('Conectando a MongoDB Atlas...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Conexión exitosa.');

        console.log('Buscando usuarios con rol "Mestre"...');
        const usersToUpdate = await User.find({ role: 'Mestre' });
        console.log(`Encontrados: ${usersToUpdate.length}`);

        if (usersToUpdate.length > 0) {
            const result = await User.updateMany(
                { role: 'Mestre' },
                { $set: { role: 'Profesor' } }
            );
            console.log(`Migración completada. Usuarios actualizados: ${result.modifiedCount}`);
        } else {
            console.log('No hay usuarios para actualizar.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error durante la migración:', error);
        process.exit(1);
    }
}

migrate();

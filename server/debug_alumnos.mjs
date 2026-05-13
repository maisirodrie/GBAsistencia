import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

async function checkAlumnoData() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const Alumno = mongoose.connection.db.collection('alumnos');
        const alumnos = await Alumno.find({}).limit(5).toArray();
        console.log("Datos de alumnos:");
        alumnos.forEach(a => {
            console.log(` - ${a.nombre} ${a.apellido}`);
            console.log(`    ultimaGraduacion: ${a.ultimaGraduacion}`);
            console.log(`    createdAt: ${a.createdAt}`);
            console.log(`    faja: ${a.faja}, grado: ${a.grado}`);
        });
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

checkAlumnoData();

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

async function inspectMaxi() {
    try {
        console.log("Conectando...");
        await mongoose.connect(process.env.MONGODB_URI);
        const Alumno = mongoose.connection.db.collection('alumnos');
        const maxi = await Alumno.findOne({ nombre: /Maximiliano/i });
        if (maxi) {
            console.log("Maxi found:", JSON.stringify(maxi, null, 2));
        } else {
            console.log("Maxi not found");
            const all = await Alumno.find({}).limit(10).toArray();
            console.log("Some names in DB:", all.map(a => `${a.nombre} ${a.apellido}`));
        }
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

inspectMaxi();

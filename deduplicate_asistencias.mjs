import mongoose from 'mongoose';
import Alumno from './server/models/Alumno.js';
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: './server/.env' });

const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost/gbasistencia";

async function deduplicate() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to DB");

        const alumnos = await Alumno.find();
        let totalFixed = 0;

        for (const alumno of alumnos) {
            const originalCount = alumno.asistencias.length;
            if (originalCount === 0) continue;

            const seen = new Set();
            const uniqueAsistencias = [];

            for (const iso of alumno.asistencias) {
                const d = new Date(iso);
                const ld = new Date(d.getTime() + d.getTimezoneOffset() * 60000);
                const strF = `${ld.getFullYear()}-${String(ld.getMonth() + 1).padStart(2, '0')}-${String(ld.getDate()).padStart(2, '0')}`;
                
                if (!seen.has(strF)) {
                    seen.add(strF);
                    uniqueAsistencias.push(iso);
                }
            }

            if (uniqueAsistencias.length !== originalCount) {
                console.log(`Fixing student: ${alumno.nombre} - reduced from ${originalCount} to ${uniqueAsistencias.length}`);
                alumno.asistencias = uniqueAsistencias;
                await alumno.save();
                totalFixed++;
            }
        }

        console.log(`Deduplicated ${totalFixed} students.`);
        await mongoose.disconnect();
    } catch (error) {
        console.error("Error:", error);
    }
}

deduplicate();

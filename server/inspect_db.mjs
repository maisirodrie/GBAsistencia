import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

async function inspectDB() {
    try {
        console.log("Conectando a MongoDB...");
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Conectado.");

        const admin = mongoose.connection.db.admin();
        const dbs = await admin.listDatabases();
        console.log("Bases de datos encontradas:");
        for (const dbInfo of dbs.databases) {
            console.log(` - ${dbInfo.name}`);
            const db = mongoose.connection.useDb(dbInfo.name);
            const collections = await db.db.listCollections().toArray();
            for (const col of collections) {
                const count = await db.collection(col.name).countDocuments();
                console.log(`    - ${col.name}: ${count} documentos`);
            }
        }

        process.exit(0);
    } catch (error) {
        console.error("Error al inspeccionar:", error);
        process.exit(1);
    }
}

inspectDB();

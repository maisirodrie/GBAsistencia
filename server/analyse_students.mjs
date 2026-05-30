import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { evaluarGraduacion, getFechaInicioFaja, getFechaUltimoGrado } from './constants/graduation.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

async function analyzeStudents() {
    try {
        console.log("======================================================================");
        console.log("   GBASISTENCIA — ANALIZADOR COMPLETO DE ALUMNOS (GRACIE BARRA)       ");
        console.log("======================================================================\n");
        
        console.log("Conectando a la base de datos...");
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Conexión exitosa.\n");

        const AlumnoCol = mongoose.connection.db.collection('alumnos');
        const alumnos = await AlumnoCol.find({}).toArray();

        console.log(`Se encontraron ${alumnos.length} alumnos en la base de datos.\n`);

        let countEstado1 = 0;
        let countEstado2 = 0;
        let countEstado3 = 0;
        let countElegibles = 0;
        let countConAlertas = 0;

        for (const a of alumnos) {
            const currentFaja = a.faja || "Branca";
            const currentGrado = parseInt(a.grado) || 0;
            const birthDate = a.fechaNacimiento ? new Date(a.fechaNacimiento) : null;
            const asistencias = a.asistencias || [];
            const freq = a.frecuenciaSemanal || 2;

            const fif = getFechaInicioFaja(a);
            const fug = getFechaUltimoGrado(a);

            const ev = evaluarGraduacion({
                cinturon_actual: currentFaja,
                grado_actual: currentGrado,
                fecha_ultimo_grado: fug,
                fecha_inicio_faja: fif,
                fecha_nacimiento: a.fechaNacimiento,
                asistencias: asistencias,
                frecuencia_semanal: freq
            });

            if (ev.estado_secuencial === 1) countEstado1++;
            if (ev.estado_secuencial === 2) countEstado2++;
            if (ev.estado_secuencial === 3) countEstado3++;
            if (ev.elegible) countElegibles++;

            let hasDataIssue = false;
            const warnings = [];

            // Validar inconsistencias comunes
            if (!a.fechaNacimiento) {
                hasDataIssue = true;
                warnings.push("⚠️ Sin Fecha de Nacimiento (se asume 20 años por defecto)");
            }
            if (ev.alertas_edad && ev.alertas_edad.length > 0) {
                hasDataIssue = true;
                ev.alertas_edad.forEach(al => warnings.push(`⚠️ Alerta Edad: ${al.mensaje}`));
            }
            if (asistencias.length > 0 && !a.ultimaGraduacion && currentGrado > 0) {
                warnings.push("💡 Alumno con grados pero sin fecha de Última Graduación (se usa createdAt)");
            }

            if (warnings.length > 0) countConAlertas++;

            console.log(`👤 Alumno: ${a.nombre} ${a.apellido || ""}`);
            console.log(`   Cinturón: ${currentFaja} | Grado: ${currentGrado}º`);
            console.log(`   Edad Actual: ${ev.edad !== undefined ? ev.edad : "N/D"} años`);
            console.log(`   Asistencias Totales en la Faja: ${ev.asistenciasTotalesFaja} clases`);
            console.log(`   Estado Secuencial: ESTADO ${ev.estado_secuencial} (${
                ev.estado_secuencial === 1 ? "Hacia Grado 1" : 
                ev.estado_secuencial === 2 ? "Deuda de Permanencia" : "Tramo Activo"
            })`);

            if (ev.tieneDeuda) {
                console.log(`   🛑 DEUDA ACTIVA: Faltan ${ev.deudaClases} clases para completar la base de la faja`);
                console.log(`      Progreso en Deuda: ${ev.contadores_visuales.permanencia.acumuladas} / ${ev.contadores_visuales.permanencia.requeridas} clases`);
            } else {
                console.log(`   📊 Progreso Técnico: ${ev.contadores_visuales.grado.acumuladas} / ${ev.contadores_visuales.grado.requeridas} clases (${ev.contadores_visuales.grado.porcentaje}%)`);
                console.log(`   ⏳ Progreso Permanencia: ${ev.contadores_visuales.permanencia.acumuladas} / ${ev.contadores_visuales.permanencia.requeridas} ${ev.estado_secuencial === 1 ? 'días' : 'días'} (${ev.contadores_visuales.permanencia.porcentaje}%)`);
            }

            console.log(`   📈 Proyección Promoción: ${ev.fecha_estimada_promocion || "No proyectada"}`);
            console.log(`   🛡️ Factor de Bloqueo: ${ev.bloqueo_factor}`);
            console.log(`   ⭐ ¿Elegible para Promoción?: ${ev.elegible ? "SÍ ✅" : "NO ❌"}`);

            if (warnings.length > 0) {
                console.log("   Alertas detectadas:");
                warnings.forEach(w => console.log(`      * ${w}`));
            }
            console.log("----------------------------------------------------------------------");
        }

        console.log("\n======================================================================");
        console.log("   RESUMEN ESTADÍSTICO GENERAL                                        ");
        console.log("======================================================================");
        console.log(`Total Alumnos: ${alumnos.length}`);
        console.log(` - Estado 1 (Hacia Grado 1): ${countEstado1}`);
        console.log(` - Estado 2 (Deuda de Permanencia): ${countEstado2}`);
        console.log(` - Estado 3 (Tramo Activo): ${countEstado3}`);
        console.log(` - Alumnos Elegibles para Promover: ${countElegibles}`);
        console.log(` - Alumnos con Inconsistencias/Alertas: ${countConAlertas}`);
        console.log("======================================================================\n");

        process.exit(0);
    } catch (error) {
        console.error("Error crítico durante el análisis:", error);
        process.exit(1);
    }
}

analyzeStudents();

import Alumno from '../models/Alumno.js';
import Transaccion from '../models/Transaccion.js';
import { TIEMPOS_GRADUACION, CLASES_POR_MES } from '../constants/graduation.js';


export const getStats = async (req, res) => {
    try {
        const hoy = new Date();
        const hoyInicio = new Date(hoy.setHours(0, 0, 0, 0));
        const hoyFin = new Date(hoy.setHours(23, 59, 59, 999));

        const now = new Date();
        const mesInicio = new Date(now.getFullYear(), now.getMonth(), 1);
        const mesFin = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        // 1. Total Alumnos
        const totalAlumnos = await Alumno.countDocuments();

        // 2. Asistencias Hoy
        const asistenciasHoy = await Alumno.countDocuments({
            asistencias: { $elemMatch: { $gte: hoyInicio, $lte: hoyFin } }
        });

        // 3. Ingresos del Mes
        const transaccionesMes = await Transaccion.find({
            fecha: { $gte: mesInicio, $lte: mesFin },
            tipo: 'INGRESO'
        });
        const ingresosMes = transaccionesMes.reduce((acc, t) => acc + t.monto, 0);

        // 4. Últimas 5 Transacciones
        const ultimasTransacciones = await Transaccion.find()
            .sort({ fecha: -1 })
            .limit(5)
            .populate('alumnoId', 'nombre apellido');

        // 5. Alumnos próximos a graduación (>85% progreso para dar margen)
        const alumnos = await Alumno.find({ trackProgreso: { $ne: false } });
        const proximosAGraduar = alumnos
            .map(alumno => {
                const tiempos = TIEMPOS_GRADUACION[alumno.faja] || TIEMPOS_GRADUACION['Branca'];
                const mesesRequeridos = (alumno.grado >= 0 && alumno.grado < tiempos.length) ? tiempos[alumno.grado] : 1;
                const reqBase = mesesRequeridos * CLASES_POR_MES;
                
                // Contar asistencias válidas desde última graduación
                const fechaUg = alumno.ultimaGraduacion ? new Date(alumno.ultimaGraduacion) : new Date(alumno.createdAt);
                const validas = alumno.asistencias.filter(iso => new Date(iso) >= fechaUg).length;
                
                // Cálculo de progreso basado en clases y tiempo
                const hoy = new Date();
                const diasTranscurridos = Math.max(0, Math.floor((hoy - fechaUg) / (1000 * 60 * 60 * 24)));
                const diasRequeridos = mesesRequeridos * 30;
                
                const pctClases = Math.min(validas / reqBase, 1);
                const pctTiempo = Math.min(validas / diasRequeridos, 1);
                
                // El progreso real es el mínimo de ambos (ambos deben cumplirse)
                const progresoReal = Math.min(pctClases, pctTiempo);
                
                return {
                    _id: alumno._id,
                    nombre: alumno.nombre,
                    apellido: alumno.apellido,
                    faja: alumno.faja,
                    grado: alumno.grado,
                    pctClases: Math.round(pctClases * 100),
                    pctTiempo: Math.round(pctTiempo * 100),
                    asistenciasPermanencia: validas,
                    metaPermanencia: diasRequeridos,
                    asistenciasDesdeUltimaGrad: validas,
                    clasesRequeridas: reqBase,
                    fotoUrl: alumno.fotoUrl
                };
            });

        const candidatosAGrado = proximosAGraduar
            .filter(a => a.pctClases >= 100 && a.grado < 4)
            .sort((a, b) => b.pctClases - a.pctClases);

        const candidatosAFaja = proximosAGraduar
            .filter(a => a.grado >= 4 && (a.pctClases >= 100 || a.pctTiempo >= 50))
            .sort((a, b) => b.pctTiempo - a.pctTiempo);

        const isAdminOrEncargado = ['Admin', 'Encargado'].includes(req.user.role);

        res.json({
            stats: {
                totalAlumnos,
                asistenciasHoy,
                ingresosMes: isAdminOrEncargado ? ingresosMes : null
            },
            ultimasTransacciones: isAdminOrEncargado ? ultimasTransacciones : [],
            candidatosAGrado: candidatosAGrado.slice(0, 50),
            candidatosAFaja: candidatosAFaja.slice(0, 50)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

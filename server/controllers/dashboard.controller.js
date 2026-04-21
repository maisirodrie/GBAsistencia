import Alumno from '../models/Alumno.js';
import Transaccion from '../models/Transaccion.js';

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
                const reqBase = alumno.clasesParaGraduacion || 30;
                // Contar asistencias válidas desde última graduación
                const validas = alumno.asistencias.filter(iso => {
                    if (!alumno.ultimaGraduacion) return true;
                    return new Date(iso) >= new Date(alumno.ultimaGraduacion);
                }).length;
                
                const clasesProgreso = validas % reqBase;
                const pct = clasesProgreso / reqBase;
                
                return {
                    _id: alumno._id,
                    nombre: alumno.nombre,
                    apellido: alumno.apellido,
                    faja: alumno.faja,
                    grado: alumno.grado,
                    progreso: Math.round(pct * 100),
                    clasesRestantes: reqBase - clasesProgreso,
                    fotoUrl: alumno.fotoUrl
                };
            })
            .filter(a => a.progreso >= 85)
            .sort((a, b) => b.progreso - a.progreso)
            .slice(0, 5);

        const isAdminOrEncargado = ['Admin', 'Encargado'].includes(req.user.role);

        res.json({
            stats: {
                totalAlumnos,
                asistenciasHoy,
                ingresosMes: isAdminOrEncargado ? ingresosMes : null
            },
            ultimasTransacciones: isAdminOrEncargado ? ultimasTransacciones : [],
            proximosAGraduar
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

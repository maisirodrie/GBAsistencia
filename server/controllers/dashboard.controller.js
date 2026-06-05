import Alumno from '../models/Alumno.js';
import Transaccion from '../models/Transaccion.js';
import { getFechaInicioFaja, getFechaUltimoGrado, evaluarGraduacion } from '../constants/graduation.js';


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

        // 5. Obtener todos los alumnos para pagos y filtrados para progreso
        const alumnosTodos = await Alumno.find({});
        const alumnosConProgreso = alumnosTodos.filter(a => a.trackProgreso !== false);
        
        // 6. Obtener transacciones de membresía de este mes para ver quién falta pagar
        const pagosMes = await Transaccion.find({
            fecha: { $gte: mesInicio, $lte: mesFin },
            categoria: 'Membresía'
        });
        const idsPagados = pagosMes.map(p => p.alumnoId?.toString());
        const pendientesPago = alumnosTodos
            .filter(a => !idsPagados.includes(a._id.toString()))
            .map(a => ({
                _id: a._id,
                nombre: a.nombre,
                apellido: a.apellido,
                faja: a.faja,
                grado: a.grado,
                fotoUrl: a.fotoUrl
            }));

        const toLocalStr = (dObj) => {
            const d = new Date(dObj);
            const ld = new Date(d.getTime() + d.getTimezoneOffset() * 60000);
            return `${ld.getFullYear()}-${String(ld.getMonth() + 1).padStart(2, '0')}-${String(ld.getDate()).padStart(2, '0')}`;
        };

        const proximosAGraduar = alumnosConProgreso
            .map(alumno => {
                const fechaInicioFaja = getFechaInicioFaja(alumno);
                const fechaUltimoGrado = getFechaUltimoGrado(alumno);
                
                // Invocar el motor de graduación oficial Gracie Barra
                const evaluacion = evaluarGraduacion({
                    cinturon_actual: alumno.faja,
                    grado_actual: alumno.grado,
                    fecha_ultimo_grado: fechaUltimoGrado,
                    fecha_inicio_faja: fechaInicioFaja,
                    fecha_nacimiento: alumno.fechaNacimiento || alumno.fecha_nacimiento,
                    asistencias: alumno.asistencias,
                    frecuencia_semanal: alumno.frecuenciaSemanal,
                    permanencia_manual: alumno.permanenciaManual
                });

                const pctClases = evaluacion.contadores_visuales?.grado 
                    ? evaluacion.contadores_visuales.grado.porcentaje / 100 
                    : (evaluacion.clases_requeridas > 0 
                        ? Math.min(evaluacion.clases_acumuladas / evaluacion.clases_requeridas, 1) 
                        : 1);
                const pctTiempo = evaluacion.contadores_visuales?.permanencia 
                    ? evaluacion.contadores_visuales.permanencia.porcentaje / 100 
                    : (evaluacion.dias_requeridos > 0 
                        ? Math.min(evaluacion.dias_transcurridos / evaluacion.dias_requeridos, 1) 
                        : 1);
                
                return {
                    _id: alumno._id,
                    nombre: alumno.nombre,
                    apellido: alumno.apellido,
                    faja: alumno.faja,
                    grado: alumno.grado,
                    pctClases: Math.round(pctClases * 100),
                    pctTiempo: Math.round(pctTiempo * 100),
                    asistenciasDesdeUltimaGrad: evaluacion.clases_acumuladas,
                    clasesRequeridas: evaluacion.clases_requeridas,
                    mesesRequeridos: Math.round(evaluacion.dias_requeridos / 30),
                    fotoUrl: alumno.fotoUrl,
                    elegible: evaluacion.elegible,
                    tieneDeuda: evaluacion.tieneDeuda,
                    deudaClases: evaluacion.deudaClases,
                    msgDeuda: evaluacion.msgDeuda
                };
            });

        // Doble condicional: clases AND tiempo cumplidos (elegible === true)
        const candidatosAGrado = proximosAGraduar
            .filter(a => a.elegible && a.grado < 4)
            .sort((a, b) => b.pctClases - a.pctClases);

        const candidatosAFaja = proximosAGraduar
            .filter(a => a.grado >= 4 && a.elegible)
            .sort((a, b) => b.pctTiempo - a.pctTiempo);

        const isAdminOrEncargado = ['Admin', 'Encargado'].includes(req.user.role);

        res.json({
            stats: {
                totalAlumnos,
                asistenciasHoy,
                ingresosMes: isAdminOrEncargado ? ingresosMes : null
            },
            ultimasTransacciones: isAdminOrEncargado ? ultimasTransacciones : [],
            pendientesPago: isAdminOrEncargado ? pendientesPago : [],
            candidatosAGrado: candidatosAGrado.slice(0, 50),
            candidatosAFaja: candidatosAFaja.slice(0, 50)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

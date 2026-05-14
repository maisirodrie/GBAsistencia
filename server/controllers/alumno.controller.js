import Alumno from '../models/Alumno.js';
import { TIEMPOS_GRADUACION, CLASES_POR_MES } from '../constants/graduation.js';



export const getAlumnos = async (req, res) => {
    try {
        const hoy = new Date();
        const hoyInicio = new Date(hoy.setHours(0, 0, 0, 0));
        const hoyFin = new Date(hoy.setHours(23, 59, 59, 999));

        const alumnosData = await Alumno.aggregate([
            {
                $project: {
                    nombre: 1,
                    apellido: 1,
                    faja: 1,
                    grado: 1,
                    fotoUrl: 1,
                    ultimaGraduacion: 1,
                    createdAt: 1,
                    clasesParaGraduacion: 1,
                    trackProgreso: 1,
                    totalAsistencias: { $size: "$asistencias" },
                    yaAsistioHoy: {
                        $gt: [
                            {
                                $size: {
                                    $filter: {
                                        input: "$asistencias",
                                        as: "asist",
                                        cond: {
                                            $and: [
                                                { $gte: ["$$asist", hoyInicio] },
                                                { $lte: ["$$asist", hoyFin] }
                                            ]
                                        }
                                    }
                                }
                            },
                            0
                        ]
                    },
                    asistenciasDesdeUltimaGrad: {
                        $size: {
                            $filter: {
                                input: "$asistencias",
                                as: "asist",
                                cond: {
                                    $let: {
                                        vars: {
                                            ug: { $ifNull: ["$ultimaGraduacion", "$createdAt"] }
                                        },
                                        in: { $gte: ["$$asist", "$$ug"] }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        ]);

        // Enriquecemos con los datos de la tabla de graduación
        const alumnos = alumnosData.map(alumno => {
            const tiempos = TIEMPOS_GRADUACION[alumno.faja] || TIEMPOS_GRADUACION['Branca'];
            const mesesRequeridos = (alumno.grado >= 0 && alumno.grado < tiempos.length) ? tiempos[alumno.grado] : 1;
            const clasesRequeridas = mesesRequeridos * CLASES_POR_MES;

            
            // Cálculo de tiempo restante
            const fechaUg = alumno.ultimaGraduacion ? new Date(alumno.ultimaGraduacion) : new Date(alumno.createdAt);
            const hoy = new Date();
            const diasTranscurridos = Math.max(0, Math.floor((hoy - fechaUg) / (1000 * 60 * 60 * 24)));
            const diasRequeridos = mesesRequeridos * 30;

            return {
                ...alumno,
                clasesRequeridas,
                mesesRequeridos,
                diasTranscurridos,
                diasRequeridos,
                tiempoCumplido: diasTranscurridos >= diasRequeridos,
                clasesCumplidas: alumno.asistenciasDesdeUltimaGrad >= clasesRequeridas
            };
        });

        res.json(alumnos);

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const createAlumno = async (req, res) => {
    try {
        const { nombre, apellido, celular, categoria, faja, grado, ultimaGraduacion, clasesParaGraduacion, trackProgreso } = req.body;
        const newAlumno = new Alumno({
            nombre,
            apellido,
            celular,
            categoria,
            faja,
            grado,
            clasesParaGraduacion: clasesParaGraduacion || 30,
            trackProgreso: trackProgreso !== undefined ? trackProgreso : true,
            asistencias: [],
            ultimaGraduacion: (ultimaGraduacion && ultimaGraduacion.trim() !== "") ? new Date(ultimaGraduacion) : null
        });
        const savedAlumno = await newAlumno.save();
        res.json(savedAlumno);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const getAlumno = async (req, res) => {
    try {
        const alumno = await Alumno.findById(req.params.id);
        if (!alumno) return res.status(404).json({ message: 'Alumno no encontrado' });
        
        // Enriquecemos con los datos de la tabla de graduación
        const tiempos = TIEMPOS_GRADUACION[alumno.faja] || TIEMPOS_GRADUACION['Branca'];
        const mesesRequeridos = (alumno.grado >= 0 && alumno.grado < tiempos.length) ? tiempos[alumno.grado] : 1;
        const clasesRequeridas = mesesRequeridos * CLASES_POR_MES;
        
        // Cálculo de tiempo restante
        const fechaUg = alumno.ultimaGraduacion ? new Date(alumno.ultimaGraduacion) : new Date(alumno.createdAt);
        const hoy = new Date();
        const diasTranscurridos = Math.max(0, Math.floor((hoy - fechaUg) / (1000 * 60 * 60 * 24)));
        const diasRequeridos = mesesRequeridos * 30;

        const toLocalStr = (dObj) => {
            const d = new Date(dObj);
            const ld = new Date(d.getTime() + d.getTimezoneOffset() * 60000);
            return `${ld.getFullYear()}-${String(ld.getMonth() + 1).padStart(2, '0')}-${String(ld.getDate()).padStart(2, '0')}`;
        };

        const strUg = toLocalStr(fechaUg);
        const asistenciasDesdeUltimaGrad = alumno.asistencias.filter(iso => toLocalStr(iso) >= strUg).length;

        const alumnoEnriquecido = {
            ...alumno.toObject(),
            clasesRequeridas,
            mesesRequeridos,
            asistenciasPermanencia: asistenciasDesdeUltimaGrad,
            metaPermanencia: diasRequeridos,
            asistenciasDesdeUltimaGrad,
            tiempoCumplido: asistenciasDesdeUltimaGrad >= diasRequeridos,
            clasesCumplidas: asistenciasDesdeUltimaGrad >= clasesRequeridas
        };

        res.json(alumnoEnriquecido);

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const deleteAlumno = async (req, res) => {
    try {
        const deletedAlumno = await Alumno.findByIdAndDelete(req.params.id);
        if (!deletedAlumno) return res.status(404).json({ message: 'Alumno no encontrado' });
        return res.sendStatus(204);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const updateAlumno = async (req, res) => {
    try {
        const alumno = await Alumno.findById(req.params.id);
        if (!alumno) return res.status(404).json({ message: 'Alumno no encontrado' });

        // Guardar estado previo si hay cambio de faja o grado para el historial
        const gradoNuevo = req.body.grado !== undefined ? parseInt(req.body.grado) : alumno.grado;
        const fajaNueva = req.body.faja || alumno.faja;

        if (fajaNueva !== alumno.faja || gradoNuevo !== alumno.grado) {
            alumno.historicoGraduaciones.push({
                faja: alumno.faja,
                grado: alumno.grado,
                ultimaGraduacion: alumno.ultimaGraduacion,
                fechaClasePromocion: new Date()
            });
        }

        // Aplicar cambios del body al documento
        // Ajustes de fecha
        if (req.body.ultimaGraduacion === "") {
            alumno.ultimaGraduacion = null;
        } else if (req.body.ultimaGraduacion) {
            alumno.ultimaGraduacion = new Date(req.body.ultimaGraduacion);
        }

        if (req.body.nombre) alumno.nombre = req.body.nombre;
        if (req.body.apellido !== undefined) alumno.apellido = req.body.apellido;
        if (req.body.celular !== undefined) alumno.celular = req.body.celular;
        if (req.body.categoria) alumno.categoria = req.body.categoria;
        if (req.body.trackProgreso !== undefined) alumno.trackProgreso = req.body.trackProgreso;
        if (req.body.clasesParaGraduacion !== undefined && !isNaN(req.body.clasesParaGraduacion)) {
            alumno.clasesParaGraduacion = req.body.clasesParaGraduacion;
        }

        alumno.faja = fajaNueva;
        alumno.grado = gradoNuevo;

        const alumnoUpdated = await alumno.save();
        res.json(alumnoUpdated);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const revertPromotion = async (req, res) => {
    try {
        const alumno = await Alumno.findById(req.params.id);
        if (!alumno) return res.status(404).json({ message: 'Alumno no encontrado' });

        if (!alumno.historicoGraduaciones || alumno.historicoGraduaciones.length === 0) {
            return res.status(400).json({ message: 'No hay historial para revertir' });
        }

        const lastHistory = alumno.historicoGraduaciones.pop();
        
        alumno.faja = lastHistory.faja;
        alumno.grado = lastHistory.grado;
        alumno.ultimaGraduacion = lastHistory.ultimaGraduacion;
        
        await alumno.save();
        res.json(alumno);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const addAsistencia = async (req, res) => {
    try {
        const { fecha } = req.body;
        const alumno = await Alumno.findById(req.params.id);
        if (!alumno) return res.status(404).json({ message: 'Alumno no encontrado' });
        
        // Evitar duplicados en el mismo día
        const fechaSinHora = new Date(fecha).setHours(0, 0, 0, 0);
        const yaAsistio = alumno.asistencias.some(a => new Date(a).setHours(0, 0, 0, 0) === fechaSinHora);
        
        if (yaAsistio) return res.status(400).json({ message: 'Asistencia ya registrada para hoy' });

        alumno.asistencias.push(fecha);
        
        // Auto-graduación eliminada (ahora es manual por el profesor)
        
        await alumno.save();
        res.json(alumno);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
 
export const checkIn = async (req, res) => {
    try {
        const alumno = await Alumno.findById(req.params.id);
        if (!alumno) return res.status(404).json({ message: 'Alumno no encontrado' });
        
        const hoy = new Date();
        const fechaSinHora = hoy.setHours(0, 0, 0, 0);
        
        const yaAsistio = alumno.asistencias.some(a => new Date(a).setHours(0, 0, 0, 0) === fechaSinHora);
        if (yaAsistio) {
            return res.status(400).json({ 
                message: `Hola ${alumno.nombre}, ya registraste tu asistencia hoy.`,
                yaAsistio: true 
            });
        }

        alumno.asistencias.push(new Date());

        let mensajeGrad = "";

        // Auto-graduación eliminada (ahora es manual por el profesor)

        await alumno.save();
        res.json({ 
            message: `¡Hola ${alumno.nombre}! Check-in exitoso.`,
            alumno,
            mensajeGrad
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const removeAsistencia = async (req, res) => {
    try {
        const { fecha } = req.body;
        const alumno = await Alumno.findById(req.params.id);
        if (!alumno) return res.status(404).json({ message: 'Alumno no encontrado' });
        
        const fechaParaRemover = new Date(fecha).setHours(0, 0, 0, 0);
        alumno.asistencias = alumno.asistencias.filter(a => new Date(a).setHours(0, 0, 0, 0) !== fechaParaRemover);
        alumno.markModified('asistencias');
        
        // REVERTIR PROMOCIÓN SI LA CANTIDAD DE CLASES CAE POR DEBAJO DE LA META
        if (alumno.historicoGraduaciones && alumno.historicoGraduaciones.length > 0) {
            const ultimoHistorial = alumno.historicoGraduaciones[alumno.historicoGraduaciones.length - 1];
            
            // Re-evaluamos cuántas clases válidas quedan usando la fecha de graduación anterior
            const toLocalStr = (dObj) => {
                const d = new Date(dObj);
                const ld = new Date(d.getTime() + d.getTimezoneOffset() * 60000);
                return `${ld.getFullYear()}-${String(ld.getMonth() + 1).padStart(2, '0')}-${String(ld.getDate()).padStart(2, '0')}`;
            };
            
            const strUgAnterior = ultimoHistorial.ultimaGraduacion ? toLocalStr(ultimoHistorial.ultimaGraduacion) : toLocalStr(alumno.createdAt);
            
            const validasRestantes = alumno.asistencias.filter(iso => toLocalStr(iso) >= strUgAnterior).length;

            const tiemposFajaAnterior = TIEMPOS_GRADUACION[ultimoHistorial.faja] || TIEMPOS_GRADUACION['Branca'];
            const mesesRequeridosAnterior = tiemposFajaAnterior[ultimoHistorial.grado] || 1;
            const clasesParaPromoverAnterior = mesesRequeridosAnterior * CLASES_POR_MES;


            // También validamos el tiempo
            const hoy = new Date();
            const fechaUgAnterior = ultimoHistorial.ultimaGraduacion ? new Date(ultimoHistorial.ultimaGraduacion) : new Date(alumno.createdAt);
            const diasTranscurridos = (hoy - fechaUgAnterior) / (1000 * 60 * 60 * 24);
            const diasRequeridos = mesesRequeridosAnterior * 30;

            if (validasRestantes < clasesParaPromoverAnterior || diasTranscurridos < diasRequeridos) {
                // Revertir a la faja y grado anteriores
                alumno.faja = ultimoHistorial.faja;
                alumno.grado = ultimoHistorial.grado;
                alumno.ultimaGraduacion = ultimoHistorial.ultimaGraduacion || null;
                // Sacar del historial
                alumno.historicoGraduaciones.pop();
            }

        }

        await alumno.save();
        res.json(alumno);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const subirFotoAlumno = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No se proporcionó ninguna imagen" });
        }

        const alumno = await Alumno.findById(req.params.id);
        if (!alumno) return res.status(404).json({ message: "Alumno no encontrado" });

        // Si la imagen viene de Cloudinary, req.file.path tendrá la URL (empieza con http)
        if (req.file.path && req.file.path.startsWith('http')) {
            alumno.fotoUrl = req.file.path;
        } else {
            // Si es local, guardamos solo el nombre del archivo
            alumno.fotoUrl = req.file.filename;
        }
        
        await alumno.save();

        res.json(alumno);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

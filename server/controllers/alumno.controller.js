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
        const alumnoViejo = await Alumno.findById(req.params.id);
        if (!alumnoViejo) return res.status(404).json({ message: 'Alumno no encontrado' });

        if (req.body.ultimaGraduacion === "") {
            req.body.ultimaGraduacion = null;
        } else if (req.body.ultimaGraduacion) {
            req.body.ultimaGraduacion = new Date(req.body.ultimaGraduacion);
        }

        if (req.body.clasesParaGraduacion === null || isNaN(req.body.clasesParaGraduacion)) {
            delete req.body.clasesParaGraduacion;
        }

        const alumnoUpdated = await Alumno.findByIdAndUpdate(req.params.id, req.body, {
            new: true
        });
        res.json(alumnoUpdated);
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
        
        // Solo calcular graduación si el seguimiento está habilitado (por defecto true)
        if (alumno.trackProgreso !== false) {
            // Auto-graduación check
            const tiemposFaja = TIEMPOS_GRADUACION[alumno.faja] || TIEMPOS_GRADUACION['Branca'];
            const mesesRequeridos = (alumno.grado >= 0 && alumno.grado <= 4) ? tiemposFaja[alumno.grado] : 1;
            const requeridasReales = mesesRequeridos * CLASES_POR_MES; // 2 clases por semana = 8 por mes

            
            const hoy = new Date();
            // Si no hay última graduación, usamos la fecha de creación del alumno como punto de partida
            const fechaUg = alumno.ultimaGraduacion ? new Date(alumno.ultimaGraduacion) : new Date(alumno.createdAt);
            const diffTiempo = hoy - fechaUg;
            const diasTranscurridos = diffTiempo / (1000 * 60 * 60 * 24);
            const diasRequeridos = mesesRequeridos * 30;

            const toLocalStr = (dObj) => {
                const d = new Date(dObj);
                const ld = new Date(d.getTime() + d.getTimezoneOffset() * 60000);
                return `${ld.getFullYear()}-${String(ld.getMonth() + 1).padStart(2, '0')}-${String(ld.getDate()).padStart(2, '0')}`;
            };

            const strUg = toLocalStr(fechaUg);
            const validas = alumno.asistencias.filter(iso => toLocalStr(iso) >= strUg).length;

            if (validas >= requeridasReales && diasTranscurridos >= diasRequeridos) {
                // Guardar estado previo antes de promover
                alumno.historicoGraduaciones.push({
                    faja: alumno.faja,
                    grado: alumno.grado,
                    ultimaGraduacion: alumno.ultimaGraduacion,
                    fechaClasePromocion: new Date(fecha)
                });

                if (alumno.grado < 4) {
                    alumno.grado += 1;
                } else {
                    alumno.grado = 0;
                }
                // Actualizamos la fecha de graduación para que el contador de tiempo y clases se reinicie para la siguiente raya
                alumno.ultimaGraduacion = new Date(fecha);
            }
        }


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

        if (alumno.trackProgreso !== false) {
            const tiemposFaja = TIEMPOS_GRADUACION[alumno.faja] || TIEMPOS_GRADUACION['Branca'];
            const mesesRequeridos = (alumno.grado >= 0 && alumno.grado <= 4) ? tiemposFaja[alumno.grado] : 1;
            const requeridasReales = mesesRequeridos * 8;
            
            const hoy = new Date();
            const fechaUg = alumno.ultimaGraduacion ? new Date(alumno.ultimaGraduacion) : new Date(alumno.createdAt);
            const diffTiempo = hoy - fechaUg;
            const diasTranscurridos = diffTiempo / (1000 * 60 * 60 * 24);
            const diasRequeridos = mesesRequeridos * 30;
            
            const toLocalStr = (dObj) => {
                const d = new Date(dObj);
                const ld = new Date(d.getTime() + d.getTimezoneOffset() * 60000);
                return `${ld.getFullYear()}-${String(ld.getMonth() + 1).padStart(2, '0')}-${String(ld.getDate()).padStart(2, '0')}`;
            };

            const strUg = toLocalStr(fechaUg);
            const validas = alumno.asistencias.filter(iso => toLocalStr(iso) >= strUg).length;

            if (validas >= requeridasReales && diasTranscurridos >= diasRequeridos) {
                alumno.historicoGraduaciones.push({
                    faja: alumno.faja,
                    grado: alumno.grado,
                    ultimaGraduacion: alumno.ultimaGraduacion,
                    fechaClasePromocion: new Date()
                });

                if (alumno.grado < 4) {
                    alumno.grado += 1;
                    mensajeGrad = `¡Felicitaciones! Alcanzaste el Grado ${alumno.grado}.`;
                } else {
                    alumno.grado = 0;
                    mensajeGrad = `¡Increíble! Completaste todos los grados de tu faja.`;
                }
                alumno.ultimaGraduacion = new Date();
            }
        }


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

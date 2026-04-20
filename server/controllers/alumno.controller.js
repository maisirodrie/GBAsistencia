import Alumno from '../models/Alumno.js';

export const getAlumnos = async (req, res) => {
    try {
        const hoy = new Date();
        const hoyInicio = new Date(hoy.setHours(0, 0, 0, 0));
        const hoyFin = new Date(hoy.setHours(23, 59, 59, 999));

        const alumnos = await Alumno.aggregate([
            {
                $project: {
                    nombre: 1,
                    apellido: 1,
                    faja: 1,
                    grado: 1,
                    fotoUrl: 1,
                    ultimaGraduacion: 1,
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
                                    $or: [
                                        { $eq: ["$ultimaGraduacion", null] },
                                        { $gte: ["$$asist", "$ultimaGraduacion"] }
                                    ]
                                }
                            }
                        }
                    }
                }
            }
        ]);

        res.json(alumnos);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const createAlumno = async (req, res) => {
    try {
        const { nombre, faja, grado, ultimaGraduacion, clasesParaGraduacion, trackProgreso } = req.body;
        const newAlumno = new Alumno({
            nombre,
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
        res.json(alumno);
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
            const requeridasBase = alumno.clasesParaGraduacion || 30;
            const requeridasReales = requeridasBase * (alumno.grado + 1);
            
            const toLocalStr = (dObj) => {
                const d = new Date(dObj);
                const ld = new Date(d.getTime() + d.getTimezoneOffset() * 60000);
                return `${ld.getFullYear()}-${String(ld.getMonth() + 1).padStart(2, '0')}-${String(ld.getDate()).padStart(2, '0')}`;
            };

            const strUg = alumno.ultimaGraduacion ? toLocalStr(alumno.ultimaGraduacion) : "";
            const validas = strUg 
                ? alumno.asistencias.filter(iso => toLocalStr(iso) >= strUg).length
                : alumno.asistencias.length;

            if (validas >= requeridasReales) {
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
                    alumno.ultimaGraduacion = new Date(fecha);
                }
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
            const requeridasBase = alumno.clasesParaGraduacion || 30;
            const requeridasReales = requeridasBase * (alumno.grado + 1);
            
            const toLocalStr = (dObj) => {
                const d = new Date(dObj);
                const ld = new Date(d.getTime() + d.getTimezoneOffset() * 60000);
                return `${ld.getFullYear()}-${String(ld.getMonth() + 1).padStart(2, '0')}-${String(ld.getDate()).padStart(2, '0')}`;
            };

            const strUg = alumno.ultimaGraduacion ? toLocalStr(alumno.ultimaGraduacion) : "";
            const validas = strUg 
                ? alumno.asistencias.filter(iso => toLocalStr(iso) >= strUg).length
                : alumno.asistencias.length;

            if (validas >= requeridasReales) {
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
                    alumno.ultimaGraduacion = new Date();
                    mensajeGrad = `¡Increíble! Completaste todos los grados de tu faja.`;
                }
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
            
            const strUgAnterior = ultimoHistorial.ultimaGraduacion ? toLocalStr(ultimoHistorial.ultimaGraduacion) : "";
            
            const validasRestantes = strUgAnterior
                ? alumno.asistencias.filter(iso => toLocalStr(iso) >= strUgAnterior).length
                : alumno.asistencias.length;

            const requeridasBase = alumno.clasesParaGraduacion || 30;
            const clasesParaPromoverAnterior = requeridasBase * (ultimoHistorial.grado + 1);

            if (validasRestantes < clasesParaPromoverAnterior) {
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

        // req.file.path contains the Cloudinary secure URL
        alumno.fotoUrl = req.file.path || req.file.filename;
        await alumno.save();

        res.json(alumno);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

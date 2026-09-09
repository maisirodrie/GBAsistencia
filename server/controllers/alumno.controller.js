import Alumno from '../models/Alumno.js';
import DeviceCheckIn from '../models/DeviceCheckIn.js';
import Configuracion from '../models/Configuracion.js';
import { KIOSK_PIN } from '../config.js';
import { calculateDistanceMeters, generateQrToken, verifyQrToken } from '../utils/geoAndToken.js';
import { getFechaInicioFaja, getFechaUltimoGrado, getRequisitosAcumulados, evaluarGraduacion } from '../constants/graduation.js';




export const getAlumnos = async (req, res) => {
    try {
        const alumnosData = await Alumno.find({});
        const hoy = new Date();
        const hoyInicio = new Date(hoy.setHours(0, 0, 0, 0));
        const hoyFin = new Date(hoy.setHours(23, 59, 59, 999));

        const toLocalStr = (dObj) => {
            const d = new Date(dObj);
            const ld = new Date(d.getTime() + d.getTimezoneOffset() * 60000);
            return `${ld.getFullYear()}-${String(ld.getMonth() + 1).padStart(2, '0')}-${String(ld.getDate()).padStart(2, '0')}`;
        };

        const alumnos = alumnosData.map(alumno => {
            const fechaInicioFaja = getFechaInicioFaja(alumno);
            const fechaUltimoGrado = getFechaUltimoGrado(alumno);

            // Invocar el motor de graduación oficial Gracie Barra
            const evaluacion = evaluarGraduacion({
                cinturon_actual: alumno.faja,
                grado_actual: alumno.grado,
                fecha_ultimo_grado: fechaUltimoGrado,
                fecha_inicio_faja: fechaInicioFaja,
                fecha_nacimiento: alumno.fechaNacimiento || alumno.fecha_nacimiento, // Soportar ambas nomenclaturas
                asistencias: alumno.asistencias,
                frecuencia_semanal: alumno.frecuenciaSemanal,
                permanencia_manual: alumno.permanenciaManual,
                clases_para_graduacion: alumno.clasesParaGraduacion,
                dias_para_graduacion: alumno.diasParaGraduacion,
                clases_tramo_manual: alumno.clasesTramoManual
            });

            const yaAsistioHoy = alumno.asistencias.some(a => {
                const ad = new Date(a);
                return ad >= hoyInicio && ad <= hoyFin;
            });

            return {
                _id: alumno._id,
                nombre: alumno.nombre,
                apellido: alumno.apellido,
                dni: alumno.dni || "",
                faja: alumno.faja,
                grado: alumno.grado,
                fotoUrl: alumno.fotoUrl,
                ultimaGraduacion: alumno.ultimaGraduacion,
                createdAt: alumno.createdAt,
                clasesParaGraduacion: alumno.clasesParaGraduacion,
                trackProgreso: alumno.trackProgreso,
                totalAsistencias: alumno.asistencias.length,
                yaAsistioHoy,
                asistenciasDesdeUltimaGrad: evaluacion.clases_acumuladas,
                clasesRequeridas: evaluacion.clases_requeridas,
                mesesRequeridos: Math.round(evaluacion.dias_requeridos / 30),
                diasTranscurridos: evaluacion.dias_transcurridos,
                diasRequeridos: evaluacion.dias_requeridos,
                diasRestantes: evaluacion.dias_restantes,
                clasesRestantes: evaluacion.clases_restantes,
                bloqueo_factor: evaluacion.bloqueo_factor,
                fechaEstimadaPromocion: evaluacion.fecha_estimada_promocion,
                alertasEdad: evaluacion.alertas_edad,
                consistenciaCorrecta: evaluacion.consistenciaCorrecta,
                edad: evaluacion.edad,
                tiempoCumplido: evaluacion.dias_transcurridos >= evaluacion.dias_requeridos,
                clasesCumplidas: evaluacion.clases_acumuladas >= evaluacion.clases_requeridas,
                contadores_visuales: evaluacion.contadores_visuales,
                tieneDeuda: evaluacion.tieneDeuda,
                deudaClases: evaluacion.deudaClases,
                msgDeuda: evaluacion.msgDeuda,
                asistenciasTotalesFaja: evaluacion.asistenciasTotalesFaja
            };
        });

        res.json(alumnos);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const createAlumno = async (req, res) => {
    try {
        const { nombre, apellido, celular, dni, categoria, faja, grado, ultimaGraduacion, clasesParaGraduacion, diasParaGraduacion, trackProgreso, fechaNacimiento, frecuenciaSemanal, permanenciaManual, clasesTramoManual } = req.body;

        const dniLimpio = dni ? dni.toString().replace(/\./g, '').trim() : null;
        if (dniLimpio) {
            const existeDni = await Alumno.findOne({ dni: dniLimpio });
            if (existeDni) {
                return res.status(400).json({ message: `El DNI ${dniLimpio} ya está registrado por ${existeDni.nombre} ${existeDni.apellido}` });
            }
        }

        const newAlumno = new Alumno({
            nombre,
            apellido,
            celular,
            dni: dniLimpio || undefined,
            categoria,
            faja,
            grado,
            clasesParaGraduacion: (clasesParaGraduacion === undefined || clasesParaGraduacion === null || clasesParaGraduacion === "" || isNaN(clasesParaGraduacion)) ? 30 : parseInt(clasesParaGraduacion),
            diasParaGraduacion: (diasParaGraduacion === undefined || diasParaGraduacion === null || diasParaGraduacion === "" || isNaN(diasParaGraduacion)) ? null : parseInt(diasParaGraduacion),
            frecuenciaSemanal: frecuenciaSemanal || 3,
            fechaNacimiento: fechaNacimiento ? new Date(fechaNacimiento) : null,
            trackProgreso: trackProgreso !== undefined ? trackProgreso : true,
            permanenciaManual: null,
            clasesTramoManual: null,
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
            permanencia_manual: alumno.permanenciaManual,
            clases_para_graduacion: alumno.clasesParaGraduacion,
            dias_para_graduacion: alumno.diasParaGraduacion,
            clases_tramo_manual: alumno.clasesTramoManual
        });

        const alumnoEnriquecido = {
            ...alumno.toObject(),
            clasesRequeridas: evaluacion.clases_requeridas,
            mesesRequeridos: Math.round(evaluacion.dias_requeridos / 30),
            asistenciasDesdeUltimaGrad: evaluacion.clases_acumuladas,
            asistenciasPermanencia: evaluacion.clases_acumuladas,
            metaPermanencia: evaluacion.dias_requeridos,
            diasTranscurridos: evaluacion.dias_transcurridos,
            diasRequeridos: evaluacion.dias_requeridos,
            diasRestantes: evaluacion.dias_restantes,
            clasesRestantes: evaluacion.clases_restantes,
            bloqueo_factor: evaluacion.bloqueo_factor,
            fechaEstimadaPromocion: evaluacion.fecha_estimada_promocion,
            alertasEdad: evaluacion.alertas_edad,
            consistenciaCorrecta: evaluacion.consistenciaCorrecta,
            edad: evaluacion.edad,
            tiempoCumplido: evaluacion.dias_transcurridos >= evaluacion.dias_requeridos,
            clasesCumplidas: evaluacion.clases_acumuladas >= evaluacion.clases_requeridas,
            contadores_visuales: evaluacion.contadores_visuales,
            tieneDeuda: evaluacion.tieneDeuda,
            deudaClases: evaluacion.deudaClases,
            msgDeuda: evaluacion.msgDeuda,
            asistenciasTotalesFaja: evaluacion.asistenciasTotalesFaja
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

        const gradoNuevo = req.body.grado !== undefined ? parseInt(req.body.grado) : alumno.grado;
        const fajaNueva = req.body.faja || alumno.faja;

        if (req.body.registrarHistorial === true) {
            alumno.historicoGraduaciones.push({
                faja: fajaNueva, // Store the reached belt
                grado: gradoNuevo, // Store the reached grade
                fajaAnterior: alumno.faja, // Store previous belt for reverts
                gradoAnterior: alumno.grado, // Store previous grade for reverts
                ultimaGraduacion: alumno.ultimaGraduacion || alumno.createdAt,
                fechaClasePromocion: new Date()
            });
            alumno.ultimaGraduacion = new Date();
        } else if (req.body.historicoGraduaciones) {
            alumno.historicoGraduaciones = req.body.historicoGraduaciones;
        }

        if (req.body.registrarHistorial !== true) {
            if (req.body.ultimaGraduacion === "") {
                alumno.ultimaGraduacion = null;
            } else if (req.body.ultimaGraduacion) {
                alumno.ultimaGraduacion = new Date(req.body.ultimaGraduacion);
            }
        }

        if (req.body.nombre) alumno.nombre = req.body.nombre;
        if (req.body.apellido !== undefined) alumno.apellido = req.body.apellido;
        if (req.body.celular !== undefined) alumno.celular = req.body.celular;
        if (req.body.dni !== undefined) {
            const dniLimpio = req.body.dni ? req.body.dni.toString().replace(/\./g, '').trim() : null;
            if (dniLimpio) {
                const existeDni = await Alumno.findOne({ dni: dniLimpio, _id: { $ne: req.params.id } });
                if (existeDni) {
                    return res.status(400).json({ message: `El DNI ${dniLimpio} ya está registrado por ${existeDni.nombre} ${existeDni.apellido}` });
                }
                alumno.dni = dniLimpio;
            } else {
                alumno.dni = undefined;
            }
        }
        if (req.body.categoria) alumno.categoria = req.body.categoria;
        if (req.body.trackProgreso !== undefined) alumno.trackProgreso = req.body.trackProgreso;
        
        if (req.body.clasesParaGraduacion !== undefined) {
            alumno.clasesParaGraduacion = (req.body.clasesParaGraduacion === null || req.body.clasesParaGraduacion === "" || isNaN(req.body.clasesParaGraduacion))
                ? 30
                : parseInt(req.body.clasesParaGraduacion);
        }
        if (req.body.diasParaGraduacion !== undefined) {
            alumno.diasParaGraduacion = (req.body.diasParaGraduacion === null || req.body.diasParaGraduacion === "" || isNaN(req.body.diasParaGraduacion))
                ? null
                : parseInt(req.body.diasParaGraduacion);
        }
        if (req.body.frecuenciaSemanal !== undefined && !isNaN(req.body.frecuenciaSemanal)) {
            alumno.frecuenciaSemanal = req.body.frecuenciaSemanal;
        }
        if (req.body.fechaNacimiento !== undefined) {
            alumno.fechaNacimiento = req.body.fechaNacimiento ? new Date(req.body.fechaNacimiento) : null;
        }
        alumno.permanenciaManual = null;
        alumno.clasesTramoManual = null;

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
        
        alumno.faja = lastHistory.fajaAnterior || lastHistory.faja;
        alumno.grado = lastHistory.gradoAnterior !== undefined ? lastHistory.gradoAnterior : lastHistory.grado;
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
        
        // Ajustar al huso horario de Argentina (UTC-3)
        const clientDate = new Date(fecha || Date.now());
        const dateArg = new Date(clientDate.getTime() - 3 * 60 * 60 * 1000);
        const yyyy = dateArg.getUTCFullYear();
        const mm = dateArg.getUTCMonth();
        const dd = dateArg.getUTCDate();
        const fechaNormalizada = new Date(`${yyyy}-${String(mm + 1).padStart(2, '0')}-${String(dd).padStart(2, '0')}T12:00:00.000Z`);
        
        // Evitar duplicados en el mismo día (comparando año, mes y día exactos en UTC)
        const yaAsistio = alumno.asistencias.some(a => {
            const d = new Date(a);
            return d.getUTCFullYear() === yyyy && d.getUTCMonth() === mm && d.getUTCDate() === dd;
        });
        
        if (yaAsistio) return res.status(400).json({ message: 'Asistencia ya registrada para hoy' });

        alumno.asistencias.push(fechaNormalizada);
        
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
        
        // Obtener la fecha actual ajustando al huso horario de Argentina (UTC-3)
        const hoyLocal = new Date(Date.now() - 3 * 60 * 60 * 1000);
        const yyyy = hoyLocal.getUTCFullYear();
        const mm = String(hoyLocal.getUTCMonth() + 1).padStart(2, '0');
        const dd = String(hoyLocal.getUTCDate()).padStart(2, '0');
        const fechaCheckIn = new Date(`${yyyy}-${mm}-${dd}T12:00:00.000Z`);
        
        // Evitar duplicados comparando año, mes y día en UTC
        const yaAsistio = alumno.asistencias.some(a => {
            const d = new Date(a);
            return d.getUTCFullYear() === yyyy &&
                   (d.getUTCMonth() + 1) === parseInt(mm) &&
                   d.getUTCDate() === parseInt(dd);
        });

        if (yaAsistio) {
            return res.status(400).json({ 
                message: `Hola ${alumno.nombre}, ya registraste tu asistencia hoy.`,
                yaAsistio: true 
            });
        }

        alumno.asistencias.push(fechaCheckIn);

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
        
        // Ajustar al huso horario de Argentina (UTC-3)
        const clientDate = new Date(fecha || Date.now());
        const dateArg = new Date(clientDate.getTime() - 3 * 60 * 60 * 1000);
        const yyyy = dateArg.getUTCFullYear();
        const mm = dateArg.getUTCMonth();
        const dd = dateArg.getUTCDate();
        
        // Filtrar quitando el día coincidente en UTC
        alumno.asistencias = alumno.asistencias.filter(a => {
            const d = new Date(a);
            return !(d.getUTCFullYear() === yyyy && d.getUTCMonth() === mm && d.getUTCDate() === dd);
        });
        
        alumno.markModified('asistencias');
        
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

export const checkInByDni = async (req, res) => {
    try {
        const { dni, deviceId, deviceFingerprint, isKiosk, kioskPin, coords, qrToken } = req.body;
        if (!dni || dni.toString().trim() === '') {
            return res.status(400).json({ message: 'Por favor, ingresá tu número de DNI.' });
        }

        const dniLimpio = dni.toString().replace(/\./g, '').trim();

        // Buscar alumno por DNI (limpio o con puntos)
        const alumno = await Alumno.findOne({ 
            $or: [
                { dni: dniLimpio },
                { dni: dni.toString().trim() }
            ]
        });

        if (!alumno) {
            return res.status(404).json({ 
                message: 'No encontramos ningún alumno registrado con este DNI. Consultá con tu profesor en recepción.' 
            });
        }

        // Obtener la fecha actual ajustando al huso horario de Argentina (UTC-3)
        const hoyLocal = new Date(Date.now() - 3 * 60 * 60 * 1000);
        const yyyy = hoyLocal.getUTCFullYear();
        const mm = String(hoyLocal.getUTCMonth() + 1).padStart(2, '0');
        const dd = String(hoyLocal.getUTCDate()).padStart(2, '0');
        const fechaStr = `${yyyy}-${mm}-${dd}`;
        const fechaCheckIn = new Date(`${fechaStr}T12:00:00.000Z`);

        // Validar si está en modo Kiosco verificado con el PIN configurado en la base de datos
        const config = await Configuracion.findOne();
        const actualPin = (config?.kioskPin || KIOSK_PIN || '1234').toString().trim();
        const isKioskMode = Boolean(isKiosk && kioskPin && kioskPin.toString().trim() === actualPin);

        // 1. Verificación de Token QR de Pantalla (si proviene de pantalla rotativa)
        let tokenVerified = false;
        if (qrToken) {
            tokenVerified = verifyQrToken(qrToken);
            if (!tokenVerified) {
                return res.status(400).json({
                    isQrExpired: true,
                    message: 'Este código QR de pantalla ha caducado o fue reenviado. Por favor, escaneá el código actualizado que se muestra en la pantalla del dojo.'
                });
            }
        }

        // 2. Verificación de Geolocalización GPS (para el cartel impreso en la pared)
        // Solo se exige si no proviene de un token de pantalla en vivo verificado y no es modo kiosco
        if (!isKioskMode && !tokenVerified) {
            if (config && config.gpsObligatorio && config.dojoLat && config.dojoLng) {

                if (!coords || typeof coords.lat !== 'number' || typeof coords.lng !== 'number') {
                    return res.status(400).json({
                        isLocationRequired: true,
                        message: 'Se requiere tu ubicación GPS para verificar que estás presente en el dojo. Por favor, permití el acceso a la ubicación en tu celular.'
                    });
                }

                const distanciaMetros = calculateDistanceMeters(coords.lat, coords.lng, config.dojoLat, config.dojoLng);
                const radioPermitido = config.dojoRadioMetros || 200;

                if (distanciaMetros > radioPermitido) {
                    const distTexto = distanciaMetros >= 1000 
                        ? `${(distanciaMetros / 1000).toFixed(1)} km` 
                        : `${distanciaMetros} metros`;
                    return res.status(403).json({
                        isOutOfRange: true,
                        distanciaMetros,
                        message: `Estás fuera del radio de la academia (a ${distTexto}). Por normas de seguridad, la asistencia debe registrarse presencialmente en el dojo.`
                    });
                }
            }
        }

        // 3. Control antifraude: 1 dispositivo físico por día (salvo modo Kiosco)
        // Se valida tanto por el deviceId (localStorage) como por la huella de hardware (deviceFingerprint)
        if (!isKioskMode && (deviceId || deviceFingerprint)) {
            const orConditions = [];
            if (deviceId) orConditions.push({ deviceId });
            if (deviceFingerprint) orConditions.push({ deviceFingerprint });

            const checkInExistente = await DeviceCheckIn.findOne({ 
                fecha: fechaStr,
                $or: orConditions
            });

            if (checkInExistente && checkInExistente.alumnoId.toString() !== alumno._id.toString()) {
                return res.status(403).json({
                    isDeviceLocked: true,
                    registradoPara: checkInExistente.alumnoNombre,
                    message: `Este dispositivo ya registró la asistencia de hoy para ${checkInExistente.alumnoNombre}. Por normas de la academia, cada alumno debe registrar su presente desde su propio celular.`
                });
            }
        }

        // Evitar duplicados comparando año, mes y día en UTC
        const yaAsistio = alumno.asistencias.some(a => {
            const d = new Date(a);
            return d.getUTCFullYear() === yyyy &&
                   (d.getUTCMonth() + 1) === parseInt(mm) &&
                   d.getUTCDate() === parseInt(dd);
        });

        if (yaAsistio) {
            // Asegurar que quede registrado el dispositivo para este alumno en el día
            if (!isKioskMode && (deviceId || deviceFingerprint)) {
                const orConditions = [];
                if (deviceId) orConditions.push({ deviceId });
                if (deviceFingerprint) orConditions.push({ deviceFingerprint });

                await DeviceCheckIn.findOneAndUpdate(
                    { fecha: fechaStr, $or: orConditions },
                    { 
                        deviceId: deviceId || 'unknown', 
                        deviceFingerprint: deviceFingerprint || 'unknown',
                        alumnoId: alumno._id, 
                        alumnoNombre: `${alumno.nombre} ${alumno.apellido}`.trim(), 
                        fecha: fechaStr 
                    },
                    { upsert: true, new: true }
                ).catch(() => {});
            }

            return res.json({ 
                alreadyCheckedIn: true,
                fecha: fechaStr,
                message: `¡Hola ${alumno.nombre}! Tu asistencia de hoy ya fue registrada previamente.`,
                alumno: {
                    _id: alumno._id,
                    nombre: alumno.nombre,
                    apellido: alumno.apellido,
                    faja: alumno.faja,
                    grado: alumno.grado,
                    categoria: alumno.categoria,
                    fotoUrl: alumno.fotoUrl
                }
            });
        }

        alumno.asistencias.push(fechaCheckIn);
        await alumno.save();

        // Registrar uso de este dispositivo para este alumno hoy
        if (!isKioskMode && (deviceId || deviceFingerprint)) {
            const orConditions = [];
            if (deviceId) orConditions.push({ deviceId });
            if (deviceFingerprint) orConditions.push({ deviceFingerprint });

            await DeviceCheckIn.findOneAndUpdate(
                { fecha: fechaStr, $or: orConditions },
                { 
                    deviceId: deviceId || 'unknown', 
                    deviceFingerprint: deviceFingerprint || 'unknown',
                    alumnoId: alumno._id, 
                    alumnoNombre: `${alumno.nombre} ${alumno.apellido}`.trim(), 
                    fecha: fechaStr 
                },
                { upsert: true, new: true }
            ).catch(err => console.warn('DeviceCheckIn error:', err.message));
        }

        return res.json({ 
            alreadyCheckedIn: false,
            fecha: fechaStr,
            message: `¡Presente confirmado! Bienvenido ${alumno.nombre}.`,
            alumno: {
                _id: alumno._id,
                nombre: alumno.nombre,
                apellido: alumno.apellido,
                faja: alumno.faja,
                grado: alumno.grado,
                categoria: alumno.categoria,
                fotoUrl: alumno.fotoUrl
            }
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

/* ── Generar Token para Código QR Rotativo (Pantalla en Vivo) ── */
export const getQrToken = async (req, res) => {
    try {
        const token = generateQrToken(45); // 45 segundos de validez
        res.json({ token, expiresIn: 45 });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/* ── Obtener Configuración de Ubicación del Dojo ── */
export const getDojoLocation = async (req, res) => {
    try {
        let config = await Configuracion.findOne();
        if (!config) config = await Configuracion.create({});
        res.json({
            dojoDireccion: config.dojoDireccion || 'Av. Tomás Guido 1745, Posadas, Misiones',
            dojoLat: config.dojoLat,
            dojoLng: config.dojoLng,
            dojoRadioMetros: config.dojoRadioMetros || 200,
            gpsObligatorio: config.gpsObligatorio !== false,
            kioskPin: config.kioskPin || KIOSK_PIN || '1234'
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/* ── Guardar / Calibrar Ubicación del Dojo y PIN ── */
export const setDojoLocation = async (req, res) => {
    try {
        const { lat, lng, radius, gpsObligatorio, kioskPin, direccion } = req.body;
        let config = await Configuracion.findOne();
        if (!config) config = new Configuracion();

        if (direccion) config.dojoDireccion = direccion.trim();
        if (lat != null && lng != null) {
            config.dojoLat = Number(lat);
            config.dojoLng = Number(lng);
        }
        if (radius != null) {
            config.dojoRadioMetros = Number(radius);
        }
        if (gpsObligatorio !== undefined) {
            config.gpsObligatorio = Boolean(gpsObligatorio);
        }
        if (kioskPin != null && kioskPin.toString().trim() !== '') {
            config.kioskPin = kioskPin.toString().trim();
        }

        await config.save();
        res.json({
            message: 'Configuración actualizada con éxito.',
            config: {
                dojoDireccion: config.dojoDireccion,
                dojoLat: config.dojoLat,
                dojoLng: config.dojoLng,
                dojoRadioMetros: config.dojoRadioMetros,
                gpsObligatorio: config.gpsObligatorio,
                kioskPin: config.kioskPin
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/* ── Verificar PIN de Profesor (Modo Recepción) ── */
export const verifyKioskPin = async (req, res) => {
    try {
        const { pin } = req.body;
        let config = await Configuracion.findOne();
        const validPin = (config?.kioskPin || KIOSK_PIN || '1234').toString().trim();

        if (pin && pin.toString().trim() === validPin) {
            return res.json({ valid: true, message: 'PIN verificado correctamente.' });
        }
        return res.status(401).json({ valid: false, message: 'PIN incorrecto. Solicitá el PIN al profesor.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};



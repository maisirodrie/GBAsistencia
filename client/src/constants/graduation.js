export const REGLAS_GRACIE_BARRA = {
    ADULTOS: {
        'Branca': {
            tramos: {
                0: { dias: 30, clases: 8 },    // G0 -> G1 (1 mes)
                1: { dias: 30, clases: 8 },    // G1 -> G2 (1 mes)
                2: { dias: 60, clases: 16 },   // G2 -> G3 (2 meses)
                3: { dias: 122, clases: 32 },  // G3 -> G4 (4 meses)
                4: { dias: 122, clases: 32 }   // G4 -> Azul (4 meses)
            }
        },
        'Azul': {
            tramos: {
                0: { dias: 122, clases: 32 },  // G0 -> G1 (4 meses)
                1: { dias: 152, clases: 40 },  // G1 -> G2 (5 meses)
                2: { dias: 152, clases: 40 },  // G2 -> G3 (5 meses)
                3: { dias: 152, clases: 40 },  // G3 -> G4 (5 meses)
                4: { dias: 152, clases: 40 }   // G4 -> Morado (5 meses)
            }
        },
        'Roxa': {
            tramos: {
                0: { dias: 91, clases: 24 },   // G0 -> G1 (3 meses)
                1: { dias: 91, clases: 24 },   // G1 -> G2 (3 meses)
                2: { dias: 122, clases: 32 },  // G2 -> G3 (4 meses)
                3: { dias: 122, clases: 32 },  // G3 -> G4 (4 meses)
                4: { dias: 122, clases: 32 }   // G4 -> Marrón (4 meses)
            }
        },
        'Marrom': {
            tramos: {
                0: { dias: 91, clases: 24 },   // G0 -> G1 (3 meses)
                1: { dias: 91, clases: 24 },   // G1 -> G2 (3 meses)
                2: { dias: 122, clases: 32 },  // G2 -> G3 (4 meses)
                3: { dias: 122, clases: 32 },  // G3 -> G4 (4 meses)
                4: { dias: 122, clases: 32 }   // G4 -> Negro (4 meses)
            }
        },
        'Preta': {
            defaultTramo: { dias: 1095, clases: 300 } // Preta
        }
    },
    KIDS: {
        defaultTramo: { dias: 122, clases: 32 },
        cinturones: {
            'Cinza e Branca': { edadMin: 4, edadMax: 15, grupo: 'Grupo Gris (Cinza)' },
            'Cinza': { edadMin: 4, edadMax: 15, grupo: 'Grupo Gris (Cinza)' },
            'Cinza e Preta': { edadMin: 4, edadMax: 15, grupo: 'Grupo Gris (Cinza)' },
            'Amarela e Branca': { edadMin: 7, edadMax: 15, grupo: 'Grupo Amarillo (Amarelo)' },
            'Amarela': { edadMin: 7, edadMax: 15, grupo: 'Grupo Amarillo (Amarelo)' },
            'Amarela e Preta': { edadMin: 7, edadMax: 15, grupo: 'Grupo Amarillo (Amarelo)' },
            'Laranja e Branca': { edadMin: 10, edadMax: 15, grupo: 'Grupo Naranja (Laranja)' },
            'Laranja': { edadMin: 10, edadMax: 15, grupo: 'Grupo Naranja (Laranja)' },
            'Laranja e Preta': { edadMin: 10, edadMax: 15, grupo: 'Grupo Naranja (Laranja)' },
            'Verde e Branca': { edadMin: 13, edadMax: 15, grupo: 'Grupo Verde' },
            'Verde': { edadMin: 13, edadMax: 15, grupo: 'Grupo Verde' },
            'Verde e Preta': { edadMin: 13, edadMax: 15, grupo: 'Grupo Verde' },
            'Branca': { edadMin: 4, edadMax: 15, grupo: 'Blanco Kids' }
        }
    }
};

export const EDADES_MINIMAS = {
    'Azul': 18,
    'Roxa': 16,
    'Marrom': 18,
    'Preta': 19
};

export const getFechaInicioFaja = (alumno) => {
    if (!alumno) return new Date();
    
    const currentFaja = alumno.faja || 'Branca';
    const history = alumno.historicoGraduaciones || [];
    
    // 1. Look for the first history entry that has the current belt.
    // Its `ultimaGraduacion` is the date they got that belt.
    const currentBeltEntries = history.filter(h => h.faja === currentFaja);
    if (currentBeltEntries.length > 0) {
        const sorted = [...currentBeltEntries].sort((a, b) => new Date(a.fechaClasePromocion) - new Date(b.fechaClasePromocion));
        if (sorted[0].ultimaGraduacion) {
            return new Date(sorted[0].ultimaGraduacion);
        }
    }
    
    // 2. If we don't find it, look for the last entry of a different belt.
    // The `fechaClasePromocion` of that entry is the promotion date to the current belt.
    if (history.length > 0) {
        const sortedDiff = history
            .filter(h => h.faja !== currentFaja)
            .sort((a, b) => new Date(b.fechaClasePromocion) - new Date(a.fechaClasePromocion));
        if (sortedDiff.length > 0 && sortedDiff[0].fechaClasePromocion) {
            return new Date(sortedDiff[0].fechaClasePromocion);
        }
    }
    
    // 3. Fallback: Find the oldest between createdAt and the oldest attendance
    const created = alumno.createdAt ? new Date(alumno.createdAt) : new Date();
    if (alumno.asistencias && alumno.asistencias.length > 0) {
        const dates = alumno.asistencias.map(a => new Date(a).getTime());
        const oldestAttendance = new Date(Math.min(...dates));
        if (oldestAttendance < created) {
            return oldestAttendance;
        }
    }
    
    return created;
};

export const getFechaUltimoGrado = (alumno) => {
    if (!alumno) return new Date();
    return new Date(alumno.ultimaGraduacion || alumno.createdAt || new Date());
};

export const getMetaBaseObligatoria = (faja, grado) => {
    let key = faja || 'Branca';
    if (typeof key === 'string') {
        key = key.trim();
        key = key.charAt(0).toUpperCase() + key.slice(1).toLowerCase();
    }
    if (key === 'Blanco') key = 'Branca';
    if (key === 'Morado') key = 'Roxa';
    if (key === 'Marron') key = 'Marrom';
    if (key === 'Negra') key = 'Preta';

    const gNum = Number(grado) || 0;
    
    if (gNum === 0) return 0;

    if (key === 'Branca') {
        if (gNum === 1) return 32;
        if (gNum === 2) return 72;
        if (gNum === 3) return 112;
        if (gNum === 4) return 152;
    } else if (['Azul', 'Roxa', 'Marrom'].includes(key)) {
        if (gNum === 1) return 120;
        if (gNum === 2) return 180;
        if (gNum === 3) return 240;
        if (gNum === 4) return 300;
    }
    
    return 0;
};

export const evaluarGraduacion = ({
    cinturon_actual,
    grado_actual,
    fecha_ultimo_grado,
    fecha_inicio_faja,
    fecha_nacimiento,
    asistencias,
    frecuencia_semanal
}) => {
    const hoy = new Date();
    const nac = fecha_nacimiento ? new Date(fecha_nacimiento) : new Date(hoy.getFullYear() - 20, 0, 1);
    let edad = hoy.getFullYear() - nac.getFullYear();
    const m = hoy.getMonth() - nac.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) {
        edad--;
    }

    const alertas_edad = [];
    let isKids = edad < 16;
    let consistenciaCorrecta = true;

    let fajaKey = cinturon_actual || 'Branca';
    if (typeof fajaKey === 'string') {
        fajaKey = fajaKey.trim();
        fajaKey = fajaKey.charAt(0).toUpperCase() + fajaKey.slice(1).toLowerCase();
    }
    if (fajaKey === 'Blanco') fajaKey = 'Branca';
    if (fajaKey === 'Morado') fajaKey = 'Roxa';
    if (fajaKey === 'Marron') fajaKey = 'Marrom';
    if (fajaKey === 'Negra') fajaKey = 'Preta';

    if (edad >= 16) {
        if (REGLAS_GRACIE_BARRA.KIDS.cinturones[fajaKey] && fajaKey !== 'Branca') {
            alertas_edad.push({
                tipo: 'MIGRACION',
                mensaje: `El alumno cumplió 16 años (Edad actual: ${edad} años) y tiene cinturón infantil (${cinturon_actual}). Se debe migrar manualmente al sistema de Adultos (Cinturón Blanco o Azul).`
            });
            isKids = false;
        }
    } else {
        const cinturonKids = REGLAS_GRACIE_BARRA.KIDS.cinturones[fajaKey];
        if (cinturonKids) {
            if (edad < cinturonKids.edadMin || edad > cinturonKids.edadMax) {
                consistenciaCorrecta = false;
                alertas_edad.push({
                    tipo: 'INCONSISTENCIA',
                    mensaje: `Inconsistencia de Edad: El alumno infantil tiene ${edad} años pero posee el cinturón '${cinturon_actual}' (${cinturonKids.grupo}), el cual está permitido únicamente de ${cinturonKids.edadMin} a ${cinturonKids.edadMax} años.`
                });
            }
        }
    }

    // 1. Calcular frecuencia semanal real basada en las asistencias de los últimos 30 días
    let frecuenciaSemanalReal = frecuencia_semanal || 2; // valor de mitigación default / parametrizado
    if (asistencias && asistencias.length > 0) {
        const hoyMs = hoy.getTime();
        const hace30diasMs = hoyMs - (30 * 24 * 60 * 60 * 1000);
        const asistenciasUltimoMes = asistencias.filter(a => {
            const t = new Date(a).getTime();
            return t >= hace30diasMs && t <= hoyMs;
        });

        const fechasValidasMs = asistencias.map(a => new Date(a).getTime());
        const primeraAsistenciaMs = Math.min(...fechasValidasMs);
        const baseMs = fecha_ultimo_grado ? new Date(fecha_ultimo_grado).getTime() : primeraAsistenciaMs;

        const tiempoTranscurridoMs = hoyMs - Math.min(baseMs, primeraAsistenciaMs);
        const diasPosibles = Math.min(30, Math.max(7, Math.floor(tiempoTranscurridoMs / (1000 * 60 * 60 * 24))));
        const semanas = diasPosibles / 7;

        if (semanas > 0) {
            const calculada = asistenciasUltimoMes.length / semanas;
            // Si la frecuencia calculada es inferior al mínimo requerido de 2 clases por semana,
            // o a la frecuencia configurada por el alumno, tomamos el mayor para la proyección.
            frecuenciaSemanalReal = Math.max(frecuencia_semanal || 2.0, parseFloat(calculada.toFixed(2)));
        }
    }

    // 2. Filtrar y ordenar asistencias del cinturón actual (desde fecha_inicio_faja)
    let fechaInicioFaja = fecha_inicio_faja ? new Date(fecha_inicio_faja) : null;
    if (!fechaInicioFaja && fecha_ultimo_grado) {
        fechaInicioFaja = new Date(fecha_ultimo_grado);
    }
    if (!fechaInicioFaja) {
        fechaInicioFaja = new Date(hoy.getFullYear() - 1, 0, 1);
    }

    const formatLocalDate = (dateVal) => {
        if (!dateVal) return "";
        const d = new Date(dateVal);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const r = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${r}`;
    };

    const strInicioFaja = formatLocalDate(fechaInicioFaja);
    const asistenciasFaja = (asistencias || [])
        .filter(a => formatLocalDate(a) >= strInicioFaja)
        .sort((a, b) => new Date(a) - new Date(b));

    const asistenciasTotalesFaja = asistenciasFaja.length;

    // 3. Obtener requisitos del tramo actual y del tramo anterior
    const reqs = getRequisitosAcumulados(fajaKey, grado_actual);
    const reqDias = reqs.dias;
    const reqClases = reqs.clases;

    let reqClasesAnterior = 0;
    if (grado_actual > 0) {
        reqClasesAnterior = getRequisitosAcumulados(fajaKey, grado_actual - 1).clases;
    } else {
        // Para grado 0, el tramo técnico anterior o inicial es el mismo tramo de grado 1
        reqClasesAnterior = reqClases;
    }

    const metaBaseObligatoria = getMetaBaseObligatoria(fajaKey, grado_actual);

    // 4. Evaluar la Máquina de Estados
    let estado_secuencial = 1;
    let tieneDeuda = false;
    let deudaClases = 0;
    let msgDeuda = "";
    let clases_acumuladas = 0;
    let dias_transcurridos = 0;
    let bloqueo_factor = "Ninguno";
    let elegible = false;
    let contadores_visuales = {};
    let fecha_estimada_promocion = null;

    // ESTADO 1: HACIA GRADO 1 (El alumno está en Grado 0 y no ha completado el tramo inicial de asistencias)
    if (grado_actual === 0 && asistenciasTotalesFaja < reqClases) {
        estado_secuencial = 1;
        clases_acumuladas = asistenciasTotalesFaja;
        
        const diffTime = Math.max(0, hoy.getTime() - fecha_ultimo_grado.getTime());
        dias_transcurridos = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        const clases_restantes = Math.max(0, reqClases - clases_acumuladas);
        const dias_restantes = Math.max(0, reqDias - dias_transcurridos);

        const tiempoCumplido = dias_transcurridos >= reqDias;
        const clasesCumplidas = clases_acumuladas >= reqClases;

        elegible = tiempoCumplido && clasesCumplidas;

        if (elegible) {
            bloqueo_factor = "Ninguno";
        } else if (!tiempoCumplido && clasesCumplidas) {
            bloqueo_factor = "Bloqueado por Tiempo";
        } else if (tiempoCumplido && !clasesCumplidas) {
            bloqueo_factor = "Bloqueado por Asistencias";
        } else {
            bloqueo_factor = "Bloqueado por Ambas";
        }

        contadores_visuales = {
            grado: {
                acumuladas: clases_acumuladas,
                requeridas: reqClases,
                porcentaje: Math.min(100, Math.round((clases_acumuladas / reqClases) * 100))
            },
            permanencia: {
                acumuladas: asistenciasTotalesFaja,
                requeridas: getMetaBaseObligatoria(fajaKey, 1),
                porcentaje: Math.min(100, Math.round((asistenciasTotalesFaja / getMetaBaseObligatoria(fajaKey, 1)) * 100))
            }
        };

        const diasPorClases = Math.ceil((clases_restantes / frecuenciaSemanalReal) * 7);
        const diasAdicionales = Math.max(dias_restantes, diasPorClases);
        const fechaProyectada = new Date(hoy.getTime() + (diasAdicionales * 24 * 60 * 60 * 1000));
        fecha_estimada_promocion = fechaProyectada.toISOString().split('T')[0];
    }
    // ESTADO 2: PERMANENCIA EN GRADO Z (Deuda de permanencia de asistencia en la faja activa)
    else if (asistenciasTotalesFaja < metaBaseObligatoria) {
        estado_secuencial = 2;
        tieneDeuda = true;
        deudaClases = metaBaseObligatoria - asistenciasTotalesFaja;
        msgDeuda = `🥋 Faltan ${deudaClases} clases físicas para completar la base de la faja.`;

        clases_acumuladas = 0; // Forzado a cero
        dias_transcurridos = 0; // Forzado a cero
        bloqueo_factor = "Bloqueado por Permanencia de Asistencia";
        elegible = false;

        const clasesAcumuladasGrado = Math.min(reqClasesAnterior, asistenciasTotalesFaja);
        contadores_visuales = {
            grado: {
                acumuladas: clasesAcumuladasGrado,
                requeridas: reqClasesAnterior,
                porcentaje: Math.round((clasesAcumuladasGrado / reqClasesAnterior) * 100)
            },
            permanencia: {
                acumuladas: asistenciasTotalesFaja,
                requeridas: metaBaseObligatoria,
                porcentaje: Math.round((asistenciasTotalesFaja / metaBaseObligatoria) * 100)
            }
        };

        // CORRECCIÓN: Cálculo de proyección basado únicamente en las clases de deuda sin sumar reqClases ni reqDias del tramo posterior
        const diasAdicionales = Math.ceil((deudaClases / frecuenciaSemanalReal) * 7);
        const fechaProyectada = new Date(hoy.getTime() + (diasAdicionales * 24 * 60 * 60 * 1000));
        fecha_estimada_promocion = fechaProyectada.toISOString().split('T')[0];
    }
    // ESTADO 3: HACIA GRADO Z (Reseteo absoluto y tramo activo)
    else {
        estado_secuencial = 3;
        
        clases_acumuladas = asistenciasTotalesFaja - metaBaseObligatoria;
        
        let fechaInicioTramo = fecha_ultimo_grado ? new Date(fecha_ultimo_grado) : new Date();
        if (metaBaseObligatoria > 0 && asistenciasFaja.length >= metaBaseObligatoria) {
            const classClearDebt = new Date(asistenciasFaja[metaBaseObligatoria - 1]);
            if (classClearDebt > fechaInicioTramo) {
                fechaInicioTramo = classClearDebt;
            }
        }

        const diffTime = Math.max(0, hoy.getTime() - fechaInicioTramo.getTime());
        dias_transcurridos = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        const clases_restantes = Math.max(0, reqClases - clases_acumuladas);
        const dias_restantes = Math.max(0, reqDias - dias_transcurridos);

        const tiempoCumplido = dias_transcurridos >= reqDias;
        const clasesCumplidas = clases_acumuladas >= reqClases;

        elegible = tiempoCumplido && clasesCumplidas;

        if (elegible) {
            bloqueo_factor = "Ninguno";
        } else if (!tiempoCumplido && clasesCumplidas) {
            bloqueo_factor = "Bloqueado por Tiempo";
        } else if (tiempoCumplido && !clasesCumplidas) {
            bloqueo_factor = "Bloqueado por Asistencias";
        } else {
            bloqueo_factor = "Bloqueado por Ambas";
        }

        contadores_visuales = {
            grado: {
                acumuladas: clases_acumuladas,
                requeridas: reqClases,
                porcentaje: Math.min(100, Math.round((clases_acumuladas / reqClases) * 100))
            },
            permanencia: {
                acumuladas: dias_transcurridos,
                requeridas: reqDias,
                porcentaje: Math.min(100, Math.round((dias_transcurridos / reqDias) * 100))
            }
        };

        if (elegible) {
            fecha_estimada_promocion = new Date(hoy).toISOString().split('T')[0];
        } else {
            const diasPorClases = Math.ceil((clases_restantes / frecuenciaSemanalReal) * 7);
            const diasAdicionales = Math.max(dias_restantes, diasPorClases);
            const fechaProyectada = new Date(hoy.getTime() + (diasAdicionales * 24 * 60 * 60 * 1000));
            fecha_estimada_promocion = fechaProyectada.toISOString().split('T')[0];
        }
    }

    return {
        elegible,
        estado_secuencial,
        tieneDeuda,
        deudaClases,
        msgDeuda,
        dias_transcurridos,
        dias_requeridos: reqDias,
        dias_restantes: tieneDeuda ? 0 : Math.max(0, reqDias - dias_transcurridos),
        clases_acumuladas,
        clases_requeridas: reqClases,
        clases_restantes: tieneDeuda ? 0 : Math.max(0, reqClases - clases_acumuladas),
        bloqueo_factor,
        fecha_estimada_promocion,
        alertas_edad,
        consistenciaCorrecta,
        edad,
        frecuencia_semanal_real: frecuenciaSemanalReal,
        contadores_visuales,
        asistenciasTotalesFaja,
        msgAlertaDeuda: tieneDeuda ? `🥋 Faltan ${deudaClases} clases físicas para completar la base de la faja.` : ""
    };
};

export const getRequisitosAcumulados = (faja, grado) => {
    let key = faja || 'Branca';
    if (typeof key === 'string') {
        key = key.trim();
        key = key.charAt(0).toUpperCase() + key.slice(1).toLowerCase();
    }
    if (key === 'Blanco') key = 'Branca';
    if (key === 'Morado') key = 'Roxa';
    if (key === 'Marron') key = 'Marrom';
    if (key === 'Negra') key = 'Preta';

    let isKids = !!REGLAS_GRACIE_BARRA.KIDS.cinturones[key];
    const gNum = Number(grado) || 0;
    
    let clases = 32;
    let dias = 122;

    if (isKids) {
        clases = 32;
        dias = 122;
    } else {
        const reglasAdulto = REGLAS_GRACIE_BARRA.ADULTOS[key] || REGLAS_GRACIE_BARRA.ADULTOS['Branca'];
        if (reglasAdulto.tramos && reglasAdulto.tramos[gNum] !== undefined) {
            const tr = reglasAdulto.tramos[gNum];
            clases = tr.clases;
            dias = tr.dias;
        } else if (reglasAdulto.defaultTramo) {
            clases = reglasAdulto.defaultTramo.clases;
            dias = reglasAdulto.defaultTramo.dias;
        }
    }

    return { clases, dias, meses: Math.round(dias / 30) };
};

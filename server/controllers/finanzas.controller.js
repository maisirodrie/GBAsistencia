import Transaccion from '../models/Transaccion.js';
import Configuracion from '../models/Configuracion.js';
import Alumno from '../models/Alumno.js';

/* ── Helper: Obtenemos (o creamos) la configuración global ── */
async function getConfig() {
    let config = await Configuracion.findOne();
    if (!config) config = await Configuracion.create({});
    return config;
}

/* ── GET /api/finanzas/configuracion ── */
export const getConfiguracion = async (req, res) => {
    try {
        const config = await getConfig();
        res.json(config);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/* ── PUT /api/finanzas/configuracion ── */
export const updateConfiguracion = async (req, res) => {
    try {
        let config = await Configuracion.findOne();
        if (!config) config = new Configuracion();
        const { precioMembresia, porcentajeRecargo, diaCierreCobranza, moneda } = req.body;
        if (precioMembresia != null) config.precioMembresia = precioMembresia;
        if (porcentajeRecargo != null) config.porcentajeRecargo = porcentajeRecargo;
        if (diaCierreCobranza != null) config.diaCierreCobranza = diaCierreCobranza;
        if (moneda) config.moneda = moneda;
        await config.save();
        res.json(config);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/* ── GET /api/finanzas/resumen?mes=2026-03 ── */
export const getResumen = async (req, res) => {
    try {
        const mesParam = req.query.mes; // e.g. "2026-03"
        let fechaInicio, fechaFin;
        if (mesParam) {
            const [anio, mes] = mesParam.split('-').map(Number);
            fechaInicio = new Date(anio, mes - 1, 1);
            fechaFin = new Date(anio, mes, 0, 23, 59, 59);
        } else {
            const now = new Date();
            fechaInicio = new Date(now.getFullYear(), now.getMonth(), 1);
            fechaFin = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        }

        const transacciones = await Transaccion.find({
            fecha: { $gte: fechaInicio, $lte: fechaFin }
        }).populate('alumnoId', 'nombre apellido').sort({ fecha: -1 });

        const totalIngresos = transacciones
            .filter(t => t.tipo === 'INGRESO')
            .reduce((sum, t) => sum + t.monto, 0);

        const totalEgresos = transacciones
            .filter(t => t.tipo === 'EGRESO')
            .reduce((sum, t) => sum + t.monto, 0);

        res.json({
            totalIngresos,
            totalEgresos,
            gananciaNeta: totalIngresos - totalEgresos,
            transacciones
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/* ── GET /api/finanzas/transacciones ── */
export const getTransacciones = async (req, res) => {
    try {
        const transacciones = await Transaccion.find()
            .populate('alumnoId', 'nombre apellido')
            .sort({ fecha: -1 })
            .limit(200);
        res.json(transacciones);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/* ── POST /api/finanzas/transaccion ── (ingreso o egreso manual) */
export const crearTransaccion = async (req, res) => {
    try {
        const { tipo, categoria, monto, descripcion, fecha, alumnoId } = req.body;
        // Convertir alumnoId vacío a null para evitar error de BSON Cast
        const alumnoIdSafe = alumnoId && alumnoId.trim() !== '' ? alumnoId : null;
        const t = await Transaccion.create({ tipo, categoria, monto, descripcion, fecha, alumnoId: alumnoIdSafe });
        const populated = await t.populate('alumnoId', 'nombre apellido');
        res.status(201).json(populated);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

/* ── DELETE /api/finanzas/transaccion/:id ── */
export const eliminarTransaccion = async (req, res) => {
    try {
        await Transaccion.findByIdAndDelete(req.params.id);
        res.json({ message: 'Eliminada' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/* ── POST /api/finanzas/pagar-membresia ── */
export const pagarMembresia = async (req, res) => {
    try {
        const { alumnoId, periodo } = req.body; // periodo: "2026-03"
        const config = await getConfig();

        // Calcular si hay recargo
        const hoy = new Date();
        const diaHoy = hoy.getDate();
        const hayRecargo = diaHoy > config.diaCierreCobranza;
        const montoPago = hayRecargo
            ? config.precioMembresia * (1 + config.porcentajeRecargo / 100)
            : config.precioMembresia;

        const alumno = await Alumno.findById(alumnoId);
        if (!alumno) return res.status(404).json({ message: 'Alumno no encontrado' });

        // Verificar si ya pagó ese período
        const yaPago = await Transaccion.findOne({
            alumnoId,
            categoria: 'Membresía',
            periodoMembresia: periodo
        });
        if (yaPago) {
            return res.status(409).json({ message: `El alumno ya tiene pagada la membresía de ${periodo}` });
        }

        const t = await Transaccion.create({
            tipo: 'INGRESO',
            categoria: 'Membresía',
            monto: Math.round(montoPago),
            descripcion: `Membresía ${periodo} - ${alumno.nombre} ${alumno.apellido || ''}`.trim() + (hayRecargo ? ` (+${config.porcentajeRecargo}% mora)` : ''),
            alumnoId,
            periodoMembresia: periodo,
            tuvoRecargo: hayRecargo,
            fecha: hoy
        });

        const populated = await t.populate('alumnoId', 'nombre apellido');
        res.status(201).json({ transaccion: populated, tuvoRecargo: hayRecargo, montoFinal: Math.round(montoPago) });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/* ── GET /api/finanzas/estado-membresias?periodo=2026-03 ── */
export const getEstadoMembresias = async (req, res) => {
    try {
        const periodo = req.query.periodo;
        if (!periodo) return res.status(400).json({ message: 'Falta el parámetro periodo' });

        const pagos = await Transaccion.find({ categoria: 'Membresía', periodoMembresia: periodo });
        const pagosPorAlumno = {};
        for (const pago of pagos) {
            pagosPorAlumno[String(pago.alumnoId)] = pago;
        }

        const alumnos = await Alumno.find({}, 'nombre apellido faja grado fotoUrl');
        const resultado = alumnos.map(a => ({
            alumno: a,
            pago: pagosPorAlumno[String(a._id)] || null
        }));

        res.json(resultado);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

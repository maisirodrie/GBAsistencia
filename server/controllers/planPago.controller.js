import PlanPago from '../models/PlanPago.js';
import Transaccion from '../models/Transaccion.js';
import Producto from '../models/Producto.js';
import VentaProducto from '../models/VentaProducto.js';

/* ── GET /api/planes/todos ── Obtener todos los planes del dojo */
export const getTodosPlanes = async (req, res) => {
    try {
        const planes = await PlanPago.find()
            .populate('productoId', 'nombre categoria precio')
            .populate('alumnoId', 'nombre apellido')
            .sort({ createdAt: -1 });
        res.json(planes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/* ── GET /api/planes/:alumnoId ── */
export const getPlanesAlumno = async (req, res) => {
    try {
        const planes = await PlanPago.find({ alumnoId: req.params.alumnoId })
            .populate('productoId', 'nombre categoria precio')
            .sort({ createdAt: -1 });
        res.json(planes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/* ── POST /api/planes ── Crear nuevo plan de pago */
export const crearPlan = async (req, res) => {
    try {
        const { alumnoId, productoId, descripcion, montoTotal, notas } = req.body;
        const productoIdSafe = productoId && productoId.trim() !== '' ? productoId : null;

        // Si hay un producto vinculado:
        // 1. Verificar y descontar stock
        // 2. Crear un registro en VentaProducto (para historial y gráficos)
        if (productoIdSafe) {
            const producto = await Producto.findById(productoIdSafe);
            if (!producto) return res.status(404).json({ message: 'Producto no encontrado' });
            if (producto.stock < 1) {
                return res.status(409).json({ message: `Sin stock disponible para "${producto.nombre}"` });
            }

            // Descontar stock
            producto.stock -= 1;
            await producto.save();

            // Registrar en VentaProducto (con nota indicando que es a cuotas)
            await VentaProducto.create({
                productoId: productoIdSafe,
                alumnoId,
                cantidad: 1,
                precioUnitario: Number(montoTotal),
                montoTotal: Number(montoTotal),
                nota: `A cuotas${notas ? ' · ' + notas : ''}`,
                fecha: new Date()
            });
        }

        const plan = await PlanPago.create({ alumnoId, productoId: productoIdSafe, descripcion, montoTotal, notas });
        const populated = await plan.populate('productoId', 'nombre categoria precio');
        res.status(201).json(populated);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

/* ── POST /api/planes/:id/pagar ── Registrar un pago parcial */
export const pagarCuota = async (req, res) => {
    try {
        const { monto, nota } = req.body;
        const plan = await PlanPago.findById(req.params.id).populate('alumnoId', 'nombre apellido');
        if (!plan) return res.status(404).json({ message: 'Plan no encontrado' });

        const montoNum = Number(monto);
        if (montoNum <= 0) return res.status(400).json({ message: 'Monto inválido' });

        // Registrar pago en el historial del plan
        plan.pagos.push({ monto: montoNum, nota: nota || '', fecha: new Date() });
        plan.montoPagado += montoNum;

        // Auto-completar si se saldó
        const estaCompleto = plan.montoPagado >= plan.montoTotal;
        if (estaCompleto) plan.estado = 'completado';

        await plan.save();

        // Generar transacción financiera por esta cuota
        const alumnoNombre = `${plan.alumnoId.nombre} ${plan.alumnoId.apellido || ''}`.trim();
        await Transaccion.create({
            tipo: 'INGRESO',
            categoria: 'Artículo',
            monto: montoNum,
            descripcion: `Cuota: ${plan.descripcion} — ${alumnoNombre}${nota ? ' · ' + nota : ''}${estaCompleto ? ' (✅ SALDADO)' : ''}`,
            alumnoId: plan.alumnoId._id,
            fecha: new Date()
        });

        const populated = await plan.populate('productoId', 'nombre categoria precio');
        res.json(populated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/* ── DELETE /api/planes/:id ── Cancelar plan y reponer stock */
export const cancelarPlan = async (req, res) => {
    try {
        const plan = await PlanPago.findById(req.params.id);
        if (!plan) return res.status(404).json({ message: 'Plan no encontrado' });

        // Si el plan tenía un producto y estaba pendiente → reponer stock
        if (plan.productoId && plan.estado === 'pendiente') {
            await Producto.findByIdAndUpdate(plan.productoId, { $inc: { stock: 1 } });
        }

        plan.estado = 'cancelado';
        await plan.save();
        res.json({ message: 'Plan cancelado y stock repuesto' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

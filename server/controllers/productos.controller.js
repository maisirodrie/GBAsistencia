import Producto from '../models/Producto.js';
import VentaProducto from '../models/VentaProducto.js';
import Transaccion from '../models/Transaccion.js';

/* ── GET /api/productos ── */
export const getProductos = async (req, res) => {
    try {
        const productos = await Producto.find({ activo: true }).sort({ categoria: 1, nombre: 1 });
        res.json(productos);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/* ── GET /api/productos/todos ── (incluyendo inactivos) */
export const getTodosProductos = async (req, res) => {
    try {
        const productos = await Producto.find().sort({ categoria: 1, nombre: 1 });
        res.json(productos);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/* ── POST /api/productos ── */
export const crearProducto = async (req, res) => {
    try {
        const producto = await Producto.create(req.body);
        res.status(201).json(producto);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

/* ── PUT /api/productos/:id ── */
export const updateProducto = async (req, res) => {
    try {
        const producto = await Producto.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!producto) return res.status(404).json({ message: 'Producto no encontrado' });
        res.json(producto);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

/* ── DELETE /api/productos/:id ── (soft delete) */
export const deleteProducto = async (req, res) => {
    try {
        await Producto.findByIdAndUpdate(req.params.id, { activo: false });
        res.json({ message: 'Producto desactivado' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/* ── GET /api/productos/ventas ── historial de ventas */
export const getVentas = async (req, res) => {
    try {
        const ventas = await VentaProducto.find()
            .populate('productoId', 'nombre categoria')
            .populate('alumnoId', 'nombre apellido fotoUrl')
            .sort({ fecha: -1 })
            .limit(200);
        res.json(ventas);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/* ── POST /api/productos/vender ── Registrar venta, descontar stock, generar transacción */
export const venderProducto = async (req, res) => {
    try {
        const { productoId, alumnoId, cantidad = 1, nota, detalleGraduacion } = req.body;

        const producto = await Producto.findById(productoId);
        if (!producto) return res.status(404).json({ message: 'Producto no encontrado' });
        if (producto.stock < cantidad) {
            return res.status(409).json({ message: `Stock insuficiente. Disponible: ${producto.stock}` });
        }

        const alumnoIdSafe = alumnoId && alumnoId.trim() !== '' ? alumnoId : null;
        const montoTotal = producto.precio * cantidad;

        // 1. Descontar stock
        producto.stock -= cantidad;
        await producto.save();

        // 2. Registrar venta
        const venta = await VentaProducto.create({
            productoId,
            alumnoId: alumnoIdSafe,
            cantidad,
            precioUnitario: producto.precio,
            montoTotal,
            nota,
            detalleGraduacion,
            fecha: new Date()
        });

        // 3. Generar transacción financiera automáticamente
        let descripcionTx = `${producto.nombre}${cantidad > 1 ? ` x${cantidad}` : ''}`;
        if (nota) descripcionTx += ` · ${nota}`;

        await Transaccion.create({
            tipo: 'INGRESO',
            categoria: producto.categoria === 'Certificado/Graduación' ? 'Certificado/Graduación' : 'Artículo',
            monto: montoTotal,
            descripcion: descripcionTx,
            alumnoId: alumnoIdSafe,
            fecha: new Date()
        });

        const populated = await venta.populate([
            { path: 'productoId', select: 'nombre categoria' },
            { path: 'alumnoId', select: 'nombre apellido fotoUrl' }
        ]);

        res.status(201).json({ venta: populated, stockRestante: producto.stock });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/* ── PUT /api/productos/:id/stock ── Ajuste manual de stock */
export const ajustarStock = async (req, res) => {
    try {
        const { stock } = req.body;
        const producto = await Producto.findByIdAndUpdate(req.params.id, { stock }, { new: true });
        if (!producto) return res.status(404).json({ message: 'Producto no encontrado' });
        res.json(producto);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

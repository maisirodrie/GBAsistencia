import { Router } from 'express';
import {
    getProductos,
    getTodosProductos,
    crearProducto,
    updateProducto,
    deleteProducto,
    getVentas,
    venderProducto,
    ajustarStock
} from '../controllers/productos.controller.js';
import { hasRole } from '../middlewares/validateToken.js';

const router = Router();
const isGestion = hasRole(['Admin', 'Encargado']);

// Aplicamos el permiso a todas las rutas de este módulo
// Note: router.use(isGestion) could still work here because this router is isolated now,
// but applying it to routes is slightly more explicit.
router.get('/', isGestion, getProductos);
router.get('/todos', isGestion, getTodosProductos);
router.get('/ventas', isGestion, getVentas);
router.post('/', isGestion, crearProducto);
router.put('/:id', isGestion, updateProducto);
router.delete('/:id', isGestion, deleteProducto);
router.put('/:id/stock', isGestion, ajustarStock);
router.post('/vender', isGestion, venderProducto);

export default router;

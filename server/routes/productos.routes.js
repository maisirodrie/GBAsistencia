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

const router = Router();

router.get('/productos', getProductos);
router.get('/productos/todos', getTodosProductos);
router.get('/productos/ventas', getVentas);
router.post('/productos', crearProducto);
router.put('/productos/:id', updateProducto);
router.delete('/productos/:id', deleteProducto);
router.put('/productos/:id/stock', ajustarStock);
router.post('/productos/vender', venderProducto);

export default router;

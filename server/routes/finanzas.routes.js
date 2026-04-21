import { Router } from 'express';
import {
    getConfiguracion,
    updateConfiguracion,
    getResumen,
    getTransacciones,
    crearTransaccion,
    eliminarTransaccion,
    pagarMembresia,
    getEstadoMembresias
} from '../controllers/finanzas.controller.js';
import { hasRole } from '../middlewares/validateToken.js';

const router = Router();
const isFinanzas = hasRole(['Admin', 'Encargado']);

// Aplicamos el permiso de finanzas a todas las rutas de este módulo
router.get('/configuracion', isFinanzas, getConfiguracion);
router.put('/configuracion', isFinanzas, updateConfiguracion);
router.get('/resumen', isFinanzas, getResumen);
router.get('/transacciones', isFinanzas, getTransacciones);
router.post('/transaccion', isFinanzas, crearTransaccion);
router.delete('/transaccion/:id', isFinanzas, eliminarTransaccion);
router.post('/pagar-membresia', isFinanzas, pagarMembresia);
router.get('/estado-membresias', isFinanzas, getEstadoMembresias);

export default router;

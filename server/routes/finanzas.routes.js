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

const router = Router();

router.get('/finanzas/configuracion', getConfiguracion);
router.put('/finanzas/configuracion', updateConfiguracion);
router.get('/finanzas/resumen', getResumen);
router.get('/finanzas/transacciones', getTransacciones);
router.post('/finanzas/transaccion', crearTransaccion);
router.delete('/finanzas/transaccion/:id', eliminarTransaccion);
router.post('/finanzas/pagar-membresia', pagarMembresia);
router.get('/finanzas/estado-membresias', getEstadoMembresias);

export default router;

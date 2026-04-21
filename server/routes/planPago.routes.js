import { Router } from 'express';
import { getPlanesAlumno, getTodosPlanes, crearPlan, pagarCuota, cancelarPlan } from '../controllers/planPago.controller.js';
import { hasRole } from '../middlewares/validateToken.js';

const router = Router();
const isFinanzas = hasRole(['Admin', 'Encargado']);

// Los planes son parte del módulo financiero
router.get('/todos', isFinanzas, getTodosPlanes);
router.get('/:alumnoId', isFinanzas, getPlanesAlumno);
router.post('/', isFinanzas, crearPlan);
router.post('/:id/pagar', isFinanzas, pagarCuota);
router.delete('/:id', isFinanzas, cancelarPlan);

export default router;

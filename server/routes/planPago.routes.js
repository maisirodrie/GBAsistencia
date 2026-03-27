import { Router } from 'express';
import { getPlanesAlumno, getTodosPlanes, crearPlan, pagarCuota, cancelarPlan } from '../controllers/planPago.controller.js';

const router = Router();

router.get('/planes/todos', getTodosPlanes);
router.get('/planes/:alumnoId', getPlanesAlumno);
router.post('/planes', crearPlan);
router.post('/planes/:id/pagar', pagarCuota);
router.delete('/planes/:id', cancelarPlan);

export default router;

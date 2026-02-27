import { Router } from 'express';
import {
    getAlumnos,
    createAlumno,
    getAlumno,
    updateAlumno,
    deleteAlumno,
    addAsistencia,
    removeAsistencia
} from '../controllers/alumno.controller.js';

const router = Router();

router.get('/alumnos', getAlumnos);
router.post('/alumnos', createAlumno);
router.get('/alumnos/:id', getAlumno);
router.put('/alumnos/:id', updateAlumno);
router.delete('/alumnos/:id', deleteAlumno);
router.post('/alumnos/:id/asistencia', addAsistencia);
router.delete('/alumnos/:id/asistencia', removeAsistencia);

export default router;

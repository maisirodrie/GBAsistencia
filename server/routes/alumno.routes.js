import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import {
    getAlumnos,
    createAlumno,
    getAlumno,
    updateAlumno,
    deleteAlumno,
    addAsistencia,
    removeAsistencia,
    subirFotoAlumno,
    checkIn
} from '../controllers/alumno.controller.js';
import { generarCartaoPDF } from '../controllers/pdf.controller.js';

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
    }
});
const upload = multer({ storage: storage });

const router = Router();

router.get('/alumnos', getAlumnos);
router.post('/alumnos', createAlumno);
router.get('/alumnos/:id', getAlumno);
router.get('/alumnos/:id/pdf', generarCartaoPDF);
router.put('/alumnos/:id', updateAlumno);
router.delete('/alumnos/:id', deleteAlumno);
router.post('/alumnos/:id/asistencia', addAsistencia);
router.delete('/alumnos/:id/asistencia', removeAsistencia);
router.post('/alumnos/:id/foto', upload.single('foto'), subirFotoAlumno);
router.post('/alumnos/:id/checkin', checkIn);

export default router;

import { Router } from 'express';
import {
    getAlumnos,
    createAlumno,
    getAlumno,
    updateAlumno,
    deleteAlumno,
    subirFotoAlumno,
    generarCartaoPDF,
    addAsistencia,
    removeAsistencia,
    checkIn
} from '../controllers/alumno.controller.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración de multer básica
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../uploads'))
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
    }
});

const upload = multer({ storage: storage });

import { hasRole, isAdmin } from '../middlewares/validateToken.js';

const router = Router();
const isGestion = hasRole(['Admin', 'Encargado']);

router.get('/', getAlumnos);
router.post('/', isGestion, createAlumno);
router.get('/:id', getAlumno);
router.get('/:id/pdf', generarCartaoPDF);
router.put('/:id', isGestion, updateAlumno);
router.delete('/:id', isAdmin, deleteAlumno);
router.post('/:id/asistencia', addAsistencia);
router.delete('/:id/asistencia', removeAsistencia);
router.post('/:id/foto', isGestion, upload.single('foto'), subirFotoAlumno);
router.post('/:id/checkin', checkIn);

export default router;

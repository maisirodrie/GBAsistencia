import { Router } from 'express';
import {
    getAlumnos,
    createAlumno,
    getAlumno,
    updateAlumno,
    deleteAlumno,
    subirFotoAlumno,
    addAsistencia,
    removeAsistencia,
    checkIn
} from '../controllers/alumno.controller.js';
import { generarCartaoPDF } from '../controllers/pdf.controller.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } from '../config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurar Cloudinary si hay credenciales
if (CLOUDINARY_CLOUD_NAME) {
    cloudinary.config({
        cloud_name: CLOUDINARY_CLOUD_NAME,
        api_key: CLOUDINARY_API_KEY,
        api_secret: CLOUDINARY_API_SECRET
    });
}

// Configuración de multer (Cloudinary o LocalFallback)
const storage = CLOUDINARY_CLOUD_NAME 
    ? new CloudinaryStorage({
        cloudinary: cloudinary,
        params: {
            folder: 'gbasistencia_profiles',
            allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        },
    })
    : multer.diskStorage({
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
const isGestion = hasRole(['Admin', 'Encargado', 'Profesor', 'Ayudante']);

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

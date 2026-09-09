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
    revertPromotion,
    checkIn,
    checkInByDni,
    getQrToken,
    getDojoLocation,
    setDojoLocation,
    verifyKioskPin
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

import { validateToken, hasRole, isAdmin } from '../middlewares/validateToken.js';

const router = Router();
const isGestion = hasRole(['Admin', 'Encargado', 'Profesor', 'Ayudante']);
const isEncargadoOrAdmin = hasRole(['Admin', 'Encargado']);

// ==========================================
// RUTAS PÚBLICAS (Alumnos, Check-in por QR/DNI)
// No requieren sesión de profesor / admin
// ==========================================
router.post('/checkin-dni', checkInByDni);
router.get('/qr-token', getQrToken);
router.get('/dojo-location', getDojoLocation);
router.post('/verify-pin', verifyKioskPin);
router.post('/:id/checkin', checkIn);
router.get('/:id', getAlumno);


// ==========================================
// RUTAS PRIVADAS (Gestión del Dojo)
// Requieren inicio de sesión con token válido
// ==========================================
router.get('/', validateToken, getAlumnos);
router.post('/dojo-location', validateToken, isGestion, setDojoLocation);
router.post('/', validateToken, isGestion, createAlumno);

router.get('/:id/pdf', validateToken, generarCartaoPDF);
router.put('/:id', validateToken, isGestion, updateAlumno);
router.delete('/:id', validateToken, isEncargadoOrAdmin, deleteAlumno);
router.post('/:id/asistencia', validateToken, addAsistencia);
router.delete('/:id/asistencia', validateToken, removeAsistencia);
router.post('/:id/revert-promotion', validateToken, isGestion, revertPromotion);
router.post('/:id/foto', validateToken, isGestion, upload.single('foto'), subirFotoAlumno);

export default router;

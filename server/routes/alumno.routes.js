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

import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

// Cloudinary configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'alumnos',
        allowed_formats: ['jpg', 'png', 'jpeg'],
        transformation: [{ width: 500, height: 500, crop: 'limit' }]
    },
});

const upload = multer({ storage: storage });

import { validateToken, hasRole, isAdmin } from '../middlewares/validateToken.js';

const router = Router();
const isGestion = hasRole(['Admin', 'Encargado']);

router.get('/alumnos', getAlumnos);
router.post('/alumnos', isGestion, createAlumno);
router.get('/alumnos/:id', getAlumno);
router.get('/alumnos/:id/pdf', generarCartaoPDF);
router.put('/alumnos/:id', isGestion, updateAlumno);
router.delete('/alumnos/:id', isAdmin, deleteAlumno);
router.post('/alumnos/:id/asistencia', addAsistencia);
router.delete('/alumnos/:id/asistencia', removeAsistencia);
router.post('/alumnos/:id/foto', isGestion, upload.single('foto'), subirFotoAlumno);
router.post('/alumnos/:id/checkin', checkIn);

export default router;

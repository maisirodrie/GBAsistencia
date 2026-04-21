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
const isStaff = validateToken; // Todos los logueados
const isGestion = hasRole(['Admin', 'Encargado']);

router.get('/alumnos', isStaff, getAlumnos);
router.post('/alumnos', isStaff, isGestion, createAlumno);
router.get('/alumnos/:id', isStaff, getAlumno);
router.get('/alumnos/:id/pdf', isStaff, generarCartaoPDF);
router.put('/alumnos/:id', isStaff, isGestion, updateAlumno);
router.delete('/alumnos/:id', isStaff, isAdmin, deleteAlumno);
router.post('/alumnos/:id/asistencia', isStaff, addAsistencia);
router.delete('/alumnos/:id/asistencia', isStaff, removeAsistencia);
router.post('/alumnos/:id/foto', isStaff, isGestion, upload.single('foto'), subirFotoAlumno);
router.post('/alumnos/:id/checkin', isStaff, checkIn);

export default router;

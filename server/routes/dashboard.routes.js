import { Router } from 'express';
import { getStats } from '../controllers/dashboard.controller.js';

const router = Router();

// Accesible para todos los logueados (la lógica de qué mostrar se maneja dentro del controlador)
router.get('/stats', getStats);

export default router;

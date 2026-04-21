import { Router } from 'express';
import { getStats } from '../controllers/dashboard.controller.js';
import { validateToken } from '../middlewares/validateToken.js';

const router = Router();

router.get('/dashboard/stats', getStats);

export default router;

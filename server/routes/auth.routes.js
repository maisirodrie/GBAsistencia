import { Router } from 'express';
import { 
    login, 
    register, 
    logout, 
    verifyToken, 
    changePassword, 
    forgotPassword, 
    resetPassword 
} from '../controllers/auth.controller.js';
import { validateToken, isAdmin } from '../middlewares/validateToken.js';

const router = Router();

router.post('/register', validateToken, isAdmin, register); // Solo admins pueden registrar
router.post('/login', login);
router.post('/logout', logout);
router.get('/verify', verifyToken);
router.post('/change-password', validateToken, changePassword);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;

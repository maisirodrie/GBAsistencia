import { Router } from 'express';
import { 
    login, 
    register, 
    logout, 
    verifyToken, 
    changePassword, 
    forgotPassword, 
    resetPassword,
    getUsers,
    deleteUser
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

// Rutas de administración de usuarios (solo Admins)
router.get('/users', validateToken, isAdmin, getUsers);
router.delete('/users/:id', validateToken, isAdmin, deleteUser);

export default router;

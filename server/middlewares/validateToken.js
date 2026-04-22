import jwt from 'jsonwebtoken';
import { TOKEN_SECRET } from '../config.js';

export const validateToken = (req, res, next) => {
    let token = req.cookies?.token;
    
    // Fallback if missing (for mobile devices, cross-site tracking prevention)
    const authHeader = req.headers['authorization'];
    if (!token && authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    }
    
    console.log("ValidateToken - Token presente:", !!token);

    if (!token) {
        console.log("No token found in cookies or headers");
        return res.status(401).json({ message: "La sesión ha expirado o no existe el token" });
    }

    jwt.verify(token, TOKEN_SECRET, (err, user) => {
        if (err) {
            console.log(`[AUTH] Fallo en verificación de token: ${err.message}`);
            const errorMsg = err.name === 'TokenExpiredError' ? "Tu sesión ha expirado" : "Error de autenticación";
            return res.status(403).json({ message: errorMsg, code: err.name });
        }

        req.user = user;
        next();
    });
};

export const hasRole = (rolesAllowed) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: "No autenticado" });
        }
        
        if (!rolesAllowed.includes(req.user.role)) {
            console.log(`[AUTH] Acceso denegado: Usuario ${req.user.id} con rol '${req.user.role}' intentó acceder a ruta para [${rolesAllowed.join(', ')}]`);
            return res.status(403).json({ 
                message: `No tienes permisos suficientes para realizar esta acción.` 
            });
        }
        next();
    };
};

export const isAdmin = hasRole(['Admin']);

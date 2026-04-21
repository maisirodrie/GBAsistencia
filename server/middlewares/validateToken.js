import jwt from 'jsonwebtoken';
import { TOKEN_SECRET } from '../config.js';

export const validateToken = (req, res, next) => {
    const { token } = req.cookies;
    console.log("ValidateToken - Cookies:", req.cookies);

    if (!token) {
        console.log("No token found in cookies");
        return res.status(401).json({ message: "La sesión ha expirado o no existe el token" });
    }

    jwt.verify(token, TOKEN_SECRET, (err, user) => {
        if (err) {
            console.log("Token verification failed:", err.message);
            return res.status(403).json({ message: "Token inválido" });
        }

        req.user = user;
        next();
    });
};

export const hasRole = (rolesAllowed) => {
    return (req, res, next) => {
        if (!req.user || !rolesAllowed.includes(req.user.role)) {
            return res.status(403).json({ 
                message: `Acceso denegado. Se requiere uno de los siguientes roles: ${rolesAllowed.join(', ')}` 
            });
        }
        next();
    };
};

export const isAdmin = hasRole(['Admin']);

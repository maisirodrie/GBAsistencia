import jwt from 'jsonwebtoken';
import { TOKEN_SECRET } from '../config.js';

export const createAccessToken = (payload) => {
    return new Promise((resolve, reject) => {
        jwt.sign(
            payload,
            process.env.TOKEN_SECRET || 'some_secret_key', // Usando la variable de entorno o fallback
            {
                expiresIn: "1d"
            },
            (err, token) => {
                if (err) reject(err);
                resolve(token);
            }
        );
    });
};

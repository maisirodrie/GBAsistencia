// server/utils/geoAndToken.js
import crypto from 'crypto';
import { TOKEN_SECRET } from '../config.js';

/**
 * Calcula la distancia en metros entre dos puntos geográficos (Fórmula Haversine).
 */
export function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Radio de la Tierra en metros
    const rad = Math.PI / 180;
    const dLat = (lat2 - lat1) * rad;
    const dLon = (lon2 - lon1) * rad;
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * 
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
}

/**
 * Genera un token firmado con HMAC-SHA256 para el QR rotativo en pantalla (válido por 60 segs).
 */
export function generateQrToken(validSeconds = 60) {
    const now = Date.now();
    const exp = now + validSeconds * 1000;
    const payload = `${now}:${exp}`;
    const hmac = crypto.createHmac('sha256', TOKEN_SECRET).update(payload).digest('hex').substring(0, 32);
    return Buffer.from(`${payload}:${hmac}`).toString('base64url');
}

/**
 * Verifica si un token de QR rotativo es auténtico y no ha caducado.
 */
export function verifyQrToken(tokenString) {
    if (!tokenString || typeof tokenString !== 'string') return false;
    try {
        const decoded = Buffer.from(tokenString, 'base64url').toString('utf8');
        const parts = decoded.split(':');
        if (parts.length !== 3) return false;
        const [nowStr, expStr, signature] = parts;
        const payload = `${nowStr}:${expStr}`;
        const expectedHmac = crypto.createHmac('sha256', TOKEN_SECRET).update(payload).digest('hex').substring(0, 32);
        
        if (signature !== expectedHmac) return false;

        const exp = parseInt(expStr, 10);
        // Permitimos una ventana de gracia de 30 segundos extra por latencias de red
        if (Date.now() > exp + 30000) {
            return false; // Expirado
        }

        return true;
    } catch {
        return false;
    }
}

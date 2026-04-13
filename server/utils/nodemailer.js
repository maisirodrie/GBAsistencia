import dotenv from 'dotenv';
import { EMAIL_USER, EMAIL_PASS, EMAIL_HOST, EMAIL_PORT, EMAIL_SECURE } from '../config.js';

dotenv.config();

const emailFrom = process.env.EMAIL_FROM || EMAIL_USER;

/**
 * sendEmail - Envía un correo usando la API REST de Brevo (v3).
 * Es mucho más fiable en servidores cloud que el SMTP tradicional.
 */
export const sendEmail = async (to, subject, html) => {
    try {
        console.log(`[BREVO-API] Intentando enviar email a: ${to}`);
        
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': EMAIL_PASS?.replace(/\s+/g, ''), // Usamos el password como API Key
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                sender: {
                    name: "GB ASISTENTE",
                    email: emailFrom
                },
                to: [{ email: to }],
                subject: subject,
                htmlContent: html
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("[BREVO-API] Error de respuesta:", data);
            throw new Error(data.message || "Error desconocido en la API de Brevo");
        }

        console.log("[BREVO-API] ÉXITO:", data.messageId || "Email enviado");
        return { messageId: data.messageId };
    } catch (error) {
        console.error("[BREVO-API] Error enviando email:", error.message);
        throw error;
    }
};


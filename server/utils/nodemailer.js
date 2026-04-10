import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { EMAIL_USER, EMAIL_PASS } from '../config.js';

dotenv.config();

const user = EMAIL_USER;
const passRaw = EMAIL_PASS || '';
const pass = passRaw.replace(/\s+/g, '');

// Transportador optimizado para Gmail (Modo Servicio)
export const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: user,
        pass: pass,
    },
    tls: {
        rejectUnauthorized: false
    }
});

export const sendEmail = async (to, subject, html) => {
    try {
        const mailOptions = {
            from: `"GB ASISTENTE" <${user}>`,
            to,
            subject,
            html
        };
        const info = await transporter.sendMail(mailOptions);
        console.log("Email enviado: ", info.messageId);
        return info;
    } catch (error) {
        console.error("Error enviando email: ", error);
        throw error;
    }
};

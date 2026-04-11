import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { EMAIL_USER, EMAIL_PASS, EMAIL_HOST, EMAIL_PORT, EMAIL_SECURE } from '../config.js';

dotenv.config();

const emailFrom = process.env.EMAIL_FROM || EMAIL_USER;

// Transportador usando Brevo SMTP (funciona desde servidores cloud como Render)
export const transporter = nodemailer.createTransport({
    host: EMAIL_HOST,
    port: parseInt(EMAIL_PORT, 10),
    secure: EMAIL_SECURE === 'true',  // false para puerto 587 (STARTTLS), true para 465
    auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS?.replace(/\s+/g, ''),
    },
    tls: {
        rejectUnauthorized: false
    }
});

export const sendEmail = async (to, subject, html) => {
    try {
        const mailOptions = {
            from: `"GB ASISTENTE" <${emailFrom}>`,
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


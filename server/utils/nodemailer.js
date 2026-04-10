import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Creamos el transportador optimizado para Gmail en la nube
export const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS ? process.env.EMAIL_PASS.replace(/\s+/g, '') : '',
    },
    tls: {
        rejectUnauthorized: false
    }
});

export const sendEmail = async (to, subject, html) => {
    try {
        const mailOptions = {
            from: `"GB ASISTENTE" <${process.env.EMAIL_USER}>`,
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

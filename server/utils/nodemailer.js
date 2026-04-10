import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

export const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // false para puerto 587
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
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

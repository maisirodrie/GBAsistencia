import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT, 10) || 465,
    secure: process.env.EMAIL_SECURE === 'true' || true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    tls: {
        rejectUnauthorized: false
    }
});

const testInvitation = async () => {
    const nombre = 'Prueba';
    const apellido = 'Sistema';
    const dni = '12345678';
    const tempPassword = 'PASSWORD_TEST_123';
    const FRONTEND_URL = process.env.FRONTEND_URL || 'https://gbasistencia.vercel.app';

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
            <div style="background-color: #be123c; padding: 20px; text-align: center;">
                <img src="https://gbasistencia.vercel.app/logo-gb.png" alt="GB ASISTENTE" style="width: 80px; height: auto;">
            </div>
            <div style="padding: 40px 20px; color: #1e293b; line-height: 1.6;">
                <h2 style="color: #9f1239; margin-top: 0; text-align: center;">¡Bienvenido/a a GB ASISTENTE!</h2>
                <p>Estimado/a <strong>${nombre} ${apellido}</strong>,</p>
                <p>Se han generado tus credenciales para acceder al sistema de gestión de la academia <strong>Gracie Barra</strong>.</p>
                
                <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 25px 0; border-left: 4px solid #be123c;">
                    <p style="margin: 0; font-size: 14px; text-transform: uppercase; color: #64748b; font-weight: bold;">Tus datos de acceso:</p>
                    <p style="margin: 10px 0 0 0;"><strong>DNI:</strong> ${dni}</p>
                    <p style="margin: 5px 0 0 0;"><strong>Contraseña Temporal:</strong> ${tempPassword}</p>
                </div>

                <div style="text-align: center; margin-top: 35px;">
                    <a href="${FRONTEND_URL}/login" style="background-color: #be123c; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                        ENTRAR AL SISTEMA
                    </a>
                </div>
            </div>
        </div>
    `;

    try {
        console.log('Enviando invitación de prueba a:', process.env.EMAIL_USER);
        const info = await transporter.sendMail({
            from: `"GB ASISTENTE" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER,
            subject: 'Prueba de Invitación Completa',
            html
        });
        console.log('✅ Éxito:', info.messageId);
    } catch (error) {
        console.error('❌ Error detallado:', error);
    }
};

testInvitation();

import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const DESTINO = 'maxi8_5@hotmail.com'; // ← tu hotmail para la prueba

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS?.replace(/\s+/g, ''),
    },
    tls: { rejectUnauthorized: false }
});

console.log(`📧 Enviando email de prueba a: ${DESTINO}`);
console.log(`📤 Desde: ${process.env.EMAIL_USER}`);

try {
    const info = await transporter.sendMail({
        from: `"GB ASISTENTE" <${process.env.EMAIL_USER}>`,
        to: DESTINO,
        subject: '✅ Prueba de correo - GB ASISTENTE',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 2px solid #be123c; border-radius: 12px;">
                <h2 style="color: #be123c; text-align: center;">Prueba de Correo 🥋</h2>
                <p>Este es un correo de prueba del sistema <strong>GB ASISTENTE</strong>.</p>
                <p>Si estás leyendo esto, el sistema de correo funciona correctamente hacia Hotmail/Outlook.</p>
                <hr style="border-color: #e2e8f0; margin: 20px 0;">
                <p style="color: #64748b; font-size:12px;">Correo generado: ${new Date().toLocaleString('es-AR')}</p>
            </div>
        `
    });
    console.log('✅ ÉXITO - Email enviado:', info.messageId);
    console.log('📬 Revisa la bandeja de entrada Y spam de:', DESTINO);
} catch (error) {
    console.error('❌ ERROR al enviar:', error.message);
    console.error('Detalle completo:', error);
}

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

// ── DATOS DEL USUARIO A REENVIAR ─────────────────────────────────────────────
const TARGET_EMAIL = 'maxi8_5@hotmail.com';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://gbasistencia.vercel.app';
// ─────────────────────────────────────────────────────────────────────────────

const generateRandomPassword = (length = 12) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+';
    let password = '';
    for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
};

const userSchema = new mongoose.Schema({
    dni: String, email: String, password: String, role: String,
    nombre: String, apellido: String, mustChangePassword: Boolean,
}, { timestamps: true });

userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

const User = mongoose.model('User', userSchema);

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS?.replace(/\s+/g, ''),
    },
    tls: { rejectUnauthorized: false }
});

async function main() {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado.');

    const user = await User.findOne({ email: TARGET_EMAIL });
    if (!user) {
        console.error(`❌ No se encontró ningún usuario con email: ${TARGET_EMAIL}`);
        process.exit(1);
    }

    console.log(`👤 Usuario encontrado: ${user.nombre} ${user.apellido} (DNI: ${user.dni})`);

    // Generamos nueva contraseña temporal
    const tempPassword = generateRandomPassword();
    user.password = tempPassword;
    user.mustChangePassword = true;
    await user.save();
    console.log('🔑 Nueva contraseña temporal generada y guardada.');

    // Enviamos el email
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
            <div style="background-color: #be123c; padding: 20px; text-align: center;">
                <img src="https://gbasistencia.vercel.app/logo-gb.png" alt="GB ASISTENTE" style="width: 80px; height: auto;">
            </div>
            <div style="padding: 40px 20px; color: #1e293b; line-height: 1.6;">
                <h2 style="color: #9f1239; margin-top: 0; text-align: center;">¡Bienvenido/a a GB ASISTENTE!</h2>
                <p>Estimado/a <strong>${user.nombre} ${user.apellido}</strong>,</p>
                <p>Se han generado tus credenciales para acceder al sistema de gestión de la academia <strong>Gracie Barra</strong>.</p>
                
                <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 25px 0; border-left: 4px solid #be123c;">
                    <p style="margin: 0; font-size: 14px; text-transform: uppercase; color: #64748b; font-weight: bold;">Tus datos de acceso:</p>
                    <p style="margin: 10px 0 0 0;"><strong>DNI:</strong> ${user.dni}</p>
                    <p style="margin: 5px 0 0 0;"><strong>Contraseña Temporal:</strong> ${tempPassword}</p>
                </div>

                <p style="font-size: 14px; color: #64748b; background: #fffbeb; padding: 15px; border-radius: 8px; border: 1px solid #fde68a;">
                    <strong>Importante:</strong> Deberás cambiar esta contraseña en tu primer ingreso por seguridad.
                </p>

                <div style="text-align: center; margin-top: 35px;">
                    <a href="${FRONTEND_URL}/login" style="background-color: #be123c; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                        INGRESAR AL SISTEMA
                    </a>
                </div>
            </div>
            <div style="background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b;">
                © ${new Date().getFullYear()} GB ASISTENTE - Gracie Barra Posadas
            </div>
        </div>
    `;

    console.log(`📧 Enviando correo a ${TARGET_EMAIL}...`);
    const info = await transporter.sendMail({
        from: `"GB ASISTENTE" <${process.env.EMAIL_USER}>`,
        to: TARGET_EMAIL,
        subject: '¡Bienvenido/a a GB ASISTENTE! - Tus credenciales de acceso',
        html
    });

    console.log(`✅ ¡Correo enviado exitosamente!`);
    console.log(`   Message ID: ${info.messageId}`);
    console.log(`   Revisar bandeja de ${TARGET_EMAIL} (y spam/no deseado)`);

    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB. ¡Listo!');
}

main().catch(err => {
    console.error('❌ Error fatal:', err);
    process.exit(1);
});

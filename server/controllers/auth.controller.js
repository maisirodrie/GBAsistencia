import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import { createAccessToken } from '../utils/jwt.js';
import jwt from 'jsonwebtoken';
import { TOKEN_SECRET, FRONTEND_URL } from '../config.js';
import { sendEmail } from '../utils/nodemailer.js';
import crypto from 'crypto';

// Detectamos si estamos en producción basándonos en NODE_ENV
// En Render, NODE_ENV suele ser 'production' automáticamente.
// En local, será 'development' o undefined.
const isProduction = process.env.NODE_ENV === 'production';

const cookieOptions = {
    httpOnly: true,
    secure: isProduction, // Solo seguro en producción (HTTPS obligatorio)
    sameSite: isProduction ? 'none' : 'lax', // 'none' permite cross-site (Vercel<->Render), 'lax' es para local
    path: '/',
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
};

console.log(`[CONFIG] Modo: ${isProduction ? 'PRODUCCIÓN' : 'DESARROLLO'} | FRONTEND: ${FRONTEND_URL}`);

// Función para generar una contraseña temporal
const generateRandomPassword = (length = 12) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+';
    let password = '';
    for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
};

// Registrar nuevo usuario
export const register = async (req, res) => {
    const { dni, email, role, nombre, apellido } = req.body;
    console.log(`[AUTH] Registro iniciado para DNI: ${dni}, Email: ${email}`);

    try {
        console.log('[AUTH] Verificando DNI duplicado...');
        const userFoundByDni = await User.findOne({ dni });
        if (userFoundByDni) {
            console.log('[AUTH] DNI ya existe.');
            return res.status(400).json(["El DNI ya está registrado"]);
        }

        console.log('[AUTH] Verificando Email duplicado...');
        const userFoundByEmail = await User.findOne({ email });
        if (userFoundByEmail) {
            console.log('[AUTH] Email ya existe.');
            return res.status(400).json(["El correo ya está registrado"]);
        }

        const tempPassword = generateRandomPassword();
        console.log('[AUTH] Password temporal generado.');
        
        const newUser = new User({
            dni,
            email,
            password: tempPassword,
            role,
            nombre,
            apellido,
            mustChangePassword: true,
        });

        console.log('[AUTH] Intentando guardar usuario en DB...');
        const userSaved = await newUser.save();
        console.log('[AUTH] Usuario guardado con éxito ID:', userSaved._id);

        const mailOptions = {
            subject: '¡Bienvenido/a a GB ASISTENTE!',
            html: `
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

                        <p style="font-size: 14px; color: #64748b; background: #fffbeb; padding: 15px; border-radius: 8px; border: 1px solid #fde68a;">
                            <strong>Importante:</strong> Deberás cambiar esta contraseña en tu primer ingreso por seguridad.
                        </p>

                        <div style="text-align: center; margin-top: 35px;">
                            <a href="${FRONTEND_URL}/login" style="background-color: #be123c; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                                INGRESAR
                            </a>
                        </div>
                    </div>
                    <div style="background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b;">
                        © ${new Date().getFullYear()} GB ASISTENTE - Gracie Barra Posadas
                    </div>
                </div>
            `,
        };

        console.log('[AUTH] Enviando respuesta 201 al cliente...');
        res.status(201).json({
            id: userSaved._id,
            dni: userSaved.dni,
            email: userSaved.email,
            role: userSaved.role,
            nombre: userSaved.nombre,
            apellido: userSaved.apellido
        });

        console.log('[AUTH] Iniciando proceso de email en background...');
        setImmediate(async () => {
            try {
                console.log(`[AUTH] Intentando enviar email de bienvenida a: ${email}`);
                await sendEmail(email, mailOptions.subject, mailOptions.html);
                console.log('[AUTH] Email de bienvenida enviado con éxito.');
            } catch (mailError) {
                console.error('[AUTH] ERROR CRÍTICO enviando email de bienvenida:', mailError);
            }
        });

    } catch (error) {
        console.error('[AUTH] Error fatal en registro:', error);
        if (!res.headersSent) {
            res.status(500).json({ message: error.message });
        }
    }
};

// Inicio de sesión
export const login = async (req, res) => {
    const { dni, password } = req.body;

    try {
        const userFound = await User.findOne({ dni });
        if (!userFound) return res.status(400).json({ message: "DNI no encontrado" });

        const isMatch = await userFound.comparePassword(password);
        if (!isMatch) return res.status(400).json({ message: "Contraseña incorrecta" });

        const token = await createAccessToken({ id: userFound._id, role: userFound.role });
        
        res.cookie('token', token, cookieOptions);

        res.status(200).json({
            id: userFound._id,
            dni: userFound.dni,
            email: userFound.email,
            role: userFound.role,
            nombre: userFound.nombre,
            apellido: userFound.apellido,
            mustChangePassword: userFound.mustChangePassword,
            token
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Cerrar sesión
export const logout = (req, res) => {
    res.cookie('token', "", {
        ...cookieOptions,
        expires: new Date(0)
    });
    return res.sendStatus(200);
};

// Verificar token
export const verifyToken = async (req, res) => {
    let { token } = req.cookies;
    
    // Fallback token desde headers
    const authHeader = req.headers['authorization'];
    if (!token && authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    }

    if (!token) return res.status(401).json({ message: "No autorizado" });

    jwt.verify(token, TOKEN_SECRET, async (error, user) => {
        if (error) return res.status(401).json({ message: "Token inválido" });

        const userFound = await User.findById(user.id);
        if (!userFound) return res.status(401).json({ message: "Usuario no encontrado" });

        return res.json({
            id: userFound._id,
            dni: userFound.dni,
            email: userFound.email,
            role: userFound.role,
            nombre: userFound.nombre,
            apellido: userFound.apellido,
            mustChangePassword: userFound.mustChangePassword,
            token
        });
    });
};

// Cambiar contraseña (por el usuario)
export const changePassword = async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    try {
        const userFound = await User.findById(req.user.id);
        if (!userFound) return res.status(404).json({ message: "Usuario no encontrado" });

        const isMatch = await userFound.comparePassword(oldPassword);
        if (!isMatch) return res.status(400).json({ message: "La contraseña actual es incorrecta" });

        userFound.password = newPassword;
        userFound.mustChangePassword = false;
        await userFound.save();

        res.json({ message: "Contraseña actualizada con éxito" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Recuperar contraseña (solicitud)
export const forgotPassword = async (req, res) => {
    const { dni } = req.body;
    try {
        const userFound = await User.findOne({ dni });
        if (!userFound) return res.status(404).json({ message: "DNI no encontrado" });

        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetExpires = new Date(Date.now() + 3600000); // 1 hora

        userFound.resetPasswordToken = resetToken;
        userFound.resetPasswordExpires = resetExpires;
        await userFound.save();

        const resetUrl = `${FRONTEND_URL}/reset-password?token=${resetToken}`;
        
        // Enviamos el email en segundo plano
        sendEmail(
            userFound.email,
            'Recuperación de Contraseña - GB ASISTENTE',
            `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                    <div style="background-color: #be123c; padding: 20px; text-align: center;">
                        <img src="https://gbasistencia.vercel.app/logo-gb.png" alt="GB ASISTENTE" style="width: 80px; height: auto;">
                    </div>
                    <div style="padding: 40px 20px; color: #1e293b; line-height: 1.6;">
                        <h2 style="color: #9f1239; margin-top: 0; text-align: center;">Recuperación de Contraseña</h2>
                        <p>Hola <strong>${userFound.nombre}</strong>,</p>
                        <p>Has solicitado restablecer tu contraseña en el sistema <strong>GB ASISTENTE</strong>.</p>
                        
                        <p>Para crear una nueva contraseña, haz clic en el siguiente botón:</p>

                        <div style="text-align: center; margin: 35px 0;">
                            <a href="${resetUrl}" style="background-color: #be123c; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                                INGRESAR
                            </a>
                        </div>

                        <p style="font-size: 14px; color: #64748b; background: #f1f5f9; padding: 10px; border-radius: 6px;">
                            <strong>Nota:</strong> Este enlace expirará en 1 hora por seguridad. Si no solicitaste este cambio, puedes ignorar este correo.
                        </p>

                        </p>
                    </div>
                    <div style="background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b;">
                        © ${new Date().getFullYear()} GB ASISTENTE - Gracie Barra Posadas
                    </div>
                </div>
            `
        ).catch(err => console.error('Error enviando email recovery:', err));

        return res.json({ message: "Se ha enviado un enlace de recuperación a tu correo." });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Restablecer contraseña
export const resetPassword = async (req, res) => {
    const { token, newPassword } = req.body;
    try {
        const userFound = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: new Date() }
        });

        if (!userFound) return res.status(400).json({ message: "Token inválido o expirado" });

        userFound.password = newPassword;
        userFound.resetPasswordToken = undefined;
        userFound.resetPasswordExpires = undefined;
        userFound.mustChangePassword = false;
        await userFound.save();

        res.json({ message: "Contraseña restablecida con éxito." });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Obtener todos los integrantes del staff
export const getUsers = async (req, res) => {
    try {
        const users = await User.find({}, { password: 0 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Actualizar datos de un integrante del staff
export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, apellido, email, role } = req.body;

        // No permitir que un admin se quite su propio rol de Admin
        if (id === req.user.id && role !== 'Admin') {
            return res.status(400).json({ message: "No puedes cambiar tu propio rol de Administrador." });
        }

        // Verificar que el email no esté en uso por otro usuario
        if (email) {
            const existingUser = await User.findOne({ email, _id: { $ne: id } });
            if (existingUser) {
                return res.status(400).json({ message: "El correo ya está registrado por otro usuario." });
            }
        }

        const updatedUser = await User.findByIdAndUpdate(
            id,
            { nombre, apellido, email, role },
            { new: true, select: '-password' }
        );

        if (!updatedUser) return res.status(404).json({ message: "Usuario no encontrado" });

        res.json(updatedUser);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Borrar un integrante del staff
export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Evitar que un admin se borre a sí mismo
        if (id === req.user.id) {
            return res.status(400).json({ message: "No puedes eliminar tu propia cuenta administrativa." });
        }

        const userDeleted = await User.findByIdAndDelete(id);
        if (!userDeleted) return res.status(404).json({ message: "Usuario no encontrado" });

        res.sendStatus(204);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


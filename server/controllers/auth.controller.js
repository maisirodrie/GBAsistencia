import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import { createAccessToken } from '../utils/jwt.js';
import jwt from 'jsonwebtoken';
import { TOKEN_SECRET, FRONTEND_URL, NODE_ENV } from '../config.js';
import { sendEmail } from '../utils/nodemailer.js';
import crypto from 'crypto';

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

    try {
        const userFoundByDni = await User.findOne({ dni });
        if (userFoundByDni) return res.status(400).json(["El DNI ya está registrado"]);

        const userFoundByEmail = await User.findOne({ email });
        if (userFoundByEmail) return res.status(400).json(["El correo ya está registrado"]);

        const tempPassword = generateRandomPassword();
        
        const newUser = new User({
            dni,
            email,
            password: tempPassword, // El hashing se hace en el pre('save') del modelo
            role,
            nombre,
            apellido,
            mustChangePassword: true,
        });

        const userSaved = await newUser.save();

        const mailOptions = {
            subject: 'Credenciales de acceso para GB Asistencia',
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
                    <h2 style="color: #e11d48; text-align: center;">Bienvenido/a a GB Asistencia</h2>
                    <p>Estimado/a <strong>${apellido}, ${nombre}</strong></p>
                    <p>Se han generado tus credenciales para acceder al sistema de gestión de la academia.</p>
                    <p>Por favor, ingresa con los siguientes datos:</p>
                    <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <ul style="list-style: none; padding: 0;">
                            <li><strong>DNI:</strong> ${dni}</li>
                            <li><strong>Contraseña provisoria:</strong> ${tempPassword}</li>
                        </ul>
                    </div>
                    <p style="color: #ef4444;"><strong>Importante:</strong> Deberás cambiar esta contraseña en tu primer ingreso por seguridad.</p>
                    <p>Link de acceso: <a href="${FRONTEND_URL}/login">${FRONTEND_URL}/login</a></p>
                    <hr style="border: 0; border-top: 1px solid #ddd; margin: 20px 0;">
                    <p style="text-align: center; font-size: 0.8rem; color: #6b7280;">Gracie Barra - Asistente Mestre Manager</p>
                </div>
            `,
        };
        
        await sendEmail(email, mailOptions.subject, mailOptions.html);

        res.status(201).json({
            id: userSaved._id,
            dni: userSaved.dni,
            email: userSaved.email,
            role: userSaved.role,
            nombre: userSaved.nombre,
            apellido: userSaved.apellido
        });

    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ message: error.message });
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
        
        res.cookie('token', token, {
            httpOnly: true,
            secure: NODE_ENV === 'production',
            sameSite: NODE_ENV === 'production' ? 'none' : 'lax',
            path: '/',
        });

        res.status(200).json({
            id: userFound._id,
            dni: userFound.dni,
            email: userFound.email,
            role: userFound.role,
            nombre: userFound.nombre,
            apellido: userFound.apellido,
            mustChangePassword: userFound.mustChangePassword
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Cerrar sesión
export const logout = (req, res) => {
    res.cookie('token', "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        path: '/',
        expires: new Date(0)
    });
    return res.sendStatus(200);
};

// Verificar token
export const verifyToken = async (req, res) => {
    const { token } = req.cookies;
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
            mustChangePassword: userFound.mustChangePassword
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
        
        await sendEmail(
            userFound.email,
            'Recuperación de Contraseña - GB Asistencia',
            `<p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace:</p><a href="${resetUrl}">${resetUrl}</a>`
        );

        res.json({ message: "Se ha enviado un enlace de recuperación a tu correo." });
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

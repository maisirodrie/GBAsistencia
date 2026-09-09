import mongoose from 'mongoose';

const deviceCheckInSchema = new mongoose.Schema({
    deviceId: {
        type: String,
        required: true,
        index: true
    },
    deviceFingerprint: {
        type: String,
        index: true
    },
    alumnoId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Alumno',
        required: true
    },
    alumnoNombre: {
        type: String,
        required: true
    },
    fecha: {
        type: String, // Formato 'YYYY-MM-DD' en huso horario local (UTC-3)
        required: true,
        index: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 86400 * 35 // Expira automáticamente después de 35 días
    }
});

deviceCheckInSchema.index({ deviceId: 1, fecha: 1 });
deviceCheckInSchema.index({ deviceFingerprint: 1, fecha: 1 });

export default mongoose.model('DeviceCheckIn', deviceCheckInSchema);


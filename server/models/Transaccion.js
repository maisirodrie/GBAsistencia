import mongoose from 'mongoose';

const transaccionSchema = new mongoose.Schema({
    tipo: {
        type: String,
        enum: ['INGRESO', 'EGRESO'],
        required: true
    },
    categoria: {
        type: String,
        enum: ['Membresía', 'Artículo', 'Certificado/Graduación', 'Mantenimiento/Servicios', 'Otros'],
        required: true
    },
    monto: {
        type: Number,
        required: true,
        min: 0
    },
    descripcion: {
        type: String,
        trim: true,
        default: ''
    },
    fecha: {
        type: Date,
        default: Date.now
    },
    alumnoId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Alumno',
        default: null
    },
    // Para membresías: qué mes/año corresponde (ej: "2026-03")
    periodoMembresia: {
        type: String,
        default: null
    },
    // Si tuvo recargo por mora
    tuvoRecargo: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

export default mongoose.model('Transaccion', transaccionSchema);

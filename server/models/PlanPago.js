import mongoose from 'mongoose';

// Un "Plan de Pago" es cuando un alumno va pagando un artículo de a poco
const planPagoSchema = new mongoose.Schema({
    alumnoId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Alumno',
        required: true
    },
    productoId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Producto',
        default: null
    },
    descripcion: {
        type: String,
        required: true,
        trim: true
    },
    montoTotal: {
        type: Number,
        required: true,
        min: 0
    },
    montoPagado: {
        type: Number,
        default: 0,
        min: 0
    },
    estado: {
        type: String,
        enum: ['pendiente', 'completado', 'cancelado'],
        default: 'pendiente'
    },
    // Historial de pagos parciales
    pagos: [{
        monto: Number,
        fecha: { type: Date, default: Date.now },
        nota: { type: String, default: '' }
    }],
    notas: {
        type: String,
        trim: true,
        default: ''
    }
}, {
    timestamps: true
});

// Virtual: saldo pendiente
planPagoSchema.virtual('saldo').get(function () {
    return Math.max(0, this.montoTotal - this.montoPagado);
});

planPagoSchema.set('toJSON', { virtuals: true });

export default mongoose.model('PlanPago', planPagoSchema);

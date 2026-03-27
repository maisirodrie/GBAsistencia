// VentaProducto — registra qué alumno pidió qué producto y cuándo
import mongoose from 'mongoose';

const ventaProductoSchema = new mongoose.Schema({
    productoId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Producto',
        required: true
    },
    alumnoId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Alumno',
        default: null
    },
    cantidad: {
        type: Number,
        default: 1,
        min: 1
    },
    precioUnitario: {
        type: Number,
        required: true,
        min: 0
    },
    montoTotal: {
        type: Number,
        required: true,
        min: 0
    },
    nota: {
        type: String,
        trim: true,
        default: ''
    },
    fecha: {
        type: Date,
        default: Date.now
    },
    // Para certificados: el grado/faja al que corresponde
    detalleGraduacion: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

export default mongoose.model('VentaProducto', ventaProductoSchema);

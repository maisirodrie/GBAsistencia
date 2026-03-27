import mongoose from 'mongoose';

const productoSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true,
        trim: true
    },
    descripcion: {
        type: String,
        trim: true,
        default: ''
    },
    categoria: {
        type: String,
        enum: ['Kimono', 'Remera', 'Cinturón', 'Certificado/Graduación', 'Protección', 'Otros'],
        default: 'Otros'
    },
    precio: {
        type: Number,
        required: true,
        min: 0
    },
    stock: {
        type: Number,
        default: 0,
        min: 0
    },
    activo: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

export default mongoose.model('Producto', productoSchema);

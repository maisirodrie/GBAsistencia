import mongoose from 'mongoose';

const alumnoSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true,
        trim: true
    },
    faja: {
        type: String,
        enum: ['Blanca', 'Azul', 'Morada', 'Marrón', 'Negra'],
        default: 'Blanca'
    },
    grado: {
        type: Number,
        min: 0,
        max: 4,
        default: 0
    },
    ultimaGraduacion: {
        type: Date,
        default: Date.now
    },
    asistencias: [
        {
            type: Date
        }
    ]
}, {
    timestamps: true
});

export default mongoose.model('Alumno', alumnoSchema);

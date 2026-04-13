import mongoose from 'mongoose';

const alumnoSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true,
        trim: true
    },
    apellido: {
        type: String,
        trim: true,
        default: ""
    },
    celular: {
        type: String,
        trim: true,
        default: ""
    },
    categoria: {
        type: String,
        enum: ['Adulto', 'Infantil'],
        default: 'Adulto'
    },
    faja: {
        type: String,
        default: 'Branca'
    },
    grado: {
        type: Number,
        min: 0,
        max: 4,
        default: 0
    },
    fotoUrl: {
        type: String,
        default: ""
    },
    ultimaGraduacion: {
        type: Date
    },
    asistencias: [
        {
            type: Date
        }
    ],
    clasesParaGraduacion: {
        type: Number,
        default: 30,
        min: 1
    },
    historicoGraduaciones: [
        {
            faja: String,
            grado: Number,
            ultimaGraduacion: Date,
            fechaClasePromocion: Date
        }
    ]
}, {
    timestamps: true
});

export default mongoose.model('Alumno', alumnoSchema);

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
    dni: {
        type: String,
        trim: true,
        sparse: true,
        unique: true,
        set: v => (v === null || v === undefined || (typeof v === 'string' && v.trim() === '')) ? undefined : v.toString().replace(/\./g, '').trim()
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
    // Cuenta Parental / Tutor Responsable (para alumnos Infantil / Kids)
    tutorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Alumno',
        default: null
    },
    tutorNombre: {
        type: String,
        trim: true,
        default: ''
    },
    tutorDni: {
        type: String,
        trim: true,
        default: '',
        set: v => (v === null || v === undefined) ? '' : v.toString().replace(/\./g, '').trim()
    },
    tutorTelefono: {
        type: String,
        trim: true,
        default: ''
    },
    tutorRelacion: {
        type: String,
        default: 'Padre'
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
    diasParaGraduacion: {
        type: Number,
        default: null
    },
    frecuenciaSemanal: {
        type: Number,
        default: 3,
        min: 1
    },
    fechaNacimiento: {
        type: Date
    },
    trackProgreso: {
        type: Boolean,
        default: true
    },
    permanenciaManual: {
        type: Number,
        default: null
    },
    clasesTramoManual: {
        type: Number,
        default: null
    },
    historicoGraduaciones: [
        {
            faja: String,
            grado: Number,
            fajaAnterior: String,
            gradoAnterior: Number,
            ultimaGraduacion: Date,
            fechaClasePromocion: Date
        }
    ]
}, {
    timestamps: true
});

export default mongoose.model('Alumno', alumnoSchema);

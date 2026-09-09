import mongoose from 'mongoose';

// Singleton: sólo habrá un documento de configuración en todo el sistema.
const configuracionSchema = new mongoose.Schema({
    precioMembresia: {
        type: Number,
        default: 0,
        min: 0
    },
    porcentajeRecargo: {
        type: Number,
        default: 10, // 10% de mora
        min: 0
    },
    diaCierreCobranza: {
        type: Number,
        default: 10, // Del 1 al 10 sin recargo
        min: 1,
        max: 28
    },
    moneda: {
        type: String,
        default: '$'
    },
    // Geolocalización y Control de Asistencia Presencial
    dojoLat: {
        type: Number,
        default: null
    },
    dojoLng: {
        type: Number,
        default: null
    },
    dojoRadioMetros: {
        type: Number,
        default: 200, // 200 metros por defecto
        min: 20,
        max: 5000
    },
    gpsObligatorio: {
        type: Boolean,
        default: true
    }
}, {

    timestamps: true
});

export default mongoose.model('Configuracion', configuracionSchema);

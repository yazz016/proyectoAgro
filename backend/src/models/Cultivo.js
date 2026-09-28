const mongoose = require('mongoose');

const CultivoSchema = new mongoose.Schema({
    agricultorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },
    nombreProducto: {
        type: String,
        required: [true, 'El nombre del cultivo es obligatorio'],
        trim: true
    },
    variedad: {
        type: String,
        trim: true
    },
    categoria: {
        type: String,
        enum: ['Cereal', 'Granos', 'Hortaliza', 'Fruta', 'Tubérculo'],
        required: true
    },
    descripcion: {
        type: String,
        trim: true
    },
    cantidadDisponible: {
        type: Number,
        required: [true, 'La cantidad es obligatoria'],
        min: 0
    },
    unidadMedida: {
        type: String,
        enum: ['kg', 'libra', 'unidad', 'docena', 'tonelada'],
        default: 'kg'
    },
    precioPorUnidad: {
        type: Number,
        required: [true, 'El precio es obligatorio'],
        min: 0
    },
    ubicacion: {
        departamento: { type: String, required: true },
        municipio: { type: String, required: true },
        vereda: String
    },
    imagenes: [{
        url: String,
        publicId: String
    }],
    fechaSiembra: Date,
    fechaCosecha: Date,
    fechaProximaCosecha: Date,
    estado: {
        type: String,
        enum: ['En crecimiento', 'En desarrollo', 'Requiere atención', 'Cosechado'],
        default: 'En crecimiento'
    },
    disponibleVenta: {
        type: Boolean,
        default: true
    },
    observaciones: String,
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: Date
});

CultivoSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

module.exports = mongoose.model('Cultivo', CultivoSchema);


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
        enum: ['Cereal', 'Granos', 'Hortaliza', 'Fruta', 'Tubérculo', 'Caficultura'],
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
        enum: ['kilo', 'bulto', 'unidad', 'carga', 'kg', 'libra', 'docena', 'tonelada'],
        default: 'kilo'
    },
    precioPorUnidad: {
        type: Number,
        required: [true, 'El precio es obligatorio'],
        min: 0
    },
    // Campos para "Sin desperdicio / Ofertas del día"
    enOferta: {
        type: Boolean,
        default: false
    },
    precioOferta: {
        type: Number,
        min: 0,
        default: null
    },
    motivoOferta: {
        type: String,
        trim: true,
        maxlength: 100,
        default: ''
    },
    ofertaDesde: {
        type: Date,
        default: null
    },
    // Campos para "Canasta / Combo de varios productos"
    esCombo: {
        type: Boolean,
        default: false
    },
    itemsCombo: [{
        type: String,
        trim: true,
        maxlength: 80
    }],
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
        enum: ['En crecimiento', 'En desarrollo', 'Requiere atención', 'Cosechado', 'Vendido'],
        default: 'En crecimiento'
    },
    disponibleVenta: {
        type: Boolean,
        default: true
    },
    eliminado: {
        type: Boolean,
        default: false
    },
    eliminadoEn: {
        type: Date,
        default: null
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


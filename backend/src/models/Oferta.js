const mongoose = require('mongoose');

const OfertaSchema = new mongoose.Schema({
    cultivoId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Cultivo',
        required: true
    },
    nombreProducto: {
        type: String,
        required: true,
        trim: true
    },
    agricultorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },
    compradorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },
    compradorNombre: {
        type: String,
        required: true
    },
    compradorTelefono: {
        type: String,
        trim: true
    },
    cantidadSolicitada: {
        type: Number,
        required: true,
        min: 1
    },
    unidadMedida: {
        type: String,
        default: 'kg'
    },
    precioOfrecido: {
        type: Number,
        min: 0
    },
    mensaje: {
        type: String,
        trim: true
    },
    estado: {
        type: String,
        enum: ['pendiente', 'aceptada', 'rechazada'],
        default: 'pendiente'
    },
    leida: {
        type: Boolean,
        default: false
    },
    mensajesVenta: [{
        autorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
        autorNombre: String,
        texto: String,
        fecha: { type: Date, default: Date.now }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Oferta', OfertaSchema);


const mongoose = require('mongoose');

const mensajeVentaSchema = new mongoose.Schema({
    autorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },
    autorNombre: {
        type: String,
        required: true
    },
    texto: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500
    },
    fecha: {
        type: Date,
        default: Date.now
    }
}, { _id: false });

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
        default: ''
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
        required: true,
        min: 0
    },
    mensaje: {
        type: String,
        trim: true,
        maxlength: 400,
        default: ''
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
    // Campos de pago e historial de acuerdo (PSE Sandbox / Nequi / Contra entrega)
    metodoPago: {
        type: String,
        enum: ['sin_definir', 'contra_entrega', 'nequi_breb', 'pse_wompi'],
        default: 'sin_definir'
    },
    estadoPago: {
        type: String,
        enum: ['pendiente', 'reportado', 'pagado', 'fallido'],
        default: 'pendiente'
    },
    referenciaPago: {
        type: String,
        trim: true,
        default: ''
    },
    wompiTransactionId: {
        type: String,
        trim: true,
        default: ''
    },
    fechaPago: {
        type: Date,
        default: null
    },
    mensajesVenta: [mensajeVentaSchema]
}, { timestamps: true });

module.exports = mongoose.model('Oferta', OfertaSchema);


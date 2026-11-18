const mongoose = require('mongoose');
const crypto = require('crypto');

const registroVentaSchema = new mongoose.Schema({
    ofertaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Oferta',
        required: true,
        unique: true
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
    nombreProducto: {
        type: String,
        required: true
    },
    cantidad: {
        type: Number,
        required: true
    },
    unidadMedida: {
        type: String,
        default: 'kg'
    },
    precioUnitario: {
        type: Number,
        required: true
    },
    totalVenta: {
        type: Number,
        required: true
    },
    fechaVenta: {
        type: Date,
        default: Date.now
    },
    codigoVerificacion: {
        type: String,
        required: true
    },
    hashAnterior: {
        type: String,
        required: true
    },
    hashRegistro: {
        type: String,
        required: true
    }
}, { timestamps: true });

// Calcula la huella digital criptográfica (SHA-256) encadenada al registro anterior
registroVentaSchema.statics.generarHuella = function (datos) {
    const cadena = [
        String(datos.ofertaId),
        String(datos.agricultorId),
        String(datos.compradorId),
        datos.nombreProducto,
        Number(datos.cantidad),
        datos.unidadMedida || 'kg',
        Number(datos.precioUnitario),
        Number(datos.totalVenta),
        new Date(datos.fechaVenta).toISOString(),
        datos.hashAnterior
    ].join('|');

    return crypto.createHash('sha256').update(cadena).digest('hex');
};

module.exports = mongoose.model('RegistroVenta', registroVentaSchema);


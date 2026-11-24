const mongoose = require('mongoose');

const PublicacionSchema = new mongoose.Schema({
    autorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },
    autorNombre: {
        type: String,
        required: true
    },
    autorTipo: {
        type: String,
        default: 'agricultor'
    },
    categoria: {
        type: String,
        enum: ['Consejo', 'Clima y Plagas', 'Pregunta'],
        default: 'Consejo'
    },
    titulo: {
        type: String,
        required: [true, 'El título o pregunta es obligatorio'],
        trim: true
    },
    contenido: {
        type: String,
        trim: true,
        default: ''
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario'
    }],
    comentarios: [{
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

module.exports = mongoose.model('Publicacion', PublicacionSchema);


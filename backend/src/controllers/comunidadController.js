const Publicacion = require('../models/Publicacion');
const Usuario = require('../models/Usuario');

// Listar publicaciones de la comunidad
const obtenerPublicaciones = async (req, res) => {
    try {
        const publicaciones = await Publicacion.find()
            .sort({ createdAt: -1 })
            .limit(40);
        res.json(publicaciones);
    } catch (error) {
        res.status(500).json({ mensaje: error.message });
    }
};

// Crear una publicación nueva
const crearPublicacion = async (req, res) => {
    try {
        const { titulo, contenido, categoria } = req.body;
        if (!titulo || !contenido) {
            return res.status(400).json({ mensaje: 'Escribe título y mensaje' });
        }

        const autor = await Usuario.findById(req.usuario.id).select('nombre tipo');
        const nueva = new Publicacion({
            autorId: req.usuario.id,
            autorNombre: autor?.nombre || 'Usuario',
            autorTipo: autor?.tipo || 'agricultor',
            categoria: categoria || 'Consejo',
            titulo: titulo.trim(),
            contenido: contenido.trim()
        });

        await nueva.save();
        res.status(201).json(nueva);
    } catch (error) {
        res.status(400).json({ mensaje: error.message });
    }
};

// Dar o quitar "Me sirvió"
const toggleLike = async (req, res) => {
    try {
        const pub = await Publicacion.findById(req.params.id);
        if (!pub) {
            return res.status(404).json({ mensaje: 'Publicación no encontrada' });
        }

        const yaDioLike = pub.likes.some((id) => id.toString() === req.usuario.id);
        if (yaDioLike) {
            pub.likes = pub.likes.filter((id) => id.toString() !== req.usuario.id);
        } else {
            pub.likes.push(req.usuario.id);
        }

        await pub.save();
        res.json(pub);
    } catch (error) {
        res.status(500).json({ mensaje: error.message });
    }
};

// Agregar un comentario o respuesta
const agregarComentario = async (req, res) => {
    try {
        const { texto } = req.body;
        if (!texto || !texto.trim()) {
            return res.status(400).json({ mensaje: 'Escribe un comentario' });
        }

        const pub = await Publicacion.findById(req.params.id);
        if (!pub) {
            return res.status(404).json({ mensaje: 'Publicación no encontrada' });
        }

        const autor = await Usuario.findById(req.usuario.id).select('nombre');
        pub.comentarios.push({
            autorId: req.usuario.id,
            autorNombre: autor?.nombre || 'Usuario',
            texto: texto.trim()
        });

        await pub.save();
        res.json(pub);
    } catch (error) {
        res.status(500).json({ mensaje: error.message });
    }
};

// Eliminar publicación propia
const eliminarPublicacion = async (req, res) => {
    try {
        const pub = await Publicacion.findById(req.params.id);
        if (!pub) {
            return res.status(404).json({ mensaje: 'Publicación no encontrada' });
        }

        if (pub.autorId.toString() !== req.usuario.id) {
            return res.status(403).json({ mensaje: 'No autorizado' });
        }

        await pub.deleteOne();
        res.json({ mensaje: 'Publicación eliminada' });
    } catch (error) {
        res.status(500).json({ mensaje: error.message });
    }
};

module.exports = {
    obtenerPublicaciones,
    crearPublicacion,
    toggleLike,
    agregarComentario,
    eliminarPublicacion
};


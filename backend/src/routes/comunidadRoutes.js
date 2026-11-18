const express = require('express');
const router = express.Router();

const {
    obtenerPublicaciones,
    crearPublicacion,
    toggleLike,
    agregarComentario,
    eliminarPublicacion
} = require('../controllers/comunidadController');

const { verificarToken } = require('../middleware/auth');

// Ver todas las publicaciones
router.get('/', verificarToken, obtenerPublicaciones);

// Publicar un nuevo consejo, alerta o pregunta
router.post('/', verificarToken, crearPublicacion);

// Dar o quitar "Me sirvió"
router.put('/:id/like', verificarToken, toggleLike);

// Responder / comentar una publicación
router.post('/:id/comentarios', verificarToken, agregarComentario);

// Eliminar publicación propia
router.delete('/:id', verificarToken, eliminarPublicacion);

module.exports = router;


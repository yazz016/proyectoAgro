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

router.get('/', verificarToken, obtenerPublicaciones);
router.post('/', verificarToken, crearPublicacion);
router.put('/:id/like', verificarToken, toggleLike);
router.post('/:id/comentarios', verificarToken, agregarComentario);
router.delete('/:id', verificarToken, eliminarPublicacion);

module.exports = router;

const express = require('express');
const router = express.Router();
const {
    obtenerMisCultivos,
    crearCultivo,
    eliminarCultivo
} = require('../controllers/cultivoController');
const { verificarToken, esAgricultor } = require('../middleware/auth');
const { validarCultivo } = require('../middleware/validar');

router.get('/mis-cultivos', verificarToken, esAgricultor, obtenerMisCultivos);
router.post('/', verificarToken, esAgricultor, validarCultivo, crearCultivo);
router.delete('/:id', verificarToken, esAgricultor, eliminarCultivo);

module.exports = router;

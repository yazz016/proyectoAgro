const express = require('express');
const router = express.Router();

const {
    obtenerMisCultivos,
    obtenerCultivosMarketplace,
    crearCultivo,
    obtenerCultivo,
    actualizarCultivo,
    toggleOfertaCultivo,
    eliminarCultivo
} = require('../controllers/cultivoController');

const { verificarToken, esAgricultor } = require('../middleware/auth');
const { validarCultivo } = require('../middleware/validar');

// Obtener todos los cultivos del agricultor autenticado
router.get('/mis-cultivos', verificarToken, esAgricultor, obtenerMisCultivos);

// Obtener todos los cultivos disponibles en el Marketplace (para cualquier usuario autenticado)
router.get('/marketplace', verificarToken, obtenerCultivosMarketplace);

// Obtener un cultivo específico por su ID
router.get('/:id', verificarToken, esAgricultor, obtenerCultivo);

// Crear un nuevo cultivo
router.post('/', verificarToken, esAgricultor, validarCultivo, crearCultivo);

// Actualizar un cultivo existente
router.put('/:id', verificarToken, esAgricultor, actualizarCultivo);

// Activar o desactivar "Sin desperdicio / Oferta del día"
router.patch('/:id/oferta', verificarToken, esAgricultor, toggleOfertaCultivo);

// Eliminar un cultivo
router.delete('/:id', verificarToken, esAgricultor, eliminarCultivo);

module.exports = router;


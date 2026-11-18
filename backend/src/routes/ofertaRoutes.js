const express = require('express');
const router = express.Router();

const {
    crearOferta,
    obtenerOfertasRecibidas,
    obtenerOfertasEnviadas,
    responderOferta,
    agregarMensajeOferta,
    obtenerRegistroVentas
} = require('../controllers/ofertaController');

const { verificarToken } = require('../middleware/auth');

// Enviar una oferta desde el Marketplace
router.post('/', verificarToken, crearOferta);

// Ver ofertas que llegaron al agricultor (campanita)
router.get('/recibidas', verificarToken, obtenerOfertasRecibidas);

// Ver ofertas que envió el comprador
router.get('/enviadas', verificarToken, obtenerOfertasEnviadas);

// Consultar el libro inalterable de ventas y ganancias
router.get('/registro-ventas', verificarToken, obtenerRegistroVentas);

// Aceptar o rechazar una oferta
router.put('/:id/estado', verificarToken, responderOferta);

// Chat privado dentro de una oferta aceptada
router.post('/:id/mensajes', verificarToken, agregarMensajeOferta);

module.exports = router;


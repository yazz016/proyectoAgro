const express = require('express');
const router = express.Router();

const {
    crearOferta,
    obtenerOfertasRecibidas,
    obtenerOfertasEnviadas,
    responderOferta,
    agregarMensajeOferta,
    registrarMetodoPago,
    confirmarPagoRecibido,
    iniciarPagoWompiPSE,
    verificarPagoWompi,
    obtenerComprobanteVenta,
    obtenerRegistroVentas
} = require('../controllers/ofertaController');

const { verificarToken } = require('../middleware/auth');

router.post('/', verificarToken, crearOferta);
router.get('/recibidas', verificarToken, obtenerOfertasRecibidas);
router.get('/enviadas', verificarToken, obtenerOfertasEnviadas);
router.get('/registro-ventas', verificarToken, obtenerRegistroVentas);
router.put('/:id/estado', verificarToken, responderOferta);
router.post('/:id/mensajes', verificarToken, agregarMensajeOferta);

// Rutas de Pagos (PSE Sandbox / Nequi / Contra entrega) y Comprobante SHA-256
router.put('/:id/pago-acuerdo', verificarToken, registrarMetodoPago);
router.put('/:id/pago-confirmar', verificarToken, confirmarPagoRecibido);
router.post('/:id/pago-wompi', verificarToken, iniciarPagoWompiPSE);
router.post('/:id/pago-wompi/verificar', verificarToken, verificarPagoWompi);
router.get('/:id/comprobante', verificarToken, obtenerComprobanteVenta);

module.exports = router;


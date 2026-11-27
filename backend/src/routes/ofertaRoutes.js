// ============================================================
// RUTAS DE OFERTAS, PAGOS Y REGISTRO INALTERABLE (/api/ofertas)
// ============================================================
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

// Crear una nueva oferta de compra sobre un cultivo del Marketplace
router.post('/', verificarToken, crearOferta);

// Listar las ofertas recibidas por el agricultor autenticado
router.get('/recibidas', verificarToken, obtenerOfertasRecibidas);

// Listar las ofertas enviadas por el comprador autenticado
router.get('/enviadas', verificarToken, obtenerOfertasEnviadas);

// Consultar el libro inalterable de ventas y ganancias con verificación SHA-256
router.get('/registro-ventas', verificarToken, obtenerRegistroVentas);

// Aceptar o rechazar una oferta recibida (si acepta, descuenta stock y sella venta)
router.put('/:id/estado', verificarToken, responderOferta);

// Enviar un mensaje en el chat privado de una oferta aceptada
router.post('/:id/mensajes', verificarToken, agregarMensajeOferta);

// Reportar acuerdo de pago (Contra entrega o Nequi / Bre-B) por parte del comprador
router.put('/:id/pago-acuerdo', verificarToken, registrarMetodoPago);

// Confirmar pago recibido por parte del agricultor vendedor
router.put('/:id/pago-confirmar', verificarToken, confirmarPagoRecibido);

// Iniciar sesión de pago PSE (Simulador Sandbox académico o pasarela Wompi)
router.post('/:id/pago-wompi', verificarToken, iniciarPagoWompiPSE);

// Verificar y registrar el resultado del pago PSE (APPROVED o DECLINED)
router.post('/:id/pago-wompi/verificar', verificarToken, verificarPagoWompi);

// Generar los datos verificados SHA-256 del comprobante de venta imprimible
router.get('/:id/comprobante', verificarToken, obtenerComprobanteVenta);

module.exports = router;

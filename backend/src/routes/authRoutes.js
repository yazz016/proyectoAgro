// ============================================================
// RUTAS DE AUTENTICACIÓN Y PERFIL DE USUARIO (/api/auth)
// ============================================================
const express = require('express');
const router = express.Router();

const {
    registrar,
    login,
    actualizarTelefono,
    eliminarCuenta
} = require('../controllers/authController');

const { validarRegistro } = require('../middleware/validar');
const { verificarToken } = require('../middleware/auth');

// Registrar un usuario nuevo ya sea agricultor, comprador o estudiante
router.post('/registrar', validarRegistro, registrar);

// Iniciar sesión con correo y contraseña y obtener token JWT
router.post('/login', login);

// Guardar o actualizar el número de WhatsApp privado del usuario autenticado
router.put('/telefono', verificarToken, actualizarTelefono);

// Eliminar la cuenta del usuario autenticado y sus cultivos publicados
router.delete('/cuenta', verificarToken, eliminarCuenta);

module.exports = router;

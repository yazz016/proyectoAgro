const express = require('express');
const router = express.Router();
const { registrar, login, actualizarTelefono, eliminarCuenta } = require('../controllers/authController');
const { validarRegistro } = require('../middleware/validar');
const { verificarToken } = require('../middleware/auth');

router.post('/registrar', validarRegistro, registrar);
router.post('/login', login);
router.put('/telefono', verificarToken, actualizarTelefono);
router.delete('/cuenta', verificarToken, eliminarCuenta);

module.exports = router;


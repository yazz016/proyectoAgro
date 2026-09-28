const express = require('express');
const router = express.Router();
const { registrar, login } = require('../controllers/authController');
const { validarRegistro } = require('../middleware/validar');

router.post('/registrar', validarRegistro, registrar);
router.post('/login', login);

module.exports = router;


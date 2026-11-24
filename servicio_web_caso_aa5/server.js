/**
 * Evidencia: GA7-220501096-AA5-EV01 - Diseño y desarrollo de servicios web (Caso)
 * Aprendiz: Jeimy Yazmin Gómez Arévalo | Ficha: 3186617
 * Descripción: API REST con Express para registro e inicio de sesión de usuarios,
 * utilizando cifrado SHA-256 con sal para proteger contraseñas.
 */

const express = require('express');
const crypto = require('crypto');

const app = express();
const PORT = 4000; // Puerto 4000 para no chocar con el servidor principal de AgroXpress (3000)

// Middleware para leer cuerpos en formato JSON
app.use(express.json());

// Almacenamiento en memoria para las pruebas del caso
const usuariosRegistrados = [];

/**
 * Función auxiliar para generar un hash seguro de la contraseña.
 * @param {string} passwordTexto - Contraseña en texto plano
 * @param {string} sal - Cadena aleatoria única por usuario
 * @returns {string} Hash hexadecimal SHA-256
 */
function cifrarPassword(passwordTexto, sal) {
    return crypto
        .createHash('sha256')
        .update(`${sal}:${passwordTexto}`)
        .digest('hex');
}

/**
 * GET /api/estado
 * Endpoint de verificación para comprobar que el servicio web está activo.
 */
app.get('/api/estado', (req, res) => {
    return res.status(200).json({
        ok: true,
        servicio: 'API de Autenticación - Caso AA5-EV01',
        estado: 'Activo'
    });
});

/**
 * POST /api/registro
 * Registra un nuevo usuario validando campos obligatorios y duplicados.
 * Recibe JSON: { "usuario": "...", "password": "..." }
 */
app.post('/api/registro', (req, res) => {
    const usuario = String(req.body.usuario || '').trim();
    const password = String(req.body.password || req.body.contrasena || '');

    // Validación de campos vacíos
    if (!usuario || !password) {
        return res.status(400).json({
            ok: false,
            mensaje: 'Debe enviar usuario y contraseña.'
        });
    }

    // Validación de longitud mínima de contraseña
    if (password.length < 6) {
        return res.status(400).json({
            ok: false,
            mensaje: 'La contraseña debe tener mínimo 6 caracteres.'
        });
    }

    // Verificar si el usuario ya existe (sin distinguir mayúsculas/minúsculas)
    const yaExiste = usuariosRegistrados.some(
        (u) => u.usuario.toLowerCase() === usuario.toLowerCase()
    );

    if (yaExiste) {
        return res.status(409).json({
            ok: false,
            mensaje: 'El usuario ya se encuentra registrado.'
        });
    }

    // Cifrar contraseña y guardar el nuevo usuario
    const sal = crypto.randomBytes(16).toString('hex');
    const passwordHash = cifrarPassword(password, sal);

    usuariosRegistrados.push({
        id: usuariosRegistrados.length + 1,
        usuario,
        sal,
        passwordHash,
        fechaRegistro: new Date().toISOString()
    });

    return res.status(201).json({
        ok: true,
        mensaje: 'Usuario registrado correctamente.',
        usuario
    });
});

/**
 * POST /api/login
 * Valida las credenciales del usuario.
 * Si coincide: devuelve mensaje de autenticación satisfactoria (HTTP 200).
 * Si falla: devuelve error en la autenticación (HTTP 401).
 */
app.post('/api/login', (req, res) => {
    const usuario = String(req.body.usuario || '').trim();
    const password = String(req.body.password || req.body.contrasena || '');

    // Validación de datos de entrada
    if (!usuario || !password) {
        return res.status(400).json({
            ok: false,
            mensaje: 'Error en la autenticación: debe ingresar usuario y contraseña.'
        });
    }

    // Buscar usuario registrado
    const usuarioEncontrado = usuariosRegistrados.find(
        (u) => u.usuario.toLowerCase() === usuario.toLowerCase()
    );

    if (!usuarioEncontrado) {
        return res.status(401).json({
            ok: false,
            mensaje: 'Error en la autenticación: usuario o contraseña incorrectos.'
        });
    }

    // Comparar hash de la contraseña ingresada con el guardado
    const hashIngresado = cifrarPassword(password, usuarioEncontrado.sal);

    if (hashIngresado !== usuarioEncontrado.passwordHash) {
        return res.status(401).json({
            ok: false,
            mensaje: 'Error en la autenticación: usuario o contraseña incorrectos.'
        });
    }

    // Respuesta exitosa requerida por el caso de estudio
    return res.status(200).json({
        ok: true,
        mensaje: 'Autenticación satisfactoria.',
        usuario: usuarioEncontrado.usuario
    });
});

// Iniciar el servidor HTTP
app.listen(PORT, () => {
    console.log(`Servicio web AA5-EV01 activo en http://localhost:${PORT}`);
});










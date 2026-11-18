const Usuario = require('../models/Usuario');
const jwt = require('jsonwebtoken');
const Cultivo = require('../models/Cultivo');

const generarToken = (usuario) => {
    return jwt.sign(
        { id: usuario._id, email: usuario.email, tipo: usuario.tipo },
        process.env.JWT_SECRET || 'secreto',
        { expiresIn: '7d' }
    );
};

const registrar = async (req, res) => {
    try {
        const { nombre, email, password, tipo, documento, finca } = req.body;

        const existe = await Usuario.findOne({ email });
        if (existe) {
            return res.status(400).json({ mensaje: 'Email ya registrado' });
        }

        const usuario = new Usuario({
            nombre,
            email,
            password,
            tipo: tipo || 'agricultor',
            documento,
            finca
        });
        await usuario.save();

        const token = generarToken(usuario);

        res.status(201).json({
            mensaje: 'Usuario registrado exitosamente',
            token,
            usuario: { id: usuario._id, nombre, email, tipo }
        });
    } catch (error) {
        res.status(500).json({ mensaje: error.message });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const usuario = await Usuario.findOne({ email });
        if (!usuario) {
            return res.status(401).json({ mensaje: 'Credenciales inválidas' });
        }

        const valido = await usuario.compararPassword(password);
        if (!valido) {
            return res.status(401).json({ mensaje: 'Credenciales inválidas' });
        }

        if (!usuario.activo) {
            return res.status(401).json({ mensaje: 'Cuenta desactivada' });
        }

        const token = generarToken(usuario);

        res.json({
            mensaje: 'Inicio de sesión exitoso',
            token,
            usuario: { id: usuario._id, nombre: usuario.nombre, email, tipo: usuario.tipo }
        });
    } catch (error) {
        res.status(500).json({ mensaje: error.message });
    }
};

const actualizarPerfil = async (req, res) => {
    try {
        const { telefono } = req.body;
        const usuario = await Usuario.findByIdAndUpdate(
            req.usuario.id,
            { 'finca.telefono': telefono },
            { new: true }
        );

        if (!usuario) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado' });
        }

        res.json({
            mensaje: 'Teléfono actualizado',
            telefono: usuario.finca?.telefono || ''
        });
    } catch (error) {
        res.status(500).json({ mensaje: error.message });
    }
};

// Guarda el número de WhatsApp del usuario de forma privada
const actualizarTelefono = async (req, res) => {
    try {
        const { telefono } = req.body;
        const limpio = (telefono || '').replace(/\D/g, '');
        if (limpio.length < 7) {
            return res.status(400).json({ mensaje: 'Número de WhatsApp no válido' });
        }

        await Usuario.findByIdAndUpdate(req.usuario.id, {
            'finca.telefono': limpio
        });

        res.json({ mensaje: 'WhatsApp guardado de forma privada', telefono: limpio });
    } catch (error) {
        res.status(500).json({ mensaje: error.message });
    }
};

// Elimina la cuenta del usuario y sus cultivos publicados
const eliminarCuenta = async (req, res) => {
    try {
        await Cultivo.deleteMany({ agricultorId: req.usuario.id });
        await Usuario.findByIdAndDelete(req.usuario.id);
        res.json({ mensaje: 'Cuenta eliminada correctamente' });
    } catch (error) {
        res.status(500).json({ mensaje: error.message });
    }
};

module.exports = { registrar, login, actualizarTelefono, eliminarCuenta };

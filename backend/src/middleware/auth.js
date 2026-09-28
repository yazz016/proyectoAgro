const jwt = require('jsonwebtoken');

const verificarToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ mensaje: 'Acceso no autorizado' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.usuario = decoded;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ mensaje: 'Token inválido' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ mensaje: 'Token expirado' });
        }
        return res.status(401).json({ mensaje: 'Error de autenticación' });
    }
};

const esAgricultor = (req, res, next) => {
    if (req.usuario.tipo !== 'agricultor') {
        return res.status(403).json({ mensaje: 'Solo agricultores pueden hacer esto' });
    }
    next();
};

const esComprador = (req, res, next) => {
    if (req.usuario.tipo !== 'comprador') {
        return res.status(403).json({ mensaje: 'Solo compradores pueden hacer esto' });
    }
    next();
};

module.exports = { verificarToken, esAgricultor, esComprador };

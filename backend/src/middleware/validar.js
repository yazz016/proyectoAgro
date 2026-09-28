const validarRegistro = (req, res, next) => {
    const { nombre, email, password } = req.body;

    if (!nombre || nombre.length < 2) {
        return res.status(400).json({ mensaje: 'El nombre debe tener al menos 2 caracteres' });
    }

    if (!email || !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
        return res.status(400).json({ mensaje: 'Correo electrónico inválido' });
    }

    if (!password || password.length < 6) {
        return res.status(400).json({ mensaje: 'La contraseña debe tener al menos 6 caracteres' });
    }

    next();
};

const validarCultivo = (req, res, next) => {
    const { nombreProducto, categoria, cantidadDisponible, precioPorUnidad } = req.body;

    if (!nombreProducto || nombreProducto.length < 2) {
        return res.status(400).json({ mensaje: 'Nombre del cultivo obligatorio' });
    }

    if (!categoria) {
        return res.status(400).json({ mensaje: 'La categoría es obligatoria' });
    }

    if (cantidadDisponible === undefined || cantidadDisponible < 0) {
        return res.status(400).json({ mensaje: 'Cantidad válida requerida' });
    }

    if (precioPorUnidad === undefined || precioPorUnidad < 0) {
        return res.status(400).json({ mensaje: 'Precio válido requerido' });
    }

    next();
};

module.exports = { validarRegistro, validarCultivo };

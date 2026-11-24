const Cultivo = require('../models/Cultivo');

const FILTRO_ACTIVOS = {
    eliminado: { $ne: true },
    activo: { $ne: false },
    estado: { $ne: 'Eliminado' }
};

function estaEliminado(cultivo) {
    return !cultivo || cultivo.eliminado === true || cultivo.activo === false || cultivo.estado === 'Eliminado';
}

// Limpia y valida los productos cuando una publicación es una Canasta / Combo
function normalizarCombo(datos) {
    if (datos.esCombo === undefined) return { error: null };

    const esCombo = Boolean(datos.esCombo);
    datos.esCombo = esCombo;

    if (!esCombo) {
        datos.itemsCombo = [];
        return { error: null };
    }

    const listaCruda = Array.isArray(datos.itemsCombo) ? datos.itemsCombo : [];
    const itemsLimpios = listaCruda
        .map((item) => String(item || '').trim().slice(0, 80))
        .filter(Boolean)
        .slice(0, 8);

    if (itemsLimpios.length < 2) {
        return { error: 'Una canasta o combo debe incluir al menos 2 productos' };
    }

    datos.itemsCombo = itemsLimpios;
    return { error: null };
}

const obtenerMisCultivos = async (req, res) => {
    try {
        const cultivos = await Cultivo.find({
            agricultorId: req.usuario.id,
            ...FILTRO_ACTIVOS
        }).sort({ createdAt: -1 });
        res.json(cultivos);
    } catch (error) {
        res.status(500).json({ mensaje: error.message });
    }
};

// Obtiene todos los cultivos disponibles para el Marketplace sin exponer correos ni teléfonos
const obtenerCultivosMarketplace = async (req, res) => {
    try {
        const cultivos = await Cultivo.find({
            disponibleVenta: true,
            cantidadDisponible: { $gt: 0 },
            ...FILTRO_ACTIVOS
        })
            .populate('agricultorId', 'nombre finca.nombre finca.ubicacion')
            .sort({ enOferta: -1, createdAt: -1 });
        res.json(cultivos);
    } catch (error) {
        res.status(500).json({ mensaje: error.message });
    }
};

// Crea un cultivo nuevo y lo asocia al agricultor autenticado
const crearCultivo = async (req, res) => {
    try {
        const datos = { ...req.body };
        const { error } = normalizarCombo(datos);
        if (error) {
            return res.status(400).json({ mensaje: error });
        }

        const nuevoCultivo = new Cultivo({
            ...datos,
            eliminado: false,
            eliminadoEn: null,
            agricultorId: req.usuario.id
        });
        await nuevoCultivo.save();
        res.status(201).json(nuevoCultivo);
    } catch (error) {
        res.status(400).json({ mensaje: error.message });
    }
};

const obtenerCultivo = async (req, res) => {
    try {
        const cultivo = await Cultivo.findById(req.params.id)
            .populate('agricultorId', 'nombre finca.nombre finca.ubicacion');
        if (estaEliminado(cultivo)) {
            return res.status(404).json({ mensaje: 'Cultivo no encontrado' });
        }
        res.json(cultivo);
    } catch (error) {
        res.status(500).json({ mensaje: error.message });
    }
};

const actualizarCultivo = async (req, res) => {
    try {
        const cultivo = await Cultivo.findById(req.params.id);
        if (estaEliminado(cultivo)) {
            return res.status(404).json({ mensaje: 'Cultivo no encontrado' });
        }

        if (cultivo.agricultorId.toString() !== req.usuario.id) {
            return res.status(403).json({ mensaje: 'No autorizado' });
        }

        // Se apartan los campos que el cliente no puede modificar
        const { agricultorId, createdAt, eliminado, eliminadoEn, ...datos } = req.body;

        const { error } = normalizarCombo(datos);
        if (error) {
            return res.status(400).json({ mensaje: error });
        }

        // Si se marca como vendido o sin cantidad, se quita la etiqueta de oferta automáticamente
        if (datos.estado === 'Vendido' || datos.disponibleVenta === false || Number(datos.cantidadDisponible) === 0) {
            datos.enOferta = false;
            datos.precioOferta = null;
            datos.motivoOferta = '';
            datos.ofertaDesde = null;
        }

        const actualizado = await Cultivo.findByIdAndUpdate(
            req.params.id,
            { ...datos, updatedAt: new Date() },
            { new: true, runValidators: true }
        );

        res.json(actualizado);
    } catch (error) {
        res.status(400).json({ mensaje: error.message });
    }
};

// Activa o desactiva la etiqueta "Sin desperdicio / Ofertas del día" en una cosecha
const toggleOfertaCultivo = async (req, res) => {
    try {
        const cultivo = await Cultivo.findById(req.params.id);
        if (estaEliminado(cultivo)) {
            return res.status(404).json({ mensaje: 'Cultivo no encontrado' });
        }

        if (cultivo.agricultorId.toString() !== req.usuario.id) {
            return res.status(403).json({ mensaje: 'No autorizado' });
        }

        if (cultivo.cantidadDisponible <= 0 || cultivo.estado === 'Vendido') {
            return res.status(400).json({ mensaje: 'Este cultivo ya fue vendido y no puede ponerse en oferta' });
        }

        const { enOferta, precioOferta, motivoOferta } = req.body || {};
        const activar = typeof enOferta === 'boolean' ? enOferta : !cultivo.enOferta;

        if (activar) {
            if (precioOferta !== undefined && precioOferta !== null && String(precioOferta).trim() !== '') {
                const numPrecio = Number(precioOferta);
                if (isNaN(numPrecio) || numPrecio <= 0) {
                    return res.status(400).json({ mensaje: 'El precio de oferta debe ser mayor a 0' });
                }
                if (numPrecio >= cultivo.precioPorUnidad) {
                    return res.status(400).json({ mensaje: 'El precio de oferta debe ser menor al precio normal' });
                }
                cultivo.precioOferta = numPrecio;
            } else {
                cultivo.precioOferta = null;
            }

            cultivo.enOferta = true;
            cultivo.motivoOferta = (motivoOferta || 'Cosecha lista • Salida rápida').trim().slice(0, 100);
            cultivo.ofertaDesde = new Date();
            cultivo.disponibleVenta = true;
        } else {
            cultivo.enOferta = false;
            cultivo.precioOferta = null;
            cultivo.motivoOferta = '';
            cultivo.ofertaDesde = null;
        }

        await cultivo.save();

        res.json({
            mensaje: activar
                ? 'Cosecha destacada en Sin desperdicio / Ofertas del día'
                : 'Cosecha retirada de Ofertas del día',
            cultivo
        });
    } catch (error) {
        res.status(400).json({ mensaje: error.message });
    }
};

// Borrado lógico (Soft Delete) para ocultar el cultivo del listado activo y del Marketplace
const eliminarCultivo = async (req, res) => {
    try {
        const cultivo = await Cultivo.findById(req.params.id);
        if (estaEliminado(cultivo)) {
            return res.status(404).json({ mensaje: 'Cultivo no encontrado' });
        }

        if (cultivo.agricultorId.toString() !== req.usuario.id) {
            return res.status(403).json({ mensaje: 'No autorizado' });
        }

        cultivo.eliminado = true;
        cultivo.eliminadoEn = new Date();
        cultivo.disponibleVenta = false;
        cultivo.enOferta = false;
        await cultivo.save();

        res.json({ mensaje: 'Cultivo eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ mensaje: error.message });
    }
};

module.exports = {
    obtenerMisCultivos,
    obtenerCultivosMarketplace,
    crearCultivo,
    obtenerCultivo,
    actualizarCultivo,
    toggleOfertaCultivo,
    eliminarCultivo
};


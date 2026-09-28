const Cultivo = require('../models/Cultivo');

const obtenerMisCultivos = async (req, res) => {
    try {
        const cultivos = await Cultivo.find({ agricultorId: req.usuario.id })
            .sort({ createdAt: -1 });
        res.json(cultivos);
    } catch (error) {
        res.status(500).json({ mensaje: error.message });
    }
};

const crearCultivo = async (req, res) => {
    try {
        const nuevoCultivo = new Cultivo({
            ...req.body,
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
            .populate('agricultorId', 'nombre finca telefono');
        if (!cultivo) {
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
        if (!cultivo) {
            return res.status(404).json({ mensaje: 'Cultivo no encontrado' });
        }

        if (cultivo.agricultorId.toString() !== req.usuario.id) {
            return res.status(403).json({ mensaje: 'No autorizado' });
        }

        const actualizado = await Cultivo.findByIdAndUpdate(
            req.params.id,
            { ...req.body, updatedAt: new Date() },
            { new: true, runValidators: true }
        );
        res.json(actualizado);
    } catch (error) {
        res.status(400).json({ mensaje: error.message });
    }
};

const eliminarCultivo = async (req, res) => {
    try {
        const cultivo = await Cultivo.findById(req.params.id);
        if (!cultivo) {
            return res.status(404).json({ mensaje: 'Cultivo no encontrado' });
        }

        if (cultivo.agricultorId.toString() !== req.usuario.id) {
            return res.status(403).json({ mensaje: 'No autorizado' });
        }

        await cultivo.deleteOne();
        res.json({ mensaje: 'Cultivo eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ mensaje: error.message });
    }
};

module.exports = {
    obtenerMisCultivos,
    crearCultivo,
    obtenerCultivo,
    actualizarCultivo,
    eliminarCultivo
};


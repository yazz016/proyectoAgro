const Oferta = require('../models/Oferta');
const Cultivo = require('../models/Cultivo');
const Usuario = require('../models/Usuario');
const RegistroVenta = require('../models/RegistroVenta');

// Sella una oferta aceptada en el libro inalterable con huella criptográfica SHA-256
async function sellarVentaInalterable(oferta) {
    const existente = await RegistroVenta.findOne({ ofertaId: oferta._id });
    if (existente) return existente;

    const ultimo = await RegistroVenta.findOne().sort({ createdAt: -1, _id: -1 }).lean();
    const hashAnterior = ultimo ? ultimo.hashRegistro : 'GENESIS-AGROXPRESS';
    const fechaVenta = oferta.updatedAt || new Date();
    const cantidad = Number(oferta.cantidadSolicitada || 0);
    const precioUnitario = Number(oferta.precioOfrecido || 0);
    const totalVenta = cantidad * precioUnitario;

    const datosBase = {
        ofertaId: oferta._id,
        agricultorId: oferta.agricultorId,
        compradorId: oferta.compradorId,
        compradorNombre: oferta.compradorNombre || 'Comprador',
        nombreProducto: oferta.nombreProducto,
        cantidad,
        unidadMedida: oferta.unidadMedida || 'kg',
        precioUnitario,
        totalVenta,
        fechaVenta,
        hashAnterior
    };

    const hashRegistro = RegistroVenta.generarHuella(datosBase);
    const codigoVerificacion = 'AGRO-' + hashRegistro.slice(0, 8).toUpperCase();

    const nuevoRegistro = new RegistroVenta({
        ...datosBase,
        codigoVerificacion,
        hashRegistro
    });

    await nuevoRegistro.save();
    return nuevoRegistro;
}

// Crear una oferta de compra desde el Marketplace
const crearOferta = async (req, res) => {
    try {
        const { cultivoId, cantidadSolicitada, precioOfrecido, compradorTelefono, mensaje } = req.body;

        const cultivo = await Cultivo.findById(cultivoId);
        if (!cultivo) {
            return res.status(404).json({ mensaje: 'Cultivo no encontrado' });
        }

        if (!cultivo.disponibleVenta || cultivo.cantidadDisponible <= 0) {
            return res.status(400).json({ mensaje: 'Esta cosecha ya se agotó o no está disponible' });
        }

        if (cultivo.agricultorId.toString() === req.usuario.id) {
            return res.status(400).json({ mensaje: 'No puedes enviar una oferta a tu propia cosecha' });
        }

        const cantidadNum = Number(cantidadSolicitada);
        if (!cantidadNum || cantidadNum <= 0) {
            return res.status(400).json({ mensaje: 'Escribe una cantidad válida' });
        }

        if (cantidadNum > cultivo.cantidadDisponible) {
            return res.status(400).json({
                mensaje: `Solo quedan ${cultivo.cantidadDisponible} ${cultivo.unidadMedida || 'kg'} disponibles`
            });
        }

        const comprador = await Usuario.findById(req.usuario.id).select('nombre finca.telefono');
        const telefonoLimpio = (compradorTelefono || comprador?.finca?.telefono || '').replace(/\D/g, '');

        const nuevaOferta = new Oferta({
            cultivoId: cultivo._id,
            nombreProducto: cultivo.nombreProducto,
            agricultorId: cultivo.agricultorId,
            compradorId: req.usuario.id,
            compradorNombre: comprador?.nombre || 'Comprador',
            compradorTelefono: telefonoLimpio,
            cantidadSolicitada: cantidadNum,
            unidadMedida: cultivo.unidadMedida || 'kg',
            precioOfrecido: precioOfrecido || cultivo.precioPorUnidad,
            mensaje: mensaje || ''
        });

        await nuevaOferta.save();

        // Al crearla aún está pendiente, así que devolvemos sin exponer teléfonos
        const respuesta = nuevaOferta.toObject();
        respuesta.compradorTelefono = null;
        res.status(201).json(respuesta);
    } catch (error) {
        res.status(400).json({ mensaje: error.message });
    }
};

// Ofertas recibidas por el agricultor (solo muestra WhatsApp si ya fue aceptada)
const obtenerOfertasRecibidas = async (req, res) => {
    try {
        const ofertas = await Oferta.find({ agricultorId: req.usuario.id })
            .sort({ createdAt: -1 })
            .limit(100)
            .lean();

        const seguras = ofertas.map((o) => ({
            ...o,
            compradorTelefono: o.estado === 'aceptada' ? o.compradorTelefono : null
        }));

        res.json(seguras);
    } catch (error) {
        res.status(500).json({ mensaje: error.message });
    }
};

// Ofertas enviadas por el comprador (solo muestra WhatsApp del agricultor si fue aceptada)
const obtenerOfertasEnviadas = async (req, res) => {
    try {
        const ofertas = await Oferta.find({ compradorId: req.usuario.id })
            .populate('agricultorId', 'nombre finca')
            .sort({ createdAt: -1 })
            .limit(100)
            .lean();

        const seguras = ofertas.map((o) => {
            const agricultor = o.agricultorId ? { ...o.agricultorId } : null;
            const telefonoAgricultor = agricultor?.finca?.telefono || null;

            if (agricultor?.finca) {
                agricultor.finca = {
                    nombre: agricultor.finca.nombre,
                    ubicacion: agricultor.finca.ubicacion
                };
            }

            return {
                ...o,
                agricultorId: agricultor,
                compradorTelefono: null,
                agricultorWhatsapp: o.estado === 'aceptada' ? telefonoAgricultor : null
            };
        });

        res.json(seguras);
    } catch (error) {
        res.status(500).json({ mensaje: error.message });
    }
};

// El agricultor acepta o rechaza una oferta (si acepta, descuenta el stock y sella la venta)
const responderOferta = async (req, res) => {
    try {
        const { estado } = req.body;
        if (!['aceptada', 'rechazada'].includes(estado)) {
            return res.status(400).json({ mensaje: 'Estado no válido' });
        }

        const oferta = await Oferta.findById(req.params.id);
        if (!oferta) {
            return res.status(404).json({ mensaje: 'Oferta no encontrada' });
        }

        if (oferta.agricultorId.toString() !== req.usuario.id) {
            return res.status(403).json({ mensaje: 'No autorizado' });
        }

        if (oferta.estado === 'aceptada') {
            return res.status(400).json({ mensaje: 'Esta oferta ya fue aceptada anteriormente' });
        }

        let cultivoActualizado = null;
        if (estado === 'aceptada') {
            const cultivo = await Cultivo.findById(oferta.cultivoId);
            if (cultivo) {
                if (cultivo.cantidadDisponible < oferta.cantidadSolicitada) {
                    return res.status(400).json({
                        mensaje: `No quedan suficientes ${cultivo.unidadMedida || 'kg'} disponibles (quedan ${cultivo.cantidadDisponible})`
                    });
                }

                cultivo.cantidadDisponible = Number(cultivo.cantidadDisponible) - Number(oferta.cantidadSolicitada);
                if (cultivo.cantidadDisponible <= 0) {
                    cultivo.cantidadDisponible = 0;
                    cultivo.disponibleVenta = false;
                    cultivo.estado = 'Vendido';
                }
                await cultivo.save();
                cultivoActualizado = {
                    cantidadDisponible: cultivo.cantidadDisponible,
                    estado: cultivo.estado
                };
            }
        }

        oferta.estado = estado;
        oferta.leida = true;
        await oferta.save();

        let registroVenta = null;
        if (estado === 'aceptada') {
            registroVenta = await sellarVentaInalterable(oferta);
        }

        const respuesta = oferta.toObject();
        if (oferta.estado !== 'aceptada') {
            respuesta.compradorTelefono = null;
        }
        if (registroVenta) {
            respuesta.registroVenta = registroVenta;
        }
        if (cultivoActualizado) {
            respuesta.cultivoActualizado = cultivoActualizado;
        }

        res.json(respuesta);
    } catch (error) {
        res.status(500).json({ mensaje: error.message });
    }
};

// Enviar un mensaje privado dentro de una oferta aceptada (sin exponer teléfonos)
const agregarMensajeOferta = async (req, res) => {
    try {
        const { texto } = req.body;
        if (!texto || !texto.trim()) {
            return res.status(400).json({ mensaje: 'Escribe un mensaje' });
        }

        const oferta = await Oferta.findById(req.params.id);
        if (!oferta) {
            return res.status(404).json({ mensaje: 'Oferta no encontrada' });
        }

        const esAgricultorDueno = oferta.agricultorId.toString() === req.usuario.id;
        const esCompradorDueno = oferta.compradorId.toString() === req.usuario.id;
        if (!esAgricultorDueno && !esCompradorDueno) {
            return res.status(403).json({ mensaje: 'No autorizado' });
        }

        if (oferta.estado !== 'aceptada') {
            return res.status(400).json({ mensaje: 'El chat se abre cuando la oferta es aceptada' });
        }

        const autor = await Usuario.findById(req.usuario.id).select('nombre');
        oferta.mensajesVenta.push({
            autorId: req.usuario.id,
            autorNombre: autor?.nombre || 'Usuario',
            texto: texto.trim()
        });

        await oferta.save();
        res.json(oferta.mensajesVenta);
    } catch (error) {
        res.status(500).json({ mensaje: error.message });
    }
};

// Consultar el Registro Inalterable de Ventas y Ganancias y verificar su integridad
const obtenerRegistroVentas = async (req, res) => {
    try {
        const aceptadasPrevias = await Oferta.find({
            $or: [{ agricultorId: req.usuario.id }, { compradorId: req.usuario.id }],
            estado: 'aceptada'
        }).sort({ updatedAt: 1 });

        for (const ofPrev of aceptadasPrevias) {
            await sellarVentaInalterable(ofPrev);
        }

        const registrosRaw = await RegistroVenta.find({ agricultorId: req.usuario.id })
            .sort({ fechaVenta: -1, createdAt: -1 })
            .lean();

        const registros = registrosRaw.map((r) => {
            const huellaCalculada = RegistroVenta.generarHuella(r);
            return {
                ...r,
                integro: huellaCalculada === r.hashRegistro
            };
        });

        const totalGanancias = registros.reduce((acc, r) => acc + Number(r.totalVenta || 0), 0);
        const totalCantidad = registros.reduce((acc, r) => acc + Number(r.cantidad || 0), 0);
        const todasIntegras = registros.every((r) => r.integro);

        res.json({
            registros,
            resumen: {
                totalGanancias,
                totalVentas: registros.length,
                totalCantidad,
                todasIntegras
            }
        });
    } catch (error) {
        res.status(500).json({ mensaje: error.message });
    }
};

module.exports = {
    crearOferta,
    obtenerOfertasRecibidas,
    obtenerOfertasEnviadas,
    responderOferta,
    agregarMensajeOferta,
    obtenerRegistroVentas
};


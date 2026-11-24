const crypto = require('crypto');
const https = require('https');
const Oferta = require('../models/Oferta');
const Cultivo = require('../models/Cultivo');
const Usuario = require('../models/Usuario');
const RegistroVenta = require('../models/RegistroVenta');

// Helper HTTPS nativo para consultar Wompi si se configuran llaves reales en .env
function consultarJsonHttps(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (resp) => {
            let cuerpo = '';
            resp.on('data', (chunk) => { cuerpo += chunk; });
            resp.on('end', () => {
                try {
                    resolve({ ok: resp.statusCode >= 200 && resp.statusCode < 300, status: resp.statusCode, data: JSON.parse(cuerpo) });
                } catch {
                    reject(new Error('Respuesta inválida de la pasarela'));
                }
            });
        }).on('error', reject);
    });
}

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
        unidadMedida: oferta.unidadMedida || 'kilo',
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
        if (!cultivo || cultivo.eliminado === true) {
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
                mensaje: `Solo quedan ${cultivo.cantidadDisponible} ${cultivo.unidadMedida || 'kilo'} disponibles`
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
            unidadMedida: cultivo.unidadMedida || 'kilo',
            precioOfrecido: precioOfrecido || cultivo.precioPorUnidad,
            mensaje: mensaje || ''
        });

        await nuevaOferta.save();

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

        const ids = ofertas.map((o) => o._id);
        const registros = await RegistroVenta.find({ ofertaId: { $in: ids } })
            .select('ofertaId codigoVerificacion')
            .lean();
        const mapaCodigos = new Map(registros.map((r) => [String(r.ofertaId), r.codigoVerificacion]));

        const seguras = ofertas.map((o) => ({
            ...o,
            compradorTelefono: o.estado === 'aceptada' ? o.compradorTelefono : null,
            codigoVerificacion: mapaCodigos.get(String(o._id)) || null
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

        const ids = ofertas.map((o) => o._id);
        const registros = await RegistroVenta.find({ ofertaId: { $in: ids } })
            .select('ofertaId codigoVerificacion')
            .lean();
        const mapaCodigos = new Map(registros.map((r) => [String(r.ofertaId), r.codigoVerificacion]));

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
                agricultorWhatsapp: o.estado === 'aceptada' ? telefonoAgricultor : null,
                codigoVerificacion: mapaCodigos.get(String(o._id)) || null
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
                        mensaje: `No quedan suficientes ${cultivo.unidadMedida || 'kilo'} disponibles (quedan ${cultivo.cantidadDisponible})`
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

// El comprador registra pago acordado (Contra entrega con foto + firma + referencia, o Nequi / Bre-B)
const registrarMetodoPago = async (req, res) => {
    try {
        const { metodoPago, referenciaPago, fotoEntrega, firmaCliente } = req.body;
        if (!['contra_entrega', 'nequi_breb'].includes(metodoPago)) {
            return res.status(400).json({ mensaje: 'Método de pago no válido' });
        }

        const oferta = await Oferta.findById(req.params.id);
        if (!oferta) {
            return res.status(404).json({ mensaje: 'Oferta no encontrada' });
        }

        if (oferta.compradorId.toString() !== req.usuario.id) {
            return res.status(403).json({ mensaje: 'Solo el comprador puede registrar el método de pago' });
        }

        if (oferta.estado !== 'aceptada') {
            return res.status(400).json({ mensaje: 'La oferta debe estar aceptada antes de registrar el pago' });
        }

        if (oferta.estadoPago === 'pagado') {
            return res.status(400).json({ mensaje: 'Este pago ya fue confirmado' });
        }

        const refLimpia = String(referenciaPago || '').trim().slice(0, 60);

        if (metodoPago === 'contra_entrega') {
            const fotoLimpia = String(fotoEntrega || '').trim();
            const firmaLimpia = String(firmaCliente || '').trim();

            if (!fotoLimpia || !fotoLimpia.startsWith('data:image/')) {
                return res.status(400).json({ mensaje: 'Debes subir la foto de entrega para validar el pago contraentrega.' });
            }
            if (!firmaLimpia || !firmaLimpia.startsWith('data:image/')) {
                return res.status(400).json({ mensaje: 'Debes registrar la firma de recibido del cliente.' });
            }
            if (!refLimpia) {
                return res.status(400).json({ mensaje: 'Debes escribir la referencia del pago contraentrega.' });
            }

            oferta.fotoEntrega = fotoLimpia;
            oferta.firmaCliente = firmaLimpia;
        }

        oferta.metodoPago = metodoPago;
        oferta.estadoPago = 'reportado';
        oferta.referenciaPago = refLimpia;
        await oferta.save();

        res.json({
            mensaje: metodoPago === 'contra_entrega'
                ? 'Pago contraentrega validado con foto, firma y referencia. El agricultor lo confirmará.'
                : 'Transferencia Nequi/Bre-B reportada. El agricultor la confirmará al verificarla.',
            oferta
        });
    } catch (error) {
        res.status(500).json({ mensaje: error.message });
    }
};

// El agricultor confirma que recibió el dinero (Contra entrega o Nequi / Bre-B)
const confirmarPagoRecibido = async (req, res) => {
    try {
        const oferta = await Oferta.findById(req.params.id);
        if (!oferta) {
            return res.status(404).json({ mensaje: 'Oferta no encontrada' });
        }

        if (oferta.agricultorId.toString() !== req.usuario.id) {
            return res.status(403).json({ mensaje: 'Solo el agricultor vendedor puede confirmar el pago recibido' });
        }

        if (oferta.estado !== 'aceptada') {
            return res.status(400).json({ mensaje: 'La oferta debe estar aceptada' });
        }

        if (oferta.metodoPago === 'sin_definir') {
            oferta.metodoPago = 'contra_entrega';
        }
        oferta.estadoPago = 'pagado';
        oferta.fechaPago = new Date();
        await oferta.save();
        await sellarVentaInalterable(oferta);

        res.json({
            mensaje: 'Pago confirmado correctamente',
            oferta
        });
    } catch (error) {
        res.status(500).json({ mensaje: error.message });
    }
};

// Inicia pago PSE: si hay llaves reales en .env usa Wompi; si no, activa Simulador Sandbox Académico local
const iniciarPagoWompiPSE = async (req, res) => {
    try {
        const oferta = await Oferta.findById(req.params.id);
        if (!oferta) {
            return res.status(404).json({ mensaje: 'Oferta no encontrada' });
        }

        if (oferta.compradorId.toString() !== req.usuario.id) {
            return res.status(403).json({ mensaje: 'Solo el comprador puede iniciar el pago PSE' });
        }

        if (oferta.estado !== 'aceptada') {
            return res.status(400).json({ mensaje: 'La oferta debe estar aceptada para pagar' });
        }

        if (oferta.estadoPago === 'pagado') {
            return res.status(400).json({ mensaje: 'Esta venta ya está pagada' });
        }

        const totalCOP = Math.round(Number(oferta.cantidadSolicitada || 0) * Number(oferta.precioOfrecido || 0));
        if (totalCOP < 1500) {
            return res.status(400).json({ mensaje: 'El valor mínimo para pago PSE es $1.500 COP' });
        }

        const amountInCents = totalCOP * 100;
        const currency = 'COP';
        const referencia = `AGRO-${oferta._id.toString().slice(-6).toUpperCase()}-${Date.now()}`;

        const publicKey = process.env.WOMPI_PUBLIC_KEY;
        const integritySecret = process.env.WOMPI_INTEGRITY_SECRET;

        if (!publicKey || !integritySecret) {
            const secretoLocal = process.env.JWT_SECRET || 'AGROXPRESS-SANDBOX-ACADEMICO-2026';
            const firmaSimulada = crypto
                .createHash('sha256')
                .update(`${referencia}${amountInCents}${currency}${secretoLocal}`)
                .digest('hex');

            const txSimulado = `SANDBOX-TX-${Date.now().toString(36).toUpperCase()}`;

            oferta.metodoPago = 'pse_wompi';
            oferta.referenciaPago = referencia;
            await oferta.save();

            return res.json({
                modo: 'simulador_academico',
                mensaje: 'Sesión PSE Sandbox académica lista (sin dinero ni datos reales)',
                ofertaId: oferta._id,
                producto: oferta.nombreProducto,
                comprador: oferta.compradorNombre,
                totalCOP,
                currency,
                amountInCents,
                reference: referencia,
                transactionIdSimulado: txSimulado,
                signatureIntegrity: firmaSimulada
            });
        }

        const signatureIntegrity = crypto
            .createHash('sha256')
            .update(`${referencia}${amountInCents}${currency}${integritySecret}`)
            .digest('hex');

        oferta.metodoPago = 'pse_wompi';
        oferta.referenciaPago = referencia;
        await oferta.save();

        res.json({
            modo: 'wompi_checkout',
            checkoutUrl: 'https://checkout.wompi.co/p/',
            publicKey,
            currency,
            amountInCents,
            reference: referencia,
            signatureIntegrity
        });
    } catch (error) {
        res.status(500).json({ mensaje: error.message });
    }
};

// Verifica el resultado del pago PSE (Simulador Sandbox local o API de Wompi)
const verificarPagoWompi = async (req, res) => {
    try {
        const { transactionId, resultadoSimulado, bancoSimulado } = req.body;
        if (!transactionId) {
            return res.status(400).json({ mensaje: 'Falta el ID de la transacción' });
        }

        const oferta = await Oferta.findById(req.params.id);
        if (!oferta) {
            return res.status(404).json({ mensaje: 'Oferta no encontrada' });
        }

        if (oferta.compradorId.toString() !== req.usuario.id) {
            return res.status(403).json({ mensaje: 'No autorizado para verificar este pago' });
        }

        const publicKey = process.env.WOMPI_PUBLIC_KEY;
        const esSimuladorLocal = !publicKey || String(transactionId).startsWith('SANDBOX-TX-');

        if (esSimuladorLocal) {
            const estadoFinal = resultadoSimulado === 'DECLINED' ? 'DECLINED' : 'APPROVED';
            const bancoLimpio = String(bancoSimulado || 'Banco Simulado PSE').trim().slice(0, 45);

            oferta.metodoPago = 'pse_wompi';
            oferta.wompiTransactionId = String(transactionId).trim();
            if (!oferta.referenciaPago) {
                oferta.referenciaPago = `AGRO-${oferta._id.toString().slice(-6).toUpperCase()}`;
            }

            if (estadoFinal === 'APPROVED') {
                oferta.estadoPago = 'pagado';
                oferta.fechaPago = new Date();
                if (!oferta.referenciaPago.includes('•')) {
                    oferta.referenciaPago = `${bancoLimpio} • ${oferta.referenciaPago}`;
                }
                await oferta.save();
                await sellarVentaInalterable(oferta);

                return res.json({
                    modo: 'simulador_academico',
                    mensaje: 'Pago PSE simulado aprobado en modo Sandbox académico',
                    estadoWompi: 'APPROVED',
                    estadoPago: oferta.estadoPago,
                    oferta
                });
            }

            oferta.estadoPago = 'fallido';
            await oferta.save();

            return res.json({
                modo: 'simulador_academico',
                mensaje: 'Pago PSE simulado rechazado (prueba controlada)',
                estadoWompi: 'DECLINED',
                estadoPago: oferta.estadoPago,
                oferta
            });
        }

        const esSandbox = publicKey.startsWith('pub_test_');
        const baseApi = esSandbox ? 'https://sandbox.wompi.co/v1' : 'https://production.wompi.co/v1';
        const resp = await consultarJsonHttps(`${baseApi}/transactions/${encodeURIComponent(transactionId)}`);

        const tx = resp?.data?.data;
        if (!resp.ok || !tx) {
            return res.status(400).json({ mensaje: 'No se pudo consultar la transacción en Wompi' });
        }

        if (oferta.referenciaPago && tx.reference && tx.reference !== oferta.referenciaPago) {
            return res.status(400).json({ mensaje: 'La referencia de la transacción no coincide con esta oferta' });
        }

        const estadoWompi = String(tx.status || '').toUpperCase();
        oferta.metodoPago = 'pse_wompi';
        oferta.wompiTransactionId = tx.id || transactionId;

        if (estadoWompi === 'APPROVED') {
            oferta.estadoPago = 'pagado';
            oferta.fechaPago = tx.finalized_at ? new Date(tx.finalized_at) : new Date();
            await sellarVentaInalterable(oferta);
        } else if (['DECLINED', 'VOIDED', 'ERROR'].includes(estadoWompi)) {
            oferta.estadoPago = 'fallido';
        } else {
            oferta.estadoPago = 'reportado';
        }

        await oferta.save();

        res.json({
            modo: 'wompi_checkout',
            estadoWompi,
            estadoPago: oferta.estadoPago,
            oferta
        });
    } catch (error) {
        res.status(500).json({ mensaje: error.message });
    }
};

// Genera los datos verificados (SHA-256) para el Comprobante de Venta imprimible
const obtenerComprobanteVenta = async (req, res) => {
    try {
        const oferta = await Oferta.findById(req.params.id)
            .populate('agricultorId', 'nombre finca.nombre finca.ubicacion')
            .populate('compradorId', 'nombre');

        if (!oferta) {
            return res.status(404).json({ mensaje: 'Oferta no encontrada' });
        }

        const agricultorIdStr = oferta.agricultorId?._id ? oferta.agricultorId._id.toString() : String(oferta.agricultorId);
        const compradorIdStr = oferta.compradorId?._id ? oferta.compradorId._id.toString() : String(oferta.compradorId);

        if (agricultorIdStr !== req.usuario.id && compradorIdStr !== req.usuario.id) {
            return res.status(403).json({ mensaje: 'No autorizado para ver este comprobante' });
        }

        if (oferta.estado !== 'aceptada') {
            return res.status(400).json({ mensaje: 'El comprobante solo existe para ofertas aceptadas' });
        }

        const ofertaPlana = {
            _id: oferta._id,
            agricultorId: agricultorIdStr,
            compradorId: compradorIdStr,
            compradorNombre: oferta.compradorNombre,
            nombreProducto: oferta.nombreProducto,
            cantidadSolicitada: oferta.cantidadSolicitada,
            unidadMedida: oferta.unidadMedida,
            precioOfrecido: oferta.precioOfrecido,
            updatedAt: oferta.updatedAt
        };
        const registro = await sellarVentaInalterable(ofertaPlana);
        const huellaCalculada = RegistroVenta.generarHuella(registro.toObject ? registro.toObject() : registro);

        res.json({
            comprobante: {
                codigoVerificacion: registro.codigoVerificacion,
                hashRegistro: registro.hashRegistro,
                hashAnterior: registro.hashAnterior,
                integro: huellaCalculada === registro.hashRegistro,
                fechaVenta: registro.fechaVenta,
                nombreProducto: registro.nombreProducto,
                cantidad: registro.cantidad,
                unidadMedida: registro.unidadMedida,
                precioUnitario: registro.precioUnitario,
                totalVenta: registro.totalVenta,
                metodoPago: oferta.metodoPago || 'sin_definir',
                estadoPago: oferta.estadoPago || 'pendiente',
                referenciaPago: oferta.referenciaPago || '',
                fotoEntrega: oferta.fotoEntrega || '',
                firmaCliente: oferta.firmaCliente || '',
                wompiTransactionId: oferta.wompiTransactionId || '',
                fechaPago: oferta.fechaPago || null,
                agricultor: {
                    nombre: oferta.agricultorId?.nombre || 'Productor AgroXpress',
                    finca: oferta.agricultorId?.finca?.nombre || '',
                    ubicacion: oferta.agricultorId?.finca?.ubicacion || ''
                },
                comprador: {
                    nombre: oferta.compradorNombre || oferta.compradorId?.nombre || 'Comprador'
                }
            }
        });
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
    registrarMetodoPago,
    confirmarPagoRecibido,
    iniciarPagoWompiPSE,
    verificarPagoWompi,
    obtenerComprobanteVenta,
    obtenerRegistroVentas
};

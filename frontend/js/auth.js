// =====================
// AGROXPRESS - AUTENTICACIÓN, PERFIL, PAGOS Y COMPROBANTE
// =====================

const API_URL = 'http://localhost:3000/api';

// ============ MENSAJES AMIGABLES ============

const MENSAJES = {
    sinConexion: 'No pudimos conectar con el servidor. Verifica tu conexión.',
    camposVacios: 'Falta llenar algunos campos',
    emailInvalido: 'Escribe un correo válido',
    emailRegistrado: 'Este correo ya está registrado',
    passwordCorta: 'La contraseña debe tener al menos 6 caracteres',
    passwordDebil: 'La contraseña debe tener mínimo 6 caracteres, una mayúscula, una minúscula y un número',
    passwordNoCoincide: 'Las contraseñas no coinciden',
    credencialesMalas: 'Correo o contraseña incorrectos',
    terminosNoAceptados: 'Debes aceptar los términos',

    registroExitoso: ' ¡Bienvenido a AgroXpress!',
    loginExitoso: '¡Inicio exitoso!'
};

// ============ MOSTRAR MENSAJE ============
function mostrarMensaje(elemento, mensaje, tipo) {
    if (!elemento) return;
    elemento.textContent = mensaje;
    elemento.className = 'form-message ' + tipo;
    elemento.style.display = 'block';
}

// ============ LOGIN ============
const loginForm = document.getElementById('loginForm');
const loginMsg = document.getElementById('loginMessage');

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;

        if (!email && !password) {
            mostrarMensaje(loginMsg, MENSAJES.camposVacios, 'error');
            return;
        }

        if (!email) {
            mostrarMensaje(loginMsg, MENSAJES.emailInvalido, 'error');
            return;
        }

        if (!password) {
            mostrarMensaje(loginMsg, ' Escribe tu contraseña', 'error');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error(MENSAJES.credencialesMalas);
                }
                throw new Error(data.mensaje || 'Algo salió mal');
            }

            localStorage.setItem('token', data.token);
            localStorage.setItem('usuario', JSON.stringify(data.usuario));

            mostrarMensaje(loginMsg, MENSAJES.loginExitoso, 'success');

            setTimeout(() => window.location.href = 'dashboard.html', 1000);

        } catch (error) {
            if (error.message.includes('fetch') || error.message.includes('Failed')) {
                mostrarMensaje(loginMsg, MENSAJES.sinConexion, 'error');
            } else {
                mostrarMensaje(loginMsg, error.message, 'error');
            }
        }
    });
}

// ============ REGISTRO ============
const registerForm = document.getElementById('registerForm');
const registerMsg = document.getElementById('registerMessage');

if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nombre = document.getElementById('registerNombre').value.trim();
        const apellido = document.getElementById('registerApellido').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const tipo = document.getElementById('registerType').value;
        const password = document.getElementById('registerPassword').value;
        const confirm = document.getElementById('registerConfirm').value;
        const terminos = document.getElementById('terms').checked;

        if (!nombre || !apellido || !email || !tipo || !password || !confirm) {
            mostrarMensaje(registerMsg, MENSAJES.camposVacios, 'error');
            return;
        }

        if (!terminos) {
            mostrarMensaje(registerMsg, MENSAJES.terminosNoAceptados, 'error');
            return;
        }

        const tieneMayuscula = /[A-Z]/.test(password);
        const tieneMinuscula = /[a-z]/.test(password);
        const tieneNumero = /[0-9]/.test(password);

        if (password.length < 6 || !tieneMayuscula || !tieneMinuscula || !tieneNumero) {
            mostrarMensaje(registerMsg, MENSAJES.passwordDebil, 'error');
            return;
        }

        if (password !== confirm) {
            mostrarMensaje(registerMsg, MENSAJES.passwordNoCoincide, 'error');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/auth/registrar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nombre: nombre + ' ' + apellido,
                    email,
                    password,
                    tipo
                })
            });

            const data = await response.json();

            if (!response.ok) {
                if (data.mensaje && data.mensaje.includes('ya registrado')) {
                    throw new Error(MENSAJES.emailRegistrado);
                }
                if (data.mensaje && data.mensaje.includes('contraseña')) {
                    throw new Error(MENSAJES.passwordCorta);
                }
                throw new Error(data.mensaje || 'Algo salió mal');
            }

            localStorage.setItem('token', data.token);
            localStorage.setItem('usuario', JSON.stringify(data.usuario));

            mostrarMensaje(registerMsg, MENSAJES.registroExitoso, 'success');

            setTimeout(() => window.location.href = 'dashboard.html', 1500);

        } catch (error) {
            if (error.message.includes('fetch') || error.message.includes('Failed')) {
                mostrarMensaje(registerMsg, MENSAJES.sinConexion, 'error');
            } else {
                mostrarMensaje(registerMsg, error.message, 'error');
            }
        }
    });
}

// ============ VERIFICAR SESIÓN ============
function verificarSesion() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// ============ OBTENER USUARIO ============
function obtenerUsuario() {
    const usuario = localStorage.getItem('usuario');
    return usuario ? JSON.parse(usuario) : null;
}

// ============ CERRAR SESIÓN ============
function cerrarSesion() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.location.href = 'login.html';
}

// ============ MENÚ LATERAL, NAVEGACIÓN Y PERFIL ============
function aplicarPreferenciasAccesibilidad() {
    const escala = localStorage.getItem('agro_font_scale') || '18px';
    const altoContraste = localStorage.getItem('agro_high_contrast') === 'true';
    document.documentElement.style.fontSize = escala;
    document.body.classList.toggle('high-contrast', altoContraste);
}

aplicarPreferenciasAccesibilidad();

function inicializarSidebarYPerfil() {
    const dashboardLayout = document.querySelector('.dashboard');
    const sidebar = document.getElementById('sidebar');
    const menuToggle = document.getElementById('menuToggle');

    if (sidebar && menuToggle) {
        menuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            if (window.innerWidth <= 992) {
                sidebar.classList.toggle('open');
            } else if (dashboardLayout) {
                dashboardLayout.classList.toggle('sidebar-collapsed');
            }
        });

        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 992 && !sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
                sidebar.classList.remove('open');
            }
        });
    }

    const rutasMenu = {
        'inicio': 'dashboard.html',
        'dashboard': 'dashboard.html',
        'cultivos': 'cultivos.html',
        'marketplace': 'marketplace.html',
        'comunidad': 'comunidad.html',
        'ajustes': 'ajustes.html'
    };

    document.querySelectorAll('.sidebar-menu li').forEach((item) => {
        item.addEventListener('click', () => {
            const clave = item.textContent.trim().toLowerCase();
            const destino = rutasMenu[clave];
            if (destino && !window.location.pathname.endsWith(destino)) {
                window.location.href = destino;
            }
        });
    });

    const user = obtenerUsuario();
    const claveExtra = 'perfilExtra_' + (user?.email || 'usuario');
    const leerExtra = () => {
        try {
            return JSON.parse(localStorage.getItem(claveExtra)) || {};
        } catch {
            return {};
        }
    };
    const guardarExtra = (datos) => {
        localStorage.setItem(claveExtra, JSON.stringify(datos));
    };

    const pintarAvatar = (elemento, foto, nombre) => {
        if (!elemento) return;
        if (foto) {
            elemento.innerHTML = `<img src="${foto}" alt="${nombre}">`;
        } else {
            elemento.textContent = (nombre || 'U').charAt(0).toUpperCase();
        }
    };

    const extraInicial = leerExtra();
    const sidebarAvatar = document.getElementById('userAvatar');
    if (extraInicial.foto && sidebarAvatar) {
        pintarAvatar(sidebarAvatar, extraInicial.foto, user?.nombre || 'Usuario');
    }

    const userInfoBtn = document.getElementById('userInfoBtn');
    const modalPerfil = document.getElementById('modalPerfil');
    const closePerfilModal = document.getElementById('closePerfilModal');
    const btnCerrarPerfil = document.getElementById('btnCerrarPerfil');
    const inputFotoPerfil = document.getElementById('inputFotoPerfil');
    const inputWhatsapp = document.getElementById('inputWhatsapp');
    const btnGuardarWhatsapp = document.getElementById('btnGuardarWhatsapp');

    function aplicarEstadoWhatsapp(yaGuardado) {
        if (!inputWhatsapp || !btnGuardarWhatsapp) return;
        if (yaGuardado) {
            inputWhatsapp.disabled = true;
            btnGuardarWhatsapp.innerHTML = '<i class="bi bi-pencil-fill"></i> Editar';
            btnGuardarWhatsapp.classList.add('btn-edit-mode');
        } else {
            inputWhatsapp.disabled = false;
            btnGuardarWhatsapp.innerHTML = '<i class="bi bi-check-lg"></i> Guardar';
            btnGuardarWhatsapp.classList.remove('btn-edit-mode');
        }
    }

    if (userInfoBtn && modalPerfil) {
        let confirmBox = document.getElementById('deleteConfirmBox');

        const abrirPerfil = () => {
            const extra = leerExtra();
            const nombre = user?.nombre || 'Usuario';
            const rolesTexto = {
                agricultor: 'Agricultor (Productor)',
                comprador: 'Comprador',
                estudiante: 'Estudiante'
            };

            pintarAvatar(document.getElementById('perfilAvatarLg'), extra.foto, nombre);
            document.getElementById('perfilNombre').textContent = nombre;
            document.getElementById('perfilRolBadge').textContent = rolesTexto[user?.tipo] || 'Agricultor';
            document.getElementById('perfilEmail').textContent = user?.email || 'No registrado';
            document.getElementById('perfilTipo').textContent = rolesTexto[user?.tipo] || 'Agricultor';

            if (inputWhatsapp) {
                inputWhatsapp.value = extra.whatsapp || '';
            }
            aplicarEstadoWhatsapp(!!extra.whatsapp);
            if (confirmBox) confirmBox.classList.add('hidden');
            modalPerfil.classList.add('open');
        };

        const cerrarPerfil = () => modalPerfil.classList.remove('open');

        const modalBody = modalPerfil.querySelector('.modal-body') || modalPerfil.querySelector('.modal-content');
        const modalFooter = modalPerfil.querySelector('.modal-footer') || (btnCerrarPerfil ? btnCerrarPerfil.parentElement : modalBody);

        if (modalBody && modalFooter && !document.getElementById('btnEliminarCuenta')) {
            confirmBox = document.createElement('div');
            confirmBox.id = 'deleteConfirmBox';
            confirmBox.className = 'delete-confirm-box hidden';
            confirmBox.style.cssText = 'margin-top:14px; padding:12px 14px; background:#FFF5F5; border:1px solid #FFCDD2; border-radius:10px; color:#B71C1C; font-size:0.9rem;';
            confirmBox.innerHTML = `
                <strong>⚠️ ¿Seguro que quieres eliminar tu cuenta?</strong>
                <p style="margin:6px 0 10px 0;">Se borrará de forma definitiva tu cuenta, tus cultivos, ofertas y publicaciones. Esta acción no se puede deshacer.</p>
                <div class="delete-confirm-actions" style="display:flex; gap:8px; flex-wrap:wrap;">
                    <button type="button" class="btn-confirm-delete" id="btnConfirmarEliminar" style="background:#C62828; color:#fff; border:none; padding:8px 14px; border-radius:8px; font-weight:600; cursor:pointer; min-height:42px;">Sí, eliminar definitivamente</button>
                    <button type="button" class="btn-cancel" id="btnCancelarEliminar" style="min-height:42px; padding:8px 14px;">Cancelar</button>
                </div>
            `;
            modalBody.appendChild(confirmBox);

            const btnEliminar = document.createElement('button');
            btnEliminar.type = 'button';
            btnEliminar.id = 'btnEliminarCuenta';
            btnEliminar.className = 'btn-delete-account';
            btnEliminar.style.cssText = 'margin-right:auto; background:#FFF5F5; color:#C62828; border:1px solid #FFCDD2; padding:8px 14px; border-radius:10px; font-weight:600; cursor:pointer; display:inline-flex; align-items:center; gap:6px; min-height:42px;';
            btnEliminar.innerHTML = '<i class="bi bi-trash"></i> Eliminar cuenta';

            if (modalFooter === modalBody) {
                modalFooter.appendChild(btnEliminar);
            } else {
                modalFooter.style.display = 'flex';
                modalFooter.style.alignItems = 'center';
                modalFooter.style.justifyContent = 'flex-end';
                modalFooter.style.gap = '10px';
                modalFooter.prepend(btnEliminar);
            }

            btnEliminar.addEventListener('click', () => {
                confirmBox.classList.toggle('hidden');
                confirmBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            });

            document.getElementById('btnCancelarEliminar').addEventListener('click', () => {
                confirmBox.classList.add('hidden');
            });

            document.getElementById('btnConfirmarEliminar').addEventListener('click', async () => {
                const token = localStorage.getItem('token');
                try {
                    const res = await fetch(`${API_URL}/auth/cuenta`, {
                        method: 'DELETE',
                        headers: { 'Authorization': 'Bearer ' + token }
                    });
                    if (!res.ok) throw new Error('No se pudo eliminar la cuenta');

                    localStorage.removeItem(claveExtra);
                    localStorage.removeItem('agro_finca_' + (user?.email || 'usuario'));
                    cerrarSesion();
                } catch (error) {
                    alert('❌ ' + error.message);
                }
            });
        }

        userInfoBtn.addEventListener('click', abrirPerfil);
        userInfoBtn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                abrirPerfil();
            }
        });

        if (closePerfilModal) closePerfilModal.addEventListener('click', cerrarPerfil);
        if (btnCerrarPerfil) btnCerrarPerfil.addEventListener('click', cerrarPerfil);
        modalPerfil.addEventListener('click', (e) => {
            if (e.target === modalPerfil) cerrarPerfil();
        });
    }

    if (inputFotoPerfil) {
        inputFotoPerfil.addEventListener('change', (e) => {
            const archivo = e.target.files[0];
            if (!archivo) return;

            const lector = new FileReader();
            lector.onload = (ev) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const max = 200;
                    canvas.width = max;
                    canvas.height = max;
                    const ctx = canvas.getContext('2d');
                    const lado = Math.min(img.width, img.height);
                    const sx = (img.width - lado) / 2;
                    const sy = (img.height - lado) / 2;
                    ctx.drawImage(img, sx, sy, lado, lado, 0, 0, max, max);

                    const fotoReducida = canvas.toDataURL('image/jpeg', 0.8);
                    const extra = leerExtra();
                    extra.foto = fotoReducida;
                    guardarExtra(extra);

                    const nombre = user?.nombre || 'Usuario';
                    pintarAvatar(document.getElementById('perfilAvatarLg'), fotoReducida, nombre);
                    pintarAvatar(document.getElementById('userAvatar'), fotoReducida, nombre);
                };
                img.src = ev.target.result;
            };
            lector.readAsDataURL(archivo);
        });
    }

    if (btnGuardarWhatsapp && inputWhatsapp) {
        btnGuardarWhatsapp.addEventListener('click', async () => {
            if (inputWhatsapp.disabled) {
                aplicarEstadoWhatsapp(false);
                inputWhatsapp.focus();
                return;
            }

            const numero = inputWhatsapp.value.trim();
            if (numero.replace(/\D/g, '').length < 7) {
                inputWhatsapp.focus();
                return;
            }

            const extra = leerExtra();
            extra.whatsapp = numero;
            guardarExtra(extra);

            try {
                const token = localStorage.getItem('token');
                if (token) {
                    await fetch(`${API_URL}/auth/telefono`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer ' + token
                        },
                        body: JSON.stringify({ telefono: numero })
                    });
                }
            } catch (err) {
                console.error('No se pudo sincronizar teléfono:', err);
            }

            inputWhatsapp.disabled = true;
            btnGuardarWhatsapp.innerHTML = '<i class="bi bi-check-circle-fill"></i> ¡Listo!';
            btnGuardarWhatsapp.classList.remove('btn-edit-mode');

            setTimeout(() => {
                aplicarEstadoWhatsapp(true);
            }, 1200);
        });
    }
}

// ============ CAMPANITA DE OFERTAS, PAGOS PSE Y COMPROBANTE ============
let ofertasRecibidasCache = [];
let ofertasEnviadasCache = [];
let tabNotifActual = 'recibidas';

function escaparTexto(texto) {
    const div = document.createElement('div');
    div.textContent = texto || '';
    return div.innerHTML;
}

function textoMetodoPago(metodo) {
    const mapa = {
        pse_wompi: 'PSE (Wompi)',
        nequi_breb: 'Nequi / Bre-B',
        contra_entrega: 'Contra entrega',
        sin_definir: 'Por definir'
    };
    return mapa[metodo] || 'Por definir';
}

function badgeEstadoPagoHtml(estadoPago, metodoPago) {
    const metodoTxt = textoMetodoPago(metodoPago);
    if (estadoPago === 'pagado') {
        return `<span class="badge badge-success">✅ Pagado (${escaparTexto(metodoTxt)})</span>`;
    }
    if (estadoPago === 'reportado') {
        return `<span class="badge badge-info">⏳ ${escaparTexto(metodoTxt)} por confirmar</span>`;
    }
    if (estadoPago === 'fallido') {
        return `<span class="badge badge-danger">❌ Pago PSE no aprobado</span>`;
    }
    return `<span class="badge badge-warning">💳 Pago pendiente</span>`;
}

function mostrarAvisoNotif(texto, tipo = 'success') {
    let box = document.getElementById('notifAvisoBox');
    const lista = document.getElementById('notifLista');
    if (!lista) return;

    if (!box) {
        box = document.createElement('div');
        box.id = 'notifAvisoBox';
        box.className = 'form-message';
        lista.parentNode.insertBefore(box, lista);
    }

    box.textContent = texto;
    box.className = 'form-message ' + tipo;
    box.style.display = 'block';
    setTimeout(() => {
        if (box) box.style.display = 'none';
    }, 6500);
}

async function cargarNotificaciones() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const [resRec, resEnv] = await Promise.all([
            fetch(`${API_URL}/ofertas/recibidas`, { headers: { 'Authorization': 'Bearer ' + token } }),
            fetch(`${API_URL}/ofertas/enviadas`, { headers: { 'Authorization': 'Bearer ' + token } })
        ]);

        if (resRec.ok) ofertasRecibidasCache = await resRec.json();
        if (resEnv.ok) ofertasEnviadasCache = await resEnv.json();

        const badge = document.getElementById('notifBadge');
        if (badge) {
            const pendientes = ofertasRecibidasCache.filter((o) => o.estado === 'pendiente').length;
            if (pendientes > 0) {
                badge.textContent = pendientes;
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }
        }

        renderizarNotificaciones();
    } catch (error) {
        console.error('Error cargando notificaciones:', error);
    }
}

function renderizarNotificaciones() {
    const lista = document.getElementById('notifLista');
    if (!lista) return;

    const datos = tabNotifActual === 'recibidas' ? ofertasRecibidasCache : ofertasEnviadasCache;

    if (datos.length === 0) {
        lista.innerHTML = `
            <div style="text-align:center; padding:30px 10px; color:var(--text-muted);">
                <i class="bi bi-bell-slash" style="font-size:2rem; display:block; margin-bottom:8px;"></i>
                No tienes ofertas ${tabNotifActual === 'recibidas' ? 'recibidas' : 'enviadas'} todavía.
            </div>`;
        return;
    }

    lista.innerHTML = datos.map((o) => {
        const estadoBadge = o.estado === 'aceptada' ? 'badge-success' :
                            o.estado === 'rechazada' ? 'badge-danger' : 'badge-warning';
        const estadoTexto = o.estado === 'aceptada' ? 'Aceptada' :
                            o.estado === 'rechazada' ? 'Rechazada' : 'Pendiente';
        const precioUnit = Number(o.precioOfrecido || 0);
        const totalVenta = precioUnit * Number(o.cantidadSolicitada || 0);
        const precioTxt = precioUnit.toLocaleString('es-CO');
        const totalTxt = totalVenta.toLocaleString('es-CO');
        const idSeguro = escaparTexto(o._id);

        const otraPersona = tabNotifActual === 'recibidas'
            ? `Comprador: <strong>${escaparTexto(o.compradorNombre)}</strong>`
            : `Productor: <strong>${escaparTexto(o.agricultorId?.nombre || 'Agricultor')}</strong>`;

        const botonesPendiente = (tabNotifActual === 'recibidas' && o.estado === 'pendiente') ? `
            <div class="notif-card-actions">
                <button type="button" class="btn-aceptar-oferta" onclick="responderOfertaUI('${idSeguro}', 'aceptada')">
                    <i class="bi bi-check-circle-fill"></i> Aceptar oferta
                </button>
                <button type="button" class="btn-rechazar-oferta" onclick="responderOfertaUI('${idSeguro}', 'rechazada')">
                    <i class="bi bi-x-circle-fill"></i> Rechazar
                </button>
            </div>` : '';

        const telefonoOpcional = tabNotifActual === 'recibidas' ? o.compradorTelefono : o.agricultorWhatsapp;
        const botonWaOpcional = (o.estado === 'aceptada' && telefonoOpcional) ? `
            <a href="https://wa.me/${escaparTexto(telefonoOpcional)}?text=${encodeURIComponent('Hola, coordinemos la entrega de ' + o.nombreProducto + ' en AgroXpress')}"
                target="_blank" rel="noopener" class="btn-wa-oferta">
                <i class="bi bi-whatsapp"></i> WhatsApp de ventas
            </a>` : '';

        // Zona de Pagos y Comprobante (solo cuando la oferta fue aceptada)
        let bloquePago = '';
        if (o.estado === 'aceptada') {
            const esCompradorTab = tabNotifActual === 'enviadas';
            const estadoPago = o.estadoPago || 'pendiente';
            const yaPagado = estadoPago === 'pagado';

            const botonesComprador = (esCompradorTab && !yaPagado) ? `
                <div class="pago-actions-row">
                    <button type="button" class="btn-pago-pse" onclick="pagarPorPSE('${idSeguro}')">
                        🏦 Pagar por PSE (Wompi)
                    </button>
                    <button type="button" class="btn-pago-alt" onclick="registrarAcuerdoPago('${idSeguro}', 'contra_entrega')">
                        💵 Contra entrega
                    </button>
                    <button type="button" class="btn-pago-alt" onclick="toggleNequiBox('${idSeguro}')">
                        📱 Nequi / Bre-B
                    </button>
                </div>
                <div class="pago-nequi-box hidden" id="nequiBox-${idSeguro}">
                    <input type="text" id="nequiRef-${idSeguro}" maxlength="60" placeholder="Número de comprobante Nequi/Bre-B (opcional)">
                    <button type="button" class="btn-pago-confirm" onclick="enviarNequiAcuerdo('${idSeguro}')">Reportar</button>
                </div>
            ` : '';

            const botonAgricultor = (!esCompradorTab && !yaPagado) ? `
                <div class="pago-actions-row">
                    <button type="button" class="btn-pago-confirm" onclick="confirmarPagoAgricultor('${idSeguro}')">
                        ✅ Confirmar pago recibido
                    </button>
                </div>
            ` : '';

            bloquePago = `
                <div class="oferta-pago-box">
                    <div class="oferta-pago-top">
                        <div>
                            <div class="oferta-pago-total">Total a pagar: <strong>$${totalTxt} COP</strong></div>
                            ${o.codigoVerificacion ? `<div class="oferta-codigo-sha">🔒 Sello: <strong>${escaparTexto(o.codigoVerificacion)}</strong></div>` : ''}
                        </div>
                        <div>
                            ${badgeEstadoPagoHtml(estadoPago, o.metodoPago)}
                        </div>
                    </div>
                    ${o.referenciaPago ? `<div class="oferta-pago-ref">Ref: ${escaparTexto(o.referenciaPago)}</div>` : ''}
                    ${botonesComprador}
                    ${botonAgricultor}
                    <div class="pago-comprobante-row">
                        <button type="button" class="btn-ver-comprobante" onclick="abrirComprobanteVenta('${idSeguro}')">
                            🧾 Ver / Imprimir Comprobante Verificado
                        </button>
                    </div>
                </div>
            `;
        }

        const chatAceptado = o.estado === 'aceptada' ? `
            <div class="oferta-chat-box">
                <div class="oferta-chat-title">
                    <i class="bi bi-chat-dots-fill"></i> Chat privado de coordinación ${botonWaOpcional}
                </div>
                <div class="oferta-chat-msgs">
                    ${(o.mensajesVenta && o.mensajesVenta.length > 0)
                        ? o.mensajesVenta.map((m) => `
                            <div class="oferta-chat-msg">
                                <strong>${escaparTexto(m.autorNombre)}:</strong> ${escaparTexto(m.texto)}
                            </div>`).join('')
                        : '<div class="text-muted" style="font-size:0.84rem;">Acuerden aquí el lugar y hora de entrega sin compartir números personales.</div>'
                    }
                </div>
                <form class="oferta-chat-form" onsubmit="enviarMensajeOfertaUI(event, '${idSeguro}')">
                    <input type="text" placeholder="Escribe lugar, día o detalle de entrega..." required>
                    <button type="submit">Enviar</button>
                </form>
            </div>` : '';

        return `
        <div class="notif-card ${o.estado === 'pendiente' ? 'pendiente' : ''}">
            <div class="notif-card-top">
                <span class="notif-card-title">🌱 ${escaparTexto(o.nombreProducto)} (${o.cantidadSolicitada} ${escaparTexto(o.unidadMedida || 'kg')})</span>
                <span class="badge ${estadoBadge}">${estadoTexto}</span>
            </div>
            <div class="notif-card-meta">
                <div>${otraPersona} • Oferta: <strong>$${precioTxt} COP / ${escaparTexto(o.unidadMedida || 'kg')}</strong></div>
                ${o.mensaje ? `<div style="margin-top:4px; color:var(--text-muted);">"${escaparTexto(o.mensaje)}"</div>` : ''}
            </div>
            ${botonesPendiente}
            ${bloquePago}
            ${chatAceptado}
        </div>`;
    }).join('');
}

async function responderOfertaUI(ofertaId, estado) {
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`${API_URL}/ofertas/${ofertaId}/estado`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({ estado })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.mensaje || 'No se pudo responder la oferta');
        await cargarNotificaciones();
    } catch (error) {
        mostrarAvisoNotif('❌ ' + error.message, 'error');
    }
}

async function enviarMensajeOfertaUI(event, ofertaId) {
    event.preventDefault();
    const form = event.target;
    const input = form.querySelector('input');
    const texto = input.value.trim();
    if (!texto) return;

    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`${API_URL}/ofertas/${ofertaId}/mensajes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({ texto })
        });
        if (!res.ok) throw new Error('No se pudo enviar el mensaje');
        input.value = '';
        await cargarNotificaciones();
    } catch (error) {
        mostrarAvisoNotif('❌ ' + error.message, 'error');
    }
}

function toggleNequiBox(ofertaId) {
    const box = document.getElementById('nequiBox-' + ofertaId);
    if (!box) return;
    box.classList.toggle('hidden');
    if (!box.classList.contains('hidden')) {
        document.getElementById('nequiRef-' + ofertaId)?.focus();
    }
}

async function enviarNequiAcuerdo(ofertaId) {
    const refInput = document.getElementById('nequiRef-' + ofertaId);
    const ref = refInput ? refInput.value.trim() : '';
    await registrarAcuerdoPago(ofertaId, 'nequi_breb', ref);
}

async function registrarAcuerdoPago(ofertaId, metodoPago, referenciaPago = '') {
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`${API_URL}/ofertas/${ofertaId}/pago-acuerdo`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({ metodoPago, referenciaPago })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.mensaje || 'No se pudo registrar el método de pago');

        mostrarAvisoNotif('✅ ' + (data.mensaje || 'Método de pago guardado'), 'success');
        await cargarNotificaciones();
    } catch (error) {
        mostrarAvisoNotif('❌ ' + error.message, 'error');
    }
}

async function confirmarPagoAgricultor(ofertaId) {
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`${API_URL}/ofertas/${ofertaId}/pago-confirmar`, {
            method: 'PUT',
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.mensaje || 'No se pudo confirmar el pago');

        mostrarAvisoNotif('✅ ¡Pago confirmado! Ya aparece como Pagado en el Comprobante.', 'success');
        await cargarNotificaciones();
    } catch (error) {
        mostrarAvisoNotif('❌ ' + error.message, 'error');
    }
}

async function pagarPorPSE(ofertaId) {
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`${API_URL}/ofertas/${ofertaId}/pago-wompi`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            }
        });
        const data = await res.json();
        if (!res.ok) {
            if (data.requiereConfiguracion) {
                mostrarAvisoNotif('🔑 ' + data.mensaje + ' Mientras tanto puedes usar Contra entrega o Nequi / Bre-B.', 'error');
                return;
            }
            throw new Error(data.mensaje || 'No se pudo iniciar el pago PSE');
        }

        const returnUrl = window.location.origin + window.location.pathname + '?wompiOferta=' + encodeURIComponent(ofertaId);
        const params = new URLSearchParams({
            'public-key': data.publicKey,
            'currency': data.currency || 'COP',
            'amount-in-cents': String(data.amountInCents),
            'reference': data.reference,
            'signature:integrity': data.signatureIntegrity,
            'redirect-url': returnUrl
        });

        window.location.href = `${data.checkoutUrl}?${params.toString()}`;
    } catch (error) {
        mostrarAvisoNotif('❌ ' + error.message, 'error');
    }
}

async function verificarRetornoWompi() {
    const params = new URLSearchParams(window.location.search);
    const wompiOferta = params.get('wompiOferta');
    const txId = params.get('id');

    if (!wompiOferta || !txId) return;

    const modalNotif = document.getElementById('modalNotificaciones');
    const tabRec = document.getElementById('tabRecibidas');
    const tabEnv = document.getElementById('tabEnviadas');

    if (modalNotif) {
        tabNotifActual = 'enviadas';
        if (tabEnv && tabRec) {
            tabEnv.className = 'btn-save';
            tabRec.className = 'btn-cancel';
        }
        modalNotif.classList.add('open');
    }

    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`${API_URL}/ofertas/${encodeURIComponent(wompiOferta)}/pago-wompi/verificar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({ transactionId: txId })
        });
        const data = await res.json();

        params.delete('wompiOferta');
        params.delete('id');
        params.delete('env');
        const nuevaUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
        window.history.replaceState({}, '', nuevaUrl);

        if (!res.ok) throw new Error(data.mensaje || 'No se pudo verificar el pago PSE');

        if (data.estadoPago === 'pagado') {
            mostrarAvisoNotif('✅ ¡Pago por PSE aprobado en Wompi! Ya puedes descargar tu Comprobante Verificado.', 'success');
        } else if (data.estadoPago === 'fallido') {
            mostrarAvisoNotif('❌ El pago por PSE fue rechazado o cancelado en el banco. Puedes intentar de nuevo.', 'error');
        } else {
            mostrarAvisoNotif('⏳ Tu pago PSE está en proceso de confirmación bancaria.', 'success');
        }

        await cargarNotificaciones();
    } catch (error) {
        mostrarAvisoNotif('❌ ' + error.message, 'error');
    }
}

// ============ MODAL COMPROBANTE DE VENTA VERIFICADA (SHA-256) ============
function asegurarModalComprobante() {
    let modal = document.getElementById('modalComprobanteVenta');
    if (modal) return modal;

    modal = document.createElement('div');
    modal.id = 'modalComprobanteVenta';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content comprobante-modal-content">
            <div class="modal-header no-print">
                <h2>🧾 Comprobante de Venta</h2>
                <button type="button" class="close-modal" id="closeComprobanteModal" aria-label="Cerrar"><i class="bi bi-x-lg"></i></button>
            </div>
            <div class="modal-body" id="comprobanteBody">
                <p class="text-muted text-center">Cargando comprobante...</p>
            </div>
            <div class="modal-footer no-print" style="justify-content:space-between; flex-wrap:wrap; gap:8px;">
                <button type="button" class="btn-cancel" id="btnCerrarComprobante">Cerrar</button>
                <button type="button" class="btn-save" id="btnImprimirComprobante">
                    <i class="bi bi-printer-fill"></i> Imprimir / Guardar PDF
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    const cerrar = () => modal.classList.remove('open');
    document.getElementById('closeComprobanteModal').addEventListener('click', cerrar);
    document.getElementById('btnCerrarComprobante').addEventListener('click', cerrar);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) cerrar();
    });
    document.getElementById('btnImprimirComprobante').addEventListener('click', imprimirComprobanteVenta);

    return modal;
}

function imprimirComprobanteVenta() {
    document.body.classList.add('printing-comprobante');
    const limpiar = () => document.body.classList.remove('printing-comprobante');
    window.addEventListener('afterprint', limpiar, { once: true });
    window.print();
    setTimeout(limpiar, 1500);
}

async function abrirComprobanteVenta(ofertaId) {
    const modal = asegurarModalComprobante();
    const cuerpo = document.getElementById('comprobanteBody');
    cuerpo.innerHTML = '<p class="text-muted text-center">Generando comprobante verificado...</p>';
    modal.classList.add('open');

    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`${API_URL}/ofertas/${ofertaId}/comprobante`, {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.mensaje || 'No se pudo cargar el comprobante');

        const c = data.comprobante;
        const fechaVenta = new Date(c.fechaVenta).toLocaleString('es-CO', {
            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
        const fechaPagoTxt = c.fechaPago
            ? new Date(c.fechaPago).toLocaleString('es-CO', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
            : 'Pendiente';

        const fincaTxt = [c.agricultor?.finca, c.agricultor?.ubicacion].filter(Boolean).join(' • ');

        cuerpo.innerHTML = `
            <div class="comprobante-paper">
                <div class="comprobante-top">
                    <div>
                        <div class="comprobante-brand">🌱 AgroXpress</div>
                        <div class="comprobante-subbrand">Comprobante de Venta Verificada • 0% Intermediarios</div>
                    </div>
                    <div class="comprobante-code-box">
                        <small>CÓDIGO DE VERIFICACIÓN</small>
                        <strong>${escaparTexto(c.codigoVerificacion)}</strong>
                    </div>
                </div>

                <div class="comprobante-integrity ${c.integro ? 'ok' : 'warn'}">
                    ${c.integro
                        ? '🛡️ Sello criptográfico SHA-256 verificado e íntegro (sin alteraciones)'
                        : '⚠️ Advertencia: la huella SHA-256 no coincide'}
                </div>

                <div class="comprobante-grid-2">
                    <div class="comprobante-box">
                        <small>PRODUCTOR (AGRICULTOR)</small>
                        <strong>${escaparTexto(c.agricultor?.nombre || 'Agricultor')}</strong>
                        ${fincaTxt ? `<span>${escaparTexto(fincaTxt)}</span>` : ''}
                    </div>
                    <div class="comprobante-box">
                        <small>COMPRADOR</small>
                        <strong>${escaparTexto(c.comprador?.nombre || 'Comprador')}</strong>
                        <span>Fecha acuerdo: ${escaparTexto(fechaVenta)}</span>
                    </div>
                </div>

                <table class="comprobante-table">
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th>Cantidad</th>
                            <th>Valor unitario</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>${escaparTexto(c.nombreProducto)}</strong></td>
                            <td>${c.cantidad} ${escaparTexto(c.unidadMedida || 'kg')}</td>
                            <td>$${Number(c.precioUnitario || 0).toLocaleString('es-CO')} COP</td>
                            <td><strong>$${Number(c.totalVenta || 0).toLocaleString('es-CO')} COP</strong></td>
                        </tr>
                    </tbody>
                </table>

                <div class="comprobante-pago-resumen">
                    <div><span>Método de pago:</span> <strong>${escaparTexto(textoMetodoPago(c.metodoPago))}</strong></div>
                    <div><span>Estado del pago:</span> ${badgeEstadoPagoHtml(c.estadoPago, c.metodoPago)}</div>
                    ${c.referenciaPago ? `<div><span>Referencia:</span> <strong>${escaparTexto(c.referenciaPago)}</strong></div>` : ''}
                    ${c.wompiTransactionId ? `<div><span>ID Transacción Wompi:</span> <strong>${escaparTexto(c.wompiTransactionId)}</strong></div>` : ''}
                    <div><span>Fecha de pago:</span> <strong>${escaparTexto(fechaPagoTxt)}</strong></div>
                </div>

                <div class="comprobante-sha-box">
                    <small>Huella digital SHA-256 (Registro Inalterable):</small>
                    <code>${escaparTexto(c.hashRegistro)}</code>
                </div>

                <p class="comprobante-disclaimer">
                    Documento digital de operación directa dentro de AgroXpress respaldado con huella criptográfica SHA-256.
                    No constituye ni reemplaza factura electrónica de venta ante la DIAN.
                </p>
            </div>
        `;
    } catch (error) {
        cuerpo.innerHTML = `<div class="form-message error" style="display:block;">❌ ${escaparTexto(error.message)}</div>`;
    }
}

function inicializarNotificaciones() {
    const btnNotif = document.getElementById('btnNotificaciones');
    const modalNotif = document.getElementById('modalNotificaciones');
    const closeNotif = document.getElementById('closeNotifModal');
    const btnCerrarNotif = document.getElementById('btnCerrarNotif');
    const tabRec = document.getElementById('tabRecibidas');
    const tabEnv = document.getElementById('tabEnviadas');

    if (!btnNotif || !modalNotif) return;

    const abrirNotif = () => {
        cargarNotificaciones();
        modalNotif.classList.add('open');
    };
    const cerrarNotif = () => modalNotif.classList.remove('open');

    btnNotif.addEventListener('click', abrirNotif);
    if (closeNotif) closeNotif.addEventListener('click', cerrarNotif);
    if (btnCerrarNotif) btnCerrarNotif.addEventListener('click', cerrarNotif);
    modalNotif.addEventListener('click', (e) => {
        if (e.target === modalNotif) cerrarNotif();
    });

    if (tabRec && tabEnv) {
        tabRec.addEventListener('click', () => {
            tabNotifActual = 'recibidas';
            tabRec.className = 'btn-save';
            tabEnv.className = 'btn-cancel';
            renderizarNotificaciones();
        });
        tabEnv.addEventListener('click', () => {
            tabNotifActual = 'enviadas';
            tabEnv.className = 'btn-save';
            tabRec.className = 'btn-cancel';
            renderizarNotificaciones();
        });
    }

    cargarNotificaciones();
    verificarRetornoWompi();
}


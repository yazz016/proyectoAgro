// ============================================
// AGROXPRESS - AUTENTICACIÓN
// ============================================

const API_URL = 'http://localhost:3000/api';

// ============ MENSAJES AMIGABLES ============

const MENSAJES = {
    // Errores comunes
    sinConexion: 'No pudimos conectar con el servidor. Verifica tu conexión.',
    camposVacios: 'Falta llenar algunos campos',
    emailInvalido: 'Escribe un correo válido',
    emailRegistrado: 'Este correo ya está registrado',
    passwordCorta: 'La contraseña debe tener al menos 6 caracteres',
    passwordNoCoincide: 'Las contraseñas no coinciden',
    credencialesMalas: 'Correo o contraseña incorrectos',
    terminosNoAceptados: 'Debes aceptar los términos',

    // Éxitos
    registroExitoso: '🎉 ¡Bienvenido a AgroXpress!',
    loginExitoso: '¡Hola de nuevo!'
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

        // Validaciones amigables
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
            // Si es error de conexión
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

        // Validaciones amigables
        if (!nombre || !apellido || !email || !tipo || !password || !confirm) {
            mostrarMensaje(registerMsg, MENSAJES.camposVacios, 'error');
            return;
        }

        if (!terminos) {
            mostrarMensaje(registerMsg, MENSAJES.terminosNoAceptados, 'error');
            return;
        }

        if (password.length < 6) {
            mostrarMensaje(registerMsg, MENSAJES.passwordCorta, 'error');
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
                // Mensaje amigable según el error
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
            // Si es error de conexión
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

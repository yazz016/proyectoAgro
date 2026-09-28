// ============================================
// AGROXPRESS - AUTENTICACIÓN
// ============================================

const API_URL = 'http://localhost:3000/api';

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

        if (!email || !password) {
            mostrarMensaje(loginMsg, 'Completa todos los campos', 'error');
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
                throw new Error(data.mensaje || 'Error al iniciar sesión');
            }

            localStorage.setItem('token', data.token);
            localStorage.setItem('usuario', JSON.stringify(data.usuario));

            mostrarMensaje(loginMsg, '✅ Inicio exitoso', 'success');
            setTimeout(() => window.location.href = 'dashboard.html', 1000);

        } catch (error) {
            mostrarMensaje(loginMsg, '❌ ' + error.message, 'error');
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

        if (!nombre || !apellido || !email || !tipo || !password || !confirm) {
            mostrarMensaje(registerMsg, 'Completa todos los campos', 'error');
            return;
        }

        if (password.length < 6) {
            mostrarMensaje(registerMsg, 'La contraseña debe tener al menos 6 caracteres', 'error');
            return;
        }

        if (password !== confirm) {
            mostrarMensaje(registerMsg, 'Las contraseñas no coinciden', 'error');
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
                throw new Error(data.mensaje || 'Error al registrarse');
            }

            localStorage.setItem('token', data.token);
            localStorage.setItem('usuario', JSON.stringify(data.usuario));

            mostrarMensaje(registerMsg, '✅ Registro exitoso', 'success');
            setTimeout(() => window.location.href = 'dashboard.html', 1500);

        } catch (error) {
            mostrarMensaje(registerMsg, '❌ ' + error.message, 'error');
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

function obtenerUsuario() {
    const usuario = localStorage.getItem('usuario');
    return usuario ? JSON.parse(usuario) : null;
}

function cerrarSesion() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.location.href = 'login.html';
}


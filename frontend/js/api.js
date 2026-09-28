// ============================================
// AGROXPRESS - API CLIENT
// ============================================

const API_URL = 'http://localhost:3000/api';

class AgroXpressAPI {
    constructor() {
        this.token = localStorage.getItem('token');
    }

    getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };
        if (this.token) {
            headers['Authorization'] = 'Bearer ' + this.token;
        }
        return headers;
    }

    async handleResponse(response) {
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.mensaje || 'Error en la petición');
        }
        return response.json();
    }

    // ============ AUTH ============
    async login(email, password) {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await this.handleResponse(response);
        if (data.token) {
            this.token = data.token;
            localStorage.setItem('token', data.token);
            localStorage.setItem('usuario', JSON.stringify(data.usuario));
        }
        return data;
    }

    async registrar(datos) {
        const response = await fetch(`${API_URL}/auth/registrar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });
        const data = await this.handleResponse(response);
        if (data.token) {
            this.token = data.token;
            localStorage.setItem('token', data.token);
            localStorage.setItem('usuario', JSON.stringify(data.usuario));
        }
        return data;
    }

    logout() {
        this.token = null;
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
    }

    getUsuario() {
        const usuario = localStorage.getItem('usuario');
        return usuario ? JSON.parse(usuario) : null;
    }

    // ============ CULTIVOS ============
    async obtenerMisCultivos() {
        const response = await fetch(`${API_URL}/cultivos/mis-cultivos`, {
            headers: this.getHeaders()
        });
        return this.handleResponse(response);
    }

    async crearCultivo(datos) {
        const response = await fetch(`${API_URL}/cultivos`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(datos)
        });
        return this.handleResponse(response);
    }

    async actualizarCultivo(id, datos) {
        const response = await fetch(`${API_URL}/cultivos/${id}`, {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify(datos)
        });
        return this.handleResponse(response);
    }

    async eliminarCultivo(id) {
        const response = await fetch(`${API_URL}/cultivos/${id}`, {
            method: 'DELETE',
            headers: this.getHeaders()
        });
        return this.handleResponse(response);
    }
}

const api = new AgroXpressAPI();


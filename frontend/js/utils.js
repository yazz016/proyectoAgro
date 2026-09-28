// ============================================
// AGROXPRESS - UTILIDADES
// ============================================

function mostrarMensaje(elemento, mensaje, tipo) {
    if (!elemento) return;
    elemento.textContent = mensaje;
    elemento.className = 'form-message ' + tipo;
    elemento.style.display = 'block';
}

function ocultarMensaje(elemento) {
    if (!elemento) return;
    elemento.style.display = 'none';
}

function formatDate(date) {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function getBadgeClass(estado) {
    const mapa = {
        'En crecimiento': 'badge-success',
        'En desarrollo': 'badge-warning',
        'Requiere atención': 'badge-danger',
        'Cosechado': 'badge-info'
    };
    return mapa[estado] || 'badge-secondary';
}


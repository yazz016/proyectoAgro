import React, { useState } from 'react';

/**
 * Componente: CatalogoAgroXpress
 * Descripción: Muestra el catálogo de cosechas del Marketplace de AgroXpress
 * con filtro por búsqueda, categoría y cálculo automático del valor total.
 * Estándar: PascalCase para componente, camelCase para estados y funciones.
 */
function CatalogoAgroXpress() {
    // Estado inicial con productos representativos de AgroXpress
    const [cultivos] = useState([
        {
            id: 1,
            nombre: 'Papa Criolla Lavada',
            categoria: 'Tubérculos',
            cantidad: 50,
            unidad: 'Kilo',
            precioUnitario: 3500,
            agricultor: 'Carlos Mendoza',
            ciudad: 'Tunja'
        },
        {
            id: 2,
            nombre: 'Café Especial Huila',
            categoria: 'Granos',
            cantidad: 20,
            unidad: 'Bulto',
            precioUnitario: 185000,
            agricultor: 'María Fernanda Ruiz',
            ciudad: 'Pitalito'
        },
        {
            id: 3,
            nombre: 'Aguacate Hass Exportación',
            categoria: 'Frutas',
            cantidad: 120,
            unidad: 'Kilo',
            precioUnitario: 6200,
            agricultor: 'Luis Alberto Gómez',
            ciudad: 'Rionegro'
        }
    ]);

    // Estados para controlar filtros de búsqueda y selección
    const [busqueda, setBusqueda] = useState('');
    const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('Todas');
    const [mensajeOferta, setMensajeOferta] = useState('');

    // Formateador de moneda en pesos colombianos (COP)
    const formatearCOP = (valor) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            maximumFractionDigits: 0
        }).format(valor);
    };

    // Filtrado dinámico de cultivos según texto y categoría
    const cultivosFiltrados = cultivos.filter((cultivo) => {
        const coincideNombre = cultivo.nombre
            .toLowerCase()
            .includes(busqueda.toLowerCase());
        const coincideCategoria =
            categoriaSeleccionada === 'Todas' ||
            cultivo.categoria === categoriaSeleccionada;

        return coincideNombre && coincideCategoria;
    });

    // Manejador de evento onClick para simular envío de oferta
    const handleOfertar = (cultivo) => {
        const valorTotal = cultivo.cantidad * cultivo.precioUnitario;
        setMensajeOferta(
            `Oferta iniciada para ${cultivo.nombre} (${cultivo.cantidad} ${cultivo.unidad}s) - Total lote: ${formatearCOP(valorTotal)}`
        );
    };

    return (
        <section className="agroxpress-react-section">
            <h2>Marketplace AgroXpress (Componente React)</h2>

            {/* Controles de búsqueda y filtro con eventos onChange */}
            <div className="filtros-react">
                <input
                    type="text"
                    placeholder="Buscar producto agrícola..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                />
                <select
                    value={categoriaSeleccionada}
                    onChange={(e) => setCategoriaSeleccionada(e.target.value)}
                >
                    <option value="Todas">Todas las categorías</option>
                    <option value="Tubérculos">Tubérculos</option>
                    <option value="Granos">Granos</option>
                    <option value="Frutas">Frutas</option>
                </select>
            </div>

            {/* Alerta informativa al interactuar con una tarjeta */}
            {mensajeOferta && (
                <div className="alerta-oferta-react">{mensajeOferta}</div>
            )}

            {/* Listado dinámico de tarjetas usando .map() y prop key */}
            <div className="grid-cultivos-react">
                {cultivosFiltrados.map((cultivo) => {
                    const valorTotalLote = cultivo.cantidad * cultivo.precioUnitario;
                    return (
                        <article key={cultivo.id} className="tarjeta-cultivo-react">
                            <span className="etiqueta-cat">{cultivo.categoria}</span>
                            <h3>{cultivo.nombre}</h3>
                            <p>
                                <strong>Disponible:</strong> {cultivo.cantidad} {cultivo.unidad}(s)
                            </p>
                            <p>
                                <strong>Precio por unidad:</strong> {formatearCOP(cultivo.precioUnitario)} / {cultivo.unidad}
                            </p>
                            <p>
                                <strong>Valor total del lote:</strong> {formatearCOP(valorTotalLote)}
                            </p>
                            <p>
                                <strong>Productor:</strong> {cultivo.agricultor} ({cultivo.ciudad})
                            </p>
                            <button
                                type="button"
                                onClick={() => handleOfertar(cultivo)}
                            >
                                Hacer oferta
                            </button>
                        </article>
                    );
                })}
            </div>
        </section>
    );
}

export default CatalogoAgroXpress;
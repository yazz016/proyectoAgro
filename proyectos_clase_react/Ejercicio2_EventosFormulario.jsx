import React, { useState } from 'react';

/**
 * Componente Funcional: FormularioEventosReact
 * Descripción: Ejercicio de clase para practicar formularios controlados,
 * eventos sintéticos (onChange, onSubmit) y validación básica de campos.
 */
function FormularioEventosReact() {
    // Estados controlados para los campos del formulario
    const [producto, setProducto] = useState('');
    const [cantidad, setCantidad] = useState('');
    const [error, setError] = useState('');
    const [registros, setRegistros] = useState([]);

    // Evento onSubmit con prevención de recarga de página
    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        // Validación de campos vacíos y números positivos
        if (!producto.trim()) {
            setError('Debes escribir el nombre del producto.');
            return;
        }
        if (Number(cantidad) <= 0 || Number.isNaN(Number(cantidad))) {
            setError('La cantidad debe ser un número mayor a cero.');
            return;
        }

        // Guardar nuevo registro en el estado
        const nuevoItem = {
            id: Date.now(),
            producto: producto.trim(),
            cantidad: Number(cantidad)
        };

        setRegistros([...registros, nuevoItem]);
        setProducto('');
        setCantidad('');
    };

    return (
        <div className="card-clase-react">
            <h3>Ejercicio 2: Eventos y Validación en React</h3>
            <form onSubmit={handleSubmit}>
                <label>
                    Nombre del producto:
                    <input
                        type="text"
                        value={producto}
                        onChange={(e) => setProducto(e.target.value)}
                        placeholder="Ej: Tomate chonto"
                    />
                </label>

                <label>
                    Cantidad disponible (kg):
                    <input
                        type="number"
                        value={cantidad}
                        onChange={(e) => setCantidad(e.target.value)}
                        placeholder="Ej: 25"
                    />
                </label>

                {error && <p className="error-react">{error}</p>}

                <button type="submit">Guardar en lista</button>
            </form>

            {/* Lista de registros agregados */}
            <ul>
                {registros.map((item) => (
                    <li key={item.id}>
                        {item.producto} — {item.cantidad} kg
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default FormularioEventosReact;
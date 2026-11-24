import React from 'react';

/**
 * Componente de Clase: SaludoAgricultor
 * Descripción: Ejercicio de clase sobre Class Components en React.
 * Demuestra herencia de React.Component, constructor, state, setState y props.
 */
class SaludoAgricultor extends React.Component {
    constructor(props) {
        super(props);
        // Estado interno inicial del componente de clase
        this.state = {
            cultivosActivos: 3,
            estadoFinca: 'Producción activa'
        };
    }

    // Método para incrementar el contador usando this.setState
    agregarCultivo = () => {
        this.setState((estadoAnterior) => ({
            cultivosActivos: estadoAnterior.cultivosActivos + 1
        }));
    };

    // Método obligatorio render() que retorna estructura JSX
    render() {
        const nombreUsuario = this.props.nombre || 'Carlos Mendoza';

        return (
            <div className="card-clase-react">
                <h3>Ejercicio 1: Componente de Clase</h3>
                <p>Bienvenido, <strong>{nombreUsuario}</strong></p>
                <p>Estado actual: {this.state.estadoFinca}</p>
                <p>Cultivos publicados: <strong>{this.state.cultivosActivos}</strong></p>
                <button type="button" onClick={this.agregarCultivo}>
                    + Registrar nuevo cultivo
                </button>
            </div>
        );
    }
}

export default SaludoAgricultor;
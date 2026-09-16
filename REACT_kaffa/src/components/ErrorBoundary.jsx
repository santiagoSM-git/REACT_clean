import { Component } from 'react';

/**
 * ErrorBoundary de React.
 *
 * Captura errores de renderizado no controlados en cualquier componente
 * hijo y muestra una pantalla de error amigable en lugar de dejar la
 * aplicación en blanco. Los errores se registran en consola para depuración.
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  // Actualiza el estado para renderizar la UI de respaldo tras un error.
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  // Punto de registro del error (aquí se podría enviar a un servicio externo).
  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Error no controlado:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Poppins, sans-serif',
          padding: '2rem',
          textAlign: 'center',
        }}>
          <h1>Algo salió mal</h1>
          <p>Ocurrió un error inesperado. Intenta recargar la página.</p>
          <button
            className="btn"
            onClick={() => window.location.reload()}
            style={{ marginTop: '1rem' }}
          >
            Recargar
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

/**
 * KAFFA - Error normalizado de la API.
 * Mantiene el mismo contrato que consumían los componentes:
 * status, errors (validación 422) y code (reglas de negocio).
 */
export class ApiError extends Error {
  constructor(status, message, errors = null, code = null) {
    super(message || `Error ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
    this.code = code;
  }
}

export default ApiError;

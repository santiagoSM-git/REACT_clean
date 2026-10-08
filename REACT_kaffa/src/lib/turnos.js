/**
 * KAFFA - Turnos del negocio (espejo de App\Services\TurnoService).
 * Fuente única en el frontend para etiquetas y horarios. Si se agrega o
 * cambia un turno en el backend, actualizar también aquí.
 */
export const TURNOS = [
  { valor: 'mañana', etiqueta: 'Mañana', horario: '07:00 - 13:00' },
  { valor: 'tarde', etiqueta: 'Tarde', horario: '13:00 - 18:00' },
  { valor: 'abierto', etiqueta: 'Abierto', horario: '05:00 - 22:00' },
];

/** Etiqueta larga (selector/administración). */
export const TURNOS_LABEL = {
  mañana: 'Mañana (07:00 - 13:00)',
  tarde: 'Tarde (13:00 - 18:00)',
  abierto: 'Abierto (05:00 - 22:00)',
};

export function turnoLabel(tipo) {
  return TURNOS_LABEL[tipo] || tipo || '—';
}

/** Etiqueta corta (tablas/badges). */
export function turnoCorto(tipo) {
  const t = TURNOS.find((x) => x.valor === tipo);
  return t ? t.etiqueta : tipo || '—';
}

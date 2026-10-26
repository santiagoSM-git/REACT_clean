/**
 * KAFFA - Mapa central de hojas de estilo legacy.
 *
 * Cada constante describe un grupo de CSS de public/css/ que se carga en
 * caliente mientras las rutas que lo necesitan están montadas. Mantener aquí
 * los nombres evita literales dispersos y facilita migrar features a
 * CSS Modules de forma incremental.
 */

export const PUBLIC = ['style.css'];

export const DASHBOARD_BASE = ['dashboard-base.css'];
export const DASHBOARD_ADMIN = [...DASHBOARD_BASE, 'dashboard-admin.css'];
export const DASHBOARD_BARISTA = [...DASHBOARD_BASE, 'dashboard.css'];

export const CLIENTE_HOME = ['cliente-home.css'];
export const PROMOCIONES = ['promociones.css'];

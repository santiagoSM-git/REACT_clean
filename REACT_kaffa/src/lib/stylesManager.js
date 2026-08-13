/**
 * KAFFA - Gestor de hojas de estilo dinámicas
 *
 * Replica el comportamiento original donde cada página HTML cargaba SOLO sus
 * propios CSS. Como los estilos de dashboards y del sitio público comparten
 * selectores (body, .sidebar, .product-card, ...), cada ruta inyecta/remueve
 * sus hojas desde public/css/ evitando conflictos globales.
 *
 * - CSS públicos:  ['style.css']
 * - Auth:          ['auth.css']
 * - Dashboards:    ['dashboard-base.css', 'dashboard-admin.css' | 'cliente.css' | 'dashboard.css']
 *
 * Se usa un contador de referencia por hoja para soportar montaje/desmontaje
 * de múltiples componentes (StrictMode) y rutas anidadas sin cortar estilos.
 */

const BASE_PATH = '/css/';

const loading = new Map(); // href -> Promise<link>
const refCount = new Map(); // href -> número de componentes activos

function createLink(href) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = BASE_PATH + href;
  document.head.appendChild(link);

  const promise = new Promise((resolve) => {
    link.onload = () => resolve(link);
    link.onerror = () => resolve(link); // no bloquear si un CSS falta
  });

  return { link, promise };
}

/** Inyecta una hoja de estilo y devuelve el elemento <link> cargado */
export function loadStylesheet(href) {
  refCount.set(href, (refCount.get(href) || 0) + 1);

  if (loading.has(href)) return loading.get(href);

  const { link, promise } = createLink(href);
  loading.set(href, promise);

  promise.finally(() => {
    loading.delete(href);
  });

  return promise;
}

/** Remueve una hoja de estilo cuando ya nadie la usa */
export function unloadStylesheet(href) {
  const count = refCount.get(href) || 0;
  if (count <= 1) {
    refCount.delete(href);
    loading.delete(href); // permite recargar creando un <link> nuevo (StrictMode)
    document.querySelectorAll(`link[href="${BASE_PATH + href}"]`).forEach((link) => link.remove());
  } else {
    refCount.set(href, count - 1);
  }
}

/** Inyecta un grupo de hojas, respetando el orden */
export function loadStylesheets(list) {
  const promises = list.map((href) => loadStylesheet(href));
  return Promise.all(promises);
}

/** Remueve un grupo de hojas */
export function unloadStylesheets(list) {
  list.forEach((href) => unloadStylesheet(href));
}

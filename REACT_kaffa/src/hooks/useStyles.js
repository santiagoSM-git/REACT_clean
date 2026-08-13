/**
 * KAFFA - Hook useStyles
 * Carga dinámicamente las hojas de estilo indicadas mientras el componente
 * está montado y las libera al desmontar (compatible con StrictMode).
 *
 * Uso:
 *   useStyles(['style.css']);
 *   useStyles(['dashboard-base.css', 'dashboard.css']);
 */
import { useEffect } from 'react';
import { loadStylesheets, unloadStylesheets } from '../lib/stylesManager';

export function useStyles(stylesheets) {
  useEffect(() => {
    const list = [...(stylesheets || [])];
    if (list.length === 0) return undefined;

    loadStylesheets(list);

    return () => {
      unloadStylesheets(list);
    };
  }, [JSON.stringify(stylesheets || [])]);
}

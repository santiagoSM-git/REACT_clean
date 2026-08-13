/**
 * KAFFA - Hook useBodyClass
 * Aplica clases al <body> mientras el componente está montado.
 * Útil para estilos que dependen de clases en body (home-page, eventos-page, login-page).
 */
import { useEffect } from 'react';

export function useBodyClass(classNames) {
  useEffect(() => {
    const list = Array.isArray(classNames) ? classNames : [classNames];
    const previous = document.body.className;
    document.body.classList.add(...list);

    return () => {
      document.body.className = previous;
    };
  }, [JSON.stringify(Array.isArray(classNames) ? classNames : [classNames])]);
}

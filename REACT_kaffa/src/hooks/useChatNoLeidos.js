/**
 * KAFFA - Mensajes sin leer del chat (para badge en navbar)
 * Solo consulta mientras hay sesión de cliente activa.
 */
import { useEffect, useState } from 'react';
import { Api } from '../lib/api';

export function useChatNoLeidos(activo) {
  const [noLeidos, setNoLeidos] = useState(0);

  useEffect(() => {
    if (!activo) {
      setNoLeidos(0);
      return undefined;
    }
    let vivo = true;
    const cargar = async () => {
      try {
        const resp = await Api.get('/mensajes');
        const n = (resp.contactos || []).reduce((s, c) => s + (c.no_leidos || 0), 0);
        if (vivo) setNoLeidos(n);
      } catch {
        /* sin sesión o sin backend */
      }
    };
    cargar();
    const interval = setInterval(cargar, 10000);
    return () => {
      vivo = false;
      clearInterval(interval);
    };
  }, [activo]);

  return noLeidos;
}

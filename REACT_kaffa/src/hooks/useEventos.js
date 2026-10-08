/**
 * KAFFA - Eventos públicos de la landing (sección "Eventos").
 * Consulta GET /eventos, que devuelve sólo los eventos publicados por la
 * administradora, ordenados por fecha ascendente.
 */
import { useCallback, useEffect, useState } from 'react';
import { Api } from '../lib/api';

export function useEventos() {
  const [estado, setEstado] = useState({
    eventos: [],
    cargando: true,
    error: null,
  });
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let vivo = true;
    setEstado((e) => ({ ...e, cargando: true, error: null }));

    Api.get('/eventos', { per_page: 100 })
      .then((resp) => {
        if (!vivo) return;
        setEstado({
          eventos: Api.unwrapList(resp).items,
          cargando: false,
          error: null,
        });
      })
      .catch((err) => {
        if (!vivo) return;
        setEstado({
          eventos: [],
          cargando: false,
          error: Api.firstError(err) || 'No se pudieron cargar los eventos.',
        });
      });

    return () => {
      vivo = false;
    };
  }, [intento]);

  const reintentar = useCallback(() => setIntento((i) => i + 1), []);

  return { ...estado, reintentar };
}

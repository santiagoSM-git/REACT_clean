/**
 * KAFFA - Equipo para la landing ("Sobre Nosotros → Nuestro Equipo")
 * Consulta el endpoint público GET /equipo con la combinación fecha + tipo
 * de turno. La administradora es fija (no depende de fecha/turno); las
 * cards de baristas se recargan al cambiar la selección.
 */
import { useCallback, useEffect, useState } from 'react';
import { Api } from '../lib/api';

export function useEquipo(fecha, tipo) {
  const [estado, setEstado] = useState({
    administradora: null,
    baristas: [],
    cargando: true,
    error: null,
  });
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let vivo = true;
    setEstado((e) => ({ ...e, cargando: true, error: null }));

    Api.get('/equipo', { fecha, tipo })
      .then((resp) => {
        if (!vivo) return;
        setEstado({
          administradora: resp?.administradora || null,
          baristas: Array.isArray(resp?.baristas) ? resp.baristas : [],
          cargando: false,
          error: null,
        });
      })
      .catch((err) => {
        if (!vivo) return;
        setEstado((e) => ({
          ...e,
          baristas: [],
          cargando: false,
          error: Api.firstError(err) || 'No se pudo cargar el equipo.',
        }));
      });

    return () => {
      vivo = false;
    };
  }, [fecha, tipo, intento]);

  const reintentar = useCallback(() => setIntento((i) => i + 1), []);

  return { ...estado, reintentar };
}

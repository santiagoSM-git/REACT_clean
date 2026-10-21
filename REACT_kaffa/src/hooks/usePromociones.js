import { useCallback, useEffect, useState } from 'react';
import { PromocionesStore } from '../lib/promociones-store';

export function usePromociones({ soloVigentes = false } = {}) {
  const leer = useCallback(
    () => (soloVigentes ? PromocionesStore.vigentes() : PromocionesStore.listar()),
    [soloVigentes],
  );

  const [promociones, setPromociones] = useState(leer);

  const recargar = useCallback(() => setPromociones(leer()), [leer]);

  useEffect(() => {
    recargar();

    const onChange = () => recargar();
    window.addEventListener(PromocionesStore.CHANGE_EVENT, onChange);
    window.addEventListener('storage', onChange);

    return () => {
      window.removeEventListener(PromocionesStore.CHANGE_EVENT, onChange);
      window.removeEventListener('storage', onChange);
    };
  }, [recargar]);

  return { promociones, recargar };
}

/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Api } from '../../lib/api';

/**
 * Turno del barista según el backend (GET /turno-activo).
 * Los turnos los asigna el administrador (tabla turnos + barista_turno);
 * el barista sólo consulta su estado y el tiempo restante.
 */
const BaristaContext = createContext(null);

export function BaristaProvider({ children }) {
  const [turno, setTurno] = useState(null); // { turno_activo, turno_info }

  const refrescarTurno = useCallback(async () => {
    try {
      const resp = await Api.get('/turno-activo');
      setTurno(resp);
    } catch (err) {
      setTurno({ turno_activo: false, turno_info: null, error: Api.firstError(err) });
    }
  }, []);

  useEffect(() => {
    refrescarTurno();
    const interval = setInterval(refrescarTurno, 60000);
    return () => clearInterval(interval);
  }, [refrescarTurno]);

  return (
    <BaristaContext.Provider value={{ turno, refrescarTurno }}>
      {children}
    </BaristaContext.Provider>
  );
}

export function useBarista() {
  return useContext(BaristaContext);
}

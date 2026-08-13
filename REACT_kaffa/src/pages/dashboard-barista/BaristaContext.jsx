import { createContext, useCallback, useContext, useState } from 'react';

const BaristaContext = createContext(null);

function leerTurno() {
  return JSON.parse(localStorage.getItem('kaffaTurno')) || null;
}

export function BaristaProvider({ children }) {
  const [turno, setTurnoState] = useState(() => leerTurno());

  const setTurno = useCallback((t) => {
    localStorage.setItem('kaffaTurno', JSON.stringify(t));
    setTurnoState(t);
  }, []);

  const iniciarTurno = useCallback(
    (tipo) => {
      setTurno({ tipo, inicio: new Date().toISOString(), activo: true, pedidosEntregados: [] });
    },
    [setTurno],
  );

  const cerrarTurno = useCallback(() => {
    const t = leerTurno();
    if (t) {
      t.activo = false;
      t.fin = new Date().toISOString();
      const historial = JSON.parse(localStorage.getItem('kaffaHistorialTurnos')) || [];
      historial.push(t);
      localStorage.setItem('kaffaHistorialTurnos', JSON.stringify(historial));
    }
    localStorage.removeItem('kaffaTurno');
    setTurnoState(null);
  }, []);

  return (
    <BaristaContext.Provider value={{ turno, setTurno, iniciarTurno, cerrarTurno }}>
      {children}
    </BaristaContext.Provider>
  );
}

export function useBarista() {
  return useContext(BaristaContext);
}

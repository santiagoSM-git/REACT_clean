/* eslint-disable react-refresh/only-export-components */
/**
 * KAFFA — favoritos del usuario.
 *
 * Se guardan en localStorage (por navegador, sin login). El estado vive en un
 * contexto para que navbar, tarjetas y sección del Home compartan la misma
 * lista sin pasar props por todos los niveles.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Storage } from '../lib/storage';

const FavoritosContext = createContext({
  favoritos: [],
  contador: 0,
  esFavorito: () => false,
  toggleFavorito: () => {},
  podarFavoritos: () => {},
});

export function useFavoritos() {
  return useContext(FavoritosContext);
}

export function FavoritosProvider({ children }) {
  const [favoritos, setFavoritos] = useState(() => {
    const guardados = Storage.get(Storage.KEYS.FAVORITOS, []);
    return Array.isArray(guardados)
      ? guardados.map(Number).filter((id) => Number.isFinite(id))
      : [];
  });

  // Persistir cada cambio.
  useEffect(() => {
    Storage.set(Storage.KEYS.FAVORITOS, favoritos);
  }, [favoritos]);

  const esFavorito = useCallback(
    (id) => favoritos.includes(Number(id)),
    [favoritos],
  );

  const toggleFavorito = useCallback((id) => {
    const numero = Number(id);
    if (!Number.isFinite(numero)) return;
    setFavoritos((prev) => (
      prev.includes(numero)
        ? prev.filter((favorito) => favorito !== numero)
        : [...prev, numero]
    ));
  }, []);

  /**
   * Elimina IDs que ya no existen en el catálogo (producto borrado o inactivo).
   * Solo se llama cuando la API respondió correctamente, nunca en un error
   * de red, para no borrar los favoritos del usuario.
   */
  const podarFavoritos = useCallback((idsValidos) => {
    const validos = new Set(
      (idsValidos || []).map(Number).filter((id) => Number.isFinite(id)),
    );
    setFavoritos((prev) => {
      const siguiente = prev.filter((id) => validos.has(Number(id)));
      return siguiente.length === prev.length ? prev : siguiente;
    });
  }, []);

  const valor = useMemo(() => ({
    favoritos,
    contador: favoritos.length,
    esFavorito,
    toggleFavorito,
    podarFavoritos,
  }), [favoritos, esFavorito, toggleFavorito, podarFavoritos]);

  return (
    <FavoritosContext.Provider value={valor}>
      {children}
    </FavoritosContext.Provider>
  );
}

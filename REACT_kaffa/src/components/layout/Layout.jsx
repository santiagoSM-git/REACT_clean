import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../navbar/Navbar';
import Footer from '../footer/Footer';
import ClienteWidgets from '../cliente/ClienteWidgets';
import { CarritoProvider } from '../../context/CarritoContext';
import { FavoritosProvider } from '../../context/FavoritosContext';
import { Auth } from '../../lib/auth';
import { useStyles } from '../../hooks/useStyles';
import { PUBLIC } from '../../lib/styleManifest';

function Layout() {
  // CSS público compartido por todas las páginas del Layout
  useStyles(PUBLIC);

  // Con sesión de cliente se montan los widgets de compra (carrito/pago/perfil)
  const [esCliente, setEsCliente] = useState(() => Auth.isLoggedIn() && Auth.isCliente());

  useEffect(() => {
    const refresh = () => setEsCliente(Auth.isLoggedIn() && Auth.isCliente());
    refresh();
    window.addEventListener('kaffa-auth-change', refresh);
    return () => window.removeEventListener('kaffa-auth-change', refresh);
  }, []);

  return (
    <FavoritosProvider>
      <CarritoProvider>
        <Navbar />
        <main>
          <Outlet />
        </main>
        <Footer />
        {esCliente && <ClienteWidgets />}
      </CarritoProvider>
    </FavoritosProvider>
  );
}

export default Layout;

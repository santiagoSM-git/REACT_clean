import { Outlet } from 'react-router-dom';
import Navbar from '../navbar/Navbar';
import Footer from '../footer/Footer';
import { useStyles } from '../../hooks/useStyles';

function Layout() {
  // CSS público compartido por todas las páginas del Layout
  useStyles(['style.css']);

  return (
    <>
      <Navbar />
      <main>
        <Outlet />
      </main>
      <Footer />
    </>
  );
}

export default Layout;

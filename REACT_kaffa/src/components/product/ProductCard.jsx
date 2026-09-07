import { Link } from 'react-router-dom';
import { formatCurrency } from '../../lib/utils';
import { Auth } from '../../lib/auth';
import { useCarrito } from '../../context/CarritoContext';

function ProductCard({ producto }) {
  const carrito = useCarrito();
  const descripcion = producto.descripcion || 'Deliciosa selección de KAFFA.';
  const resumen =
    descripcion.length > 70 ? `${descripcion.substring(0, 70)}...` : descripcion;

  // Producto real de la API con sesión activa: se compra desde el propio sitio.
  // Con sesión pero catálogo demo (sin backend/datos): NUNCA se manda a /login,
  // se avisa al usuario (esto evitaba el bucle de login).
  // Sin sesión: pide iniciar sesión, como siempre.
  const logged = Auth.isLoggedIn();
  const comprable = producto.real && logged && carrito;

  const avisoDemo = () =>
    alert(
      '☕ Todavía no hay productos registrados en el catálogo de la cafetería.\n\nTu sesión está activa: puedes escribirle al barista por el Chat o pedir en mostrador.'
    );

  return (
    <div className="product-card">
      <img
        className="product-card-image"
        src={producto.imagen}
        alt={producto.nombre}
        loading="lazy"
      />
      <div className="product-card-body">
        <h3>{producto.nombre}</h3>
        <p>{resumen}</p>
        <div className="product-price">{formatCurrency(producto.precio)}</div>
        {comprable ? (
          <button type="button" className="btn-primary" style={{ font: 'inherit' }} onClick={() => carrito.abrirDetalle(producto.raw)}>
            Comprar
          </button>
        ) : logged ? (
          <button type="button" className="btn-primary" style={{ font: 'inherit' }} onClick={avisoDemo}>
            Comprar
          </button>
        ) : (
          <Link to="/login" className="btn-primary">
            Comprar
          </Link>
        )}
      </div>
    </div>
  );
}

export default ProductCard;

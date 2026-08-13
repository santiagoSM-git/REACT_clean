import { Link } from 'react-router-dom';
import { formatCurrency } from '../../lib/utils';

function ProductCard({ producto }) {
  const descripcion = producto.descripcion || 'Deliciosa selección de KAFFA.';
  const resumen =
    descripcion.length > 70 ? `${descripcion.substring(0, 70)}...` : descripcion;

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
        <Link to="/login" className="btn-primary">
          Comprar
        </Link>
      </div>
    </div>
  );
}

export default ProductCard;

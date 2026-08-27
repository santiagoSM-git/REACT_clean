import { useEffect, useState } from 'react';
import { Api } from '../../lib/api';
import { EmptyRow, fechaStr, money } from './helpers';

export default function FacturasView() {
  const [facturas, setFacturas] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    Api.get('/factura-ventas', { per_page: 100 })
      .then((resp) => setFacturas(Api.unwrapList(resp).items))
      .catch((err) => alert('❌ ' + Api.firstError(err)))
      .finally(() => setCargando(false));
  }, []);

  return (
    <div className="page show">
      <div className="box">
        <div className="box-top">
          <h3><i className="fa-solid fa-file-invoice"></i> Facturas de Venta</h3>
        </div>
        <div className="tbl-wrap" style={{ marginTop: '16px' }}>
          <table>
            <thead><tr><th>N° Factura</th><th>Pedido</th><th>Subtotal</th><th>Impuestos</th><th>Total</th><th>Emisión</th></tr></thead>
            <tbody>
              {cargando ? (
                <EmptyRow cols={6} text="Cargando…" />
              ) : facturas.length === 0 ? (
                <EmptyRow cols={6} text="Sin facturas" />
              ) : (
                facturas.map((f) => (
                  <tr key={f.id}>
                    <td><b>{f.numero_factura}</b></td>
                    <td>#{f.pedido_id}</td>
                    <td>{money(f.subtotal)}</td>
                    <td>{money(f.impuestos)}</td>
                    <td>{money(f.total)}</td>
                    <td>{fechaStr(f.fecha_emision)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

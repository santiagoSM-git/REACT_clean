import { useState } from 'react';
import { useStyles } from '../../hooks/useStyles';
import { PROMOCIONES } from '../../lib/styleManifest';
import { usePromociones } from '../../hooks/usePromociones';
import { PromocionesStore } from '../../lib/promociones-store';
import CloudinaryImage from '../../components/media/CloudinaryImage';
import { EmptyRow, fechaStr } from './helpers';
import PromoModalForm from './PromoModalForm';

function estadoPromocion(promo) {
  if (!promo.activa) return <span className="badge badge-danger">Inactiva</span>;
  if (PromocionesStore.estaVencida(promo)) return <span className="badge badge-warning">Vencida</span>;
  return <span className="badge badge-success">Activa</span>;
}

export default function PromocionesView() {
  useStyles(PROMOCIONES);

  const { promociones } = usePromociones();
  const [modal, setModal] = useState(null);

  const guardar = (data) => {
    if (modal?.promo?.id) {
      PromocionesStore.actualizar(modal.promo.id, data);
    } else {
      PromocionesStore.crear(data);
    }
    setModal(null);
  };

  const borrar = (promo) => {
    if (!window.confirm(`¿Eliminar la promoción «${promo.nombre}»?`)) return;
    PromocionesStore.eliminar(promo.id);
  };

  const alternarActiva = (promo) => {
    PromocionesStore.cambiarActiva(promo.id, !promo.activa);
  };

  const vigentes = promociones.filter(
    (promo) => promo.activa && !PromocionesStore.estaVencida(promo),
  ).length;

  return (
    <div className="page show promo-admin">
      <div className="box">
        <div className="box-top promo-admin-top">
          <div>
            <h3>
              <i className="fa-solid fa-bullhorn"></i> Promociones
            </h3>
            <p className="promo-admin-subtitle">
              Crea banners emergentes para los clientes. Actualmente hay {promociones.length} promoción
              {promociones.length === 1 ? '' : 'es'} registrada{promociones.length === 1 ? '' : 's'} y{' '}
              {vigentes} vigente{vigentes === 1 ? '' : 's'}.
            </p>
          </div>
          <button type="button" className="btn-primary" onClick={() => setModal({ promo: null })}>
            <i className="fa-solid fa-plus"></i> Nueva Promoción
          </button>
        </div>

        <div className="tbl-wrap promo-table-wrap">
          <table className="promo-table">
            <thead>
              <tr>
                <th>Promoción</th>
                <th>Tipo</th>
                <th>Vencimiento</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {promociones.length === 0 ? (
                <EmptyRow cols={5} text="Aún no hay promociones. Crea la primera para mostrarla en el sitio." />
              ) : (
                promociones.map((promo) => {
                  const tipo = PromocionesStore.obtenerTipo(promo.tipo);
                  return (
                    <tr key={promo.id}>
                      <td>
                        <div className="promo-table-name">
                          <span className="promo-thumb">
                            <CloudinaryImage
                              src={promo.imagen}
                              alt={promo.nombre}
                              w={96}
                              h={96}
                              fallback={
                                <span className="promo-thumb-placeholder" aria-hidden="true">
                                  <i className={`fa-solid ${tipo.icono}`}></i>
                                </span>
                              }
                            />
                          </span>
                          <span>
                            <strong>{promo.nombre}</strong>
                            <small>{promo.mensaje}</small>
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="promo-tipo-chip">
                          <i className={`fa-solid ${tipo.icono}`}></i> {tipo.label}
                        </span>
                      </td>
                      <td className="promo-table-date">
                        {promo.fecha_vencimiento ? (
                          fechaStr(promo.fecha_vencimiento)
                        ) : (
                          <span className="text-muted">Sin vencimiento</span>
                        )}
                      </td>
                      <td>{estadoPromocion(promo)}</td>
                      <td>
                        <button
                          type="button"
                          className={`btn-icon ${promo.activa ? 'view' : ''}`}
                          onClick={() => alternarActiva(promo)}
                          title={promo.activa ? 'Desactivar' : 'Activar'}
                        >
                          <i className={`fa-solid ${promo.activa ? 'fa-toggle-on' : 'fa-toggle-off'}`}></i>
                        </button>{' '}
                        <button
                          type="button"
                          className="btn-icon edit"
                          onClick={() => setModal({ promo })}
                          title="Editar"
                        >
                          <i className="fa-solid fa-pen-to-square"></i>
                        </button>{' '}
                        <button
                          type="button"
                          className="btn-icon delete"
                          onClick={() => borrar(promo)}
                          title="Eliminar"
                        >
                          <i className="fa-solid fa-trash-can"></i>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <PromoModalForm
          promo={modal.promo}
          onClose={() => setModal(null)}
          onSave={guardar}
        />
      )}
    </div>
  );
}

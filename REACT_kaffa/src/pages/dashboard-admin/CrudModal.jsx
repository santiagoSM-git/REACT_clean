/**
 * KAFFA Admin - Modal CRUD genérico
 */
export default function CrudModal({ title, onClose, onSave, saving = false, saveLabel = 'Guardar', children, width = 520 }) {
  return (
    <div className="modal-overlay open">
      <div className="modal-content" style={{ maxWidth: width }}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        <h2>{title}</h2>
        {children}
        <div className="form-actions">
          <button className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={onSave} disabled={saving}>
            <i className="fa-solid fa-floppy-disk"></i> {saving ? 'Guardando…' : saveLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

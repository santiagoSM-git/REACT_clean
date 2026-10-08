import { useEffect, useRef, useState } from 'react';
import { Api } from '../../lib/api';
import { Auth } from '../../lib/auth';

// Sugerencias rápidas que se muestran cuando la conversación está vacía.
const SUGERENCIAS = [
  '¿Cómo van las ventas de esta semana?',
  'Predice las ventas de los próximos 7 días',
  '¿Qué promoción me recomiendas lanzar?',
  '¿Qué insumos debo reponer?',
];

/**
 * Convierte el texto (posible Markdown) del asistente a HTML seguro:
 * primero escapa el contenido y luego aplica negritas y viñetas básicas.
 */
function formatMensaje(texto) {
  return String(texto || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/^\s*#{1,6}\s*(.+)$/gm, '<strong>$1</strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^\s*[-*]\s+(.*)$/gm, '• $1')
    .replace(/\n/g, '<br/>');
}

export default function AsistenteView() {
  const [mensajes, setMensajes] = useState([]);
  const [input, setInput] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [cargando, setCargando] = useState(true);
  const listaRef = useRef(null);
  const user = Auth.getCurrentUser();

  const cargarHistorial = async () => {
    try {
      const resp = await Api.get('/asistente/mensajes', { per_page: 100 });
      // El backend devuelve lo más reciente primero; se invierte para mostrar
      // la conversación en orden cronológico.
      setMensajes(Api.unwrapList(resp).items.slice().reverse());
    } catch {
      /* sin historial disponible */
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarHistorial();
  }, []);

  useEffect(() => {
    if (listaRef.current) listaRef.current.scrollTop = listaRef.current.scrollHeight;
  }, [mensajes, enviando]);

  const enviar = async (texto) => {
    const contenido = (texto ?? input).trim();
    if (!contenido || enviando) return;

    setInput('');
    setEnviando(true);
    // Optimista: se muestra la pregunta de inmediato.
    setMensajes((prev) => [
      ...prev,
      { id: 'tmp-u-' + Date.now(), rol: 'user', contenido, created_at: new Date().toISOString() },
    ]);

    try {
      const resp = await Api.post('/asistente/chat', { mensaje: contenido });
      setMensajes((prev) => [
        ...prev,
        {
          id: resp.mensaje_id || 'tmp-a-' + Date.now(),
          rol: 'assistant',
          contenido: resp.respuesta,
          created_at: resp.created_at || new Date().toISOString(),
        },
      ]);
    } catch (err) {
      setMensajes((prev) => [
        ...prev,
        {
          id: 'err-' + Date.now(),
          rol: 'assistant',
          error: true,
          contenido: '⚠️ ' + Api.firstError(err),
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setEnviando(false);
    }
  };

  const limpiar = async () => {
    if (!mensajes.length) return;
    if (!window.confirm('¿Borrar toda la conversación con el asistente?')) return;
    try {
      await Api.delete('/asistente/mensajes');
      setMensajes([]);
    } catch (err) {
      alert('❌ ' + Api.firstError(err));
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      enviar();
    }
  };

  const hora = (fecha) =>
    fecha ? new Date(fecha).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : '';

  return (
    <div className="content-section active" id="asistente-ia">
      <div className="ia-head">
        <div>
          <h2 className="section-title">
            <i className="fa-solid fa-robot"></i> Asistente IA de Ventas
          </h2>
          <p className="ia-subtitle">
            Predicciones de ventas y sugerencias de marketing a partir de los datos reales del negocio.
          </p>
        </div>
        <button className="btn-secondary ia-clear" onClick={limpiar} disabled={!mensajes.length}>
          <i className="fa-solid fa-broom"></i> Limpiar
        </button>
      </div>

      <div className="ia-chat">
        <div className="ia-chat-header">
          <div className="ia-avatar"><i className="fa-solid fa-robot"></i></div>
          <div className="ia-chat-header-info">
            <div className="ia-name">Asistente KAFFA</div>
            <div className="ia-status"><span className="ia-dot"></span> En línea</div>
          </div>
        </div>

        <div className="ia-messages" ref={listaRef}>
          {cargando ? (
            <p className="text-muted" style={{ textAlign: 'center', padding: '20px' }}>Cargando conversación…</p>
          ) : mensajes.length === 0 ? (
            <div className="ia-empty">
              <i className="fa-solid fa-mug-hot"></i>
              <p>
                Hola{user?.nombre ? `, ${String(user.nombre).split(' ')[0]}` : ''} 👋. Soy tu asistente de ventas.
                Pregúntame lo que necesites o elige una sugerencia.
              </p>
              <div className="ia-suggestions">
                {SUGERENCIAS.map((s) => (
                  <button key={s} className="ia-chip" onClick={() => enviar(s)}>{s}</button>
                ))}
              </div>
            </div>
          ) : (
            mensajes.map((m) => (
              <div className={`ia-msg ${m.rol === 'user' ? 'sent' : 'received'}${m.error ? ' error' : ''}`} key={m.id}>
                {m.rol !== 'user' && (
                  <div className="ia-msg-avatar"><i className="fa-solid fa-robot"></i></div>
                )}
                <div className="ia-bubble">
                  <div className="ia-bubble-text" dangerouslySetInnerHTML={{ __html: formatMensaje(m.contenido) }} />
                  <div className="ia-bubble-meta">{hora(m.created_at)}</div>
                </div>
              </div>
            ))
          )}

          {enviando && (
            <div className="ia-msg received">
              <div className="ia-msg-avatar"><i className="fa-solid fa-robot"></i></div>
              <div className="ia-bubble ia-typing"><span></span><span></span><span></span></div>
            </div>
          )}
        </div>

        <div className="ia-input-area">
          <textarea
            rows={1}
            placeholder="Escribe tu pregunta… (Enter para enviar)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={enviando}
          />
          <button
            className="ia-send"
            onClick={() => enviar()}
            disabled={enviando || !input.trim()}
            title="Enviar"
          >
            <i className="fa-solid fa-paper-plane"></i>
          </button>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import { Auth } from '../../lib/auth';
import { Api } from '../../lib/api';

export default function ChatView() {
  const [contactos, setContactos] = useState([]);
  const [chatAbierto, setChatAbierto] = useState(null); // { id, nombre }
  const [chatThread, setChatThread] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const chatMessagesRef = useRef(null);

  const cargarBandeja = async () => {
    try {
      const resp = await Api.get('/mensajes');
      const lista = (resp.contactos || []).map((c) => ({
        id: c.contacto?.id,
        nombre: c.contacto?.nombre || c.contacto?.correo || 'Cliente',
        ultimo_mensaje: c.ultimo_mensaje,
        ultima_hora: c.ultima_hora,
        no_leidos: c.no_leidos || 0,
      }));
      setContactos(lista);
    } catch {
      /* se reintenta */
    }
  };

  const cargarThread = async (userId) => {
    try {
      const resp = await Api.get('/mensajes', { con: userId });
      const mensajes = Api.unwrapList(resp.mensajes).items.slice().reverse();
      setChatThread(mensajes);
      try {
        await Api.post('/mensajes/leer', { con: userId });
      } catch {
        /* noop */
      }
      cargarBandeja();
    } catch {
      /* noop */
    }
  };

  useEffect(() => {
    cargarBandeja();
    const interval = setInterval(() => {
      cargarBandeja();
      if (chatAbierto) cargarThread(chatAbierto.id);
    }, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatAbierto?.id]);

  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [chatThread]);

  const openChat = async (c) => {
    setChatAbierto(c);
    await cargarThread(c.id);
  };

  const sendMessage = async () => {
    if (!chatInput.trim()) return;
    if (!chatAbierto) return alert('Selecciona una conversación.');
    try {
      await Api.post('/mensajes', { destinatario_id: chatAbierto.id, mensaje: chatInput.trim() });
      setChatInput('');
      cargarThread(chatAbierto.id);
    } catch (err) {
      alert('❌ ' + Api.firstError(err));
    }
  };

  const noLeidos = contactos.reduce((s, c) => s + c.no_leidos, 0);
  const yo = Auth.getCurrentUser();

  return (
    <div className="content-section active" id="chat">
      <h2 className="section-title">
        <i className="fa-solid fa-comments"></i> Chat con Clientes{' '}
        {noLeidos > 0 && <span className="chat-unread-badge" style={{ display: 'inline-block', marginLeft: '8px' }}>{noLeidos}</span>}
      </h2>
      <div className="chat-inbox">
        <div className="chat-inbox-list">
          {contactos.length === 0 ? (
            <p className="text-muted" style={{ padding: '20px', textAlign: 'center' }}>Sin conversaciones aún.</p>
          ) : (
            contactos
              .slice()
              .sort((a, b) => new Date(b.ultima_hora || 0) - new Date(a.ultima_hora || 0))
              .map((c) => (
                <div className={`chat-inbox-item${chatAbierto?.id === c.id ? ' active' : ''}`} key={c.id} onClick={() => openChat(c)}>
                  <div className="chat-inbox-avatar">{(c.nombre || '?').charAt(0).toUpperCase()}</div>
                  <div className="chat-inbox-info">
                    <div className="chat-inbox-name">
                      {c.nombre} {c.no_leidos > 0 && <span className="chat-unread-badge">{c.no_leidos}</span>}
                    </div>
                    <div className="chat-inbox-preview">{String(c.ultimo_mensaje || '').substring(0, 40)}</div>
                  </div>
                </div>
              ))
          )}
        </div>
        <div className="chat-thread">
          {!chatAbierto ? (
            <div className="chat-thread-empty">
              <i className="fa-solid fa-comments" style={{ fontSize: '3rem', color: 'var(--text-muted)', opacity: 0.4 }}></i>
              <p className="text-muted">Selecciona una conversación para comenzar.</p>
            </div>
          ) : (
            <>
              <div className="chat-thread-header">
                <span className="chat-thread-name"><i className="fa-solid fa-user"></i> {chatAbierto.nombre}</span>
              </div>
              <div className="chat-messages" ref={chatMessagesRef}>
                {chatThread.length === 0 ? (
                  <p className="text-muted" style={{ textAlign: 'center', padding: '20px' }}>Sin mensajes.</p>
                ) : (
                  chatThread.map((m) => (
                    <div className={`message ${m.remitente_id == yo?.id ? 'sent' : 'received'}`} key={m.id}>
                      {m.mensaje}
                      <div className="meta">{new Date(m.created_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                  ))
                )}
              </div>
              <div className="chat-input-area">
                <input
                  type="text"
                  placeholder="Escribe un mensaje..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                />
                <button className="btn-send" onClick={sendMessage}>
                  <i className="fa-solid fa-paper-plane"></i>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * KAFFA - Chat Barista (página pública dentro del Layout)
 * Sección "chat" trasladada del antiguo DashboardCliente, con su polling.
 */
import { useEffect, useRef, useState } from 'react';
import { useStyles } from '../hooks/useStyles';
import { Api } from '../lib/api';
import { Auth } from '../lib/auth';

function ChatBarista() {
  useStyles(['cliente-home.css']);
  const user = Auth.getCurrentUser();
  const [messages, setMessages] = useState([]);
  const [chatContacto, setChatContacto] = useState(null);
  const [chatInput, setChatInput] = useState('');
  const chatMessagesRef = useRef(null);

  useEffect(() => {
    const cargarContacto = async () => {
      try {
        const resp = await Api.get('/mensajes/contactos');
        if (Array.isArray(resp) && resp.length) setChatContacto(resp[0]);
      } catch {
        /* noop */
      }
    };
    cargarContacto();
  }, []);

  useEffect(() => {
    const cargarChat = async () => {
      if (!chatContacto) return;
      try {
        const resp = await Api.get('/mensajes', { con: chatContacto.id });
        setMessages(Api.unwrapList(resp.mensajes).items.slice().reverse());
        await Api.post('/mensajes/leer', { con: chatContacto.id });
      } catch {
        /* noop */
      }
    };
    cargarChat();
    const interval = setInterval(cargarChat, 5000);
    return () => clearInterval(interval);
  }, [chatContacto]);

  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!chatInput.trim()) return;
    if (!chatContacto) return alert('No hay personal disponible en este momento.');
    try {
      await Api.post('/mensajes', { destinatario_id: chatContacto.id, mensaje: chatInput.trim() });
      setChatInput('');
      const resp = await Api.get('/mensajes', { con: chatContacto.id });
      setMessages(Api.unwrapList(resp.mensajes).items.slice().reverse());
    } catch (err) {
      alert('❌ ' + Api.firstError(err));
    }
  };

  return (
    <section className="featured cliente-home" style={{ paddingTop: '120px', minHeight: '70vh' }}>
      <div className="section-header">
        <span className="section-tag">Atención en línea</span>
        <h2>Chat Barista</h2>
        <p>Consultá al barista sobre tu pedido o el menú.</p>
      </div>

      <div style={{ maxWidth: '760px', margin: '0 auto', width: '100%' }}>
        <div className="chat-layout">
          <div className="chat-header">
            <img src="https://ui-avatars.com/api/?name=Barista&background=293f2c&color=fff" alt="Soporte" />
            <div>
              <div style={{ fontWeight: '600' }}>{chatContacto?.nombre || 'Soporte Kaffa'}</div>
              <small style={{ opacity: 0.8 }}>En línea</small>
            </div>
          </div>
          <div className="chat-messages" ref={chatMessagesRef}>
            {messages.length === 0 && (
              <div className="msg msg-barista"><i className="fa-solid fa-hand-wave"></i> ¡Hola! ¿En qué te puedo ayudar hoy?</div>
            )}
            {messages.map((m) => (
              <div className={`msg ${m.remitente_id == user?.id ? 'msg-user' : 'msg-barista'}`} key={m.id}>
                {m.mensaje}
                <div className="meta">{new Date(m.created_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
            ))}
          </div>
          <div className="chat-input">
            <input
              type="text"
              placeholder="Escribe..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            />
            <button className="chat-send-btn" onClick={sendMessage}><i className="fa-solid fa-paper-plane"></i></button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ChatBarista;

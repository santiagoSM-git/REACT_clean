import { useEffect, useRef, useState } from 'react';
import { Storage } from '../../lib/storage';
import { showToast } from '../../lib/utils';
import { avatarLetra, escapeHtml } from './helpers';

function ordenarChats(lista) {
  return lista.slice().sort((a, b) => {
    const ta = a.messages.length ? a.messages[a.messages.length - 1].ts : 0;
    const tb = b.messages.length ? b.messages[b.messages.length - 1].ts : 0;
    return tb - ta;
  });
}

export default function ChatView() {
  const [chats, setChats] = useState(() => ordenarChats(Storage.getChats()));
  const [chatAbierto, setChatAbierto] = useState(null);
  const [chatThread, setChatThread] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const unreadPrev = useRef(0);
  const chatMessagesRef = useRef(null);

  useEffect(() => {
    unreadPrev.current = Storage.totalChatsNoLeidos('barista');
    const interval = setInterval(() => {
      const total = Storage.totalChatsNoLeidos('barista');
      if (total > unreadPrev.current && total > 0) {
        const conves = Storage.getChats()
          .filter((c) => c.unreadBarista > 0)
          .sort((a, b) => (b.unreadBarista || 0) - (a.unreadBarista || 0));
        const origen = conves.length ? conves[0].cliente : 'Cliente';
        showToast(`💬 ${origen} te escribió un mensaje`, 'info');
      }
      unreadPrev.current = total;
      if (chatAbierto) {
        const conv = Storage.getChat(chatAbierto);
        if (conv && conv.unreadBarista > 0) {
          Storage.marcarChatLeido(chatAbierto, 'barista');
          setChatThread((conv && conv.messages) || []);
        }
      }
      setChats(ordenarChats(Storage.getChats()));
    }, 3000);
    return () => clearInterval(interval);
  }, [chatAbierto]);

  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [chatThread]);

  const openChat = (username) => {
    setChatAbierto(username);
    Storage.marcarChatLeido(username, 'barista');
    const conv = Storage.getChat(username);
    setChatThread((conv && conv.messages) || []);
    setChats(ordenarChats(Storage.getChats()));
  };

  const sendMessage = () => {
    if (!chatInput.trim()) return;
    if (!chatAbierto) {
      alert('Selecciona una conversación.');
      return;
    }
    Storage.sendMessage(chatAbierto, 'barista', chatInput.trim());
    setChatInput('');
    const conv = Storage.getChat(chatAbierto);
    setChatThread((conv && conv.messages) || []);
    setChats(ordenarChats(Storage.getChats()));
  };

  return (
    <div className="content-section active" id="chat">
      <h2 className="section-title">
        <i className="fa-solid fa-comments"></i> Chat con Clientes
      </h2>
      <div className="chat-inbox">
        <div className="chat-inbox-list" id="chatInbox">
          {chats.length === 0 ? (
            <p className="text-muted" style={{ padding: '20px', textAlign: 'center' }}>
              Sin conversaciones aún.
            </p>
          ) : (
            chats.map((c) => {
              const last = c.messages[c.messages.length - 1];
              const unread = c.unreadBarista || 0;
              const activa = chatAbierto === c.username ? 'active' : '';
              const badge = unread > 0 ? <span className="chat-unread-badge">{unread}</span> : null;
              const preview = last
                ? `${last.from === 'barista' ? 'Tú: ' : ''}${String(last.text).substring(0, 40)}`
                : '';
              return (
                <div className={`chat-inbox-item ${activa}`} key={c.username} onClick={() => openChat(c.username)}>
                  <div className="chat-inbox-avatar">{avatarLetra(c.cliente)}</div>
                  <div className="chat-inbox-info">
                    <div className="chat-inbox-name">
                      {c.cliente} {badge}
                    </div>
                    <div className="chat-inbox-preview">{preview}</div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        <div className="chat-thread" id="chatThread">
          {!chatAbierto ? (
            <div className="chat-thread-empty">
              <i className="fa-solid fa-comments" style={{ fontSize: '3rem', color: 'var(--text-muted)', opacity: 0.4 }}></i>
              <p className="text-muted">Selecciona una conversación para comenzar.</p>
            </div>
          ) : (
            <>
              <div className="chat-thread-header">
                <span className="chat-thread-name">
                  <i className="fa-solid fa-user"></i> {chatAbierto}
                </span>
              </div>
              <div className="chat-messages" id="chatMessages" ref={chatMessagesRef}>
                {chatThread.length === 0 ? (
                  <p className="text-muted" style={{ textAlign: 'center', padding: '20px' }}>
                    Sin mensajes.
                  </p>
                ) : (
                  chatThread.map((m, i) => (
                    <div className={`message ${m.from === 'barista' ? 'sent' : 'received'}`} key={i}>
                      {escapeHtml(m.text)}
                      <div className="meta">
                        {new Date(m.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
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

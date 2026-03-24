import { useState, useRef, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { api, ApiChat, ApiMessage } from '@/api/client';

interface RealChatWindowProps {
  chat: ApiChat | null;
  userId: number;
  onMessageSent: () => void;
}

const TYPE_LABEL: Record<string, string> = {
  chat: 'личный чат',
  group: 'группа',
  channel: 'канал',
  bot: 'бот',
};

const TYPE_AVATAR: Record<string, string> = {
  chat: '💬',
  group: '👥',
  channel: '📡',
  bot: '🤖',
};

export default function RealChatWindow({ chat, userId, onMessageSent }: RealChatWindowProps) {
  const [messages, setMessages] = useState<ApiMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chat) return;
    setMessages([]);
    setLoading(true);
    api.getMessages(chat.id).then(data => {
      setMessages(data.messages);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [chat?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    if (!input.trim() || !chat || sending) return;
    const text = input.trim();
    setInput('');
    setSending(true);
    try {
      const data = await api.sendMessage(chat.id, text);
      setMessages(prev => [...prev, data.message]);
      onMessageSent();
    } catch {
      setInput(text);
    } finally {
      setSending(false);
    }
  };

  if (!chat) {
    return (
      <div className="chat-empty">
        <div className="empty-icon">
          <Icon name="MessageCircle" size={48} />
        </div>
        <p className="empty-title">Выберите чат</p>
        <p className="empty-sub">Начните общение или найдите пользователя через кнопку 👤+</p>
      </div>
    );
  }

  return (
    <div className="chat-window">
      <div className="chat-header">
        <div className="chat-header-info">
          <div className={`avatar avatar--${chat.type} avatar--sm`}>
            {TYPE_AVATAR[chat.type]}
          </div>
          <div>
            <div className="chat-header-name">{chat.name}</div>
            <div className="chat-header-sub">{TYPE_LABEL[chat.type]}</div>
          </div>
        </div>
        <div className="chat-header-actions">
          <button className="icon-btn"><Icon name="Search" size={18} /></button>
          <button className="icon-btn"><Icon name="Phone" size={18} /></button>
          <button className="icon-btn"><Icon name="MoreVertical" size={18} /></button>
        </div>
      </div>

      <div className="messages-area">
        {loading && (
          <div className="messages-loading">
            <Icon name="Loader" size={24} className="auth-spinner" />
          </div>
        )}

        {!loading && messages.length === 0 && (
          <div className="messages-empty">
            <p>Начните общение — напишите первое сообщение!</p>
          </div>
        )}

        {messages.map((msg, i) => {
          const showDate = i === 0;
          return (
            <div key={msg.id}>
              {showDate && (
                <div className="date-divider">
                  <span>Сегодня</span>
                </div>
              )}
              <div className={`msg-row ${msg.is_own ? 'msg-row--own' : ''}`}>
                {!msg.is_own && (
                  <div className={`avatar avatar--${chat.type} avatar--xs`}>
                    {TYPE_AVATAR[chat.type]}
                  </div>
                )}
                <div className={`bubble ${msg.is_own ? 'bubble--own' : 'bubble--other'}`}>
                  {!msg.is_own && (
                    <div className="bubble-sender">{msg.sender_name}</div>
                  )}
                  <p>{msg.text}</p>
                  <div className="bubble-meta">
                    <span className="bubble-time">{msg.time}</span>
                    {msg.is_own && (
                      <span className="bubble-status">
                        {msg.is_read ? (
                          <Icon name="CheckCheck" size={12} className="status-read" />
                        ) : (
                          <Icon name="Check" size={12} />
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="input-area">
        <button className="icon-btn"><Icon name="Paperclip" size={18} /></button>
        <div className="input-wrap">
          <input
            className="msg-input"
            placeholder="Написать сообщение..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
          />
          <button className="icon-btn emoji-btn"><Icon name="Smile" size={18} /></button>
        </div>
        <button
          className={`send-btn ${input.trim() ? 'send-btn--active' : ''}`}
          onClick={send}
          disabled={sending}
        >
          {sending ? <Icon name="Loader" size={18} className="auth-spinner" /> : <Icon name="Send" size={18} />}
        </button>
      </div>
    </div>
  );
}
